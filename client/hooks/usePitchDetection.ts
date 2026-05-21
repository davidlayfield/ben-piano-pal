import { useEffect, useRef, useCallback, useState } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";
import { PitchDetector } from "pitchy";
import { useSharedValue } from "react-native-reanimated";
import { getAdjustedNote, NoteInfo } from "@/lib/pitchDetection";

const SAMPLE_RATE = 44100;
const FFT_SIZE = 4096;
const MIN_CLARITY = 0.85;
const MIN_VOLUME_DB = 50;
const UPDATE_INTERVAL = 50;

export interface PitchData {
  noteInfo: NoteInfo | null;
  isListening: boolean;
  hasPermission: boolean | null;
  permissionDenied: boolean;
  isNativeLimited: boolean;
  requestPermission: () => Promise<void>;
}

export function usePitchDetection() {
  const [noteInfo, setNoteInfo] = useState<NoteInfo | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isNativeLimited, setIsNativeLimited] = useState(false);

  const cents = useSharedValue(0);
  const isInTune = useSharedValue(false);
  const isActive = useSharedValue(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const analyzeAudio = useCallback((analyser: AnalyserNode, detector: PitchDetector<Float32Array>) => {
    const dataArray = new Float32Array(analyser.fftSize);

    const analyze = () => {
      const now = Date.now();
      
      if (now - lastUpdateRef.current < UPDATE_INTERVAL) {
        animationFrameRef.current = requestAnimationFrame(analyze);
        return;
      }
      
      lastUpdateRef.current = now;
      analyser.getFloatTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const db = 20 * Math.log10(rms + 0.0001) + 100;

      if (db >= MIN_VOLUME_DB) {
        const [pitch, clarity] = detector.findPitch(dataArray, SAMPLE_RATE);

        if (pitch && clarity >= MIN_CLARITY && pitch > 20 && pitch < 5000) {
          const adjustedNote = getAdjustedNote(pitch);

          if (adjustedNote) {
            setNoteInfo(adjustedNote);
            cents.value = adjustedNote.cents;
            isInTune.value = adjustedNote.isInTune;
            isActive.value = true;
          }
        } else {
          isActive.value = false;
        }
      } else {
        isActive.value = false;
      }

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, [cents, isInTune, isActive]);

  const startWebAudio = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      console.log("Web Audio API not available");
      setHasPermission(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({
        sampleRate: SAMPLE_RATE,
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.1;
      source.connect(analyser);
      analyserRef.current = analyser;

      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      
      setIsListening(true);
      setHasPermission(true);
      analyzeAudio(analyser, detector);
    } catch (error) {
      console.log("Microphone access denied or not available");
      setHasPermission(false);
      setPermissionDenied(true);
      setIsListening(false);
    }
  }, [analyzeAudio]);

  const startNativeAudio = useCallback(async () => {
    try {
      console.log("Requesting audio permission on native...");
      const { status, canAskAgain } = await Audio.requestPermissionsAsync();
      
      console.log("Permission status:", status, "canAskAgain:", canAskAgain);
      
      if (status !== "granted") {
        setHasPermission(false);
        setPermissionDenied(true);
        return;
      }

      setHasPermission(true);

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        console.log("Starting native audio recording...");
        
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
            numberOfChannels: 1,
          },
          ios: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
            numberOfChannels: 1,
          },
        });

        await recording.startAsync();
        recordingRef.current = recording;
        setIsListening(true);

        console.log("Native audio recording started successfully");

        meteringIntervalRef.current = setInterval(async () => {
          try {
            if (recordingRef.current) {
              const status = await recordingRef.current.getStatusAsync();
              if (status.isRecording && status.metering !== undefined) {
                const db = status.metering + 160;
                
                if (db >= MIN_VOLUME_DB) {
                  isActive.value = true;
                } else {
                  isActive.value = false;
                }
              }
            }
          } catch (e) {
            // Metering may not be available
          }
        }, UPDATE_INTERVAL);

      } catch (recordingError) {
        console.log("Recording setup failed, showing tuner in limited mode:", recordingError);
        setIsNativeLimited(true);
        setIsListening(true);
      }

    } catch (error) {
      console.log("Native audio error:", error);
      setHasPermission(false);
      setPermissionDenied(true);
    }
  }, [isActive]);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === "web") {
      await startWebAudio();
    } else {
      await startNativeAudio();
    }
  }, [startWebAudio, startNativeAudio]);

  const stopListening = useCallback(async () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        // Ignore stop errors
      }
      recordingRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setIsListening(false);
  }, []);

  useEffect(() => {
    const checkPermission = async () => {
      if (Platform.OS === "web") {
        startWebAudio();
      } else {
        const { status } = await Audio.getPermissionsAsync();
        console.log("Initial permission check:", status);
        
        if (status === "granted") {
          startNativeAudio();
        } else if (status === "denied") {
          setPermissionDenied(true);
          setHasPermission(false);
        } else {
          setHasPermission(null);
        }
      }
    };

    checkPermission();

    return () => {
      stopListening();
    };
  }, []);

  return {
    noteInfo,
    isListening,
    hasPermission,
    permissionDenied,
    isNativeLimited,
    requestPermission,
    cents,
    isInTune,
    isActive,
  };
}
