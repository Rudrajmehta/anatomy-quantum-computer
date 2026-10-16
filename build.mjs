// A quantum computer: a dilution refrigerator chandelier with a transmon package at the bottom.
// node build.mjs            -> quantum-computer.html (dark)
// node build.mjs --light    -> quantum-computer-light.html
// node build.mjs --audit    -> also runs kit/audit.mjs on the recorded geometry and exits non-zero on any problem
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import { tubePieces, tubeSvg } from "./kit/tube.mjs";
import * as A from "./kit/audit.mjs";
import { kitScript } from "./scripts/inline-kit.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const DEG = Math.PI / 180;
const polar2 = (deg, r) => [r * Math.cos(deg * DEG), r * Math.sin(deg * DEG)];

// ---------------------------------------------------------------- world (units of about 1 px, z up)
const W = 600;
const H = 620;
const AZIMUTH = 42;
const ELEVATION = 27;

// plates, bottom face z, thickness, radius. The top plate is the room-temperature vacuum flange.
const PLATES = [
  { id: "mxc", z: 52, t: 3.6, r: 47, tone: "hi", name: "mixing chamber plate" },
  { id: "cp", z: 90, t: 3.2, r: 52, tone: "mid", name: "cold plate" },
  { id: "still", z: 126, t: 3.6, r: 58, tone: "mid", name: "still plate" },
  { id: "4k", z: 170, t: 4, r: 66, tone: "mid", name: "4 K plate" },
  { id: "50k", z: 220, t: 4, r: 72, tone: "mid", name: "50 K plate" },
  { id: "top", z: 268, t: 7, r: 80, tone: "mid", name: "300 K top plate" },
];
const plate = (id) => PLATES.find((p) => p.id === id);
const topOf = (id) => plate(id).z + plate(id).t;
const TOP = topOf("top");
const FLOOR = { x: -92, y: -92, w: 184, d: 184, r: 9 };
const FLOOR_H = 10;
const FOOT_H = 6;
const COLUMN = 14;
const COLUMN_AT = [
  [-72, 72],
  [72, -72],
];
const BEAM_Z = 290;
const BEAM_H = 12;
const BEAM_HALF = 11;
const STRUT_DEGS = [80, 200, 320];
const STRUT_R = 1.6;

// the sample package under the mixing chamber plate
const PKG = { x: -5, y: 0, w: 26, d: 18, r: 1.2 };
const PKG_Z = 10;
const PKG_H = 9;
const PKG_MID = PKG_Z + PKG_H / 2;
const FINGER = [2, 5];
const DIAL = [13, 11];
const DIAL_R = 3.6;

// coax: drive line down the front right, readout line up the front left
const COAX_R = 1.2;
const DRIVE_XY = [36, 12];
const READ_LOW = [12, 32];
const READ_HIGH = [18, 30];
const DRIVE_BOX = { x: 14, y: 8, w: 10, d: 8, r: 1 };
const AMP_BOX = { x: -4, y: 26, w: 10, d: 8, r: 1 };
const RT_BOX_H = 16;
const RT_PORT_Z = TOP + 11;
const PT_AT = polar2(110, 50);
const STILL_LINE_AT = polar2(340, 44);
const DIL_AT = polar2(125, 30);

const P = k.fitProjection(
  [...k.boxCorners(FLOOR, -FLOOR_H - FOOT_H, 0), ...COLUMN_AT.flatMap(([x, y]) => k.boxCorners({ x: x - COLUMN / 2, y: y - COLUMN / 2, w: COLUMN, d: COLUMN }, 0, BEAM_Z + BEAM_H)), [0, 0, BEAM_Z + BEAM_H], [-80, 0, TOP], [80, 0, TOP], [0, 80, TOP], [0, -80, TOP]],
  W,
  H,
  { pad: 22, azimuth: AZIMUTH, elevation: ELEVATION },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const vert = (x, y) => G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const polar = (deg, r, z = 0) => [r * Math.cos(deg * DEG), r * Math.sin(deg * DEG), z];

// ---------------------------------------------------------------- recorder: every item records its true shape
const R = A.recorder(P);
const record = R.solid;
const nameFor = R.nameFor;
let solids = 0;
function put(name, ref, svg, { bias = 0, shapes = [] } = {}) {
  solids += (svg.match(/class="iso-solid/g) || []).length;
  R.put({ name, at: ref, bias, svg, shapes });
}

// a vertical turned part (plates, posts, pots, pucks, barrels standing up)
function vdisc(name, x, y, z0, z1, r, style = {}, { bevel = 0, inner = "", extra = "", bias = 0, owner, ground, steps } = {}) {
  const F = vert(x, y);
  const id = nameFor(name);
  if (name.startsWith("stand.")) owner = owner ?? "stand.frame";
  const paths = G.disc(z0, z1, r, F, P, { bevel, ...(steps ? { steps } : {}) });
  put(id, [x, y, (z0 + z1) / 2], S(paths, { tone: "mid", ...style, inner }) + extra, { bias, shapes: [record(A.disc(F, z0, z1, r, { name: id, owner, ground }))] });
  return F;
}
// a vertical annulus (can flanges, clamps around a rod)
function vring(name, x, y, z0, z1, rIn, rOut, style = {}, { extra = "", bias = 0, owner } = {}) {
  const F = vert(x, y);
  const id = nameFor(name);
  put(id, [x, y, (z0 + z1) / 2], S(G.ringBand(z0, z1, rIn, rOut, F, P), { tone: "mid", ...style }) + extra, { bias, shapes: [record(A.ring(F, z0, z1, rIn, rOut, { name: id, owner }))] });
}
function boxAt(name, plan, z, h, style = {}, { extra = "", inner = "", bias = 0, bevel = 0.4, steps = 3, owner, ground } = {}) {
  const id = nameFor(name);
  if (name.startsWith("stand.")) owner = owner ?? "stand.frame";
  put(id, [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], S(k.slabOf(plan, z, h, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, {
    bias,
    shapes: [record(A.box([plan.x, plan.y, z], [plan.x + plan.w, plan.y + plan.d, z + h], { name: id, owner, ground }))],
  });
}
// a turned part along any axis (SMA barrels on a face)
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, owner, bevel = 0 } = {}) {
  const id = nameFor(name);
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const paths = G.solidOf(profile, F, P, { bevel });
  put(id, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, { bias, shapes: [record(A.solid(F, profile, { name: id, owner }))] });
}
// a top-face screw pattern: dots with faint rings
const screws = (points, z, { ring = 1.4, size = 0.45, tone = "mid" } = {}) => Ln(points.map(([x, y]) => k.ring(x, y, ring, z, P, 14)).join(""), { tone: "lo" }) + Dots(points.map(([x, y]) => at([x, y, z])), { size, tone });

// ---------------------------------------------------------------- stand: floor plate, feet, two columns, beam, yoke
const halo = `<path class="iso-halo" d="${k.haloOf(FLOOR, -FLOOR_H - FOOT_H, FLOOR_H, P)}"/>`;
for (const [x, y] of k.corners(FLOOR, 18)) {
  vdisc("stand.foot-flange", x, y, -FLOOR_H - FOOT_H, -FLOOR_H - FOOT_H + 1.6, 6.5, { tone: "lo" }, { ground: true });
  vdisc("stand.foot", x, y, -FLOOR_H - FOOT_H + 1.6, -FLOOR_H, 5, { tone: "mid" }, { ground: true });
}
boxAt("stand.floor", FLOOR, -FLOOR_H, FLOOR_H, { tone: "lo" }, {
  bevel: 1.4,
  steps: 8,
  ground: true,
  extra: Ln(k.planOutline(k.insetPlan(FLOOR, 6), 0, P), { tone: "lo" }) + screws(k.corners(FLOOR, 9), 0, { ring: 2.2, size: 0.55 }) + Dots(k.dotGrid(FLOOR.x + 20, FLOOR.y + 20, 12, 12, 13.1, 0, P), { size: 0.3, tone: "lo" }),
});
// ruler strip along the front right edge of the floor and a label plate at the front left
const STRIP = { x: FLOOR.x + 34, y: FLOOR.y + FLOOR.d - 13, w: 118, d: 6.5, r: 1 };
boxAt("stand.strip", STRIP, 0, 0.8, { tone: "lo", crease: "none" }, {
  bevel: 0,
  extra: (() => {
    const t = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y + 1, 0.8, [2.2, 4.2], P);
    return Ln(t.minor, { tone: "lo" }) + Ln(t.major, { tone: "mid" }) + Dots([at([STRIP.x + 2, STRIP.y + 3.5, 0.8]), at([STRIP.x + STRIP.w - 2, STRIP.y + 3.5, 0.8])], { size: 0.45 });
  })(),
});
const LABEL = { x: FLOOR.x + FLOOR.w - 18, y: FLOOR.y + 38, w: 11, d: 46, r: 1.4 };
boxAt("stand.label", LABEL, 0, 0.9, { tone: "mid", crease: "none" }, {
  bevel: 0,
  extra:
    Ln(k.planOutline(k.insetPlan(LABEL, 1.8), 0.9, P, 3), { tone: "faint" }) +
    Ln([0, 1, 2].map((row) => k.onTop([[LABEL.x + 3.4 + row * 2.4, LABEL.y + 5], [LABEL.x + 3.4 + row * 2.4, LABEL.y + (row === 1 ? 18 : row ? 13 : 24)]], 0.9, P)).join(""), { tone: "lo", free: true }) +
    Dots([at([LABEL.x + LABEL.w / 2, LABEL.y + 2.4, 0.9]), at([LABEL.x + LABEL.w / 2, LABEL.y + LABEL.d - 2.4, 0.9])], { size: 0.45 }),
});
for (const [cx, cy] of COLUMN_AT) {
  const base = { x: cx - 13, y: cy - 13, w: 26, d: 26, r: 2.5 };
  boxAt("stand.column-base", base, 0, 4, { tone: "mid" }, { bevel: 0.7, extra: screws(k.corners(base, 4), 4, { ring: 1.5, size: 0.5 }) });
  const column = { x: cx - COLUMN / 2, y: cy - COLUMN / 2, w: COLUMN, d: COLUMN, r: 1.2 };
  const SPLICES = [96, 194];
  [[4, SPLICES[0]], [SPLICES[0] + 8, SPLICES[1]], [SPLICES[1] + 8, BEAM_Z]].forEach(([z0, z1], index) => boxAt("stand.column", column, z0, z1 - z0, { tone: "mid" }, { bevel: 0.7, inner: index === 1 ? Ln(k.sideSeam(column, z0 + 40, P, 3), { tone: "faint" }) : "" }));
  for (const z of SPLICES) {
    const splice = k.insetPlan(column, -1.8);
    boxAt("stand.splice", splice, z, 8, { tone: "mid" }, { bevel: 0.4, extra: Dots([at([splice.x + splice.w, cy - 4, z + 4]), at([splice.x + splice.w, cy + 4, z + 4]), at([cx - 4, splice.y + splice.d, z + 4]), at([cx + 4, splice.y + splice.d, z + 4])], { size: 0.42 }) });
  }
}
// the beam from column to column, over the centre
const ALONG = G.unit3([1, -1, 0]);
const ACROSS = G.unit3([1, 1, 0]);
const BEAM_END = 72 * Math.SQRT2 + COLUMN / 2;
const beamRing = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => G.add3(G.mul3(ALONG, a * BEAM_END), G.mul3(ACROSS, c * BEAM_HALF)).slice(0, 2));
const beamTop = BEAM_Z + BEAM_H;
const beamLine = (offset, z) => k.onTop([G.add3(G.mul3(ALONG, -BEAM_END), G.mul3(ACROSS, offset)), G.add3(G.mul3(ALONG, BEAM_END), G.mul3(ACROSS, offset))].map((p) => p.slice(0, 2)), z, P);
const beamBolts = [];
for (let t = -96; t <= 96; t += 24) for (const side of [-1, 1]) beamBolts.push(at([...G.add3(G.mul3(ALONG, t), G.mul3(ACROSS, side * 7)).slice(0, 2), beamTop]));
const beamFace = [];
for (let t = -84; t <= 84; t += 42) {
  const p = G.add3(G.mul3(ALONG, t), G.mul3(ACROSS, BEAM_HALF));
  beamFace.push(k.segment([p[0], p[1], BEAM_Z], [p[0], p[1], beamTop], P));
}
put("stand.beam", [0, 0, BEAM_Z + BEAM_H / 2], S(k.extrude(beamRing, BEAM_Z, BEAM_H, P, { bevel: 0.8 }), { tone: "mid" }) + Ln(beamLine(-BEAM_HALF + 4, beamTop) + beamLine(BEAM_HALF - 4, beamTop), { tone: "lo" }) + Ln(beamFace.join(""), { tone: "faint" }) + Dots(beamBolts, { size: 0.42 }), {
  shapes: [record(A.orientedBox([0, 0, BEAM_Z + BEAM_H / 2], [ALONG, ACROSS, [0, 0, 1]], [BEAM_END, BEAM_HALF, BEAM_H / 2], { name: "stand.beam", owner: "stand.frame" }))],
});
// the yoke that carries the top plate from the beam
const YOKE = { x: -11, y: -11, w: 22, d: 22, r: 2 };
boxAt("stand.yoke", YOKE, TOP, BEAM_Z - TOP, { tone: "mid" }, { bevel: 0.5, extra: Dots(k.corners(YOKE, 3).map(([x, y]) => at([x, y, BEAM_Z])), { size: 0.4 }), inner: Ln(k.sideSeam(YOKE, TOP + 4, P, 3), { tone: "faint" }) });

// ---------------------------------------------------------------- the plates, their can flanges, bolt circles, struts
PLATES.forEach((p, index) => {
  const F = vert(0, 0);
  const top = p.z + p.t;
  const bolts = Dots(G.dotsOf(F, top, p.r - 3, Math.round(p.r / 2.2), P, { all: true }), { size: 0.4, tone: p.tone === "hi" ? "mid" : "lo" });
  const seat = Ln(G.circleOf(F, top, p.r - 6, P, 96), { tone: "faint" });
  const holes = Ln([158, 174, 190].map((deg) => G.circleOf(vert(...polar(deg, p.r - 12).slice(0, 2)), top, 1.6, P, 16)).join(""), { tone: "lo" });
  const engraving = p.id === "mxc" ? k.faceTextSvg(k.topMatrix([28, -8], top, P, "x"), "MXC", { size: 3.2, tone: "lo", anchor: "middle" }) : "";
  vdisc(`plate.${p.id}`, 0, 0, p.z, top, p.r, { tone: p.tone, crease: p.tone === "hi" ? "lo" : "faint" }, { bevel: p.t > 5 ? 1.2 : 0.8, extra: bolts + seat + holes + engraving, steps: 120 });
  // the radiation can's bolt flange stays under each plate (the cans themselves are off)
  if (p.id !== "top") vring("plate.can-flange", 0, 0, p.z - 2.4, p.z, p.r - 5, p.r, { tone: "lo" });
  // a thermometer on every stage
  const th = polar(p.id === "top" ? 60 : 150, p.r - 16);
  const thPlan = { x: th[0] - 1.6, y: th[1] - 1.2, w: 3.2, d: 2.4, r: 0.4 };
  boxAt("plate.thermometer", thPlan, top, 2, { tone: "mid" }, { bevel: 0.2, steps: 2, extra: Dots([at([th[0], th[1], top + 2])], { size: 0.4, tone: "hi" }) });
  // struts up to the next plate, on bushings at both ends
  const upper = PLATES[index + 1];
  if (!upper) return;
  for (const deg of STRUT_DEGS) {
    const [x, y] = polar(deg, p.r - 9);
    vdisc("strut.bushing", x, y, top, top + 2.2, 2.8, { tone: "mid" });
    vdisc("strut.rod", x, y, top + 2.2, upper.z - 2.2, STRUT_R, { tone: "mid", crease: "none" }, { steps: 18 });
    vdisc("strut.bushing", x, y, upper.z - 2.2, upper.z, 2.8, { tone: "mid" });
  }
});

// ---------------------------------------------------------------- pulse tube: top plate to 4 K plate, through the 50 K plate
{
  const [x, y] = PT_AT;
  vdisc("pt.link", x, y, topOf("50k"), topOf("50k") + 3, 10.5, { tone: "mid" }, { bevel: 0.3, extra: Dots(G.dotsOf(vert(x, y), topOf("50k") + 3, 9, 8, P, { all: true }), { size: 0.4 }) });
  vdisc("pt.stage1", x, y, topOf("50k") + 3, plate("top").z, 7, { tone: "mid" }, { inner: Ln(k.sideArc(x, y, 7, topOf("50k") + 20, P, 30) + k.sideArc(x, y, 7, plate("top").z - 6, P, 30), { tone: "faint" }) });
  vdisc("pt.link2", x, y, topOf("4k"), topOf("4k") + 2.6, 8.5, { tone: "mid" }, { bevel: 0.3 });
  vdisc("pt.stage2", x, y, topOf("4k") + 2.6, plate("50k").z, 5.4, { tone: "mid" }, { inner: Ln(k.sideArc(x, y, 5.4, topOf("4k") + 16, P, 24), { tone: "faint" }) });
  // the rotary valve and motor head on the top plate
  vdisc("pt.head", x, y, TOP, TOP + 7, 9, { tone: "mid" }, { bevel: 0.6, inner: Ln(k.sideArc(x, y, 9, TOP + 2.2, P, 36), { tone: "faint" }), extra: Ln(k.knurl(x, y, 9, TOP + 4.6, TOP + 7, 36, P, 0.3), { tone: "lo" }) });
  const motor = { x: x - 6, y: y - 4.5, w: 12, d: 9, r: 1 };
  boxAt("pt.motor", motor, TOP + 7, 5, { tone: "mid" }, { extra: Dots(k.corners(motor, 1.8).map(([mx, my]) => at([mx, my, TOP + 12])), { size: 0.4 }) + Ln(k.planOutline(k.insetPlan(motor, 1.6), TOP + 12, P, 2), { tone: "faint" }) });
  vdisc("pt.motor-cap", x + 2, y, TOP + 12, TOP + 14.5, 2.6, { tone: "mid" }, { bevel: 0.3 });
}

// ---------------------------------------------------------------- still pumping line and still pot
{
  const [x, y] = STILL_LINE_AT;
  const potTop = topOf("still") + 10;
  vdisc("still.pot", x, y, topOf("still"), potTop, 9, { tone: "mid" }, { bevel: 0.5, inner: Ln(k.sideArc(x, y, 9, topOf("still") + 2.4, P, 36) + k.sideArc(x, y, 9, potTop - 2.4, P, 36), { tone: "faint" }) });
  const r = 3.4;
  vdisc("still.line", x, y, potTop, plate("4k").z, r, { tone: "mid", crease: "none" });
  for (const id of ["4k", "50k"]) vdisc("still.collar", x, y, topOf(id), topOf(id) + 2, 5.4, { tone: "mid" }, { bevel: 0.3 });
  vdisc("still.line", x, y, topOf("4k") + 2, plate("50k").z, r, { tone: "mid", crease: "none" });
  vdisc("still.line", x, y, topOf("50k") + 2, plate("top").z, r, { tone: "mid", crease: "none" });
  // the KF flange where it leaves the top plate
  vdisc("still.kf", x, y, TOP, TOP + 2.4, 6.2, { tone: "mid" }, { bevel: 0.4, extra: Dots(G.dotsOf(vert(x, y), TOP + 2.4, 5, 6, P, { all: true }), { size: 0.4 }) });
  vdisc("still.stub", x, y, TOP + 2.4, TOP + 9, r, { tone: "mid", crease: "none" });
  vdisc("still.kf", x, y, TOP + 9, TOP + 11.4, 6.2, { tone: "mid" }, { bevel: 0.4 });
  // two blanked-off spare ports on the top plate
  for (const deg of [205, 235]) {
    const [px, py] = polar(deg, 62);
    vdisc("top.port", px, py, TOP, TOP + 2.2, 4.6, { tone: "mid" }, { bevel: 0.3, extra: Dots(G.dotsOf(vert(px, py), TOP + 2.2, 3.6, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.38 }) });
    vdisc("top.port-cap", px, py, TOP + 2.2, TOP + 3.4, 3.2, { tone: "mid" }, { bevel: 0.2 });
  }
}

// ---------------------------------------------------------------- the dilution unit: heat exchangers on a column, mixing chamber pot
{
  const [x, y] = DIL_AT;
  const OWN = "dilution";
  const HX = [117, 110, 103];
  [[topOf("cp"), HX[2]], [HX[2] + 2.8, HX[1]], [HX[1] + 2.8, HX[0]], [HX[0] + 2.8, plate("still").z]].forEach(([z0, z1]) => vdisc("dil.rod", x, y, z0, z1, 1.4, { tone: "mid", crease: "none" }, { owner: OWN, steps: 16 }));
  for (const z of HX) vdisc("dil.hx", x, y, z, z + 2.8, 5.6, { tone: "hi", crease: "lo" }, { owner: OWN, bevel: 0.3, inner: Ln(k.sideArc(x, y, 5.6, z + 1.4, P, 24), { tone: "faint" }) });
  const potTop = topOf("mxc") + 12;
  vdisc("dil.rod", x, y, potTop, plate("cp").z, 1.4, { tone: "mid", crease: "none" }, { owner: OWN, steps: 16 });
  vdisc("dil.mxc-pot", x, y, topOf("mxc"), potTop, 8, { tone: "hi", crease: "lo" }, { owner: OWN, bevel: 0.5, inner: Ln(k.sideArc(x, y, 8, topOf("mxc") + 2.2, P, 32) + k.sideArc(x, y, 8, potTop - 2.6, P, 32), { tone: "faint" }), extra: Dots(G.dotsOf(vert(x, y), potTop, 6.4, 8, P, { all: true }), { size: 0.4 }) });
  // a heater on the still plate and one on the mixing chamber plate
  for (const id of ["still", "mxc"]) {
    const h = polar(id === "still" ? 290 : 250, plate(id).r - 18);
    boxAt("plate.heater", { x: h[0] - 2, y: h[1] - 1.5, w: 4, d: 3, r: 0.5 }, topOf(id), 2.4, { tone: "mid" }, { bevel: 0.2, steps: 2, extra: Dots([at([h[0] - 1, h[1], topOf(id) + 2.4]), at([h[0] + 1, h[1], topOf(id) + 2.4])], { size: 0.38 }) });
  }
}

// ---------------------------------------------------------------- the sample: cold finger, copper package, dial, magnetic shield flange
{
  const [fx, fy] = FINGER;
  const pkgTop = PKG_Z + PKG_H;
  vdisc("sample.finger", fx, fy, pkgTop + 2.4, plate("mxc").z - 3, 2.8, { tone: "mid", crease: "none" }, { steps: 24 });
  vring("sample.finger-clamp", fx, fy, plate("mxc").z - 3, plate("mxc").z, 2.8, 5, { tone: "mid" }, { extra: Dots(G.dotsOf(vert(fx, fy), plate("mxc").z - 3, 4.1, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.36 }) });
  vring("sample.finger-foot", fx, fy, pkgTop, pkgTop + 2.4, 2.8, 4.6, { tone: "mid" });
  // the mu-metal shield's bolt ring on the underside of the plate (the can is off, like the radiation cans)
  vring("sample.shield-flange", 8, 9, plate("mxc").z - 2.2, plate("mxc").z, 17.5, 20.5, { tone: "lo" });
  // the package: a copper box with a lid seam, lid screws, and a pointer dial standing for the qubit state
  const ticks = k.radialTicks(DIAL[0], DIAL[1], DIAL_R - 0.6, 8, 4, pkgTop, [0.7, 1.3], P);
  boxAt("sample.package", PKG, PKG_Z, PKG_H, { tone: "hi", lit: true, crease: "lo" }, {
    bevel: 0.5,
    inner: Ln(k.sideSeam(PKG, PKG_Z + 6, P, 3), { tone: "faint" }),
    extra:
      screws(k.corners(PKG, 2.2), pkgTop, { ring: 1.1, size: 0.4, tone: "lo" }) +
      Ln(k.ring(DIAL[0], DIAL[1], DIAL_R, pkgTop, P, 40), { tone: "lo" }) +
      Ln(ticks.minor, { tone: "lo" }) +
      Ln(ticks.major, { tone: "mid" }) +
      Dots([at([DIAL[0], DIAL[1] - DIAL_R + 0.6, pkgTop]), at([DIAL[0], DIAL[1] + DIAL_R - 0.6, pkgTop])], { size: 0.5, tone: "hi" }) +
      `<path data-part="pointer" class="iso-line" data-tone="lit" data-free="start" d="" style="stroke-width:0.9"/>` +
      Dots([at([DIAL[0], DIAL[1], pkgTop])], { size: 0.45, tone: "hi" }),
  });
}

// ---------------------------------------------------------------- coax lines with their feedthroughs, attenuators, isolators and amplifiers
// A coax route is a few straight legs, filleted. Every plate it passes and every component it enters is a gap in the tube,
// with the component drawn as its own solid owned by the coax. `bites` records where the signal changes level.
const ROUTES = {};
function sAtZ(points, z) {
  let s = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const seg = G.len3(G.sub3(b, a));
    if ((a[2] - z) * (b[2] - z) <= 0 && a[2] !== b[2]) return s + (seg * (z - a[2])) / (b[2] - a[2]);
    s += seg;
  }
  return null;
}
const SMA_LEN = 2.6;
function coax(name, control, { tone = "hi", gapsZ = [] } = {}) {
  const route = G.fillet(control, COAX_R * 2.6, 12, { P, tube: COAX_R });
  const total = G.pathLength(route);
  const gaps = [[0, SMA_LEN], [total - SMA_LEN, total], ...gapsZ.map(([zA, zB]) => [sAtZ(route, zA), sAtZ(route, zB)].sort((a, b) => a - b))];
  gaps.sort((a, b) => a[0] - b[0]);
  R.route(name, route, COAX_R, { gaps, limp: true, rims: [COAX_R * 1.4, COAX_R * 1.4] });
  tubePieces(route, COAX_R, P, { maxLength: 16, spacing: 1, gaps, stripes: true }).forEach((part, index) => put(`${name}:${index}`, part.mid, tubeSvg(part, { tone }), { shapes: [A.tube(part.points, part.radii)] }));
  ROUTES[name] = { route, total, gaps };
  return route;
}
// a feedthrough or thermal clamp: a flange disc on the plate top around the coax
// the bulkhead nut under the plate: the coax ends on it from below, so the plate itself is never touched by a run end
const NUT = 1.4;
function nut(owner, [x, y], plateId) {
  const z = plate(plateId).z;
  vdisc("coax.nut", x, y, z - NUT, z, 2.2, { tone: "mid", crease: "none" }, { owner, steps: 16 });
  return z - NUT;
}
function feedthrough(owner, [x, y], plateId, { r = 2.4, t = 1.4 } = {}) {
  const top = topOf(plateId);
  vdisc("coax.feedthrough", x, y, top, top + t, r, { tone: "mid" }, { owner, bevel: 0.25, extra: Dots(G.dotsOf(vert(x, y), top + t, r * 0.68, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.34, tone: "lo" }) });
  return [nut(owner, [x, y], plateId), top + t];
}
// a cryogenic attenuator: a barrel standing on a bulkhead flange on the plate top
function attenuator(owner, [x, y], plateId) {
  const top = topOf(plateId);
  const z0 = top + 1.4;
  vdisc("coax.feedthrough", x, y, top, z0, 3.2, { tone: "mid" }, { owner, bevel: 0.25, extra: Dots(G.dotsOf(vert(x, y), z0, 2.3, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.34, tone: "lo" }) });
  const profile = [[z0, 2], [z0 + 1.6, 2], [z0 + 1.6, 2.7], [z0 + 7.2, 2.7], [z0 + 7.2, 2], [z0 + 9, 2]];
  turned("coax.attenuator", vert(x, y), profile, { tone: "hi", crease: "lo" }, { owner, inner: Ln(k.sideArc(x, y, 2.7, z0 + 4.4, P, 20), { tone: "faint" }), extra: Ln(k.knurl(x, y, 2.7, z0 + 5.2, z0 + 7.2, 20, P, 0.25), { tone: "lo" }) });
  return { gap: [nut(owner, [x, y], plateId), z0 + 9], centreZ: z0 + 4.4 };
}
// an SMA barrel standing out of a vertical face along `axis`; the coax ends on the face inside it
function sma(owner, face, axis, length = SMA_LEN) {
  const F = G.frameAlong(face, axis);
  turned("coax.sma", F, [[0, 1.7], [0.9, 1.7], [0.9, 1.3], [length - 0.9, 1.3], [length - 0.9, 1.55], [length, 1.55]], { tone: "mid" }, { owner, inner: Ln(G.arcOf(F, 0.45, 1.7, P), { tone: "faint" }) });
  return face;
}

// the drive line: room-temperature box on the top plate, down through every plate, 20 dB at 4K, CP and MXC, into the package
const DRIVE = "coax.drive";
const [dx, dy] = DRIVE_XY;
boxAt("rt.drive-box", DRIVE_BOX, TOP, RT_BOX_H, { tone: "mid" }, {
  bevel: 0.5,
  inner: Ln(k.sideSeam(DRIVE_BOX, TOP + RT_BOX_H - 4, P, 3), { tone: "faint" }),
  extra: Ln(k.planOutline(k.insetPlan(DRIVE_BOX, 1.6), TOP + RT_BOX_H, P, 3), { tone: "faint" }) + Dots(k.corners(DRIVE_BOX, 1.8).map(([x, y]) => at([x, y, TOP + RT_BOX_H])), { size: 0.4 }) + Dots([at([DRIVE_BOX.x + 2.2, DRIVE_BOX.y + DRIVE_BOX.d, TOP + 4])], { size: 0.55, tone: "hi" }),
});
const driveStart = sma(DRIVE, [DRIVE_BOX.x + DRIVE_BOX.w, DRIVE_BOX.y + 4, RT_PORT_Z], [1, 0, 0]);
const driveEnd = sma(DRIVE, [PKG.x + PKG.w, 12, PKG_MID], [1, 0, 0]);
const driveGaps = [feedthrough(DRIVE, DRIVE_XY, "top"), feedthrough(DRIVE, DRIVE_XY, "50k"), feedthrough(DRIVE, DRIVE_XY, "still")];
const BITES = [];
for (const id of ["4k", "cp", "mxc"]) {
  const { gap, centreZ } = attenuator(DRIVE, DRIVE_XY, id);
  driveGaps.push(gap);
  BITES.push({ id, z: centreZ });
}
const driveRoute = coax(DRIVE, [driveStart, [dx, dy, RT_PORT_Z], [dx, dy, PKG_MID], driveEnd], { gapsZ: driveGaps });
BITES.forEach((bite) => (bite.s = sAtZ(driveRoute, bite.z)));

// the readout line: out of the package, two isolators at MXC, a circulator at CP, the HEMT at 4K, a room-temperature amplifier on top
const READ = "coax.readout";
const readStart = sma(READ, [12, PKG.y + PKG.d, PKG_MID], [0, 1, 0]);
boxAt("rt.amp-box", AMP_BOX, TOP, RT_BOX_H, { tone: "mid" }, {
  bevel: 0.5,
  inner: Ln(k.sideSeam(AMP_BOX, TOP + RT_BOX_H - 4, P, 3), { tone: "faint" }),
  extra: Ln(k.planOutline(k.insetPlan(AMP_BOX, 1.6), TOP + RT_BOX_H, P, 3), { tone: "faint" }) + Dots(k.corners(AMP_BOX, 1.8).map(([x, y]) => at([x, y, TOP + RT_BOX_H])), { size: 0.4 }) + Dots([at([AMP_BOX.x + AMP_BOX.w, AMP_BOX.y + 2.2, TOP + 4])], { size: 0.55, tone: "hi" }),
});
const readEnd = sma(READ, [AMP_BOX.x + AMP_BOX.w, READ_HIGH[1], RT_PORT_Z], [1, 0, 0]);
const readGaps = [];
const STOPS = [];
// isolators at the mixing chamber: a double-isolator block standing on the plate, the coax enters from below and leaves on top
{
  const [x, y] = READ_LOW;
  const z0 = topOf("mxc");
  const h = 14;
  const plan = { x: x - 4, y: y - 3.2, w: 8, d: 6.4, r: 0.8 };
  boxAt("coax.isolator", plan, z0, h, { tone: "hi", crease: "lo" }, {
    owner: READ,
    bevel: 0.4,
    inner: Ln(k.sideSeam(plan, z0 + h / 2, P, 3), { tone: "faint" }),
    extra: Dots([at([plan.x + 1.4, plan.y + plan.d, z0 + 3.5]), at([plan.x + plan.w - 1.4, plan.y + plan.d, z0 + 3.5]), at([plan.x + 1.4, plan.y + plan.d, z0 + h - 3.5]), at([plan.x + plan.w - 1.4, plan.y + plan.d, z0 + h - 3.5])], { size: 0.38, tone: "lo" }),
  });
  readGaps.push([nut(READ, READ_LOW, "mxc"), z0 + h]);
  STOPS.push({ id: "isolators", z: z0 + h / 2 });
}
// a circulator at the cold plate: a puck with a terminated third port
{
  const [x, y] = READ_LOW;
  const z0 = topOf("cp");
  vdisc("coax.circulator", x, y, z0, z0 + 5, 4.4, { tone: "hi", crease: "lo" }, { owner: READ, bevel: 0.4, inner: Ln(k.sideArc(x, y, 4.4, z0 + 1.2, P, 28), { tone: "faint" }), extra: Dots(G.dotsOf(vert(x, y), z0 + 5, 3.2, 3, P, { all: true, phase: Math.PI / 2 }), { size: 0.38, tone: "lo" }) });
  const F = G.frameAlong([x + 4.4, y, z0 + 2.5], [1, 0, 0]);
  turned("coax.termination", F, [[0, 1.4], [1.2, 1.4], [1.2, 1], [4, 1], [4, 0.6], [5.2, 0.6]], { tone: "mid" }, { owner: READ });
  readGaps.push([nut(READ, READ_LOW, "cp"), z0 + 5]);
  STOPS.push({ id: "circulator", z: z0 + 2.5 });
}
readGaps.push(feedthrough(READ, READ_LOW, "still"));
// the HEMT at 4 K: a slim box, the coax enters from below and leaves on top, with a DC bias connector on its front
{
  const [x, y] = READ_HIGH;
  const z0 = topOf("4k");
  const h = 16;
  const plan = { x: x - 3.4, y: y - 3.4, w: 6.8, d: 6.8, r: 0.6 };
  boxAt("coax.hemt", plan, z0, h, { tone: "hi", crease: "lo" }, {
    owner: READ,
    bevel: 0.4,
    inner: Ln(k.sideSeam(plan, z0 + h - 3, P, 3), { tone: "faint" }),
    extra: Dots([at([plan.x + plan.w, plan.y + 1.4, z0 + 2.4]), at([plan.x + plan.w, plan.y + plan.d - 1.4, z0 + 2.4])], { size: 0.38, tone: "lo" }),
  });
  const F = G.frameAlong([plan.x + plan.w, y, z0 + 9], [1, 0, 0]);
  turned("coax.dc-plug", F, [[0, 1.3], [2.2, 1.3], [2.2, 0.9], [3.2, 0.9]], { tone: "mid" }, { owner: READ });
  readGaps.push([nut(READ, READ_HIGH, "4k"), z0 + h]);
  STOPS.push({ id: "hemt", z: z0 + h / 2 });
}
readGaps.push(feedthrough(READ, READ_HIGH, "50k"), feedthrough(READ, READ_HIGH, "top"));
const readRoute = coax(READ, [readStart, [READ_LOW[0], READ_LOW[1], PKG_MID], [READ_LOW[0], READ_LOW[1], 148], [READ_HIGH[0], READ_HIGH[1], 164], [READ_HIGH[0], READ_HIGH[1], RT_PORT_Z], readEnd], { gapsZ: readGaps });
STOPS.forEach((stop) => (stop.s = sAtZ(readRoute, stop.z)));
STOPS.push({ id: "rt", s: ROUTES[READ].total });

// ---------------------------------------------------------------- settle the painter's order from geometry, then assemble
A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const body = [halo, ...R.items.map((item) => item.svg)];
// the travelling pulses are drawn last: the coax runs along the front of the chandelier, so nothing stands in front of them
const GHOSTS = 6;
const pulseSvg = (part) => `<g data-part="${part}" style="opacity:0"><circle class="qc-halo" r="1" cx="0" cy="0"/>${Array.from({ length: GHOSTS }, () => `<circle class="qc-tail" r="1" cx="0" cy="0"/>`).join("")}<circle class="qc-dot" r="1" cx="0" cy="0"/></g>`;
// flash rings: a ring that grows and fades round each attenuator when it takes its bite, round the package when the qubit flips,
// and round the HEMT when it amplifies. Each is a unit circle in the plane of the plates, placed and sized by a transform.
const UNIT_RING = (() => {
  const o = at([0, 0, 0]);
  const pts = Array.from({ length: 96 }, (_, i) => at([Math.cos((i / 96) * Math.PI * 2), Math.sin((i / 96) * Math.PI * 2), 0])).map(([x, y]) => `${(x - o[0]).toFixed(4)} ${(y - o[1]).toFixed(4)}`);
  return `M${pts.join("L")}Z`;
})();
const FLASHES = [
  ...BITES.map((b) => ({ kind: "bite", id: b.id, centre: at([dx, dy, b.z]), r0: 3.4, r1: 11 })),
  { kind: "flip", centre: at([PKG.x + PKG.w / 2, PKG.y + PKG.d / 2, PKG_Z + PKG_H / 2]), r0: 17, r1: 30 },
  { kind: "hemt", centre: at([READ_HIGH[0], READ_HIGH[1], topOf("4k") + 8]), r0: 6, r1: 17 },
];
body.push(`<g data-part="flashes">${FLASHES.map((f, i) => `<path class="qc-flash" data-flash="${i}" vector-effect="non-scaling-stroke" style="opacity:0" transform="translate(${f.centre[0].toFixed(1)} ${f.centre[1].toFixed(1)}) scale(${f.r0})" d="${UNIT_RING}"/>`).join("")}</g>`);
body.push(pulseSvg("drive-pulse"));
body.push(pulseSvg("read-pulse"));

// screen samples along each route for the live pulse, with a flag for the spans hidden inside a plate or a component
function samplesOf(name, step = 0.5) {
  const { route, total, gaps } = ROUTES[name];
  const dense = G.resample(route, step);
  let s = 0;
  return dense.map((point, index) => {
    if (index) s += G.len3(G.sub3(point, dense[index - 1]));
    const hidden = gaps.some(([a, b]) => s > a - 0.3 && s < b + 0.3);
    const [sx, sy] = at(point);
    return [Math.round(sx * 10) / 10, Math.round(sy * 10) / 10, hidden ? 0 : 1];
  });
}

const CHAIN = M.photonChain();
const svg = k.figureSvg({
  width: W,
  height: H,
  label:
    "A dilution refrigerator with its radiation cans off, hanging from a beam on two columns: a room-temperature top plate, then gold-plated copper plates at 50 K, 4 K, the still, the cold plate and the mixing chamber, each smaller than the last and held on thin struts. A pulse tube and the still pumping line run down the back, a column of heat exchangers leads to the mixing chamber pot, and under the coldest plate a copper package holds the qubit chip. A drive coax runs down the front through a 20 dB attenuator at 4 K, the cold plate and the mixing chamber into the package; a readout coax climbs back through isolators, a circulator and a HEMT amplifier at 4 K to an amplifier on top.",
  body,
});

const DATA = {
  P,
  period: 14,
  drive: samplesOf(DRIVE),
  read: samplesOf(READ),
  driveTotal: ROUTES[DRIVE].total,
  readTotal: ROUTES[READ].total,
  bites: BITES.map((b) => ({ s: b.s, id: b.id, dB: M.STAGES.find((s) => s.id === b.id).atten, n: CHAIN.find((s) => s.id === b.id).n, total: CHAIN.find((s) => s.id === b.id).dB, label: M.STAGES.find((s) => s.id === b.id).label, name: M.STAGES.find((s) => s.id === b.id).short })),
  stops: STOPS.map((s) => ({ s: s.s, id: s.id })),
  n300: CHAIN[0].n,
  stages: M.STAGES.map((s) => s.label),
  qubit: { fGHz: M.QUBIT.f / 1e9, frGHz: M.QUBIT.fReadout / 1e9, T1us: M.QUBIT.T1 * 1e6, gateNs: M.QUBIT.gate * 1e9 },
  hemt: M.HEMT.gain,
  totalDb: M.TOTAL_DB,
  flashes: FLASHES.map((f) => ({ kind: f.kind, centre: f.centre, r0: f.r0, r1: f.r1 })),
  pkg: at([PKG.x + PKG.w / 2, PKG.y + PKG.d / 2, PKG_Z + PKG_H]),
  ghosts: GHOSTS,
  dial: { at: at([DIAL[0], DIAL[1], PKG_Z + PKG_H]), centre: [DIAL[0], DIAL[1]], z: PKG_Z + PKG_H, r: DIAL_R },
};

const live = `
const D = __DATA__;
const P = D.P;
const PERIOD = D.period;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (sel) => svg.querySelector(sel);
const el = { drive: q('[data-part="drive-pulse"]'), read: q('[data-part="read-pulse"]'), pointer: q('[data-part="pointer"]'), flashes: Array.from(svg.querySelectorAll("[data-flash]")) };
const driveDots = Array.from(el.drive.querySelectorAll("circle"));
const readDots = Array.from(el.read.querySelectorAll("circle"));
const readout = document.querySelector("[data-readout]");
const status = document.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const ramp = (t, a, b) => smooth((t - a) / (b - a));
const lerp = (a, b, s) => a + (b - a) * s;
const fmtN = (n) => (n >= 100 ? Math.round(n).toLocaleString("en-US") : n >= 1 ? n.toFixed(1) : n >= 0.01 ? n.toFixed(2) : n.toFixed(4));
const sampleAt = (list, total, s) => list[clamp(Math.round((s / total) * (list.length - 1)), 0, list.length - 1)];

// the timeline, in seconds of the 14 s loop
const T = { launch: 0.6, land: 4.6, gate0: 4.7, gate1: 5.1, readStart: 5.6, readEnd: 9.6, decay0: 9.9, decay1: 13.5 };
const DECAY_SPAN_US = 320; // the T1 decay plays 320 us of qubit time over 3.6 s

// The pose at time t: a pure function of the loop time, so the tour, the pointer and the keys agree.
function poseAt(t) {
  const o = { driveS: null, readS: null, dB: 0, n: D.n300, p1: 0, phase: "", driveSize: 4.4, readSize: 3, cap: ["", ""] };
  if (t < T.launch) {
    o.phase = "rack at 300 K · drive " + D.qubit.fGHz.toFixed(1) + " GHz · n̄ " + fmtN(D.n300);
    o.cap = ["Rack · 300 K", "drive " + D.qubit.fGHz.toFixed(1) + " GHz · n̄ " + fmtN(D.n300)];
  }
  if (t >= T.launch && t < T.land) {
    o.driveS = D.driveTotal * ((t - T.launch) / (T.land - T.launch));
    let last = null;
    for (const bite of D.bites) if (o.driveS >= bite.s) { o.dB = bite.total; o.n = bite.n; last = bite; }
    o.driveSize = 4.4 * Math.pow(0.86, o.dB / 20);
    o.phase = last ? last.name + " " + last.label + " · −" + last.dB + " dB · total −" + o.dB + " dB · n̄ " + fmtN(o.n) : "down the drive coax · 0 dB · n̄ " + fmtN(o.n);
    o.cap = last ? [last.name + " · " + last.label, "−" + last.dB + " dB · total −" + o.dB + " dB · n̄ " + fmtN(o.n)] : ["Drive line · 300 K", "0 dB · n̄ " + fmtN(o.n)];
  }
  if (t >= T.land) { o.dB = D.totalDb; o.n = D.bites[D.bites.length - 1].n; }
  if (t >= T.land && t < T.readStart) {
    o.p1 = ramp(t, T.gate0, T.gate1);
    o.phase = t < T.gate1 ? "X gate · " + D.qubit.gateNs + " ns · |0⟩ → |1⟩ · −" + D.totalDb + " dB total" : "qubit |1⟩ · n̄ " + fmtN(o.n) + " at the chip · " + D.qubit.frGHz.toFixed(1) + " GHz";
    o.cap = t < T.gate0 ? ["Qubit · 14 mK", "total −" + D.totalDb + " dB · n̄ " + fmtN(o.n)] : t < T.gate1 ? ["X gate · " + D.qubit.gateNs + " ns", "|0⟩ → |1⟩ · n̄ " + fmtN(o.n)] : ["Qubit |1⟩ · 14 mK", "total −" + D.totalDb + " dB · n̄ " + fmtN(o.n)];
  }
  if (t >= T.readStart && t < T.decay0) {
    o.p1 = 1;
    const share = clamp((t - T.readStart) / (T.readEnd - T.readStart), 0, 1);
    o.readS = D.readTotal * share;
    const passed = D.stops.filter((stop) => o.readS >= stop.s).map((stop) => stop.id);
    const hemt = passed.includes("hemt");
    o.readSize = hemt ? 4.6 : 3;
    if (share >= 1) o.phase = "readout out · HEMT +" + D.hemt + " dB · RT amplifier · |1⟩";
    else if (hemt) o.phase = "HEMT +" + D.hemt + " dB at 2.85 K · up to the rack";
    else if (passed.includes("circulator")) o.phase = "circulator at 82 mK · amp noise blocked";
    else if (passed.includes("isolators")) o.phase = "readout up · 2 isolators at 14 mK · |1⟩";
    else o.phase = "readout " + D.qubit.frGHz.toFixed(1) + " GHz leaves the chip · |1⟩";
    o.cap = share >= 1 ? ["Room temperature", "read |1⟩ · HEMT +" + D.hemt + " dB"] : hemt ? ["HEMT · 2.85 K", "+" + D.hemt + " dB · up to the rack"] : passed.includes("circulator") ? ["Circulator · 82 mK", "amplifier noise blocked"] : passed.includes("isolators") ? ["Isolators · 14 mK", "readout " + D.qubit.frGHz.toFixed(1) + " GHz · |1⟩"] : ["Readout · 14 mK", D.qubit.frGHz.toFixed(1) + " GHz leaves the chip"];
  }
  if (t >= T.decay0 && t < T.decay1) {
    const us = DECAY_SPAN_US * ((t - T.decay0) / (T.decay1 - T.decay0));
    o.p1 = Math.exp(-us / D.qubit.T1us);
    o.phase = "T1 " + D.qubit.T1us + " µs · " + Math.round(us) + " µs · P(|1⟩) " + o.p1.toFixed(2);
    o.cap = ["T1 decay · " + D.qubit.T1us + " µs", Math.round(us) + " µs · P(|1⟩) " + o.p1.toFixed(2)];
  }
  if (t >= T.decay1) { o.p1 = Math.exp(-DECAY_SPAN_US / D.qubit.T1us); o.phase = "|0⟩ · " + D.stages.slice(1).join(" · "); o.cap = ["Back to |0⟩", D.stages.slice(1).join(" · ")]; }
  return o;
}

const pointerAt = (p1) => {
  const a = Math.PI * p1; // 0: |0⟩ mark at the back of the dial, π: |1⟩ mark at the front
  const [cx, cy] = D.dial.centre;
  return lineOnTop([cx - Math.sin(a) * 0.8, cy + Math.cos(a) * 0.8], [cx + Math.sin(a) * (D.dial.r - 0.9), cy - Math.cos(a) * (D.dial.r - 0.9)], D.dial.z + 0.2, P);
};
// the pulse: a soft halo, a lit head, and a trail of ghost dots behind it along the coax. Inside a plate or a component
// the head and any ghost there fade over a couple of units instead of popping.
const visibleAt = (list, total, s) => { let v = 0; for (const d of [-1.2, -0.6, 0, 0.6, 1.2]) v += sampleAt(list, total, clamp(s + d, 0, total))[2]; return v / 5; };
function placePulse(group, dots, list, total, s, size) {
  if (s === null) { group.style.opacity = "0"; return; }
  group.style.opacity = "1";
  const head = sampleAt(list, total, s);
  const seen = visibleAt(list, total, s);
  const halo = dots[0], tip = dots[dots.length - 1];
  halo.setAttribute("cx", head[0]); halo.setAttribute("cy", head[1]); halo.setAttribute("r", (size * 2.3).toFixed(2)); halo.style.opacity = (0.16 * seen).toFixed(3);
  tip.setAttribute("cx", head[0]); tip.setAttribute("cy", head[1]); tip.setAttribute("r", size.toFixed(2)); tip.style.opacity = seen.toFixed(3);
  for (let i = 0; i < D.ghosts; i++) {
    const back = (i + 1) * 3.4;
    const dot = dots[i + 1];
    const at = Math.max(0, s - back);
    const tail = sampleAt(list, total, at);
    dot.setAttribute("cx", tail[0]); dot.setAttribute("cy", tail[1]); dot.setAttribute("r", (size * (0.82 - i * 0.1)).toFixed(2));
    dot.style.opacity = (s - back < 0 ? 0 : (0.5 * Math.pow(0.68, i)) * visibleAt(list, total, at)).toFixed(3);
  }
}
// event times, from the same timeline as the pulse
const flashTimes = D.flashes.map((f, i) => {
  if (f.kind === "bite") return T.launch + (D.bites[i].s / D.driveTotal) * (T.land - T.launch);
  if (f.kind === "flip") return T.gate0;
  return T.readStart + (D.stops.find((stop) => stop.id === "hemt").s / D.readTotal) * (T.readEnd - T.readStart);
});
const flashAt = (age) => (age < 0 || age > 2.4 ? 0 : smooth(age / 0.08) * Math.exp(-Math.max(0, age - 0.08) / 0.32));
function placeFlashes(t) {
  el.flashes.forEach((ring, i) => {
    const f = D.flashes[i];
    const age = t - flashTimes[i];
    const e = still.matches ? 0 : flashAt(age);
    ring.style.opacity = (0.9 * e).toFixed(3);
    if (e <= 0) return;
    const r = f.r0 + (f.r1 - f.r0) * (1 - Math.exp(-age / 0.28));
    ring.setAttribute("transform", "translate(" + f.centre[0].toFixed(1) + " " + f.centre[1].toFixed(1) + ") scale(" + r.toFixed(3) + ")");
  });
}

let clock = 0, target = 0, touring = !still.matches, scrubbing = false, frame = 0, last = 0, visible = false, idleTimer = 0;
let p1 = 0, lastPhase = "";
const follow = (v, to, dt, tau, calm) => (calm ? to : Math.abs(to - v) < 0.0015 ? to : v + (to - v) * (1 - Math.exp(-dt / tau)));
function draw(dt, calm) {
  const o = poseAt(clock);
  p1 = follow(p1, o.p1, dt, 0.09, calm);
  el.pointer.setAttribute("d", pointerAt(p1));
  placePulse(el.drive, driveDots, D.drive, D.driveTotal, o.driveS, o.driveSize);
  placePulse(el.read, readDots, D.read, D.readTotal, o.readS, o.readSize);
  placeFlashes(clock);
  if (readout.textContent !== o.phase) readout.textContent = o.phase;
  stage.setAttribute("aria-valuenow", String(Math.round((clock / PERIOD) * 100)));
  if (o.phase !== lastPhase) {
    lastPhase = o.phase;
    stage.setAttribute("aria-valuetext", o.phase);
    if (document.activeElement === stage) status.textContent = o.phase;
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    clock += dt;
    if (clock >= PERIOD) clock -= PERIOD;
  } else {
    clock = calm ? target : follow(clock, target, dt, 0.16, false);
    if (Math.abs(target - clock) < 0.004) clock = target;
  }
  draw(dt, calm);
  const settled = !touring && clock === target && !scrubbing && p1 === poseAt(clock).p1;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

const PHASES = [0, 0.7, 1.9, 3.0, 4.1, 4.9, 5.4, 6.2, 7.1, 8.3, 9.4, 10.6, 12.0, 13.6];
function steer(to) {
  touring = false;
  target = clamp(to, 0, PERIOD - 0.01);
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (still.matches) return; touring = true; clock = target; run(); }, 3600);
  run();
}
const shareOf = (event) => { const box = svg.getBoundingClientRect(); return clamp(((event.clientX - box.left) / box.width - 0.08) / 0.84, 0, 1); };
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "touch" && !scrubbing) return; steer(shareOf(event) * PERIOD); });
stage.addEventListener("pointerdown", (event) => { scrubbing = true; stage.setPointerCapture(event.pointerId); steer(shareOf(event) * PERIOD); });
const release = () => { scrubbing = false; steer(target); };
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);
stage.addEventListener("pointerleave", () => { if (!scrubbing) steer(target); });
stage.addEventListener("keydown", (event) => {
  if (touring) target = clock;
  const here = PHASES.reduce((best, p, index) => (Math.abs(p - target) < Math.abs(PHASES[best] - target) ? index : best), 0);
  let to = null;
  const key = event.key;
  if (key === "ArrowRight" || key === "ArrowUp") to = PHASES[Math.min(PHASES.length - 1, here + (Math.abs(PHASES[here] - target) < 0.05 ? 1 : PHASES[here] > target ? 0 : 1))];
  if (key === "ArrowLeft" || key === "ArrowDown") to = PHASES[Math.max(0, here - (PHASES[here] < target - 0.05 ? 0 : 1))];
  if (key === "Home") to = PHASES[0];
  if (key === "End") to = PHASES[PHASES.length - 1];
  if (key === " " || key === "Enter") {
    event.preventDefault();
    if (touring) { touring = false; target = clock; clearTimeout(idleTimer); }
    else if (!still.matches) { touring = true; clearTimeout(idleTimer); run(); }
    return;
  }
  if (key === "Escape") { event.preventDefault(); clearTimeout(idleTimer); if (!still.matches) { touring = true; run(); } return; }
  if (to === null) return;
  event.preventDefault();
  steer(to);
});
stage.addEventListener("focus", () => { status.textContent = lastPhase; });
// for the director's cut: the caption lines and where to look (the pulse head, or the package) at loop time t
window.__qcPose = (t) => {
  const o = poseAt(t);
  const focus = o.driveS !== null ? sampleAt(D.drive, D.driveTotal, o.driveS) : o.readS !== null ? sampleAt(D.read, D.readTotal, o.readS) : D.pkg;
  return { cap: o.cap, focus: [focus[0], focus[1]], drive: o.driveS !== null, read: o.readS !== null, p1: o.p1 };
};
window.__qcSeek = (t) => { touring = false; clearTimeout(idleTimer); clock = target = clamp(t, 0, PERIOD - 0.01); p1 = poseAt(clock).p1; draw(1 / 60, true); };
if (still.matches) { touring = false; clock = target = 5.3; p1 = 1; }
draw(1 / 60, true);
`.replace("__DATA__", JSON.stringify(DATA));

const css = `<style>
.iso-stage{touch-action:pan-y;cursor:ew-resize}
.iso-stage:focus{outline:none}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
.qc-dot{fill:var(--anatomy-lit);stroke:var(--anatomy-card);stroke-width:.6}
.qc-tail{fill:var(--anatomy-lit)}
.qc-halo{fill:var(--anatomy-lit)}
.qc-flash{fill:none;stroke:var(--anatomy-lit);stroke-width:1.3}
.qc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
</style>`;

const mxc = CHAIN[CHAIN.length - 1];
const html =
  css +
  k.plateHtml({
    fig: "Fig 1",
    title: "A quantum computer",
    hint: "Hover scrubs · ← → step · Space",
    readout: `rack at 300 K · drive ${(M.QUBIT.f / 1e9).toFixed(1)} GHz · n̄ ${M.fmtN(CHAIN[0].n)}`,
    keys: [
      { mark: "lit", label: "The qubit package at 14 mK; its pointer reads the qubit state" },
      { mark: "raised", label: `Three 20 dB attenuators on the drive line: ${M.TOTAL_DB} dB in all, so about ${M.fmtN(mxc.n)} thermal photons reach the chip` },
      { mark: "edge", label: `Readout back up: two isolators, a circulator, a ${M.HEMT.gain} dB HEMT at 2.85 K, an amplifier at room temperature` },
    ],
    caption: `A superconducting quantum computer is mostly a refrigerator. Its transmon qubit sits at the bottom of a cryogen-free dilution refrigerator, drawn here with the cans off: a pulse tube cools the 50 K and 4 K plates; below them the still, cold plate and mixing chamber plates hang on struts, cooled by He-3 diluting into He-4 in the mixing chamber (measured stages 35 K, 2.85 K, 0.88 K, 82 mK, 14 mK). A ${(M.QUBIT.f / 1e9).toFixed(1)} GHz drive pulse starts with about ${M.fmtN(CHAIN[0].n)} thermal photons at 300 K and loses 20 dB at 4 K, 20 dB at the cold plate and 20 dB at the mixing chamber, so the transmon sees about ${M.fmtN(mxc.n)}; a ${M.QUBIT.gate * 1e9} ns pulse flips it, the ${(M.QUBIT.fReadout / 1e9).toFixed(1)} GHz readout climbs back through isolators and a ${M.HEMT.gain} dB HEMT, and the excited state decays with T1 of ${M.QUBIT.T1 * 1e6} µs.`,
    body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="A dilution refrigerator with a qubit package at the bottom. Arrow keys step through the drive, gate, readout and decay; Space pauses; Escape resumes the tour." aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${svg}<span class="qc-sr" role="status" aria-live="polite" data-status></span></div>`,
  });

const name = THEME === "light" ? "quantum-computer-light.html" : "quantum-computer.html";
const page = k.pageHtml({ title: "A quantum computer", theme: THEME, body: html, script: kitScript() + live, width: 640 });
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `· ${R.items.length} items · ${solids} solids · ${(svg.match(/<path/g) || []).length} paths · ${R.tubes.length} tube runs`);

A.auditOrExit(R, P);
