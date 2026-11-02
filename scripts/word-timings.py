#!/usr/bin/env python3
"""Per-word timings for every VO line (faster-whisper word timestamps, local).
Output: src/config/words.json  {lineId: [{w, s, e}, ...]} seconds relative to clip start.
The words are mapped back onto the *script* text so on-screen spelling is always ours."""
import json, re, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
ROOT = Path(__file__).resolve().parent.parent
man = json.loads((ROOT/"public/audio/vo/manifest.json").read_text())
m = WhisperModel("small.en", device="cpu", compute_type="int8")
out = {}
for line in man["lines"]:
    a, sr = sf.read(str(ROOT/"public"/line["file"]), dtype="float32", always_2d=True)
    a16 = resample_poly(a.mean(axis=1), 16000, sr).astype(np.float32)
    segs, _ = m.transcribe(a16, language="en", word_timestamps=True, beam_size=5, temperature=0.0)
    heard = [w for s in segs for w in s.words]
    script = line["text"].split()
    if len(heard) != len(script):
        # fall back to proportional-by-characters across the heard speech span
        s0 = heard[0].start if heard else 0.0
        e0 = heard[-1].end if heard else line["seconds"]
        L = sum(len(w) for w in script); t = s0; words = []
        for w in script:
            d = (e0 - s0) * len(w) / L; words.append({"w": w, "s": round(t, 3), "e": round(t + d, 3)}); t += d
        print("approx", line["id"], [w.word for w in heard], file=sys.stderr)
    else:
        words = [{"w": w, "s": round(h.start, 3), "e": round(h.end, 3)} for w, h in zip(script, heard)]
    out[line["id"]] = words
(ROOT/"src/config").mkdir(parents=True, exist_ok=True)
(ROOT/"src/config/words.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
for k, v in out.items(): print(k, " ".join(f"{x['w']}@{x['s']:.2f}" for x in v))
