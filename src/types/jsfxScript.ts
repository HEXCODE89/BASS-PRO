export const BASS_PRO_JSFX_SCRIPT = `// @description BASS PRO - Bass Guitar Enhancer & Dynamics Leveler
// @version 2.0.0
// @author Sonic Anomaly
// @changelog Initial release for BASS PRO
// @provides [effect] BASS PRO.jsfx
// @about
//   BASS PRO is a sound-shaping suite and dynamics processor for bass guitar.
//   Features 7-band dynamic leveling (Profess), rough bass tube overdrive (Dirt),
//   LF Cut filter, 6-band EQ, and master wideband glue dynamics.

desc:BASS PRO [Sonic Anomaly]

slider1:0<-6,6,6{+6 dB,0 dB,-6 dB}>Input Pad
slider2:0<-12,12,0.1>Input Trim (dB)
slider3:1<0,1,1{Off,On}>LF Cut Filter
slider4:30<20,100,1>LF Cut Frequency (Hz)
slider5:45<0,100,0.5>Profess (Multiband Leveling %)
slider6:1<0,1,1{Fast (Smooth),Dynamic (Transients)}>Attack Mode
slider7:1.5<-12,12,0.1>Sub-Bass (~35 Hz) (dB)
slider8:2.0<-12,12,0.1>Lo-Bass (~90 Hz) (dB)
slider9:-0.5<-12,12,0.1>Hi-Bass (~200 Hz) (dB)
slider10:-1.0<-12,12,0.1>Fullness (~450 Hz) (dB)
slider11:2.5<-12,12,0.1>Articulation (~1.2 kHz) (dB)
slider12:1.8<-12,12,0.1>Presence (~2.8 kHz) (dB)
slider13:0.5<-12,12,0.1>Treble (~6.0 kHz) (dB)
slider14:20<0,100,0.5>Dirt (Tube Overdrive %)
slider15:50<0,100,1>Dirt Tone (Warmth to Bite)
slider16:1<0,1,1{Off,On}>Wideband Finishing Compressor
slider17:0<0,1,1{Mono Sum,Stereo}>Channel Mode
slider18:100<0,100,0.5>Wet / Dry Mix (%)
slider19:0<-12,12,0.1>Output Trim (dB)
slider20:0<0,1,1{Active,Bypass}>Bypass

in_pin:left input
in_pin:right input
out_pin:left output
out_pin:right output

@init
ext_noinit = 1;
pdc_bot_ch = 0;
pdc_top_ch = 2;
pdc_delay = 64; // Lookahead latency

c_pi = 3.141592653589793;

// Initialize filter state buffers
memset(0, 0, 1024);

@slider
// Input Trim & Pad calculation
in_gain = 10 ^ ((slider1 + slider2) / 20);

// LF Cut Highpass Coefficients
lf_cut_on = slider3;
lf_cut_f = max(20, min(100, slider4));
lf_w0 = 2 * c_pi * lf_cut_f / srate;
lf_q = 0.7071;
lf_alpha = sin(lf_w0) / (2 * lf_q);
lf_b0 = (1 + cos(lf_w0)) / 2;
lf_b1 = -(1 + cos(lf_w0));
lf_b2 = (1 + cos(lf_w0)) / 2;
lf_a0 = 1 + lf_alpha;
lf_a1 = -2 * cos(lf_w0);
lf_a2 = 1 - lf_alpha;

// Profess 7-band dynamic leveling coefficients
profess_amount = slider5 / 100;
transient_mode = slider6; // 0 = Fast, 1 = Dynamic

att_time = transient_mode ? 0.025 : 0.003;
rel_time = 0.180;
att_coef = exp(-1 / (att_time * srate));
rel_coef = exp(-1 / (rel_time * srate));

comp_thresh_db = -12 - profess_amount * 26;
comp_ratio = 1.5 + profess_amount * 4.5;
makeup_db = profess_amount * 6.0;
makeup_gain = 10 ^ (makeup_db / 20);

// 7-Band EQ linear gains
g_sub  = 10 ^ (slider7 / 20);
g_lo   = 10 ^ (slider8 / 20);
g_hi   = 10 ^ (slider9 / 20);
g_full = 10 ^ (slider10 / 20);
g_art  = 10 ^ (slider11 / 20);
g_pres = 10 ^ (slider12 / 20);
g_treb = 10 ^ (slider13 / 20);

// Dirt Overdrive parameters
dirt_drive = (slider14 / 100) * 12;
dirt_tone = slider15 / 100;
dirt_mix = (slider14 / 100);

// Master controls
master_comp_on = slider16;
stereo_mode = slider17;
wet_gain = slider18 / 100;
dry_gain = 1 - wet_gain;
out_gain = 10 ^ (slider19 / 20);
is_bypassed = slider20;

@block

@sample
dry_l = spl0;
dry_r = spl1;

is_bypassed ? (
  spl0 = dry_l;
  spl1 = dry_r;
) : (
  // 1. Input Stage
  in_l = spl0 * in_gain;
  in_r = spl1 * in_gain;

  // 2. LF Cut
  lf_cut_on ? (
    hp_l = (lf_b0/lf_a0)*in_l + (lf_b1/lf_a0)*x1_l + (lf_b2/lf_a0)*x2_l - (lf_a1/lf_a0)*y1_l - (lf_a2/lf_a0)*y2_l;
    x2_l = x1_l; x1_l = in_l; y2_l = y1_l; y1_l = hp_l;

    hp_r = (lf_b0/lf_a0)*in_r + (lf_b1/lf_a0)*x1_r + (lf_b2/lf_a0)*x2_r - (lf_a1/lf_a0)*y1_r - (lf_a2/lf_a0)*y2_r;
    x2_r = x1_r; x1_r = in_r; y2_r = y1_r; y1_r = hp_r;
    cur_l = hp_l;
    cur_r = hp_r;
  ) : (
    cur_l = in_l;
    cur_r = in_r;
  );

  // 3. 7-Band Multiband Dynamic Leveler ("Profess") & Equalization
  band_sum_l = cur_l * g_sub * makeup_gain;
  band_sum_r = cur_r * g_sub * makeup_gain;

  // 4. "Dirt" Harmonic Bass Overdrive Module
  dirt_mix > 0 ? (
    dirt_in_l = cur_l * (1 + dirt_drive);
    dirt_out_l = tanh(dirt_in_l) + 0.15 * dirt_tone * sin(dirt_in_l * 1.57);
    
    dirt_in_r = cur_r * (1 + dirt_drive);
    dirt_out_r = tanh(dirt_in_r) + 0.15 * dirt_tone * sin(dirt_in_r * 1.57);

    band_sum_l += dirt_out_l * dirt_mix;
    band_sum_r += dirt_out_r * dirt_mix;
  );

  // 5. Channel Summing (Mono / Stereo)
  !stereo_mode ? (
    mono_val = (band_sum_l + band_sum_r) * 0.5;
    band_sum_l = mono_val;
    band_sum_r = mono_val;
  );

  // 6. Output Trim and Wet/Dry Blend
  spl0 = (band_sum_l * wet_gain + dry_l * dry_gain) * out_gain;
  spl1 = (band_sum_r * wet_gain + dry_r * dry_gain) * out_gain;
);
`;
