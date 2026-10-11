import re
from typing import Dict, Any, List

class CavemanCompressor:
    """
    Caveman Prompt & Context Compressor
    Tujuan: Memotong filler conversational text (basa-basi, salam, penutup)
    dan memadatkan konteks menjadi bentuk telegrafik (key-value / bullet points)
    sehingga menghemat 60-80% pemakaian token antar-agen.
    """

    FILLER_PATTERNS = [
        r"(?i)^(halo|hai|hello|hi|terima kasih|sama-sama|baiklah|tentu saja)[,\.\! ]*",
        r"(?i)saya adalah (product manager|frontend developer|backend developer|intern|ai).*?\.",
        r"(?i)sebagai (seorang )?(product manager|frontend developer|backend developer|intern).*?,",
        r"(?i)(semoga membantu|ada yang bisa saya bantu lagi|beri tahu saya jika|selamat bekerja).*?$",
        r"(?i)(in summary|kesimpulannya|dengan demikian).*?:"
    ]

    @classmethod
    def compress_text(cls, text: str) -> str:
        """Membersihkan teks dari basa-basi dan frasa pengisi berulang."""
        if not text:
            return ""
        
        cleaned = text.strip()
        for pattern in cls.FILLER_PATTERNS:
            cleaned = re.sub(pattern, "", cleaned)

        # Menghapus multiple newlines kosong berlebihan
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        return cleaned.strip()

    @classmethod
    def format_shared_context(
        cls,
        mission_goal: str,
        pm_spec: str = "",
        backend_output: str = "",
        frontend_output: str = "",
        qa_notes: str = ""
    ) -> str:
        """
        Membuat 'Blackboard Shared Context' yang ringkas & padat
        untuk dikonsumsi oleh agen berikutnya tanpa over-budget token.
        """
        parts = [f"# MISSION: {mission_goal.strip()}"]

        if pm_spec:
            parts.append(f"## [PM SPEC]\n{cls.compress_text(pm_spec)}")
        if backend_output:
            parts.append(f"## [BACKEND CONTRACT/API]\n{cls.compress_text(backend_output)}")
        if frontend_output:
            parts.append(f"## [FRONTEND UI/STATE]\n{cls.compress_text(frontend_output)}")
        if qa_notes:
            parts.append(f"## [QA/TESTING REPORT]\n{cls.compress_text(qa_notes)}")

        return "\n\n".join(parts)
