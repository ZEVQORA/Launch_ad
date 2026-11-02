import React from "react";
import { C } from "../config/brand";
import { LOCKUP, MARK_ASPECT, MARK_PATH, MARK_VIEWBOX, WORDMARK_ASPECT, WORDMARK_PATH, WORDMARK_VIEWBOX } from "../brand/marks";
import { easeInOut, easeOutExpo, ramp } from "../lib/anim";

/**
 * The ZEVQORA lockup, animated without ever altering the locked geometry:
 *  - the Z mark's own outline is traced in Soft Blue, then fills
 *  - the wordmark is revealed by a soft-edged wipe (letterforms untouched)
 *  - an optional light glint travels across the wordmark
 * The mark is always Soft Blue. On ink, the wordmark is Cloud (inverse lockup).
 */
interface Props {
  t: number;
  markHeight: number;
  drawAt: number;
  drawDur?: number;
  wordAt?: number;
  wordDur?: number;
  glintAt?: number;
  layout?: "horizontal" | "stacked" | "mark";
  id?: string;
}

export const lockupSize = (markHeight: number, layout: Props["layout"] = "horizontal") => {
  const mw = markHeight * MARK_ASPECT;
  if (layout === "mark") return { w: mw, h: markHeight };
  if (layout === "stacked") {
    const wh = markHeight * 0.34;
    return { w: Math.max(mw, wh * WORDMARK_ASPECT), h: markHeight + markHeight * 0.36 + wh };
  }
  const wh = markHeight / LOCKUP.markToWordCapHeight;
  return { w: mw + markHeight * LOCKUP.gapToMarkHeight + wh * WORDMARK_ASPECT, h: markHeight };
};

export const AnimatedLogo: React.FC<Props> = ({
  t,
  markHeight,
  drawAt,
  drawDur = 26,
  wordAt,
  wordDur = 22,
  glintAt,
  layout = "horizontal",
  id = "logo",
}) => {
  const mw = markHeight * MARK_ASPECT;
  const trace = ramp(t, drawAt, drawDur, easeInOut);
  const fill = ramp(t, drawAt + drawDur * 0.65, 14);
  const pop = ramp(t, drawAt, drawDur + 10, easeOutExpo);
  const wp = wordAt !== undefined ? ramp(t, wordAt, wordDur, easeInOut) : 0;
  const glint = glintAt !== undefined ? ramp(t, glintAt, 34) : 0;

  const stacked = layout === "stacked";
  const wh = stacked ? markHeight * 0.34 : markHeight / LOCKUP.markToWordCapHeight;
  const ww = wh * WORDMARK_ASPECT;
  const gap = stacked ? markHeight * 0.36 : markHeight * LOCKUP.gapToMarkHeight;

  const mark = (
    <svg
      viewBox={MARK_VIEWBOX}
      width={mw}
      height={markHeight}
      style={{ overflow: "visible", transform: `scale(${0.92 + 0.08 * pop})`, filter: `drop-shadow(0 0 ${markHeight * 0.18 * (1 - fill * 0.6)}px rgba(70,139,255,${0.55 * trace}))` }}
    >
      <path d={MARK_PATH} fill={C.blue} fillOpacity={fill} />
      <path
        d={MARK_PATH}
        fill="none"
        stroke={C.blue}
        strokeWidth={1.4}
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - trace}
        strokeOpacity={1 - fill * 0.9}
        strokeLinejoin="round"
      />
    </svg>
  );

  const word =
    layout === "mark" ? null : (
      <svg viewBox={WORDMARK_VIEWBOX} width={ww} height={wh} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id={`${id}-wipe`} x1="0" x2="1" y1="0" y2="0">
            <stop offset={Math.max(0, wp * 1.25 - 0.25)} stopColor="#fff" stopOpacity="1" />
            <stop offset={Math.min(1, wp * 1.25)} stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="800" height="140">
            <rect x="-20" y="-20" width="800" height="140" fill={`url(#${id}-wipe)`} />
          </mask>
          <linearGradient id={`${id}-glint`} x1="0" x2="1" y1="0" y2="0">
            <stop offset={glint * 1.4 - 0.3} stopColor={C.cloud} />
            <stop offset={glint * 1.4 - 0.15} stopColor="#ffffff" />
            <stop offset={glint * 1.4 - 0.12} stopColor={C.accentText} />
            <stop offset={glint * 1.4} stopColor={C.cloud} />
          </linearGradient>
        </defs>
        <g mask={`url(#${id}-mask)`} transform={`translate(${(1 - wp) * -12} 0)`}>
          <path d={WORDMARK_PATH} fillRule="evenodd" fill={glint > 0 && glint < 1 ? `url(#${id}-glint)` : C.cloud} />
        </g>
      </svg>
    );

  if (stacked) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap }}>
        {mark}
        {word}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      {mark}
      {word}
    </div>
  );
};
