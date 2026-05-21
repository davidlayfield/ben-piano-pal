import React, { useState, useCallback } from "react";
import { View, StyleSheet, Text, Pressable, Platform, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { SpeedometerDial } from "@/components/SpeedometerDial";
import { PianoKeyboard } from "@/components/PianoKeyboard";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { formatFrequency, formatCents } from "@/lib/pitchDetection";
import { playNote, stopNote } from "@/lib/audioPlayer";
import { TunerColors, Spacing } from "@/constants/theme";

interface TargetNote {
  noteName: string;
  octave: number;
}

export default function TunerScreen() {
  const insets = useSafeAreaInsets();
  const [targetNote, setTargetNote] = useState<TargetNote | null>(null);
  
  const { 
    noteInfo, 
    cents, 
    isInTune, 
    isActive, 
    hasPermission, 
    permissionDenied,
    isNativeLimited,
    isListening,
    requestPermission 
  } = usePitchDetection();

  const displayNote = noteInfo ? `${noteInfo.noteName}${noteInfo.octave}` : "--";
  const displayFrequency = noteInfo ? `${formatFrequency(noteInfo.frequency)} Hz` : "-- Hz";
  const displayCents = noteInfo ? `${formatCents(noteInfo.cents)} ¢` : "-- ¢";

  const handleKeyPress = useCallback((note: string, octave: number) => {
    if (targetNote?.noteName === note && targetNote?.octave === octave) {
      setTargetNote(null);
      stopNote();
    } else {
      setTargetNote({ noteName: note, octave });
      playNote(note, octave, 3);
    }
  }, [targetNote]);

  const handleClearTarget = useCallback(() => {
    setTargetNote(null);
    stopNote();
  }, []);

  const handleOpenSettings = async () => {
    if (Platform.OS !== "web") {
      try {
        await Linking.openSettings();
      } catch (error) {
        console.log("Could not open settings");
      }
    }
  };

  const isSameNote = targetNote && noteInfo && 
    targetNote.noteName === noteInfo.noteName && 
    targetNote.octave === noteInfo.octave;

  const centsOff = isSameNote ? noteInfo.cents : null;

  if (hasPermission === null && !isListening) {
    return (
      <View style={[styles.container, styles.permissionContainer, { paddingTop: insets.top + Spacing.xl }]}>
        <Feather name="mic" size={64} color={TunerColors.text} />
        <Text style={styles.permissionTitle}>Microphone Access</Text>
        <Text style={styles.permissionText}>
          Piano Tuner needs access to your microphone to detect notes and help you tune your piano.
        </Text>
        <Pressable 
          style={styles.permissionButton} 
          onPress={requestPermission}
          testID="button-enable-microphone"
        >
          <Text style={styles.permissionButtonText}>Enable Microphone</Text>
        </Pressable>
      </View>
    );
  }

  if (permissionDenied && hasPermission === false && !isListening) {
    return (
      <View style={[styles.container, styles.permissionContainer, { paddingTop: insets.top + Spacing.xl }]}>
        <Feather name="mic-off" size={64} color={TunerColors.needleRed} />
        <Text style={styles.permissionTitle}>Microphone Blocked</Text>
        <Text style={styles.permissionText}>
          To use Piano Tuner, please enable microphone access in your device settings.
        </Text>
        {Platform.OS !== "web" ? (
          <Pressable 
            style={styles.permissionButton} 
            onPress={handleOpenSettings}
            testID="button-open-settings"
          >
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      {isNativeLimited ? (
        <View style={styles.limitedBanner}>
          <Text style={styles.limitedText}>
            Open in web browser for full pitch detection
          </Text>
        </View>
      ) : null}
      
      <View style={styles.infoBar}>
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>FREQ</Text>
          <Text style={styles.infoValue}>{displayFrequency}</Text>
        </View>

        <View style={styles.infoSectionCenter}>
          <Text style={styles.noteDisplay}>{displayNote}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>CENTS</Text>
          <Text style={styles.infoValue}>{displayCents}</Text>
        </View>
      </View>

      <View style={styles.dialContainer}>
        <SpeedometerDial
          cents={cents}
          isInTune={isInTune}
          isActive={isActive}
          targetCents={targetNote ? 0 : null}
        />
      </View>

      <View style={styles.comparisonContainer}>
        {targetNote ? (
          <View style={styles.comparisonContent}>
            <View style={styles.targetInfo}>
              <View style={[styles.colorDot, { backgroundColor: TunerColors.needleGreen }]} />
              <Text style={styles.targetLabel}>Target: </Text>
              <Text style={styles.targetNote}>{targetNote.noteName}{targetNote.octave}</Text>
            </View>

            {centsOff !== null ? (
              <View style={styles.centsOffContainer}>
                <Text style={[
                  styles.centsOffValue,
                  Math.abs(centsOff) <= 5 && styles.centsOffGood
                ]}>
                  {centsOff > 0 ? "+" : ""}{centsOff.toFixed(0)}
                </Text>
                <Text style={styles.centsOffLabel}>cents off</Text>
              </View>
            ) : (
              <Text style={styles.playPrompt}>Play {targetNote.noteName}{targetNote.octave} on your piano</Text>
            )}

            <Pressable onPress={handleClearTarget} style={styles.clearButton}>
              <Feather name="x" size={18} color={TunerColors.dialArc} />
            </Pressable>
          </View>
        ) : (
          <Text style={styles.tapHint}>Tap a key to set target note</Text>
        )}
      </View>

      <View style={styles.keyboardContainer}>
        <PianoKeyboard
          activeNote={noteInfo?.noteName ?? null}
          activeOctave={noteInfo?.octave ?? null}
          targetNote={targetNote?.noteName ?? null}
          targetOctave={targetNote?.octave ?? null}
          onKeyPress={handleKeyPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TunerColors.background,
  },
  permissionContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: TunerColors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  permissionText: {
    fontSize: 16,
    color: TunerColors.dialArc,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing["3xl"],
  },
  permissionButton: {
    backgroundColor: TunerColors.text,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: TunerColors.background,
  },
  limitedBanner: {
    backgroundColor: TunerColors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  limitedText: {
    fontSize: 12,
    color: TunerColors.dialArc,
    textAlign: "center",
  },
  infoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  infoSection: {
    flex: 1,
    alignItems: "center",
  },
  infoSectionCenter: {
    flex: 1.5,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: TunerColors.dialArc,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "400",
    color: TunerColors.text,
  },
  noteDisplay: {
    fontSize: 48,
    fontWeight: "700",
    color: TunerColors.text,
    letterSpacing: 2,
  },
  dialContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  comparisonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 60,
    justifyContent: "center",
  },
  comparisonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: TunerColors.surface,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  targetInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  targetLabel: {
    fontSize: 14,
    color: TunerColors.dialArc,
  },
  targetNote: {
    fontSize: 16,
    fontWeight: "700",
    color: TunerColors.needleGreen,
  },
  centsOffContainer: {
    alignItems: "center",
  },
  centsOffValue: {
    fontSize: 28,
    fontWeight: "700",
    color: TunerColors.needleRed,
  },
  centsOffGood: {
    color: TunerColors.needleGreen,
  },
  centsOffLabel: {
    fontSize: 10,
    color: TunerColors.dialArc,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  playPrompt: {
    fontSize: 14,
    color: TunerColors.dialArc,
    fontStyle: "italic",
  },
  clearButton: {
    padding: Spacing.sm,
  },
  tapHint: {
    fontSize: 14,
    color: TunerColors.dialArc,
    textAlign: "center",
  },
  keyboardContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
});
