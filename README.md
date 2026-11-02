# ZEVQORA — "That's why we built ZEVQORA" launch film

A self-contained, zero-budget production project for the ZEVQORA launch film. It is
built with Remotion and local audio tools, and rendered entirely on the local machine.

This repository is **separate from the ZEVQORA product** (`ZEVQORA/Zevqora`) and
the website design repo (`ZEVQORA/Web_Design`). Nothing here imports from them or
deploys anything. Brand geometry and fonts were copied in from `Web_Design` unchanged.

> **Not for publication without founder approval.** The rendered films are internal
> drafts for review.

## Deliverables

| File | What |
|---|---|
| `out/ZEVQORA-launch-film-1080p.mp4` | 16:9 master — 1920×1080, 30 fps, H.264 High, AAC stereo 48 kHz, 64.0 s |
| `out/ZEVQORA-teaser-9x16.mp4` | 9:16 social cutdown — 1080×1920, 30 fps, 19.0 s |
| `public/audio/mix/{film,teaser}-mix.wav` | Final stereo mixes (48 kHz / 24-bit, −14 LUFS, ≤ −1 dBTP) |
| `public/audio/stems/{film,teaser}-{vo,music,sfx}.wav` | Post-fader stems (vo + music + sfx = pre-limiter mix) |
| `public/audio/vo/v01…v22.wav` + `manifest.json` | Individual narration lines |
| `public/audio/music/score-*.wav`, `public/audio/sfx/sfx-*.wav` | Raw score and SFX layers |
| `out/stills/` | QA stills and contact sheets |
| `docs/STORYBOARD.md` | Scene-by-scene storyboard and timeline |
| `docs/AUDIO-LICENSES.md` | Licence manifest for voice, music, SFX, fonts and brand assets |
| `docs/RENDER-QA.md` | Render and QA report |

## Project layout

```
src/
  Root.tsx                    compositions: LaunchFilm (16:9), VerticalTeaser (9:16)
  compositions/               LaunchFilm.tsx, VerticalTeaser.tsx
  scenes/                     01-Opening … 07-BrandFinale (every scene takes absolute frame t)
  components/                 KineticText, ExecutionGraph, DecisionCard, CameraRig,
                              AnimatedLogo, Backdrop, Chrome (chips/panels/labels), FontGate
  config/
    timeline.json             ★ single source of truth for ALL timing (seconds)
    timeline.ts               frame helpers: ev(), voStart(), wordFrames()
    words.json                measured per-word timings of the narration
    brand.ts                  palette, fonts, easing (from Web_Design globals.css)
    graphs.ts                 deterministic graph data
  brand/marks.ts              locked logo geometry (verbatim from Web_Design)
scripts/
  narration.json              narration text, voice, speed, locked brand phonemes
  generate-voice.py           Kokoro-82M (kokoro-onnx) narration generator
  asr-check.py                local Whisper intelligibility QA
  word-timings.py             word-level timings -> src/config/words.json
  compose-music.py, dsp.py    original score synthesis
  sound-design.py             SFX layer, placed on timeline events
  mix-audio.py                ducking, VO compression, limiter, loudness, stems
  render.mjs                  stills / previews / final renders
  contact-sheet.py, qa-check.sh
```

## Rebuild from scratch (all free, all local)

Requirements: Node 18+ (22 used), Python 3.10+ (3.13 used), FFmpeg. A Chrome headless
shell is found automatically at the path in `remotion.config.ts`, or set `REMOTION_BROWSER`.

```bash
npm ci
```

```bash
python3 -m venv .tts/venv && .tts/venv/bin/pip install kokoro-onnx==0.6.1 soundfile numpy scipy faster-whisper==1.1.1 pyloudnorm requests pillow
```

```bash
mkdir -p .tts/models && cd .tts/models && curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx && curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin && cd ../..
```

Then run the pipeline in order:

```bash
.tts/venv/bin/python scripts/generate-voice.py final
```

```bash
.tts/venv/bin/python scripts/word-timings.py && .tts/venv/bin/python scripts/asr-check.py final
```

```bash
for w in film teaser; do .tts/venv/bin/python scripts/compose-music.py $w && .tts/venv/bin/python scripts/sound-design.py $w && .tts/venv/bin/python scripts/mix-audio.py $w; done
```

```bash
node scripts/render.mjs all
```

```bash
bash scripts/qa-check.sh out/ZEVQORA-launch-film-1080p.mp4
```

## Common edits

- **Change a narration line:** edit `scripts/narration.json`, then re-run the whole pipeline above. Check the new line length against the next start time in `src/config/timeline.json` (the VO durations are in `public/audio/vo/manifest.json`).
- **Move a beat:** change its seconds in `src/config/timeline.json`. Picture, score, SFX and mix all follow; re-run music, SFX, mix and render.
- **Try another voice:** set `"voice"` in `scripts/narration.json` (e.g. `bf_emma`, `am_michael`). Run `generate-voice.py compare` to audition six voices.
- **Live preview / scrubbing:** `npm run studio`.
- **Fast draft render:** `node scripts/render.mjs preview film` (half resolution).
- **Stills for review:** `node scripts/render.mjs stills film 300,900,1500`.

## Brand and honesty guardrails baked in

- The Z mark is always Soft Blue `#468BFF`; the wordmark is Cloud on ink. The geometry is never redrawn.
- The palette is limited to Ink / Cloud / Soft Blue / Stone, plus the site's desaturated state colours.
- Every product-like screen is labelled "Illustrative visualization · not customer data".
- The film contains no metrics, customers or savings figures. VERIFIED means "ready for human review", never deployed.
