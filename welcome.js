export function createWelcomeStage({root, source, notify, idleMs = 5000}) {
  const video = root.querySelector('#welcome-video');
  const poster = root.querySelector('#welcome-placeholder');
  const status = document.querySelector('#welcome-media-status');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  let active = false;
  let motionPaused = false;
  let background = document.hidden;
  let failed = false;
  let idleTimer;
  let playAttempt = 0;
  let pointerWakeAt = 0;

  function showPoster() {
    root.classList.remove('welcome-video-ready');
    poster.hidden = false;
    video.hidden = true;
  }

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function wake() {
    clearTimeout(idleTimer);
    root.classList.remove('controls-idle');
    if (!active || background) return;
    idleTimer = setTimeout(() => {
      const focused = document.activeElement;
      const keyboardFocus = focused instanceof Element
        && focused.matches(':focus-visible')
        && focused.closest('a, button, input, select, textarea, dialog');
      const hasWarning = root.querySelector('#storage-alert')?.hidden === false;
      if (document.querySelector('dialog[open]') || keyboardFocus || hasWarning) {
        wake();
        return;
      }
      if (active && !background) root.classList.add('controls-idle');
    }, idleMs);
  }

  function pointerMove() {
    const now = performance.now();
    if (now - pointerWakeAt < 200) return;
    pointerWakeAt = now;
    wake();
  }

  function failVideo(detail) {
    if (failed) return;
    failed = true;
    playAttempt++;
    video.pause();
    showPoster();
    setStatus('Welcome: video unavailable. Showing the poster placeholder.');
    wake();
    notify(`${detail} The welcome poster is still available. Check WELCOME_VIDEO in media.js.`);
  }

  function mediaError() {
    failVideo('The welcome video could not load.');
  }

  function update(next) {
    const wasActive = active;
    const wasBackground = background;
    active = next.active;
    motionPaused = next.motionPaused;
    background = next.background;

    if (!active) {
      playAttempt++;
      video.pause();
      clearTimeout(idleTimer);
      root.classList.remove('controls-idle');
      return;
    }
    if (!wasActive || (wasBackground && !background)) wake();
    if (!source || failed) {
      showPoster();
      return;
    }
    if (motionPaused || background) {
      playAttempt++;
      video.pause();
      return;
    }
    if (!video.getAttribute('src')) video.src = source;
    if (!video.paused) return;
    const attempt = ++playAttempt;
    video.hidden = false;
    video.play().then(() => {
      if (attempt !== playAttempt || !active || motionPaused || background) return;
      root.classList.add('welcome-video-ready');
      poster.hidden = true;
      setStatus('Welcome: background video loop with title and event overlays.');
    }).catch(error => {
      // Leaving the scene or pausing intentionally cancels a pending play request.
      if (attempt !== playAttempt || !active || motionPaused || background) return;
      failVideo(`The welcome video could not play: ${error.message}`);
    });
  }

  video.addEventListener('error', mediaError);
  document.addEventListener('pointermove', pointerMove, {passive: true});
  document.addEventListener('pointerdown', wake, {passive: true});
  document.addEventListener('keydown', wake, true);
  document.addEventListener('focusin', wake);
  document.addEventListener('close', wake, true);
  document.addEventListener('fullscreenchange', wake);
  setStatus(source
    ? 'Welcome: video configured. The poster stays visible until playback begins.'
    : 'Welcome: poster placeholder. The video has not been added yet.');

  return {
    update,
    wake,
    destroy() {
      clearTimeout(idleTimer);
      playAttempt++;
      active = false;
      video.pause();
      root.classList.remove('controls-idle');
      video.removeEventListener('error', mediaError);
      document.removeEventListener('pointermove', pointerMove);
      document.removeEventListener('pointerdown', wake);
      document.removeEventListener('keydown', wake, true);
      document.removeEventListener('focusin', wake);
      document.removeEventListener('close', wake, true);
      document.removeEventListener('fullscreenchange', wake);
    },
  };
}
