import { preload, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';

const cheersSound = require('../../assets/audio/cheers.mp3');

let preloadStarted = false;

// Fetch the cheers sound ahead of time (called when a quiz starts), so it's
// ready the moment the result screen needs it. Without this it only started
// loading on the result screen — during development it's downloaded from
// the computer running Expo, so it arrived late and stuttered while it
// streamed in.
export function preloadCheersSound() {
  if (preloadStarted) return;
  preloadStarted = true;
  // Non-fatal either way — the player below still downloads it before
  // playing. Wrapped because preload returns a promise on iOS/Android but
  // nothing on web, and can also throw synchronously.
  try {
    Promise.resolve(preload(cheersSound, { preferredForwardBufferDuration: 30 })).catch(() => {
      preloadStarted = false;
    });
  } catch {
    preloadStarted = false;
  }
}

// The client's above-70% cheers/claps requirement (spec Section 15) only
// means something if the student actually hears it — many phones (kids'
// especially) sit on silent/vibrate, so playback is allowed even then
// rather than silently doing nothing.
export function useCheersSound() {
  // downloadFirst: play the whole file from the device rather than streaming
  // it, so playback can't stall partway through.
  const player = useAudioPlayer(cheersSound, { downloadFirst: true });
  const { isLoaded } = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
      // Non-fatal — the sound still plays through the normal ringer volume.
    });
  }, []);

  return { player, isLoaded };
}
