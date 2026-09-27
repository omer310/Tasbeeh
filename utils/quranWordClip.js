function wordClip(plan, range) {
  if (!range || !Number.isInteger(range.from) || !Number.isInteger(range.to) || range.from < 0 || range.to <= range.from) return null;
  const matches = plan.segments.filter(s => s.highlight && s.highlight.from < range.to && s.highlight.to > range.from);
  if (!matches.length || matches.some(s => s.highlight.from < range.from || s.highlight.to > range.to)) return null;
  // A word may have two timed pieces. Use its first complete occurrence,
  // without including later repetitions or intervening other words.
  let chosen = [], end = range.from;
  for (const segment of plan.segments) {
    if (!matches.includes(segment)) { chosen = []; end = range.from; continue; }
    if (segment.highlight.from > end) continue;
    chosen.push(segment); end = Math.max(end, segment.highlight.to);
    if (end >= range.to) return { startTime: chosen[0].start / 1000, endTime: segment.end / 1000, segments: chosen, partial: false };
  }
  return null;
}
module.exports = { wordClip };
