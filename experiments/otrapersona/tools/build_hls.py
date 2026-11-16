#!/usr/bin/env python3
"""Build AES-128 HLS audio from the existing continuous MP3.
The published key is intentionally public: this is not DRM.
"""
import argparse
import json
import pathlib
import secrets
import shutil
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description="Build encrypted HLS from private audio outside the repository.")
parser.add_argument("source", type=pathlib.Path)
SOURCE = parser.parse_args().source.resolve(strict=True)
if SOURCE.is_relative_to(ROOT.parents[1]):
    parser.error("Keep the original audio outside the Lab repository.")
DEST = ROOT / "assets" / "stream"

def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)

with tempfile.TemporaryDirectory() as tmp:
    p = pathlib.Path(tmp)
    playlist = p / "album.m3u8"
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(SOURCE),
        "-map", "0:a:0", "-vn", "-c:a", "aac", "-b:a", "256k", "-ar", "44100",
        "-ac", "2", "-f", "hls", "-hls_time", "8", "-hls_playlist_type", "vod",
        "-hls_segment_filename", str(p / "segment_%03d.ts"), str(playlist))
    lines = playlist.read_text().splitlines()
    assert "#EXT-X-MEDIA-SEQUENCE:0" in lines and "#EXT-X-ENDLIST" in lines
    key = secrets.token_bytes(16)
    (p / "audio.key").write_bytes(key)
    segments = [line for line in lines if line.endswith(".ts")]
    assert segments and all(pathlib.Path(s).name == s for s in segments)
    for seq, name in enumerate(segments):
        f = p / name
        data = subprocess.check_output(
            ["openssl", "enc", "-aes-128-cbc", "-K", key.hex(),
             "-iv", seq.to_bytes(16, "big").hex()], input=f.read_bytes())
        f.write_bytes(data)
    lines.insert(lines.index("#EXT-X-PLAYLIST-TYPE:VOD") + 1,
                 '#EXT-X-KEY:METHOD=AES-128,URI="audio.key"')
    playlist.write_text("\n".join(lines) + "\n")
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-xerror",
        "-allowed_extensions", "ALL", "-i", str(playlist), "-f", "null", "-")
    probe = json.loads(subprocess.check_output(
        ["ffprobe", "-v", "error", "-allowed_extensions", "ALL",
         "-show_entries", "format=duration:stream=codec_name,sample_rate,channels",
         "-of", "json", str(playlist)]))
    source_duration = float(json.loads(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", str(SOURCE)]))["format"]["duration"])
    duration = float(probe["format"]["duration"])
    assert abs(duration - source_duration) < 0.5, "Duration mismatch"
    assert any(s["codec_name"] == "aac" and s["channels"] == 2 for s in probe["streams"])
    if DEST.exists():
        shutil.rmtree(DEST)
    shutil.copytree(p, DEST)
    print(f"Verified {len(segments)} AES-128 segments; {duration:.3f} seconds.")
