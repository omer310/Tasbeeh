const { withTimeout } = require('./withTimeout');

// One cancellable preview owns the native player, including while its asset loads.
function createAudioPreview({ loadSource, createPlayer, configure, timeout = 15000 }) {
  let current;
  function play(source, { onState = () => {}, onError = () => {}, onProgress = () => {}, onComplete = () => {}, startTime = 0, endTime, autoPlay = true } = {}) {
    current?.stop();
    let stopped = false, paused = !autoPlay, prepared = false, player, subscription, loadTimer, seekRevision = 0, seekTarget = startTime;
    const cleanup = (reason = 'stopped') => {
      if (stopped) return;
      stopped = true;
      clearTimeout(loadTimer);
      // remove() unregisters the Expo player; pause explicitly ends audible playback.
      for (const action of [() => player?.pause(), () => subscription?.remove(),
        () => player?.clearLockScreenControls?.(), () => player?.remove(), () => player?.release?.()]) {
        try { action(); } catch { /* Keep releasing if one native operation fails. */ }
      }
      if (current === session) current = null;
      onState('idle', reason);
    };
    const fail = error => {
      if (stopped) return;
      cleanup('error');
      onError(error instanceof Error ? error : new Error(String(error)));
    };
    const session = {
      stop: cleanup, ready: null,
      pause: () => { if (!stopped) { try { paused = true; player?.pause(); onState('paused'); } catch (e) { fail(e); } } },
      resume: () => { if (!stopped) { try { paused = false; if (prepared) player.play(); else onState('loading'); } catch (e) { fail(e); } } },
      seekTo: async (seconds, { end, resume = true } = {}) => {
        if (stopped || !player) return false;
        const id = ++seekRevision;
        prepared = false; paused = !resume; endTime = end; seekTarget = seconds;
        try {
          player.pause(); onState('loading');
          await withTimeout(player.seekTo(seconds), timeout, 'Could not seek. Please retry.');
          if (stopped || id !== seekRevision) return false;
          prepared = true;
          if (!paused) player.play(); else onState('paused');
          return true;
        } catch (error) { if (id === seekRevision) fail(error); return false; }
      },
    };
    current = session;
    onState('loading');
    session.ready = (async () => {
      try {
        const resolved = await withTimeout(Promise.resolve().then(() => loadSource(source)), timeout,
          'The preview could not load. Check your connection and try again.');
        if (stopped) return false;
        await withTimeout(configure(), timeout, 'Audio setup took too long. Please try again.');
        if (stopped) return false;
        player = createPlayer(resolved);
        subscription = player.addListener('playbackStatusUpdate', status => {
          if (stopped) return;
          if (status.error) { fail(new Error(status.error)); return; }
          if (!prepared) return;
          // A queued pre-seek position must not end a newly selected earlier ayah.
          if (seekTarget !== null && Number.isFinite(status.currentTime)) {
            if (Math.abs(status.currentTime - seekTarget) > 2) return;
            seekTarget = null;
          }
          if (status.didJustFinish || (Number.isFinite(endTime) && status.currentTime >= endTime)) { cleanup('complete'); onComplete(); return; }
          if (status.isLoaded) onProgress(status.currentTime || 0);
          if (status.isLoaded) clearTimeout(loadTimer);
          onState(paused ? 'paused' : status.isBuffering ? 'loading' : status.playing ? 'playing' : status.isLoaded ? 'paused' : 'loading');
        });
        loadTimer = setTimeout(() => fail(new Error('The sound could not start. Please try again.')), timeout);
        if (startTime > 0) await withTimeout(player.seekTo(startTime), timeout, 'Could not seek to this ayah. Please retry.');
        if (stopped) return false;
        prepared = true;
        if (!paused) player.play(); else onState('paused');
        return true;
      } catch (error) { fail(error); return false; }
    })();
    return session;
  }
  return { play, stop: () => current?.stop() };
}
module.exports = { createAudioPreview };
