import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { CameraRig } from "../components/CameraRig";
import { Eyebrow } from "../components/Chrome";
import { ExecutionGraph, Tone } from "../components/ExecutionGraph";
import { KineticText, fromLine } from "../components/KineticText";
import { C, FONT } from "../config/brand";
import { costGraph } from "../config/graphs";
import { ev, wordFrames } from "../config/timeline";
import { easeExit, easeInOut, keys, ramp, rnd } from "../lib/anim";

/**
 * The world of scenes 1-3: one execution graph that keeps growing, filmed by
 * one continuous camera. It is born at "grows", explodes through scene 2,
 * sits dimmed behind the risk scene, then collapses into the reveal.
 */
export const CostWorld: React.FC<{ t: number }> = ({ t }) => {
  const g = useMemo(() => costGraph(), []);
  const costs = ev("costs");
  const collapse0 = ev("collapseStart");
  const hit = ev("preHitSilence");
  const heat = ramp(t, costs - 4, 70, easeInOut);
  const tokenScale = keys(t, [[ev("tokens"), 0.6], [ev("retries"), 1.4], [ev("costs") + 40, 2.6]]);
  const tone = (id: string): Tone => {
    if (id === "0-0") return "blue";
    const li = Number(id.split("-")[0]);
    if (li >= 2 && rnd(`heat${id}`) < heat * 0.62) return "heat";
    return "default";
  };
  const dim = keys(t, [[ev("obviousFix") - 6, 1], [ev("obviousFix") + 10, 0.22]]);
  const blur = keys(t, [[ev("obviousFix") - 6, 0], [ev("obviousFix") + 10, 5]]);
  const collapse = ramp(t, collapse0 + 10, hit - collapse0 - 14, easeInOut);
  const cam = [
    { at: ev("seed") - 20, x: -730, y: 0, s: 1.9 },
    { at: ev("tokens") - 10, x: -620, y: -20, s: 1.62, rx: 4, ry: -4 },
    { at: ev("models"), x: -420, y: -30, s: 1.28, rx: 9, ry: -8 },
    { at: ev("costs"), x: -150, y: -40, s: 1.0, rx: 12, ry: -10 },
    { at: ev("costWhoosh"), x: -30, y: -50, s: 0.88, rx: 15, ry: -13 },
    { at: collapse0, x: 0, y: -40, s: 0.82, rx: 17, ry: -15 },
  ];
  return (
    <AbsoluteFill style={{ opacity: dim * (1 - collapse), filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
      <CameraRig t={t} keys={cam}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${1 - collapse * 0.97}) rotate(${collapse * 30}deg)` }}>
          <ExecutionGraph nodes={g.nodes} edges={g.edges} t={t} width={1920} height={1080} tone={tone} tokenScale={tokenScale} />
        </div>
      </CameraRig>
    </AbsoluteFill>
  );
};

/** Scene 2 foreground - COST: the sentence, and a spend meter that will not stop. */
export const CostExplosion: React.FC<{ t: number }> = ({ t }) => {
  const words = fromLine(wordFrames("v03"), (w) =>
    /^(tokens|models|retries|costs)/.test(w) ? { color: w.startsWith("costs") ? C.warning : C.cloud, weight: 600 } : { color: C.fgMuted },
  );
  const out = ev("obviousFix") - 8;
  const meterIn = ramp(t, ev("tokens") - 6, 16);
  const meterOut = ramp(t, out - 6, 12, easeExit);
  const fill = keys(t, [[ev("tokens"), 0.02], [ev("models"), 0.1], [ev("retries"), 0.22], [ev("costs"), 0.42], [out, 0.97]], (x) => x * x);
  const col = fill > 0.4 ? C.warning : C.accentOnInk;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 140, right: 140, top: 96 }}>
        <KineticText words={words} t={t} size={60} weight={500} exitAt={out} exitDur={12} />
      </div>
      <div style={{ position: "absolute", left: 140, right: 140, bottom: 108, opacity: meterIn * (1 - meterOut) }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <Eyebrow>AI spend · this workload</Eyebrow>
          <Eyebrow color={fill > 0.4 ? C.warning : C.fgMuted}>{fill > 0.4 ? "rising" : "growing"}</Eyebrow>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: C.sunken, border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${fill * 100}%`,
              background: `linear-gradient(90deg, ${C.accentOnInk}, ${col})`,
              boxShadow: `0 0 20px ${col}`,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 46, marginTop: 18, fontFamily: FONT.mono, fontSize: 17, color: C.fgSubtle, letterSpacing: "0.06em" }}>
          {[
            ["tokens", ev("tokens")],
            ["model calls", ev("models")],
            ["retries", ev("retries")],
            ["cost", ev("costs")],
          ].map(([label, at]) => (
            <span key={label as string} style={{ opacity: ramp(t, (at as number) - 2, 10), color: t >= (at as number) ? C.fgMuted : C.fgSubtle }}>
              ↑ {label}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
