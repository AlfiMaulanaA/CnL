/**
 * Synthesised sound effects & background music via WebAudio — no binary
 * assets to ship. Nothing plays until the user interacts with the page
 * (browser autoplay policy).
 *
 * Every call is defensive: no AudioContext, a suspended context, or an
 * exception in the graph must never break a move.
 */

export type SoundName =
  | 'click'
  | 'roll'
  | 'hop'
  | 'ladder'
  | 'chute'
  | 'turn'
  | 'win'
  | 'emote'
  | 'join'
  | 'start'
  | 'error';

export type SoundConfig = {
  enabled: boolean;
  music: boolean;
  /** 0..1 */
  volume: number;
};

let context: AudioContext | null = null;
let config: SoundConfig = { enabled: true, music: false, volume: 0.7 };
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicStep = 0;
let unlockAttached = false;

export function setSoundConfig(next: Partial<SoundConfig>): void {
  config = { ...config, ...next };
  config.volume = Math.min(1, Math.max(0, config.volume));
  if (!config.music) stopMusic();
  else if (context) startMusic();
}

export function getSoundConfig(): SoundConfig {
  return { ...config };
}

/** Attach one-time gesture listeners that unlock (and possibly start) audio. */
export function attachAudioUnlock(): void {
  if (typeof window === 'undefined' || unlockAttached) return;
  unlockAttached = true;
  const handler = () => {
    ensureContext();
    if (config.music) startMusic();
  };
  window.addEventListener('pointerdown', handler, { passive: true });
  window.addEventListener('keydown', handler);
}

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      context = new Ctor();
    } catch {
      return null;
    }
  }
  if (context.state === 'suspended') {
    context.resume().catch(() => undefined);
  }
  return context;
}

type ToneOptions = {
  freq: number;
  /** seconds */
  dur: number;
  vol?: number;
  type?: OscillatorType;
  /** seconds delay from now */
  at?: number;
  /** slide to this frequency by the end of the note */
  slideTo?: number;
};

function tone({ freq, dur, vol = 0.5, type = 'sine', at = 0, slideTo }: ToneOptions): void {
  if (!config.enabled || config.volume <= 0) return;
  const ctx = ensureContext();
  if (!ctx) return;
  try {
    const start = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), start + dur);
    const peak = Math.max(0.0001, vol * config.volume * 0.35);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    /* never break the game over audio */
  }
}

export function playSound(name: SoundName): void {
  if (!config.enabled || config.volume <= 0) return;
  switch (name) {
    case 'click':
      tone({ freq: 440, dur: 0.06, vol: 0.4, type: 'square' });
      break;
    case 'roll':
      tone({ freq: 640, dur: 0.07, vol: 0.5, type: 'square' });
      tone({ freq: 520, dur: 0.07, vol: 0.5, type: 'square', at: 0.07 });
      tone({ freq: 430, dur: 0.09, vol: 0.5, type: 'square', at: 0.14 });
      break;
    case 'hop':
      tone({ freq: 700, dur: 0.05, vol: 0.35, type: 'sine' });
      break;
    case 'ladder':
      tone({ freq: 523, dur: 0.1, vol: 0.5 });
      tone({ freq: 659, dur: 0.1, vol: 0.5, at: 0.09 });
      tone({ freq: 784, dur: 0.16, vol: 0.55, at: 0.18 });
      break;
    case 'chute':
      tone({ freq: 600, dur: 0.45, vol: 0.5, type: 'sawtooth', slideTo: 160 });
      break;
    case 'turn':
      tone({ freq: 880, dur: 0.12, vol: 0.4 });
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) =>
        tone({ freq: f, dur: i === 3 ? 0.4 : 0.14, vol: 0.55, at: i * 0.13 })
      );
      break;
    case 'emote':
      tone({ freq: 900, dur: 0.12, vol: 0.4, type: 'triangle', slideTo: 1400 });
      break;
    case 'join':
      tone({ freq: 392, dur: 0.1, vol: 0.45 });
      tone({ freq: 523, dur: 0.14, vol: 0.45, at: 0.1 });
      break;
    case 'start':
      tone({ freq: 523, dur: 0.1, vol: 0.5 });
      tone({ freq: 659, dur: 0.1, vol: 0.5, at: 0.1 });
      tone({ freq: 880, dur: 0.2, vol: 0.55, at: 0.2 });
      break;
    case 'error':
      tone({ freq: 180, dur: 0.22, vol: 0.45, type: 'square' });
      break;
  }
}

// ---------------------------------------------------------------------------
// Background music — a light, original 8-note loop.
// ---------------------------------------------------------------------------

const MELODY: Array<number | null> = [523, null, 659, 523, 587, null, 659, 784];
const BASS: Array<number | null> = [131, null, 147, null, 165, null, 147, null];

export function startMusic(): void {
  if (typeof window === 'undefined' || !config.music || musicTimer) return;
  const ctx = ensureContext();
  if (!ctx) return;
  musicTimer = setInterval(() => {
    const step = musicStep % MELODY.length;
    const note = MELODY[step];
    const bass = BASS[step];
    if (note) tone({ freq: note, dur: 0.42, vol: 0.22, type: 'triangle' });
    if (bass) tone({ freq: bass, dur: 0.5, vol: 0.18, type: 'sine' });
    musicStep += 1;
  }, 500);
}

export function stopMusic(): void {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
