// A font/width change invalidates FlatList's cached heights, even for rows that
// are offscreen. Reading progress is deliberately not part of this identity.
function textLayoutKey({ mode, fontSize, translation, riwayah, width, fontScale }) {
  return [mode, fontSize, !!translation, riwayah, Math.round(width), fontScale].join(':');
}

function pullBoundary({ delta, offset, height, content, firstVisible, lastVisible, lastBottom, previous, next }) {
  if (delta > 0 && previous && firstVisible && offset <= 2) return 'previous';
  // Estimated content height alone can temporarily report the end of a long
  // virtual list. Require its real last row to be mounted and visible as well.
  if (delta < 0 && next && lastVisible && Number.isFinite(lastBottom) && height > 0 && content > 0 && offset + height >= Math.max(content, lastBottom) - 3) return 'next';
  return null;
}

function createSeekBudget(limit = 6) {
  let target = null, attempts = 0;
  return {
    target: () => target,
    begin(index) { if (target !== index) { target = index; attempts = 0; } },
    retry(index) { if (target !== index || attempts >= limit) return false; attempts++; return true; },
    cancel() { target = null; attempts = 0; },
  };
}
function groupReaderVerses(verses, mode, anchor) {
  const rows = []; let group = [], length = 0;
  for (const verse of verses) {
    // An explicit ayah jump starts a paragraph at that ayah. Otherwise a flow
    // row could begin several verses before the requested destination.
    if (group.length && (mode !== 'flow' || verse.key === anchor || length + verse.text.length > 350)) { rows.push(group); group = []; length = 0; }
    group.push(verse); length += verse.text.length;
  }
  if (group.length) rows.push(group);
  return rows;
}
function visibleReaderVerse(visibleGroups, anchor, preserveAnchor) {
  return (preserveAnchor ? visibleGroups.flat().find(verse => verse.key === anchor) : null) || visibleGroups[0]?.[0];
}
module.exports = { textLayoutKey, pullBoundary, createSeekBudget, groupReaderVerses, visibleReaderVerse };
