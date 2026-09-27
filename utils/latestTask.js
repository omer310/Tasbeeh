// Serialize effects, collapsing pending work to the newest choice. Every caller
// waits for the effect that includes its choice; rejection never poisons the queue.
function createLatestTask(run) {
  let running = false, pending;
  async function drain() {
    running = true;
    while (pending) {
      const batch = pending; pending = null;
      try { const result = await run(batch.value); batch.waiters.forEach(w => w.resolve(result)); }
      catch (error) { batch.waiters.forEach(w => w.reject(error)); }
    }
    running = false;
  }
  return value => new Promise((resolve, reject) => {
    if (pending) { pending.value = value; pending.waiters.push({ resolve, reject }); }
    else pending = { value, waiters: [{ resolve, reject }] };
    if (!running) void drain();
  });
}
module.exports = { createLatestTask };
