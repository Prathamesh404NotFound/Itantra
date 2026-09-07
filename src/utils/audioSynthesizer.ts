// Tactical and radio tone synthesizer using standard browser Web Audio API
class AudioSynthesizerManager {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private activeAudioElement: HTMLAudioElement | null = null;

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

  /**
   * Generates a tactical radio PTT start or end chirp using Web Audio oscillators.
   *
   * @param isStart - True for upward initiating PTT chirp, false for downward squelch chirp
   */
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

  /**
   * Generates a 3-pulse emergency tactical alert siren.
   */
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

  /**
   * Initializes microphone capture, amplitude monitoring for real-time waveform display,
   * and MediaRecorder audio chunk streaming.
   *
   * @param onAmplitude - Callback receiving normalized 0.0 - 1.0 volume amplitude
   * @param onError - Optional callback triggered when microphone acquisition fails (e.g. permission denied)
   * @returns Cleanup teardown function to close stream tracks and recorder
   */
  async startMicrophoneMonitoring(
    onAmplitude: (amplitude: number) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    try {
      const ctx = this.getAudioContext();
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // Initialize MediaRecorder for real-voice capture
        this.recordedChunks = [];
        try {
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : '';
          this.mediaRecorder = mimeType
            ? new MediaRecorder(this.mediaStream, { mimeType })
            : new MediaRecorder(this.mediaStream);

          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              this.recordedChunks.push(event.data);
            }
          };
          this.mediaRecorder.start(100); // chunk every 100ms
        } catch (recorderErr) {
          console.warn('MediaRecorder init warning:', recorderErr);
        }

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
          if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            try {
              this.mediaRecorder.stop();
            } catch {
              // Ignore
            }
          }
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
    } catch (err) {
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
    return () => {};
  }

  /**
   * Retrieves the packaged audio Blob and object URL from the most recent recording session.
   *
   * @returns Object with blob, object URL, and byte size, or null if no chunks captured
   */
  async getRecordedAudioBlob(): Promise<{ blob: Blob; url: string; sizeBytes: number } | null> {
    // Wait briefly for final dataavailable event
    await new Promise((resolve) => setTimeout(resolve, 80));

    if (this.recordedChunks.length === 0) {
      return null;
    }

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const sizeBytes = blob.size;
    this.recordedChunks = [];

    return { blob, url, sizeBytes };
  }

  /**
   * Plays a recorded voice audio blob URL through an HTML Audio element.
   *
   * @param blobUrl - Blob URL to play
   * @param onEnd - Completion callback
   */
  playAudioBlob(blobUrl: string, onEnd?: () => void): void {
    try {
      if (this.activeAudioElement) {
        this.activeAudioElement.pause();
        this.activeAudioElement = null;
      }
      const audio = new Audio(blobUrl);
      this.activeAudioElement = audio;
      audio.onended = () => {
        this.activeAudioElement = null;
        if (onEnd) onEnd();
      };
      audio.onerror = () => {
        this.activeAudioElement = null;
        if (onEnd) onEnd();
      };
      audio.play().catch(() => {
        if (onEnd) onEnd();
      });
    } catch {
      if (onEnd) onEnd();
    }
  }

  /**
   * Halts any actively playing audio elements.
   */
  stopAllPlayback(): void {
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
      } catch {
        // Ignore
      }
      this.activeAudioElement = null;
    }
  }
}

export const AudioSynthesizer = new AudioSynthesizerManager();
