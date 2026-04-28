const site = document.getElementById('site');
const video = document.getElementById('scrollVideo');
const openButton = document.getElementById('openScroll');
const linkPanel = document.getElementById('linkPanel');
const resetButton = document.getElementById('resetScroll');
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

let musicEnabled = true;
let musicStarted = false;

bgMusic.volume = 0.32;
bgMusic.muted = false;
bgMusic.autoplay = true;

function setMusicButton() {
  musicToggle.textContent = musicEnabled ? '♫ Music On' : '♫ Music Off';
}

async function ensureMusic() {
  if (!musicEnabled) return;

  try {
    bgMusic.muted = false;
    await bgMusic.play();
    musicStarted = true;
    setMusicButton();
  } catch (err) {
    // Most browsers block audible autoplay until the first user gesture.
    // The page still defaults to Music On and starts it on the first click/tap/key press.
    setMusicButton();
  }
}

musicToggle.addEventListener('click', async (e) => {
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

['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
  document.addEventListener(eventName, async () => {
    if (musicEnabled && !musicStarted) await ensureMusic();
  }, { once:true, passive:true });
});

video.pause();
video.currentTime = 0;
video.playbackRate = 2;

function hideLinks() {
  site.classList.remove('finished');
  linkPanel.setAttribute('aria-hidden', 'true');
}

function showLinks() {
  site.classList.remove('playing');
  site.classList.add('finished');
  linkPanel.setAttribute('aria-hidden', 'false');
}

async function playScroll() {
  hideLinks();
  site.classList.add('playing');
  video.playbackRate = 2;

  try {
    video.currentTime = 0;
  } catch (err) {}

  try {
    await video.play();
  } catch (err) {
    site.classList.remove('playing');
    openButton.querySelector('.open-sub').textContent = 'Click again to start the scroll';
  }
}

openButton.addEventListener('click', async (e) => {
  e.stopPropagation();
  if (musicEnabled && !musicStarted) await ensureMusic();
  playScroll();
});

site.addEventListener('click', async (e) => {
  if (site.classList.contains('playing') || site.classList.contains('finished')) return;
  if (openButton.contains(e.target)) return;
  if (musicEnabled && !musicStarted) await ensureMusic();
  playScroll();
});

resetButton.addEventListener('click', (e) => {
  e.stopPropagation();
  site.classList.remove('finished');
  linkPanel.setAttribute('aria-hidden', 'true');

  try {
    video.currentTime = 0;
  } catch (err) {}

  video.pause();

  requestAnimationFrame(() => {
    site.classList.remove('playing');
  });
});

video.addEventListener('ended', showLinks);

video.addEventListener('loadedmetadata', () => {
  video.playbackRate = 2;
  try {
    video.currentTime = 0;
  } catch (err) {}
});

// Lightweight atmospheric dust.
const canvas = document.getElementById('dust');
const ctx = canvas.getContext('2d');
let w, h, dpr, motes;

function resizeDust() {
  dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  w = canvas.width = Math.floor(window.innerWidth * dpr);
  h = canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  const area = window.innerWidth * window.innerHeight;
  const count = Math.min(135, Math.max(64, Math.floor(area / 10500)));

  motes = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: (Math.random() * 1.35 + 0.35) * dpr,
    a: Math.random() * 0.24 + 0.045,
    vx: (Math.random() * 0.11 + 0.012) * dpr,
    vy: (Math.random() * 0.045 - 0.018) * dpr,
    phase: Math.random() * Math.PI * 2,
    tw: Math.random() * 0.015 + 0.004
  }));
}

function animateDust() {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (const p of motes) {
    p.phase += p.tw;
    p.x += p.vx + Math.sin(p.phase) * 0.05 * dpr;
    p.y += p.vy + Math.cos(p.phase * 0.8) * 0.028 * dpr;

    if (p.x > w + 18) p.x = -18;
    if (p.y > h + 18) p.y = -18;
    if (p.y < -18) p.y = h + 18;

    const glow = 0.64 + Math.sin(p.phase) * 0.32;

    ctx.beginPath();
    ctx.fillStyle = `rgba(255,229,176,${p.a * glow})`;
    ctx.shadowColor = 'rgba(255,226,171,.45)';
    ctx.shadowBlur = 5 * dpr;
    ctx.arc(p.x, p.y, p.r * (1 + glow * 0.45), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  requestAnimationFrame(animateDust);
}

window.addEventListener('resize', resizeDust, { passive: true });
resizeDust();
requestAnimationFrame(animateDust);


// Try autoplay once. If blocked, the first user gesture starts it.
ensureMusic();
