import React from "react";
import { AbsoluteFill } from "remotion";
import { Eyebrow } from "../components/Chrome";
import { DecisionCard } from "../components/DecisionCard";
import { KineticText, fromLine } from "../components/KineticText";
import { C } from "../config/brand";
import { ev, voStart, wordFrames } from "../config/timeline";
import { easeExit, easeInOut, keys, ramp } from "../lib/anim";

/**
 * Scene 6 - HONEST VERIFICATION. Three outcomes, each shown on its own terms:
 *  VERIFIED   - the change *can be reviewed*. Not deployed, no savings claimed.
 *  REJECTED   - quality dropped below the defined floor.
 *  INCOMPLETE - not enough evidence, so no verdict.
 */
export const Verification: React.FC<{ t: number }> = ({ t }) => {
  const v12 = voStart("v12");
  const v13 = voStart("v13");
  const v14 = voStart("v14");
  const chime = ev("verifiedChime");
  const rej = ev("rejectedTone");
  const inc = ev("incompleteTone");
  const noBlind = ev("noBlind");
  const end = ev("wMeasure") - 12;

  // slot positions (card centre x), scale and yaw over time
  const W = 640;
  const SLOT = 0.8;
  const slotX = { L: 400, C: 960, R: 1520 };
  const card = (enter: number, kf: [number, number, number, number][]) => {
    // kf: [frame, x, scale, rotY]
    const x = keys(t, kf.map(([f, x]) => [f, x] as [number, number]));
    const s = keys(t, kf.map(([f, , s]) => [f, s] as [number, number]));
    const ry = keys(t, kf.map(([f, , , r]) => [f, r] as [number, number]));
    return { x, s, ry, on: t >= enter - 2 };
  };
  const A = card(v12, [
    [v12, slotX.C, 1, 0],
    [v13 - 16, slotX.C, 1, 0],
    [v13 + 2, slotX.L, SLOT, 10],
  ]);
  const B = card(v13 + 4, [
    [v13 + 4, slotX.C, 1, 0],
    [v14 - 4, slotX.C, 1, 0],
    [v14 + 14, slotX.C, SLOT, 0],
  ]);
  const Cc = card(v14, [
    [v14, slotX.R + 80, 0.9, -12],
    [v14 + 18, slotX.R, SLOT, -10],
  ]);

  const recede = ramp(t, noBlind - 8, 18, easeInOut);
  const out = ramp(t, end - 10, 12, easeExit);
  const eyebrow = ramp(t, v12, 14) * (1 - recede);

  const wrap = (c: { x: number; s: number; ry: number; on: boolean }, child: React.ReactNode, dim = 1) =>
    c.on ? (
      <div
        style={{
          position: "absolute",
          left: c.x - W / 2,
          top: 250,
          width: W,
          transform: `perspective(1600px) rotateY(${c.ry}deg) scale(${c.s})`,
          transformOrigin: "50% 0%",
          opacity: dim,
        }}
      >
        {child}
      </div>
    ) : null;

  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <AbsoluteFill style={{ transform: `translateZ(0) scale(${1 - recede * 0.1})`, opacity: 1 - recede * 0.8, filter: recede > 0.02 ? `blur(${recede * 7}px)` : undefined }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", opacity: eyebrow }}>
          <Eyebrow>Every candidate ends in one of three honest outcomes</Eyebrow>
        </div>
        {wrap(
          A,
          <DecisionCard
            t={t}
            appear={v12 - 4}
            width={W}
            eyebrow="Outcome 01"
            title="Evidence passes every defined gate"
            status={[[0, "EVALUATING"], [chime, "VERIFIED"]]}
            rows={[
              { label: "Quality ≥ required floor", value: "met", at: v12 + 4, states: [[0, "pending"], [chime - 12, "pass"]] },
              { label: "Protected behaviour", value: "held", at: v12 + 8, states: [[0, "pending"], [chime - 6, "pass"]] },
              { label: "Evidence", value: "complete", at: v12 + 12, states: [[0, "pending"], [chime, "pass"]] },
            ]}
            footer="Ready for human review · not auto-deployed"
            footerAt={chime + 18}
          />,
          t > v13 ? 0.8 : 1,
        )}
        {wrap(
          B,
          <DecisionCard
            t={t}
            appear={v13 + 2}
            width={W}
            eyebrow="Outcome 02"
            title="Quality drops below the floor"
            status={[[0, "EVALUATING"], [rej, "REJECTED"]]}
            rows={[
              { label: "Quality ≥ required floor", value: "not met", at: v13 + 4, states: [[0, "pending"], [rej - 8, "fail"]] },
              { label: "Protected behaviour", value: "held", at: v13 + 8, states: [[0, "pending"], [rej - 14, "pass"]] },
              { label: "Evidence", value: "complete", at: v13 + 12, states: [[0, "pending"], [rej - 18, "pass"]] },
            ]}
            footer="Change discarded · baseline kept"
            footerAt={rej + 14}
          />,
          t > v14 ? 0.8 : 1,
        )}
        {wrap(
          Cc,
          <DecisionCard
            t={t}
            appear={v14 - 2}
            width={W}
            eyebrow="Outcome 03"
            title="Not enough proof to decide"
            status={[[0, "EVALUATING"], [inc, "INCOMPLETE"]]}
            rows={[
              { label: "Quality ≥ required floor", value: "unproven", at: v14 + 4, states: [[0, "pending"], [inc - 6, "missing"]] },
              { label: "Protected behaviour", value: "unproven", at: v14 + 8, states: [[0, "pending"], [inc - 2, "missing"]] },
              { label: "Evidence", value: "insufficient", at: v14 + 12, states: [[0, "pending"], [inc, "missing"]] },
            ]}
            footer="No verdict without evidence"
            footerAt={inc + 14}
          />,
        )}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, right: 120, top: 360 }}>
        <KineticText words={fromLine(wordFrames("v15"), (w, i) => (i === 0 ? { color: C.accentText } : {}))} t={t} size={118} weight={600} revealDur={14} />
      </div>
      <div style={{ position: "absolute", left: 120, right: 120, top: 520 }}>
        <KineticText words={fromLine(wordFrames("v16"), (w, i) => (i === 0 ? { color: C.accentText } : {}))} t={t} size={118} weight={600} revealDur={14} />
      </div>
    </AbsoluteFill>
  );
};
