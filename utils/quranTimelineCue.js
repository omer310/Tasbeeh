function timelineCue(cues, milliseconds) {
  let low = 0, high = (cues?.length || 0) - 1, index = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (cues[mid].start <= milliseconds) { index = mid; low = mid + 1; } else high = mid - 1;
  }
  return index >= 0 && milliseconds < cues[index].end ? cues[index] : null;
}
module.exports = { timelineCue };
