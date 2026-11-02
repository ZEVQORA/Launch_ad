import React from "react";
import { C, FONT } from "../config/brand";

export type Status = "VERIFIED" | "REJECTED" | "INCOMPLETE" | "CANDIDATE" | "EVALUATING";

export const STATUS_STYLE: Record<Status, { fg: string; bg: string; border: string }> = {
  VERIFIED: { fg: C.verified, bg: C.verifiedBg, border: "rgba(76,199,156,0.45)" },
  REJECTED: { fg: C.rejected, bg: C.rejectedBg, border: "rgba(232,131,122,0.45)" },
  INCOMPLETE: { fg: C.warning, bg: C.warningBg, border: "rgba(214,169,74,0.45)" },
  CANDIDATE: { fg: C.accentText, bg: "#16203A", border: "rgba(107,161,255,0.45)" },
  EVALUATING: { fg: C.fgMuted, bg: C.elevated, border: C.borderStrong },
};

export const StatusChip: React.FC<{ status: Status; scale?: number; style?: React.CSSProperties }> = ({ status, scale = 1, style }) => {
  const s = STATUS_STYLE[status];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10 * scale,
        padding: `${7 * scale}px ${14 * scale}px`,
        borderRadius: 999,
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        color: s.fg,
        fontFamily: FONT.mono,
        fontSize: 17 * scale,
        fontWeight: 600,
        letterSpacing: "0.08em",
        ...style,
      }}
    >
      <span style={{ width: 8 * scale, height: 8 * scale, borderRadius: 99, background: s.fg, boxShadow: `0 0 ${10 * scale}px ${s.fg}` }} />
      {status}
    </div>
  );
};

/** A floating instrument panel with genuine depth: inner highlight, hairline, long soft shadow. */
export const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; glow?: string }> = ({ children, style, glow }) => (
  <div
    style={{
      background: "linear-gradient(180deg, rgba(31,36,46,0.94) 0%, rgba(21,24,30,0.96) 100%)",
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 40px 80px -20px rgba(0,0,0,0.65), 0 12px 24px -8px rgba(0,0,0,0.5)${glow ? `, 0 0 60px -10px ${glow}` : ""}`,
      color: C.cloud,
      fontFamily: FONT.sans,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Eyebrow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; color?: string }> = ({ children, style, color = C.fgMuted }) => (
  <div style={{ fontFamily: FONT.mono, fontSize: 17, letterSpacing: "0.14em", textTransform: "uppercase", color, fontWeight: 500, ...style }}>
    {children}
  </div>
);

/** Honesty label for any product-like UI on screen. */
export const IllustrativeTag: React.FC<{ opacity?: number; style?: React.CSSProperties }> = ({ opacity = 1, style }) => (
  <div
    style={{
      position: "absolute",
      right: 64,
      bottom: 50,
      fontFamily: FONT.mono,
      fontSize: 16,
      letterSpacing: "0.12em",
      color: C.fgSubtle,
      opacity,
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: 10,
      ...style,
    }}
  >
    <span style={{ width: 18, height: 1, background: C.fgSubtle, display: "inline-block" }} />
    Illustrative visualization · not customer data
  </div>
);
