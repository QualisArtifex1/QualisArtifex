(() => {
  const site = document.getElementById('site');
  const video = document.getElementById('scrollVideo');
  const rerollVideo = document.getElementById('rerollVideo');
  const openButton = document.getElementById('openScroll');
  const linkPanel = document.getElementById('linkPanel');
  const resetButton = document.getElementById('resetScroll');
  const bgMusic = document.getElementById('bgMusic');
  const musicToggle = document.getElementById('musicToggle');

  if (!site || !video || !openButton || !linkPanel || !resetButton) {
    console.error('Qualis Artifex: required elements missing.');
    return;
  }

  let musicEnabled = true;
  let musicStarted = false;
  let isBusy = false;

  video.muted = true;
  video.pause();
  video.playbackRate = 2.25;
  try { video.currentTime = 0; } catch (err) {}

  if (rerollVideo) {
    rerollVideo.muted = true;
    rerollVideo.pause();
    rerollVideo.playbackRate = 2.25;
    try { rerollVideo.currentTime = 0; } catch (err) {}
  }

  if (bgMusic) {
    bgMusic.volume = 0.30;
    bgMusic.muted = false;
    bgMusic.autoplay = true;
  }

  function setMusicButton() {
    if (!musicToggle) return;
    musicToggle.textContent = musicEnabled ? '♫ Music On' : '♫ Music Off';
  }

  async function ensureMusic() {
    if (!bgMusic || !musicEnabled) return;
    try {
      bgMusic.muted = false;
      await bgMusic.play();
      musicStarted = true;
      setMusicButton();
    } catch (err) {
      setMusicButton();
    }
  }

  if (musicToggle && bgMusic) {
    musicToggle.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (musicEnabled && !bgMusic.paused) {
        bgMusic.pause();
        musicEnabled = false;
        setMusicButton();
        return;
      }

      musicEnabled = true;
      await ensureMusic();
    });
  }

  function resetToClosed() {
    isBusy = false;
    site.classList.remove('playing', 'finished', 'rerolling');
    linkPanel.setAttribute('aria-hidden', 'true');
    resetButton.textContent = 'Close Scroll';

    video.pause();
    try { video.currentTime = 0; } catch (err) {}

    if (rerollVideo) {
      rerollVideo.pause();
      try { rerollVideo.currentTime = 0; } catch (err) {}
    }
  }

  function showLinks() {
    isBusy = false;
    site.classList.remove('playing', 'rerolling');
    site.classList.add('finished');
    linkPanel.setAttribute('aria-hidden', 'false');
    resetButton.textContent = 'Close Scroll';
  }

  async function playScroll() {
    if (isBusy || site.classList.contains('playing')) return;

    isBusy = true;
    site.classList.remove('finished', 'rerolling');
    site.classList.add('playing');
    linkPanel.setAttribute('aria-hidden', 'true');

    await ensureMusic();

    if (rerollVideo) {
      rerollVideo.pause();
      try { rerollVideo.currentTime = 0; } catch (err) {}
    }

    try {
      video.pause();
      video.playbackRate = 2.25;
      video.currentTime = 0;
    } catch (err) {}

    try {
      await video.play();
    } catch (err) {
      isBusy = false;
      site.classList.remove('playing');
      const sub = openButton.querySelector('.open-sub');
      if (sub) sub.textContent = 'Click again to start the scroll';
      console.warn('Scroll video play failed:', err);
    }
  }

  async function closeScroll() {
    if (isBusy || site.classList.contains('rerolling')) return;

    isBusy = true;
    linkPanel.setAttribute('aria-hidden', 'true');
    site.classList.remove('finished');
    site.classList.add('rerolling');
    resetButton.textContent = 'Closing...';

    setTimeout(async () => {
      video.pause();

      if (!rerollVideo) {
        resetToClosed();
        return;
      }

      try {
        rerollVideo.pause();
        rerollVideo.playbackRate = 2.25;
        rerollVideo.currentTime = 0;
      } catch (err) {}

      try {
        await rerollVideo.play();
      } catch (err) {
        resetToClosed();
      }
    }, 700);
  }

  // Use both click and pointerdown, but prevent double firing with the isBusy guard.
  openButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    playScroll();
  });

  openButton.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    playScroll();
  });

  resetButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeScroll();
  });

  video.addEventListener('ended', showLinks);
  if (rerollVideo) rerollVideo.addEventListener('ended', resetToClosed);

  video.addEventListener('loadedmetadata', () => {
    video.playbackRate = 2.25;
    try { video.currentTime = 0; } catch (err) {}
  });

  if (rerollVideo) {
    rerollVideo.addEventListener('loadedmetadata', () => {
      rerollVideo.playbackRate = 2.25;
      try { rerollVideo.currentTime = 0; } catch (err) {}
    });
  }

  // Background click also opens the scroll, but not when clicking controls/links.
  site.addEventListener('click', (e) => {
    if (e.target.closest('button, a')) return;
    if (site.classList.contains('playing') || site.classList.contains('finished') || site.classList.contains('rerolling')) return;
    playScroll();
  });

  ensureMusic();
})();
