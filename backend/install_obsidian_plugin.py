from pathlib import Path
import json

plugin_dir = Path(r"D:\Obsidian\Obsidian Memories\.obsidian\plugins\neon-graph-glow")

# 1. manifest.json
manifest = {
    "id": "neon-graph-glow",
    "name": "Neon Graph Glow & Animated Particles",
    "version": "1.0.0",
    "minAppVersion": "1.0.0",
    "description": "Injects real-time glowing neon lighting and pulsing animations into Obsidian Graph View canvas.",
    "author": "Antigravity AI",
    "isDesktopOnly": True
}
(plugin_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

# 2. main.js (Modifies Canvas 2D rendering to inject shadowBlur glow and particle loops)
main_js = """const { Plugin } = require('obsidian');

module.exports = class NeonGraphGlowPlugin extends Plugin {
    async onload() {
        console.log("Neon Graph Glow Plugin loaded!");
        this.injectCanvasGlow();
        this.registerInterval(window.setInterval(() => {
            this.triggerGraphRedraw();
        }, 50));
    }

    injectCanvasGlow() {
        if (CanvasRenderingContext2D.prototype._originalArc) return;

        CanvasRenderingContext2D.prototype._originalArc = CanvasRenderingContext2D.prototype.arc;
        CanvasRenderingContext2D.prototype._originalStroke = CanvasRenderingContext2D.prototype.stroke;
        CanvasRenderingContext2D.prototype._originalFill = CanvasRenderingContext2D.prototype.fill;

        const plugin = this;

        // Hook arc (used to draw node circles)
        CanvasRenderingContext2D.prototype.arc = function(x, y, radius, startAngle, endAngle, counterclockwise) {
            if (this.canvas && this.canvas.classList && (this.canvas.classList.contains('graph-view') || this.canvas.parentElement?.classList?.contains('graph-view-container'))) {
                this.save();
                const time = Date.now() / 600;
                const pulse = 10 + Math.sin(time) * 6;
                this.shadowBlur = radius > 8 ? pulse * 1.5 : pulse;
                this.shadowColor = this.fillStyle && typeof this.fillStyle === 'string' ? this.fillStyle : '#38bdf8';
                const res = plugin.prototypeArc.call(this, x, y, radius, startAngle, endAngle, counterclockwise);
                this.restore();
                return res;
            }
            return plugin.prototypeArc.call(this, x, y, radius, startAngle, endAngle, counterclockwise);
        };
        plugin.prototypeArc = CanvasRenderingContext2D.prototype._originalArc;

        // Hook stroke (used to draw connecting lines/paths)
        CanvasRenderingContext2D.prototype.stroke = function() {
            if (this.canvas && this.canvas.classList && (this.canvas.classList.contains('graph-view') || this.canvas.parentElement?.classList?.contains('graph-view-container'))) {
                this.save();
                const time = Date.now() / 800;
                this.shadowBlur = 8 + Math.sin(time) * 4;
                this.shadowColor = '#38bdf8';
                const res = plugin.prototypeStroke.call(this);
                this.restore();
                return res;
            }
            return plugin.prototypeStroke.call(this);
        };
        plugin.prototypeStroke = CanvasRenderingContext2D.prototype._originalStroke;
    }

    triggerGraphRedraw() {
        const graphs = document.querySelectorAll('.graph-view-container canvas, canvas.graph-view');
        if (graphs.length > 0) {
            // Subtle pulse trigger to keep frame animated
            window.dispatchEvent(new Event('resize'));
        }
    }

    onunload() {
        if (CanvasRenderingContext2D.prototype._originalArc) {
            CanvasRenderingContext2D.prototype.arc = CanvasRenderingContext2D.prototype._originalArc;
            CanvasRenderingContext2D.prototype.stroke = CanvasRenderingContext2D.prototype._originalStroke;
            delete CanvasRenderingContext2D.prototype._originalArc;
            delete CanvasRenderingContext2D.prototype._originalStroke;
        }
        console.log("Neon Graph Glow Plugin unloaded!");
    }
};
"""
(plugin_dir / "main.js").write_text(main_js, encoding="utf-8")

# 3. Enable community plugins in community-plugins.json
obsidian_dir = Path(r"D:\Obsidian\Obsidian Memories\.obsidian")
comm_file = obsidian_dir / "community-plugins.json"
active_plugins = []
if comm_file.exists():
    try:
        active_plugins = json.loads(comm_file.read_text(encoding="utf-8"))
    except Exception:
        active_plugins = []

if "neon-graph-glow" not in active_plugins:
    active_plugins.append("neon-graph-glow")
comm_file.write_text(json.dumps(active_plugins, indent=2), encoding="utf-8")

# 4. Turn on community plugins in app.json if restricted
app_file = obsidian_dir / "app.json"
app_data = {}
if app_file.exists():
    try:
        content = app_file.read_text(encoding="utf-8").strip()
        if content:
            app_data = json.loads(content)
    except Exception:
        app_data = {}

app_data["communityPluginsEnabled"] = True
app_file.write_text(json.dumps(app_data, indent=2), encoding="utf-8")

print("Neon Graph Glow plugin installed and activated successfully!")
