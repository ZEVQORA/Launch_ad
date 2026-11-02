# Audio & asset licence manifest

Retrieval / verification date for every item: **2026-11-02**.
Total spend: **$0**. No paid API, subscription, trial, cloud render or paid asset was used.

## Narration (voice)

| Item | Source | Licence | Notes |
|---|---|---|---|
| Kokoro-82M TTS model weights (`kokoro-v1.0.onnx`, sha256 `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5`) | https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0 (ONNX export of https://huggingface.co/hexgrad/Kokoro-82M) | **Apache-2.0** (verified on the Hugging Face model card `license: apache-2.0`) | Model card states the weights are Apache-licensed and may be deployed in production / commercial use. |
| Voice pack (`voices-v1.0.bin`, sha256 `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`) — voice **`af_heart`** | same release | Apache-2.0 (part of Kokoro-82M) | `af_heart` is a stock Kokoro voice (official grade **A**, VOICES.md). It is not a clone of any real person. |
| kokoro-onnx 0.6.1 (inference wrapper) | https://pypi.org/project/kokoro-onnx/ · https://github.com/thewh1teagle/kokoro-onnx | **MIT** (LICENSE file verified) | Runs locally on CPU via onnxruntime 1.31.1 (MIT). |
| faster-whisper 1.1.1 + `small.en` model (QA only, not in the film) | https://pypi.org/project/faster-whisper/ · Systran/faster-whisper-small.en | MIT | Used only to check intelligibility and extract word timings. |

Voice selection evidence (local ASR, `scripts/asr-check.py compare`): af_heart, af_bella, am_michael, am_fenrir, bm_george, bf_emma were all generated with the same text. All transcribed the script correctly. **af_heart** was chosen: top official grade (A), highest recogniser confidence (avg log-prob −0.167, the best of the six), and a warm, measured delivery suited to a calm premium brand. The male candidates are graded C to C+ upstream.

Pronunciation: "ZEVQORA" is pinned to the phonemes `zˈɛvkɔːɹə` ("ZEV-kor-uh"). `scripts/generate-voice.py` aborts if any line containing the brand name phonemizes differently. Final ASR check: **22/22 lines transcribe exactly** (`docs/qa/asr-final.json`).

## Music

| Item | Source | Licence |
|---|---|---|
| Original score, "Lighter" (film 64 s and teaser 19 s versions) | Composed and synthesised for this film by `scripts/compose-music.py` + `scripts/dsp.py` (numpy/scipy, no samples) | **Original work, owned by ZEVQORA.** No third-party material. |

**Why Mixkit was not used.** Mixkit's free-music catalogue (https://mixkit.co/free-stock-music/) and licence page (https://mixkit.co/license/) were checked. The page advertises a "Music Free License", but the licence text itself loads in a dynamic modal that couldn't be retrieved and archived verbatim from the static page. Shipping a commercial launch advert under terms I could not read and record in full would be unsafe. An original score also removes any Content ID claim risk on YouTube and social platforms. The brief allows this fallback ("create an original instrumental bed programmatically"). Suno was not used.

Musical content: D-minor / F-major harmony (Dm9 – Bbmaj7 – Fadd9 – Cadd9; Phrygian ♭2 tension; F6/9 resolution) at 96 BPM. These are generic chord voicings with no melody taken from any existing work.

## Sound effects

All SFX are synthesised by `scripts/sound-design.py` (sine/FM blips, filtered-noise whooshes and risers, pitch-swept sub booms, additive bell chimes, a synthetic convolution reverb). **No third-party samples, no CC0 downloads, no attribution required.**

## Visual assets

| Item | Source | Licence / rights |
|---|---|---|
| ZEVQORA Z mark + wordmark vector paths (`src/brand/marks.ts`, sha256 `df0d5091…`) | Copied verbatim from `ZEVQORA/Web_Design` @ `907e90ae` (`website/components/brand/marks.ts`, machine-traced from the canonical brand board) | ZEVQORA-owned brand assets. Geometry not altered. |
| Brand reference boards (`public/brand/*.png`) | `ZEVQORA/Web_Design/references/` | ZEVQORA-owned. Reference only; not shown in the film. |
| Satoshi Variable (`public/fonts/Satoshi-Variable.woff2`) | Vendored in `ZEVQORA/Web_Design` from Fontshare (Indian Type Foundry) | **ITF Free Font License** (permits commercial use), as documented in `Web_Design/website/public/fonts/README.md` |
| JetBrains Mono 400/500/600 (`public/fonts/jetbrains-mono-*.woff2`) | npm `@fontsource/jetbrains-mono@5.1.1` | **SIL OFL-1.1** |
| Film grain texture (`public/textures/grain.png`) | Generated locally (seeded numpy noise) | Original |

The Zev mascot is intentionally **not** used in this film. The brand rules call Zev "scarce on purpose" and essentially absent from serious product moments.

## Software

Remotion 4.0.539 (local rendering; free for individuals and companies of up to 3 people under the Remotion License — see note below). Also React 18.3.1, Node 22, Python 3.13, FFmpeg 6.1, and Chromium headless shell (pre-installed).

> **Remotion licence note:** Remotion is free for individuals, non-profits and for-profit
> organisations with up to 3 employees. A company larger than that needs a Remotion
> Company License for continued use. Check ZEVQORA's headcount against
> https://www.remotion.dev/license before further production work. Rendering this film
> cost $0.
