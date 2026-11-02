#!/usr/bin/env python3
"""
ZEVQORA launch film - local narration generator (Kokoro-82M via kokoro-onnx).

Zero cost, fully offline once the model files exist. No paid API, no cloning.

Usage (from the project root):
    .tts/venv/bin/python scripts/generate-voice.py setup-check
    .tts/venv/bin/python scripts/generate-voice.py compare
    .tts/venv/bin/python scripts/generate-voice.py final

Model files (download once, legitimate sources only - see docs/AUDIO-LICENSES.md):
    .tts/models/kokoro-v1.0.onnx   (github.com/thewh1teagle/kokoro-onnx releases, model-files-v1.0)
    .tts/models/voices-v1.0.bin

Text lives in scripts/narration.json. Edit it there, never inline here.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfiltfilt

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / ".tts/models/kokoro-v1.0.onnx"
VOICES = ROOT / ".tts/models/voices-v1.0.bin"
NARRATION = ROOT / "scripts/narration.json"
OUT_VO = ROOT / "public/audio/vo"
OUT_CMP = ROOT / "public/audio/voice-compare"

SR_OUT = 48000
TARGET_LUFS = -18.0  # VO stem level before the final mix
COMPARE_VOICES = ["af_heart", "af_bella", "am_michael", "am_fenrir", "bm_george", "bf_emma"]
COMPARE_LINES = [
    "That's why we built ZEVQORA.",
    "We replay representative workloads against defined requirements. If quality drops, it's rejected.",
]


def load_cfg() -> dict:
    return json.loads(NARRATION.read_text())


def kokoro():
    from kokoro_onnx import Kokoro

    return Kokoro(str(MODEL), str(VOICES))


def phonemes_for(text: str, cfg: dict) -> str:
    """Phonemize text and pin the brand name to one locked pronunciation."""
    from kokoro_onnx.tokenizer import Tokenizer

    ph = Tokenizer().phonemize(text, cfg["lang"])
    if "ZEVQORA" in text.upper():
        locked = cfg["zevqoraPhonemes"]
        if locked not in ph:
            raise SystemExit(f"ZEVQORA pronunciation drifted in: {text!r} -> {ph!r}")
    return ph


def synth(k, text: str, voice: str, cfg: dict) -> np.ndarray:
    ph = phonemes_for(text, cfg)
    audio, sr = k.create(ph, voice=voice, speed=cfg["speed"], is_phonemes=True)
    audio = np.asarray(audio, dtype=np.float32)
    # 24 kHz -> 48 kHz, polyphase (no aliasing, no pitch change)
    audio = resample_poly(audio, SR_OUT // 1000, sr // 1000).astype(np.float32)
    return audio


def clean(audio: np.ndarray) -> np.ndarray:
    """Gentle processing only: rumble high-pass, silence trim, 8 ms edge fades."""
    sos = butter(2, 70, btype="highpass", fs=SR_OUT, output="sos")
    audio = sosfiltfilt(sos, audio).astype(np.float32)
    env = np.abs(audio)
    thr = max(env.max() * 0.02, 1e-4)
    idx = np.where(env > thr)[0]
    if len(idx):
        pad_in, pad_out = int(0.03 * SR_OUT), int(0.12 * SR_OUT)
        audio = audio[max(idx[0] - pad_in, 0) : min(idx[-1] + pad_out, len(audio))]
    f = int(0.008 * SR_OUT)
    ramp = np.linspace(0, 1, f, dtype=np.float32)
    audio[:f] *= ramp
    audio[-f:] *= ramp[::-1]
    return audio


def loudness(audio: np.ndarray) -> float:
    import pyloudnorm as pyln

    return pyln.Meter(SR_OUT).integrated_loudness(audio)


def cmd_setup_check():
    import os
    import platform

    import onnxruntime as ort

    print("python", sys.version.split()[0], "|", platform.platform())
    print("cpus", os.cpu_count(), "| onnxruntime", ort.__version__, ort.get_available_providers())
    for p in (MODEL, VOICES):
        print(p.name, "OK" if p.exists() else "MISSING", p.stat().st_size if p.exists() else "")


def cmd_compare():
    cfg = load_cfg()
    k = kokoro()
    OUT_CMP.mkdir(parents=True, exist_ok=True)
    for v in COMPARE_VOICES:
        clips = [clean(synth(k, t, v, cfg)) for t in COMPARE_LINES]
        gap = np.zeros(int(0.5 * SR_OUT), dtype=np.float32)
        a = np.concatenate([clips[0], gap, clips[1]])
        sf.write(OUT_CMP / f"{v}.wav", a, SR_OUT, subtype="PCM_24")
        print(f"{v}: {len(a)/SR_OUT:.2f}s  {loudness(a):.1f} LUFS")


def cmd_final():
    cfg = load_cfg()
    k = kokoro()
    OUT_VO.mkdir(parents=True, exist_ok=True)
    clips = {}
    for line in cfg["lines"]:
        clips[line["id"]] = clean(synth(k, line.get("say", line["text"]), cfg["voice"], cfg))

    # One gain for the whole performance, so line-to-line dynamics stay natural.
    joined = np.concatenate(list(clips.values()))
    gain_db = TARGET_LUFS - loudness(joined)
    gain = 10 ** (gain_db / 20)
    manifest = []
    for line in cfg["lines"]:
        a = clips[line["id"]] * gain
        peak = float(np.abs(a).max())
        if peak > 0.89:  # -1 dBFS safety
            a *= 0.89 / peak
        path = OUT_VO / f"{line['id']}.wav"
        sf.write(path, a, SR_OUT, subtype="PCM_24")
        manifest.append(
            {**line, "file": f"audio/vo/{line['id']}.wav", "seconds": round(len(a) / SR_OUT, 4)}
        )
        print(f"{line['id']}  {len(a)/SR_OUT:5.2f}s  {line['text']}")
    (OUT_VO / "manifest.json").write_text(
        json.dumps({"voice": cfg["voice"], "speed": cfg["speed"], "sampleRate": SR_OUT,
                    "gainDb": round(gain_db, 2), "lines": manifest}, indent=2, ensure_ascii=False)
    )
    print(f"VO gain {gain_db:+.2f} dB -> {TARGET_LUFS} LUFS; total speech {sum(m['seconds'] for m in manifest):.2f}s")


if __name__ == "__main__":
    {"setup-check": cmd_setup_check, "compare": cmd_compare, "final": cmd_final}[
        sys.argv[1] if len(sys.argv) > 1 else "final"
    ]()
