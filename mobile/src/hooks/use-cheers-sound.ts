import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

const cheersSound = require('../../assets/audio/cheers.mp3');

// The client's above-70% cheers/claps requirement (spec Section 15) only
// means something if the student actually hears it — many phones (kids'
// especially) sit on silent/vibrate, so playback is allowed even then
// rather than silently doing nothing.
export function useCheersSound() {
  const player = useAudioPlayer(cheersSound);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
      // Non-fatal — the sound still plays through the normal ringer volume.
    });
  }, []);

  return player;
}
