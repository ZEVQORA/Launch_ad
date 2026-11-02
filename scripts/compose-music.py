#!/usr/bin/env python3
"""
Original score for "THAT'S WHY WE BUILT ZEVQORA" - composed and rendered locally.

No samples, no loops, no third-party music. Harmony is a D-minor / F-major
world (Dm9 - Bbmaj7 - Fadd9 - Cadd9) voiced as open synthetic strings. The
arrangement is driven by the cue points in src/config/timeline.json, so the
music follows the film rather than the film following the music.

    .tts/venv/bin/python scripts/compose-music.py film
    .tts/venv/bin/python scripts/compose-music.py teaser
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from dsp import (SR, Bus, hat, hp, kick, pad, peak_db, pluck, reverb_ir, rim, riser,  # noqa: E402
                 shimmer, soft_clip, sub_drone)

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src/config/timeline.json").read_text())

BPM = 96
BEAT = 60 / BPM          # 0.625 s
BAR = 4 * BEAT           # 2.5 s

# Voicings (MIDI). Open, low-mid heavy so the narration sits on top.
DM9 = [50, 57, 62, 64, 65]          # D3 A3 D4 E4 F4
DM_TENSE = [50, 57, 63, 65]         # Phrygian b2 rub - the "risk" colour
BBMAJ7 = [46, 53, 57, 60, 62]       # Bb2 F3 A3 C4 D4
BBMAJ9 = [46, 53, 57, 60, 62, 69]
FADD9 = [53, 60, 67, 69]            # F3 C4 G4 A4
F69 = [53, 60, 62, 67, 69, 72]      # F6/9 - the resolution
CADD9 = [48, 55, 62, 64]            # C3 G3 D4 E4
ROOTS = {"Dm": 38, "Bb": 34, "F": 41, "C": 36}
PROG = [("Dm", DM9), ("Bb", BBMAJ7), ("F", FADD9), ("C", CADD9)]


def grid(t0, t1, step, offset=0.0):
    """Beat grid points in [t0, t1) aligned to an absolute 0-based grid."""
    k0 = int(np.ceil((t0 - offset) / step - 1e-9))
    out = []
    t = offset + k0 * step
    while t < t1 - 1e-9:
        out.append(round(t, 6))
        t += step
    return out


def pulse_line(bus, t0, t1, notes, gain, decay=7.0, bright=8, send=0.25, swell=(1.0, 1.0)):
    pts = grid(t0, t1, BEAT / 2)
    for i, t in enumerate(pts):
        u = (t - t0) / max(t1 - t0, 1e-6)
        g = gain * (swell[0] + (swell[1] - swell[0]) * u)
        bus.add(pluck(notes[i % len(notes)], 0.45, g, decay, bright, pan=-0.25 if i % 2 else 0.25), t, send)


def groove(bus, t0, t1, energy=1.0, snare=False):
    """Restrained confident rhythm: kick on 1 & 3, soft offbeat hats, rim on 2 & 4."""
    for t in grid(t0, t1, BAR / 2):
        bus.add(kick(0.36 * energy), t, send=0.05)
    for i, t in enumerate(grid(t0, t1, BEAT / 2)):
        if i % 2:
            bus.add(hat(0.022 * energy, seed=100 + i, pan=0.3), t, send=0.1)
    if snare:
        for t in grid(t0, t1, BAR / 2, offset=BEAT):
            bus.add(rim(0.05 * energy, seed=7), t, send=0.3)


def chords_bass(bus, t0, t1, gain_pad=0.11, gain_bass=0.12, cutoff=2400, start_idx=0):
    t = t0
    i = start_idx
    while t < t1 - 1e-6:
        name, v = PROG[i % 4]
        d = min(BAR, t1 - t)
        bus.add(pad(v, d + 0.6, attack=0.25, release=0.6, cutoff=cutoff, gain=gain_pad, seed=i), t, send=0.35)
        for k, tb in enumerate(grid(t, t + d, BEAT / 2)):
            bus.add(pluck(ROOTS[name] + (12 if k % 4 == 3 else 0), 0.3, gain_bass, 9.0, 5), tb, send=0.03)
        t += d
        i += 1


def arp(bus, t0, t1, gain=0.035, start_idx=0):
    t = t0
    i = start_idx
    while t < t1 - 1e-6:
        _, v = PROG[i % 4]
        notes = [m + 12 for m in v[1:]]
        for k, ta in enumerate(grid(t, min(t + BAR, t1), BEAT / 4)):
            bus.add(pluck(notes[k % len(notes)], 0.25, gain, 11.0, 6, pan=np.sin(k * 0.9) * 0.6), ta, send=0.45)
        t += BAR
        i += 1


def stab(bus, t, notes, gain=0.13, length=0.9):
    bus.add(pad(notes, length, attack=0.01, release=0.7, cutoff=3200, gain=gain, seed=int(t * 10)), t, send=0.6)
    bus.add(sub_drone(notes[0] - 12, length, 0.14, attack=0.005, release=0.6), t)


def gap_mask(n, holes):
    """Gain curve that carves silence holes [(t0, t1)] with 25 ms ramps."""
    g = np.ones(n)
    r = int(0.025 * SR)
    for a, b in holes:
        i, j = int(a * SR), min(int(b * SR), n)
        g[i:j] = 0
        g[max(i - r, 0):i] *= np.linspace(1, 0, min(r, i))
        g[j:j + r] *= np.linspace(0, 1, len(g[j:j + r]))
    return g


def film():
    E = TL["film"]["events"]
    dur = TL["film"]["duration"]
    b = Bus(dur + 4)

    # A - atmosphere (0-6): low Dm9 bed + air + sub
    b.add(pad(DM9, 6.6, attack=2.2, release=1.0, cutoff=900, gain=0.12, seed=1, air=1.0), E["openImpact"], send=0.6)
    b.add(sub_drone(38, 12.0, 0.09, attack=2.5, release=1.5), E["openImpact"])

    # B - growth (6-12): minimal pulse opens up, harmony moves to Bb
    b.add(pad(DM9, 3.4, attack=0.4, release=1.0, cutoff=1300, gain=0.11, seed=2), 6.0, send=0.5)
    b.add(pad(BBMAJ7, 3.4, attack=0.6, release=1.2, cutoff=1500, gain=0.11, seed=3), 9.0, send=0.5)
    pulse_line(b, 6.0, 12.0, [50, 57, 62, 57], 0.07, decay=8, bright=6, swell=(0.5, 1.2))
    for t in grid(9.0, 12.0, BAR / 2):
        b.add(kick(0.22, f_hi=80, f_lo=40), t)

    # C - risk (12-22.86): tension cluster, ticking clock, heartbeat, riser, then a hard cut
    b.add(pad(DM_TENSE, 4.6, attack=0.8, release=1.0, cutoff=1100, gain=0.12, seed=4), 12.0, send=0.5)
    b.add(pad(BBMAJ7, 3.6, attack=0.8, release=1.0, cutoff=1000, gain=0.11, seed=5), 16.0, send=0.5)
    b.add(pad(DM_TENSE, 4.2, attack=0.8, release=0.2, cutoff=1400, gain=0.13, seed=6), 19.0, send=0.5)
    b.add(sub_drone(38, 10.9, 0.10, attack=1.0, release=0.1), 12.0)
    pulse_line(b, 12.0, 21.2, [50, 51, 50, 57], 0.055, decay=10, bright=5)
    for i, t in enumerate(grid(16.0, 22.8, BEAT / 4)):
        b.add(hat(0.012 + 0.012 * (t - 16) / 7, seed=300 + i, pan=0.5 if i % 2 else -0.5), t)
    for t in grid(16.0, 22.8, BEAT):
        b.add(kick(0.24, f_hi=70, f_lo=38), t)
    b.add(riser(E["preHitSilence"] - 20.9, gain=0.16), 20.9)

    # D - reveal (23-27.5): wide Bbmaj9 -> Fadd9, shimmer
    b.add(pad(BBMAJ9, 2.9, attack=0.02, release=1.2, cutoff=3200, gain=0.13, seed=7), E["revealImpact"], send=0.7)
    b.add(pad(FADD9, 2.6, attack=0.5, release=1.0, cutoff=3000, gain=0.12, seed=8), 25.5, send=0.7)
    b.add(shimmer([81, 84, 88, 91], 4.6, 0.05), E["revealImpact"], send=1.0, dry=0.6)
    b.add(sub_drone(34, 2.8, 0.13, attack=0.01, release=1.2), E["revealImpact"])
    b.add(sub_drone(41, 2.2, 0.10, attack=0.4, release=0.8), 25.5)

    # E - product (27.5-40.8): confident progression, groove builds
    chords_bass(b, 27.5, 40.8, gain_pad=0.095, gain_bass=0.10, cutoff=2000)
    groove(b, 27.5, 40.8, energy=0.85)
    arp(b, 32.5, 40.8, gain=0.028)

    # F - verification (40.8-54): fuller, then the drums drop for the two "No" lines
    chords_bass(b, 40.8, 49.9, gain_pad=0.10, gain_bass=0.11, cutoff=2600, start_idx=1)
    groove(b, 40.8, 49.9, energy=1.0, snare=True)
    arp(b, 40.8, 49.9, gain=0.032, start_idx=1)
    b.add(pad(BBMAJ7, 2.3, attack=0.3, release=0.8, cutoff=1500, gain=0.10, seed=9), 49.9, send=0.6)
    b.add(pad(DM9, 2.4, attack=0.3, release=0.5, cutoff=1700, gain=0.10, seed=10), 52.0, send=0.6)
    pulse_line(b, 49.9, 54.3, [50, 57, 62, 57], 0.05, decay=8, bright=6, swell=(0.7, 1.3))
    b.add(riser(54.3 - 51.8, gain=0.11, f0=250, f1=3000, seed=4), 51.8)

    # G - finale words: one chord stab per word, then a breath before the logo
    stab(b, E["wMeasure"], DM9)
    stab(b, E["wReplay"], BBMAJ7)
    stab(b, E["wVerify"], FADD9)
    stab(b, E["wOptimize"], CADD9 + [67], gain=0.14, length=1.3)
    b.add(riser(E["collapseToLogo"] - 57.3, gain=0.09, f0=400, f1=4000, seed=8), 57.3)

    # H - resolution: Bbmaj9 bloom -> F6/9 under "Make AI lighter."
    b.add(pad(BBMAJ9, 2.2, attack=0.02, release=1.0, cutoff=3400, gain=0.14, seed=12), E["logoHit"], send=0.8)
    b.add(pad(F69, 4.8, attack=0.6, release=2.5, cutoff=3000, gain=0.13, seed=13), E["tagline"] - 0.3, send=0.8)
    b.add(shimmer([84, 88, 91, 96], 5.0, 0.05, seed=9), E["logoHit"], send=1.0, dry=0.6)
    b.add(sub_drone(34, 2.0, 0.12, attack=0.01, release=1.0), E["logoHit"])
    b.add(sub_drone(41, 4.0, 0.11, attack=0.6, release=2.4), E["tagline"] - 0.3)

    x = b.render(reverb_ir(), wet=1.0)
    holes = [(E["preHitSilence"], E["revealImpact"]), (E["collapseToLogo"] + 0.05, E["logoHit"])]
    x *= gap_mask(len(x), holes)[:, None]
    return finish(x, dur, E["fadeOut"])


def teaser():
    E = TL["teaser"]["events"]
    dur = TL["teaser"]["duration"]
    b = Bus(dur + 4)
    b.add(pad(DM_TENSE, 6.0, attack=0.6, release=0.2, cutoff=1300, gain=0.12, seed=4), 0.0, send=0.5)
    b.add(sub_drone(38, 5.86, 0.10, attack=0.6, release=0.1), 0.0)
    pulse_line(b, 0.2, 5.0, [50, 51, 50, 57], 0.06, decay=10, bright=5)
    for i, t in enumerate(grid(2.5, 5.8, BEAT / 4)):
        b.add(hat(0.015, seed=300 + i, pan=0.5 if i % 2 else -0.5), t)
    for t in grid(2.5, 5.8, BEAT):
        b.add(kick(0.24, f_hi=70, f_lo=38), t)
    b.add(riser(E["preHitSilence"] - 4.6, gain=0.16), 4.6)
    b.add(pad(BBMAJ9, 2.6, attack=0.02, release=1.0, cutoff=3200, gain=0.13, seed=7), E["revealImpact"], send=0.7)
    b.add(pad(FADD9, 2.2, attack=0.4, release=0.8, cutoff=2600, gain=0.11, seed=8), 8.2, send=0.6)
    b.add(shimmer([81, 84, 88, 91], 4.0, 0.05), E["revealImpact"], send=1.0, dry=0.6)
    b.add(sub_drone(34, 2.8, 0.13, attack=0.01, release=1.2), E["revealImpact"])
    pulse_line(b, 8.2, 10.0, [53, 60, 65, 60], 0.05, decay=8, bright=6, swell=(0.6, 1.2))
    stab(b, E["wMeasure"], DM9)
    stab(b, E["wReplay"], BBMAJ7)
    stab(b, E["wVerify"], FADD9)
    stab(b, E["wOptimize"], CADD9 + [67], gain=0.14, length=1.3)
    b.add(riser(E["logoHit"] - 0.3 - 12.8, gain=0.09, f0=400, f1=4000, seed=8), 12.8)
    b.add(pad(BBMAJ9, 1.6, attack=0.02, release=0.8, cutoff=3400, gain=0.14, seed=12), E["logoHit"], send=0.8)
    b.add(pad(F69, 4.0, attack=0.5, release=2.0, cutoff=3000, gain=0.13, seed=13), E["tagline"] - 0.3, send=0.8)
    b.add(shimmer([84, 88, 91, 96], 4.5, 0.05, seed=9), E["logoHit"], send=1.0, dry=0.6)
    b.add(sub_drone(34, 1.6, 0.12, attack=0.01, release=0.8), E["logoHit"])
    b.add(sub_drone(41, 3.6, 0.11, attack=0.5, release=2.0), E["tagline"] - 0.3)
    x = b.render(reverb_ir(), wet=1.0)
    holes = [(E["preHitSilence"], E["revealImpact"]), (E["logoHit"] - 0.3, E["logoHit"])]
    x *= gap_mask(len(x), holes)[:, None]
    return finish(x, dur, E["fadeOut"])


def finish(x, dur, fade_at):
    n = int(dur * SR)
    x = hp(x[:n], 35)
    f0 = int(fade_at * SR)
    x[f0:] *= np.linspace(1, 0, n - f0)[:, None] ** 1.5
    x = soft_clip(x / (np.abs(x).max() + 1e-9) * 0.9, drive=1.1) * 0.6  # leave headroom for the mix
    return x


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "film"
    x = {"film": film, "teaser": teaser}[which]()
    out = ROOT / f"public/audio/music/score-{which}.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, x.astype(np.float32), SR, subtype="PCM_24")
    print(f"{out.relative_to(ROOT)}  {len(x)/SR:.2f}s  peak {peak_db(x):.1f} dBFS")
