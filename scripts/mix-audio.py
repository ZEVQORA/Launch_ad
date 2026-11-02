#!/usr/bin/env python3
"""
Final mix for the ZEVQORA launch film.

  VO     - clips placed on src/config/timeline.json start times
  music  - ducked by a sidechain driven by the VO envelope (80 ms lookahead),
           with an extra dip in the 1.2-4.5 kHz presence band so consonants
           stay clear without the bed collapsing
  SFX    - as rendered by scripts/sound-design.py

Master: loudness normalised to -14 LUFS integrated, 4x-oversampled
lookahead limiter at -1.5 dBFS (true-peak target <= -1.0 dBTP).
Stems are written post-fader, so vo + music + sfx == pre-limiter mix.

    .tts/venv/bin/python scripts/mix-audio.py film
    .tts/venv/bin/python scripts/mix-audio.py teaser
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d
from scipy.signal import resample_poly

sys.path.insert(0, str(Path(__file__).resolve().parent))
from dsp import SR, bp  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src/config/timeline.json").read_text())
MAN = {l["id"]: l for l in json.loads((ROOT / "public/audio/vo/manifest.json").read_text())["lines"]}

TARGET_LUFS = -14.0
CEILING = 10 ** (-1.5 / 20)
MUSIC_GAIN_DB = -3.0      # music fader (bed already sits ~-20 LUFS)
SFX_GAIN_DB = -4.0
DUCK_DB = -9.0            # broadband duck under speech
PRESENCE_DUCK_DB = -5.0   # extra dip in the speech-presence band


def db(x):
    return 10 ** (x / 20)


def read(path, n):
    a, sr = sf.read(str(path), dtype="float64", always_2d=True)
    assert sr == SR, (path, sr)
    if a.shape[1] == 1:
        a = np.repeat(a, 2, axis=1)
    out = np.zeros((n, 2))
    out[: min(n, len(a))] = a[:n]
    return out


def duck_curve(vo, n):
    """0..1 'speech present' curve with lookahead, computed at 1 kHz control rate."""
    step = SR // 1000
    mono = np.abs(vo).mean(axis=1)
    rms = np.sqrt(np.maximum(uniform_filter1d(mono**2, size=int(0.03 * SR)), 0))[::step]
    active = (rms > db(-45)).astype(float)
    active = maximum_filter1d(active, size=180)   # bridge gaps between words (180 ms)
    look = 80                                     # 80 ms lookahead
    active = np.concatenate([active[look:], np.zeros(look)])
    env = smooth_env_ctrl(active, attack_s=0.06, release_s=0.45)  # runs at 1 kHz control rate
    return np.interp(np.arange(n) / step, np.arange(len(env)), env)


def smooth_env_ctrl(active, attack_s, release_s, rate=1000):
    a = np.exp(-1 / (attack_s * rate))
    r = np.exp(-1 / (release_s * rate))
    out = np.empty_like(active)
    y = 0.0
    for i, x in enumerate(active):
        c = a if x > y else r
        y = c * y + (1 - c) * x
        out[i] = y
    return out


def vo_compressor(x, thr_db=-20.0, ratio=2.5, knee_db=6.0, attack_s=0.004, release_s=0.09, rate=2000):
    """Gentle broadcast-style VO compressor (soft knee) at 2 kHz control rate."""
    step = SR // rate
    pk = np.abs(x).max(axis=1)
    n = len(pk) // step * step
    lvl = np.concatenate([pk[:n].reshape(-1, step).max(axis=1), [pk[n:].max()] if n < len(pk) else []])
    a, r = np.exp(-1 / (attack_s * rate)), np.exp(-1 / (release_s * rate))
    env = np.empty_like(lvl)
    y = 0.0
    for i, v in enumerate(lvl):
        c = a if v > y else r
        y = c * y + (1 - c) * v
        env[i] = y
    L = 20 * np.log10(np.maximum(env, 1e-9))
    over = L - thr_db
    gr = np.where(over <= -knee_db / 2, 0.0,
         np.where(over >= knee_db / 2, over * (1 - 1 / ratio),
                  (1 - 1 / ratio) * (over + knee_db / 2) ** 2 / (2 * knee_db)))
    g = np.interp(np.arange(len(x)) / step, np.arange(len(gr)), db(-gr))
    return x * g[:, None]


def limiter(x, ceiling=CEILING, release_s=0.12, look_s=0.005):
    """Lookahead peak limiter driven by a 4x-oversampled peak estimate."""
    up = resample_poly(x, 4, 1, axis=0)
    pk = np.abs(up).max(axis=1).reshape(-1, 4).max(axis=1)[: len(x)]
    pk = np.pad(pk, (0, len(x) - len(pk)))
    need = np.minimum(1.0, ceiling / np.maximum(pk, 1e-9))
    look = int(look_s * SR)
    need = minimum_filter1d(need, size=2 * look + 1)           # hold min over lookahead window
    need = np.concatenate([need[look:], np.ones(look)])
    # release smoothing at control rate
    step = 48
    ctrl = need[::step]
    r = np.exp(-1 / (release_s * SR / step))
    g = np.empty_like(ctrl)
    y = 1.0
    for i, v in enumerate(ctrl):
        y = v if v < y else r * y + (1 - r) * v
        g[i] = y
    g = np.interp(np.arange(len(x)) / step, np.arange(len(g)), g)
    g = np.minimum(g, need)
    return x * g[:, None], float(20 * np.log10(g.min()))


def true_peak_db(x):
    up = resample_poly(x, 4, 1, axis=0)
    return float(20 * np.log10(np.abs(up).max() + 1e-12))


def mix(which):
    cfg = TL[which]
    n = int(cfg["duration"] * SR)
    vo = np.zeros((n, 2))
    for lid, start in cfg["vo"].items():
        a = read(ROOT / "public" / MAN[lid]["file"], n)
        i = int(round(start * SR))
        seg = a[: int(MAN[lid]["seconds"] * SR) + 1]
        j = min(n, i + len(seg))
        vo[i:j] += seg[: j - i]

    vo = vo_compressor(vo)
    music = read(ROOT / f"public/audio/music/score-{which}.wav", n) * db(MUSIC_GAIN_DB)
    sfx = read(ROOT / f"public/audio/sfx/sfx-{which}.wav", n) * db(SFX_GAIN_DB)

    d = duck_curve(vo, n)[:, None]
    presence = bp(music, 1200, 4500)
    music_ducked = (music - presence) * db(DUCK_DB * d) + presence * db((DUCK_DB + PRESENCE_DUCK_DB) * d)

    pre = vo + music_ducked + sfx
    meter = pyln.Meter(SR)
    gain = db(TARGET_LUFS - meter.integrated_loudness(pre))
    stems = {"vo": vo * gain, "music": music_ducked * gain, "sfx": sfx * gain}
    master, gr = limiter(pre * gain)
    # second pass: limiter shaves a little loudness; correct once and re-limit
    trim = TARGET_LUFS - meter.integrated_loudness(master)
    if abs(trim) > 0.1:
        master, gr = limiter(pre * gain * db(trim))
        stems = {k: v * db(trim) for k, v in stems.items()}

    outdir = ROOT / "public/audio/mix"
    stemdir = ROOT / "public/audio/stems"
    outdir.mkdir(parents=True, exist_ok=True)
    stemdir.mkdir(parents=True, exist_ok=True)
    sf.write(outdir / f"{which}-mix.wav", master.astype(np.float32), SR, subtype="PCM_24")
    for k, v in stems.items():
        sf.write(stemdir / f"{which}-{k}.wav", v.astype(np.float32), SR, subtype="PCM_24")

    report = {
        "which": which,
        "duration_s": round(n / SR, 3),
        "integrated_lufs": round(meter.integrated_loudness(master), 2),
        "true_peak_dbtp_est": round(true_peak_db(master), 2),
        "max_limiter_gain_reduction_db": round(gr, 2),
        "stem_lufs": {k: round(meter.integrated_loudness(v), 1) for k, v in stems.items()},
        "music_under_speech_db": DUCK_DB,
    }
    (ROOT / "docs/qa").mkdir(parents=True, exist_ok=True)
    (ROOT / f"docs/qa/mix-{which}.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    mix(sys.argv[1] if len(sys.argv) > 1 else "film")
