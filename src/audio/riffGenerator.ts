/**
 * High-Fidelity Bass Guitar Synthesizer & Riff Buffer Generator
 * Synthesizes realistic electric bass guitar DI signals using
 * multi-harmonic additive synthesis with pick/finger pluck transients,
 * string decay dynamics, and body resonance.
 */

export interface BassRiffInfo {
  id: string;
  name: string;
  style: string;
  bpm: number;
  description: string;
}

export const BUILTIN_RIFFS: BassRiffInfo[] = [
  {
    id: 'finger-groove',
    name: 'Fingerstyle DI Groove',
    style: 'Soul / Funk (E min)',
    bpm: 96,
    description: 'Classic warm P-Bass fingerstyle with smooth sustain, low-end bloom, and natural dynamic accents.',
  },
  {
    id: 'rock-picked',
    name: 'Heavy Picked Rock',
    style: 'Hard Rock (A min)',
    bpm: 120,
    description: 'Aggressive pick attack with prominent high-mid string clank. Great for testing Dirt and Profess.',
  },
  {
    id: 'slap-funk',
    name: 'Slap & Pop Funk',
    style: 'Funk (E min)',
    bpm: 104,
    description: 'Fast transients, percussive thumb slaps and high string pops to test the Transients and Treble controls.',
  },
  {
    id: 'metal-drop-d',
    name: 'Modern Metal Drop-D',
    style: 'Metal (D min)',
    bpm: 135,
    description: 'Tight, aggressive, down-tuned low D palm-muted chugs and driving 16th notes.',
  },
  {
    id: 'motown-soul',
    name: 'Motown Walking Soul',
    style: 'Vintage Soul (C maj)',
    bpm: 90,
    description: 'Round, warm flatwound tone walking through a 60s Stax/Motown chord progression.',
  },
  {
    id: 'sub-test',
    name: '5-String Sub Fundamental',
    style: 'Low B & E Anchor',
    bpm: 80,
    description: 'Deep sustained 30.87 Hz (Low B) and 41.2 Hz notes to test LF Cut and Sub-Bass clarity.',
  },
];

interface NoteEvent {
  pitch: number; // Hz
  time: number; // seconds
  duration: number; // seconds
  velocity: number; // 0 to 1
  isSlap?: boolean;
  isPop?: boolean;
  isPick?: boolean;
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Generates note patterns for each riff
function getRiffNotes(riffId: string): {bpm: number; duration: number; notes: NoteEvent[]} {
  switch (riffId) {
    case 'finger-groove': {
      // E minor funk groove: E1 (41.2Hz), G1, A1, B1, D2
      const bpm = 96;
      const beat = 60 / bpm;
      const notes: NoteEvent[] = [
        {pitch: midiToHz(28), time: beat * 0, duration: beat * 1.4, velocity: 0.95}, // E1
        {pitch: midiToHz(28), time: beat * 1.5, duration: beat * 0.4, velocity: 0.75}, // E1
        {pitch: midiToHz(31), time: beat * 2.0, duration: beat * 0.8, velocity: 0.85}, // G1
        {pitch: midiToHz(33), time: beat * 3.0, duration: beat * 0.8, velocity: 0.9}, // A1
        {pitch: midiToHz(35), time: beat * 4.0, duration: beat * 1.2, velocity: 0.92}, // B1
        {pitch: midiToHz(38), time: beat * 5.5, duration: beat * 0.4, velocity: 0.8}, // D2
        {pitch: midiToHz(35), time: beat * 6.0, duration: beat * 0.9, velocity: 0.85}, // B1
        {pitch: midiToHz(33), time: beat * 7.0, duration: beat * 0.4, velocity: 0.75}, // A1
        {pitch: midiToHz(31), time: beat * 7.5, duration: beat * 0.4, velocity: 0.8}, // G1
      ];
      return {bpm, duration: beat * 8, notes};
    }
    case 'rock-picked': {
      // A minor rock: A1 (55Hz), C2, D2, E2, G2
      const bpm = 120;
      const beat = 60 / bpm;
      const sixteenth = beat / 4;
      const notes: NoteEvent[] = [];
      const pitches = [
        33, 33, 33, 33, 36, 36, 38, 38,
        33, 33, 33, 33, 40, 40, 38, 36,
      ];
      pitches.forEach((midi, idx) => {
        notes.push({
          pitch: midiToHz(midi),
          time: idx * sixteenth * 2,
          duration: sixteenth * 1.8,
          velocity: idx % 4 === 0 ? 0.98 : 0.8,
          isPick: true,
        });
      });
      return {bpm, duration: beat * 8, notes};
    }
    case 'slap-funk': {
      // Slap thumb on E1, pop on E3 / D3 / G2
      const bpm = 104;
      const beat = 60 / bpm;
      const notes: NoteEvent[] = [
        {pitch: midiToHz(28), time: beat * 0, duration: beat * 0.45, velocity: 1.0, isSlap: true}, // E1 slap
        {pitch: midiToHz(40), time: beat * 0.5, duration: beat * 0.4, velocity: 0.95, isPop: true}, // E2 pop
        {pitch: midiToHz(28), time: beat * 1.0, duration: beat * 0.35, velocity: 0.9, isSlap: true},
        {pitch: midiToHz(28), time: beat * 1.5, duration: beat * 0.4, velocity: 0.85, isSlap: true},
        {pitch: midiToHz(43), time: beat * 2.0, duration: beat * 0.45, velocity: 0.95, isPop: true}, // G2 pop
        {pitch: midiToHz(28), time: beat * 2.5, duration: beat * 0.35, velocity: 0.88, isSlap: true},
        {pitch: midiToHz(41), time: beat * 3.0, duration: beat * 0.4, velocity: 0.9, isPop: true}, // F2
        {pitch: midiToHz(40), time: beat * 3.5, duration: beat * 0.45, velocity: 0.92, isPop: true}, // E2
        {pitch: midiToHz(28), time: beat * 4.0, duration: beat * 0.5, velocity: 1.0, isSlap: true},
        {pitch: midiToHz(38), time: beat * 5.0, duration: beat * 0.45, velocity: 0.92, isPop: true}, // D2
        {pitch: midiToHz(35), time: beat * 6.0, duration: beat * 0.7, velocity: 0.85, isSlap: true}, // B1
        {pitch: midiToHz(31), time: beat * 7.0, duration: beat * 0.8, velocity: 0.9, isSlap: true}, // G1
      ];
      return {bpm, duration: beat * 8, notes};
    }
    case 'metal-drop-d': {
      // Drop D: D1 (36.7Hz), F1, G1, Ab1, G1
      const bpm = 135;
      const beat = 60 / bpm;
      const sixteenth = beat / 4;
      const notes: NoteEvent[] = [];
      const seq = [
        {m: 26, len: 1}, {m: 26, len: 1}, {m: 26, len: 1}, {m: 29, len: 2}, // D1, F1
        {m: 26, len: 1}, {m: 26, len: 1}, {m: 31, len: 2}, // D1, G1
        {m: 26, len: 1}, {m: 26, len: 1}, {m: 32, len: 2}, // D1, Ab1
        {m: 31, len: 2}, {m: 29, len: 2}, // G1, F1
        {m: 26, len: 1}, {m: 26, len: 1}, {m: 26, len: 1}, {m: 26, len: 2},
        {m: 29, len: 2}, {m: 31, len: 2}, {m: 26, len: 3},
      ];
      let t = 0;
      seq.forEach((item) => {
        notes.push({
          pitch: midiToHz(item.m),
          time: t * sixteenth,
          duration: item.len * sixteenth * 0.92,
          velocity: item.m === 26 ? 0.9 : 1.0,
          isPick: true,
        });
        t += item.len;
      });
      return {bpm, duration: Math.max(beat * 8, t * sixteenth), notes};
    }
    case 'motown-soul': {
      // C major walking soul line: C1, E1, G1, A1, Bb1, A1, G1, E1
      const bpm = 90;
      const beat = 60 / bpm;
      const notes: NoteEvent[] = [
        {pitch: midiToHz(24), time: beat * 0, duration: beat * 0.9, velocity: 0.95}, // C1 (32.7Hz)
        {pitch: midiToHz(28), time: beat * 1.0, duration: beat * 0.9, velocity: 0.85}, // E1
        {pitch: midiToHz(31), time: beat * 2.0, duration: beat * 0.9, velocity: 0.9}, // G1
        {pitch: midiToHz(33), time: beat * 3.0, duration: beat * 0.9, velocity: 0.88}, // A1
        {pitch: midiToHz(34), time: beat * 4.0, duration: beat * 0.9, velocity: 0.92}, // Bb1
        {pitch: midiToHz(33), time: beat * 5.0, duration: beat * 0.85, velocity: 0.85}, // A1
        {pitch: midiToHz(31), time: beat * 6.0, duration: beat * 0.85, velocity: 0.88}, // G1
        {pitch: midiToHz(28), time: beat * 7.0, duration: beat * 0.85, velocity: 0.85}, // E1
      ];
      return {bpm, duration: beat * 8, notes};
    }
    case 'sub-test':
    default: {
      // Low B (30.87Hz) and Low E (41.2Hz) sustained anchor
      const bpm = 80;
      const beat = 60 / bpm;
      const notes: NoteEvent[] = [
        {pitch: 30.87, time: beat * 0, duration: beat * 3.5, velocity: 1.0}, // Low B0
        {pitch: 41.2, time: beat * 4.0, duration: beat * 3.5, velocity: 0.95}, // Low E1
      ];
      return {bpm, duration: beat * 8, notes};
    }
  }
}

/**
 * Render a bass note into an audio buffer with authentic electric bass harmonics:
 * Fundamental + 2nd, 3rd, 4th, 5th harmonics with pluck attack transient
 */
export function renderRiffBuffer(
  audioCtx: AudioContext | BaseAudioContext,
  riffId: string
): AudioBuffer {
  const {duration, notes} = getRiffNotes(riffId);
  const sampleRate = audioCtx.sampleRate;
  const numSamples = Math.ceil(duration * sampleRate);

  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Synthesize each note
  notes.forEach((note) => {
    const startSample = Math.floor(note.time * sampleRate);
    const noteSamples = Math.floor(note.duration * sampleRate);
    const endSample = Math.min(numSamples, startSample + noteSamples + Math.floor(0.4 * sampleRate));

    const freq = note.pitch;
    const vel = note.velocity;
    const isPick = !!note.isPick;
    const isSlap = !!note.isSlap;
    const isPop = !!note.isPop;

    // Harmonic weights for electric bass
    // Lower harmonics dominate, upper harmonics decay faster
    const decayRate = isPick ? 1.8 : isSlap ? 2.5 : isPop ? 3.0 : 1.2;

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      if (t < 0) continue;

      // Amplitude envelope (fast attack, natural exponential decay)
      let env = 0;
      const attackTime = isSlap || isPop || isPick ? 0.003 : 0.008;
      if (t < attackTime) {
        env = (t / attackTime);
      } else {
        env = Math.exp(-(t - attackTime) * decayRate);
      }

      // Transient pluck noise/clank
      let transient = 0;
      if (t < 0.025) {
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * (isPick ? 180 : isPop ? 250 : 120));
        transient = noise * (isPick ? 0.35 : isPop ? 0.5 : isSlap ? 0.4 : 0.15);
      }

      // Additive harmonics: f0, 2f0, 3f0, 4f0, 5f0, 6f0
      const phase0 = 2 * Math.PI * freq * t;
      const h1 = Math.sin(phase0);
      const h2 = Math.sin(phase0 * 2) * 0.7 * Math.exp(-t * 1.5);
      const h3 = Math.sin(phase0 * 3) * (isPick || isPop ? 0.55 : 0.35) * Math.exp(-t * 2.5);
      const h4 = Math.sin(phase0 * 4) * (isPick || isPop ? 0.4 : 0.18) * Math.exp(-t * 3.5);
      const h5 = Math.sin(phase0 * 5) * (isPick ? 0.25 : 0.08) * Math.exp(-t * 5.0);
      const h6 = Math.sin(phase0 * 6) * (isPick || isPop ? 0.15 : 0.04) * Math.exp(-t * 7.0);

      const raw = (h1 + h2 + h3 + h4 + h5 + h6) * 0.45 * vel * env + transient * vel;

      // Slight soft saturation on the DI output
      const sampleVal = Math.tanh(raw * 1.1) * 0.65;

      left[i] += sampleVal;
      right[i] += sampleVal;
    }
  });

  // Normalize slightly to prevent clipping and ensure consistent ~ -3dB peak
  let maxPeak = 0;
  for (let i = 0; i < numSamples; i++) {
    const val = Math.abs(left[i]);
    if (val > maxPeak) maxPeak = val;
  }
  if (maxPeak > 0.01) {
    const targetPeak = 0.75; // -2.5 dB
    const scale = targetPeak / maxPeak;
    for (let i = 0; i < numSamples; i++) {
      left[i] *= scale;
      right[i] *= scale;
    }
  }

  return buffer;
}
