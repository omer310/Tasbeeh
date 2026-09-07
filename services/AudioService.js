import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export function configureAudio() {
  return setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix', allowsRecording: false });
}

// Manually created Expo players must release their native resources.
export function playAudio(source, onFinish, title = 'Manarat Al-Muslim') {
  const player = createAudioPlayer(source);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    subscription.remove();
    player.remove();
  };
  const subscription = player.addListener('playbackStatusUpdate', status => {
    if (status.didJustFinish) { release(); onFinish?.(); }
  });
  try {
    player.setActiveForLockScreen(true, { title });
    player.play();
  } catch (error) { release(); throw error; }
  return { pause: () => { if (!released) player.pause(); }, stop: release };
}
