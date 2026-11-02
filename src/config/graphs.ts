/**
 * Graph data for the film. Positions are in a 1920x1080 "world"; the camera
 * frames them. Generated deterministically (seeded), never randomly per render.
 */
import { GEdge, GNode } from "../components/ExecutionGraph";
import { rnd } from "../lib/anim";
import { ev } from "./timeline";

/* ---------------- Scene 1-3: the growing, increasingly expensive graph ---- */

export const COST_ROOT = { x: 230, y: 540 };

const LAYERS = [1, 2, 4, 6, 8, 11, 14];
const LABELS: Record<string, string> = {
  "0-0": "request",
  "1-0": "router",
  "2-1": "llm call",
  "2-2": "retrieve",
  "3-1": "llm call",
  "3-4": "tool call",
  "4-2": "llm call",
  "4-6": "judge",
  "5-3": "llm call · retry",
  "5-8": "llm call",
};

export const costGraph = (): { nodes: GNode[]; edges: GEdge[]; retryNodes: string[] } => {
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];
  // appear windows per layer (absolute frames), keyed to the narration
  const win: [number, number][] = [
    [ev("seed"), ev("seed")],
    [ev("seed") + 9, ev("seed") + 16],
    [ev("seed") + 24, ev("tokens") + 8],
    [ev("tokens"), ev("models")],
    [ev("models"), ev("retries") + 4],
    [ev("retries"), ev("costs") + 6],
    [ev("costs"), ev("costs") + 40],
  ];
  LAYERS.forEach((count, li) => {
    const x = COST_ROOT.x + li * 245;
    const spread = Math.min(940, 120 + count * 68);
    for (let k = 0; k < count; k++) {
      const id = `${li}-${k}`;
      const yy = count === 1 ? COST_ROOT.y : COST_ROOT.y - spread / 2 + (spread * k) / (count - 1);
      const jitter = li === 0 ? 0 : (rnd(`jy${id}`) - 0.5) * 34;
      const [a, b] = win[li];
      const appear = Math.round(a + (b - a) * (count === 1 ? 0 : k / (count - 1)));
      const label = LABELS[id];
      nodes.push({
        id,
        x: x + (li === 0 ? 0 : (rnd(`jx${id}`) - 0.5) * 40),
        y: yy + jitter,
        appear,
        kind: label ? "pill" : "dot",
        label,
        r: 6 + rnd(`r${id}`) * 3,
      });
      if (li > 0) {
        const prev = LAYERS[li - 1];
        const p1 = Math.min(prev - 1, Math.round((k / Math.max(count - 1, 1)) * (prev - 1)));
        edges.push({ from: `${li - 1}-${p1}`, to: id, appear: appear - 6, dur: 14, tokens: 2, speed: 0.02 });
        if (prev > 1 && rnd(`e2${id}`) > 0.45) {
          const p2 = Math.max(0, Math.min(prev - 1, p1 + (rnd(`d${id}`) > 0.5 ? 1 : -1)));
          if (p2 !== p1) edges.push({ from: `${li - 1}-${p2}`, to: id, appear: appear - 2, dur: 14, tokens: 1, speed: 0.016 });
        }
      }
    }
  });
  // retry loops: the same work, paid for again
  const retryNodes = ["3-1", "4-2", "5-3", "4-5", "5-8", "6-6", "5-1", "6-11"];
  retryNodes.forEach((id, i) => {
    edges.push({ from: id, to: id, loop: true, appear: ev("retries") + i * 5, dur: 12, tokens: 1, speed: 0.03, bend: (i % 3) * 8 });
  });
  return { nodes, edges, retryNodes };
};

/* ---------------- Scene 5: a clean, legible agent pipeline --------------- */

const Y = 470;
export const productGraph = (): { nodes: GNode[]; edges: GEdge[] } => {
  // start assembling straight off the logo hand-off so there is no dead air
  const base = ev("toProduct") + 2;
  const nodes: GNode[] = [
    { id: "request", x: 230, y: Y, label: "request", kind: "pill", appear: base + 9 },
    { id: "classify", x: 470, y: Y, label: "classify", kind: "pill", appear: base + 15 },
    { id: "retrieve", x: 715, y: Y, label: "retrieve", kind: "pill", appear: base + 21 },
    { id: "draft", x: 965, y: Y, label: "draft", sub: "large model", kind: "pill", appear: base + 27 },
    { id: "tool", x: 1210, y: Y, label: "tool call", kind: "pill", appear: base + 33 },
    { id: "review", x: 1455, y: Y, label: "review", sub: "large model", kind: "pill", appear: base + 39 },
    { id: "respond", x: 1695, y: Y, label: "respond", kind: "pill", appear: base + 45 },
    // the alternative plan, revealed at PLAN
    { id: "draftAlt", x: 965, y: Y + 165, label: "draft", sub: "smaller model", kind: "pill", appear: ev("plan") + 10 },
  ];
  const chain = ["request", "classify", "retrieve", "draft", "tool", "review", "respond"];
  const edges: GEdge[] = chain.slice(1).map((id, i) => ({
    from: chain[i],
    to: id,
    appear: base + 12 + i * 6,
    dur: 10,
    tokens: 2,
    speed: 0.022,
  }));
  edges.push({ from: "retrieve", to: "draftAlt", appear: ev("plan") + 2, dur: 16, dashed: true, tokens: 2, speed: 0.02, bend: 40 });
  edges.push({ from: "draftAlt", to: "tool", appear: ev("plan") + 18, dur: 16, dashed: true, tokens: 2, speed: 0.02, bend: -40 });
  return { nodes, edges };
};

export const EXPENSIVE = new Set(["draft", "review"]);
