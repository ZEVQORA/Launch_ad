#!/usr/bin/env python3
"""
Local intelligibility QA: transcribe narration with faster-whisper (MIT, offline
after first model download) and report word error rate + model confidence.

    .tts/venv/bin/python scripts/asr-check.py compare   # voice candidates
    .tts/venv/bin/python scripts/asr-check.py final     # every final VO line
    .tts/venv/bin/python scripts/asr-check.py file <path.wav> "<expected text>"
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

# The brand name is a coined word; ASR cannot know its spelling. Accept the
# phonetic spellings an English recogniser produces for /zˈɛvkɔːɹə/.
BRAND_ALIASES = re.compile(r"\b(zev ?(c|k|ch)or[ae]h?|zevcora|zevqora|zev ?quora|zefkora|zevkorra)\b")


def norm(s: str) -> list[str]:
    s = s.lower().replace("’", "'")
    s = BRAND_ALIASES.sub("zevqora", s)
    s = re.sub(r"[^a-z0-9' ]+", " ", s)
    return s.split()


def wer(ref: list[str], hyp: list[str]) -> float:
    d = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        prev, d[0] = d[0], i
        for j, h in enumerate(hyp, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r != h))
    return d[len(hyp)] / max(len(ref), 1)


def model():
    from faster_whisper import WhisperModel

    return WhisperModel("small.en", device="cpu", compute_type="int8")


def run(m, path: Path, expected: str):
    import numpy as np
    import soundfile as sf
    from scipy.signal import resample_poly

    a, sr = sf.read(str(path), dtype="float32", always_2d=True)
    a = resample_poly(a.mean(axis=1), 16000, sr).astype(np.float32)
    segs, _ = m.transcribe(a, beam_size=5, language="en", temperature=0.0)
    segs = list(segs)
    text = " ".join(s.text.strip() for s in segs)
    lp = sum(s.avg_logprob for s in segs) / max(len(segs), 1)
    w = wer(norm(expected), norm(text))
    return text, w, lp


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "final"
    m = model()
    rows = []
    if mode == "compare":
        import importlib.util

        spec = importlib.util.spec_from_file_location("gv", ROOT / "scripts/generate-voice.py")
        gv = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(gv)
        expected = " ".join(gv.COMPARE_LINES)
        for v in gv.COMPARE_VOICES:
            text, w, lp = run(m, gv.OUT_CMP / f"{v}.wav", expected)
            rows.append({"voice": v, "wer": round(w, 3), "avg_logprob": round(lp, 3), "heard": text})
    elif mode == "final":
        man = json.loads((ROOT / "public/audio/vo/manifest.json").read_text())
        for line in man["lines"]:
            text, w, lp = run(m, ROOT / "public" / line["file"], line["text"])
            rows.append({"id": line["id"], "wer": round(w, 3), "avg_logprob": round(lp, 3),
                         "expected": line["text"], "heard": text})
    else:
        text, w, lp = run(m, Path(sys.argv[2]), sys.argv[3])
        rows.append({"wer": round(w, 3), "avg_logprob": round(lp, 3), "heard": text})
    for r in rows:
        print(json.dumps(r, ensure_ascii=False))
    if mode == "final":
        out = ROOT / "docs/qa/asr-final.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(rows, indent=2, ensure_ascii=False))
        bad = [r for r in rows if r["wer"] > 0]
        print(f"lines with any ASR mismatch: {len(bad)}/{len(rows)}")


if __name__ == "__main__":
    main()
