const hafs = require('./hafsPageCatalog');
const duri = require('./duriPageCatalog');
const hafsLocations = require('./hafsLocationsCatalog');
const duriLocations = require('./duriLocationsCatalog');
const { riwayahFor } = require('./quranReaderText');
function wordPageRows(page, reader) { return (riwayahFor(reader) === 'duri' ? duri : hafs)(page); }
function pageForWord(key, word, reader) {
  const locations = (riwayahFor(reader) === 'duri' ? duriLocations : hafsLocations)(Number(key.split(':')[0]))[key];
  return locations?.find(([from, to]) => (word?.from ?? 0) >= from && (word?.from ?? 0) < to)?.[2] || locations?.[0]?.[2];
}
function firstPageReference(page, reader) { return wordPageRows(page, reader).find(([, kind]) => kind === 'text')?.[2]?.[0]?.[0]; }
module.exports = { wordPageRows, pageForWord, firstPageReference };
