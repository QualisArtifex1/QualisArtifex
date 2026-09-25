/* Progressive enhancement for the deployed homepage (no bundle rebuild needed).
 * Card clicks are replayed once, after the tiles land, to preserve React's menu.
 */
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const RETURN_DELAY = 2800;
const RETURN_DURATION = 850;
const GRAVITY = 2600;

function mountMosaic(app, heading) {
  const intro = heading.closest('.intro');
  const title = heading.textContent;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.className = 'mosaic-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  heading.setAttribute('aria-label', title);
  const letters = [];
  heading.replaceChildren();
  title.split(' ').forEach((word, index) => {
    if (index) heading.append(' ');
    const span = document.createElement('span');
    span.className = 'mosaic-word';
    for (const character of word) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mosaic-letter';
      button.textContent = character;
      button.setAttribute('aria-label', `Scatter letter ${character.toUpperCase()}`);
      button.disabled = motion.matches;
      const letter = { button, tiles: [], state: 'idle', started: 0 };
      button.addEventListener('click', () => {
        if (!opening && !motion.matches && letter.state === 'idle') {
          drop(letter);
          wake();
        }
      });
      // The original app uses a global Enter shortcut to open the selected card.
      button.addEventListener('keydown', event => {
        if (['Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.stopPropagation();
      });
      letters.push(letter);
      span.append(button);
    }
    heading.append(span);
  });

  let width = 0, height = 0, frame = 0, previous = 0;
  let opening = null, replaying = false;
  let pointer = { x: innerWidth * 0.35, y: 0 };
  let hidden = app.classList.contains('is-detail');
  let layoutUntil = motion.matches ? 0 : performance.now() + 750;

  function layout() {
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const style = getComputedStyle(heading);
    const size = parseFloat(style.fontSize);
    const step = Math.max(1.8, size / 22);
    const mask = document.createElement('canvas');
    const pen = mask.getContext('2d', { willReadFrequently: true });
    for (const letter of letters) {
      const rect = letter.button.getBoundingClientRect();
      mask.width = Math.ceil(rect.width + size * 0.25);
      mask.height = Math.ceil(size * 1.5);
      pen.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
      pen.textBaseline = 'alphabetic';
      const glyph = letter.button.textContent.toUpperCase();
      const metrics = pen.measureText(glyph);
      // Match the font's line box, including its ascender and descender space.
      const ascent = metrics.fontBoundingBoxAscent ?? size * 0.9;
      const descent = metrics.fontBoundingBoxDescent ?? size * 0.22;
      const baseline = (rect.height - ascent - descent) / 2 + ascent;
      const padding = size * 0.2;
      pen.fillText(glyph, 0, baseline + padding);
      const pixels = pen.getImageData(0, 0, mask.width, mask.height).data;
      letter.tiles = [];
      for (let y = step / 2; y < mask.height; y += step) {
        for (let x = step / 2; x < mask.width; x += step) {
          if (pixels[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3] < 80) continue;
          const homeX = rect.left + x;
          const homeY = rect.top + y - padding;
          letter.tiles.push({
            homeX, homeY, x: homeX, y: homeY, vx: 0, vy: 0, angle: 0,
            spin: 0, size: step * 0.87, tone: Math.random(), facet: Math.random() * Math.PI * 2,
            floor: height - 8 - Math.random() * step * 3, settled: false,
          });
        }
      }
      letter.state = 'idle';
    }
  }

  function drop(letter, all = false) {
    layoutUntil = 0;
    letter.state = 'falling';
    letter.started = performance.now();
    letter.button.dataset.state = 'falling';
    for (const tile of letter.tiles) {
      tile.vx = (Math.random() - 0.5) * (all ? 190 : 250);
      tile.vy = -40 - Math.random() * 130;
      tile.spin = (Math.random() - 0.5) * 9;
      tile.settled = false;
    }
  }

  function reset() {
    for (const letter of letters) {
      letter.state = 'idle';
      delete letter.button.dataset.state;
      for (const tile of letter.tiles) {
        tile.x = tile.homeX; tile.y = tile.homeY; tile.angle = 0;
      }
    }
    wake();
  }

  function cancelOpening() {
    if (!opening) return;
    clearTimeout(opening.fallback);
    opening = null;
    app.classList.remove('mosaic-opening');
    reset();
  }

  function finishOpening() {
    if (!opening) return;
    const { card, fallback } = opening;
    clearTimeout(fallback);
    opening = null;
    app.classList.remove('mosaic-opening');
    if (!card.isConnected || app.classList.contains('is-detail')) return;
    replaying = true;
    try { card.click(); } finally { replaying = false; }
  }

  function openCard(card) {
    if (opening || hidden) return;
    opening = { card, started: performance.now(), fallback: setTimeout(finishOpening, 2200) };
    app.classList.add('mosaic-opening');
    for (const letter of letters) drop(letter, true);
    wake();
  }

  function interceptClick(event) {
    if (replaying || hidden) return;
    const target = event.target instanceof Element ? event.target : null;
    const control = target?.closest('.library-card, .nav-arrow, .progress-rail button');
    if (!control || !app.contains(control)) return;
    if (opening) {
      event.preventDefault(); event.stopImmediatePropagation();
    } else if (!motion.matches && control.matches('.library-card.is-active')) {
      event.preventDefault(); event.stopImmediatePropagation();
      openCard(control);
    }
  }

  function interceptKey(event) {
    if (hidden || replaying) return;
    if (opening && ['Escape', 'Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.key === 'Escape') cancelOpening();
      return;
    }
    if (event.key !== 'Enter') return;
    const target = event.target instanceof Element ? event.target : null;
    // Let buttons activate natively, but keep the app's global shortcut from
    // also opening a card when Enter is used on a letter or navigation button.
    if (target?.closest('button, a, input, textarea, select, [contenteditable="true"]')) {
      event.stopImmediatePropagation();
      return;
    }
    if (!motion.matches) {
      const card = app.querySelector('.library-card.is-active');
      if (card) {
        event.preventDefault(); event.stopImmediatePropagation();
        openCard(card);
      }
    }
  }

  function paintTile(tile) {
    const dx = pointer.x - tile.x, dy = pointer.y - tile.y;
    const distance = Math.hypot(dx, dy);
    const incidence = (Math.cos(Math.atan2(dy, dx) - tile.facet) + 1) / 2;
    const light = Math.max(0, 1 - distance / (width * 0.65 + 160));
    const shine = Math.pow(incidence, 10) * light;
    const brightness = 39 + tile.tone * 24 + light * 13;
    const half = tile.size / 2;
    ctx.save();
    ctx.translate(tile.x, tile.y);
    ctx.rotate(tile.angle);
    ctx.fillStyle = 'rgba(35, 19, 5, 0.7)';
    ctx.fillRect(-half + 0.6, -half + 1.1, tile.size, tile.size);
    ctx.fillStyle = `hsl(${36 + tile.tone * 10} 62% ${brightness}%)`;
    ctx.fillRect(-half, -half, tile.size, tile.size);
    ctx.fillStyle = `rgba(255, 248, 208, ${0.2 + shine * 0.8})`;
    ctx.fillRect(-half, -half, tile.size, Math.max(0.5, tile.size * 0.18));
    ctx.fillRect(-half, -half, Math.max(0.5, tile.size * 0.13), tile.size);
    ctx.fillStyle = 'rgba(62, 30, 6, 0.45)';
    ctx.fillRect(-half, half - 0.5, tile.size, 0.5);
    if (shine > 0.1) {
      ctx.fillStyle = `rgba(255, 253, 229, ${shine * 0.88})`;
      ctx.fillRect(-half, -half, tile.size, tile.size);
    }
    if (shine > 0.78 && tile.tone > 0.85) {
      ctx.fillStyle = `rgba(255, 251, 222, ${(shine - 0.78) * 3})`;
      ctx.fillRect(-tile.size, -0.4, tile.size * 2, 0.8);
      ctx.fillRect(-0.4, -tile.size, 0.8, tile.size * 2);
    }
    ctx.restore();
  }

  function render(now) {
    frame = 0;
    const dt = Math.min((now - (previous || now)) / 1000, 0.05);
    previous = now;
    ctx.clearRect(0, 0, width, height);
    if (hidden || document.hidden) return;
    if (now < layoutUntil) layout(); // Track the existing title entrance transform.
    let moving = false, allSettled = true;
    for (const letter of letters) {
      if (letter.state === 'falling' && !opening && now - letter.started >= RETURN_DELAY) {
        letter.state = 'returning';
        letter.started = now;
        letter.button.dataset.state = 'returning';
        for (const tile of letter.tiles) {
          tile.fromX = tile.x; tile.fromY = tile.y; tile.fromAngle = tile.angle;
        }
      }
      for (const tile of letter.tiles) {
        if (letter.state === 'falling' && !tile.settled) {
          tile.vy += GRAVITY * dt;
          tile.x += tile.vx * dt; tile.y += tile.vy * dt;
          tile.angle += tile.spin * dt;
          if (tile.x < tile.size || tile.x > width - tile.size) {
            tile.x = Math.max(tile.size, Math.min(width - tile.size, tile.x));
            tile.vx *= -0.4;
          }
          if (tile.y >= tile.floor) {
            tile.y = tile.floor;
            tile.vy *= -0.24; tile.vx *= 0.58; tile.spin *= 0.45;
            if (Math.abs(tile.vy) < 38) tile.settled = true;
          }
          if (!tile.settled) allSettled = false;
        }
        if (letter.state === 'returning') {
          const progress = Math.min(1, (now - letter.started) / RETURN_DURATION);
          const ease = 1 - Math.pow(1 - progress, 4);
          tile.x = tile.fromX + (tile.homeX - tile.fromX) * ease;
          tile.y = tile.fromY + (tile.homeY - tile.fromY) * ease;
          tile.angle = tile.fromAngle * (1 - ease);
        }
        paintTile(tile);
      }
      if (letter.state === 'returning' && now - letter.started >= RETURN_DURATION) {
        letter.state = 'idle';
        delete letter.button.dataset.state;
      }
      if (letter.state !== 'idle') moving = true;
    }
    if (opening && allSettled && now - opening.started > 450) finishOpening();
    if (moving || opening || now < layoutUntil) wake();
  }

  function wake() {
    if (!frame && !hidden && !document.hidden) frame = requestAnimationFrame(render);
  }

  intro.classList.add('mosaic-ready');
  layout();
  wake();
  document.addEventListener('pointermove', event => {
    if (motion.matches) return;
    pointer = { x: event.clientX, y: event.clientY };
    wake();
  }, { passive: true });
  window.addEventListener('click', interceptClick, true);
  window.addEventListener('keydown', interceptKey, true);
  window.addEventListener('resize', () => {
    // Navigation must still complete if the device rotates during the collapse.
    if (opening) finishOpening();
    layoutUntil = performance.now() + 100;
    layout(); reset();
  });
  document.addEventListener('visibilitychange', () => {
    previous = 0;
    if (!document.hidden) wake();
  });
  motion.addEventListener('change', () => {
    if (opening) finishOpening();
    letters.forEach(({ button }) => { button.disabled = motion.matches; });
    reset();
  });
  new MutationObserver(() => {
    const nextHidden = app.classList.contains('is-detail');
    if (nextHidden === hidden) return;
    hidden = nextHidden;
    canvas.hidden = hidden;
    letters.forEach(({ button }) => { button.tabIndex = hidden ? -1 : 0; });
    if (hidden) {
      cancelAnimationFrame(frame); frame = 0;
      if (heading.contains(document.activeElement)) document.activeElement.blur();
    } else {
      layoutUntil = motion.matches ? 0 : performance.now() + 850;
      layout(); reset();
    }
  }).observe(app, { attributes: true, attributeFilter: ['class'] });
}

const root = document.getElementById('root');
function initialize() {
  const heading = root?.querySelector('.intro h1');
  if (!heading) return false;
  mountMosaic(heading.closest('.app'), heading);
  return true;
}
if (!initialize() && root) {
  const observer = new MutationObserver(() => {
    if (initialize()) observer.disconnect();
  });
  observer.observe(root, { childList: true, subtree: true });
}
