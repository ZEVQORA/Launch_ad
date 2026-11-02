import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { DecisionCard } from "../components/DecisionCard";
import { KineticText, fromLine } from "../components/KineticText";
import { C, FONT } from "../config/brand";
import { ev, voStart, wordFrames } from "../config/timeline";
import { easeExit, easeInOut, easeOutExpo, ramp, rnd } from "../lib/anim";

type Cut = "film" | "teaser";

/**
 * Scene 3 - RISK. A cheaper candidate looks right on cost, then fails quietly
 * on quality, and the gate rejects it. (Illustrative - no real benchmark data.)
 */
export const QualityRisk: React.FC<{ t: number; cut?: Cut }> = ({ t, cut = "film" }) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const film = cut === "film";
  const candidate = ev("candidate", cut);
  const quiet = ev("quietFail", cut);
  const reject = ev("rejectStamp", cut);
  const hit = ev("preHitSilence", cut);
  const collapse = ramp(t, hit - 30, 26, easeInOut);
  const end = 1 - ramp(t, hit - 6, 6, easeExit);

  const headSize = vertical ? 78 : 66;
  const lines: { id: string; exit?: number }[] = film
    ? [{ id: "v05", exit: voStart("v06") - 6 }, { id: "v06", exit: voStart("v07") - 6 }, { id: "v07", exit: hit - 34 }]
    : [{ id: "v05", exit: voStart("v06", cut) - 6 }, { id: "v06", exit: hit - 34 }];

  // evidence must always finish failing BEFORE the verdict - never reject ahead of proof
  const qualityFail = Math.min(quiet + 64, reject - 8);
  const cardScale = vertical ? 1.3 : 1.15;
  const cardW = 700;

  return (
    <AbsoluteFill style={{ opacity: end }}>
      {film && (
        <div style={{ position: "absolute", left: 120, right: 120, top: 540 - 70 }}>
          <KineticText words={fromLine(wordFrames("v04"))} t={t} size={124} weight={600} exitAt={voStart("v05") - 4} exitDur={10} />
        </div>
      )}
      <AbsoluteFill style={{ transform: `scale(${1 - collapse * 0.4})`, opacity: 1 - collapse, filter: collapse > 0.05 ? `blur(${collapse * 10}px)` : undefined }}>
        {lines.map(({ id, exit }) => (
          <div key={id} style={{ position: "absolute", left: vertical ? 90 : 140, right: vertical ? 90 : 140, top: vertical ? 300 : 96 }}>
            <KineticText
              words={fromLine(wordFrames(id, cut), (w) => (/^(cheaper|quietly|breaks)/.test(w) ? { weight: 650, color: w.startsWith("breaks") ? C.rejected : C.cloud } : {}))}
              t={t}
              size={headSize}
              weight={500}
              exitAt={exit}
              exitDur={8}
            />
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: (width - cardW * cardScale) / 2,
            top: vertical ? 720 : 236,
            transform: t >= reject && t < reject + 8 ? `translateX(${Math.sin((t - reject) * 2.4) * 5 * (1 - (t - reject) / 8)}px)` : undefined,
          }}
        >
          <DecisionCard
            t={t}
            appear={candidate - 6}
            width={cardW}
            scale={cardScale}
            eyebrow="Candidate change"
            title="Route this step to a cheaper model"
            status={[
              [0, "CANDIDATE"],
              [quiet, "EVALUATING"],
              [reject, "REJECTED"],
            ]}
            rows={[
              { label: "Cost per request", value: "lower", at: candidate + 6, states: [[0, "pending"], [candidate + 16, "pass"]] },
              { label: "Latency", value: "lower", at: candidate + 12, states: [[0, "pending"], [candidate + 24, "pass"]] },
              { label: "Quality on replayed cases", value: "below floor", at: candidate + 18, states: [[0, "pending"], [qualityFail, "fail"]] },
            ]}
            meter={{ at: quiet, dur: qualityFail - quiet - 2, to: 0.74, floor: 0.9, visibleAt: candidate + 2 }}
            stampAt={reject}
          />
          <CaseStrip t={t} start={quiet} end={qualityFail} width={cardW * cardScale} vertical={vertical} />
        </div>
      </AbsoluteFill>
      {/* the point everything collapses into */}
      {collapse > 0 && (
        <div
          style={{
            position: "absolute",
            left: width / 2 - 60,
            top: height / 2 - 60,
            width: 120,
            height: 120,
            borderRadius: 99,
            background: "radial-gradient(circle, #ffffff 0%, rgba(140,182,255,0.9) 12%, rgba(70,139,255,0) 65%)",
            transform: `scale(${0.2 + ramp(t, hit - 22, 20, easeOutExpo) * 0.8})`,
            opacity: ramp(t, hit - 24, 10),
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/** 40 replayed cases. Most pass; a few flip to failing - quietly, no alarm. */
const CaseStrip: React.FC<{ t: number; start: number; end: number; width: number; vertical: boolean }> = ({ t, start, end, width, vertical }) => {
  const N = 40;
  const failing = new Set([6, 13, 19, 24, 27, 33, 38]);
  const cell = (width - (N - 1) * 5) / N;
  return (
    <div style={{ marginTop: vertical ? 40 : 26, opacity: ramp(t, start - 6, 10) }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.mono, fontSize: vertical ? 22 : 16, color: C.fgSubtle, letterSpacing: "0.1em", marginBottom: 10 }}>
        <span>REPLAYED CASES</span>
        <span>{t >= end ? "7 FAILED · NO ERRORS RAISED" : "RUNNING"}</span>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {Array.from({ length: N }).map((_, i) => {
          const at = start + (i / N) * (end - start - 10);
          const on = ramp(t, at, 4);
          const flip = failing.has(i) ? ramp(t, at + 8 + rnd(`fl${i}`) * 14, 10) : 0;
          const bg = flip > 0.5 ? C.rejected : C.verified;
          return (
            <div
              key={i}
              style={{
                width: cell,
                height: vertical ? 34 : 22,
                borderRadius: 4,
                background: on > 0 ? bg : C.sunken,
                opacity: on > 0 ? 0.35 + 0.45 * on + (flip > 0.5 ? 0.2 : 0) : 1,
                border: `1px solid ${C.border}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
