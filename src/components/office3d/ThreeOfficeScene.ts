import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Agent, AgentStatus, IdleActivity, AgentLocation } from '../../types/office';

export interface SceneCallbacks {
  onSelectAgent: (agentId: string) => void;
  onHoverAgent: (agentId: string | null) => void;
  onUserRotate?: () => void;
}

interface AnimatedCharacter {
  agentId: string;
  department: 'orchestra' | 'developer' | 'writer';
  charGroup: THREE.Group;
  headGroup: THREE.Group;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  blushLeft: THREE.Mesh;
  blushRight: THREE.Mesh;
  antennaOrb: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  handMug: THREE.Group;
  handPhone: THREE.Mesh;
  conductorBaton: THREE.Group;
  thoughtBubble: THREE.Group;
  chatBubble: THREE.Group;
  alertIcon: THREE.Mesh;
  sleepZzz: THREE.Group;
  screenMat: THREE.MeshBasicMaterial;

  // Spatial navigation & destination tracking
  deskWorldPos: THREE.Vector3;
  deskRotY: number;
  currentWorldPos: THREE.Vector3;
  targetWorldPos: THREE.Vector3;
  targetRotY: number;
  isSeated: boolean;

  currentStatus: AgentStatus;
  idleActivity: IdleActivity;
  locationState: AgentLocation;
  walkTimer: number;

  // Pacing (mondar-mandir) patrol
  pacingDir: number;
  pacingPauseTimer: number;

  // Eye blinking
  blinkTimer: number;
}

interface AnimatedProp {
  mesh: THREE.Object3D;
  update: (time: number, delta: number) => void;
}

export class ThreeOfficeScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationFrameId: number | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private callbacks: SceneCallbacks;

  private characters: Map<string, AnimatedCharacter> = new Map();
  private interactiveMeshes: THREE.Mesh[] = [];
  private meshToAgentMap: Map<THREE.Mesh, string> = new Map();
  private animatedProps: AnimatedProp[] = [];

  // Smooth camera interpolation
  private isTransitioningCamera = false;
  private targetCameraPos = new THREE.Vector3(15, 14, 15);
  private targetLookAt = new THREE.Vector3(0, 1.2, 0);
  private cameraLerpFactor = 0.06;

  private hoveredAgentId: string | null = null;
  private lastRaycastTime = 0;
  private clock = new THREE.Clock();

  // Shared Office Materials (Clean modern studio palette)
  private sharedDeskGeo = new THREE.BoxGeometry(2.8, 0.12, 1.5);
  private sharedDeskMat = new THREE.MeshStandardMaterial({
    color: 0x1e222b,
    roughness: 0.5,
    metalness: 0.15,
  });
  private sharedLegGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.35, 8);
  private sharedLegMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.8,
    roughness: 0.25,
  });
  private sharedChairMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
  });

  // OPT-05: Shared geometry & material pools for chibi bot characters.
  // Instead of creating ~105 geometries + ~56 materials (7 bots × 15 geos × 8 mats),
  // we share pools → dramatically fewer GPU objects.
  // OPT-06: Polygon counts reduced on all geometries (still looks great at viewing distance).
  private sharedBotGeos = {
    head: new THREE.SphereGeometry(0.38, 16, 12),
    visor: new THREE.SphereGeometry(0.4, 50, 10, Math.PI / 8, Math.PI * 0.75, Math.PI / 4, Math.PI / 2),
    eye: new THREE.CircleGeometry(0.065, 12, 0, Math.PI),
    blush: new THREE.CircleGeometry(0.042, 12),
    torso: new THREE.CylinderGeometry(0.20, 0.30, 0.44, 12),
    belly: new THREE.SphereGeometry(0.30, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    arm: new THREE.CylinderGeometry(0.055, 0.05, 0.28, 6),
    hand: new THREE.SphereGeometry(0.065, 8, 8),
    leg: new THREE.CylinderGeometry(0.06, 0.06, 0.20, 6),
    foot: new THREE.SphereGeometry(0.085, 10, 8),
    hitbox: new THREE.BoxGeometry(1.2, 1.8, 1.2),
    badge: new THREE.BoxGeometry(0.14, 0.08, 0.02),
    earCup: new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8),
    earRing: new THREE.TorusGeometry(0.088, 0.012, 6, 10),
    earCap: new THREE.SphereGeometry(0.08, 8, 6),
    antennaStalk: new THREE.CylinderGeometry(0.016, 0.016, 0.22, 6),
    antennaOrb: new THREE.SphereGeometry(0.05, 8, 8),
    thought: new THREE.SphereGeometry(0.14, 6, 6),
    chatBubble: new THREE.BoxGeometry(0.42, 0.26, 0.04),
    chatTail: new THREE.ConeGeometry(0.06, 0.12, 4),
    alert: new THREE.OctahedronGeometry(0.2),
    sleepZ1: new THREE.SphereGeometry(0.07, 6, 6),
    sleepZ2: new THREE.SphereGeometry(0.1, 6, 6),
    mugCup: new THREE.CylinderGeometry(0.07, 0.06, 0.14, 8),
    mugSteam: new THREE.SphereGeometry(0.04, 6, 6),
    phone: new THREE.BoxGeometry(0.08, 0.15, 0.02),
    batonStick: new THREE.CylinderGeometry(0.012, 0.008, 0.42, 6),
    batonStar: new THREE.OctahedronGeometry(0.045),
  };

  private sharedBotMats = {
    body: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18, metalness: 0.06 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x090a10, roughness: 0.08, metalness: 0.85 }),
    eye: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    blush: new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.85 }),
    silver: new THREE.MeshStandardMaterial({ color: 0xc4c7cf, metalness: 0.8, roughness: 0.2 }),
    black: new THREE.MeshBasicMaterial({ color: 0x09090b }),
    white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    whiteMug: new THREE.MeshStandardMaterial({ color: 0xffffff }),
    steamWhite: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }),
    hitboxInvisible: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }),
    grayZ: new THREE.MeshBasicMaterial({ color: 0xa1a1aa }),
  };

  // Dynamic social chat slot counter
  private chattingSlotIndex = 0;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene setup - Bright & Luminous Modern Architectural Studio
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1c202a');
    this.scene.fog = new THREE.FogExp2('#1c202a', 0.008);

    // 2. Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(44, aspect, 0.1, 120);
    this.camera.position.set(15, 14, 15);

    // 3. Renderer setup - Optimized for smooth 60fps & low GPU/CPU usage
    this.renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 2, // Non-retina gets antialias; high-DPI skips for 40% fillrate savings
      powerPreference: 'high-performance',
      precision: 'mediump', // Optimizes shader calculations
      depth: true,
      stencil: false, // Saves memory buffer
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    // Cap pixelRatio to 1.25 on high-DPI screens to prevent GPU thermal throttling
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // Much faster than PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 4. Controls setup - Free 360-degree rotation unlocked
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    // Allow wide polar angle so camera can look up and down freely without disappearing under floor
    this.controls.minPolarAngle = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 55;
    this.controls.target.set(0, 1.2, 0);

    // Cancel any automatic camera interpolation when the user starts interacting/orbiting
    this.controls.addEventListener('start', () => {
      this.isTransitioningCamera = false;
      if (this.callbacks.onUserRotate) {
        this.callbacks.onUserRotate();
      }
    });

    // 5. Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 6. Build environment & enhanced bright lighting
    this.setupLighting();
    this.setupEnvironment();

    // 7. Event listeners
    this.bindEvents();

    // 8. Start animation loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  // ==========================================
  // BRIGHT, CLEAR ARCHITECTURAL STUDIO LIGHTING
  // ==========================================
  private setupLighting() {
    // 1. Bright crisp ambient illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.85);
    this.scene.add(ambientLight);

    // 2. Main Key Sun light streaming in from overhead windows
    const sunLight = new THREE.DirectionalLight(0xfffbf2, 2.2);
    sunLight.position.set(-8, 24, -6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024; // 1024 is 4x lighter on VRAM & fill-rate than 2048
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -18;
    sunLight.shadow.camera.right = 18;
    sunLight.shadow.camera.top = 18;
    sunLight.shadow.camera.bottom = -18;
    this.scene.add(sunLight);

    // 3. Fill light from front/east angle
    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 1.3);
    fillLight.position.set(14, 18, 14);
    this.scene.add(fillLight);

    // 4. Hemisphere sky bounce
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.1);
    this.scene.add(hemiLight);

    // 5. Zone Downlights (Pools of light illuminating specific active zones)
    // Orchestra Pod Downlight
    const orchLight = new THREE.PointLight(0xffffff, 1.6, 14, 1.2);
    orchLight.position.set(0, 5.5, 4.5);
    this.scene.add(orchLight);

    // Developer Pod Downlight
    const devLight = new THREE.PointLight(0xe2e8f0, 1.6, 16, 1.2);
    devLight.position.set(-9.0, 5.5, -1.5);
    this.scene.add(devLight);

    // Writer Pod Downlight
    const writerLight = new THREE.PointLight(0xf8fafc, 1.6, 16, 1.2);
    writerLight.position.set(9.0, 5.5, -1.5);
    this.scene.add(writerLight);

    // Cozy Lounge Spotlight (warm accent)
    const loungeLight = new THREE.PointLight(0xfef08a, 1.4, 12, 1.2);
    loungeLight.position.set(-6.5, 4.5, 8.5);
    this.scene.add(loungeLight);

    // Coffee Bar Light (inviting warm beam)
    const coffeeLight = new THREE.PointLight(0xffedd5, 1.5, 11, 1.2);
    coffeeLight.position.set(-12.5, 4.5, 5.5);
    this.scene.add(coffeeLight);
  }

  // ==========================================
  // VIBRANT LIVING OFFICE ENVIRONMENT
  // Floor, Windows, Plants, Clock, Bookshelves, Coffee Steam, Water Dispenser
  // ==========================================
  private setupEnvironment() {
    // 1. Office Floor - Sleek modern studio slate/concrete (clear, reflective, bright)
    const floorGeo = new THREE.PlaneGeometry(38, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x272b36,
      roughness: 0.42,
      metalness: 0.12,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Crisp modern floor grid lines
    const grid = new THREE.GridHelper(36, 36, 0x64748b, 0x3b4252);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // 2. Perimeter Boundary Walls with Baseboards & Acoustic Wood Slats
    this.createOfficeWalls();

    // 3. Main Operations Command Screen (Ultra-clean, glitch-free digital operations hub)
    this.createWallCommandScreen();

    // 4. Live Animated Wall Clock (Real-time moving hands)
    this.createAnimatedWallClock();

    // 5. 3 Main Workstation Zones
    // A. ORCHESTRA POD • PM & RESEARCHER (Center Front)
    this.createZonePod(
      'ORCHESTRA & RESEARCH POD',
      new THREE.Vector3(0, 0.025, 4.5),
      8.0,
      5.8,
      0xffffff,
      0x272b36,
      true
    );

    // B. DEVELOPER BAY (Left Wing: Frontend & Backend)
    this.createZonePod(
      'ENGINEERING BAY',
      new THREE.Vector3(-9.0, 0.025, -1.5),
      9.2,
      8.8,
      0xe2e8f0,
      0x1e222b
    );

    // C. QUALITY & OPERATIONS STUDIO (Right Wing: QA & Intern)
    this.createZonePod(
      'QUALITY & DOCS STUDIO',
      new THREE.Vector3(9.0, 0.025, -1.5),
      9.2,
      8.8,
      0xd4d4d8,
      0x20242e
    );

    // 7. Dedicated Activity Hangout Areas
    this.createLoungeArea(new THREE.Vector3(-6.5, 0, 8.5));
    this.createCoffeeBar(new THREE.Vector3(-12.5, 0, 5.5));
    this.createChattingArea(new THREE.Vector3(6.5, 0, 8.5));
    this.createWhiteboardArea(new THREE.Vector3(0, 0, -10.5));

    // 8. Lush Greenery (Fiddle-leaf figs, monstera, succulents)
    this.createPlant(new THREE.Vector3(-14.5, 0, -11.5), 'tall');
    this.createPlant(new THREE.Vector3(14.5, 0, -11.5), 'tall');
    this.createPlant(new THREE.Vector3(-14.5, 0, 11), 'bush');
    this.createPlant(new THREE.Vector3(14.5, 0, 11), 'bush');
    this.createPlant(new THREE.Vector3(-3.5, 0, 9.8), 'succulent');
    this.createPlant(new THREE.Vector3(3.5, 0, 9.8), 'succulent');

    // 9. Ceiling Lighting Trusses with Linear Emissive Light Panels
    this.createCeilingTrusses();
  }

  private createOfficeWalls() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x333846,
      roughness: 0.6,
      metalness: 0.1,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.5,
    });

    // North Wall (Back)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(38, 7.5, 0.6), wallMat);
    northWall.position.set(0, 3.75, -14);
    northWall.receiveShadow = true;
    this.scene.add(northWall);

    const northBase = new THREE.Mesh(new THREE.BoxGeometry(38, 0.4, 0.7), trimMat);
    northBase.position.set(0, 0.2, -14);
    this.scene.add(northBase);

    // West Wall (Left)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7.5, 32), wallMat);
    westWall.position.set(-17, 3.75, 0);
    westWall.receiveShadow = true;
    this.scene.add(westWall);

    // East Wall (Right)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7.5, 32), wallMat);
    eastWall.position.set(17, 3.75, 0);
    eastWall.receiveShadow = true;
    this.scene.add(eastWall);
  }

  // Helper to draw clean Kanban cards on the Wall Command Canvas
  private drawCommandCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    title: string,
    meta: string,
    accent: string
  ) {
    ctx.fillStyle = '#161a24';
    ctx.fillRect(x, y, w, 76);
    ctx.strokeStyle = '#272f40';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, 76);

    ctx.fillStyle = accent;
    ctx.fillRect(x, y, 5, 76);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(title, x + 16, y + 30);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px monospace, sans-serif';
    ctx.fillText(meta, x + 16, y + 56);
  }

  // High-Definition AI Workforce Wall Command Screen & Acoustic Slat Wall (Glitch-Free & Razor Sharp)
  private createWallCommandScreen() {
    const wallGroup = new THREE.Group();

    // 1. Acoustic Wood/Charcoal Slats on Left and Right Wings of North Wall
    const slatMat = new THREE.MeshStandardMaterial({
      color: 0x242834,
      roughness: 0.7,
      metalness: 0.1,
    });
    // Left wing slats (x from -16.5 to -8.5)
    for (let x = -16.5; x <= -8.5; x += 0.45) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.8, 0.05), slatMat);
      slat.position.set(x, 3.8, -13.67);
      slat.receiveShadow = true;
      wallGroup.add(slat);
    }
    // Right wing slats (x from 8.5 to 16.5)
    for (let x = 8.5; x <= 16.5; x += 0.45) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.8, 0.05), slatMat);
      slat.position.set(x, 3.8, -13.67);
      slat.receiveShadow = true;
      wallGroup.add(slat);
    }

    // 2. Linear LED Cove Glow Along the Ceiling Wall Top
    const coveGlowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const coveLight = new THREE.Mesh(new THREE.BoxGeometry(32, 0.08, 0.1), coveGlowMat);
    coveLight.position.set(0, 7.1, -13.62);
    wallGroup.add(coveLight);

    // 3. Wall Command Display (The Centerpiece Digital Operations Screen)
    // Solid wall mount bracket
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x090a10, metalness: 0.9, roughness: 0.2 });
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(14.6, 4.4, 0.08), bracketMat);
    bracket.position.set(0, 4.15, -13.65);
    wallGroup.add(bracket);

    // Slim bezel frame
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x181a22, metalness: 0.6, roughness: 0.3 });
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(14.3, 4.1, 0.04), bezelMat);
    bezel.position.set(0, 4.15, -13.60);
    wallGroup.add(bezel);

    // OPT-04: Downscaled canvas texture (1024×320 vs 2048×640 = 75% less VRAM).
    // Static content — no need for high resolution at normal viewing distance.
    const canvas = document.createElement('canvas');
    const S = 0.5; // Scale factor (half resolution)
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(S, S); // Scale context so all drawing code uses original coordinates

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 640);
      bgGrad.addColorStop(0, '#0d111a');
      bgGrad.addColorStop(1, '#080a0f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 2048, 640);

      // Cyber grid background pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 2048; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 640);
        ctx.stroke();
      }
      for (let y = 0; y < 640; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2048, y);
        ctx.stroke();
      }

      // Top Status Bar
      ctx.fillStyle = '#141824';
      ctx.fillRect(0, 0, 2048, 70);

      // Status indicator dot
      ctx.beginPath();
      ctx.arc(45, 35, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      // Main Title
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px monospace, sans-serif';
      ctx.fillText('AI WORKFORCE OPERATIONS HUB • SPRINT 24', 75, 42);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px monospace, sans-serif';
      ctx.fillText('STATUS: OPTIMAL (99.8%)  |  THROUGHPUT: 114 T/S  |  7 AI AGENTS ACTIVE', 1220, 42);

      // 4 Scrum Kanban Columns
      const cols = [
        { title: 'BACKLOG', color: '#64748b', count: '4' },
        { title: 'IN PROGRESS', color: '#38bdf8', count: '3' },
        { title: 'IN REVIEW / QA', color: '#fbbf24', count: '2' },
        { title: 'COMPLETED', color: '#10b981', count: '18' },
      ];

      const colW = 475;
      const startX = 35;
      const colTop = 95;

      cols.forEach((col, i) => {
        const cX = startX + i * (colW + 20);

        // Column Header Box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(cX, colTop, colW, 44);

        // Left accent stripe
        ctx.fillStyle = col.color;
        ctx.fillRect(cX, colTop, 6, 44);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 16px monospace, sans-serif';
        ctx.fillText(col.title, cX + 20, colTop + 28);

        ctx.fillStyle = '#64748b';
        ctx.font = '14px monospace, sans-serif';
        ctx.fillText(`[${col.count}]`, cX + colW - 55, colTop + 28);

        // Cards inside column
        if (i === 0) {
          this.drawCommandCard(ctx, cX, colTop + 58, colW, 'Auth0 & WebAuthn Dual-Token Spec', 'Aria (Writer)', '#94a3b8');
          this.drawCommandCard(ctx, cX, colTop + 148, colW, 'Cloud Run v2 Multi-Region Ingress', 'Felix (DevOps)', '#94a3b8');
          this.drawCommandCard(ctx, cX, colTop + 238, colW, 'Redis Clustered Key Expiry Hook', 'Dr. Marcus (Arch)', '#94a3b8');
        } else if (i === 1) {
          this.drawCommandCard(ctx, cX, colTop + 58, colW, 'RS256 Asymmetric Key Rotation', 'Devin (Developer)', '#38bdf8');
          this.drawCommandCard(ctx, cX, colTop + 148, colW, 'Mermaid Architecture OKR Alignment', 'Sophia (Maestro)', '#38bdf8');
          this.drawCommandCard(ctx, cX, colTop + 238, colW, 'Static AST Vulnerability Linter', 'Eleanor (Reviewer)', '#38bdf8');
        } else if (i === 2) {
          this.drawCommandCard(ctx, cX, colTop + 58, colW, '5,000 Synthetic Fuzzing Bursts', 'T-1000 (QA)', '#fbbf24');
          this.drawCommandCard(ctx, cX, colTop + 148, colW, 'Security Advisory RFC Validation', 'Vigilance (Security)', '#fbbf24');
        } else if (i === 3) {
          this.drawCommandCard(ctx, cX, colTop + 58, colW, '[OK] Zero-Trust Token Propagation', 'Completed (09:42)', '#10b981');
          this.drawCommandCard(ctx, cX, colTop + 148, colW, '[OK] Docker Multi-Stage Optimization', 'Completed (08:15)', '#10b981');
          this.drawCommandCard(ctx, cX, colTop + 238, colW, '[OK] Vitest Synthetic Harness 94.2%', 'Completed (07:30)', '#10b981');
        }
      });

      // Bottom Telemetry Bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 580, 2048, 60);

      ctx.fillStyle = '#64748b';
      ctx.font = '14px monospace, sans-serif';
      ctx.fillText('ORCHESTRA: 1 MAESTRO POD  |  DEVELOPER BAY: 4 ACTIVE  |  WRITER STUDIO: 3 ACTIVE  |  REGION: ASIA-SOUTHEAST1', 45, 615);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText('LIVE TELEMETRY: SYNCHRONIZED', 1740, 615);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false; // Static content, no mipmaps needed

    const screenMat = new THREE.MeshBasicMaterial({ map: texture });
    const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(14.0, 3.85, 0.02), screenMat);
    screenMesh.position.set(0, 4.15, -13.57);
    wallGroup.add(screenMesh);

    // Subtle cyan edge accent border
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    const edgeBar = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.04, 0.03), edgeMat);
    edgeBar.position.set(0, 2.22, -13.56);
    wallGroup.add(edgeBar);

    this.scene.add(wallGroup);
  }

  // Modern Wall Clock with moving hands (Precise distinct depths to prevent any z-fighting)
  private createAnimatedWallClock() {
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 6.6, -13.58);

    // Rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.65, 0.05, 8, 16), // OPT-06: reduced from 12×24
      new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.8 })
    );
    clockGroup.add(rim);

    // Face
    const face = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.04, 16), // OPT-06: reduced from 24
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    face.rotation.x = Math.PI / 2;
    face.position.z = -0.01;
    clockGroup.add(face);

    // Hour ticks
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.1, 0.01),
        new THREE.MeshBasicMaterial({ color: 0x09090b })
      );
      tick.position.set(Math.sin(angle) * 0.52, Math.cos(angle) * 0.52, 0.02);
      tick.rotation.z = -angle;
      clockGroup.add(tick);
    }

    // Hands
    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.01), new THREE.MeshBasicMaterial({ color: 0x09090b }));
    hourHand.position.set(0, 0.12, 0.03);
    const hourPivot = new THREE.Group();
    hourPivot.add(hourHand);
    clockGroup.add(hourPivot);

    const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.42, 0.01), new THREE.MeshBasicMaterial({ color: 0x09090b }));
    minuteHand.position.set(0, 0.18, 0.04);
    const minutePivot = new THREE.Group();
    minutePivot.add(minuteHand);
    clockGroup.add(minutePivot);

    const secondHand = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.48, 0.01), new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
    secondHand.position.set(0, 0.2, 0.05);
    const secondPivot = new THREE.Group();
    secondPivot.add(secondHand);
    clockGroup.add(secondPivot);

    this.scene.add(clockGroup);

    // Register animated clock update
    this.animatedProps.push({
      mesh: clockGroup,
      update: (time) => {
        secondPivot.rotation.z = -time * 1.5;
        minutePivot.rotation.z = -time * 0.1;
        hourPivot.rotation.z = -time * 0.01;
      },
    });
  }

  // Bookshelf with colorful book spines
  private createBookshelf(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x272b36, roughness: 0.6 });
    // Shelf frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 2.6), woodMat);
    frame.position.y = 2.1;
    group.add(frame);

    // Shelves with books
    const bookColors = [0x38bdf8, 0xf43f5e, 0x10b981, 0xfbbf24, 0xa855f7, 0xffffff, 0x64748b];
    [0.9, 1.9, 2.9].forEach((yLevel) => {
      let bX = -1.0;
      for (let i = 0; i < 9; i++) {
        const bW = 0.16 + (i % 3) * 0.04;
        const bH = 0.55 + (i % 4) * 0.08;
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, bH, bW),
          new THREE.MeshStandardMaterial({ color: bookColors[i % bookColors.length] })
        );
        book.position.set(0, yLevel + bH / 2, bX + bW / 2);
        group.add(book);
        bX += bW + 0.03;
      }
    });

    this.scene.add(group);
  }

  private createCeilingTrusses() {
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x1e222b, roughness: 0.4 });
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    [-8, 0, 8].forEach((zPos) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(34, 0.25, 0.35), trussMat);
      beam.position.set(0, 6.8, zPos);
      this.scene.add(beam);

      // Glowing linear LED fixture strip underneath
      const strip = new THREE.Mesh(new THREE.BoxGeometry(30, 0.06, 0.12), ledMat);
      strip.position.set(0, 6.65, zPos);
      this.scene.add(strip);
    });
  }

  private createZonePod(
    title: string,
    pos: THREE.Vector3,
    width: number,
    depth: number,
    accentColor: number,
    baseColor: number,
    isPodium: boolean = false
  ) {
    const pod = new THREE.Group();
    pod.position.copy(pos);

    if (isPodium) {
      // Elevated stage for Orchestra Maestro
      const stage = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.22, depth),
        new THREE.MeshStandardMaterial({ color: 0x222632, roughness: 0.4, metalness: 0.25 })
      );
      stage.position.y = 0.11;
      stage.receiveShadow = true;
      pod.add(stage);

      // Glowing edge rim
      const rim = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.08, 0.05, depth + 0.08),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      rim.position.y = 0.21;
      pod.add(rim);
    } else {
      // Clean modern rug
      const rugMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.7,
      });
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), rugMat);
      rug.rotation.x = -Math.PI / 2;
      rug.receiveShadow = true;
      pod.add(rug);

      // Border line
      const points = [
        new THREE.Vector3(-width / 2, 0.025, -depth / 2),
        new THREE.Vector3(width / 2, 0.025, -depth / 2),
        new THREE.Vector3(width / 2, 0.025, depth / 2),
        new THREE.Vector3(-width / 2, 0.025, depth / 2),
        new THREE.Vector3(-width / 2, 0.025, -depth / 2),
      ];
      const borderGeo = new THREE.BufferGeometry().setFromPoints(points);
      const borderMat = new THREE.LineBasicMaterial({ color: accentColor });
      const border = new THREE.Line(borderGeo, borderMat);
      pod.add(border);
    }

    // Badge plate
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 0.55),
      new THREE.MeshBasicMaterial({ color: 0x09090b })
    );
    badge.rotation.x = -Math.PI / 2;
    badge.position.set(0, isPodium ? 0.24 : 0.035, depth / 2 - 0.4);
    pod.add(badge);

    const badgeBorder = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 0.65),
      new THREE.MeshBasicMaterial({ color: accentColor })
    );
    badgeBorder.rotation.x = -Math.PI / 2;
    badgeBorder.position.set(0, isPodium ? 0.23 : 0.03, depth / 2 - 0.4);
    pod.add(badgeBorder);

    this.scene.add(pod);
  }

  private createLoungeArea(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Modern 3-seater Sofa (Lighter, warmer tone for living look)
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x384152, roughness: 0.85 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.45, 1.25), sofaMat);
    seat.position.y = 0.45;
    seat.castShadow = true;
    group.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.75, 0.35), sofaMat);
    back.position.set(0, 0.85, 0.45);
    back.castShadow = true;
    group.add(back);

    // Armrests
    [-1.7, 1.7].forEach((x) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 1.25), sofaMat);
      arm.position.set(x, 0.65, 0);
      group.add(arm);
    });

    // 2 Cozy Beanbags in soft neutral tones
    const beanbagMat1 = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
    const beanbagMat2 = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95 });
    [[-2.6, beanbagMat1], [2.6, beanbagMat2]].forEach(([xOffset, mat]) => {
      const beanbag = new THREE.Group();
      beanbag.position.set(xOffset as number, 0, 0.3);

      const cushion = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 10, 8), // OPT-06: reduced from 16×12
        mat as THREE.Material
      );
      cushion.scale.set(1.0, 0.6, 1.0);
      cushion.position.y = 0.35;
      cushion.castShadow = true;
      beanbag.add(cushion);

      const dip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.3, 0.1, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      dip.position.y = 0.48;
      beanbag.add(dip);

      group.add(beanbag);
    });

    // Low Coffee Table with Oak Wood Surface
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.85), tableMat);
    tableTop.position.set(0, 0.38, -1.2);
    group.add(tableTop);
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.38, 8), this.sharedLegMat);
    tableLeg.position.set(0, 0.19, -1.2);
    group.add(tableLeg);

    // Coffee mug & magazine on table
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    mug.position.set(0.4, 0.48, -1.2);
    group.add(mug);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.25), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    mag.position.set(-0.5, 0.43, -1.2);
    group.add(mag);

    this.scene.add(group);
  }

  private createCoffeeBar(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Counter Bar
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x1e222b, roughness: 0.5 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 1.1), counterMat);
    counter.position.y = 0.6;
    counter.castShadow = true;
    group.add(counter);

    // Espresso Machine (Silver & Dark Chrome)
    const machine = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.65, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
    );
    machine.position.set(-0.5, 1.52, 0);
    group.add(machine);

    // Glowing espresso machine LED display
    const ledScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    ledScreen.position.set(-0.5, 1.65, 0.28);
    group.add(ledScreen);

    // ANIMATED COFFEE STEAM PUFFS (bobs & rises continuously!)
    const steamPuffs: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
      );
      puff.position.set(-0.4 + (i % 2) * 0.08, 1.9 + i * 0.12, 0.1);
      group.add(puff);
      steamPuffs.push(puff);
    }

    this.animatedProps.push({
      mesh: machine,
      update: (time) => {
        steamPuffs.forEach((puff, idx) => {
          const cycle = (time * 1.5 + idx * 0.6) % 2.0;
          puff.position.y = 1.88 + cycle * 0.35;
          puff.scale.setScalar(0.8 + cycle * 0.8);
          (puff.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - cycle * 0.35);
        });
      },
    });

    // Water Cooler with Translucent Aqua Jug and Animated Bubbles
    const waterBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.8, 10), // OPT-06: reduced from 16
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    waterBase.position.set(0.65, 1.6, 0);
    group.add(waterBase);

    const jug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.7, 10), // OPT-06: reduced from 16
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.75,
        roughness: 0.1,
      })
    );
    jug.position.set(0.65, 2.2, 0);
    group.add(jug);

    // Floating water bubbles inside jug
    const bubble = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
    );
    bubble.position.set(0.65, 2.1, 0.08);
    group.add(bubble);

    this.animatedProps.push({
      mesh: bubble,
      update: (time) => {
        bubble.position.y = 2.0 + Math.sin(time * 3) * 0.12;
      },
    });

    this.scene.add(group);
  }

  private createChattingArea(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // High collaboration round table
    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.08, 12), // OPT-06: reduced from 20
      new THREE.MeshStandardMaterial({ color: 0x1e222b, roughness: 0.3, metalness: 0.2 })
    );
    tableTop.position.y = 1.1;
    group.add(tableTop);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8),
      this.sharedLegMat
    );
    pole.position.y = 0.55;
    group.add(pole);

    const baseDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.03, 20),
      this.sharedLegMat
    );
    baseDisc.position.y = 0.02;
    group.add(baseDisc);

    // Small centerpiece succulent pot
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    pot.position.y = 1.2;
    group.add(pot);
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    plant.position.y = 1.32;
    group.add(plant);

    this.scene.add(group);
  }

  // Mobile Studio Whiteboard Easel on Casters (Clean, Solid 3D Construction - No Z-Fighting)
  private createWhiteboardArea(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
    const boardFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e222b, roughness: 0.4 });
    const dryEraseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15 });

    // 1. Mobile Stand Base with 4 Wheels
    [-2.2, 2.2].forEach((x) => {
      // Base foot bar
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 1.3), metalMat);
      foot.position.set(x, 0.08, 0);
      foot.castShadow = true;
      group.add(foot);

      // Caster wheels
      [-0.55, 0.55].forEach((z) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), chromeMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.04, z);
        group.add(wheel);
      });

      // Upright support poles
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.2, 12), metalMat);
      pole.position.set(x, 1.68, 0);
      pole.castShadow = true;
      group.add(pole);
    });

    // Crossbar stabilizer
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.06, 0.06), metalMat);
    crossbar.position.set(0, 0.55, 0);
    group.add(crossbar);

    // 2. Whiteboard Frame (Solid 3D Box, Depth 0.08)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.7, 2.7, 0.08), boardFrameMat);
    frame.position.set(0, 2.35, 0);
    frame.castShadow = true;
    group.add(frame);

    // 3. Dry-Erase Whiteboard Surface (Cleanly inset with 0.03 front protrusion, zero z-fighting)
    const board = new THREE.Mesh(new THREE.BoxGeometry(4.46, 2.46, 0.02), dryEraseMat);
    board.position.set(0, 2.35, 0.05);
    group.add(board);

    // 4. Pen Tray & Markers
    const tray = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 0.18), metalMat);
    tray.position.set(0, 0.98, 0.11);
    group.add(tray);

    // Dry erase markers (Black, Blue, Red)
    const markerColors = [0x09090b, 0x0284c7, 0xdc2626];
    markerColors.forEach((col, idx) => {
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8),
        new THREE.MeshStandardMaterial({ color: col })
      );
      marker.rotation.z = Math.PI / 2;
      marker.position.set(-0.8 + idx * 0.4, 1.02, 0.12);
      group.add(marker);
    });

    // Whiteboard Eraser Sponge
    const eraser = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.06, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    eraser.position.set(0.8, 1.02, 0.12);
    group.add(eraser);

    // 5. Colorful Agile Sprint Sticky Notes (Safe 0.02 offset in front of board, solid 3D geometry)
    const noteColors = [0xfef08a, 0x38bdf8, 0xf472b6, 0x4ade80, 0xfb923c, 0xc084fc];
    for (let i = 0; i < 6; i++) {
      const note = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.48, 0.01),
        new THREE.MeshBasicMaterial({ color: noteColors[i % noteColors.length] })
      );
      const colIdx = i % 3;
      const rowIdx = Math.floor(i / 3);
      note.position.set(-1.4 + colIdx * 1.4, 2.75 - rowIdx * 0.8, 0.07);
      note.rotation.z = Math.sin(i * 3.7) * 0.08;
      group.add(note);
    }
  }

  private createPlant(pos: THREE.Vector3, type: 'tall' | 'bush' | 'succulent' = 'tall') {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Pure White Ceramic Pot
    const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

    if (type === 'tall') {
      // Tall Fiddle-Leaf Fig Tree
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.45, 1.3, 16), potMat);
      pot.position.y = 0.65;
      pot.castShadow = true;
      group.add(pot);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 2.0, 8),
        new THREE.MeshStandardMaterial({ color: 0x78350f })
      );
      trunk.position.y = 2.2;
      group.add(trunk);

      // Lush leafy crown
      for (let i = 0; i < 5; i++) {
        const leafCluster = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 10), leafMat);
        leafCluster.position.set(Math.sin(i * 1.2) * 0.4, 2.8 + i * 0.35, Math.cos(i * 1.2) * 0.4);
        group.add(leafCluster);
      }
    } else if (type === 'bush') {
      // Potted Monstera / Bush
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.9, 14), potMat);
      pot.position.y = 0.45;
      group.add(pot);

      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 10), leafMat);
      bush.position.y = 1.3;
      group.add(bush);
    } else {
      // Small decorative planter
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.45, 12), potMat);
      pot.position.y = 0.22;
      group.add(pot);

      const succulent = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), leafMat);
      succulent.position.y = 0.5;
      group.add(succulent);
    }

    this.scene.add(group);
  }

  public focusZone(zone: 'all' | 'orchestra' | 'developer' | 'writer') {
    this.isTransitioningCamera = true;
    switch (zone) {
      case 'all':
        this.targetCameraPos.set(15, 14, 15);
        this.targetLookAt.set(0, 1.2, 0);
        break;
      case 'orchestra':
        this.targetCameraPos.set(0, 6.5, 9.5);
        this.targetLookAt.set(0, 1.2, 4.5);
        break;
      case 'developer':
        this.targetCameraPos.set(-9.0, 8.5, 6.0);
        this.targetLookAt.set(-9.0, 1.3, -1.5);
        break;
      case 'writer':
        this.targetCameraPos.set(9.0, 8.5, 6.0);
        this.targetLookAt.set(9.0, 1.3, -1.5);
        break;
    }
  }

  public syncAgents(agents: Agent[]) {
    this.chattingSlotIndex = 0;
    agents.forEach((agent) => {
      let char = this.characters.get(agent.id);
      if (!char) {
        char = this.createWorkstationAndWhiteChibiBot(agent);
        this.characters.set(agent.id, char);
      }
      this.updateAgentVisualAndPosition(agent, char);
    });
  }

  // ==========================================
  // PURE WHITE CHIBI ROBOT AVATAR
  // Gleaming white ceramic body, glowing white eyes, glossy black screen visor, rosy cheeks
  // ==========================================
  private createWorkstationAndWhiteChibiBot(agent: Agent): AnimatedCharacter {
    const isOrchestra = agent.department === 'orchestra';
    const deskStageY = isOrchestra ? 0.4 : 0;

    // 1. Workstation Desk
    const deskGroup = new THREE.Group();
    deskGroup.position.set(agent.deskPosition.x, agent.deskPosition.y + deskStageY, agent.deskPosition.z);
    deskGroup.rotation.y = agent.deskRotationY;

    // Desk Surface
    const deskTop = new THREE.Mesh(this.sharedDeskGeo, this.sharedDeskMat);
    deskTop.position.set(0, 1.35, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Legs
    [
      [-1.25, 0.68, -0.6],
      [1.25, 0.68, -0.6],
      [-1.25, 0.68, 0.6],
      [1.25, 0.68, 0.6],
    ].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(this.sharedLegGeo, this.sharedLegMat);
      leg.position.set(x, y, z);
      deskGroup.add(leg);
    });

    // Monitors: Orchestra has wide curved panoramic screen facing the seated user (-Z in local desk space); others have dual screens
    const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    if (isOrchestra) {
      // Elegant heavy-duty monitor stand directly holding the screen
      const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 20), this.sharedLegMat);
      standBase.position.set(0, 1.425, -0.42);
      deskGroup.add(standBase);

      const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.58, 12), this.sharedLegMat);
      standPole.position.set(0, 1.70, -0.42);
      deskGroup.add(standPole);

      // Articulated mounting bracket on the back of monitor
      const mountBracket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.08), this.sharedLegMat);
      mountBracket.position.set(0, 1.88, -0.42);
      deskGroup.add(mountBracket);

      // Curved Panoramic Monitor
      // Arc radius R = 1.4, center placed at z = 0.98 so the back apex of the curved monitor touches z = -0.42 (0.98 - 1.4 = -0.42)
      // Perfectly anchored directly to the stand pole!
      const monArcRadius = 1.4;
      const monCenterZ = 0.98; // Center of curvature is at the user side (+Z), curving towards the user
      const mon = new THREE.Mesh(
        new THREE.CylinderGeometry(monArcRadius, monArcRadius, 0.72, 28, 1, true, Math.PI - 0.55, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x09090b, side: THREE.DoubleSide })
      );
      mon.position.set(0, 1.95, monCenterZ);
      deskGroup.add(mon);

      const monScreen = new THREE.Mesh(
        new THREE.CylinderGeometry(monArcRadius - 0.015, monArcRadius - 0.015, 0.66, 28, 1, true, Math.PI - 0.52, 1.04),
        screenMat
      );
      monScreen.position.set(0, 1.95, monCenterZ);
      deskGroup.add(monScreen);
    } else {
      const mon1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.05), new THREE.MeshStandardMaterial({ color: 0x09090b }));
      mon1.position.set(-0.4, 1.9, -0.3);
      mon1.rotation.y = 0.1;
      const mon1Screen = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.68), screenMat);
      mon1Screen.position.set(0, 0, 0.03);
      mon1.add(mon1Screen);
      deskGroup.add(mon1);

      const mon2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.75, 0.05), new THREE.MeshStandardMaterial({ color: 0x09090b }));
      mon2.position.set(0.65, 1.9, -0.25);
      mon2.rotation.y = -0.22;
      const mon2Screen = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.68), screenMat);
      mon2Screen.position.set(0, 0, 0.03);
      mon2.add(mon2Screen);
      deskGroup.add(mon2);
    }

    // Modern Ergonomic Office Task Chair (Comfortably spaced, not cramped against desk)
    const chair = new THREE.Group();
    chair.position.set(0, 0, 0.95);

    // 5-Star Caster Base
    for (let c = 0; c < 5; c++) {
      const angle = (c * Math.PI * 2) / 5;
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.03, 0.32),
        this.sharedLegMat
      );
      arm.position.set(Math.sin(angle) * 0.16, 0.05, Math.cos(angle) * 0.16);
      arm.rotation.y = angle;
      chair.add(arm);
    }

    // Hydraulic Gas-lift Piston
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.82, 8), this.sharedLegMat);
    piston.position.y = 0.45;
    chair.add(piston);

    // Ergonomic Seat Cushion (Top at y = 0.92)
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.72), this.sharedChairMat);
    seat.position.y = 0.88;
    chair.add(seat);

    // Ergonomic Lumbar Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.75, 0.06), this.sharedChairMat);
    back.position.set(0, 1.28, 0.34);
    chair.add(back);

    // Left and Right Armrests
    [-0.38, 0.38].forEach((xSide) => {
      const armPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6), this.sharedLegMat);
      armPost.position.set(xSide, 0.98, 0.08);
      chair.add(armPost);

      const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.32), this.sharedChairMat);
      armPad.position.set(xSide, 1.1, 0.08);
      chair.add(armPad);
    });

    deskGroup.add(chair);
    this.scene.add(deskGroup);

    // ==========================================
    // 2. THE PURE WHITE CHIBI ROBOT MODEL
    // CALCULATE PRECISE SEATED WORLD POSITION & ROTATION
    // ==========================================
    // Seated comfortably in the chair (chair is at z = 0.95, robot sits centered on cushion at z = 0.95, y = 0.94)
    const localChairOffset = new THREE.Vector3(0, 0.94, 0.95);
    // Rotate offset by deskRotationY to get accurate world position:
    const worldChairOffset = localChairOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), agent.deskRotationY);
    const deskSeatedPos = new THREE.Vector3(
      agent.deskPosition.x + worldChairOffset.x,
      agent.deskPosition.y + deskStageY + localChairOffset.y,
      agent.deskPosition.z + worldChairOffset.z
    );
    // When seated at the desk, the bot MUST face -Z in local desk space (towards monitors),
    // which in world rotation is agent.deskRotationY + Math.PI!
    const seatedRotY = agent.deskRotationY + Math.PI;

    const bot = new THREE.Group();
    bot.position.copy(deskSeatedPos);
    bot.rotation.y = seatedRotY;

    // OPT-05: Use shared material pools for most parts, but create unique body color per agent
    const botBodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(agent.color),
      roughness: 0.18,
      metalness: 0.06
    });
    const visorMat = this.sharedBotMats.visor;
    const eyeMat = this.sharedBotMats.eye;
    const blushMat = this.sharedBotMats.blush;
    const silverTrimMat = this.sharedBotMats.silver;

    // A. KAWAII ROUNDED WHITE HEAD
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.72;

    // OPT-05/06: Use shared geometry pools (reduced poly from 24×20 → 16×12)
    const helmet = new THREE.Mesh(this.sharedBotGeos.head, botBodyMat);
    helmet.scale.set(1.08, 0.98, 0.94);
    helmet.castShadow = true;
    headGroup.add(helmet);

    // Curved glossy black screen visor on front
    const visor = new THREE.Mesh(this.sharedBotGeos.visor, visorMat);
    visor.position.set(0, 0, 0.003); // Lower position so it doesn't cover eyes, closer to head
    headGroup.add(visor);

    // OPT-05: Shared eye & blush geometry
    const leftEye = new THREE.Mesh(this.sharedBotGeos.eye, eyeMat);
    leftEye.position.set(-0.16, 0.04, 0.4);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(this.sharedBotGeos.eye, eyeMat);
    rightEye.position.set(0.16, 0.04, 0.4);
    headGroup.add(rightEye);

    // KAWAII BLUSHING CHEEKS
    const blushLeft = new THREE.Mesh(this.sharedBotGeos.blush, blushMat);
    blushLeft.position.set(-0.21, -0.05, 0.42);
    blushLeft.renderOrder = 1; // Prevent Z-fighting with blushRight
    headGroup.add(blushLeft);

    const blushRight = new THREE.Mesh(this.sharedBotGeos.blush, blushMat);
    blushRight.position.set(0.21, -0.05, 0.42);
    blushRight.renderOrder = 1; // Prevent Z-fighting with blushLeft
    headGroup.add(blushRight);

    // ROUNDED WHITE HEADPHONES WITH SILVER METALLIC RIMS
    // OPT-05/06: Shared headphone geometry
    [-0.42, 0.42].forEach((xOffset) => {
      const earCup = new THREE.Mesh(this.sharedBotGeos.earCup, botBodyMat);
      earCup.rotation.z = Math.PI / 2;
      earCup.position.set(xOffset, 0.02, 0);
      headGroup.add(earCup);

      const earRing = new THREE.Mesh(this.sharedBotGeos.earRing, silverTrimMat);
      earRing.rotation.y = Math.PI / 2;
      earRing.position.set(xOffset > 0 ? xOffset + 0.025 : xOffset - 0.025, 0.02, 0);
      headGroup.add(earRing);

      const earCap = new THREE.Mesh(this.sharedBotGeos.earCap, silverTrimMat);
      earCap.position.set(xOffset > 0 ? xOffset + 0.03 : xOffset - 0.03, 0.02, 0);
      headGroup.add(earCap);
    });

    // CUTE TOP ANTENNA WITH GLOWING WHITE ORB
    // OPT-05: Shared antenna geometry
    const antennaStalk = new THREE.Mesh(this.sharedBotGeos.antennaStalk, botBodyMat);
    antennaStalk.position.set(0, 0.46, 0);
    headGroup.add(antennaStalk);

    const antennaOrb = new THREE.Mesh(
      this.sharedBotGeos.antennaOrb,
      new THREE.MeshBasicMaterial({ color: isOrchestra ? 0xffffff : 0x38bdf8 })
    );
    antennaOrb.position.set(0, 0.58, 0);
    headGroup.add(antennaOrb);

    bot.add(headGroup);

    // B. CHUBBY PEAR-SHAPED PURE WHITE TORSO
    // OPT-05: Shared torso geometry
    const torso = new THREE.Mesh(this.sharedBotGeos.torso, botBodyMat);
    torso.position.y = 0.26;
    torso.castShadow = true;
    bot.add(torso);

    const belly = new THREE.Mesh(this.sharedBotGeos.belly, botBodyMat);
    belly.position.y = 0.04;
    bot.add(belly);

    // Chest Metallic Badge with role color
    const badgeColor = isOrchestra ? 0xffffff : agent.department === 'developer' ? 0x10b981 : 0xf97316;
    const badgeMesh = new THREE.Mesh(
      this.sharedBotGeos.badge,
      new THREE.MeshBasicMaterial({ color: badgeColor })
    );
    badgeMesh.position.set(0, 0.32, 0.26);
    bot.add(badgeMesh);

    // C. PURE WHITE ARMS & HANDS
    // OPT-05: Shared arm & hand geometry
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.34, 0.38, 0);
    const lArmMesh = new THREE.Mesh(this.sharedBotGeos.arm, botBodyMat);
    lArmMesh.position.set(0, -0.14, 0);
    leftArm.add(lArmMesh);
    const lHand = new THREE.Mesh(this.sharedBotGeos.hand, botBodyMat);
    lHand.position.set(0, -0.28, 0);
    leftArm.add(lHand);
    bot.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.34, 0.38, 0);
    const rArmMesh = new THREE.Mesh(this.sharedBotGeos.arm, botBodyMat);
    rArmMesh.position.set(0, -0.14, 0);
    rightArm.add(rArmMesh);
    const rHand = new THREE.Mesh(this.sharedBotGeos.hand, botBodyMat);
    rHand.position.set(0, -0.28, 0);
    rightArm.add(rHand);

    // OPT-05: Shared prop geometry
    const handMug = new THREE.Group();
    handMug.position.set(0, -0.32, -0.12);
    const mugCup = new THREE.Mesh(this.sharedBotGeos.mugCup, this.sharedBotMats.whiteMug);
    handMug.add(mugCup);
    const mugSteam = new THREE.Mesh(this.sharedBotGeos.mugSteam, this.sharedBotMats.steamWhite);
    mugSteam.position.y = 0.12;
    handMug.add(mugSteam);
    handMug.visible = false;
    rightArm.add(handMug);

    // Prop: Smartphone
    const handPhone = new THREE.Mesh(this.sharedBotGeos.phone, this.sharedBotMats.black);
    handPhone.position.set(0, -0.28, -0.12);
    handPhone.rotation.x = 0.6;
    handPhone.visible = false;
    rightArm.add(handPhone);

    // Prop: Conductor Baton (Orchestra Maestro)
    const conductorBaton = new THREE.Group();
    conductorBaton.position.set(0, -0.28, -0.1);
    conductorBaton.rotation.x = -1.2;
    const batonStick = new THREE.Mesh(this.sharedBotGeos.batonStick, this.sharedBotMats.white);
    batonStick.position.y = 0.2;
    conductorBaton.add(batonStick);
    const batonStar = new THREE.Mesh(this.sharedBotGeos.batonStar, this.sharedBotMats.white);
    batonStar.position.y = 0.42;
    conductorBaton.add(batonStar);
    conductorBaton.visible = isOrchestra;
    rightArm.add(conductorBaton);

    bot.add(rightArm);

    // D. PURE WHITE LEGS & LITTLE BOOTS
    // OPT-05: Shared leg & foot geometry
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.14, 0.06, 0);
    const lLegMesh = new THREE.Mesh(this.sharedBotGeos.leg, botBodyMat);
    lLegMesh.position.y = -0.1;
    leftLeg.add(lLegMesh);
    const lFoot = new THREE.Mesh(this.sharedBotGeos.foot, botBodyMat);
    lFoot.scale.set(0.9, 0.65, 1.4);
    lFoot.position.set(0, -0.19, 0.04);
    leftLeg.add(lFoot);
    bot.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.14, 0.06, 0);
    const rLegMesh = new THREE.Mesh(this.sharedBotGeos.leg, botBodyMat);
    rLegMesh.position.y = -0.1;
    rightLeg.add(rLegMesh);
    const rFoot = new THREE.Mesh(this.sharedBotGeos.foot, botBodyMat);
    rFoot.scale.set(0.9, 0.65, 1.4);
    rFoot.position.set(0, -0.19, 0.04);
    rightLeg.add(rFoot);
    bot.add(rightLeg);

    // E. EMOTION & INTERACTION BUBBLES
    // OPT-05: Shared bubble, alert, sleep, and hitbox geometry
    const thoughtGroup = new THREE.Group();
    thoughtGroup.position.set(0.35, 1.35, 0);
    const thoughtBubble = new THREE.Mesh(this.sharedBotGeos.thought, this.sharedBotMats.white);
    thoughtGroup.add(thoughtBubble);
    thoughtGroup.visible = false;
    bot.add(thoughtGroup);

    const chatGroup = new THREE.Group();
    chatGroup.position.set(0, 1.45, 0);
    const chatBubble = new THREE.Mesh(this.sharedBotGeos.chatBubble, this.sharedBotMats.white);
    chatGroup.add(chatBubble);
    const tail = new THREE.Mesh(this.sharedBotGeos.chatTail, this.sharedBotMats.white);
    tail.rotation.z = Math.PI;
    tail.position.set(0, -0.18, 0);
    chatGroup.add(tail);
    chatGroup.visible = false;
    bot.add(chatGroup);

    const alertMesh = new THREE.Mesh(this.sharedBotGeos.alert, this.sharedBotMats.white);
    alertMesh.position.set(0, 1.4, 0);
    alertMesh.visible = false;
    bot.add(alertMesh);

    const sleepGroup = new THREE.Group();
    sleepGroup.position.set(0.2, 1.3, 0);
    const z1 = new THREE.Mesh(this.sharedBotGeos.sleepZ1, this.sharedBotMats.grayZ);
    const z2 = new THREE.Mesh(this.sharedBotGeos.sleepZ2, this.sharedBotMats.white);
    z2.position.set(0.16, 0.16, 0);
    sleepGroup.add(z1, z2);
    sleepGroup.visible = false;
    bot.add(sleepGroup);

    // Hitbox for clicking
    const hitBox = new THREE.Mesh(this.sharedBotGeos.hitbox, this.sharedBotMats.hitboxInvisible);
    hitBox.position.y = 0.6;
    bot.add(hitBox);
    this.interactiveMeshes.push(hitBox);
    this.meshToAgentMap.set(hitBox, agent.id);

    this.scene.add(bot);

    return {
      agentId: agent.id,
      department: agent.department,
      charGroup: bot,
      headGroup,
      leftEye,
      rightEye,
      blushLeft,
      blushRight,
      antennaOrb,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      handMug,
      handPhone,
      conductorBaton,
      thoughtBubble: thoughtGroup,
      chatBubble: chatGroup,
      alertIcon: alertMesh,
      sleepZzz: sleepGroup,
      screenMat,
      deskWorldPos: deskSeatedPos,
      deskRotY: seatedRotY,
      currentWorldPos: deskSeatedPos.clone(),
      targetWorldPos: deskSeatedPos.clone(),
      targetRotY: seatedRotY,
      isSeated: true,
      currentStatus: agent.status,
      idleActivity: agent.idleActivity || 'standby',
      locationState: agent.locationState || 'at_desk',
      walkTimer: 0,
      pacingDir: 1,
      pacingPauseTimer: 0,
      blinkTimer: Math.random() * 3,
    };
  }

  // ==========================================
  // SPATIAL TARGETING & LEAVING THE DESK
  // ==========================================
  private updateAgentVisualAndPosition(agent: Agent, char: AnimatedCharacter) {
    char.currentStatus = agent.status;
    char.idleActivity = agent.idleActivity || 'standby';
    char.locationState = agent.locationState || 'at_desk';

    const isWorking = agent.status !== 'idle';

    if (isWorking) {
      char.targetWorldPos.copy(char.deskWorldPos);
      char.targetRotY = char.deskRotY;
      char.isSeated = true;
      char.screenMat.color.set(0xffffff);
      char.handMug.visible = false;
      char.handPhone.visible = false;
      char.conductorBaton.visible = char.department === 'orchestra';
    } else {
      char.screenMat.color.set(0x3f3f46);
      char.conductorBaton.visible = false;

      if (char.locationState === 'coffee_bar') {
        char.targetWorldPos.set(-11.5, 0.45, 5.5);
        char.targetRotY = -Math.PI / 2;
        char.isSeated = false;
        char.handMug.visible = true;
        char.handPhone.visible = false;
      } else if (char.locationState === 'lounge') {
        const loungeSpots = [
          new THREE.Vector3(-6.5, 0.68, 8.5), // Sofa center
          new THREE.Vector3(-7.5, 0.68, 8.5), // Sofa left
          new THREE.Vector3(-5.5, 0.68, 8.5), // Sofa right
          new THREE.Vector3(-9.1, 0.42, 8.8), // Beanbag left
          new THREE.Vector3(-3.9, 0.42, 8.8), // Beanbag right
        ];
        const spotIdx = Math.abs(this.hashString(char.agentId)) % loungeSpots.length;
        char.targetWorldPos.copy(loungeSpots[spotIdx]);
        char.targetRotY = Math.PI; // Face forward into the room
        char.isSeated = true;
        char.handPhone.visible = true;
        char.handMug.visible = false;
      } else if (char.locationState === 'whiteboard') {
        char.targetWorldPos.set(0, 0.45, -9.4);
        char.targetRotY = 0; // Face north toward whiteboard easel & wall command screen
        char.isSeated = false;
        char.handMug.visible = false;
        char.handPhone.visible = false;
      } else if (char.locationState === 'chatting') {
        const chatSpot1 = new THREE.Vector3(5.7, 0.45, 8.5);
        const chatSpot2 = new THREE.Vector3(7.3, 0.45, 8.5);

        if (this.chattingSlotIndex % 2 === 0) {
          char.targetWorldPos.copy(chatSpot1);
          char.targetRotY = Math.PI / 2;
        } else {
          char.targetWorldPos.copy(chatSpot2);
          char.targetRotY = -Math.PI / 2;
        }
        this.chattingSlotIndex++;
        char.isSeated = false;
        char.handMug.visible = false;
        char.handPhone.visible = false;
      } else if (char.locationState === 'walking') {
        char.isSeated = false;
        char.handMug.visible = false;
        char.handPhone.visible = false;
      } else {
        // Standby at desk
        char.targetWorldPos.copy(char.deskWorldPos);
        char.targetRotY = char.deskRotY;
        char.isSeated = true;
        char.handMug.visible = false;
        char.handPhone.visible = false;
      }
    }

    char.thoughtBubble.visible = agent.status === 'planning';
    char.alertIcon.visible = agent.status === 'blocked';
    char.chatBubble.visible = !isWorking && char.locationState === 'chatting';
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  private bindEvents() {
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('resize', this.onWindowResize);
  }

  private onPointerMove(event: PointerEvent) {
    const now = performance.now();
    // Throttle raycasting to ~30fps (every 32ms) to prevent mousemove freezing the frame
    if (now - this.lastRaycastTime < 32) return;
    this.lastRaycastTime = now;

    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const agentId = this.meshToAgentMap.get(hitMesh) || null;
      if (agentId !== this.hoveredAgentId) {
        this.hoveredAgentId = agentId;
        this.container.style.cursor = 'pointer';
        this.callbacks.onHoverAgent(agentId);
      }
    } else {
      if (this.hoveredAgentId !== null) {
        this.hoveredAgentId = null;
        this.container.style.cursor = 'grab';
        this.callbacks.onHoverAgent(null);
      }
    }
  }

  private onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;

    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const agentId = this.meshToAgentMap.get(hitMesh);
      if (agentId) {
        this.callbacks.onSelectAgent(agentId);
        this.focusOnAgent(agentId);
      }
    }
  }

  public focusOnAgent(agentId: string) {
    const char = this.characters.get(agentId);
    if (!char) return;

    const pos = char.charGroup.position;
    this.targetLookAt.set(pos.x, 1.2, pos.z);
    this.targetCameraPos.set(pos.x + 3.0, 2.8, pos.z + 3.5);
    this.isTransitioningCamera = true;
  }

  public setCameraPreset(preset: 'isometric' | 'topdown' | 'front') {
    this.isTransitioningCamera = true;
    switch (preset) {
      case 'isometric':
        this.targetCameraPos.set(15, 14, 15);
        this.targetLookAt.set(0, 1.2, 0);
        break;
      case 'topdown':
        this.targetCameraPos.set(0, 22, 0.1);
        this.targetLookAt.set(0, 0, 0);
        break;
      case 'front':
        this.targetCameraPos.set(0, 7.5, 17);
        this.targetLookAt.set(0, 1.4, 0);
        break;
    }
  }

  private onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // --- RENDER LOOP & REAL-TIME ANIMATIONS ---
  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Skip heavy GPU work if the browser tab is hidden/backgrounded
    if (document.hidden) return;

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Camera LERP transition
    if (this.isTransitioningCamera) {
      this.camera.position.lerp(this.targetCameraPos, this.cameraLerpFactor);
      this.controls.target.lerp(this.targetLookAt, this.cameraLerpFactor);

      if (
        this.camera.position.distanceTo(this.targetCameraPos) < 0.1 &&
        this.controls.target.distanceTo(this.targetLookAt) < 0.1
      ) {
        this.isTransitioningCamera = false;
      }
    }

    // 2. Animate Living Office Environment Props (Clock, Steam, Bubbles)
    this.animatedProps.forEach((prop) => {
      prop.update(time, delta);
    });

    // 3. Animate each Pure White Chibi Bot
    this.characters.forEach((char) => {
      // A. MONDAR-MANDIR (Pacing back and forth along hallway)
      if (char.currentStatus === 'idle' && char.locationState === 'walking') {
        const minX = -3.8;
        const maxX = 3.8;
        const paceZ = 2.2;

        if (char.pacingPauseTimer > 0) {
          char.pacingPauseTimer -= delta;
          char.targetWorldPos.set(char.charGroup.position.x, 0.45, paceZ);
          char.headGroup.rotation.y = Math.sin(time * 3) * 0.35;
        } else {
          const nextX = char.charGroup.position.x + char.pacingDir * delta * 1.4;
          char.targetWorldPos.set(nextX, 0.45, paceZ);
          char.targetRotY = char.pacingDir > 0 ? Math.PI / 2 : -Math.PI / 2;

          if (nextX >= maxX) {
            char.pacingDir = -1;
            char.pacingPauseTimer = 1.2;
          } else if (nextX <= minX) {
            char.pacingDir = 1;
            char.pacingPauseTimer = 1.2;
          }
        }
      }

      // B. Spatial Interpolation (Walking towards destination)
      const distToTarget = char.charGroup.position.distanceTo(char.targetWorldPos);
      const isWalking = distToTarget > 0.12;

      if (isWalking) {
        char.charGroup.position.lerp(char.targetWorldPos, delta * 2.5);

        const dir = new THREE.Vector3().subVectors(char.targetWorldPos, char.charGroup.position);
        if (dir.lengthSq() > 0.01) {
          const moveAngle = Math.atan2(dir.x, dir.z);
          char.charGroup.rotation.y = THREE.MathUtils.lerp(char.charGroup.rotation.y, moveAngle, delta * 6);
        }

        // ADORABLE WADDLING WALK CYCLE
        const walkCycle = time * 13;
        char.leftLeg.rotation.x = Math.sin(walkCycle) * 0.5;
        char.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.5;
        char.leftArm.rotation.x = -Math.sin(walkCycle) * 0.45;
        char.rightArm.rotation.x = Math.sin(walkCycle) * 0.45;

        const baseY = char.isSeated ? char.targetWorldPos.y : 0.45;
        char.charGroup.position.y = baseY + Math.abs(Math.sin(walkCycle)) * 0.07;

        char.antennaOrb.position.x = Math.sin(walkCycle) * 0.03;
        char.headGroup.rotation.z = Math.sin(walkCycle * 0.5) * 0.08;
      } else {
        char.charGroup.rotation.y = THREE.MathUtils.lerp(char.charGroup.rotation.y, char.targetRotY, delta * 4);
        char.charGroup.position.y = char.isSeated ? char.targetWorldPos.y : 0.45;

        char.leftLeg.rotation.x = char.isSeated ? -Math.PI / 2 : 0;
        char.rightLeg.rotation.x = char.isSeated ? -Math.PI / 2 : 0;
        char.headGroup.rotation.z = 0;

        // C. AUTHENTIC ROLE & ACTIVITY ANIMATIONS
        const isWorking = char.currentStatus !== 'idle';
        const isCoding = char.currentStatus === 'coding';
        const isPlanning = char.currentStatus === 'planning';
        const isBlocked = char.currentStatus === 'blocked';

        if (isBlocked) {
          char.alertIcon.visible = true;
          char.alertIcon.rotation.y += delta * 3;
          char.headGroup.rotation.z = Math.sin(time * 3) * 0.15;
          char.rightArm.rotation.x = -1.2;
          char.leftArm.rotation.x = -0.3;
        } else if (isCoding) {
          char.alertIcon.visible = false;
          const typing = Math.sin(time * 16) * 0.18;
          char.leftArm.rotation.x = -0.45 + typing;
          char.rightArm.rotation.x = -0.45 - typing;
          char.headGroup.rotation.y = Math.sin(time * 2) * 0.05;
        } else if (isPlanning) {
          char.thoughtBubble.visible = true;
          if (char.department === 'orchestra') {
            // SOPHIA VANCE: Conductor waving baton in melodic tempo!
            char.conductorBaton.visible = true;
            char.rightArm.rotation.x = -0.9 + Math.sin(time * 4) * 0.35;
            char.rightArm.rotation.z = Math.cos(time * 4) * 0.25;
            char.leftArm.rotation.x = -0.4 + Math.sin(time * 2) * 0.15;
            char.headGroup.rotation.y = Math.sin(time * 2) * 0.15;
          } else {
            char.rightArm.rotation.x = -1.1;
            char.leftArm.rotation.x = -0.3;
            char.headGroup.rotation.y = 0.2;
          }
        } else {
          // IDLE / CASUAL ACTIVITIES
          if (char.locationState === 'coffee_bar') {
            char.handMug.visible = true;
            const sipCycle = (time * 0.8) % (Math.PI * 2);
            const isSipping = Math.sin(sipCycle) > 0.3;
            if (isSipping) {
              char.rightArm.rotation.x = THREE.MathUtils.lerp(char.rightArm.rotation.x, -1.35, 0.1);
              char.headGroup.rotation.x = THREE.MathUtils.lerp(char.headGroup.rotation.x, -0.2, 0.1);
            } else {
              char.rightArm.rotation.x = THREE.MathUtils.lerp(char.rightArm.rotation.x, -0.4, 0.1);
              char.headGroup.rotation.x = THREE.MathUtils.lerp(char.headGroup.rotation.x, 0, 0.1);
            }
          } else if (char.locationState === 'lounge') {
            char.handPhone.visible = true;
            char.rightArm.rotation.x = -0.9;
            char.leftArm.rotation.x = -0.4;
            char.headGroup.rotation.x = 0.35 + Math.sin(time * 2) * 0.04;
          } else if (char.locationState === 'chatting') {
            char.headGroup.rotation.y = Math.sin(time * 2.5) * 0.18;
            char.rightArm.rotation.x = -0.6 + Math.sin(time * 3) * 0.25;
            char.leftArm.rotation.x = -0.3 + Math.cos(time * 2) * 0.15;
            char.chatBubble.position.y = 1.45 + Math.sin(time * 2) * 0.04;
          } else {
            char.headGroup.rotation.y = Math.sin(time * 0.8) * 0.15;
            char.rightArm.rotation.x = -0.25;
            char.leftArm.rotation.x = -0.25;
          }
        }
      }

      // D. CUTE EYE BLINKING ANIMATION
      char.blinkTimer -= delta;
      if (char.blinkTimer <= 0) {
        char.leftEye.scale.y = 0.05;
        char.rightEye.scale.y = 0.05;
        if (char.blinkTimer < -0.15) {
          char.leftEye.scale.y = 1.0;
          char.rightEye.scale.y = 1.0;
          char.blinkTimer = 2.5 + Math.random() * 3.0;
        }
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('resize', this.onWindowResize);

    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
