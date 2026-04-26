const body = document.body;
const openBtn = document.getElementById('openScroll');
const shell = document.getElementById('scrollShell');
const closeBtn = document.getElementById('closeScrollBtn');
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

let musicEnabled = true;
let musicStarted = false;

bgMusic.volume = 0.32;

async function ensureMusic() {
  if (!musicEnabled) return;

  try {
    await bgMusic.play();
    musicStarted = true;
    musicToggle.textContent = '♫ Music On';
  } catch (err) {
    // Browsers often block autoplay until the first user gesture.
    // This button makes that obvious without forcing a distracting alert.
    musicToggle.textContent = '♫ Start Music';
  }
}

function updateMusicButton() {
  musicToggle.textContent = bgMusic.paused ? '♫ Music Off' : '♫ Music On';
}

musicToggle.addEventListener('click', async (e) => {
  e.stopPropagation();

  if (bgMusic.paused) {
    musicEnabled = true;
    await ensureMusic();
  } else {
    bgMusic.pause();
    musicEnabled = false;
    updateMusicButton();
  }
});

function openScroll() {
  body.classList.add('opened');
  shell.setAttribute('aria-hidden', 'false');
  shell.classList.remove('animating');
  void shell.offsetWidth;
  shell.classList.add('animating');
}

function closeScroll() {
  body.classList.remove('opened');
  shell.setAttribute('aria-hidden', 'true');
  shell.classList.remove('animating');
}

openBtn.addEventListener('click', async (e) => {
  e.stopPropagation();
  if (!musicStarted && musicEnabled) await ensureMusic();
  openScroll();
});

closeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeScroll();
});

document.addEventListener('pointerdown', async () => {
  if (!musicStarted && musicEnabled) await ensureMusic();
}, { once:true });

document.addEventListener('click', (e) => {
  if (!body.classList.contains('opened')) return;
  if (shell.contains(e.target)) return;
  if (openBtn.contains(e.target)) return;
  closeScroll();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeScroll();

  if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === openBtn) {
    e.preventDefault();
    openScroll();
  }
});

// Lightweight dust animation.
// This version uses far fewer particles and no large blur bands.
const canvas = document.getElementById('dust');
const ctx = canvas.getContext('2d');
let w, h, dpr, motes;

function resizeDust() {
  dpr = Math.max(1, window.devicePixelRatio || 1);
  w = canvas.width = Math.floor(window.innerWidth * dpr);
  h = canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  const count = Math.min(95, Math.max(42, Math.floor((window.innerWidth * window.innerHeight) / 15500)));

  motes = Array.from({length: count}, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: (Math.random() * 1.35 + .35) * dpr,
    a: Math.random() * .26 + .05,
    vx: (Math.random() * .12 + .012) * dpr,
    vy: (Math.random() * .05 - .02) * dpr,
    phase: Math.random() * Math.PI * 2,
    tw: Math.random() * .016 + .004
  }));
}

function animateDust() {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (const p of motes) {
    p.phase += p.tw;
    p.x += p.vx + Math.sin(p.phase) * .055 * dpr;
    p.y += p.vy + Math.cos(p.phase * .8) * .03 * dpr;

    if (p.x > w + 18) p.x = -18;
    if (p.y > h + 18) p.y = -18;
    if (p.y < -18) p.y = h + 18;

    const glow = .64 + Math.sin(p.phase) * .32;

    ctx.beginPath();
    ctx.fillStyle = `rgba(255,229,176,${p.a * glow})`;
    ctx.shadowColor = 'rgba(255,226,171,.45)';
    ctx.shadowBlur = 5 * dpr;
    ctx.arc(p.x, p.y, p.r * (1 + glow * .45), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  requestAnimationFrame(animateDust);
}

window.addEventListener('resize', resizeDust, {passive:true});
resizeDust();
requestAnimationFrame(animateDust);

// Try autoplay once. Most browsers may block it until the first click.
ensureMusic();
