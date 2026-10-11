from pathlib import Path

vault = Path(r"D:\Obsidian\Obsidian Memories\antigravity")

# 1. Update Kibi-Orchestra docs
kibi_sop = vault / "Kibi-Orchestra" / "docs" / "Role-Standard-Operating-Procedures.md"
if kibi_sop.exists():
    txt = kibi_sop.read_text(encoding="utf-8")
    txt = txt.replace("tags:\n  - antigravity\n  - sops\n  - roles", "tags:\n  - kibi-orchestra/docs\n  - kibi-orchestra/sops")
    kibi_sop.write_text(txt, encoding="utf-8")

kibi_git = vault / "Kibi-Orchestra" / "docs" / "Git-Intern-Safety-Procedure.md"
if kibi_git.exists():
    txt = kibi_git.read_text(encoding="utf-8")
    txt = txt.replace("tags:\n  - antigravity\n  - intern\n  - sop\n  - git-safety", "tags:\n  - kibi-orchestra/docs\n  - kibi-orchestra/git-safety")
    kibi_git.write_text(txt, encoding="utf-8")

kibi_conv = vault / "Kibi-Orchestra" / "conversation" / "20261011_Dokumentasi-Percakapan-Kibi-Orchestra.md"
if kibi_conv.exists():
    txt = kibi_conv.read_text(encoding="utf-8")
    txt = txt.replace("tags:\n  - antigravity\n  - conversation-history", "tags:\n  - kibi-orchestra/conversation")
    kibi_conv.write_text(txt, encoding="utf-8")

# 2. Update Project-Alpha docs
alpha_sop = vault / "Project-Alpha" / "docs" / "Role-Standard-Operating-Procedures.md"
if alpha_sop.exists():
    txt = alpha_sop.read_text(encoding="utf-8")
    txt = txt.replace("tags:\n  - antigravity\n  - project-alpha\n  - sops", "tags:\n  - project-alpha/docs\n  - project-alpha/sops")
    alpha_sop.write_text(txt, encoding="utf-8")

alpha_git = vault / "Project-Alpha" / "docs" / "Git-Intern-Safety-Procedure.md"
if alpha_git.exists():
    txt = alpha_git.read_text(encoding="utf-8")
    txt = txt.replace("tags:\n  - antigravity\n  - project-alpha\n  - git-safety", "tags:\n  - project-alpha/docs\n  - project-alpha/git-safety")
    alpha_git.write_text(txt, encoding="utf-8")

print("All existing tags converted to clean nested scoped tags!")
