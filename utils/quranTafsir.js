const { getReaderChapter, riwayahFor } = require('./quranReaderText');
const { getQuranChapter } = require('./quranData');

function tafsirReferences(key, reader) {
  const [chapter, ayah] = String(key).split(':').map(Number);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114 || !Number.isInteger(ayah)) throw new Error('Invalid ayah');
  const verse = getReaderChapter(chapter, reader).find(item => item.key === key);
  if (!verse) throw new Error('Unknown ayah');
  // Duri can split or combine Hafs ayahs. Include every routed passage, never
  // assume matching verse numbers or use only the first word's reference.
  const keys = riwayahFor(reader) === 'duri'
    ? [...new Set(verse.routes.flatMap(([, , sources]) => sources.map(([source]) => source)))] : [key];
  const canonical = getQuranChapter(chapter);
  if (!keys.length || keys.some(source => !canonical.some(item => item.key === source))) throw new Error('Unmapped ayah');
  return keys.sort((a, b) => Number(a.split(':')[1]) - Number(b.split(':')[1]));
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', lrm: '\u200e', rlm: '\u200f' };
function tafsirPlainText(html) {
  return String(html || '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n').replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<\/(?:p|h[1-6]|div|li|blockquote)>/gi, '\n\n').replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (original, entity) => {
      if (!entity.startsWith('#')) return ENTITIES[entity.toLowerCase()] ?? original;
      const value = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff) ? String.fromCodePoint(value) : original;
    }).replace(/[\t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function normalizeTafsir(payload, source, key) {
  const value = payload?.tafsir;
  if (Number(value?.resource_id) !== source.id || !Object.hasOwn(value?.verses || {}, key)) throw new Error('Tafsir reference mismatch');
  const text = tafsirPlainText(value.text);
  if (!text) throw new Error('Tafsir is unavailable');
  return { sourceId: source.id, key, references: Object.keys(value.verses), text };
}

function distinctTafsirPassages(passages) {
  const seen = new Set();
  return passages.filter(passage => {
    const identity = `${passage.sourceId}/${[...passage.references].sort().join(',')}/${passage.text}`;
    if (seen.has(identity)) return false;
    seen.add(identity); return true;
  });
}
module.exports = { tafsirReferences, tafsirPlainText, normalizeTafsir, distinctTafsirPassages };
