// src/libs/audioCompat.ts
// Prefer expo-audio (new), fall back to expo-av (old). Both runtime & TS-safe.
import * as ExpoAudio from "expo-audio";
// If you still have expo-av installed, this gives us a fallback.
// If not installed, remove the import and the fallback below.
import { Audio as AVAudio } from "expo-av";

// Guards for functions/enums — prefer expo-audio
export const setAudioModeAsync =
  (ExpoAudio as any).setAudioModeAsync ?? AVAudio.setAudioModeAsync;

export const InterruptionModeAndroid =
  (ExpoAudio as any).InterruptionModeAndroid ??
  (AVAudio as any)?.InterruptionModeAndroid;

export const InterruptionModeIOS =
  (ExpoAudio as any).InterruptionModeIOS ??
  (AVAudio as any)?.InterruptionModeIOS;

// Unified sound creator (expo-audio: Sound.createAsync; expo-av: Audio.Sound.createAsync)
export const createSoundAsync =
  (ExpoAudio as any).Sound?.createAsync ?? (AVAudio as any).Sound?.createAsync;
