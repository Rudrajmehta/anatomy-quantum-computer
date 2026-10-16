# A quantum computer (Fig 1)

An interactive isometric Anatomy figure of a superconducting quantum computer, shown as the place its qubit lives: a cryogen-free dilution refrigerator drawn with its radiation cans off, hanging from a beam on two columns, with a transmon package under the mixing chamber plate. Built with the open-source Anatomy skill (wheresryan22/anatomy, MIT). Tier: Hero (dense round parts, pipework, audit wired, SVG only, no WebGL).

## The object

A dilution refrigerator "chandelier" in its frame. Six plates hang from the top: the room-temperature vacuum flange, then gold-plated copper plates at 50 K, 4 K, the still, the cold plate and the mixing chamber, each smaller than the last, held on thin stainless struts with bushings at both ends. Under each plate the bolt flange of its radiation can stays on (the cans are off, so the inside is visible). A pulse tube runs from a rotary-valve head on the top plate down through the 50 K plate to the 4 K plate, with a copper link collar at each stage. The still pumping line climbs from the still pot through the 4 K and 50 K plates to a KF flange on top. A column of three sintered heat exchangers hangs from the still plate through the cold plate to the mixing chamber pot. Under the coldest plate a copper cold finger carries the qubit package, inside the bolt ring of its mu-metal shield (the shield can is off too). A drive coax runs down the front right from a box on the top plate: a feedthrough at the top and 50 K plates, a 20 dB attenuator barrel at 4 K, a thermal clamp at the still, 20 dB at the cold plate, 20 dB at the mixing chamber, then into the package. A readout coax leaves the package's front face and climbs the front left: a double isolator block at the mixing chamber, a circulator with a terminated port at the cold plate, a clamp at the still, the HEMT amplifier block at 4 K (with its DC bias plug), feedthroughs at 50 K and the top, into the room-temperature amplifier box.

## The idea it explains

Why a quantum computer is mostly a refrigerator. A 5 GHz drive pulse leaves the room-temperature rack carrying about 1,250 thermal photons per mode (kT/hf at 300 K). It loses 20 dB at 4 K, 20 dB at the cold plate and 20 dB at the mixing chamber, each attenuator replacing most of what came in with its own stage's much colder thermal photons, so about 0.003 photons reach the chip at 14 mK. A 20 ns pulse flips the qubit; the pointer on the package turns from |0⟩ to |1⟩. The 7.4 GHz readout climbs back through two isolators and a circulator (so amplifier noise cannot reach the chip), gains 40 dB in the HEMT at 2.85 K, and leaves through the room-temperature amplifier. Then the excited state decays with T1 = 85 µs and the pointer returns to |0⟩.

## Concept to part

| Concept | Part |
|---|---|
| Cryogen-free: a pulse tube cools the top stages | The pulse tube from the rotary-valve head on the top plate through the 50 K plate to the 4 K plate, with link collars |
| Six temperature stages, smaller as they get colder | Six plates of decreasing radius with struts, bushings, bolt circles, can seats and spare holes |
| The radiation cans are off so the inside is visible | Each plate keeps its can's bolt flange underneath |
| He-3 pumped off the still | The still pot and its pumping line up to a KF flange on top |
| Heat exchangers cooling the circulating He-3 | Three sintered discs on the column from the still plate to the cold plate |
| The mixing chamber, where He-3 dilutes into He-4 and the cooling happens | The mixing chamber pot on the MXC plate (tone hi) and the MXC plate itself (tone hi, the one engraved plate) |
| The qubit chip at 14 mK | The lit copper package on a cold finger under the MXC plate, inside its mu-metal shield ring |
| The drive pulse travelling down | A lit dot with two tails along the drive coax; it disappears inside each plate and component |
| 60 dB of attenuation in three bites | Three attenuator barrels on bulkhead flanges at 4 K, cold plate and mixing chamber; the dot shrinks by 26% per bite; the readout ticks −20, −40, −60 dB and the thermal photon number |
| Thermal anchoring without attenuation | Feedthrough flanges and bulkhead nuts at the plates with 0 dB (top, 50 K, still) |
| The gate | A 20 ns pulse: the pointer on the package turns from |0⟩ (back mark) to |1⟩ (front mark) |
| The readout cannot let amplifier noise back in | Two isolators at the mixing chamber (a double block) and a circulator with a terminated port at the cold plate |
| Low-noise amplification at 4 K | The HEMT block at 4 K with its DC plug; the readout dot doubles in size after it |
| Room temperature | The two boxes on the top plate (drive electronics, readout amplifier) and the thermometer on each plate |
| T1 decay | The pointer returns toward |0⟩ following exp(−t/T1) over 320 µs of qubit time played in 3.6 s |

## Truth and sources

Every number comes from `model.mjs`. The page's readout, the pointer and the pulses all come from one `poseAt(t)`, so the tour, hover scrubbing and the keys cannot disagree.

| Number | Value used | Source |
|---|---|---|
| Stage temperatures (installed Bluefors XLD400, empty) | 35 K, 2.85 K, 882 mK, 82 mK; 14 mK at the mixing chamber with a 50-qubit load | Krinner et al., "Engineering cryogenic setups for 100-qubit scale superconducting circuit systems", EPJ Quantum Technology 6:2 (2019), Table 1 and Section 6. https://epjquantumtechnology.springeropen.com/articles/10.1140/epjqt/s40507-019-0072-0 (arXiv 1806.07862) |
| Drive-line attenuation | 20 dB at 4 K, 0 dB at the still, 20 dB at the cold plate, 20 dB at the mixing chamber, 60 dB total (their configuration C3) | Krinner et al. 2019, Section 3.2 and Fig. 5 |
| Thermal photon number at the chip | about 0.003 for C3 at 5 GHz (the paper gives 0.0024 at a 6 mK MXC, about 10⁻³ with cable losses) | Krinner et al. 2019, Section 3.2, Eq. 2; recomputed in `model.mjs` from the stage temperatures with the Bose-Einstein occupation |
| HEMT | about 40 dB gain, LNF LNC4_8C at the 4 K stage | Krinner et al. 2019, Section 3.4 |
| Isolation on the readout line | a circulator at the cold plate and two isolators at the mixing chamber, more than 60 dB together | Krinner et al. 2019, Section 3.4 |
| Cryogen-free, pulse tube cooled; base 10 mK; MXC flange 294 mm | used for the object's proportions and the caption | Bluefors LD system page, https://bluefors.com/products/dilution-refrigerator-measurement-systems/ld-dilution-refrigerator-measurement-system/ |
| Still runs at about 0.6 to 0.7 K; mixing chamber cooling from He-3 crossing the phase boundary into the dilute phase | caption wording | Bluefors, "How does a dilution refrigerator work?", https://bluefors.com/?p=1915 |
| Transmon frequency | 5.0 GHz (typical ω01/2π about 5 GHz) | Kjaergaard et al., "Superconducting Qubits: Current State of Play", Annu. Rev. Condens. Matter Phys. 11, 369 (2020), Section 2.1.1, arXiv 1905.13641 |
| T1 | 85 µs, chosen inside the review's "50 to 100 µs" for shunted transmons | Kjaergaard et al. 2020, Section 2.1.1 |
| Readout resonator | 7.4 GHz (resonators at 7.375 to 7.551 GHz on that device) | arXiv 2302.06930, "All-microwave manipulation of superconducting qubits with a fixed-frequency transmon coupler" |
| Single-qubit gate | 20 ns DRAG pulses | arXiv 1708.07677 (Fu et al., experimental microarchitecture) and arXiv 2504.17082 (surface-code processor), both "20 ns" |

Not verified against a primary source: the exact LNF LNC4_8C noise temperature (about 2 K per a vendor glossary; the figure does not show it). The 10 dB-at-the-still scheme mentioned in the brief is a common pattern but not the published one used here; Krinner's C3 (20/0/20/20) is what the figure draws and says.

## Parts

158 solids, 193 depth-sorted items, 1,484 paths, 14 tube runs:

- Stand: floor plate with breadboard holes, inset groove, corner screws, four feet (flange and foot), ruler strip, label plate, two column bases with screws, two columns in three sections with splice plates, the beam with its bolt rows and face seams, the yoke.
- Plates: six plates with bolt circles, can seats, spare holes, the MXC engraving, five can flanges, a thermometer on each, heaters on the still and MXC plates, fifteen struts with thirty bushings.
- Pulse tube: head with knurled band, motor box, cap, two link collars, two tube sections.
- Still: pot with seams, pumping line in three sections, two collars, KF flange, stub, second flange; two blanked spare ports on the top plate.
- Dilution unit: four column sections, three heat exchanger discs, the mixing chamber pot.
- Sample: cold finger, clamp, foot, shield ring, the lit package with lid seam, screws, dial ring, ticks, marks and pointer.
- Coax: two routes (drive down, readout up) in 14 drawn runs; SMA barrels at all four ends; feedthrough flanges and bulkhead nuts at every plate crossing; three attenuator barrels; the double isolator; the circulator and its termination; the HEMT block and DC plug; two room-temperature boxes.

## Live behaviour

- Idle tour, 14 s loop: pulse down the drive line (0.6 to 4.6 s, the readout ticks −20, −40, −60 dB with the photon number), X gate (4.7 to 5.1 s), readout up (5.6 to 9.6 s, the dot grows after the HEMT), T1 decay (9.9 to 13.5 s, pointer and P(|1⟩) from exp(−t/T1)), then the stage temperatures.
- Hover scrubs the loop (horizontal position maps to time); press and drag on touch. The tour resumes 3.6 s after the last input.
- Keys: Left and Right step between fourteen moments, Home and End, Space or Enter pauses and resumes, Escape resumes the tour.
- `role="slider"`, `aria-valuetext` carries the phase, a polite live region announces phase changes while the figure is focused. Reduced motion gives a still at the moment the qubit is in |1⟩ (t = 5.3 s); the keys still work.
- Stops when settled and when offscreen (IntersectionObserver).
- `window.__qcSeek(t)` seeks the loop for scripted capture (the video uses it).

## Rebuild, re-capture, re-render

From this folder (Node 22, ffmpeg, Chrome at /Applications/Google Chrome.app):

```
node build.mjs                 # quantum-computer.html (dark)
node build.mjs --light         # quantum-computer-light.html
node build.mjs --audit         # must end "audit passed"

node scripts/capture.mjs quantum-computer.html --out shots/desktop.png --wait 1200 --times 1500,3200,4500,6800,9000
node scripts/capture.mjs quantum-computer-light.html --out shots/desktop-light.png --wait 3600
node scripts/capture.mjs quantum-computer.html --out shots/phone-390.png --width 390 --wait 2600
node scripts/capture.mjs quantum-computer.html --out shots/still-reduced.png --reduced --wait 1000
node scripts/capture.mjs quantum-computer.html --out shots/keys.png --key ArrowRight,ArrowRight,ArrowRight --wait 1200

# tour moments and 4x close-ups at exact loop times (card px regions), via window.__qcSeek
node scripts/drive.mjs quantum-computer.html --actions moments.json --height 1000

# 4x close-ups (card px regions): package 275,480,110,80 · MXC 235,420,200,90 · cold plate 270,370,120,70 · HEMT and 4 K attenuator 255,245,130,85
# top plate boxes and bends 265,105,130,75 · top plate 200,95,240,120 · struts 180,300,140,100 · pulse tube 120,170,140,130
node scripts/capture.mjs quantum-computer.html --out shots/zoom-pkg-dark.png --zoom 275,480,110,80 --wait 1000
node scripts/capture.mjs quantum-computer-light.html --out shots/zoom-pkg-light.png --zoom 275,480,110,80 --wait 1000

node scripts/lines.mjs quantum-computer.html --out shots/lines.png
node scripts/lines.mjs quantum-computer-light.html --out shots/lines-light.png

node make-video.mjs            # frames/ at 15 fps for 14 s, then tour.mp4 (1600x900, 30 fps, h264) and tour-square.mp4 (900x900 crop)
```

`make-video.mjs` drives the page in headless Chrome at a 1333x750 viewport, calls `__qcSeek(i/15)` for each of the 210 frames, screenshots the viewport at 1.2x (1600x900) and runs `ffmpeg -framerate 15 -i frame_%04d.png -vf "fps=30,format=yuv420p" -c:v libx264 -crf 23 tour.mp4`. The square cut is `crop=900:900:350:0` on the same frames. `frames/` is removed after encoding; the script recreates it.

## Checks

- Audit: `audit passed` (clearance 0, terminals 0, loose ends 0, folds 0, support 0 loose 0 hanging 0 sunk, depth order 0, self-overlap 0, wobble 0, stand-in shapes 0, crowding 0) over 14 tubes, 158 solids, 193 items.
- Line check: `line ends: 0 of 227 ends on 58 lines float` on both themes.
- Console clean on every capture; no sideways scroll at 1440 or 390.
- Close-ups read at 4x in both themes: package with pointer at |0⟩ and |1⟩, MXC plate with isolator, attenuator and pot, cold plate circulator and attenuator, 4 K HEMT and attenuator, the top plate boxes with both coax bends, the pulse tube head, strut ends and bushings, the pulse inside a feedthrough (hidden) and on a run.

## Decisions made without asking

- The attenuation scheme is Krinner's published C3 (20/0/20/20 dB), not the 20/10/30 example in the brief, because the brief asked for one real published scheme.
- The mu-metal shield is drawn cans-off like the radiation cans: only its bolt ring stays under the MXC plate, so the package is visible.
- The frame has two columns and a beam (the two front members of a real four-column frame are omitted, the same cutaway convention as the cans).
- Coax passes each plate through a feedthrough flange on top and a bulkhead nut underneath, and the tube is gapped from nut to flange, so no run end ever touches a plate and the audit sees true contacts.
- The qubit state is a pointer dial on the package lid (an allowed stand-in readout); the chip itself stays inside the closed package.
- No WebGL: a glow on the MXC plate would not have earned its place against the lit package and the travelling dots.

## Unfinished or could be deeper

- No DC wiring loom (thermometer and HEMT bias wiring) between the plates; adding it means more routes through the audit.
- The continuous heat exchanger is a straight column rather than a coiled capillary.
- The readout line has one jog (still to 4 K); real looms have more.
- The pointer dial is small at 1x (about 9 px across); the readout carries the state in words.
- POST.md in this folder predates this build and was left untouched.

## Time

About 30 minutes of work: started 04:59 (reading the skill, references and sources), first page in the browser at 05:14, audit at zero 05:17, close-ups, video, notes and the final re-captures done by 05:30 local.
