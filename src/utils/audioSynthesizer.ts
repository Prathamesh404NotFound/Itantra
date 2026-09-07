// Tactical and radio tone synthesizer using standard browser Web Audio API
class AudioSynthesizerManager {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Tactical radio start click/chirp
  playChirp(isStart: boolean): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (isStart) {
        // Up-chirp: 800Hz -> 1250Hz
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1250, now + 0.07);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.085);
      } else {
        // Down-chirp: 1200Hz -> 650Hz + soft squelch
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.095);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Emergency SOS alert siren tone
  playEmergencySiren(): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // 3 rapid warning pulses
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startT = now + i * 0.18;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, startT);
        osc.frequency.exponentialRampToValueAtTime(440, startT + 0.14);

        gain.gain.setValueAtTime(0.12, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startT);
        osc.stop(startT + 0.16);
      }
    } catch {
      // Ignore audio error
    }
  }

  // Live microphone amplitude monitor for tactile PTT waveform
  async startMicrophoneMonitoring(onAmplitude: (amplitude: number) => void): Promise<() => void> {
    try {
      const ctx = this.getAudioContext();
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.micSource = ctx.createMediaStreamSource(this.mediaStream);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.5;
        this.micSource.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        let active = true;

        const checkAmplitude = () => {
          if (!active || !this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1.0, (avg / 128) * 1.5);
          onAmplitude(normalized);
          requestAnimationFrame(checkAmplitude);
        };

        requestAnimationFrame(checkAmplitude);

        return () => {
          active = false;
          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
          }
          if (this.micSource) {
            this.micSource.disconnect();
            this.micSource = null;
          }
          this.analyser = null;
          onAmplitude(0);
        };
      }
    } catch {
      // If mic permission denied or not supported, return no-op
    }
    return () => {};
  }
}

export const AudioSynthesizer = new AudioSynthesizerManager();
