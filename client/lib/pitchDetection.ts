const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const A4_FREQUENCY = 440;
const A4_MIDI = 69;

const PIANO_LOW_FREQUENCY = 24;
const PIANO_HIGH_FREQUENCY = 4500;

export interface NoteInfo {
  noteName: string;
  octave: number;
  cents: number;
  frequency: number;
  isInTune: boolean;
}

export function frequencyToNote(frequency: number): NoteInfo | null {
  if (frequency < PIANO_LOW_FREQUENCY || frequency > PIANO_HIGH_FREQUENCY) {
    return null;
  }

  const midiNote = 12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI;
  const roundedMidi = Math.round(midiNote);
  const cents = Math.round((midiNote - roundedMidi) * 100);

  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;

  const noteName = NOTE_NAMES[noteIndex];

  return {
    noteName,
    octave,
    cents,
    frequency,
    isInTune: Math.abs(cents) <= 5,
  };
}

export function getAdjustedNote(frequency: number): NoteInfo | null {
  const baseNote = frequencyToNote(frequency);
  if (!baseNote) return null;

  if (baseNote.cents > 50) {
    const higherFreq = frequency * Math.pow(2, 1/12);
    const higherNote = frequencyToNote(higherFreq);
    if (higherNote) {
      return {
        ...higherNote,
        cents: baseNote.cents - 100,
        frequency,
        isInTune: Math.abs(baseNote.cents - 100) <= 5,
      };
    }
  } else if (baseNote.cents < -50) {
    const lowerFreq = frequency / Math.pow(2, 1/12);
    const lowerNote = frequencyToNote(lowerFreq);
    if (lowerNote) {
      return {
        ...lowerNote,
        cents: baseNote.cents + 100,
        frequency,
        isInTune: Math.abs(baseNote.cents + 100) <= 5,
      };
    }
  }

  return baseNote;
}

export function formatFrequency(frequency: number): string {
  if (frequency < 100) {
    return frequency.toFixed(1);
  }
  return Math.round(frequency).toString();
}

export function formatCents(cents: number): string {
  if (cents > 0) {
    return `+${cents}`;
  }
  return cents.toString();
}
