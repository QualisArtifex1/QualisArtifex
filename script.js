const site = document.getElementById('site');
const video = document.getElementById('scrollVideo');
const openButton = document.getElementById('openScroll');
const linkPanel = document.getElementById('linkPanel');
const resetButton = document.getElementById('resetScroll');

video.pause();
video.currentTime = 0;

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

openButton.addEventListener('click', (e) => {
  e.stopPropagation();
  playScroll();
});

site.addEventListener('click', (e) => {
  if (site.classList.contains('playing') || site.classList.contains('finished')) return;
  if (openButton.contains(e.target)) return;
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
