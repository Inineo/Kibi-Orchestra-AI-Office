from pathlib import Path
import json

snippet_path = Path(r"D:\Obsidian\Obsidian Memories\.obsidian\snippets\neon-glow-graph.css")

css_content = """/* =========================================================
   GLOWING CYBERPUNK / NEON GRAPH VIEW & PATH ANIMATIONS
   Kibi Orchestra & Antigravity Obsidian Theme Snippet
   ========================================================= */

/* Canvas & Graph Container */
.graph-view.color-fill {
  background: radial-gradient(circle at center, #0f172a 0%, #030712 100%) !important;
}

/* Glowing Nodes & Dots */
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

/* Glowing Connecting Paths & Lines */
.graph-view line,
.graph-view-container line,
.graph-view path,
.graph-view-container path {
  stroke-linecap: round;
  filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.6));
  animation: streamPath 4s infinite linear;
}

/* Node Breathing / Glow Animation */
@keyframes pulseNode {
  0% {
    filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.6)) drop-shadow(0 0 10px rgba(14, 165, 233, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.9)) drop-shadow(0 0 20px rgba(192, 132, 252, 0.5));
  }
  100% {
    filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.6)) drop-shadow(0 0 10px rgba(14, 165, 233, 0.3));
  }
}

/* Path Flow Animation */
@keyframes streamPath {
  0% {
    stroke-opacity: 0.45;
  }
  50% {
    stroke-opacity: 0.95;
  }
  100% {
    stroke-opacity: 0.45;
  }
}

/* Glowing Node Label Text */
.graph-view text,
.graph-view-container text {
  font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
  font-weight: 600;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.9), 0 0 10px rgba(56, 189, 248, 0.5);
}
"""

with open(snippet_path, "w", encoding="utf-8") as f:
    f.write(css_content.strip() + "\n")
print(f"Created snippet: {snippet_path}")

# Enable snippet in appearance.json
app_json_path = Path(r"D:\Obsidian\Obsidian Memories\.obsidian\appearance.json")
data = {}
if app_json_path.exists():
    try:
        content = app_json_path.read_text(encoding="utf-8").strip()
        if content:
            data = json.loads(content)
    except Exception:
        data = {}

enabled_snippets = data.get("enabledCssSnippets", [])
if "neon-glow-graph" not in enabled_snippets:
    enabled_snippets.append("neon-glow-graph")
data["enabledCssSnippets"] = enabled_snippets

app_json_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
print(f"Enabled neon-glow-graph in appearance.json!")
