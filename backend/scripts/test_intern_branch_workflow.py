"""Runnable smoke test for the Intern mission-branch guardrails."""
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.intern_safety import InternGitSafetyService


def git(repo: Path, *args: str) -> None:
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True, text=True)


def main() -> None:
    with tempfile.TemporaryDirectory() as directory:
        repo = Path(directory)
        git(repo, "init", "-b", "main")
        git(repo, "config", "user.name", "Intern Test")
        git(repo, "config", "user.email", "intern@example.test")
        (repo / "README.md").write_text("base\n", encoding="utf-8")
        git(repo, "add", "README.md")
        git(repo, "commit", "-m", "base")

        service = InternGitSafetyService(repo)
        started = service.start_mission_branch("demo-123")
        assert started["success"] and started["branch"] == "intern/mission-demo-123", started
        assert service._current_branch() == "intern/mission-demo-123"
        try:
            service._mission_branch("../main")
            raise AssertionError("Invalid mission ID was accepted")
        except ValueError:
            pass

    print("Intern mission-branch smoke test passed.")


if __name__ == "__main__":
    main()
