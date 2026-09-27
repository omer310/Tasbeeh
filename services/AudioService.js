import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Asset } from 'expo-asset';
import { createAudioPreview } from '../utils/audioPreview';

let configuration;
export function configureAudio() {
  configuration ||= setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false,
    interruptionMode: 'doNotMix', allowsRecording: false }).catch(error => { configuration = null; throw error; });
  return configuration;
}

const previews = createAudioPreview({
  configure: configureAudio,
  loadSource: async source => {
    // Stream verse files directly; do not wait for a whole download before Play.
    if (typeof source === 'object' && /^(https:|file:)/.test(source.uri)) return source;
    const asset = typeof source === 'number' ? Asset.fromModule(source) : Asset.fromURI(source.uri || source);
    await asset.downloadAsync();
    return { uri: asset.localUri || asset.uri };
  },
  createPlayer: source => createAudioPlayer(source, { updateInterval: 50 }),
});
export const playAudio = previews.play;
export const stopAudioPreview = previews.stop;
