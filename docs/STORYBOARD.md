# THAT'S WHY WE BUILT ZEVQORA — Storyboard & Timeline

Emotional arc: **POWER → COST → RISK → PROOF → ZEVQORA → RESOLUTION**

Master: 1920×1080, 30 fps, 64.0 s (1920 frames). All times below come from
`src/config/timeline.json`, the single source of truth that drives picture, score,
SFX and mix. Word-level sync comes from `src/config/words.json` (measured from the
actual narration audio).

| # | Scene | Time | Narration (VO line @ start) | Picture | Sound |
|---|---|---|---|---|---|
| 1 | Opening — POWER | 0.0–6.0 | v01 @1.2 "Every AI product starts with a breakthrough." · v02 @4.2 "Then usage grows." | Black → a single line of Soft Blue light opens on the impact. Kinetic type rises word-by-word; "breakthrough." gets a light sweep. On "grows" the line collapses to a point, which becomes the root `request` node. | Sub impact @0.3, air whoosh, Dm9 atmosphere, first node blips @4.78 |
| 2 | Cost explosion — COST | 6.0–12.0 | v03 @6.3 "So do the tokens, the models, the retries, and the costs." | One continuous camera pulls back and tilts as the execution graph grows in waves keyed to each spoken word (tokens 6.72 · models 7.68 · retries 8.28 · costs 9.12). Retry loops appear; token particles multiply; paths turn to warm "cost heat". A spend meter climbs (no numbers). | Minimal electronic pulse opens up, accelerating token ticks, node blips on each word, transition whoosh @11.7 |
| 3 | Quality risk — RISK | 12.0–23.0 | v04 @12.2 "The obvious fix?" · v05 @13.7 "Switch to something cheaper." · v06 @16.0 "But cheaper can fail quietly." · v07 @18.4 "A lower bill means nothing if the result breaks." | Graph dims and blurs behind. A candidate-change card: cost lower ✓, latency lower ✓, quality on replayed cases pending. 40 replayed cases run; 7 flip to failing with "no errors raised"; the quality meter stops below the required floor. On "breaks" → **REJECTED** stamp. Everything collapses into a point of light. | Phrygian tension cluster, ticking clock, heartbeat kick, low quiet-fail tones, restrained rejection tone @20.56, riser, **hard silence** @22.86 |
| 4 | Reveal — PROOF/ZEVQORA | 23.0–27.5 | v08 @23.4 "That's why we built ZEVQORA." | Flash ring; the Z mark's own outline is traced in Soft Blue, then fills. "THAT'S WHY WE BUILT" lands word-by-word; the wordmark wipes in on the spoken brand name (24.18) and a glint crosses it. The lockup then glides into the top-left brand bug. | Reveal impact (reverse swell + boom + glass transient), Bbmaj9 → Fadd9 bloom, shimmer, glint @24.18 |
| 5 | The product | 27.5–40.8 | v09 @27.7 "We map how AI work actually runs." · v10 @30.5 "We identify expensive paths, test alternatives, and measure what changes." · v11 @36.0 "We replay representative workloads against defined requirements." | Step rail **Observe → Diagnose → Plan → Replay → Verify** advances on the narration. A clean agent pipeline assembles with a trace waterfall (Observe); the two large-model steps light up as **EXPENSIVE PATH** (Diagnose); a dashed **ALTERNATIVE PLAN** branch appears (Plan); a measured diff shows cost/latency bars and "replay required" for quality (Measure); a 16-case workload replay runs against four defined requirements (Replay). | Confident i–VI–III–VII groove at 96 BPM, arpeggios, node blips, replay ticks, whoosh into Verify @40.2 |
| 6 | Honest verification | 40.8–54.0 | v12 @41.0 "If the evidence passes, the change can be reviewed." · v13 @44.5 "If quality drops, it's rejected." · v14 @47.1 "If the proof isn't there, we say: incomplete." · v15 @50.3 "No blind switches." · v16 @52.0 "No manufactured savings." | Three decision cards, each distinct: **VERIFIED** — "Ready for human review · not auto-deployed"; **REJECTED** — "Change discarded · baseline kept"; **INCOMPLETE** — "No verdict without evidence". They settle side by side, then recede behind the two "No …" lines. | Verified chime @41.62, rejection tone @45.78, incomplete tone @48.48; drums drop out for the "No" lines; riser |
| 7 | Brand finale — RESOLUTION | 54.0–64.0 | v17–v20 @54.4/55.3/56.2/57.15 "Measure. Replay. Verify. Then optimize." · v21 @59.3 "ZEVQORA." · v22 @60.7 "Make AI lighter." | One word per beat with a four-segment rail; the words condense into a point; the lockup is revealed; "Make AI **lighter.**" with *lighter.* in Soft Blue (as on the brand board). Fade from 63.0. | A chord stab per word, a breath of silence, final logo hit @58.9, F6/9 resolution under the tagline |

## 9:16 social cutdown (19.0 s, 1080×1920)

| Time | VO | Picture |
|---|---|---|
| 0.0–6.0 | v05 "Switch to something cheaper." · v06 "But cheaper can fail quietly." | Candidate card at phone scale; replayed cases fail quietly; REJECTED; collapse |
| 6.0–10.0 | v08 "That's why we built ZEVQORA." | Mark trace + stacked lockup reveal |
| 10.0–14.0 | v17–v20 "Measure. Replay. Verify. Then optimize." | One word per line, per beat |
| 14.3–19.0 | v22 "Make AI lighter." | Stacked lockup + tagline, fade |

## Honesty rules applied on screen

- Every product-like UI carries the label **"Illustrative visualization · not customer data"**.
- No customer names, logos, savings percentages, dollar amounts or benchmark numbers appear anywhere. Bars are relative and unlabeled by value.
- VERIFIED is shown as *ready for human review, not auto-deployed*; no realised savings are implied.
- The internal benchmark figures in `Web_Design/website/data/evidence.ts` were deliberately **not** used: they require qualifiers (CI crosses zero, internal dogfooding, pre-hardening) that cannot be carried legibly in a 64-second film.
