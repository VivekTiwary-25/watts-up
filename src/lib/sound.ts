import { SOUND } from '../data/config';

let context: AudioContext | undefined;
let master: GainNode | undefined;
let fanGain: GainNode | undefined;
let noise: AudioBuffer | undefined;
let muted = false;

function ramp(param: AudioParam, value: number) {
  if (!context) return;
  param.cancelScheduledValues(context.currentTime);
  param.setTargetAtTime(value, context.currentTime, 0.04);
}

// Called only by the controller's user-gesture listeners.
export function unlockAudio() {
  if (!context) {
    if (typeof AudioContext === 'undefined') return;
    let created: AudioContext | undefined;
    try {
      created = new AudioContext();
      const gain = created.createGain();
      gain.gain.value = muted ? 0 : SOUND.masterVolume;
      gain.connect(created.destination);
      context = created;
      master = gain;
    } catch {
      void created?.close().catch(() => {});
      return;
    }
  }
  if (context.state === 'suspended') void context.resume().catch(() => {});
}

export function setMuted(value: boolean) {
  muted = value;
  if (master) ramp(master.gain, value ? 0 : SOUND.masterVolume);
}

function playTone(from: number, to: number, duration: number, volume: number) {
  if (!context || !master || muted) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(master);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  oscillator.start();
  oscillator.stop(now + duration);
}

function playNoise(duration: number, frequency: number, volume: number) {
  if (!context || !master || muted) return;
  if (!noise) {
    noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const now = context.currentTime;
  source.buffer = noise;
  filter.type = 'lowpass';
  filter.frequency.value = frequency;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(filter).connect(gain).connect(master);
  source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  source.start();
  source.stop(now + duration);
}

export function playClick(on: boolean) {
  if (!SOUND.click.enabled) return;
  playNoise(0.045, 850, SOUND.click.volume);
  playTone(on ? 540 : 360, on ? 320 : 210, 0.065, SOUND.click.volume * 0.5);
}

export function setFanHum(level: number) {
  if (!context || !master) return;
  const volume = SOUND.fan.enabled && Number.isFinite(level)
    ? Math.max(0, Math.min(1, level)) * SOUND.fan.volume : 0;
  if (!fanGain && volume > 0) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    fanGain = context.createGain();
    fanGain.gain.value = 0;
    oscillator.type = 'triangle';
    oscillator.frequency.value = 65;
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    oscillator.connect(filter).connect(fanGain).connect(master);
    oscillator.start();
  }
  if (fanGain) ramp(fanGain.gain, volume);
}

export function playThunder() {
  if (SOUND.thunder.enabled) playNoise(1.4, 160, SOUND.thunder.volume);
}

export function playPowerUp() {
  if (SOUND.powerUp.enabled) playTone(180, 640, 0.5, SOUND.powerUp.volume);
}
