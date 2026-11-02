/**
 * Frame-accurate timeline derived from the same JSON the audio pipeline uses.
 * Never hard-code a frame number in a scene - ask this module.
 */
import raw from "./timeline.json";
import words from "./words.json";
import manifest from "../../public/audio/vo/manifest.json";

export const FPS = raw.fps;
export const f = (seconds: number) => Math.round(seconds * FPS);

type Cut = "film" | "teaser";
type WordsMap = Record<string, { w: string; s: number; e: number }[]>;
const W = words as WordsMap;
const DUR: Record<string, number> = Object.fromEntries(
  manifest.lines.map((l: { id: string; seconds: number }) => [l.id, l.seconds]),
);

export const FILM_FRAMES = f(raw.film.duration);
export const TEASER_FRAMES = f(raw.teaser.duration);

export type SceneName = keyof typeof raw.film.scenes;
export const SCENES = Object.fromEntries(
  Object.entries(raw.film.scenes).map(([k, [a, b]]) => [k, { from: f(a), to: f(b) }]),
) as Record<SceneName, { from: number; to: number }>;

export const ev = (name: string, cut: Cut = "film"): number => {
  const e = (raw[cut].events as Record<string, number>)[name];
  if (e === undefined) throw new Error(`Unknown event ${name} in ${cut}`);
  return f(e);
};

export const voStart = (id: string, cut: Cut = "film"): number => {
  const s = (raw[cut].vo as Record<string, number>)[id];
  if (s === undefined) throw new Error(`VO ${id} not placed in ${cut}`);
  return f(s);
};

export const voEnd = (id: string, cut: Cut = "film") => voStart(id, cut) + f(DUR[id]);

/** Absolute frames at which each word of a VO line begins. */
export const wordFrames = (id: string, cut: Cut = "film"): { w: string; at: number; end: number }[] => {
  const s = (raw[cut].vo as Record<string, number>)[id];
  return W[id].map((x) => ({ w: x.w, at: f(s + x.s), end: f(s + x.e) }));
};

export const wordAt = (id: string, index: number, cut: Cut = "film") => wordFrames(id, cut)[index].at;
