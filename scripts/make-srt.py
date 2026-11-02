#!/usr/bin/env python3
"""
Subtitles (.srt) for the film and teaser, generated from the same timeline and
measured VO durations the video uses, so captions can never drift from the audio.

    python3 scripts/make-srt.py        -> out/ZEVQORA-launch-film.srt, out/ZEVQORA-teaser-9x16.srt
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src/config/timeline.json").read_text())
MAN = {l["id"]: l for l in json.loads((ROOT / "public/audio/vo/manifest.json").read_text())["lines"]}
MAX = 38  # chars per subtitle line (mobile-safe)


def split(text: str) -> str:
    if len(text) <= MAX:
        return text
    words = text.split()
    best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        score = max(len(a), len(b))
        if best is None or score < best[0]:
            best = (score, f"{a}\n{b}")
    return best[1]


def ts(s: float) -> str:
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def build(cut: str, out: Path):
    placed = sorted(TL[cut]["vo"].items(), key=lambda kv: kv[1])
    cues = []
    for i, (lid, start) in enumerate(placed):
        end = start + MAN[lid]["seconds"] + 0.25
        if i + 1 < len(placed):
            end = min(end, placed[i + 1][1] - 0.04)
        end = max(end, start + 0.7)  # keep one-word beats readable
        if i + 1 < len(placed):
            end = min(end, placed[i + 1][1] - 0.04)
        cues.append((start, end, split(MAN[lid]["text"])))
    out.write_text("\n".join(f"{n}\n{ts(a)} --> {ts(b)}\n{t}\n" for n, (a, b, t) in enumerate(cues, 1)), encoding="utf-8")
    print(out.relative_to(ROOT), len(cues), "cues")


build("film", ROOT / "out/ZEVQORA-launch-film.srt")
build("teaser", ROOT / "out/ZEVQORA-teaser-9x16.srt")
