import React from "react";
import { AbsoluteFill } from "remotion";
import { KineticText, fromLine } from "../components/KineticText";
import { C } from "../config/brand";
import { ev, voStart, wordAt, wordFrames } from "../config/timeline";
import { easeExit, easeInOut, easeOutExpo, keys, ramp } from "../lib/anim";

/**
 * Scene 1 - POWER. A single line of light, then the first sentence.
 * At "grows" the light collapses into the seed node of the execution graph.
 */
export const Opening: React.FC<{ t: number }> = ({ t }) => {
  const impact = ev("openImpact");
  const v02 = voStart("v02");
  const grows = wordAt("v02", 2);

  const open = ramp(t, impact, 34, easeOutExpo);
  const collapse = ramp(t, grows - 14, 14, easeInOut);
  const width = 1100 * open * (1 - collapse);
  const y = keys(t, [
    [impact + 20, 540],
    [impact + 44, 612],
    [grows - 16, 612],
    [grows - 2, 540],
  ]);
  const lineOpacity = keys(t, [
    [impact, 1],
    [impact + 40, 0.55],
    [grows - 14, 0.9],
    [grows, 0],
  ]);
  const flash = 1 - ramp(t, impact, 18);

  const v01 = fromLine(wordFrames("v01"), (w) => (w.startsWith("breakthrough") ? { sweep: true, weight: 600 } : {}));
  const v02w = fromLine(wordFrames("v02"));

  return (
    <AbsoluteFill>
      {t >= impact && t < impact + 18 && (
        <AbsoluteFill style={{ background: `radial-gradient(600px 220px at 50% 50%, rgba(140,182,255,${0.22 * flash}), rgba(15,17,21,0) 70%)` }} />
      )}
      {width > 1 && (
        <div style={{ position: "absolute", left: 960 - width / 2, top: y - 1, width, height: 2, opacity: lineOpacity }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, rgba(70,139,255,0) 0%, ${C.blue} 22%, #EAF2FF 50%, ${C.blue} 78%, rgba(70,139,255,0) 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "15%",
              right: "15%",
              top: -14,
              height: 30,
              background: "radial-gradient(50% 50% at 50% 50%, rgba(107,161,255,0.45), rgba(70,139,255,0))",
              filter: "blur(6px)",
            }}
          />
        </div>
      )}
      <div style={{ position: "absolute", left: 90, right: 90, top: 470 - 50 }}>
        <KineticText words={v01} t={t} size={84} weight={500} exitAt={v02 - 10} exitDur={12} revealDur={18} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: keys(t, [[grows + 2, 400 - 50], [grows + 26, 150]], easeInOut),
          transform: `scale(${keys(t, [[grows + 2, 1], [grows + 26, 0.62]], easeInOut)})`,
        }}
      >
        <KineticText words={v02w} t={t} size={92} weight={500} exitAt={ev("tokens") - 30} exitDur={14} revealDur={18} />
      </div>
      {/* the seed: a point of light that becomes the root node */}
      {t >= grows - 4 && t < grows + 10 && (
        <div
          style={{
            position: "absolute",
            left: 960 - 40,
            top: 540 - 40,
            width: 80,
            height: 80,
            borderRadius: 99,
            background: "radial-gradient(circle, #ffffff 0%, rgba(107,161,255,0.8) 18%, rgba(70,139,255,0) 70%)",
            opacity: 1 - ramp(t, grows + 2, 8, easeExit),
          }}
        />
      )}
    </AbsoluteFill>
  );
};
