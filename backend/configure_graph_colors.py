from pathlib import Path
import json

graph_path = Path(r"D:\Obsidian\Obsidian Memories\.obsidian\graph.json")
if graph_path.exists():
    try:
        data = json.loads(graph_path.read_text(encoding="utf-8"))
    except Exception:
        data = {}
else:
    data = {}

# Color groups for Cyberpunk / Neon aesthetic:
# - Plan: Emerald Green (#10B981)
# - Docs: Amber / Gold (#F59E0B)
# - Conversation: Purple (#A855F7)
# - Index Hub: Electric Cyan (#38BDF8)
data["colorGroups"] = [
    {
        "query": "path:plan",
        "color": { "a": 1, "rgb": 1096065 } # Emerald Green #10B981
    },
    {
        "query": "path:docs",
        "color": { "a": 1, "rgb": 16096779 } # Amber #F59E0B
    },
    {
        "query": "path:conversation",
        "color": { "a": 1, "rgb": 11032055 } # Purple #A855F7
    },
    {
        "query": "Index",
        "color": { "a": 1, "rgb": 3718648 } # Electric Cyan #38BDF8
    }
]

# Tuning visual parameters for dramatic lighting
data["showTags"] = False  # Keep graph isolated & clean
data["showArrow"] = True
data["nodeSizeMultiplier"] = 1.35
data["lineSizeMultiplier"] = 1.25
data["textFadeMultiplier"] = 0.4
data["linkDistance"] = 45

graph_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
print("Updated graph.json with vibrant neon color groups and tuned sizes!")
