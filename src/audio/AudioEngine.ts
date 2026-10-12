import {DEFAULT_PARAMS, PluginParameters} from '../types/plugin';
import {createDirtCurve, dbToGain} from './dspCurve';
import {renderRiffBuffer} from './riffGenerator';

export interface MeterData {
  inputL: number; // dB
  inputR: number; // dB
  outputL: number; // dB
  outputR: number; // dB
  gainReduction: number; // dB (0 to -24)
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private params: PluginParameters = {...DEFAULT_PARAMS};

  // Source nodes
  private bufferSource: AudioBufferSourceNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseOffset = 0;
  private loop = true;

  // Live input stream
  private mediaStream: MediaStream | null = null;
  private liveSource: MediaStreamAudioSourceNode | null = null;
  private isLiveInputActive = false;

  // Node graph
  private inputGainNode!: GainNode;
  private lfCutFilter!: BiquadFilterNode;

  // 7 EQ filters
  private eqFilters: BiquadFilterNode[] = [];
  // 7 multiband dynamic compressors for the Profess engine
  private bandCompressors: DynamicsCompressorNode[] = [];
  private bandMakeupGains: GainNode[] = [];

  // Dirt overdrive path
  private dirtSplitGain!: GainNode;
  private dirtBandpassHigh!: BiquadFilterNode;
  private dirtBandpassLow!: BiquadFilterNode;
  private dirtShaper!: WaveShaperNode;
  private dirtReturnGain!: GainNode;

  // Master dynamics
  private masterCompressor!: DynamicsCompressorNode;
  private masterCompBypassGain!: GainNode;
  private masterCompActiveGain!: GainNode;

  // Mix & Output
  private dryGainNode!: GainNode;
  private wetGainNode!: GainNode;
  private monoMergerNode!: ChannelMergerNode;
  private monoSplitterNode!: ChannelSplitterNode;
  private stereoNode!: GainNode;
  private outputTrimGain!: GainNode;
  private masterBypassGainDry!: GainNode;
  private masterBypassGainWet!: GainNode;

  // Analysers
  public inputAnalyser!: AnalyserNode;
  public outputAnalyser!: AnalyserNode;

  // Meter data arrays
  private inputTimeData: Float32Array<ArrayBuffer> | null = null;
  private outputTimeData: Float32Array<ArrayBuffer> | null = null;

  // Cached riff buffers
  private riffBuffers: Map<string, AudioBuffer> = new Map();

  // Playback listeners
  private onPlaybackStateChange?: (playing: boolean, progress: number) => void;
  private progressInterval: number | null = null;

  constructor() {
    // Lazily init AudioContext on first user action
  }

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    this.ctx = new AudioContextClass({latencyHint: 'interactive'});

    const ctx = this.ctx;

    // Analysers
    this.inputAnalyser = ctx.createAnalyser();
    this.inputAnalyser.fftSize = 2048;
    this.inputAnalyser.smoothingTimeConstant = 0.8;
    this.inputTimeData = new Float32Array(new ArrayBuffer(this.inputAnalyser.fftSize * 4));

    this.outputAnalyser = ctx.createAnalyser();
    this.outputAnalyser.fftSize = 2048;
    this.outputAnalyser.smoothingTimeConstant = 0.8;
    this.outputTimeData = new Float32Array(new ArrayBuffer(this.outputAnalyser.fftSize * 4));

    // 1. Input Stage
    this.inputGainNode = ctx.createGain();

    // 2. LF Cut Filter (6-12dB/oct Highpass)
    this.lfCutFilter = ctx.createBiquadFilter();
    this.lfCutFilter.type = 'highpass';
    this.lfCutFilter.Q.value = 0.707;

    // 3. 7-Band Multiband Profess Engine & EQ
    // Frequencies: 35Hz, 90Hz, 200Hz, 450Hz, 1200Hz, 2800Hz, 6000Hz
    const freqs = [35, 90, 200, 450, 1200, 2800, 6000];
    const qVals = [0.8, 1.1, 1.2, 1.2, 1.3, 1.3, 0.9];
    const types: BiquadFilterType[] = ['lowshelf', 'peaking', 'peaking', 'peaking', 'peaking', 'peaking', 'highshelf'];

    this.eqFilters = [];
    this.bandCompressors = [];
    this.bandMakeupGains = [];

    // Chain the 7 bands sequentially
    let prevNode: AudioNode = this.lfCutFilter;

    for (let i = 0; i < 7; i++) {
      const eq = ctx.createBiquadFilter();
      eq.type = types[i];
      eq.frequency.value = freqs[i];
      eq.Q.value = qVals[i];
      eq.gain.value = 0;
      this.eqFilters.push(eq);

      // Profess leveler stage per band
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 3;
      comp.attack.value = 0.015;
      comp.release.value = 0.15;
      this.bandCompressors.push(comp);

      const makeup = ctx.createGain();
      makeup.gain.value = 1.0;
      this.bandMakeupGains.push(makeup);

      prevNode.connect(eq);
      eq.connect(comp);
      comp.connect(makeup);
      prevNode = makeup;
    }

    const postEqNode = prevNode;

    // 4. "Dirt" Overdrive Branch
    this.dirtSplitGain = ctx.createGain();
    this.dirtBandpassHigh = ctx.createBiquadFilter();
    this.dirtBandpassHigh.type = 'highpass';
    this.dirtBandpassHigh.frequency.value = 450; // Cut out muddy subs from dirt
    this.dirtBandpassHigh.Q.value = 0.707;

    this.dirtBandpassLow = ctx.createBiquadFilter();
    this.dirtBandpassLow.type = 'lowpass';
    this.dirtBandpassLow.frequency.value = 4200; // Tame harsh fizz
    this.dirtBandpassLow.Q.value = 0.707;

    this.dirtShaper = ctx.createWaveShaper();
    this.dirtShaper.curve = createDirtCurve(this.params.dirt, this.params.dirtTone);
    this.dirtShaper.oversample = '4x';

    this.dirtReturnGain = ctx.createGain();

    // Connect dirt branch
    postEqNode.connect(this.dirtSplitGain);
    this.dirtSplitGain.connect(this.dirtBandpassHigh);
    this.dirtBandpassHigh.connect(this.dirtBandpassLow);
    this.dirtBandpassLow.connect(this.dirtShaper);
    this.dirtShaper.connect(this.dirtReturnGain);

    // Sum main signal + dirt signal
    const postDirtSum = ctx.createGain();
    postEqNode.connect(postDirtSum);
    this.dirtReturnGain.connect(postDirtSum);

    // 5. Master Wide-band Compressor
    this.masterCompressor = ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -14;
    this.masterCompressor.knee.value = 6;
    this.masterCompressor.ratio.value = 3.5;
    this.masterCompressor.attack.value = 0.008;
    this.masterCompressor.release.value = 0.12;

    this.masterCompActiveGain = ctx.createGain();
    this.masterCompBypassGain = ctx.createGain();

    postDirtSum.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterCompActiveGain);

    postDirtSum.connect(this.masterCompBypassGain);

    const postMasterComp = ctx.createGain();
    this.masterCompActiveGain.connect(postMasterComp);
    this.masterCompBypassGain.connect(postMasterComp);

    // 6. Wet / Dry Mix
    this.wetGainNode = ctx.createGain();
    this.dryGainNode = ctx.createGain();

    postMasterComp.connect(this.wetGainNode);
    // Connect clean input for dry blend
    this.inputGainNode.connect(this.dryGainNode);

    const postMixSum = ctx.createGain();
    this.wetGainNode.connect(postMixSum);
    this.dryGainNode.connect(postMixSum);

    // 7. Stereo / Mono Summing
    this.stereoNode = ctx.createGain();
    this.monoSplitterNode = ctx.createChannelSplitter(2);
    this.monoMergerNode = ctx.createChannelMerger(2);

    // Mono path: sum L and R, route identical sum to both channels
    postMixSum.connect(this.monoSplitterNode);
    const monoSummer = ctx.createGain();
    monoSummer.gain.value = 0.5; // -6dB per channel
    this.monoSplitterNode.connect(monoSummer, 0);
    this.monoSplitterNode.connect(monoSummer, 1);
    monoSummer.connect(this.monoMergerNode, 0, 0);
    monoSummer.connect(this.monoMergerNode, 0, 1);

    postMixSum.connect(this.stereoNode);

    const postChannelNode = ctx.createGain();
    this.stereoNode.connect(postChannelNode);
    this.monoMergerNode.connect(postChannelNode);

    // 8. Output Trim & Bypass
    this.outputTrimGain = ctx.createGain();
    postChannelNode.connect(this.outputTrimGain);

    // Master Bypass Switch
    this.masterBypassGainWet = ctx.createGain();
    this.masterBypassGainDry = ctx.createGain();

    this.outputTrimGain.connect(this.masterBypassGainWet);
    this.inputGainNode.connect(this.masterBypassGainDry);

    const finalOut = ctx.createGain();
    this.masterBypassGainWet.connect(finalOut);
    this.masterBypassGainDry.connect(finalOut);

    // Connect to Output Analyser and Speakers
    finalOut.connect(this.outputAnalyser);
    finalOut.connect(ctx.destination);

    // Initial setup of node parameters
    this.updateAllParameters();
  }

  public async ensureContextRunning(): Promise<boolean> {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return !!this.ctx;
  }

  public setParameters(params: PluginParameters) {
    this.params = {...params};
    this.updateAllParameters();
  }

  public getParameters(): PluginParameters {
    return {...this.params};
  }

  private updateAllParameters() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const p = this.params;

    // 1. Input Gain: Pad (-6/0/+6) + Trim (-12 to +12)
    const totalInputDb = p.inputPad + p.inputTrim;
    this.inputGainNode.gain.setTargetAtTime(dbToGain(totalInputDb), now, 0.02);

    // 2. LF Cut Filter (20-100Hz)
    if (p.lfCutEnabled) {
      this.lfCutFilter.frequency.setTargetAtTime(Math.max(20, Math.min(100, p.lfCutFreq)), now, 0.02);
    } else {
      this.lfCutFilter.frequency.setTargetAtTime(10, now, 0.02); // Transparent
    }

    // 3. 7-Band EQ gains
    const gains = [p.subBass, p.loBass, p.hiBass, p.fullness, p.articulation, p.presence, p.treble];
    this.eqFilters.forEach((filter, idx) => {
      filter.gain.setTargetAtTime(gains[idx] || 0, now, 0.02);
    });

    // 4. "Profess" Multiband Dynamic Leveler
    // Controls amount of compression, sustain inflation, and transient shaping
    const professNorm = p.profess / 100; // 0 to 1
    const isDynamic = p.transients === 'dynamic';

    const attackTime = isDynamic ? 0.025 : 0.003; // Dynamic lets pick attack pop
    const thresholdVal = -12 - professNorm * 26; // -12dB down to -38dB
    const ratioVal = 1.5 + professNorm * 4.5; // 1.5:1 up to 6:1
    const makeupDb = professNorm * 6.0; // Upward inflation makeup

    this.bandCompressors.forEach((comp) => {
      comp.threshold.setTargetAtTime(thresholdVal, now, 0.03);
      comp.ratio.setTargetAtTime(ratioVal, now, 0.03);
      comp.attack.setTargetAtTime(attackTime, now, 0.03);
      comp.release.setTargetAtTime(0.18, now, 0.03);
    });

    this.bandMakeupGains.forEach((makeup) => {
      makeup.gain.setTargetAtTime(dbToGain(makeupDb), now, 0.03);
    });

    // 5. "Dirt" Overdrive
    const dirtNorm = p.dirt / 100;
    this.dirtSplitGain.gain.setTargetAtTime(dirtNorm > 0 ? 1.0 : 0, now, 0.02);
    this.dirtReturnGain.gain.setTargetAtTime(dirtNorm * 1.3, now, 0.02);
    this.dirtShaper.curve = createDirtCurve(p.dirt, p.dirtTone);

    // Tone adjusts the lowpass cutoff of the distortion
    const dirtToneCutoff = 1800 + (p.dirtTone / 100) * 4500;
    this.dirtBandpassLow.frequency.setTargetAtTime(dirtToneCutoff, now, 0.02);

    // 6. Master Wide-band Compressor
    if (p.widebandComp) {
      this.masterCompActiveGain.gain.setTargetAtTime(1.0, now, 0.02);
      this.masterCompBypassGain.gain.setTargetAtTime(0.0, now, 0.02);
    } else {
      this.masterCompActiveGain.gain.setTargetAtTime(0.0, now, 0.02);
      this.masterCompBypassGain.gain.setTargetAtTime(1.0, now, 0.02);
    }

    // 7. Wet / Dry Mix
    const wetRatio = p.mix / 100;
    this.wetGainNode.gain.setTargetAtTime(wetRatio, now, 0.02);
    this.dryGainNode.gain.setTargetAtTime(1 - wetRatio, now, 0.02);

    // 8. Stereo / Mono Mode
    if (p.stereoMode) {
      this.stereoNode.gain.setTargetAtTime(1.0, now, 0.02);
      this.monoMergerNode.disconnect();
    } else {
      this.stereoNode.gain.setTargetAtTime(0.0, now, 0.02);
      // Ensure mono path is connected
    }

    // 9. Output Trim
    this.outputTrimGain.gain.setTargetAtTime(dbToGain(p.outputTrim), now, 0.02);

    // 10. Master Bypass
    if (p.bypass) {
      this.masterBypassGainWet.gain.setTargetAtTime(0.0, now, 0.02);
      this.masterBypassGainDry.gain.setTargetAtTime(1.0, now, 0.02);
    } else {
      this.masterBypassGainWet.gain.setTargetAtTime(1.0, now, 0.02);
      this.masterBypassGainDry.gain.setTargetAtTime(0.0, now, 0.02);
    }
  }

  // --- Audio Riff & File Playback ---

  public async loadRiff(riffId: string): Promise<AudioBuffer> {
    await this.ensureContextRunning();
    if (!this.ctx) throw new Error('No AudioContext');

    if (this.riffBuffers.has(riffId)) {
      this.currentBuffer = this.riffBuffers.get(riffId)!;
      return this.currentBuffer;
    }

    const buffer = renderRiffBuffer(this.ctx, riffId);
    this.riffBuffers.set(riffId, buffer);
    this.currentBuffer = buffer;
    return buffer;
  }

  public async loadAudioFile(file: File): Promise<AudioBuffer> {
    await this.ensureContextRunning();
    if (!this.ctx) throw new Error('No AudioContext');

    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this.ctx.decodeAudioData(arrayBuffer);
    this.currentBuffer = decoded;
    return decoded;
  }

  public async play(offset = 0) {
    await this.ensureContextRunning();
    if (!this.ctx || !this.currentBuffer) return;

    if (this.isPlaying) {
      this.stop();
    }

    this.bufferSource = this.ctx.createBufferSource();
    this.bufferSource.buffer = this.currentBuffer;
    this.bufferSource.loop = this.loop;

    // Connect to input stage
    this.bufferSource.connect(this.inputGainNode);
    this.bufferSource.connect(this.inputAnalyser);

    this.startTime = this.ctx.currentTime - offset;
    this.pauseOffset = offset;
    this.bufferSource.start(0, offset);
    this.isPlaying = true;

    this.bufferSource.onended = () => {
      if (!this.loop && this.isPlaying) {
        this.isPlaying = false;
        this.pauseOffset = 0;
        this.stopProgressTracking();
        this.onPlaybackStateChange?.(false, 0);
      }
    };

    this.startProgressTracking();
    this.onPlaybackStateChange?.(true, this.getProgress());
  }

  public pause() {
    if (!this.isPlaying || !this.ctx) return;
    this.pauseOffset = (this.ctx.currentTime - this.startTime) % (this.currentBuffer?.duration || 1);
    this.stopBufferSource();
    this.isPlaying = false;
    this.stopProgressTracking();
    this.onPlaybackStateChange?.(false, this.getProgress());
  }

  public stop() {
    this.pauseOffset = 0;
    this.stopBufferSource();
    this.isPlaying = false;
    this.stopProgressTracking();
    this.onPlaybackStateChange?.(false, 0);
  }

  public seek(progress: number) {
    if (!this.currentBuffer) return;
    const targetOffset = progress * this.currentBuffer.duration;
    this.pauseOffset = targetOffset;
    if (this.isPlaying) {
      this.play(targetOffset);
    } else {
      this.onPlaybackStateChange?.(false, progress);
    }
  }

  public setLoop(loop: boolean) {
    this.loop = loop;
    if (this.bufferSource) {
      this.bufferSource.loop = loop;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getProgress(): number {
    if (!this.currentBuffer || !this.ctx) return 0;
    if (!this.isPlaying) {
      return this.currentBuffer.duration > 0 ? this.pauseOffset / this.currentBuffer.duration : 0;
    }
    const elapsed = (this.ctx.currentTime - this.startTime) % this.currentBuffer.duration;
    return elapsed / this.currentBuffer.duration;
  }

  public setPlaybackStateListener(cb: (playing: boolean, progress: number) => void) {
    this.onPlaybackStateChange = cb;
  }

  private stopBufferSource() {
    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
        this.bufferSource.disconnect();
      } catch {
        // already stopped
      }
      this.bufferSource = null;
    }
  }

  private startProgressTracking() {
    this.stopProgressTracking();
    this.progressInterval = window.setInterval(() => {
      if (this.isPlaying && this.onPlaybackStateChange) {
        this.onPlaybackStateChange(true, this.getProgress());
      }
    }, 50);
  }

  private stopProgressTracking() {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // --- Live Microphone / Interface DI Input ---

  public async startLiveInput(): Promise<boolean> {
    await this.ensureContextRunning();
    if (!this.ctx) return false;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      if (this.isPlaying) this.pause();

      this.liveSource = this.ctx.createMediaStreamSource(this.mediaStream);
      this.liveSource.connect(this.inputGainNode);
      this.liveSource.connect(this.inputAnalyser);
      this.isLiveInputActive = true;
      return true;
    } catch (err) {
      console.error('Failed to open microphone/DI input:', err);
      this.isLiveInputActive = false;
      return false;
    }
  }

  public stopLiveInput() {
    if (this.liveSource) {
      try {
        this.liveSource.disconnect();
      } catch {
        // ignore
      }
      this.liveSource = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.isLiveInputActive = false;
  }

  public getIsLiveInputActive(): boolean {
    return this.isLiveInputActive;
  }

  // --- Real-Time Interactive Bass String Plucker ---

  public pluckNote(freq: number, velocity = 0.85, isSlap = false) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const pluckGain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq, now);

    // Pluck transient click
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * (isSlap ? 12 : 7), now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.45);

    const decay = isSlap ? 1.6 : 2.4;
    pluckGain.gain.setValueAtTime(velocity * 0.7, now);
    pluckGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(pluckGain);

    pluckGain.connect(this.inputGainNode);
    pluckGain.connect(this.inputAnalyser);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + decay);
    osc2.stop(now + decay);
    osc3.stop(now + decay);
  }

  // --- Real-time Metering ---

  public getMeterData(): MeterData {
    if (!this.ctx || !this.inputAnalyser || !this.outputAnalyser || !this.inputTimeData || !this.outputTimeData) {
      return {inputL: -60, inputR: -60, outputL: -60, outputR: -60, gainReduction: 0};
    }

    this.inputAnalyser.getFloatTimeDomainData(this.inputTimeData);
    this.outputAnalyser.getFloatTimeDomainData(this.outputTimeData);

    let inPeak = 0;
    for (let i = 0; i < this.inputTimeData.length; i++) {
      const abs = Math.abs(this.inputTimeData[i]);
      if (abs > inPeak) inPeak = abs;
    }

    let outPeak = 0;
    for (let i = 0; i < this.outputTimeData.length; i++) {
      const abs = Math.abs(this.outputTimeData[i]);
      if (abs > outPeak) outPeak = abs;
    }

    const inDb = inPeak > 0.0001 ? 20 * Math.log10(inPeak) : -60;
    const outDb = outPeak > 0.0001 ? 20 * Math.log10(outPeak) : -60;

    // Gain reduction from the active compressors
    let gr = 0;
    if (this.masterCompressor) {
      gr = this.masterCompressor.reduction; // negative dB
    }

    return {
      inputL: Math.max(-60, inDb),
      inputR: Math.max(-60, inDb),
      outputL: Math.max(-60, outDb),
      outputR: Math.max(-60, outDb),
      gainReduction: gr || 0,
    };
  }

  // --- Offline Rendering for Processed WAV Export ---

  public async exportProcessedWav(): Promise<Blob | null> {
    if (!this.currentBuffer) return null;

    const original = this.currentBuffer;
    const offlineCtx = new OfflineAudioContext(
      2,
      original.length,
      original.sampleRate
    );

    // Build the identical DSP chain in the offline context
    const offlineEngine = new AudioEngine();
    // Use offline context for graph
    (offlineEngine as unknown as {ctx: OfflineAudioContext}).ctx = offlineCtx;
    offlineEngine.init();
    offlineEngine.setParameters(this.params);

    const source = offlineCtx.createBufferSource();
    source.buffer = original;
    source.connect((offlineEngine as unknown as {inputGainNode: GainNode}).inputGainNode);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();

    // Convert AudioBuffer to WAV
    return audioBufferToWavBlob(renderedBuffer);
  }
}

// Global singleton instance
export const audioEngine = new AudioEngine();

// WAV Encoder helper
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const left = buffer.getChannelData(0);
  const right = numChannels > 1 ? buffer.getChannelData(1) : left;
  const numSamples = left.length;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, byteRate, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  // Write PCM samples (interleaved)
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Left
    const sL = Math.max(-1, Math.min(1, left[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
    offset += 2;

    // Right
    if (numChannels > 1) {
      const sR = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], {type: 'audio/wav'});
}
