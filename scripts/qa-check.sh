#!/usr/bin/env bash
# Media QA for the rendered deliverables: stream specs, duration, loudness,
# true peak, black frames, frozen frames and long silences.
#   bash scripts/qa-check.sh out/ZEVQORA-launch-film-1080p.mp4
set -euo pipefail
f="$1"
echo "== $f"
ffprobe -v error -show_entries format=duration,size,bit_rate:stream=index,codec_type,codec_name,profile,width,height,r_frame_rate,pix_fmt,sample_rate,channels,channel_layout,nb_frames -of default=nw=1 "$f"
echo "-- loudness (EBU R128)"
ffmpeg -hide_banner -nostats -i "$f" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E "I:|LRA:|Peak:" || true
echo "-- black frames (>=0.25 s, pixel threshold 0.10)"
ffmpeg -hide_banner -nostats -i "$f" -vf "blackdetect=d=0.25:pix_th=0.10" -an -f null - 2>&1 | grep -o "black_start.*" || echo "none"
echo "-- frozen video (>=2.5 s)"
ffmpeg -hide_banner -nostats -i "$f" -vf "freezedetect=n=0.0005:d=2.5" -an -f null - 2>&1 | grep -oE "freeze_(start|duration|end).*" || echo "none"
echo "-- audio silences (< -50 dB, >= 0.6 s)"
ffmpeg -hide_banner -nostats -i "$f" -af "silencedetect=n=-50dB:d=0.6" -vn -f null - 2>&1 | grep -oE "silence_(start|end).*" || echo "none"
