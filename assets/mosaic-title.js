/* Progressive enhancement for the deployed homepage (no bundle rebuild needed).
 * Card clicks are replayed once, after the tiles land, to preserve React's menu.
 */
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const RETURN_DELAY = 2800;
const RETURN_DURATION = 850;
const GRAVITY = 2600;

// Stable variation: relayout moves the mosaic without replacing its materials.
function noise(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

// Bake the fine gold-leaf grain once, instead of painting it every animation frame.
function makeGoldMaterials() {
  return Array.from({ length: 32 }, (_, index) => {
    const surface = document.createElement('canvas');
    surface.width = surface.height = 64;
    const pen = surface.getContext('2d');
    const n = offset => noise(index * 149 + offset);
    const corners = [[5+n(1)*3,5+n(2)*3],[56+n(3)*3,4+n(4)*3],
      [55+n(5)*4,55+n(6)*4],[4+n(7)*3,54+n(8)*4]];
    const path = () => {
      pen.beginPath();
      corners.forEach(([x,y],i) => i ? pen.lineTo(x,y) : pen.moveTo(x,y));
      pen.closePath();
    };
    path();
    pen.fillStyle = '#34291c';
    pen.shadowColor = '#160e08'; pen.shadowBlur = 3; pen.shadowOffsetY = 3;
    pen.fill(); pen.shadowBlur = 0; pen.shadowOffsetY = 0;
    pen.save(); path(); pen.clip();
    const gold = pen.createLinearGradient(5, 0, 54, 64);
    const tone = n(9) * 12;
    gold.addColorStop(0, `hsl(46 65% ${76+tone/2}%)`);
    gold.addColorStop(.38, `hsl(43 58% ${57+tone}%)`);
    gold.addColorStop(.66, `hsl(45 63% ${67+tone}%)`);
    gold.addColorStop(1, `hsl(35 49% ${39+tone}%)`);
    pen.fillStyle = gold; pen.fillRect(0,0,64,64);
    for(let i=0;i<150;i++) {
      const seed = 30+i*7;
      pen.fillStyle = i%3 ? `rgba(255,245,183,${.12+n(seed)*.38})` : `rgba(96,62,16,${.08+n(seed)*.25})`;
      pen.fillRect(n(seed+1)*64,n(seed+2)*64,.5+n(seed+3)*2.5,.5+n(seed+4)*2);
    }
    // Small, irregular leaf seams keep the face from looking like polished plastic.
    pen.strokeStyle = 'rgba(119,83,28,.22)'; pen.lineWidth=.65;
    pen.beginPath(); pen.moveTo(12+n(14)*25,7); pen.lineTo(24+n(15)*12,30);
    pen.lineTo(16+n(16)*30,57); pen.stroke(); pen.restore();
    pen.lineJoin='bevel'; pen.lineWidth=2.4;
    pen.strokeStyle='rgba(255,246,194,.85)';
    pen.beginPath(); pen.moveTo(...corners[3]); pen.lineTo(...corners[0]); pen.lineTo(...corners[1]); pen.stroke();
    pen.strokeStyle='rgba(80,49,15,.8)';
    pen.beginPath(); pen.moveTo(...corners[1]); pen.lineTo(...corners[2]); pen.lineTo(...corners[3]); pen.stroke();
    return surface;
  });
}

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
  const materials = makeGoldMaterials();
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
    const step = Math.max(2, size / 19);
    const mask = document.createElement('canvas');
    const pen = mask.getContext('2d', { willReadFrequently: true });
    for (const [letterIndex, letter] of letters.entries()) {
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
        for (let x = step * (Math.round(y / step) % 2 ? 0.7 : 0.5); x < mask.width; x += step) {
          if (pixels[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3] < 80) continue;
          const seed = letterIndex * 971 + Math.round(y / step) * 67 + Math.round(x / step) * 13;
          const homeX = rect.left + x;
          const homeY = rect.top + y - padding;
          letter.tiles.push({
            homeX, homeY, x: homeX, y: homeY, vx: 0, vy: 0, angle: 0,
            spin: 0, size: step * (1.02 + noise(seed) * .1),
            tone: noise(seed+1), facet: noise(seed+2) * Math.PI * 2,
            tilt: (noise(seed+3)-.5)*.14, aspect: .94+noise(seed+4)*.12,
            material: Math.floor(noise(seed+5)*materials.length),
            floor: height - 8 - noise(seed+6) * step * 3, settled: false,
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
    const light = Math.max(0, 1 - distance / (width * 0.5 + 100));
    const shine = Math.pow(incidence, 7) * light;
    const half = tile.size / 2;
    ctx.save();
    ctx.translate(tile.x, tile.y);
    ctx.rotate(tile.angle + tile.tilt);
    ctx.scale(tile.aspect, 1);
    // Keep the dark setting legible even when the tiles are only two pixels wide.
    ctx.fillStyle = 'rgba(49, 31, 13, .72)';
    ctx.fillRect(-half*.85+.2, -half*.85+.45, tile.size*.86, tile.size*.86);
    ctx.drawImage(materials[tile.material], -half, -half, tile.size, tile.size);
    // A restrained moving reflection; the baked grain and warm edges remain visible.
    if (shine > .08) {
      ctx.fillStyle = `rgba(255, 247, 204, ${shine * .3})`;
      ctx.fillRect(-half*.73, -half*.73, tile.size*.73, tile.size*.73);
      ctx.fillStyle = `rgba(255, 252, 227, ${shine * .65})`;
      ctx.fillRect(-half*.7, -half*.72, tile.size*.7, Math.max(.25,tile.size*.065));
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
