// The truth: every number the figure shows comes from here. Sources are listed in NOTES.md.
// Stages of a Bluefors XLD400 as measured by Krinner et al., EPJ Quantum Technology 6:2 (2019), Table 1
// (empty fridge: 35 K, 2.85 K, 882 mK, 82 mK, 6 mK; 14 mK at the mixing chamber with a 50-qubit load, Section 6).
// Drive-line attenuation: their chosen configuration C3, 20 dB at 4K, 20 dB at the cold plate, 20 dB at the mixing chamber (Section 3.2).

export const H = 6.62607015e-34;
export const KB = 1.380649e-23;

export const STAGES = [
  { id: "top", name: "300 K", T: 300, atten: 0, label: "300 K" },
  { id: "50k", name: "50 K", T: 35, atten: 0, label: "35 K" },
  { id: "4k", name: "4 K", short: "4 K", T: 2.85, atten: 20, label: "2.85 K" },
  { id: "still", name: "still", T: 0.882, atten: 0, label: "0.88 K" },
  { id: "cp", name: "cold plate", short: "Cold plate", T: 0.082, atten: 20, label: "82 mK" },
  { id: "mxc", name: "mixing chamber", short: "MXC", T: 0.014, atten: 20, label: "14 mK" },
];

export const QUBIT = {
  f: 5.0e9, // transmon 0-1 transition, about 5 GHz (Kjaergaard et al. 2020, Section 2.1.1)
  fReadout: 7.4e9, // readout resonators at 7.375 to 7.551 GHz (arXiv 2302.06930)
  T1: 85e-6, // 50 to 100 us for shunted transmons (Kjaergaard et al. 2020, Section 2.1.1); 85 us chosen inside that range
  gate: 20e-9, // single-qubit DRAG pulses of 20 ns (arXiv 1708.07677, arXiv 2504.17082)
};

export const HEMT = { gain: 40, T: 2.85, name: "LNF LNC4_8C" }; // about 40 dB at the 4K stage (Krinner 2019, Section 3.4)
export const ISOLATORS = { atMxc: 2, atCp: 1, isolation: 60 }; // two isolators at MXC, a circulator at CP, more than 60 dB together (Section 3.4)

// Bose-Einstein occupation of a mode at frequency f in a bath at temperature T.
export const nBE = (T, f) => 1 / (Math.exp((H * f) / (KB * T)) - 1);

// The thermal photon number travelling down the drive line, stage by stage: each attenuator of A (power ratio)
// passes 1/A of what came in and adds (1 - 1/A) of its own stage's thermal photons (Krinner 2019, Eq. 2).
export function photonChain(f = QUBIT.f) {
  let n = nBE(STAGES[0].T, f);
  let dB = 0;
  return STAGES.map((stage) => {
    if (stage.atten) {
      const A = 10 ** (stage.atten / 10);
      n = n / A + (1 - 1 / A) * nBE(stage.T, f);
      dB += stage.atten;
    }
    return { ...stage, n, dB };
  });
}

export const TOTAL_DB = STAGES.reduce((sum, s) => sum + s.atten, 0);
export const P1 = (t) => Math.exp(-t / QUBIT.T1); // excited-state population after a time t

export const fmtN = (n) => (n >= 100 ? Math.round(n).toLocaleString("en-US") : n >= 1 ? n.toFixed(1) : n >= 0.01 ? n.toFixed(2) : n.toFixed(4));
