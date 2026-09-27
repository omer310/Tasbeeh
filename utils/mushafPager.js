// All pages share one moving strip. Slots are fixed relative to the original
// page, so transferring ownership at the end of a turn never moves the ink.
const pageSlot = (origin, page) => origin - page;

function createMushafTurn({ origin, page: initialPage, width: initialWidth, stop, place, animate, commit }) {
  let page = initialPage, width = initialWidth, generation = 0, moving = false, arrived = null;
  const cancel = () => { ++generation; moving = false; stop(); };
  return {
    get moving() { return moving; },
    sync(nextPage, nextWidth) {
      const handedOff = arrived === nextPage && width === nextWidth;
      cancel(); page = nextPage; width = nextWidth; arrived = null;
      if (!handedOff) place(page - origin);
    },
    begin() { cancel(); arrived = null; place(page - origin); },
    drag(dx) {
      const bounded = page === 1 && dx < 0 || page === 604 && dx > 0;
      place(page - origin + Math.max(-1, Math.min(1, dx / width * (bounded ? 0.16 : 1))));
    },
    release(dx, velocity) {
      const target = Math.max(1, Math.min(604, page + (dx > 0 ? 1 : -1)));
      if (target === page || (Math.abs(dx) < width * 0.18 && Math.abs(velocity) < 0.6)) { this.reset(); return; }
      cancel(); moving = true;
      const ticket = generation;
      animate(target - origin, false, finished => {
        if (ticket !== generation) return;
        if (!finished) { moving = false; place(page - origin); return; }
        // Remain blocked until the parent's page prop accepts this turn.
        arrived = target; commit(target);
      });
    },
    reset() {
      cancel(); moving = true; const ticket = generation;
      animate(page - origin, true, () => { if (ticket === generation) moving = false; });
    },
    dispose: cancel,
  };
}
module.exports = { pageSlot, createMushafTurn };
