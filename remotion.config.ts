import { Config } from "@remotion/cli/config";

// Local, offline rendering only. The pre-installed headless shell avoids any
// browser download; override with REMOTION_BROWSER if your machine differs.
const browser = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
import fs from "fs";
if (fs.existsSync(browser)) Config.setBrowserExecutable(browser);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setChromiumOpenGlRenderer("swangle");
Config.setConcurrency(4);
