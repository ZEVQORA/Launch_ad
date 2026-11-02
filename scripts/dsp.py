"""
Shared, deterministic DSP toolkit for the ZEVQORA launch film score and SFX.

Everything here is synthesised from first principles with numpy/scipy - no
samples, no loops, no third-party audio. Every random source is a seeded
generator, so a re-run reproduces the exact same audio bit-for-bit.
"""
from __future__ import annotations

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt, sosfiltfilt

SR = 48000


def midi_hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(round(dur * SR))) / SR


def lp(x, hz, order=2):
    return sosfiltfilt(butter(order, min(hz, SR * 0.45), "lowpass", fs=SR, output="sos"), x, axis=0)


def hp(x, hz, order=2):
    return sosfiltfilt(butter(order, hz, "highpass", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfiltfilt(butter(order, [lo, min(hi, SR * 0.45)], "bandpass", fs=SR, output="sos"), x, axis=0)


def pan2(x: np.ndarray, pan: float) -> np.ndarray:
    """Equal-power pan, pan in [-1, 1]."""
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def env_adsr(n: int, a: float, r: float, curve: float = 2.0) -> np.ndarray:
    """Attack/release envelope over n samples (seconds for a and r)."""
    e = np.ones(n)
    na, nr = min(int(a * SR), n), min(int(r * SR), n)
    if na:
        e[:na] = np.linspace(0, 1, na) ** curve
    if nr:
        e[n - nr :] *= np.linspace(1, 0, nr) ** curve
    return e


# ---------- oscillators ------------------------------------------------------

_TABLES: dict[int, np.ndarray] = {}


def _saw_table(max_h: int) -> np.ndarray:
    if max_h not in _TABLES:
        ph = np.arange(4096) / 4096
        tbl = sum(np.sin(2 * np.pi * k * ph) / k for k in range(1, max_h + 1))
        _TABLES[max_h] = (tbl / np.abs(tbl).max()).astype(np.float64)
    return _TABLES[max_h]


def saw(freq: float, n: int, phase0: float = 0.0, bright: float = 9000) -> np.ndarray:
    """Band-limited wavetable saw (harmonics kept below `bright` Hz)."""
    max_h = int(max(1, min(64, bright // freq)))
    tbl = _saw_table(max_h)
    ph = (phase0 + freq * np.arange(n) / SR) % 1.0
    return np.interp(ph * 4096, np.arange(4097), np.append(tbl, tbl[0]))


def sine(freq, n, phase0=0.0):
    return np.sin(2 * np.pi * (phase0 + freq * np.arange(n) / SR))


# ---------- instruments ------------------------------------------------------


def pad(notes, dur, attack=1.5, release=2.0, cutoff=1800, detune_c=7, gain=0.1, seed=0, air=0.0):
    """Wide analog-style string pad: 3 detuned band-limited saws per note, stereo."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    for m in notes:
        f = midi_hz(m)
        for d, side in ((-detune_c, 0), (0, 2), (detune_c, 1)):
            ff = f * 2 ** (d / 1200)
            w = saw(ff, n, rng.random(), bright=cutoff * 3)
            if side in (0, 2):
                L += w
            if side in (1, 2):
                R += w
    st = np.stack([L, R], axis=1) / (len(notes) * 2)
    st = lp(st, cutoff, order=2)
    if air:
        st += air * hp(rng.standard_normal((n, 2)), 6000) * 0.02
    return st * env_adsr(n, attack, release)[:, None] * gain


def pluck(m, dur=0.6, gain=0.1, decay=5.0, bright=10, pan=0.0):
    """Additive pluck: upper harmonics decay faster - reads as a filtered synth pluck."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi_hz(m)
    x = np.zeros(n)
    for k in range(1, bright + 1):
        if f * k > 16000:
            break
        x += np.sin(2 * np.pi * f * k * t) / k * np.exp(-t * decay * (1 + 0.6 * (k - 1)))
    x *= env_adsr(n, 0.003, 0.05)
    return pan2(x * gain, pan)


def kick(gain=0.5, dur=0.5, f_hi=110, f_lo=44):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f_lo + (f_hi - f_lo) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7.0)
    x = np.tanh(x * 1.6) / np.tanh(1.6)
    return pan2(x * gain, 0.0)


def hat(gain=0.03, dur=0.08, seed=1, pan=0.0):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 7500) * np.exp(-t * 60)
    return pan2(x * gain, pan)


def rim(gain=0.05, seed=2):
    rng = np.random.default_rng(seed)
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 1400, 5200) * np.exp(-t * 30) * 0.7
    x += np.sin(2 * np.pi * 185 * t) * np.exp(-t * 40)
    return pan2(x * gain, 0.0)


def riser(dur, gain=0.12, f0=180, f1=2400, seed=3):
    """Noise + tone riser with accelerating amplitude; crossfades through 8 bands."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    noise = rng.standard_normal((n, 2))
    centers = np.geomspace(f0, f1, 8)
    out = np.zeros((n, 2))
    pos = u * (len(centers) - 1)
    for i, c in enumerate(centers):
        w = np.clip(1 - np.abs(pos - i), 0, 1)
        out += bp(noise, c / 1.5, c * 1.5) * w[:, None]
    tone_f = f0 * (f1 / f0) ** (u**1.4) * 0.5
    tone = np.sin(2 * np.pi * np.cumsum(tone_f) / SR) * 0.25
    out += np.stack([tone, tone], axis=1)
    amp = u**2.6
    return out * amp[:, None] * gain


def sub_drone(m, dur, gain=0.1, attack=1.0, release=1.5):
    n = int(dur * SR)
    f = midi_hz(m)
    x = sine(f, n) + 0.25 * sine(2 * f, n)
    x = np.tanh(x * 1.2)
    return pan2(x * env_adsr(n, attack, release) * gain, 0.0)


def shimmer(notes, dur, gain=0.03, seed=5):
    """Slowly breathing high partials; lives mostly in the reverb."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for i, m in enumerate(notes):
        f = midi_hz(m)
        lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (0.13 + 0.07 * i) * t + rng.random() * 6.28)
        out += pan2(sine(f, n, rng.random()) * lfo, -0.6 + 1.2 * i / max(len(notes) - 1, 1))
    return out * env_adsr(n, 1.2, 1.8)[:, None] * gain / len(notes)


# ---------- space ------------------------------------------------------------


def reverb_ir(seconds=3.2, rt=2.6, predelay=0.022, seed=11, dark=4500):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.9 * t / rt)
    ir = rng.standard_normal((n, 2)) * decay[:, None]
    # tail darkens over time: crossfade a bright and a dark version
    dark_ir = lp(ir, dark * 0.35)
    bright_ir = lp(ir, dark)
    mix = np.clip(t / (rt * 0.6), 0, 1)[:, None]
    ir = bright_ir * (1 - mix) + dark_ir * mix
    pre = np.zeros((int(predelay * SR), 2))
    ir = np.vstack([pre, ir])
    return ir / np.sqrt((ir**2).sum(axis=0, keepdims=True))


def reverb(x, ir, wet=0.25):
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return y * wet


class Bus:
    """A stereo timeline buffer with a dry and a reverb-send layer."""

    def __init__(self, seconds: float):
        self.n = int(round(seconds * SR))
        self.dry = np.zeros((self.n, 2))
        self.send = np.zeros((self.n, 2))

    def add(self, sig: np.ndarray, at: float, send: float = 0.0, dry: float = 1.0):
        i = int(round(at * SR))
        if i >= self.n:
            return
        j = min(self.n, i + len(sig))
        seg = sig[: j - i]
        self.dry[i:j] += seg * dry
        if send:
            self.send[i:j] += seg * send

    def render(self, ir, wet=1.0):
        return self.dry + reverb(self.send, ir, wet)


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive) if drive > 0 else x


def peak_db(x):
    return 20 * np.log10(np.abs(x).max() + 1e-12)
