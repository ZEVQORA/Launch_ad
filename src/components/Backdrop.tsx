import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../config/brand";
import { rnd } from "../lib/anim";

interface BackdropProps {
  /** 0..1 strength of the Soft Blue key light. */
  glow?: number;
  /** Key-light position in % of frame. */
  glowX?: number;
  glowY?: number;
  /** 0..1 warm "cost heat" spill (uses the warning step, never a new hue). */
  heat?: number;
  children?: React.ReactNode;
}

/**
 * Deep ink stage: one soft blue key light, a cool rim, vignette and film grain.
 * Nothing decorative moves here unless the story asks it to.
 */
export const Backdrop: React.FC<BackdropProps> = ({ glow = 0.5, glowX = 50, glowY = 46, heat = 0, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const g = Math.max(0, Math.min(1, glow));
  // grain offset jumps every 2 frames - film-like, deterministic
  const gs = Math.floor(frame / 2);
  const gx = Math.floor(rnd(`gx${gs}`) * 384);
  const gy = Math.floor(rnd(`gy${gs}`) * 384);
  const diag = Math.hypot(width, height);
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(${diag * 0.55}px ${diag * 0.38}px at ${glowX}% ${glowY}%, rgba(70,139,255,${0.16 * g}) 0%, rgba(70,139,255,${0.05 * g}) 40%, rgba(15,17,21,0) 70%)`,
        }}
      />
      {heat > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(${diag * 0.5}px ${diag * 0.32}px at 62% 58%, rgba(214,169,74,${0.09 * heat}) 0%, rgba(232,131,122,${0.04 * heat}) 45%, rgba(15,17,21,0) 75%)`,
          }}
        />
      )}
      <AbsoluteFill>{children}</AbsoluteFill>
      {/* vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(${diag * 0.62}px ${diag * 0.48}px at 50% 50%, rgba(0,0,0,0) 55%, rgba(5,6,8,0.72) 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* grain */}
      <AbsoluteFill style={{ opacity: 0.055, mixBlendMode: "overlay", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            inset: -384,
            backgroundImage: `url(${staticFile("textures/grain.png")})`,
            backgroundSize: "384px 384px",
            transform: `translate(${gx}px, ${gy}px)`,
          }}
        />
      </AbsoluteFill>
      {/* invisible preload so the grain texture is ready before the first frame */}
      <Img src={staticFile("textures/grain.png")} style={{ display: "none" }} />
    </AbsoluteFill>
  );
};
