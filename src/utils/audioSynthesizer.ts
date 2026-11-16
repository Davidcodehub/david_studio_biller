/**
 * Audio synthesis utility for reliable sound playback and master WAV generation.
 * Guarantees working sound even under strict sandboxes or offline states.
 */

// Generate a valid 24-bit PCM WAV blob for real client downloads
export function generateMasterWavBlob(title: string, durationSeconds = 5): Blob {
  const sampleRate = 48000;
  const numChannels = 2;
  const bytesPerSample = 3; // 24-bit = 3 bytes
  const totalSamples = sampleRate * durationSeconds;
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // File length - 8
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels (2)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
  view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
  view.setUint16(34, 24, true); // BitsPerSample (24-bit)

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate warm melodic test audio (stereo harmonic chord with subtle panning)
  let offset = 44;
  const f1 = 220.0; // A3
  const f2 = 277.18; // C#4
  const f3 = 329.63; // E4
  const f4 = 440.0; // A4

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Envelope: gentle fade-in and fade-out
    const env = Math.sin((Math.PI * i) / totalSamples);
    
    // Warm synthesizer harmonics
    const sampleL = (
      Math.sin(2 * Math.PI * f1 * t) * 0.4 +
      Math.sin(2 * Math.PI * f3 * t) * 0.3 +
      Math.sin(2 * Math.PI * f4 * t * 0.5) * 0.2
    ) * env * 0.7;

    const sampleR = (
      Math.sin(2 * Math.PI * f2 * t) * 0.4 +
      Math.sin(2 * Math.PI * f3 * t) * 0.3 +
      Math.sin(2 * Math.PI * f4 * t) * 0.2
    ) * env * 0.7;

    // Convert float to 24-bit integer (-8388608 to 8388607)
    const intSampleL = Math.max(-8388608, Math.min(8388607, Math.floor(sampleL * 8388607)));
    const intSampleR = Math.max(-8388608, Math.min(8388607, Math.floor(sampleR * 8388607)));

    // Write Left channel (3 bytes, little-endian)
    view.setUint8(offset, intSampleL & 0xFF);
    view.setUint8(offset + 1, (intSampleL >> 8) & 0xFF);
    view.setUint8(offset + 2, (intSampleL >> 16) & 0xFF);
    offset += 3;

    // Write Right channel (3 bytes, little-endian)
    view.setUint8(offset, intSampleR & 0xFF);
    view.setUint8(offset + 1, (intSampleR >> 8) & 0xFF);
    view.setUint8(offset + 2, (intSampleR >> 16) & 0xFF);
    offset += 3;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Fallback Web Audio Synthesizer for instant preview playback
class WebAudioFallbackEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: number | null = null;
  private startTime = 0;
  private pauseOffset = 0;
  public duration = 45; // 45 seconds loop preview

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play(onTick?: (currentTime: number) => void, onEnded?: () => void) {
    this.initCtx();
    if (!this.ctx) return;
    this.isPlaying = true;
    this.startTime = this.ctx.currentTime - this.pauseOffset;

    const playChordProgression = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const elapsed = now - this.startTime;

      if (elapsed >= this.duration) {
        this.pauseOffset = 0;
        this.isPlaying = false;
        if (onEnded) onEnded();
        return;
      }

      if (onTick) {
        onTick(Math.min(this.duration, elapsed));
      }

      // Schedule soft acoustic/rhodes notes
      const beat = Math.floor(elapsed * 2) % 8;
      const chords = [
        [220, 261.63, 329.63], // Am
        [174.61, 220, 261.63], // F
        [130.81, 164.81, 196.0], // C
        [196.0, 246.94, 293.66], // G
      ];
      const chordIndex = Math.floor((elapsed / 2) % 4);
      const notes = chords[chordIndex];

      if (beat % 2 === 0) {
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 1.0);
        });
      }

      this.timer = window.setTimeout(playChordProgression, 250);
    };

    playChordProgression();
  }

  public pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      this.pauseOffset = this.ctx.currentTime - this.startTime;
    }
  }

  public seek(seconds: number) {
    this.pauseOffset = Math.max(0, Math.min(seconds, this.duration));
    if (this.ctx) {
      this.startTime = this.ctx.currentTime - this.pauseOffset;
    }
  }

  public stop() {
    this.pause();
    this.pauseOffset = 0;
  }
}

export const fallbackAudioEngine = new WebAudioFallbackEngine();
