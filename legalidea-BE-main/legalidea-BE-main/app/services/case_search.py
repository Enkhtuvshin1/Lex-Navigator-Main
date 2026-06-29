"""Search downloaded court case .doc files by keyword."""
from __future__ import annotations

import os
import re
from pathlib import Path

CASES_DIR = Path(__file__).resolve().parent.parent.parent / "Cases"


def _strip_html(html: str) -> str:
    """Remove HTML tags and collapse whitespace."""
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _load_cases() -> list[dict[str, str]]:
    """Load all .doc files and cache their plain text."""
    cases = []
    if not CASES_DIR.is_dir():
        return cases
    for f in sorted(CASES_DIR.iterdir()):
        if f.suffix != ".doc":
            continue
        try:
            html = f.read_text(encoding="utf-8")
            text = _strip_html(html)
            if len(text) > 50:
                cases.append({"id": f.stem, "text": text})
        except Exception:
            continue
    return cases


# Load once at import time
_CASES: list[dict[str, str]] = _load_cases()


def search_cases(query: str, limit: int = 3) -> list[dict[str, str]]:
    """Return up to `limit` cases whose text contains any query keyword."""
    keywords = [w.lower() for w in query.split() if len(w) >= 2]
    if not keywords:
        return []

    scored: list[tuple[int, dict[str, str]]] = []
    for case in _CASES:
        text_lower = case["text"].lower()
        hits = sum(1 for kw in keywords if kw in text_lower)
        if hits > 0:
            scored.append((hits, case))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:limit]]
