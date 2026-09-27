const wheelIndex = (offset, rowHeight, count) => Math.max(0, Math.min(count - 1, Math.round(offset / rowHeight)));
// Native scroll events can end with or without momentum, and a linked column
// may be changed while this one is coasting. Only an active gesture may commit.
function createWheelInteraction({ count, rowHeight, initialIndex, onSelect, onMoving, onAlign, onTick = () => {}, now = Date.now, schedule = setTimeout, cancelSchedule = clearTimeout }) {
  let selected = initialIndex, offset = initialIndex * rowHeight, active = false, dragging = false, timer = null, generation = 0;
  let tickIndex = initialIndex, lastTick = -Infinity;
  const tick = index => {
    if (index === tickIndex) return;
    tickIndex = index;
    const time = now();
    if (time - lastTick >= 55) { lastTick = time; onTick(); }
  };
  const clear = () => { ++generation; if (timer !== null) cancelSchedule(timer); timer = null; };
  const cancel = () => { clear(); active = false; dragging = false; onMoving(false); };
  const finish = () => {
    if (!active || dragging) return;
    selected = wheelIndex(offset, rowHeight, count);
    cancel(); onAlign(selected, true); onSelect(selected);
  };
  const arm = () => { clear(); const ticket = generation; timer = schedule(() => { if (ticket === generation) finish(); }, 140); };
  return {
    begin(nextOffset) { clear(); offset = nextOffset; tickIndex = wheelIndex(offset, rowHeight, count); active = true; dragging = true; onMoving(true); },
    scroll(nextOffset) { if (!active) return; offset = nextOffset; tick(wheelIndex(offset, rowHeight, count)); if (!dragging) arm(); },
    endDrag(nextOffset) { if (!active) return; offset = nextOffset; dragging = false; arm(); },
    momentumBegin() { if (active && !dragging) arm(); },
    momentumEnd(nextOffset) { if (!active || dragging) return; offset = nextOffset; finish(); },
    tap(index) { selected = wheelIndex(index * rowHeight, rowHeight, count); tick(selected); offset = selected * rowHeight; cancel(); onAlign(selected, true); onSelect(selected); },
    sync(index, force = false, nextCount = count) {
      count = nextCount;
      index = wheelIndex(index * rowHeight, rowHeight, count);
      if (!force && selected === index && !active) return;
      selected = index; tickIndex = index; offset = selected * rowHeight; cancel(); onAlign(index, !force);
    },
    dispose: cancel,
  };
}
module.exports = { wheelIndex, createWheelInteraction };
