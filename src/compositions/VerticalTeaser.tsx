import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { IllustrativeTag } from "../components/Chrome";
import { FontGate } from "../components/FontGate";
import { ev } from "../config/timeline";
import { keys, window01 } from "../lib/anim";
import { QualityRisk } from "../scenes/03-QualityRisk";
import { WhyZevqora } from "../scenes/04-WhyZevqora";
import { BrandFinale } from "../scenes/07-BrandFinale";

/** 9:16 social cutdown (19 s): risk -> reveal -> principle -> brand. Same assets, same voice. */
export const VerticalTeaser: React.FC = () => {
  const t = useCurrentFrame();
  const c = "teaser" as const;
  const glow = keys(t, [
    [0, 0.3],
    [ev("preHitSilence", c) - 4, 0],
    [ev("revealImpact", c), 1],
    [ev("revealImpact", c) + 50, 0.7],
    [ev("logoHit", c) - 10, 0.15],
    [ev("logoHit", c), 1],
    [ev("logoHit", c) + 60, 0.75],
  ]);
  return (
    <FontGate>
      <AbsoluteFill>
        <Audio src={staticFile("audio/mix/teaser-mix.wav")} />
        <Backdrop glow={glow} glowY={50} heat={keys(t, [[0, 0.5], [ev("rejectStamp", c), 0.7], [ev("preHitSilence", c), 0]])}>
          {t < ev("revealImpact", c) + 2 && <QualityRisk t={t} cut={c} />}
          {t >= ev("revealImpact", c) - 4 && t < ev("wMeasure", c) && <WhyZevqora t={t} cut={c} />}
          {t >= ev("wMeasure", c) - 10 && <BrandFinale t={t} cut={c} />}
          <IllustrativeTag
            opacity={window01(t, ev("candidate", c) - 6, ev("preHitSilence", c) - 20, 10, 10)}
            style={{ right: 0, left: 0, bottom: 120, justifyContent: "center", fontSize: 22 }}
          />
        </Backdrop>
      </AbsoluteFill>
    </FontGate>
  );
};
