#!/usr/bin/env node
/**
 * Local renderer. No cloud, no network at render time.
 *
 *   node scripts/render.mjs stills [film|teaser] [frame,frame,...]
 *   node scripts/render.mjs preview [film|teaser]     # half-res draft MP4
 *   node scripts/render.mjs film                      # 1920x1080 master
 *   node scripts/render.mjs teaser                    # 1080x1920 cutdown
 *   node scripts/render.mjs all
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BROWSER =
  process.env.REMOTION_BROWSER ??
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const browserExecutable = fs.existsSync(BROWSER) ? BROWSER : null;
const chromiumOptions = { gl: "swangle" };

const [, , mode = "all", which = "film", framesArg] = process.argv;
const ID = { film: "LaunchFilm", teaser: "VerticalTeaser" };

const DEFAULT_STILLS = {
  film: [20, 60, 110, 150, 215, 260, 300, 345, 390, 440, 520, 600, 640, 700, 735, 790, 860, 920, 975, 1040, 1110, 1190, 1260, 1320, 1400, 1490, 1540, 1590, 1640, 1700, 1745, 1790, 1850, 1905],
  teaser: [40, 120, 160, 200, 240, 310, 380, 440, 500, 560],
};

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
console.log(`bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

const comp = async (id) => selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });

async function stills(w) {
  const c = await comp(ID[w]);
  const frames = framesArg ? framesArg.split(",").map(Number) : DEFAULT_STILLS[w];
  const dir = path.join(ROOT, "out/stills");
  fs.mkdirSync(dir, { recursive: true });
  for (const frame of frames) {
    const output = path.join(dir, `${w}-${String(frame).padStart(4, "0")}.png`);
    await renderStill({ composition: c, serveUrl, output, frame, browserExecutable, chromiumOptions, scale: w === "teaser" ? 0.5 : 0.5 });
    process.stdout.write(`still ${frame} `);
  }
  console.log(`\nstills -> ${dir}`);
}

async function video(w, preview) {
  const c = await comp(ID[w]);
  const name = preview ? `previews/${w}-preview.mp4` : w === "film" ? "ZEVQORA-launch-film-1080p.mp4" : "ZEVQORA-teaser-9x16.mp4";
  const outputLocation = path.join(ROOT, "out", name);
  fs.mkdirSync(path.dirname(outputLocation), { recursive: true });
  let last = -1;
  await renderMedia({
    composition: c,
    serveUrl,
    codec: "h264",
    audioCodec: "aac",
    audioBitrate: "320k",
    crf: preview ? 26 : 16,
    pixelFormat: "yuv420p",
    x264Preset: preview ? "veryfast" : "slow",
    scale: preview ? 0.5 : 1,
    outputLocation,
    browserExecutable,
    chromiumOptions,
    concurrency: 4,
    // finals: lossless PNG frames + explicit BT.709 so the MP4 is standard
    // limited-range yuv420p (not full-range yuvj420p) with correct colour tags
    imageFormat: preview ? "jpeg" : "png",
    ...(preview ? { jpegQuality: 80 } : {}),
    colorSpace: "bt709",
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 20);
      if (p !== last) {
        last = p;
        process.stdout.write(`${p * 5}% `);
      }
    },
  });
  console.log(`\n${w} -> ${outputLocation} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

if (mode === "stills") await stills(which);
else if (mode === "preview") await video(which, true);
else if (mode === "film" || mode === "teaser") await video(mode, false);
else if (mode === "all") {
  await video("film", false);
  await video("teaser", false);
}
