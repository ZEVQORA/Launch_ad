import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT } from "../config/brand";
import { easeExit, easeOutExpo, ramp } from "../lib/anim";

export interface KWord {
  text: string;
  /** absolute frame the word starts revealing (usually its spoken onset) */
  at: number;
  color?: string;
  weight?: number;
  /** optional light sweep across the word once revealed */
  sweep?: boolean;
}

interface KineticTextProps {
  words: KWord[];
  /** the frame the component is evaluated against (absolute film frame) */
  t?: number;
  size: number;
  weight?: number;
  color?: string;
  tracking?: string;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  maxWidth?: number;
  /** absolute frame the whole line begins exiting */
  exitAt?: number;
  exitDur?: number;
  /** reveal duration per word, frames */
  revealDur?: number;
  /** start revealing a little before the spoken onset so the eye leads the ear */
  lead?: number;
  uppercase?: boolean;
  style?: React.CSSProperties;
}

/**
 * Editorial kinetic type: each word rises out of its own mask on its spoken
 * frame, with a short velocity blur that settles to perfectly sharp type.
 */
export const KineticText: React.FC<KineticTextProps> = ({
  words,
  t,
  size,
  weight = 500,
  color = C.cloud,
  tracking = "-0.025em",
  lineHeight = 1.08,
  align = "center",
  maxWidth,
  exitAt,
  exitDur = 10,
  revealDur = 16,
  lead = 3,
  uppercase = false,
  style,
}) => {
  const local = useCurrentFrame();
  const frame = t ?? local;
  const exit = exitAt !== undefined ? ramp(frame, exitAt, exitDur, easeExit) : 0;
  return (
    <div
      style={{
        fontFamily: FONT.sans,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: tracking,
        lineHeight,
        color,
        textAlign: align,
        maxWidth,
        textTransform: uppercase ? "uppercase" : undefined,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        columnGap: "0.24em",
        opacity: 1 - exit,
        transform: `translateY(${-exit * size * 0.25}px)`,
        filter: exit > 0 ? `blur(${exit * 8}px)` : undefined,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = ramp(frame, w.at - lead, revealDur, easeOutExpo);
        const blur = (1 - p) * 10;
        const sw = w.sweep ? ramp(frame, w.at + 6, 30) : 0;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: "0.14em",
              marginBottom: "-0.14em",
              paddingTop: "0.06em",
              marginTop: "-0.06em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 105}%)`,
                opacity: p < 0.01 ? 0 : Math.min(1, p * 1.6),
                filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
                color: w.color ?? color,
                fontWeight: w.weight ?? weight,
                ...(w.sweep
                  ? {
                      backgroundImage: `linear-gradient(100deg, ${w.color ?? color} 0%, ${w.color ?? color} ${sw * 140 - 40}%, #ffffff ${sw * 140 - 20}%, ${w.color ?? color} ${sw * 140}%, ${w.color ?? color} 100%)`,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }
                  : {}),
              }}
            >
              {w.text}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Build KWords from a VO line's word timings, with optional per-word styling. */
export const fromLine = (
  frames: { w: string; at: number }[],
  style: (word: string, i: number) => Partial<KWord> = () => ({}),
): KWord[] => frames.map((x, i) => ({ text: x.w, at: x.at, ...style(x.w, i) }));
