// Apply touches immediately while an older saved preference is still loading.
// Merge only edited fields, so a sound change never erases a saved reminder.
function createPreferenceSelection({ defaults, load, save, onChange, onSaving = () => {}, onError = () => {}, onSaved = () => {} }) {
  let baseline = defaults, edits = {}, loading, revision = 0, disposed = false, writes = Promise.resolve();
  const emit = () => { if (!disposed) onChange({ ...baseline, ...edits }); };
  const read = () => {
    if (!loading) loading = Promise.resolve().then(load).then(value => { baseline = { ...defaults, ...value }; emit(); return baseline; }).catch(error => { loading = null; throw error; });
    return loading;
  };
  function choose(patch) {
    if (disposed) return Promise.resolve();
    edits = { ...edits, ...patch }; const id = ++revision; emit(); onSaving(true); onError(null);
    const job = writes.catch(() => {}).then(async () => {
      await read();
      if (id !== revision) return;
      const result = await save({ ...baseline, ...edits });
      if (!disposed && id === revision) onSaved(result);
    });
    writes = job;
    return job.catch(error => { if (!disposed && id === revision) onError(error); }).finally(() => { if (!disposed && id === revision) onSaving(false); });
  }
  return { hydrate: () => read().catch(error => { if (!disposed) onError(error); }), choose, dispose: () => { disposed = true; } };
}
module.exports = { createPreferenceSelection };
