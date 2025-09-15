/* eslint-disable @typescript-eslint/no-require-imports */

// src/libs/audio.ts
// Unifies expo-audio (new) and expo-av (fallback) so the rest of your app
// can just `import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "@/libs/audio"`.

let mod: any;
try {
  // If installed, prefer the new split package

  mod = require("expo-audio");
} catch {
  // Fallback to expo-av

  mod = require("expo-av");
}

// In expo-av it's { Audio }, in expo-audio the top-level may already be Audio-like.
// Normalize them:
export const Audio = mod.Audio ?? mod;

// Normalize enums (exist on both, names unchanged):
export const InterruptionModeAndroid =
  mod.InterruptionModeAndroid ?? Audio?.InterruptionModeAndroid;

export const InterruptionModeIOS =
  mod.InterruptionModeIOS ?? Audio?.InterruptionModeIOS;
