import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { CameraRig, Layer } from "../components/CameraRig";
import { Eyebrow, Panel } from "../components/Chrome";
import { ExecutionGraph, Tone } from "../components/ExecutionGraph";
import { KineticText, fromLine } from "../components/KineticText";
import { C, FONT } from "../config/brand";
import { EXPENSIVE, productGraph } from "../config/graphs";
import { ev, voStart, wordFrames } from "../config/timeline";
import { easeExit, easeInOut, easeOutExpo, ramp } from "../lib/anim";

const STEPS = ["Observe", "Diagnose", "Plan", "Replay", "Verify"] as const;

const StepRail: React.FC<{ t: number }> = ({ t }) => {
  const at = [ev("observe"), ev("diagnose"), ev("plan"), ev("replay"), ev("verifyStep")];
  const active = at.filter((a) => t >= a).length - 1;
  const p = ramp(t, ev("toProduct"), 20);
  const progress = (() => {
    for (let i = 0; i < at.length - 1; i++) if (t < at[i + 1]) return (i + ramp(t, at[i + 1] - 14, 14, easeInOut)) / (at.length - 1);
    return 1;
  })();
  const W = 1180;
  return (
    <div style={{ position: "absolute", left: (1920 - W) / 2, top: 64, width: W, opacity: p }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 13, height: 2, background: C.border }} />
      <div style={{ position: "absolute", left: 0, top: 13, height: 2, width: `${progress * 100}%`, background: C.blue, boxShadow: `0 0 12px ${C.blue}` }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {STEPS.map((s, i) => {
          const isActive = i === active;
          const done = i < active;
          const a = ramp(t, at[i], 12);
          return (
            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: i === 0 ? "flex-start" : i === STEPS.length - 1 ? "flex-end" : "center", gap: 14 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 99,
                  background: isActive ? C.blue : done ? "#1C2A47" : C.surface,
                  border: `2px solid ${isActive || done ? C.blue : C.borderStrong}`,
                  boxShadow: isActive ? `0 0 ${18 + 10 * a}px ${C.blue}` : undefined,
                }}
              />
              <div style={{ fontFamily: FONT.mono, fontSize: 19, letterSpacing: "0.14em", textTransform: "uppercase", color: isActive ? C.cloud : done ? C.fgMuted : C.fgSubtle, fontWeight: 500 }}>
                <span style={{ color: isActive ? C.accentText : C.fgSubtle, marginRight: 10 }}>0{i + 1}</span>
                {s}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Trace spans under the graph - what "map how AI work actually runs" looks like. */
const TraceSpans: React.FC<{ t: number }> = ({ t }) => {
  const a = ev("observe") + 30;
  const out = ramp(t, ev("diagnose") - 4, 14, easeExit);
  const spans = [
    ["request", 0, 0.04],
    ["classify", 0.04, 0.09],
    ["retrieve", 0.09, 0.2],
    ["draft · large model", 0.2, 0.58],
    ["tool call", 0.58, 0.66],
    ["review · large model", 0.66, 0.95],
    ["respond", 0.95, 1.0],
  ] as const;
  const L = 300, W = 1320;
  return (
    <div style={{ position: "absolute", left: L, top: 690, width: W, opacity: ramp(t, a, 12) * (1 - out) }}>
      <Eyebrow style={{ marginBottom: 16 }}>Execution trace · one request</Eyebrow>
      {spans.map(([name, s, e], i) => {
        const p = ramp(t, a + i * 4, 16, easeOutExpo);
        return (
          <div key={name} style={{ position: "relative", height: 30, marginBottom: 6 }}>
            <div style={{ position: "absolute", left: -220, width: 200, textAlign: "right", fontFamily: FONT.mono, fontSize: 16, color: C.fgMuted, top: 5 }}>{name}</div>
            <div
              style={{
                position: "absolute",
                left: `${s * 100}%`,
                width: `${(e - s) * 100 * p}%`,
                top: 4,
                height: 20,
                borderRadius: 5,
                background: name.includes("large") ? "rgba(107,161,255,0.55)" : "rgba(107,161,255,0.25)",
                border: `1px solid ${C.accentOnInk}`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

const Tag: React.FC<{ t: number; at: number; x: number; y: number; text: string; color: string }> = ({ t, at, x, y, text, color }) => {
  const p = ramp(t, at, 14, easeOutExpo);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, ${(1 - p) * 10}px)`,
        opacity: p,
        fontFamily: FONT.mono,
        fontSize: 17,
        letterSpacing: "0.14em",
        color,
        border: `1px solid ${color}`,
        borderRadius: 999,
        padding: "6px 14px",
        background: "rgba(15,17,21,0.85)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

/** "Measure what changes": a baseline-vs-candidate diff. Bars only - no invented numbers. */
const DiffPanel: React.FC<{ t: number }> = ({ t }) => {
  const a = ev("measure") - 6;
  const out = ramp(t, ev("replay") - 8, 12, easeExit);
  const rows: [string, number, number, string][] = [
    ["cost", 1, 0.58, "measured"],
    ["latency", 1, 0.74, "measured"],
    ["quality", 1, 0, "replay required"],
  ];
  return (
    <div style={{ position: "absolute", left: 200, top: 776, width: 760, opacity: ramp(t, a, 14) * (1 - out), transform: `translateY(${(1 - ramp(t, a, 18, easeOutExpo)) * 20}px)` }}>
      <Panel style={{ padding: "24px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <Eyebrow>Measured diff</Eyebrow>
          <div style={{ display: "flex", gap: 18, fontFamily: FONT.mono, fontSize: 15, color: C.fgSubtle }}>
            <span>
              <span style={{ display: "inline-block", width: 10, height: 10, background: C.borderStrong, marginRight: 8 }} />
              baseline
            </span>
            <span>
              <span style={{ display: "inline-block", width: 10, height: 10, background: C.accentOnInk, marginRight: 8 }} />
              alternative
            </span>
          </div>
        </div>
        {rows.map(([name, b, c, note], i) => {
          const p = ramp(t, a + 8 + i * 6, 20, easeOutExpo);
          return (
            <div key={name} style={{ display: "grid", gridTemplateColumns: "120px 1fr 190px", alignItems: "center", gap: 18, padding: "9px 0", borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.cloud }}>{name}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ height: 9, width: `${b * 100 * p}%`, background: C.borderStrong, borderRadius: 3 }} />
                {c > 0 ? (
                  <div style={{ height: 9, width: `${c * 100 * p}%`, background: C.accentOnInk, borderRadius: 3, boxShadow: `0 0 10px rgba(107,161,255,0.5)` }} />
                ) : (
                  <div style={{ height: 9, width: `${100 * p}%`, borderRadius: 3, border: `1px dashed ${C.warning}`, opacity: 0.7 }} />
                )}
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 16, color: c > 0 ? C.fgMuted : C.warning, textAlign: "right" }}>{note}</div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
};

const REQS = ["Quality ≥ required floor", "Protected behaviour holds", "Latency within budget", "Evidence complete"];

const ReplayPanels: React.FC<{ t: number }> = ({ t }) => {
  const a = ev("replay");
  const p = ramp(t, a, 22, easeOutExpo);
  const cases = 16;
  const caseAt = (i: number) => a + 9 + i * 6.6;
  return (
    <AbsoluteFill style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
      <div style={{ position: "absolute", left: 200, top: 650, width: 720 }}>
        <Panel style={{ padding: "26px 30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
            <Eyebrow>Workload replay · representative set</Eyebrow>
            <Eyebrow color={C.accentText}>{Math.min(cases, Math.max(0, Math.floor((t - a - 9) / 6.6) + 1))}/{cases}</Eyebrow>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 10 }}>
            {Array.from({ length: cases }).map((_, i) => {
              const on = ramp(t, caseAt(i), 6);
              const running = t >= caseAt(i) - 6 && t < caseAt(i);
              return (
                <div
                  key={i}
                  style={{
                    height: 44,
                    borderRadius: 8,
                    border: `1px solid ${on > 0 ? "rgba(76,199,156,0.5)" : running ? C.accentOnInk : C.border}`,
                    background: on > 0 ? `rgba(18,39,31,${0.5 + 0.5 * on})` : C.sunken,
                    fontFamily: FONT.mono,
                    fontSize: 14,
                    color: on > 0 ? C.verified : C.fgSubtle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: running ? `0 0 14px rgba(107,161,255,0.5)` : undefined,
                  }}
                >
                  case {String(i + 1).padStart(2, "0")}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
      <div style={{ position: "absolute", left: 980, top: 650, width: 740 }}>
        <Panel style={{ padding: "26px 30px" }}>
          <Eyebrow style={{ marginBottom: 14 }}>Defined requirements</Eyebrow>
          {REQS.map((r, i) => {
            const passAt = a + 40 + i * 20;
            const pass = t >= passAt;
            const pr = ramp(t, a + 6 + i * 5, 12);
            return (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderTop: `1px solid ${C.border}`, opacity: pr }}>
                <svg width="24" height="24" viewBox="0 0 26 26">
                  {pass ? (
                    <>
                      <circle cx="13" cy="13" r="11" fill={C.verified} fillOpacity="0.14" stroke={C.verified} strokeWidth="1.6" />
                      <path d="M8 13.5 L11.5 17 L18.5 9.5" fill="none" stroke={C.verified} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  ) : (
                    <>
                      <circle cx="13" cy="13" r="10" fill="none" stroke={C.borderStrong} strokeWidth="2" />
                      <path d="M13 3 A10 10 0 0 1 23 13" fill="none" stroke={C.fgMuted} strokeWidth="2" strokeLinecap="round" transform={`rotate(${(t * 14) % 360} 13 13)`} />
                    </>
                  )}
                </svg>
                <div style={{ fontSize: 23, fontWeight: 500, flex: 1 }}>{r}</div>
                <div style={{ fontFamily: FONT.mono, fontSize: 16, color: pass ? C.verified : C.fgSubtle }}>{pass ? "met" : "checking"}</div>
              </div>
            );
          })}
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

/** Scene 5 - THE PRODUCT. Observe -> Diagnose -> Plan -> Replay -> Verify. */
export const ExecutionGraphScene: React.FC<{ t: number }> = ({ t }) => {
  const g = useMemo(() => productGraph(), []);
  const diag = ev("diagnose");
  const plan = ev("plan");
  const replay = ev("replay");
  const verify = ev("verifyStep");
  const tone = (id: string): Tone => {
    if (id === "draftAlt") return "alt";
    if (t >= diag + 10 && EXPENSIVE.has(id)) return t >= plan + 20 && id === "draft" ? "dim" : "heat";
    if (t >= diag + 10 && t < replay) return "dim";
    return t >= replay ? "default" : "blue";
  };
  const edgeTone = (e: { from: string; to: string; dashed?: boolean }): Tone => {
    if (e.dashed) return "alt";
    if (t >= diag + 10 && (EXPENSIVE.has(e.to) || EXPENSIVE.has(e.from))) return t >= plan + 20 && (e.to === "draft" || e.from === "draft") ? "dim" : "heat";
    if (t >= diag + 10 && t < replay) return "dim";
    return "default";
  };
  const cam = [
    { at: ev("toProduct"), x: 0, y: 40, s: 0.92, rx: 18, ry: 0 },
    { at: ev("observe") + 40, x: 0, y: 30, s: 1.0, rx: 10, ry: -4 },
    { at: diag + 6, x: 0, y: 0, s: 1.0, rx: 8, ry: -6 },
    { at: plan + 10, x: 20, y: 40, s: 1.03, rx: 8, ry: -4 },
    { at: replay - 4, x: 0, y: 30, s: 1.0, rx: 6, ry: 0 },
    { at: replay + 18, x: 0, y: 150, s: 0.78, rx: 4, ry: 0 },
    { at: verify, x: 0, y: 150, s: 0.74, rx: 2, ry: 0 },
  ];
  const out = ramp(t, verify, 18, easeExit);
  const lines = ["v09", "v10", "v11"];
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${1 - out * 0.08})`, filter: out > 0.05 ? `blur(${out * 8}px)` : undefined }}>
      <StepRail t={t} />
      <CameraRig t={t} keys={cam}>
        <Layer z={0}>
          <ExecutionGraph nodes={g.nodes} edges={g.edges} t={t} width={1920} height={1080} tone={tone} edgeTone={edgeTone} />
          <Tag t={t} at={diag + 14} x={1210} y={360} text="EXPENSIVE PATH" color={C.warning} />
          <Tag t={t} at={plan + 22} x={965} y={735} text="ALTERNATIVE PLAN" color={C.accentText} />
        </Layer>
      </CameraRig>
      {t < diag + 20 && <TraceSpans t={t} />}
      {t >= ev("measure") - 10 && t < replay + 10 && <DiffPanel t={t} />}
      {t >= replay - 2 && <ReplayPanels t={t} />}
      {/* narration as quiet lower-third captions keep the scene readable without sound */}
      {lines.map((id, i) => (
        <div key={id} style={{ position: "absolute", left: 160, right: 160, top: 196 }}>
          <KineticText
            words={fromLine(wordFrames(id))}
            t={t}
            size={40}
            weight={500}
            color={C.fgMuted}
            tracking="-0.01em"
            exitAt={i < 2 ? voStart(lines[i + 1]) - 6 : verify - 4}
            exitDur={8}
            revealDur={12}
          />
        </div>
      ))}
    </AbsoluteFill>
  );
};
