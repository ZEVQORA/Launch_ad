#!/usr/bin/env python3
"""
Sound-design layer for the ZEVQORA launch film - every sound synthesised locally.

Each sound is placed on a named event from src/config/timeline.json, the same
events the Remotion scenes animate on, so picture and sound cannot drift.

    .tts/venv/bin/python scripts/sound-design.py film
    .tts/venv/bin/python scripts/sound-design.py teaser
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from dsp import SR, Bus, bp, env_adsr, hp, lp, midi_hz, pan2, peak_db, reverb_ir  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src/config/timeline.json").read_text())
RNG_SEED = 2026


def _t(d):
    return np.arange(int(d * SR)) / SR


def boom(gain=0.8, f_hi=70, f_lo=34, dur=2.2, drive=1.4):
    t = _t(dur)
    f = f_lo + (f_hi - f_lo) * np.exp(-t * 6)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    x += 0.5 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * np.exp(-t * 4)
    x = np.tanh(x * drive) / np.tanh(drive)
    return pan2(hp(x, 30) * gain, 0)


def thump(gain=0.4, seed=1, cutoff=280, decay=14):
    rng = np.random.default_rng(seed)
    t = _t(0.5)
    x = lp(rng.standard_normal(len(t)), cutoff) * np.exp(-t * decay) * 3
    return pan2(x * gain, 0)


def transient(gain=0.25, seed=2):
    """Bright, inharmonic 'glass' transient - precise rather than metallic-crash."""
    rng = np.random.default_rng(seed)
    t = _t(1.2)
    parts = [1870, 2633, 3410, 4290, 5521]
    x = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t * (5 + i * 2)) for i, f in enumerate(parts))
    x = x / len(parts) + hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 40) * 0.6
    return np.stack([x, np.roll(x, 37)], axis=1) * gain


def reverse_swell(dur=0.9, gain=0.3, seed=3):
    rng = np.random.default_rng(seed)
    t = _t(dur)
    x = bp(rng.standard_normal((len(t), 2)), 300, 9000) * np.exp(-(dur - t) * 5)[:, None]
    return x * gain


def blip(m, gain=0.12, dur=0.16, pan=0.0, fm=0.0):
    t = _t(dur)
    f = midi_hz(m)
    mod = fm * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 30)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 28) + 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 50)
    return pan2(x * env_adsr(len(t), 0.002, 0.02) * gain, pan)


def tick(gain=0.08, seed=4, pan=0.0, hz=3500):
    rng = np.random.default_rng(seed)
    t = _t(0.03)
    x = bp(rng.standard_normal(len(t)), hz * 0.6, hz * 1.6) * np.exp(-t * 300)
    return pan2(x * gain, pan)


def whoosh(dur=0.8, gain=0.18, pan_from=-0.7, pan_to=0.7, f0=400, f1=4000, seed=5, reverse=False):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    u = np.arange(n) / n
    noise = rng.standard_normal(n)
    centers = np.geomspace(f0, f1, 6)
    x = np.zeros(n)
    pos = u * 5
    for i, c in enumerate(centers):
        x += bp(noise, c / 1.6, c * 1.6) * np.clip(1 - np.abs(pos - i), 0, 1)
    amp = np.sin(np.pi * u) ** 2 if not reverse else u**3
    x *= amp
    p = pan_from + (pan_to - pan_from) * u
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1) * gain


def bell(m, dur=1.6, gain=0.1, pan=0.0):
    t = _t(dur)
    f = midi_hz(m)
    ratios = [(1, 1.0, 3.0), (2.0, 0.35, 5.0), (3.01, 0.18, 7.0), (4.2, 0.08, 10.0)]
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in ratios)
    return pan2(x * env_adsr(len(t), 0.004, 0.2) * gain, pan)


def confirm(gain=0.14):
    """VERIFIED: a calm rising perfect fourth. Resolved, never celebratory."""
    out = np.zeros((int(1.9 * SR), 2))
    a = bell(81, 1.6, gain, -0.1)   # A5
    b = bell(86, 1.7, gain * 0.9, 0.1)  # D6
    out[: len(a)] += a
    k = int(0.11 * SR)
    out[k : k + len(b)] += b[: len(out) - k]
    return out


def reject(gain=0.22):
    """REJECTED: two muted, falling low tones. Firm, not cartoonish."""
    def tone(m, d=0.32):
        t = _t(d)
        f = midi_hz(m)
        x = np.tanh(2.2 * np.sin(2 * np.pi * f * t)) * np.exp(-t * 11)
        return lp(x, 900)
    out = np.zeros(int(0.7 * SR))
    a, b = tone(57), tone(53)   # A3 -> F3
    out[: len(a)] += a
    k = int(0.14 * SR)
    out[k : k + len(b)] += b
    return pan2(out * gain, 0)


def incomplete(gain=0.12):
    """INCOMPLETE: one neutral suspended tone that does not resolve."""
    t = _t(1.3)
    x = (np.sin(2 * np.pi * midi_hz(76) * t) + 0.6 * np.sin(2 * np.pi * midi_hz(81) * t))
    x *= np.exp(-t * 3.2) * (0.85 + 0.15 * np.sin(2 * np.pi * 7 * t))
    return pan2(lp(x, 4000) * env_adsr(len(t), 0.01, 0.3) * gain, 0)


def glint(gain=0.05, seed=6):
    rng = np.random.default_rng(seed)
    out = np.zeros((int(1.2 * SR), 2))
    for i in range(5):
        b = bell(88 + [0, 3, 7, 10, 12][i], 0.9, gain * (1 - i * 0.12), pan=rng.uniform(-0.6, 0.6))
        k = int(i * 0.06 * SR)
        out[k : k + len(b)] += b[: len(out) - k]
    return out


def place_impact(bus, at, big=False):
    sw = reverse_swell(0.9 if big else 0.7, 0.22 if big else 0.16)
    bus.add(sw, at - len(sw) / SR, send=0.3)
    bus.add(boom(0.85 if big else 0.7), at)
    bus.add(thump(0.35), at)
    bus.add(transient(0.2 if big else 0.14), at, send=0.6)


def film():
    E = TL["film"]["events"]
    b = Bus(TL["film"]["duration"] + 3)
    pent = [62, 65, 67, 69, 72, 74, 77, 79]  # D minor pentatonic, upper register

    # Opening
    b.add(boom(0.75, f_hi=60, f_lo=30, dur=2.6), E["openImpact"])
    b.add(thump(0.3), E["openImpact"])
    b.add(whoosh(1.6, 0.06, -0.2, 0.2, 2000, 9000, seed=11), E["openImpact"] + 0.05, send=0.5)
    for i, t in enumerate([E["seed"] + d for d in (0.0, 0.3, 0.53, 0.8, 1.02)]):
        b.add(blip(pent[i % 5], 0.06, pan=-0.4 + 0.2 * i), t, send=0.4)

    # Cost: graph waves + a token-tick stream that accelerates
    for k, (ev, m) in enumerate([("tokens", 69), ("models", 72), ("retries", 74), ("costs", 62)]):
        for j in range(3 if ev != "costs" else 1):
            b.add(blip(m + (j * 3 if ev != "costs" else 0), 0.08, pan=(-0.5 + j * 0.5), fm=0.8), E[ev] + j * 0.09, send=0.35)
    for j in range(4):
        b.add(blip(74, 0.05, pan=0.6, fm=1.2), E["retries"] + 0.35 + j * 0.22, send=0.2)
    t, i = 6.3, 0
    while t < 11.6:
        b.add(tick(0.03 + 0.03 * (t - 6.3) / 5.3, seed=40 + i, pan=np.sin(i) * 0.6), t)
        t += max(0.045, 0.22 * (1 - (t - 6.3) / 6.0))
        i += 1
    b.add(whoosh(0.9, 0.16, -0.6, 0.6, seed=12), E["costWhoosh"] - 0.3, send=0.3)

    # Risk
    b.add(tick(0.1, seed=60, hz=2500), E["obviousFix"])
    b.add(blip(74, 0.07), E["candidate"], send=0.4)
    b.add(blip(79, 0.06), E["candidate"] + 0.1, send=0.4)
    for j in range(7):
        b.add(blip(50 - (j % 2), 0.05, dur=0.12, pan=-0.3 + 0.1 * j), E["quietFail"] + j * 0.19, send=0.2)
    b.add(reject(0.24), E["rejectStamp"], send=0.25)
    b.add(thump(0.3, seed=12, cutoff=200), E["rejectStamp"])
    b.add(whoosh(E["preHitSilence"] - E["collapseStart"], 0.14, 0.7, -0.0, 600, 6000, seed=13, reverse=True),
          E["collapseStart"], send=0.2)

    # Reveal
    place_impact(b, E["revealImpact"], big=True)
    b.add(glint(0.05), E["wordmark"], send=0.8)

    # Product
    b.add(whoosh(0.7, 0.12, 0.5, -0.5, seed=14), E["toProduct"], send=0.3)
    for j in range(8):
        b.add(blip(pent[j], 0.055, pan=-0.6 + j * 0.17), 28.0 + j * 0.2, send=0.35)
    b.add(blip(55, 0.08, dur=0.4, fm=2.0), E["diagnose"] + 0.5, send=0.3)
    b.add(blip(69, 0.06), E["plan"], send=0.3)
    b.add(blip(74, 0.06), E["plan"] + 0.12, send=0.3)
    for j in range(3):
        b.add(tick(0.06, seed=70 + j, hz=4000), E["measure"] + j * 0.12)
    for j in range(16):
        b.add(tick(0.045, seed=80 + j, pan=-0.5 + (j % 5) * 0.25, hz=3000 + (j % 3) * 600), 36.4 + j * 0.22)
    b.add(whoosh(0.8, 0.13, -0.5, 0.5, seed=15), E["verifyStep"], send=0.3)

    # Verification
    b.add(confirm(0.13), E["verifiedChime"], send=0.5)
    b.add(reject(0.2), E["rejectedTone"], send=0.25)
    b.add(incomplete(0.11), E["incompleteTone"], send=0.4)
    b.add(thump(0.22, seed=21, cutoff=220), E["noBlind"])
    b.add(thump(0.22, seed=22, cutoff=220), E["noManufactured"])

    # Finale
    for k in ("wMeasure", "wReplay", "wVerify", "wOptimize"):
        b.add(tick(0.07, seed=90, hz=2800), E[k])
        b.add(thump(0.18, seed=23, cutoff=160), E[k])
    b.add(whoosh(E["logoHit"] - E["collapseToLogo"], 0.12, 0.0, 0.0, 800, 8000, seed=16, reverse=True), E["collapseToLogo"])
    place_impact(b, E["logoHit"], big=True)
    b.add(glint(0.045, seed=7), E["tagline"] + 0.55, send=0.8)
    return finish(b, TL["film"]["duration"])


def teaser():
    E = TL["teaser"]["events"]
    b = Bus(TL["teaser"]["duration"] + 3)
    b.add(boom(0.6, f_hi=60, f_lo=30, dur=2.2), E["openImpact"])
    b.add(blip(74, 0.07), E["candidate"], send=0.4)
    b.add(blip(79, 0.06), E["candidate"] + 0.1, send=0.4)
    for j in range(5):
        b.add(blip(50 - (j % 2), 0.05, dur=0.12), E["quietFail"] + j * 0.2, send=0.2)
    b.add(reject(0.24), E["rejectStamp"], send=0.25)
    b.add(whoosh(1.1, 0.14, 0.7, 0.0, 600, 6000, seed=13, reverse=True), E["preHitSilence"] - 1.1, send=0.2)
    place_impact(b, E["revealImpact"], big=True)
    b.add(glint(0.05), E["wordmark"], send=0.8)
    for k in ("wMeasure", "wReplay", "wVerify", "wOptimize"):
        b.add(tick(0.07, seed=90, hz=2800), E[k])
        b.add(thump(0.18, seed=23, cutoff=160), E[k])
    b.add(whoosh(0.35, 0.12, 0, 0, 800, 8000, seed=16, reverse=True), E["logoHit"] - 0.35)
    place_impact(b, E["logoHit"], big=True)
    b.add(glint(0.045, seed=7), E["tagline"] + 0.55, send=0.8)
    return finish(b, TL["teaser"]["duration"])


def finish(b, dur):
    x = b.render(reverb_ir(seconds=2.4, rt=1.8, seed=21), wet=0.8)[: int(dur * SR)]
    return hp(x, 28)


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "film"
    x = {"film": film, "teaser": teaser}[which]()
    out = ROOT / f"public/audio/sfx/sfx-{which}.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, x.astype(np.float32), SR, subtype="PCM_24")
    print(f"{out.relative_to(ROOT)}  {len(x)/SR:.2f}s  peak {peak_db(x):.1f} dBFS")
