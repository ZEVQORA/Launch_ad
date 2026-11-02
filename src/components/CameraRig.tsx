import React from "react";
import { AbsoluteFill } from "remotion";
import { easeInOut, keys } from "../lib/anim";

export interface CamKey {
  at: number;
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number;
}

const DEF = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 };

/** Evaluate a keyframed camera at frame t (every channel eased independently). */
export const evalCam = (t: number, kf: CamKey[]) => {
  const ch = (k: keyof typeof DEF) => {
    let last = DEF[k];
    const pts: [number, number][] = kf.map((c) => {
      const v = c[k];
      if (v !== undefined) last = v;
      return [c.at, last];
    });
    return keys(t, pts, easeInOut);
  };
  return { x: ch("x"), y: ch("y"), z: ch("z"), rx: ch("rx"), ry: ch("ry"), rz: ch("rz"), s: ch("s") };
};

interface Props {
  t: number;
  keys: CamKey[];
  perspective?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * A 2.5D camera. The world moves opposite to the camera; children can sit at
 * different depths with <Layer z={...}> for true parallax under perspective.
 */
export const CameraRig: React.FC<Props> = ({ t, keys: kf, perspective = 1600, children, style }) => {
  const c = evalCam(t, kf);
  return (
    <AbsoluteFill style={{ perspective, perspectiveOrigin: "50% 50%", ...style }}>
      <AbsoluteFill
        style={{
          transformStyle: "preserve-3d",
          // x/y are the world point (offset from frame centre) the camera looks at;
          // translate is applied first, so framing is independent of zoom.
          transform: `scale(${c.s}) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg) translate3d(${-c.x}px, ${-c.y}px, ${c.z}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Layer: React.FC<{ z?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ z = 0, children, style }) => (
  <AbsoluteFill style={{ transformStyle: "preserve-3d", transform: `translateZ(${z}px)`, ...style }}>{children}</AbsoluteFill>
);
