/**
 * Web Audio API Emergency Alert Synthesizer for SafeCircle AI
 * Synthesizes an oscillating dual-tone emergency beacon locally in the browser
 * without relying on external MP3 or WAV assets.
 */

class EmergencyAudioEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private intervalId: any = null;
  private isMuted: boolean = false;

  private initContext(): AudioContext | null {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      return this.audioCtx;
    } catch (err) {
      console.warn('[SafeCircle] Web Audio initialization warning:', err);
      return null;
    }
  }

  /**
   * Plays a single short beep (useful for countdown ticks).
   */
  public playCountdownTick(frequency: number = 660, durationMs: number = 100): void {
    if (this.isMuted) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // ignore audio context restrictions
    }
  }

  /**
   * Plays an attention-grabbing dual warning beep for overdue check-ins.
   */
  public playWarningBeep(): void {
    if (this.isMuted) return;
    this.playCountdownTick(880, 180);
    setTimeout(() => {
      this.playCountdownTick(880, 180);
    }, 220);
  }

  /**
   * Starts a repeating dual-tone emergency beacon alarm (880Hz / 660Hz).
   */
  public startEmergencyAlarm(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const playDualTonePulse = () => {
      if (!this.isPlaying || this.isMuted) return;

      try {
        const ctx = this.initContext();
        if (!ctx) return;

        // High tone pulse (880Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);

        gain1.gain.setValueAtTime(0.2, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.18);

        // Low tone pulse (660Hz) following after 200ms
        setTimeout(() => {
          if (!this.isPlaying || this.isMuted || !this.audioCtx) return;
          try {
            const osc2 = this.audioCtx.createOscillator();
            const gain2 = this.audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(660, this.audioCtx.currentTime);

            gain2.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.18);

            osc2.connect(gain2);
            gain2.connect(this.audioCtx.destination);
            osc2.start();
            osc2.stop(this.audioCtx.currentTime + 0.18);
          } catch {
            // ignore
          }
        }, 200);
      } catch {
        // ignore audio context restrictions
      }
    };

    // Play immediately and repeat every 750ms
    playDualTonePulse();
    this.intervalId = setInterval(playDualTonePulse, 750);
  }

  /**
   * Stops the active emergency alarm sound.
   */
  public stopEmergencyAlarm(): void {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Toggles audio mute state.
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.isPlaying) {
      // Sound continues in background logic, but silence is produced
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const audioAlertEngine = new EmergencyAudioEngine();
