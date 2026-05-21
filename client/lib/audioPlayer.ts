const NOTE_FREQUENCIES: { [key: string]: number } = {};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

for (let octave = 0; octave <= 8; octave++) {
  for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
    if (octave === 0 && noteIndex < 9) continue;
    if (octave === 8 && noteIndex > 0) continue;
    
    const note = NOTE_NAMES[noteIndex];
    const midiNumber = (octave + 1) * 12 + noteIndex;
    const frequency = 440 * Math.pow(2, (midiNumber - 69) / 12);
    NOTE_FREQUENCIES[`${note}${octave}`] = frequency;
  }
}

let audioContext: AudioContext | null = null;
let activeOscillator: OscillatorNode | null = null;
let activeGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }
  return audioContext;
}

export function playNote(noteName: string, octave: number, duration: number = 2): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopNote();

  const key = `${noteName}${octave}`;
  const frequency = NOTE_FREQUENCIES[key];
  if (!frequency) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  const harmonics = ctx.createOscillator();
  harmonics.type = "sine";
  harmonics.frequency.setValueAtTime(frequency * 2, ctx.currentTime);
  const harmonicsGain = ctx.createGain();
  harmonicsGain.gain.setValueAtTime(0.3, ctx.currentTime);

  const harmonics2 = ctx.createOscillator();
  harmonics2.type = "sine";
  harmonics2.frequency.setValueAtTime(frequency * 3, ctx.currentTime);
  const harmonics2Gain = ctx.createGain();
  harmonics2Gain.gain.setValueAtTime(0.1, ctx.currentTime);

  gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  harmonics.connect(harmonicsGain);
  harmonicsGain.connect(gainNode);
  harmonics2.connect(harmonics2Gain);
  harmonics2Gain.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  harmonics.start(ctx.currentTime);
  harmonics2.start(ctx.currentTime);
  
  oscillator.stop(ctx.currentTime + duration);
  harmonics.stop(ctx.currentTime + duration);
  harmonics2.stop(ctx.currentTime + duration);

  activeOscillator = oscillator;
  activeGain = gainNode;

  oscillator.onended = () => {
    if (activeOscillator === oscillator) {
      activeOscillator = null;
      activeGain = null;
    }
  };
}

export function stopNote(): void {
  if (activeGain && audioContext) {
    try {
      activeGain.gain.cancelScheduledValues(audioContext.currentTime);
      activeGain.gain.setValueAtTime(activeGain.gain.value, audioContext.currentTime);
      activeGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
  activeOscillator = null;
  activeGain = null;
}

export function getNoteFrequency(noteName: string, octave: number): number {
  const key = `${noteName}${octave}`;
  return NOTE_FREQUENCIES[key] || 440;
}
