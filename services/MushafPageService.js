import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { unzipSync, strFromU8 } from 'fflate';
import assetForPage from '../utils/mushafAssetCatalog';
import { riwayahFor } from '../utils/quranReaderText';

const pages = new Map(), pending = new Map();
const idFor = (page, reader) => `${riwayahFor(reader)}:${page}`;
export const cachedMushafPage = (page, reader) => pages.get(idFor(page, reader));

export async function loadMushafPage(page, reader) {
  const id = idFor(page, reader);
  if (pages.has(id)) {
    const xml = pages.get(id); pages.delete(id); pages.set(id, xml); return xml;
  }
  if (pending.has(id)) return pending.get(id);
  const work = (async () => {
    const asset = Asset.fromModule(assetForPage(page, riwayahFor(reader)));
    await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;
    const bytes = Platform.OS === 'web'
      ? new Uint8Array(await (await fetch(uri)).arrayBuffer())
      : await new File(uri).bytes();
    const file = unzipSync(bytes)['page.svg'];
    if (!file) throw Error('Missing Mushaf page artwork.');
    const xml = strFromU8(file);
    pages.set(id, xml);
    while (pages.size > 5) pages.delete(pages.keys().next().value);
    return xml;
  })();
  pending.set(id, work);
  try { return await work; } finally { pending.delete(id); }
}
