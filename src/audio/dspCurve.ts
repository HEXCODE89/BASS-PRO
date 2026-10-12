/**
 * WaveShaper Transfer Curves for Sonic Anomaly "Dirt" Module
 * Tailored specifically for bass guitar:
 * Adds asymmetric harmonic excitement and soft tube-style clipping
 * without crumbling the fundamental sub-bass.
 */

export function createDirtCurve(amount: number, tone: number, samples = 2048): Float32Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(samples * 4);
  const curve = new Float32Array(buffer);
  const k = Math.max(0.1, (amount / 100) * 14); // Drive coefficient 0.1 to 14
  const asym = 0.15 * (tone / 100); // 2nd harmonic asymmetry factor

  for (let i = 0; i < samples; i++) {
    // x in [-1, 1]
    const x = (i * 2) / samples - 1;

    if (amount <= 0.01) {
      curve[i] = x;
      continue;
    }

    // Soft saturation with asymmetric polynomial warmth
    // tanh provides smooth tape/tube saturation, polynomial adds even harmonics
    const driven = x * (1 + k);
    let y = Math.tanh(driven);

    // Asymmetric offset for tube warmth (2nd harmonic)
    if (driven > 0) {
      y += asym * Math.sin(driven * Math.PI * 0.5) * 0.3;
    } else {
      y -= asym * 0.15 * driven * driven;
    }

    // Normalize peak to stay within [-1, 1]
    curve[i] = Math.max(-1, Math.min(1, y * 0.95));
  }

  return curve;
}

export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

export function gainToDb(gain: number): number {
  if (gain <= 0.00001) return -100;
  return 20 * Math.log10(gain);
}
