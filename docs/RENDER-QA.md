# Render & QA report

Date: 2026-11-02 · Machine: 4 vCPU, 15 GB RAM, no GPU (Linux) · Remotion 4.0.539 · Chromium headless shell · FFmpeg 6.1.1

All checks below were run on the **exported MP4 files**, not on the source code.

## Deliverables

| File | sha256 | Size |
|---|---|---|
| `out/ZEVQORA-launch-film-1080p.mp4` | `96d18efe9addf0f25b2f2c1afe4ebef2f150033eda8b7066618af232d63401a6` | 16.9 MB |
| `out/ZEVQORA-teaser-9x16.mp4` | `9bf738cc2efeee0b90f0517a853bc489b785afb0c5a0c1739ed1c673bbd5a4a0` | 5.2 MB |

Render time: about 23 min for the film and about 7 min for the teaser (PNG frames, x264 `slow`, CRF 16, 4 parallel tabs).

## Technical verification (ffprobe / ffmpeg)

| Check | Film (16:9) | Teaser (9:16) | Target |
|---|---|---|---|
| Video codec | H.264 High, yuv420p | H.264 High, yuv420p | H.264 ✔ |
| Colour | BT.709, limited (tv) range, tagged | same | standard web playback ✔ |
| Resolution | 1920×1080 | 1080×1920 | ✔ |
| Frame rate | 30/1 | 30/1 | 30 fps ✔ |
| Frames | 1920 | 570 | no dropped frames ✔ |
| Duration | 64.000 s | 19.008 s (19.000 s video; AAC frame padding) | 55–65 s / 15–20 s ✔ |
| Audio | AAC-LC, 48 kHz, stereo, 320 kb/s | same | stereo AAC ✔ |
| Integrated loudness | **−14.0 LUFS** | **−14.1 LUFS** | online-platform standard ✔ |
| Loudness range | 2.2 LU | 3.2 LU | consistent ✔ |
| Peak | −1.4 dBFS (4×-oversampled true-peak estimate −1.48 dBTP) | −1.5 dBFS | no clipping ✔ |
| Frozen video ≥ 2.5 s | none | none | ✔ |
| Audio dropouts (< −50 dB, ≥ 0.6 s) | none | none | ✔ |
| Watermark | none (Remotion adds none) | none | ✔ |

### Black-frame detector hits (all reviewed, all intentional)

`blackdetect` (≥ 0.25 s, ≥ 98% of pixels below 10% luma):

| Film time | What is on screen | Verdict |
|---|---|---|
| 0.00–0.30 | Black before the opening impact | intentional cold open |
| 0.50–0.87 | Thin line of light only | intentional (detector counts the line as < 2% of pixels) |
| 22.43–22.90 | Everything collapsed into a point of light, then silence | intentional pre-reveal breath |
| 26.97–27.83 | Lockup gliding into the corner brand bug; step rail fading in | intentional hand-off (was 1.6 s in the first render; tightened to 0.87 s) |
| 54.07–55.27 | "Measure." alone in negative space | intentional; white type is < 2% of pixels |
| Teaser 5.47–5.90 | Collapse to a point before the reveal | intentional |

## Narration intelligibility (local Whisper `small.en`, offline)

| Test | Result |
|---|---|
| Each of the 22 VO lines in isolation (`docs/qa/asr-final.json`) | **22/22 exact** (WER 0) |
| Whole film soundtrack, decoded from the final MP4, with music and SFX (`docs/qa/asr-final-mix-film.json`) | **WER 0.0** over the full 141-word script (avg log-prob −0.112) |
| Whole teaser soundtrack from the final MP4 (`docs/qa/asr-final-mix-teaser.json`) | **WER 0.0** |

The recogniser spells the coined brand name "Zevkora"/"Zevchora". The phonemes are pinned to /zˈɛvkɔːɹə/ for every occurrence.

## Mix

| | Film | Teaser |
|---|---|---|
| VO stem | −14.0 LUFS (after 2.5:1 soft-knee compression) | — |
| Music stem (ducked) | −20.6 LUFS overall; −9 dB broadband plus a further −5 dB in 1.2–4.5 kHz under speech, 80 ms lookahead, 450 ms release | same settings |
| SFX stem | −17.5 LUFS | — |
| Limiter | max 5.0 dB gain reduction, only on the two cinematic impacts (23.0 s, 58.9 s); voice transients about 1–2 dB | max 4.2 dB |

Sources: `docs/qa/mix-film.json`, `docs/qa/mix-teaser.json`.

## Visual QA

Method: 34 hand-picked stills plus a dense sweep sampling every 0.5 s (128 frames) of a half-res preview, reviewed scene by scene, followed by frames extracted from the final MP4s (`out/screenshots/`).

Problems found and fixed during QA:

1. The opening line wrapped to two lines and collided with the light line. Fixed by reducing it to 84 px with wider measure.
2. The candidate card showed an empty slab for about 2 s. Fixed: the quality row and meter now show from the start as "not yet replayed".
3. The measured-diff header wrapped. Shortened.
4. At about 44.5 s the REJECTED card faded in on top of the VERIFIED card. Fixed by staggering the entrances so the first card clears centre before the second arrives.
5. Decorative drifting "glint" particles added no meaning. Removed, per the brief.
6. The first master was full-range `yuvj420p`, which some players render with shifted blacks. Fixed with PNG frames and explicit BT.709 to give standard `yuv420p` tv-range.
7. There was a 1.6 s near-empty lull at the start of the product scene. Fixed: the graph now assembles straight off the logo hand-off.
8. **Teaser logic error:** the REJECTED stamp landed before the quality evidence had finished failing. Fixed so the evidence always completes before the verdict. This change evaluates identically for the film, so the film master was not re-rendered.

Checked and passing in the final frames:

- **Typography:** Satoshi (headlines) and JetBrains Mono (instrument labels) load from local files. No fallback fonts appear in the renders, and no text is cropped in either aspect ratio.
- **Spelling:** all on-screen text matches `scripts/narration.json` and the scene sources.
- **Logo fidelity:** the mark and wordmark use the locked traced paths with evenodd counters, so Q and O render open. The mark is Soft Blue on ink and the wordmark is Cloud, matching the brand board's dark-mode lockup. The horizontal lockup uses the measured ratios (2.125 : 1 cap height, 0.529 gap).
- **Palette:** Ink, Cloud, Soft Blue and Stone, plus the site's desaturated verified/rejected/warning state colours. No other hues appear.

## Claims audit

- No customer names, logos, savings %, $ amounts, latency figures or benchmark numbers appear on screen or in the narration.
- Every product-like UI is labelled "Illustrative visualization · not customer data".
- VERIFIED is shown as "Ready for human review · not auto-deployed".
- REJECTED and INCOMPLETE are shown as equally legitimate outcomes.

## Known limitations

- **Motion blur:** I used velocity blur on moving type and transitions, plus blur on collapses and recessions, instead of Remotion's multi-sample `<CameraMotionBlur>`. Multi-sample blur multiplies render cost roughly 5–10× on this 4-core CPU machine.
- **Voice:** Kokoro is very good, but it is still synthetic. A professional human VO could later be dropped into `public/audio/vo/` with the same file names. The timeline would then need re-timing from the new durations.
- **Remotion licence:** free for organisations with up to 3 employees. See `docs/AUDIO-LICENSES.md`.
- **References:** I read the Drive folder `nero claude` (it contains only the production launch report) and the launch report itself (2026-11-01). The report is operational: deployment, security, migrations. It confirms the claims model the film follows. The product separates OBSERVED, EVALUATED, PROJECTED and REALIZED; REALIZED is "NOT_YET_MEASURED" in production; and synthetic data must be labelled "not customer data". Nothing in it contradicts the film. The live site `zevqora.vercel.app` returned HTTP 429 (rate-limited) and was not inspected; the canonical `Web_Design` source was used instead.
