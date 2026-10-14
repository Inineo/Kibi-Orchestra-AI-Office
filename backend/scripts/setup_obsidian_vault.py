"""
Setup & Konfigurasi Visual Obsidian Vault
Mengatur tampilan tema, glow effect (CSS snippet & plugin), dan palet warna Graph View.
"""
import json
from pathlib import Path

VAULT_ROOT = Path(r"D:\Obsidian\Obsidian Memories")

def install_neon_glow_snippet():
    """Memasang CSS snippet neon-glow-graph.css ke .obsidian/snippets"""
    snippet_dir = VAULT_ROOT / ".obsidian" / "snippets"
    snippet_dir.mkdir(parents=True, exist_ok=True)
    snippet_file = snippet_dir / "neon-glow-graph.css"

    css_content = """/* GLOWING CYBERPUNK / NEON GRAPH VIEW & PATH ANIMATIONS */
.graph-view.color-fill {
  background: radial-gradient(circle at center, #0f172a 0%, #030712 100%) !important;
}

.graph-view circle,
.graph-view-container circle {
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.75)) drop-shadow(0 0 14px rgba(168, 85, 247, 0.5));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: pulseNode 3s infinite ease-in-out alternate;
}

.graph-view circle:hover,
.graph-view-container circle:hover {
  filter: drop-shadow(0 0 12px #38bdf8) drop-shadow(0 0 24px #a855f7) !important;
  transform: scale(1.3);
}

.graph-view line,
.graph-view-container line,
.graph-view path,
.graph-view-container path {
  stroke-linecap: round;
  filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.6));
  animation: streamPath 4s infinite linear;
}

@keyframes pulseNode {
  0% { filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.6)) drop-shadow(0 0 10px rgba(14, 165, 233, 0.3)); }
  50% { filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.9)) drop-shadow(0 0 20px rgba(192, 132, 252, 0.5)); }
  100% { filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.6)) drop-shadow(0 0 10px rgba(14, 165, 233, 0.3)); }
}

@keyframes streamPath {
  0% { stroke-opacity: 0.45; }
  50% { stroke-opacity: 0.95; }
  100% { stroke-opacity: 0.45; }
}
"""
    snippet_file.write_text(css_content.strip(), encoding="utf-8")
    print(f"[OK] CSS Snippet terpasang: {snippet_file}")

    # Aktifkan di app.json
    app_json = VAULT_ROOT / ".obsidian" / "app.json"
    if app_json.exists():
        try:
            data = json.loads(app_json.read_text(encoding="utf-8"))
            snippets = data.get("enabledCssSnippets", [])
            if "neon-glow-graph" not in snippets:
                snippets.append("neon-glow-graph")
                data["enabledCssSnippets"] = snippets
                app_json.write_text(json.dumps(data, indent=2), encoding="utf-8")
                print("[OK] neon-glow-graph diaktifkan di app.json")
        except Exception as e:
            print(f"[WARN] Gagal update app.json: {e}")

def configure_graph_colors():
    """Mengatur konfigurasi warna node dan grup di graph.json"""
    graph_file = VAULT_ROOT / ".obsidian" / "graph.json"
    if not graph_file.exists():
        print(f"[INFO] {graph_file} belum ada, melewati konfigurasi warna.")
        return

    try:
        data = json.loads(graph_file.read_text(encoding="utf-8"))
        data["colorGroups"] = [
            {"query": "path:antigravity/Kibi-Orchestra", "color": {"a": 1, "rgb": 3724792}}, # Cyan/Blue
            {"query": "path:antigravity/Project-Alpha", "color": {"a": 1, "rgb": 11029247}}, # Purple
            {"query": "path:antigravity", "color": {"a": 1, "rgb": 16750848}},             # Amber
        ]
        data["lineSizeMultiplier"] = 2.0
        data["nodeSizeMultiplier"] = 1.3
        graph_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        print("[OK] Warna node graph.json berhasil diperbarui.")
    except Exception as e:
        print(f"[ERROR] Gagal konfigurasi graph.json: {e}")

def install_plugin():
    """Memasang plugin neon-graph-glow untuk canvas 2D rendering"""
    plugin_dir = VAULT_ROOT / ".obsidian" / "plugins" / "neon-graph-glow"
    plugin_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "id": "neon-graph-glow",
        "name": "Neon Graph Glow & Animated Particles",
        "version": "1.0.0",
        "minAppVersion": "1.0.0",
        "description": "Injects real-time glowing neon lighting into Obsidian Graph View.",
        "author": "Antigravity AI",
        "isDesktopOnly": True
    }
    (plugin_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    main_js = """const { Plugin } = require('obsidian');

module.exports = class NeonGraphGlowPlugin extends Plugin {
    async onload() {
        console.log("Neon Graph Glow Plugin loaded!");
        this.injectCanvasGlow();
    }

    injectCanvasGlow() {
        if (CanvasRenderingContext2D.prototype._originalArc) return;
        CanvasRenderingContext2D.prototype._originalArc = CanvasRenderingContext2D.prototype.arc;
        const plugin = this;

        CanvasRenderingContext2D.prototype.arc = function(x, y, radius, startAngle, endAngle, counterclockwise) {
            if (this.canvas && this.canvas.classList && (this.canvas.classList.contains('graph-view') || this.canvas.parentElement?.classList?.contains('graph-view-container'))) {
                this.save();
                this.shadowBlur = 12;
                this.shadowColor = this.fillStyle && typeof this.fillStyle === 'string' ? this.fillStyle : '#38bdf8';
                const res = plugin.prototypeArc.call(this, x, y, radius, startAngle, endAngle, counterclockwise);
                this.restore();
                return res;
            }
            return plugin.prototypeArc.call(this, x, y, radius, startAngle, endAngle, counterclockwise);
        };
        plugin.prototypeArc = CanvasRenderingContext2D.prototype._originalArc;
    }
};
"""
    (plugin_dir / "main.js").write_text(main_js, encoding="utf-8")

    # Aktifkan di community-plugins.json
    comm_file = VAULT_ROOT / ".obsidian" / "community-plugins.json"
    if comm_file.exists():
        try:
            plugins = json.loads(comm_file.read_text(encoding="utf-8"))
            if "neon-graph-glow" not in plugins:
                plugins.append("neon-graph-glow")
                comm_file.write_text(json.dumps(plugins, indent=2), encoding="utf-8")
                print("[OK] Plugin diaktifkan di community-plugins.json")
        except Exception as e:
            print(f"[WARN] Gagal update community-plugins.json: {e}")

if __name__ == "__main__":
    print("[*] Menjalankan setup visual Obsidian Vault...")
    install_neon_glow_snippet()
    configure_graph_colors()
    install_plugin()
    print("[SUCCESS] Setup visual Obsidian Vault selesai!")
