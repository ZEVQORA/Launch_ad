import React from "react";
import { C, FONT } from "../config/brand";
import { easeOutExpo, ramp } from "../lib/anim";
import { Panel, Status, STATUS_STYLE, StatusChip } from "./Chrome";

export type RowState = "pass" | "fail" | "pending" | "missing";

export interface CardRow {
  label: string;
  /** right-aligned reading, e.g. "below floor" */
  value?: string;
  /** state sequence: [[frame, state], ...] - the last one reached wins */
  states: [number, RowState][];
  at: number;
}

export interface QualityMeter {
  at: number;
  dur: number;
  to: number;
  floor: number;
  label?: string;
  /** frame the (still empty) meter becomes visible; defaults to shortly before `at` */
  visibleAt?: number;
}

interface Props {
  t: number;
  appear: number;
  width?: number;
  eyebrow: string;
  title: string;
  /** status sequence: [[frame, status], ...] */
  status: [number, Status][];
  rows: CardRow[];
  footer?: string;
  footerAt?: number;
  meter?: QualityMeter;
  stampAt?: number;
  scale?: number;
  style?: React.CSSProperties;
}

const pick = <T,>(t: number, seq: [number, T][]): T => {
  let v = seq[0][1];
  for (const [f, s] of seq) if (t >= f) v = s;
  return v;
};

const Icon: React.FC<{ state: RowState; t: number; s: number }> = ({ state, t, s }) => {
  const sz = 26 * s;
  if (state === "pending") {
    return (
      <svg width={sz} height={sz} viewBox="0 0 26 26">
        <circle cx="13" cy="13" r="10" fill="none" stroke={C.borderStrong} strokeWidth="2" />
        <path d="M13 3 A10 10 0 0 1 23 13" fill="none" stroke={C.fgMuted} strokeWidth="2" strokeLinecap="round" transform={`rotate(${(t * 14) % 360} 13 13)`} />
      </svg>
    );
  }
  const col = state === "pass" ? C.verified : state === "fail" ? C.rejected : C.warning;
  return (
    <svg width={sz} height={sz} viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="11" fill={col} fillOpacity="0.14" stroke={col} strokeWidth="1.6" />
      {state === "pass" && <path d="M8 13.5 L11.5 17 L18.5 9.5" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
      {state === "fail" && <path d="M9 9 L17 17 M17 9 L9 17" stroke={col} strokeWidth="2.2" strokeLinecap="round" />}
      {state === "missing" && <path d="M8.5 13 L17.5 13" stroke={col} strokeWidth="2.2" strokeLinecap="round" />}
    </svg>
  );
};

/**
 * The reviewable decision: one candidate change, its named gates, and an
 * honest verdict. A card never claims deployment or realised savings.
 */
export const DecisionCard: React.FC<Props> = ({
  t,
  appear,
  width = 640,
  eyebrow,
  title,
  status,
  rows,
  footer,
  footerAt,
  meter,
  stampAt,
  scale = 1,
  style,
}) => {
  const p = ramp(t, appear, 20, easeOutExpo);
  const st = pick(t, status);
  const stChange = status.length > 1 ? status[status.length - 1][0] : -999;
  const flash = st !== "CANDIDATE" && st !== "EVALUATING" ? 1 - ramp(t, stChange, 24) : 0;
  const ss = STATUS_STYLE[st];
  const stamp = stampAt !== undefined ? ramp(t, stampAt, 10, easeOutExpo) : 0;
  const s = scale;
  return (
    <div style={{ width: width * s, opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.96 + 0.04 * p})`, position: "relative", ...style }}>
      <Panel
        glow={st === "VERIFIED" || st === "REJECTED" || st === "INCOMPLETE" ? ss.border : undefined}
        style={{ padding: `${30 * s}px ${34 * s}px`, borderColor: flash > 0 ? ss.border : C.border }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 * s }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 16 * s, letterSpacing: "0.14em", color: C.fgMuted, textTransform: "uppercase" }}>{eyebrow}</div>
          <StatusChip status={st} scale={s} style={{ transform: `scale(${1 + flash * 0.12})`, boxShadow: flash ? `0 0 ${40 * flash}px ${ss.fg}` : undefined }} />
        </div>
        <div style={{ fontSize: 34 * s, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 22 * s, lineHeight: 1.15 }}>{title}</div>
        {meter && <Meter t={t} m={meter} s={s} />}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 * s }}>
          {rows.map((r, i) => {
            const rp = ramp(t, r.at, 12);
            const state = pick(t, r.states);
            const valCol = state === "pass" ? C.verified : state === "fail" ? C.rejected : state === "missing" ? C.warning : C.fgMuted;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16 * s,
                  padding: `${13 * s}px 0`,
                  borderTop: `1px solid ${C.border}`,
                  opacity: rp,
                  transform: `translateX(${(1 - rp) * 14}px)`,
                }}
              >
                <Icon state={state} t={t} s={s} />
                <div style={{ fontSize: 23 * s, color: C.cloud, flex: 1, fontWeight: 500 }}>{r.label}</div>
                {r.value && (
                  <div style={{ fontFamily: FONT.mono, fontSize: 18 * s, color: valCol, letterSpacing: "0.02em" }}>{state === "pending" ? "evaluating…" : r.value}</div>
                )}
              </div>
            );
          })}
        </div>
        {footer && (
          <div
            style={{
              marginTop: 18 * s,
              paddingTop: 16 * s,
              borderTop: `1px solid ${C.border}`,
              fontFamily: FONT.mono,
              fontSize: 17 * s,
              color: C.fgMuted,
              opacity: ramp(t, footerAt ?? appear + 20, 14),
            }}
          >
            {footer}
          </div>
        )}
      </Panel>
      {stampAt !== undefined && stamp > 0 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "52%",
            transform: `translate(-50%, -50%) rotate(-7deg) scale(${1.5 - 0.5 * stamp})`,
            opacity: stamp,
            border: `4px solid ${C.rejected}`,
            borderRadius: 14,
            padding: `${10 * s}px ${30 * s}px`,
            fontFamily: FONT.mono,
            fontWeight: 600,
            fontSize: 64 * s,
            letterSpacing: "0.12em",
            color: C.rejected,
            background: "rgba(42,24,21,0.82)",
            boxShadow: `0 0 60px rgba(232,131,122,0.25)`,
          }}
        >
          REJECTED
        </div>
      )}
    </div>
  );
};

const Meter: React.FC<{ t: number; m: QualityMeter; s: number }> = ({ t, m, s }) => {
  const p = ramp(t, m.at, m.dur);
  const v = m.to * p;
  const below = p > 0.98 && m.to < m.floor;
  const col = p < 0.98 ? C.accentOnInk : below ? C.rejected : C.verified;
  return (
    <div style={{ marginBottom: 20 * s, opacity: ramp(t, m.visibleAt ?? m.at - 8, 10) }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.mono, fontSize: 16 * s, color: C.fgMuted, letterSpacing: "0.1em", marginBottom: 10 * s }}>
        <span>{m.label ?? "QUALITY ON REPLAYED CASES"}</span>
        <span style={{ color: below ? C.rejected : C.fgMuted }}>{below ? "BELOW REQUIRED FLOOR" : t < m.at ? "NOT YET REPLAYED" : "MEASURING"}</span>
      </div>
      <div style={{ position: "relative", height: 12 * s, borderRadius: 99, background: C.sunken, border: `1px solid ${C.border}` }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v * 100}%`, borderRadius: 99, background: col, boxShadow: `0 0 18px ${col}` }} />
        <div style={{ position: "absolute", left: `${m.floor * 100}%`, top: -8 * s, bottom: -8 * s, width: 2, background: C.cloud, opacity: 0.85 }} />
        <div style={{ position: "absolute", left: `${m.floor * 100}%`, top: 22 * s, transform: "translateX(-50%)", fontFamily: FONT.mono, fontSize: 14 * s, color: C.cloud, opacity: 0.8, whiteSpace: "nowrap" }}>
          required floor
        </div>
      </div>
      <div style={{ height: 22 * s }} />
    </div>
  );
};
