/**
 * Procedural Web Audio API synthesizer + optional live microphone ambient analyser
 * for Ecophonist. Zero external audio URLs; safe lifecycle management.
 */

import { SoundDiaryDef } from './types';

class AcousticSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private masterVolume: number = 0.42;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private diaryGain: GainNode | null = null;
  private diaryStopNodes: Array<{ stop: () => void }> = [];

  // Optional live microphone ambient level analyser
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micData: Uint8Array<ArrayBuffer> | null = null;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
        this.masterGain.connect(this.ctx.destination);
        this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      } catch {
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Autoplay restriction before gesture; safely ignored
      });
    }

    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopDiaryNarration();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.03
      );
    }
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.03);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public async enableMicAmbient(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    if (this.micAnalyser) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx && AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
        this.masterGain.connect(this.ctx.destination);
        this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      }
      if (!this.ctx) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.micStream = stream;
      this.micSource = this.ctx.createMediaStreamSource(stream);
      this.micAnalyser = this.ctx.createAnalyser();
      this.micAnalyser.fftSize = 128;
      this.micSource.connect(this.micAnalyser);
      this.micData = new Uint8Array(new ArrayBuffer(this.micAnalyser.frequencyBinCount));
      return true;
    } catch {
      return false;
    }
  }

  public disableMicAmbient(): void {
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {
        // ignore
      }
      this.micSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    this.micAnalyser = null;
    this.micData = null;
  }

  public getMicAmbientLevel(): number {
    if (!this.micAnalyser || !this.micData) return 0;
    this.micAnalyser.getByteFrequencyData(this.micData);
    let sum = 0;
    for (let i = 0; i < this.micData.length; i++) {
      sum += this.micData[i];
    }
    const avg = sum / (this.micData.length * 255);
    return Math.min(1, avg * 2.4);
  }

  public playFootstep(intensity: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(220 + intensity * 480, now);
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    const vol = Math.min(0.28, 0.04 + intensity * 0.2);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start(now, Math.random() * 0.6, 0.11);
  }

  public playStoneImpact(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(310, now + 0.11);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playLeafWhisper(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, 0, 0.72);
  }

  public playSilenceChant(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.99, now + 0.9);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.0);
    }
  }

  public playEnemySonar(type: 'stalker' | 'wraith' | 'goliath', alert: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'stalker') {
      osc.type = alert ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(alert ? 880 : 620, now);
      osc.frequency.exponentialRampToValueAtTime(alert ? 440 : 280, now + 0.12);
      gain.gain.setValueAtTime(alert ? 0.14 : 0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    } else if (type === 'wraith') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(alert ? 1140 : 720, now);
      osc.frequency.linearRampToValueAtTime(alert ? 1480 : 690, now + 0.28);
      gain.gain.setValueAtTime(alert ? 0.18 : 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(alert ? 130 : 95, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.25);
      gain.gain.setValueAtTime(alert ? 0.26 : 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playBirdFlock(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600 + i * 240, t);
      osc.frequency.exponentialRampToValueAtTime(2400 + i * 180, t + 0.05);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  public playThunder(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(75, now + 1.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, 0, 1.25);
  }

  public playBreathGasp(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(950, now + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, 0.2, 0.25);
  }

  public playCrystalPickup(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const notes = [587.33, 880, 1174.66];
    notes.forEach((f, idx) => {
      const t = now + idx * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playHurt(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const chord = [440, 554.37, 659.25, 880];
    chord.forEach((f, idx) => {
      const t = now + idx * 0.08;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  public playHeartbeat(stress: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const clampedStress = Math.max(0, Math.min(1, stress));
    const vol = 0.04 + clampedStress * 0.13;
    const now = ctx.currentTime;

    // Lub + Dub cardiac double thump
    const beats = [
      { offset: 0, startFreq: 68, endFreq: 36, gain: vol, dur: 0.11 },
      { offset: 0.15, startFreq: 58, endFreq: 32, gain: vol * 0.68, dur: 0.09 },
    ];

    for (const b of beats) {
      const t = now + b.offset;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(b.startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(b.endFreq, t + b.dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(b.gain, t + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + b.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + b.dur + 0.02);
    }
  }

  public playWindGust(intensity: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const clamped = Math.max(0.2, Math.min(1, intensity));
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(240 + clamped * 220, now);
    filter.frequency.linearRampToValueAtTime(480 + clamped * 340, now + 0.55);
    filter.frequency.exponentialRampToValueAtTime(190, now + 1.35);
    filter.Q.value = 1.1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045 + clamped * 0.085, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, Math.random() * 0.2, 1.45);
  }

  public stopDiaryNarration(): void {
    for (const node of this.diaryStopNodes) {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    }
    this.diaryStopNodes = [];
    if (this.diaryGain && this.ctx) {
      try {
        this.diaryGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.diaryGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore speech synthesis restrictions
      }
    }
  }

  public playDiaryNarrationAudio(diary: SoundDiaryDef): void {
    this.stopDiaryNarration();

    // 1. Optional Portuguese voice narration via Web Speech API
    if (!this.muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(diary.transcript);
        const voices = window.speechSynthesis.getVoices();
        const ptVoice =
          voices.find((v) => v.lang.toLowerCase().startsWith('pt-ao')) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('pt-pt')) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
        if (ptVoice) {
          utterance.voice = ptVoice;
        }
        utterance.lang = ptVoice?.lang || 'pt-PT';
        utterance.rate = 0.96;
        utterance.pitch = 0.94;
        utterance.volume = Math.max(0.15, Math.min(1, this.masterVolume * 1.35));
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis unavailable or blocked; Web Audio bed still plays cleanly
      }
    }

    // 2. Procedural environmental soundbed & Kissange acoustic tape signature
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const dur = Math.max(6, Math.min(11, diary.durationSec));
    const bedGain = ctx.createGain();
    bedGain.gain.setValueAtTime(0.001, now);
    bedGain.gain.linearRampToValueAtTime(0.18, now + 0.35);
    bedGain.gain.setValueAtTime(0.16, now + dur - 1.2);
    bedGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    bedGain.connect(this.masterGain);
    this.diaryGain = bedGain;

    // Tape recorder activation click
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1400, now);
    clickOsc.frequency.exponentialRampToValueAtTime(220, now + 0.035);
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.09, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    clickOsc.connect(clickGain);
    clickGain.connect(bedGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);
    this.diaryStopNodes.push(clickOsc);

    // Warm resonant drone pad
    const padFreq =
      diary.ambientTone === 'palanca_eco'
        ? 146.83
        : diary.ambientTone === 'trovao_huila'
          ? 110
          : diary.ambientTone === 'vento_luanda'
            ? 130.81
            : 164.81;
    const padOsc = ctx.createOscillator();
    padOsc.type = 'sine';
    padOsc.frequency.setValueAtTime(padFreq, now);
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.22, now);
    padOsc.connect(padGain);
    padGain.connect(bedGain);
    padOsc.start(now);
    padOsc.stop(now + dur);
    this.diaryStopNodes.push(padOsc);

    // Kissange / Mbira plucked pentatonic motif
    const scale =
      diary.ambientTone === 'palanca_eco'
        ? [293.66, 349.23, 440, 523.25, 659.25]
        : diary.ambientTone === 'trovao_huila'
          ? [220, 261.63, 329.63, 392, 440]
          : [329.63, 392, 440, 523.25, 659.25];

    const noteCount = 8;
    for (let i = 0; i < noteCount; i++) {
      const t = now + 0.28 + i * 0.92;
      if (t >= now + dur - 0.5) break;
      const freq = scale[(i * 2 + diary.order) % scale.length];
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.001, t);
      nGain.gain.linearRampToValueAtTime(0.26, t + 0.015);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.72);

      osc.connect(nGain);
      nGain.connect(bedGain);
      osc.start(t);
      osc.stop(t + 0.76);
      this.diaryStopNodes.push(osc);
    }

    // Subtle wind/rain noise atmosphere underneath
    if (this.noiseBuffer) {
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;
      noiseSrc.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(
        diary.ambientTone === 'vento_luanda' ? 420 : 280,
        now
      );
      filter.Q.value = 0.85;

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.14, now);
      noiseSrc.connect(filter);
      filter.connect(nGain);
      nGain.connect(bedGain);
      noiseSrc.start(now);
      noiseSrc.stop(now + dur);
      this.diaryStopNodes.push(noiseSrc);
    }
  }

  public playCameraShutter(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    // Crisp mechanical shutter click
    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2400, now);
      bp.Q.value = 1.6;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.28, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      src.connect(bp);
      bp.connect(g);
      g.connect(this.masterGain);
      src.start(now);
      src.stop(now + 0.08);
    }

    // Subtle sonar lock chime
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now + 0.03);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.14);

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.001, now + 0.03);
    toneGain.gain.linearRampToValueAtTime(0.11, now + 0.05);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc.connect(toneGain);
    toneGain.connect(this.masterGain);
    osc.start(now + 0.03);
    osc.stop(now + 0.26);
  }

  public playLevelTuningChord(levelId: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const freqs =
      levelId === 1
        ? [261.63, 329.63, 392.0]
        : levelId === 2
          ? [293.66, 369.99, 440.0]
          : [220.0, 277.18, 329.63, 440.0];

    freqs.forEach((f, idx) => {
      const t = now + idx * 0.09;
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, t);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.11, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);

      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 1.2);
    });
  }
}

export const soundEngine = new AcousticSoundEngine();
