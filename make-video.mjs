// Captures the idle tour frame by frame in headless Chrome (15 fps, 14 s) and encodes tour.mp4 (1600x900, 30 fps, h264)
// and tour-square.mp4 (4:5 crop of the card). Usage: node make-video.mjs [quantum-computer.html]
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const page = process.argv[2] ?? "quantum-computer.html";
const FPS = 15;
const PERIOD = 14;
const FRAMES = join(HERE, "frames");
rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });
const preload = join(FRAMES, "preload.js");
writeFileSync(preload, `document.addEventListener("DOMContentLoaded", () => { const st = document.createElement("style"); st.textContent = ".iso-page{margin:8px auto}"; document.head.appendChild(st); });`);
const actions = [["wait", 800]];
for (let i = 0; i < FPS * PERIOD; i++) {
  const t = i / FPS;
  actions.push(["eval", `window.__qcSeek(${t.toFixed(4)})`], ["wait", 30], ["shot", join(FRAMES, `frame_${String(i + 1).padStart(4, "0")}.png`), "body", 1.2, [0, 0, 1333, 750]]);
}
const steps = join(FRAMES, "steps.json");
writeFileSync(steps, JSON.stringify(actions));
execFileSync(process.execPath, [join(HERE, "scripts", "drive.mjs"), join(HERE, page), "--actions", steps, "--width", "1333", "--height", "750", "--preload", preload], { stdio: ["ignore", "ignore", "inherit"] });
const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
ff(["-framerate", String(FPS), "-i", join(FRAMES, "frame_%04d.png"), "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "23", join(HERE, "tour.mp4")]);
// the card is 640 css px wide, scaled 1.2 to 768 px and centred in 1600: crop a 1:1 window around it
ff(["-framerate", String(FPS), "-i", join(FRAMES, "frame_%04d.png"), "-vf", "crop=900:900:350:0,fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "23", join(HERE, "tour-square.mp4")]);
console.log("wrote tour.mp4 and tour-square.mp4");
