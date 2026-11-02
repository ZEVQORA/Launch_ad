import { Easing, interpolate, random } from "remotion";
import { EASE_EXIT, EASE_STANDARD } from "../config/brand";

export const easeStd = Easing.bezier(...EASE_STANDARD);
export const easeExit = Easing.bezier(...EASE_EXIT);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);

/** 0 -> 1 over [start, start + dur], clamped, with the brand ease. */
export const ramp = (frame: number, start: number, dur: number, ease = easeStd) =>
  interpolate(frame, [start, start + Math.max(dur, 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

/** Fade in at [a, a+inDur], hold, fade out at [b-outDur, b]. */
export const window01 = (frame: number, a: number, b: number, inDur = 12, outDur = 12) =>
  Math.min(ramp(frame, a, inDur), 1 - ramp(frame, b - outDur, outDur, easeExit));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic pseudo-random in [0,1) - safe for rendering (Remotion's seeded random). */
export const rnd = (seed: string | number) => random(`zq-${seed}`);

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Piecewise keyframes: [[frame, value], ...] with brand easing between keys. */
export const keys = (frame: number, kf: [number, number][], ease = easeInOut) => {
  if (frame <= kf[0][0]) return kf[0][1];
  for (let i = 0; i < kf.length - 1; i++) {
    const [f0, v0] = kf[i];
    const [f1, v1] = kf[i + 1];
    if (frame <= f1) return lerp(v0, v1, ease((frame - f0) / Math.max(f1 - f0, 1)));
  }
  return kf[kf.length - 1][1];
};
