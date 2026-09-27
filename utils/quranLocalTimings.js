const { chapterTimings } = require('./quranTimingCatalog');
// Lazy static imports let Metro bundle the data without decoding every reader
// when the Quran screen opens. Tuples retain quran-align's exclusive word end.
function localTimings(reader, key) {
  const data = chapterTimings(reader, Number(key.split(':')[0]));
  return (data[key] || []).map(tuple => {
    const [word, wordEnd, start, end] = reader === 'noreen' || reader === 'alzain' ? [tuple[0], tuple[0] + 1, tuple[1], tuple[2]] : tuple;
    return { word, wordEnd, start, end, invalid: end <= start || start < 0 || wordEnd <= word };
  });
}
module.exports = { localTimings };
