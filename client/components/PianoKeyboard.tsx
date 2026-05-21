import React, { useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, Text, Pressable, Dimensions } from "react-native";
import { TunerColors, Spacing } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const WHITE_KEY_WIDTH = 32;
const WHITE_KEY_HEIGHT = 120;
const BLACK_KEY_WIDTH = 22;
const BLACK_KEY_HEIGHT = 72;

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const WHITE_NOTES = ["C", "D", "E", "F", "G", "A", "B"];

interface KeyData {
  note: string;
  octave: number;
  isBlack: boolean;
  position: number;
}

function generatePianoKeys(): KeyData[] {
  const keys: KeyData[] = [];
  let whiteKeyIndex = 0;

  for (let octave = 0; octave <= 8; octave++) {
    for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
      if (octave === 0 && noteIndex < 9) continue;
      if (octave === 8 && noteIndex > 0) continue;

      const note = NOTE_NAMES[noteIndex];
      const isBlack = note.includes("#");

      if (!isBlack) {
        keys.push({
          note,
          octave,
          isBlack: false,
          position: whiteKeyIndex,
        });
        whiteKeyIndex++;
      } else {
        keys.push({
          note,
          octave,
          isBlack: true,
          position: whiteKeyIndex - 1,
        });
      }
    }
  }

  return keys;
}

const PIANO_KEYS = generatePianoKeys();
const WHITE_KEYS = PIANO_KEYS.filter(k => !k.isBlack);
const BLACK_KEYS = PIANO_KEYS.filter(k => k.isBlack);
const TOTAL_WHITE_KEYS = WHITE_KEYS.length;
const KEYBOARD_WIDTH = TOTAL_WHITE_KEYS * WHITE_KEY_WIDTH;

interface PianoKeyboardProps {
  activeNote: string | null;
  activeOctave: number | null;
  targetNote: string | null;
  targetOctave: number | null;
  onKeyPress?: (note: string, octave: number) => void;
}

function WhiteKey({ 
  keyData, 
  isActive, 
  isTarget,
  onPress 
}: { 
  keyData: KeyData; 
  isActive: boolean;
  isTarget: boolean;
  onPress: () => void;
}) {
  const showLabel = isActive || isTarget;
  
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.whiteKey,
        isTarget && styles.whiteKeyTarget,
        isActive && styles.whiteKeyActive,
        { left: keyData.position * WHITE_KEY_WIDTH },
      ]}
    >
      {showLabel ? (
        <Text style={styles.whiteKeyLabel}>{keyData.note}{keyData.octave}</Text>
      ) : null}
    </Pressable>
  );
}

function BlackKey({ 
  keyData, 
  isActive, 
  isTarget,
  onPress 
}: { 
  keyData: KeyData; 
  isActive: boolean;
  isTarget: boolean;
  onPress: () => void;
}) {
  const leftOffset = (keyData.position + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;
  const showLabel = isActive || isTarget;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.blackKey,
        isTarget && styles.blackKeyTarget,
        isActive && styles.blackKeyActive,
        { left: leftOffset },
      ]}
    >
      {showLabel ? (
        <Text style={styles.blackKeyLabel}>{keyData.note.replace("#", "")}{keyData.octave}</Text>
      ) : null}
    </Pressable>
  );
}

export function PianoKeyboard({ 
  activeNote, 
  activeOctave, 
  targetNote,
  targetOctave,
  onKeyPress 
}: PianoKeyboardProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  const isKeyActive = (keyData: KeyData) => {
    if (!activeNote || activeOctave === null) return false;
    return keyData.note === activeNote && keyData.octave === activeOctave;
  };

  const isKeyTarget = (keyData: KeyData) => {
    if (!targetNote || targetOctave === null) return false;
    return keyData.note === targetNote && keyData.octave === targetOctave;
  };

  const handleKeyPress = (keyData: KeyData) => {
    if (onKeyPress) {
      onKeyPress(keyData.note, keyData.octave);
    }
  };

  useEffect(() => {
    const noteToCenter = targetNote || activeNote;
    const octaveToCenter = targetNote ? targetOctave : activeOctave;

    if (noteToCenter && octaveToCenter !== null && scrollViewRef.current) {
      const keyToFind = noteToCenter.includes("#") 
        ? BLACK_KEYS.find(k => k.note === noteToCenter && k.octave === octaveToCenter)
        : WHITE_KEYS.find(k => k.note === noteToCenter && k.octave === octaveToCenter);

      if (keyToFind) {
        const scrollX = keyToFind.position * WHITE_KEY_WIDTH - SCREEN_WIDTH / 2 + WHITE_KEY_WIDTH;
        scrollViewRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
      }
    }
  }, [targetNote, targetOctave, activeNote, activeOctave]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.keyboard, { width: KEYBOARD_WIDTH }]}>
          {WHITE_KEYS.map((keyData, index) => (
            <WhiteKey
              key={`white-${index}`}
              keyData={keyData}
              isActive={isKeyActive(keyData)}
              isTarget={isKeyTarget(keyData)}
              onPress={() => handleKeyPress(keyData)}
            />
          ))}
          {BLACK_KEYS.map((keyData, index) => (
            <BlackKey
              key={`black-${index}`}
              keyData={keyData}
              isActive={isKeyActive(keyData)}
              isTarget={isKeyTarget(keyData)}
              onPress={() => handleKeyPress(keyData)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: WHITE_KEY_HEIGHT + 20,
    backgroundColor: TunerColors.surface,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  keyboard: {
    height: WHITE_KEY_HEIGHT,
    position: "relative",
  },
  whiteKey: {
    position: "absolute",
    width: WHITE_KEY_WIDTH - 2,
    height: WHITE_KEY_HEIGHT,
    backgroundColor: "#F8F8F8",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#DDD",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 6,
  },
  whiteKeyActive: {
    backgroundColor: TunerColors.needleRed,
    borderColor: TunerColors.needleRed,
  },
  whiteKeyTarget: {
    backgroundColor: TunerColors.needleGreen,
    borderColor: TunerColors.needleGreen,
  },
  whiteKeyLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: TunerColors.background,
  },
  blackKey: {
    position: "absolute",
    width: BLACK_KEY_WIDTH,
    height: BLACK_KEY_HEIGHT,
    backgroundColor: "#222",
    borderRadius: 3,
    zIndex: 10,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 4,
  },
  blackKeyActive: {
    backgroundColor: TunerColors.needleRed,
  },
  blackKeyTarget: {
    backgroundColor: TunerColors.needleGreen,
  },
  blackKeyLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: TunerColors.background,
  },
});
