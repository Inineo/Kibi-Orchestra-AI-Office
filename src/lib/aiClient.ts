/**
 * 9Router AI Client Service
 * Menghubungkan Kibi Orchestra UI langsung ke Gateway 9Router (http://localhost:20128)
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResponse {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// Role-to-model mapping default
export const ROLE_MODEL_MAPPING: Record<string, string> = {
  strategist: 'Architect',
  architect: 'Architect',
  planner: 'Daily',
  developer: 'Coding_Specialist',
  reviewer: 'Reviewer',
  tester: 'Fast',
  // Custom User Roles:
  product_manager: 'Architect',
  frontend: 'Daily',
  backend: 'Coding_Specialist',
  intern: 'Fast',
};

export interface RouterModel {
  id: string;
  owned_by?: string;
}

/**
 * Mengambil daftar seluruh model yang aktif langsung dari 9Router
 */
export async function fetchAvailableModels(): Promise<RouterModel[]> {
  try {
    const res = await fetch('/api/9router/v1/models');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Failed to fetch models from /api/9router/v1/models, fallbacking to presets:', err);
    return [];
  }
}
export async function call9RouterChat(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<CompletionResponse> {
  const model = options.model || 'Daily';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 1024;

  const url = '/api/9router/v1/chat/completions';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`9Router HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    return {
      content,
      model: data.model || model,
      tokensUsed: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens,
      },
    };
  } catch (error) {
    console.error('9Router call failed:', error);
    throw error;
  }
}

/**
 * Eksekusi Autonomous Step AI untuk Agent berdasarkan Role dan Task
 */
export async function executeAgentTaskStep(params: {
  agentName: string;
  agentRole: string;
  agentModel?: string;
  taskTitle: string;
  taskDescription: string;
  taskKey: string;
  stage: 'plan' | 'implement' | 'review';
}): Promise<{
  thought: string;
  action: string;
  artifactCode?: string;
  tokensGenerated: number;
}> {
  const targetModel = params.agentModel || ROLE_MODEL_MAPPING[params.agentRole] || 'Daily';

  const systemPrompt = `Kamu adalah ${params.agentName}, seorang Autonomous AI Agent dengan peran: ${params.agentRole.toUpperCase()}.
Kamu bekerja dalam sistem Kibi Orchestra AI Workforce.
Saat mengeksekusi sub-bagian dari tugas, berikan respon terstruktur dalam format JSON murni:
{
  "thought": "Penalaran singkat / rencana tindakan 1 kalimat dalam bahasa Indonesia",
  "action": "Aksi spesifik yang sedang dilakukan (maks 10 kata)",
  "artifact": "Potongan kode atau laporan ringkas hasil kerja (opsional, string)"
}`;

  const userPrompt = `Tugas: [${params.taskKey}] ${params.taskTitle}
Deskripsi: ${params.taskDescription}
Tahap: ${params.stage.toUpperCase()}

Jawab HANYA dengan JSON valid { "thought": "...", "action": "...", "artifact": "..." }.`;

  const res = await call9RouterChat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      model: targetModel,
      temperature: 0.3,
      maxTokens: 600,
    }
  );

  try {
    const cleaned = res.content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      thought: parsed.thought || 'Menganalisis tugas dan menyusun solusi...',
      action: parsed.action || 'Menjalankan eksekusi model',
      artifactCode: parsed.artifact,
      tokensGenerated: res.tokensUsed.total || 150,
    };
  } catch {
    return {
      thought: res.content.slice(0, 150),
      action: `Menjalankan inferensi model ${targetModel}`,
      artifactCode: res.content,
      tokensGenerated: res.tokensUsed.total || 120,
    };
  }
}

export interface DecomposedTask {
  title: string;
  description: string;
  role: 'frontend' | 'backend' | 'intern' | 'reviewer';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  estimatedTime: number;
}

/**
 * Memanggil Product Manager AI untuk memecah PRD / Goal besar menjadi sub-task
 * khusus untuk Frontend, Backend, dan Intern.
 */
export async function decomposeMissionWithPM(params: {
  missionGoal: string;
  requirements?: string;
  model?: string;
}): Promise<{
  epicSummary: string;
  tasks: DecomposedTask[];
}> {
  const model = params.model || 'Architect';

  const systemPrompt = `Kamu adalah Product Manager (PM) Senior dalam sistem Kibi Orchestra AI Workforce.
Tugasmu adalah menganalisis Mission Goal / PRD dari user, lalu memecahnya secara cerdas menjadi 3-4 sub-task teknis terpisah yang akan dikerjakan oleh tim engineer:
1. FRONTEND: Bertanggung jawab atas UI, komponen visual, responsive layout, dan state management.
2. BACKEND: Bertanggung jawab atas REST API, routing gateway, skema database, autentikasi, dan logika bisnis.
3. INTERN: Bertanggung jawab atas unit testing, dokumentasi panduan, error boundary, dan verifikasi edge case.

Format output HARUS JSON murni tanpa markdown:
{
  "epicSummary": "Ringkasan visi sprint produk dalam 1-2 kalimat bahasa Indonesia",
  "tasks": [
    {
      "title": "Judul spesifik tugas",
      "description": "Rincian teknis tugas dan acceptance criteria",
      "role": "frontend",
      "priority": "high",
      "tags": ["Frontend", "UI", "React"],
      "estimatedTime": 180
    },
    {
      "title": "Judul spesifik tugas",
      "description": "Rincian teknis tugas dan acceptance criteria",
      "role": "backend",
      "priority": "high",
      "tags": ["Backend", "API", "Auth"],
      "estimatedTime": 240
    },
    {
      "title": "Judul spesifik tugas",
      "description": "Rincian pengujian dan dokumentasi",
      "role": "intern",
      "priority": "medium",
      "tags": ["Testing", "QA", "Docs"],
      "estimatedTime": 120
    }
  ]
}`;

  const userPrompt = `Mission Goal: ${params.missionGoal}
Persyaratan Tambahan: ${params.requirements || 'Ikuti arsitektur standar produksi dan best practices modern.'}

Pecah goal di atas menjadi sub-task untuk tim Frontend, Backend, dan Intern sekarang!`;

  const res = await call9RouterChat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      model,
      temperature: 0.3,
      maxTokens: 1200,
    }
  );

  try {
    const cleaned = res.content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      epicSummary: parsed.epicSummary || 'Sprint tugas berhasil dipecah oleh Product Manager AI.',
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    };
  } catch (err) {
    console.warn('Gagal parse JSON dari PM decomposition, fallbacking to template:', err);
    return {
      epicSummary: `Inisiatif: ${params.missionGoal}`,
      tasks: [
        {
          title: `[FE] Implementasi Antarmuka UI untuk ${params.missionGoal.slice(0, 35)}`,
          description: `Membangun komponen visual dan interaksi pengguna untuk: ${params.missionGoal}`,
          role: 'frontend',
          priority: 'high',
          tags: ['Frontend', 'UI'],
          estimatedTime: 180,
        },
        {
          title: `[BE] API Endpoint & Arsitektur Data untuk ${params.missionGoal.slice(0, 35)}`,
          description: `Menyediakan gateway controller, model data, dan integrasi backend: ${params.missionGoal}`,
          role: 'backend',
          priority: 'high',
          tags: ['Backend', 'API'],
          estimatedTime: 240,
        },
        {
          title: `[QA/Intern] Unit Tests & Dokumentasi untuk ${params.missionGoal.slice(0, 35)}`,
          description: `Menulis test assertions dan memvalidasi edge cases untuk: ${params.missionGoal}`,
          role: 'intern',
          priority: 'medium',
          tags: ['Testing', 'Docs'],
          estimatedTime: 120,
        },
      ],
    };
  }
}

