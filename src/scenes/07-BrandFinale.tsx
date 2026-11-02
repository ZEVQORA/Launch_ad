import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { AnimatedLogo, lockupSize } from "../components/AnimatedLogo";
import { KineticText } from "../components/KineticText";
import { C } from "../config/brand";
import { ev, voStart, wordFrames } from "../config/timeline";
import { easeExit, easeInOut, easeOutExpo, ramp } from "../lib/anim";
import { RevealFlash } from "./04-WhyZevqora";

type Cut = "film" | "teaser";

/**
 * Scene 7 - RESOLUTION. Measure. Replay. Verify. Then optimize. - each word on
 * its own beat - then everything condenses into the lockup and the tagline.
 */
export const BrandFinale: React.FC<{ t: number; cut?: Cut }> = ({ t, cut = "film" }) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const hit = ev("logoHit", cut);
  const collapse0 = cut === "film" ? ev("collapseToLogo") : hit - 10;
  const fade = ev("fadeOut", cut);
  const end = cut === "film" ? 1920 : 570;

  const ws = ["v17", "v18", "v19"].map((id) => wordFrames(id, cut)[0]);
  const opt = wordFrames("v20", cut);
  const squeeze = ramp(t, collapse0 - 4, 12, easeInOut);
  const wordsOut = ramp(t, collapse0 + 4, 6, easeExit);

  const size = vertical ? 150 : 132;
  const markH = vertical ? 230 : 150;
  const layout = vertical ? "stacked" : "horizontal";
  const lk = lockupSize(markH, layout);
  const lockY = vertical ? 820 : 470;
  const finalFade = ramp(t, fade, end - fade, easeInOut);

  const progress = ["wMeasure", "wReplay", "wVerify", "wOptimize"].map((k) => ramp(t, ev(k, cut), 10, easeOutExpo));

  return (
    <AbsoluteFill style={{ opacity: 1 - finalFade }}>
      {t < collapse0 + 12 && (
        <AbsoluteFill
          style={{
            transform: `scaleY(${1 - squeeze * 0.96}) scaleX(${1 + squeeze * 0.06})`,
            opacity: 1 - wordsOut,
            filter: squeeze > 0.05 ? `blur(${squeeze * 6}px) brightness(${1 + squeeze})` : undefined,
          }}
        >
          {vertical ? (
            <div style={{ position: "absolute", left: 60, right: 60, top: 560, display: "flex", flexDirection: "column", gap: 10 }}>
              {ws.map((w, i) => (
                <KineticText key={i} words={[{ text: w.w, at: w.at }]} t={t} size={size} weight={600} revealDur={12} />
              ))}
              <KineticText words={opt.map((w) => ({ text: w.w, at: w.at, color: C.accentText }))} t={t} size={size} weight={600} revealDur={12} />
            </div>
          ) : (
            <div style={{ position: "absolute", left: 100, right: 100, top: 330, display: "flex", flexDirection: "column", gap: 18 }}>
              <KineticText words={ws.map((w) => ({ text: w.w, at: w.at }))} t={t} size={size} weight={600} revealDur={12} style={{ columnGap: "0.32em" }} />
              <KineticText words={opt.map((w) => ({ text: w.w, at: w.at, color: C.accentText }))} t={t} size={size} weight={600} revealDur={12} />
            </div>
          )}
          {/* a four-segment rail that fills on each beat */}
          <div style={{ position: "absolute", left: width / 2 - 300, top: vertical ? 1340 : 760, width: 600, display: "flex", gap: 12 }}>
            {progress.map((p, i) => (
              <div key={i} style={{ flex: 1, height: 3, background: C.border, position: "relative", borderRadius: 3 }}>
                <div style={{ position: "absolute", inset: 0, width: `${p * 100}%`, background: C.blue, boxShadow: `0 0 12px ${C.blue}`, borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}
      {t >= collapse0 + 4 && t < hit + 2 && (
        <div
          style={{
            position: "absolute",
            left: width / 2 - 70,
            top: height / 2 - 70,
            width: 140,
            height: 140,
            borderRadius: 99,
            background: "radial-gradient(circle, #ffffff 0%, rgba(140,182,255,0.85) 14%, rgba(70,139,255,0) 66%)",
            transform: `scale(${1 - ramp(t, collapse0 + 4, hit - collapse0 - 4, easeInOut) * 0.85})`,
          }}
        />
      )}
      <RevealFlash t={t} at={hit} />
      {t >= hit && (
        <>
          <div style={{ position: "absolute", left: (width - lk.w) / 2, top: lockY - lk.h / 2, width: lk.w, height: lk.h }}>
            <AnimatedLogo
              t={t}
              markHeight={markH}
              drawAt={hit}
              drawDur={18}
              wordAt={hit + 6}
              wordDur={18}
              glintAt={cut === "film" ? voStart("v21") : hit + 30}
              layout={layout}
              id={`final-${cut}`}
            />
          </div>
          <div style={{ position: "absolute", left: 80, right: 80, top: vertical ? 1150 : 640 }}>
            <KineticText
              words={wordFrames("v22", cut).map((w) => ({
                text: w.w,
                at: w.at,
                color: w.w.startsWith("lighter") ? C.blue : C.cloud,
                weight: 700,
              }))}
              t={t}
              size={vertical ? 96 : 84}
              weight={700}
              tracking="-0.035em"
              revealDur={18}
            />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
