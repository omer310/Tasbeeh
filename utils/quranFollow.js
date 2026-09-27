// Map native Text lines back to source character offsets, preserving diacritics.
function locateTextLine(lines, text, offset) {
  let cursor = 0;
  for (const line of lines || []) {
    const value = line.text || '';
    const found = value ? text.indexOf(value, cursor) : -1;
    const start = found < 0 ? cursor : found;
    const end = start + value.length;
    if (offset >= start && offset < end) return line;
    cursor = end;
  }
  return null;
}
function followOffset({ top, bottom, offset, height, content }) {
  if (!(height > 0) || !Number.isFinite(top) || !Number.isFinite(bottom)) return null;
  const margin = Math.min(48, height * 0.15);
  if (top >= offset + margin && bottom <= offset + height - margin) return null;
  return Math.max(0, Math.min(Math.max(0, content - height), top - height * 0.25));
}
module.exports = { locateTextLine, followOffset };
