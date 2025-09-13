class AudioManager {
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<string, AudioBuffer> = new Map();
  private isMuted: boolean = false;

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async generateTone(frequency: number, duration: number, type: OscillatorType = 'square'): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * time) > 0 ? 0.3 : -0.3;
          break;
        case 'sine':
          sample = 0.3 * Math.sin(2 * Math.PI * frequency * time);
          break;
        case 'sawtooth':
          sample = 0.3 * (2 * (frequency * time - Math.floor(frequency * time + 0.5)));
          break;
      }

      // Apply envelope for smoother sound
      const envelope = Math.exp(-time * 3);
      channelData[i] = sample * envelope;
    }

    return buffer;
  }

  async initialize() {
    if (!this.audioContext) return;

    try {
      // Generate sound effects
      const jumpSound = await this.generateTone(800, 0.1, 'square');
      const hitSound = await this.generateTone(150, 0.2, 'sawtooth');
      const scoreSound = await this.generateTone(1200, 0.05, 'sine');

      this.soundBuffers.set('jump', jumpSound);
      this.soundBuffers.set('hit', hitSound);
      this.soundBuffers.set('score', scoreSound);
    } catch (error) {
      console.warn('Could not generate audio:', error);
    }
  }

  playSound(soundName: string, volume: number = 1.0) {
    if (this.isMuted || !this.audioContext || !this.soundBuffers.has(soundName)) {
      return;
    }

    try {
      const buffer = this.soundBuffers.get(soundName)!;
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  isMutedState(): boolean {
    return this.isMuted;
  }

  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Could not resume audio context:', error);
      }
    }
  }
}

export const audioManager = new AudioManager();