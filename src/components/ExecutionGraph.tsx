import React from "react";
import { C, FONT } from "../config/brand";
import { easeOutExpo, easeStd, ramp, rnd } from "../lib/anim";

export type Tone = "default" | "blue" | "heat" | "bad" | "good" | "alt" | "dim";

export interface GNode {
  id: string;
  x: number;
  y: number;
  label?: string;
  sub?: string;
  kind?: "dot" | "pill";
  appear: number;
  r?: number;
}

export interface GEdge {
  from: string;
  to: string;
  appear: number;
  dur?: number;
  dashed?: boolean;
  tokens?: number;
  speed?: number;
  /** retry loop drawn as an arc back onto `from` */
  loop?: boolean;
  bend?: number;
}

const TONE: Record<Tone, { stroke: string; fill: string; dot: string; text: string; glow: string }> = {
  default: { stroke: C.borderStrong, fill: C.surface, dot: C.accentOnInk, text: C.cloud, glow: "rgba(70,139,255,0.0)" },
  blue: { stroke: C.accentOnInk, fill: "#16203A", dot: C.blue, text: C.cloud, glow: "rgba(70,139,255,0.45)" },
  heat: { stroke: C.warning, fill: "#211C10", dot: C.warning, text: C.cloud, glow: "rgba(214,169,74,0.45)" },
  bad: { stroke: C.rejected, fill: C.rejectedBg, dot: C.rejected, text: C.cloud, glow: "rgba(232,131,122,0.4)" },
  good: { stroke: C.verified, fill: C.verifiedBg, dot: C.verified, text: C.cloud, glow: "rgba(76,199,156,0.4)" },
  alt: { stroke: C.accentOnInk, fill: "#121A2B", dot: C.accentOnInk, text: C.accentText, glow: "rgba(107,161,255,0.35)" },
  dim: { stroke: C.border, fill: C.sunken, dot: C.fgSubtle, text: C.fgSubtle, glow: "rgba(0,0,0,0)" },
};

const PILL_H = 46;
const CH = 0.6; // mono char width ratio
export const pillW = (n: GNode, fs = 19) =>
  Math.max(n.label ? n.label.length : 0, n.sub ? n.sub.length * 0.8 : 0) * fs * CH + 54;

type P = [number, number];
const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

const edgeGeom = (a: GNode, b: GNode, e: GEdge, fs: number): [P, P, P, P] => {
  if (e.loop) {
    const h = 70 + (e.bend ?? 0);
    const x = a.x, y = a.y - (a.kind === "pill" ? PILL_H / 2 : 8);
    return [[x - 14, y], [x - 60, y - h], [x + 60, y - h], [x + 14, y]];
  }
  const aw = a.kind === "pill" ? pillW(a, fs) / 2 : (a.r ?? 7);
  const bw = b.kind === "pill" ? pillW(b, fs) / 2 : (b.r ?? 7);
  const p0: P = [a.x + aw, a.y];
  const p3: P = [b.x - bw, b.y];
  const dx = Math.max(40, (p3[0] - p0[0]) * 0.5);
  const bend = e.bend ?? 0;
  return [p0, [p0[0] + dx, p0[1] + bend], [p3[0] - dx, p3[1] + bend], p3];
};

const approxLen = (g: [P, P, P, P]) => {
  let L = 0;
  let prev = g[0];
  for (let i = 1; i <= 24; i++) {
    const p = bez(g[0], g[1], g[2], g[3], i / 24);
    L += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  return L;
};

interface Props {
  nodes: GNode[];
  edges: GEdge[];
  t: number;
  width: number;
  height: number;
  tone?: (id: string) => Tone;
  edgeTone?: (e: GEdge) => Tone;
  fontSize?: number;
  tokenScale?: number;
  style?: React.CSSProperties;
  labelOpacity?: number;
}

export const ExecutionGraph: React.FC<Props> = ({
  nodes,
  edges,
  t,
  width,
  height,
  tone = () => "default",
  edgeTone,
  fontSize = 19,
  tokenScale = 1,
  style,
  labelOpacity = 1,
}) => {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible", ...style }}>
      <defs>
        <radialGradient id="tok">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="35%" stopColor={C.accentOnInk} stopOpacity="0.9" />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tokHeat">
          <stop offset="0%" stopColor="#fff6e0" stopOpacity="1" />
          <stop offset="35%" stopColor={C.warning} stopOpacity="0.85" />
          <stop offset="100%" stopColor={C.warning} stopOpacity="0" />
        </radialGradient>
      </defs>
      {edges.map((e, i) => {
        const a = byId[e.from];
        const b = byId[e.loop ? e.from : e.to];
        if (!a || !b) return null;
        const g = edgeGeom(a, b, e, fontSize);
        const p = ramp(t, e.appear, e.dur ?? 18, easeStd);
        if (p <= 0) return null;
        const tn = TONE[edgeTone ? edgeTone(e) : tone(e.to)];
        const d = `M ${g[0][0]} ${g[0][1]} C ${g[1][0]} ${g[1][1]}, ${g[2][0]} ${g[2][1]}, ${g[3][0]} ${g[3][1]}`;
        const L = approxLen(g);
        let dash: string;
        if (e.dashed) {
          const drawn = L * p;
          const reps = Math.floor(drawn / 14);
          dash = [...Array(reps).fill("8 6"), `${Math.max(drawn - reps * 14, 0)} ${L + 20}`].join(" ");
        } else {
          dash = `${L * p} ${L + 20}`;
        }
        const nTok = Math.round((e.tokens ?? 0) * tokenScale);
        const speed = e.speed ?? 0.018;
        const heatTok = tn === TONE.heat || tn === TONE.bad;
        return (
          <g key={`e${i}`}>
            <path d={d} fill="none" stroke={tn.stroke} strokeOpacity={tn === TONE.dim ? 0.5 : 0.85} strokeWidth={e.loop ? 1.6 : 2} strokeDasharray={dash} strokeLinecap="round" />
            {tn.glow !== TONE.default.glow && (
              <path d={d} fill="none" stroke={tn.stroke} strokeOpacity={0.18} strokeWidth={8} strokeDasharray={dash} strokeLinecap="round" />
            )}
            {p >= 1 &&
              Array.from({ length: nTok }).map((_, k) => {
                const ph = (rnd(`${e.from}-${e.to}-${k}`) + (t - e.appear) * speed * (0.8 + 0.4 * rnd(`s${i}${k}`))) % 1;
                const [x, y] = bez(g[0], g[1], g[2], g[3], ph);
                const fade = Math.min(1, ph * 6, (1 - ph) * 6);
                return (
                  <g key={k} opacity={fade}>
                    <circle cx={x} cy={y} r={9} fill={`url(#${heatTok ? "tokHeat" : "tok"})`} opacity={0.55} />
                    <circle cx={x} cy={y} r={2.2} fill="#ffffff" />
                  </g>
                );
              })}
          </g>
        );
      })}
      {nodes.map((n) => {
        const p = ramp(t, n.appear, 14, easeOutExpo);
        if (p <= 0) return null;
        const tn = TONE[tone(n.id)];
        const ring = ramp(t, n.appear, 26);
        if (n.kind === "pill") {
          const w = pillW(n, fontSize);
          const h = n.sub ? PILL_H + 22 : PILL_H;
          return (
            <g key={n.id} transform={`translate(${n.x} ${n.y}) scale(${0.85 + 0.15 * p})`} opacity={p}>
              {tn.glow !== TONE.default.glow && (
                <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} rx={16} fill="none" stroke={tn.stroke} strokeOpacity={0.22} strokeWidth={6} />
              )}
              <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={11} fill={tn.fill} stroke={tn.stroke} strokeWidth={1.5} />
              <circle cx={-w / 2 + 20} cy={n.sub ? -11 : 0} r={4.5} fill={tn.dot} />
              <text
                x={-w / 2 + 36}
                y={n.sub ? -11 : 0}
                dominantBaseline="central"
                fontFamily={FONT.mono}
                fontSize={fontSize}
                fontWeight={500}
                fill={tn.text}
                opacity={labelOpacity}
              >
                {n.label}
              </text>
              {n.sub && (
                <text x={-w / 2 + 36} y={14} dominantBaseline="central" fontFamily={FONT.mono} fontSize={fontSize * 0.74} fill={C.fgMuted} opacity={labelOpacity}>
                  {n.sub}
                </text>
              )}
            </g>
          );
        }
        const r = n.r ?? 7;
        return (
          <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
            {ring < 1 && <circle r={r + ring * 26} fill="none" stroke={tn.dot} strokeOpacity={(1 - ring) * 0.6} strokeWidth={1.5} />}
            <circle r={r * 2.4} fill={tn.dot} opacity={0.12 * p} />
            <circle r={r * p} fill={tn.fill} stroke={tn.dot} strokeWidth={2} />
            <circle r={r * 0.42 * p} fill={tn.dot} />
            {n.label && (
              <text y={r + 24} textAnchor="middle" fontFamily={FONT.mono} fontSize={fontSize * 0.85} fill={tn.text} opacity={p * labelOpacity}>
                {n.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
