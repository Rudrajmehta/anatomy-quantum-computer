// Director's cut: renders the idle tour with a camera that follows the pulse, and burns in a large caption.
// node director.mjs                      -> tour-vertical.mp4 (1080x1350) and tour-wide.mp4 (1600x900)
// node director.mjs --only vertical      -> one cut
// node director.mjs --page quantum-computer-light.html --suffix -light
// Every frame seeks the page (window.__qcSeek), reads the caption and the pulse position (window.__qcPose),
// moves the camera with a critically damped spring, and asks Chrome for that crop at output size, so the drawing stays vector-sharp.
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromePort } from "./scripts/chrome-port.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const PAGE = arg("--page", "quantum-computer.html");
const SUFFIX = arg("--suffix", "");
const ONLY = arg("--only", null);
const FPS = 30;

// video time (s) -> loop time t (s) of the page, piecewise linear: a slow intro, the drive a little slower than live,
// a hold on the package for the gate, the readout, the decay, and the stage temperatures
const SEGMENTS = [
  [0, 0.9, 0, 0.6],
  [0.9, 6.5, 0.6, 4.6],
  [6.5, 8.0, 4.6, 5.6],
  [8.0, 12.0, 5.6, 9.6],
  [12.0, 15.4, 9.6, 13.5],
  [15.4, 16.0, 13.5, 14.0],
];
const DURATION = 16;
const loopTime = (v) => {
  for (const [v0, v1, t0, t1] of SEGMENTS) if (v < v1) return t0 + ((v - v0) / (v1 - v0)) * (t1 - t0);
  return 13.99;
};
// what the camera wants at video time v: zoom and whether to look at the pulse, the package or the whole fridge
function shotAt(v) {
  if (v < 1.5) return { zoom: 1, look: "full" };
  if (v < 6.5) return { zoom: 2.35, look: "focus" };
  if (v < 8.0) return { zoom: 2.5, look: "focus" };
  if (v < 11.8) return { zoom: 2.3, look: "focus" };
  return { zoom: 1, look: "full" };
}

const CUTS = {
  vertical: { name: "tour-vertical", w: 1080, h: 1350, top: 110, bottom: 250, title: 30, big: 48, small: 40 },
  wide: { name: "tour-wide", w: 1600, h: 900, top: 84, bottom: 190, title: 26, big: 46, small: 38 },
};

// critically damped spring, time constant tau
function spring(state, target, dt, tau) {
  const w = 1 / tau;
  for (let i = 0; i < 4; i++) {
    const h = dt / 4;
    state.v += (w * w * (target - state.x) - 2 * w * state.v) * h;
    state.x += state.v * h;
  }
}

const chromeBinary = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profile = mkdtempSync(join(tmpdir(), "qc-director-"));
const chrome = spawn(chromeBinary, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--allow-file-access-from-files", "about:blank"]);
const port = await chromePort(chrome, profile);
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const problems = [];
socket.onmessage = (message) => {
  const data = JSON.parse(message.data);
  if (data.id && pending.has(data.id)) {
    pending.get(data.id)(data);
    pending.delete(data.id);
  } else if (data.method === "Runtime.exceptionThrown") problems.push(data.params.exceptionDetails.exception?.description ?? data.params.exceptionDetails.text);
  else if (data.method === "Runtime.consoleAPICalled" && data.params.type === "error") problems.push(data.params.args.map((a) => a.value ?? a.description).join(" "));
};
await new Promise((done) => (socket.onopen = done));
const send = (method, params = {}) => new Promise((done) => { const call = ++id; pending.set(call, done); socket.send(JSON.stringify({ id: call, method, params })); });
const evaluate = async (expression) => {
  const reply = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  const exception = reply.result?.exceptionDetails;
  if (exception) throw new Error(exception.exception?.description ?? exception.text);
  return reply.result?.result?.value;
};
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 1100, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: pathToFileURL(resolve(HERE, PAGE)).href });
await sleep(1500);

// strip the card furniture (corners, border, legend) so only the drawing is filmed, on the card's own colour
const layout = await evaluate(`(() => {
  const style = document.createElement("style");
  style.textContent = "body{background:var(--anatomy-card)!important}.iso-plate-corners,.iso-legend{display:none!important}.iso-plate{border:0!important;box-shadow:none!important;background:var(--anatomy-card)!important}.iso-page{margin:200px auto!important}";
  document.head.appendChild(style);
  const svg = document.querySelector(".iso-stage svg");
  const box = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const content = svg.getBBox();
  const overlay = document.createElement("div");
  overlay.id = "qc-overlay";
  overlay.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;z-index:10;transform-origin:0 0;font-family:var(--anatomy-mono);";
  overlay.innerHTML = '<div data-top style="position:absolute;left:0;right:0;top:0;display:flex;align-items:center;padding:0 6%;background:linear-gradient(var(--anatomy-card) 55%,transparent);color:var(--anatomy-text);letter-spacing:.04em"></div>' +
    '<div data-bottom style="position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:flex-end;padding:0 6%;background:linear-gradient(transparent,var(--anatomy-card) 38%)"><div data-big style="color:var(--anatomy-strong);white-space:nowrap"></div><div data-small style="color:var(--anatomy-text);white-space:nowrap"></div></div>';
  document.body.appendChild(overlay);
  return { left: box.left + scrollX, top: box.top + scrollY, k: box.width / vb.width, content: { x: content.x, y: content.y, w: content.width, h: content.height } };
})()`);

async function render(cut) {
  const C = CUTS[cut];
  const dir = join(HERE, "frames-" + cut);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  // the full view: the whole drawing fits the area between the caption bands
  const areaH = C.h - C.top - C.bottom;
  const fit = Math.min(C.w / (layout.content.w * 1.1), areaH / (layout.content.h * 1.04)); // output px per svg unit at zoom 1
  const full = [layout.content.x + layout.content.w / 2, layout.content.y + layout.content.h / 2];
  const bandShift = (C.bottom - C.top) / 2; // output px: the look point sits in the middle of the area between the bands
  await evaluate(`(() => {
    const o = document.getElementById("qc-overlay");
    o.style.width = "${C.w}px"; o.style.height = "${C.h}px";
    const top = o.querySelector("[data-top]"); top.style.height = "${C.top}px"; top.style.fontSize = "${C.title}px"; top.textContent = "Fig 1 · A quantum computer";
    const bottom = o.querySelector("[data-bottom]"); bottom.style.height = "${C.bottom}px"; bottom.style.paddingBottom = "${Math.round(C.bottom * 0.2)}px";
    const big = o.querySelector("[data-big]"); big.style.fontSize = "${C.big}px"; big.style.lineHeight = "1.25";
    const small = o.querySelector("[data-small]"); small.style.fontSize = "${C.small}px"; small.style.lineHeight = "1.35"; small.style.marginTop = "${Math.round(C.small * 0.25)}px";
  })()`);
  const cam = { x: { x: full[0], v: 0 }, y: { x: full[1], v: 0 }, z: { x: 1, v: 0 } };
  const frames = Math.round(DURATION * FPS);
  const startCap = (await evaluate(`window.__qcPose(0)`)).cap;
  for (let i = -1; i < frames; i++) {
    const v = Math.max(0, i) / FPS; // frame -1 is a warm-up capture at the opening shot, thrown away
    const t = loopTime(v);
    const pose = await evaluate(`(window.__qcSeek(${t.toFixed(5)}), window.__qcPose(${t.toFixed(5)}))`);
    const shot = shotAt(v);
    const look = shot.look === "full" ? full : pose.focus;
    if (i > 0 && i !== -1) {
      spring(cam.x, look[0], 1 / FPS, 0.32);
      spring(cam.y, look[1], 1 / FPS, 0.32);
      spring(cam.z, shot.zoom, 1 / FPS, 0.42);
    }
    // once the camera is home on the full view, snap it there exactly, so the last frame matches the first
    const home = shot.look === "full" && Math.abs(cam.z.x - 1) < 1e-3 && Math.abs(cam.x.x - full[0]) < 1e-3 && Math.abs(cam.y.x - full[1]) < 1e-3;
    if (home) for (const [c, to] of [[cam.x, full[0]], [cam.y, full[1]], [cam.z, 1]]) { c.x = to; c.v = 0; }
    const scale = fit * cam.z.x; // output px per svg unit
    const ww = C.w / scale;
    const wh = C.h / scale;
    const cx = cam.x.x;
    const cy = cam.y.x + bandShift / scale;
    const k = layout.k;
    const clip = { x: layout.left + (cx - ww / 2) * k, y: layout.top + (cy - wh / 2) * k, width: ww * k, height: wh * k, scale: C.w / (ww * k) };
    // caption: the page's caption, except over the last half second, where it fades through to the opening caption so the loop is clean
    let cap = pose.cap;
    let alpha = 1;
    const tail = DURATION - v;
    if (tail < 0.6) {
      alpha = Math.min(1, Math.abs(tail - 0.35) / 0.25);
      if (tail < 0.35) cap = startCap;
    }
    await evaluate(`(() => {
      const o = document.getElementById("qc-overlay");
      o.style.left = "${clip.x}px"; o.style.top = "${clip.y}px"; o.style.transform = "scale(${1 / clip.scale})";
      o.querySelector("[data-big]").textContent = ${JSON.stringify(cap[0])};
      o.querySelector("[data-small]").textContent = ${JSON.stringify(cap[1])};
      o.querySelector("[data-big]").style.opacity = o.querySelector("[data-small]").style.opacity = "${alpha.toFixed(3)}";
    })()`);
    const reply = await send("Page.captureScreenshot", { format: "png", clip, captureBeyondViewport: true });
    if (i >= 0) writeFileSync(join(dir, `f_${String(i).padStart(4, "0")}.png`), Buffer.from(reply.result.data, "base64"));
  }
  const out = join(HERE, `${C.name}${SUFFIX}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f_%04d.png"), "-vf", `scale=${C.w}:${C.h}:flags=lanczos,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", out], { stdio: "inherit" });
  rmSync(dir, { recursive: true, force: true });
  console.log("wrote", out);
}

try {
  for (const cut of Object.keys(CUTS)) if (!ONLY || ONLY === cut) await render(cut);
} finally {
  chrome.kill("SIGKILL");
  rmSync(profile, { recursive: true, force: true });
}
if (problems.length) console.log("console:", problems.join("\n"));
else console.log("console: clean");
