const metadata = require('./mushafMetadataCatalog');
const { riwayahFor } = require('./quranReaderText');
const indexes = {
  hafs: () => require('../data/quran/printed-pages/hafs-index.json'),
  duri: () => require('../data/quran/printed-pages/duri-index.json'),
};

const printedPage = (page, reader) => metadata(page, riwayahFor(reader));
function printedPageForAyah(key, reader, currentPage) {
  const pages = indexes[riwayahFor(reader)]()[key];
  return pages?.includes(currentPage) ? currentPage : pages?.[0];
}
function firstPrintedReference(page, reader) { return printedPage(page, reader).regions[0]?.[1]; }
function printedReference(key, reader) {
  const [chapter, ayah] = String(key).split(':').map(Number);
  if (riwayahFor(reader) !== 'duri' || chapter !== 67 || ayah < 9) return key;
  return ayah === 9 ? '67:9–10' : `67:${ayah + 1}`;
}
const MUSHAF_CONTROLS_HEIGHT = 56;
function vectorGeometry(viewBox, width, height) {
  const ratio = viewBox[2] / viewBox[3];
  const availableWidth = Math.max(1, width - 12), availableHeight = Math.max(1, height - 8);
  const fit = Math.min(availableWidth, availableHeight * ratio);
  const pageWidth = fit;
  return { width: pageWidth, height: pageWidth / ratio, scale: pageWidth / viewBox[2] };
}
// Paths retain each subpath: joining the numbers into one polygon would turn
// blank space between lines into a selectable region.
function regionBounds(path) {
  const numbers = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  const xs = numbers.filter((_, i) => i % 2 === 0), ys = numbers.filter((_, i) => i % 2 === 1);
  return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
}
module.exports = { printedPage, printedPageForAyah, firstPrintedReference, printedReference, vectorGeometry, regionBounds, MUSHAF_CONTROLS_HEIGHT };
