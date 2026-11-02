import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { AnimatedLogo, lockupSize } from "../components/AnimatedLogo";
import { KineticText, fromLine } from "../components/KineticText";
import { C } from "../config/brand";
import { ev, wordFrames } from "../config/timeline";
import { easeInOut, easeOutExpo, keys, ramp } from "../lib/anim";

type Cut = "film" | "teaser";

/** Where the brand bug lives for scenes 5-6 (film only). */
export const BUG = { left: 72, top: 58, markHeight: 34 };

export const RevealFlash: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const { width, height } = useVideoConfig();
  if (t < at || t > at + 40) return null;
  const r = ramp(t, at, 34, easeOutExpo);
  const bloom = 1 - ramp(t, at, 16);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(${700 + 600 * r}px ${500 + 400 * r}px at 50% 50%, rgba(160,195,255,${0.28 * bloom}), rgba(15,17,21,0) 70%)` }} />
      <div
        style={{
          position: "absolute",
          left: width / 2 - 1100 * r,
          top: height / 2 - 1100 * r,
          width: 2200 * r,
          height: 2200 * r,
          borderRadius: "50%",
          border: `2px solid rgba(107,161,255,${0.7 * (1 - r)})`,
          boxShadow: `0 0 40px rgba(70,139,255,${0.4 * (1 - r)})`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Scene 4 - THE REVEAL. Chaos collapses to a point; the point becomes the
 * Z mark; "That's why we built" lands word by word; the wordmark completes
 * the lockup on the spoken brand name.
 */
export const WhyZevqora: React.FC<{ t: number; cut?: Cut }> = ({ t, cut = "film" }) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const hit = ev("revealImpact", cut);
  const word = ev("wordmark", cut);
  const words = fromLine(wordFrames("v08", cut).slice(0, 4));
  const markH = vertical ? 250 : 190;
  const layout = vertical ? "stacked" : "horizontal";
  const size = lockupSize(markH, layout);
  const cx = width / 2;
  const cy = vertical ? 1010 : 610;

  // film: hand the lockup off to the top-left brand bug
  const toBug = cut === "film" ? ramp(t, ev("toProduct") - 22, 26, easeInOut) : 0;
  const bugW = lockupSize(BUG.markHeight).w;
  const bugCx = BUG.left + bugW / 2;
  const bugCy = BUG.top + BUG.markHeight / 2;
  const sc = 1 + (BUG.markHeight / markH - 1) * toBug;
  const x = cx + (bugCx - cx) * toBug;
  const y = cy + (bugCy - cy) * toBug;
  const headOut = cut === "film" ? ev("toProduct") - 34 : ev("wMeasure", cut) - 16;
  const lockOut = cut === "teaser" ? ramp(t, ev("wMeasure", cut) - 14, 12) : 0;
  const settle = keys(t, [[hit, 1.08], [hit + 40, 1]], easeOutExpo);

  return (
    <AbsoluteFill>
      <RevealFlash t={t} at={hit} />
      <div style={{ position: "absolute", left: 80, right: 80, top: vertical ? 640 : 372 }}>
        <KineticText
          words={words}
          t={t}
          size={vertical ? 70 : 60}
          weight={500}
          tracking="0.14em"
          uppercase
          color={C.cloud}
          exitAt={headOut}
          exitDur={12}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: x - size.w / 2,
          top: y - size.h / 2,
          width: size.w,
          height: size.h,
          transform: `scale(${sc * settle})`,
          transformOrigin: "50% 50%",
          opacity: 1 - lockOut,
        }}
      >
        <AnimatedLogo t={t} markHeight={markH} drawAt={hit + 2} drawDur={24} wordAt={word - 2} wordDur={20} glintAt={word + 26} layout={layout} id={`reveal-${cut}`} />
      </div>
    </AbsoluteFill>
  );
};

/** Static, fully drawn brand bug shown after the hand-off (film scenes 5-6). */
export const BrandBug: React.FC<{ opacity: number }> = ({ opacity }) => {
  const w = lockupSize(BUG.markHeight).w;
  return (
    <div style={{ position: "absolute", left: BUG.left, top: BUG.top, width: w, opacity }}>
      <AnimatedLogo t={100000} markHeight={BUG.markHeight} drawAt={0} wordAt={0} layout="horizontal" id="bug" />
    </div>
  );
};
