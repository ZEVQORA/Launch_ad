/**
 * ZEVQORA brand tokens for the launch film.
 *
 * Source of truth: ZEVQORA/Web_Design - references/brand-board.png and
 * website/styles/globals.css. Only the four brand colours plus their derived
 * ink-surface steps are used. Soft Blue is a signal, not decoration.
 */
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const C = {
  ink: "#0F1115",
  cloud: "#F7F8FA",
  blue: "#468BFF", // canonical Soft Blue - the Z mark is always this
  stone: "#E6E9EE",
  // derived ink-surface steps (globals.css [data-surface="ink"])
  surface: "#15181E",
  elevated: "#1B1F27",
  sunken: "#0B0D11",
  border: "#262B35",
  borderStrong: "#333A47",
  fgMuted: "#9AA2B1",
  fgSubtle: "#7A8394",
  accentOnInk: "#6BA1FF",
  accentText: "#8CB6FF",
  // semantic state on ink - deliberately desaturated, instrument readings
  verified: "#4CC79C",
  verifiedBg: "#12271F",
  rejected: "#E8837A",
  rejectedBg: "#2A1815",
  warning: "#D6A94A",
  warningBg: "#26200F",
} as const;

export const FONT = {
  sans: "Satoshi, ui-sans-serif, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

/** Site motion vocabulary: decelerating, no overshoot. cubic-bezier(0.2,0,0,1). */
export const EASE_STANDARD: [number, number, number, number] = [0.2, 0, 0, 1];
export const EASE_EXIT: [number, number, number, number] = [0.4, 0, 1, 1];

let fontsLoaded: Promise<unknown> | null = null;
export const loadBrandFonts = () => {
  if (!fontsLoaded) {
    fontsLoaded = Promise.all([
      loadFont({ family: "Satoshi", url: staticFile("fonts/Satoshi-Variable.woff2"), weight: "300 900" }),
      loadFont({ family: "JetBrains Mono", url: staticFile("fonts/jetbrains-mono-latin-400-normal.woff2"), weight: "400" }),
      loadFont({ family: "JetBrains Mono", url: staticFile("fonts/jetbrains-mono-latin-500-normal.woff2"), weight: "500" }),
      loadFont({ family: "JetBrains Mono", url: staticFile("fonts/jetbrains-mono-latin-600-normal.woff2"), weight: "600" }),
    ]);
  }
  return fontsLoaded;
};
