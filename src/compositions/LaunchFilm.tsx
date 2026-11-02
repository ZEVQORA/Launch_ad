import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { IllustrativeTag } from "../components/Chrome";
import { FontGate } from "../components/FontGate";
import { ev, SCENES } from "../config/timeline";
import { keys, window01 } from "../lib/anim";
import { Opening } from "../scenes/01-Opening";
import { CostExplosion, CostWorld } from "../scenes/02-CostExplosion";
import { QualityRisk } from "../scenes/03-QualityRisk";
import { BrandBug, WhyZevqora } from "../scenes/04-WhyZevqora";
import { ExecutionGraphScene } from "../scenes/05-ExecutionGraph";
import { Verification } from "../scenes/06-Verification";
import { BrandFinale } from "../scenes/07-BrandFinale";

const within = (t: number, a: number, b: number) => t >= a && t < b;

/**
 * THAT'S WHY WE BUILT ZEVQORA - 16:9 master.
 * Every scene receives the absolute frame `t`; all timing comes from config/timeline.
 * One pre-mixed stereo track (scripts/mix-audio.py) guarantees picture/sound sync.
 */
export const LaunchFilm: React.FC = () => {
  const t = useCurrentFrame();
  const S = SCENES;
  const glow = keys(t, [
    [0, 0],
    [ev("openImpact"), 0.15],
    [ev("openImpact") + 30, 0.7],
    [S.cost.from, 0.55],
    [S.risk.from, 0.35],
    [ev("preHitSilence") - 4, 0.0],
    [ev("revealImpact"), 1.0],
    [ev("revealImpact") + 50, 0.7],
    [S.product.from, 0.5],
    [S.verification.from, 0.5],
    [ev("collapseToLogo"), 0.15],
    [ev("logoHit"), 1.0],
    [ev("logoHit") + 60, 0.75],
  ]);
  const heat = keys(t, [
    [ev("costs") - 6, 0],
    [ev("costWhoosh"), 1],
    [ev("rejectStamp"), 0.6],
    [ev("preHitSilence"), 0],
  ]);
  const tagOpacity = Math.max(
    window01(t, ev("tokens"), ev("collapseStart"), 15, 15),
    window01(t, ev("observe") + 20, ev("noBlind") - 4, 15, 12),
  );
  return (
    <FontGate>
      <AbsoluteFill>
        <Audio src={staticFile("audio/mix/film-mix.wav")} />
        <Backdrop glow={glow} heat={heat}>
          {within(t, ev("seed") - 6, ev("revealImpact")) && <CostWorld t={t} />}
          {within(t, 0, S.cost.from + 20) && <Opening t={t} />}
          {within(t, S.cost.from - 10, S.risk.from + 10) && <CostExplosion t={t} />}
          {within(t, S.risk.from, S.reveal.from + 2) && <QualityRisk t={t} />}
          {within(t, S.reveal.from - 4, S.product.from + 4) && <WhyZevqora t={t} />}
          {within(t, S.product.from - 6, S.verification.from + 14) && <ExecutionGraphScene t={t} />}
          {within(t, S.product.from + 3, S.finale.from) && (
            <BrandBug opacity={Math.min(1, (t - S.product.from - 3) / 2) * (1 - Math.max(0, (t - (S.finale.from - 14)) / 14))} />
          )}
          {within(t, S.verification.from - 6, S.finale.from + 4) && <Verification t={t} />}
          {within(t, S.finale.from - 4, S.finale.to) && <BrandFinale t={t} />}
          {tagOpacity > 0 && <IllustrativeTag opacity={tagOpacity} />}
        </Backdrop>
      </AbsoluteFill>
    </FontGate>
  );
};
