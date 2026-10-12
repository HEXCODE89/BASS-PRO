export interface PluginParameters {
  // Input Stage
  inputPad: -6 | 0 | 6; // dB
  inputTrim: number; // -12 to +12 dB
  lfCutEnabled: boolean;
  lfCutFreq: number; // 20 to 100 Hz

  // 7-Band Multiband Profess Dynamics
  profess: number; // 0 to 100 %
  transients: 'fast' | 'dynamic'; // 'fast' = sharp leveling, 'dynamic' = preserves attack transients

  // 7-Band EQ
  subBass: number; // -12 to +12 dB (~35 Hz)
  loBass: number; // -12 to +12 dB (~90 Hz)
  hiBass: number; // -12 to +12 dB (~200 Hz)
  fullness: number; // -12 to +12 dB (~450 Hz)
  articulation: number; // -12 to +12 dB (~1200 Hz)
  presence: number; // -12 to +12 dB (~2800 Hz)
  treble: number; // -12 to +12 dB (~6000 Hz)

  // Dirt (Bass Tube Saturation / Overdrive)
  dirt: number; // 0 to 100 %
  dirtTone: number; // 0 to 100 % (focuses distortion warmth or biting bite)

  // Master Dynamics & Output
  widebandComp: boolean; // Master finishing glue compressor
  stereoMode: boolean; // true = stereo, false = mono sum
  mix: number; // 0 to 100 % wet
  outputTrim: number; // -12 to +12 dB
  bypass: boolean;
}

export interface Preset {
  id: string;
  name: string;
  category: string;
  description: string;
  params: PluginParameters;
}

export const DEFAULT_PARAMS: PluginParameters = {
  inputPad: 0,
  inputTrim: 0,
  lfCutEnabled: true,
  lfCutFreq: 30,

  profess: 45,
  transients: 'dynamic',

  subBass: 1.5,
  loBass: 2.0,
  hiBass: -0.5,
  fullness: -1.0,
  articulation: 2.5,
  presence: 1.8,
  treble: 0.5,

  dirt: 20,
  dirtTone: 50,

  widebandComp: true,
  stereoMode: false, // Bass usually mono
  mix: 100,
  outputTrim: 0,
  bypass: false,
};

export const FACTORY_PRESETS: Preset[] = [
  {
    id: 'default',
    name: 'BASS PRO Default',
    category: 'Balanced',
    description: 'General purpose DI bass sweetener with gentle leveling, low-end weight, and crisp articulation.',
    params: {...DEFAULT_PARAMS},
  },
  {
    id: 'punchy-rock',
    name: 'BASS PRO Rock Pick',
    category: 'Rock',
    description: 'High presence and dirt designed for pick playing. Cuts through heavy guitar walls with bite.',
    params: {
      ...DEFAULT_PARAMS,
      inputPad: 0,
      inputTrim: 1.0,
      lfCutEnabled: true,
      lfCutFreq: 35,
      profess: 60,
      transients: 'dynamic',
      subBass: 0.5,
      loBass: 3.0,
      hiBass: 1.0,
      fullness: -2.0,
      articulation: 4.0,
      presence: 4.5,
      treble: 2.0,
      dirt: 45,
      dirtTone: 65,
      widebandComp: true,
      stereoMode: false,
      mix: 100,
      outputTrim: -1.0,
      bypass: false,
    },
  },
  {
    id: 'metal-clank',
    name: 'BASS PRO Metal Clank',
    category: 'Metal',
    description: 'Darkglass/Ampeg style scooped mids with ferocious 2.8kHz clank attack and heavy tube dirt.',
    params: {
      ...DEFAULT_PARAMS,
      inputPad: 0,
      inputTrim: 2.0,
      lfCutEnabled: true,
      lfCutFreq: 40,
      profess: 75,
      transients: 'dynamic',
      subBass: 3.5,
      loBass: 2.0,
      hiBass: -2.5,
      fullness: -5.0,
      articulation: 3.0,
      presence: 6.5,
      treble: 3.5,
      dirt: 70,
      dirtTone: 75,
      widebandComp: true,
      stereoMode: false,
      mix: 100,
      outputTrim: -2.0,
      bypass: false,
    },
  },
  {
    id: 'motown-soul',
    name: 'BASS PRO Motown Vintage',
    category: 'Vintage',
    description: 'Warm, thick, rounded thumb sound. Tamed highs, heavy low-bass body, and subtle saturation warmth.',
    params: {
      ...DEFAULT_PARAMS,
      inputPad: 0,
      inputTrim: -1.0,
      lfCutEnabled: true,
      lfCutFreq: 25,
      profess: 55,
      transients: 'fast',
      subBass: 2.0,
      loBass: 4.5,
      hiBass: 2.5,
      fullness: 2.0,
      articulation: -1.0,
      presence: -3.0,
      treble: -5.0,
      dirt: 15,
      dirtTone: 30,
      widebandComp: true,
      stereoMode: false,
      mix: 100,
      outputTrim: 0.5,
      bypass: false,
    },
  },
  {
    id: 'slap-funk',
    name: 'BASS PRO Slap Funk',
    category: 'Funk',
    description: 'Dynamic transient punch for thumb slaps with glass-clear treble for high string pops.',
    params: {
      ...DEFAULT_PARAMS,
      inputPad: 0,
      inputTrim: 0,
      lfCutEnabled: true,
      lfCutFreq: 30,
      profess: 40,
      transients: 'dynamic',
      subBass: 4.0,
      loBass: 1.5,
      hiBass: -1.0,
      fullness: -3.0,
      articulation: 5.0,
      presence: 3.5,
      treble: 4.0,
      dirt: 10,
      dirtTone: 50,
      widebandComp: true,
      stereoMode: false,
      mix: 100,
      outputTrim: 0,
      bypass: false,
    },
  },
  {
    id: 'sub-anchor-5string',
    name: 'BASS PRO 5-String Sub',
    category: 'Sub Bass',
    description: 'Optimized for 30Hz fundamental notes on low B strings with tight high-pass filtering.',
    params: {
      ...DEFAULT_PARAMS,
      inputPad: 0,
      inputTrim: 0,
      lfCutEnabled: true,
      lfCutFreq: 22,
      profess: 65,
      transients: 'fast',
      subBass: 5.5,
      loBass: 3.0,
      hiBass: 0,
      fullness: -1.5,
      articulation: 1.0,
      presence: 0.5,
      treble: -1.0,
      dirt: 10,
      dirtTone: 40,
      widebandComp: true,
      stereoMode: false,
      mix: 100,
      outputTrim: -0.5,
      bypass: false,
    },
  },
  {
    id: 'transparent-leveler',
    name: 'BASS PRO Clean Leveler',
    category: 'Clean',
    description: 'Even out uneven DI finger velocity and sustain notes effortlessly without coloring tone.',
    params: {
      ...DEFAULT_PARAMS,
      inputPad: 0,
      inputTrim: 0,
      lfCutEnabled: true,
      lfCutFreq: 30,
      profess: 70,
      transients: 'fast',
      subBass: 0,
      loBass: 0,
      hiBass: 0,
      fullness: 0,
      articulation: 0,
      presence: 0,
      treble: 0,
      dirt: 0,
      dirtTone: 50,
      widebandComp: true,
      stereoMode: false,
      mix: 100,
      outputTrim: 0,
      bypass: false,
    },
  },
];
