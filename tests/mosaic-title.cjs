// Run with Playwright installed: node tests/mosaic-title.cjs
// Optional CHROMIUM_PATH selects an existing browser executable.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.avif': 'image/avif' };
const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const filename = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!filename.startsWith(`${root}${path.sep}`)) { response.writeHead(403).end(); return; }
  try {
    response.setHeader('Content-Type', types[path.extname(filename)] || 'application/octet-stream');
    response.end(await fs.readFile(filename));
  } catch { response.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--disable-gpu'], headless: true,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const home = async () => {
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator('.mosaic-ready').waitFor();
      await page.waitForTimeout(900);
    };
    const detail = () => page.locator('.app').evaluate(el => el.classList.contains('is-detail'));
    const waitDetail = () => page.waitForFunction(() => document.querySelector('.app.is-detail'));
    const back = async () => {
      await page.locator('.back-button').click();
      await page.waitForTimeout(900);
      assert.equal(await detail(), false);
      assert.equal(await page.locator('.mosaic-canvas').isVisible(), true);
    };
    await home();
    const letters = page.locator('.mosaic-letter');
    assert.equal(await letters.count(), 13);
    assert.equal(await page.getByRole('heading', { name: 'Qualis Artifex' }).count(), 1);

    // Mouse lighting changes canvas pixels while all letters are intact.
    await page.mouse.move(100, 150);
    await page.waitForTimeout(100);
    const firstLight = await page.locator('canvas').evaluate(el => el.toDataURL());
    await page.mouse.move(1200, 100);
    await page.waitForTimeout(100);
    assert.notEqual(await page.locator('canvas').evaluate(el => el.toDataURL()), firstLight);
    await letters.first().click();
    assert.equal(await page.locator('[data-state="falling"]').count(), 1);
    await letters.first().click(); // Repeated clicks must not restart the timer.
    await page.waitForFunction(() => !document.querySelector('.mosaic-letter[data-state]'), null, { timeout: 6000 });
    assert.equal(await detail(), false);
    console.log('PASS: reflective lighting, individual collapse and timed reformation');

    // Enter/Space on a letter must not trigger the app's global Enter handler.
    await letters.nth(2).focus();
    await page.keyboard.press('Enter');
    assert.equal(await letters.nth(2).getAttribute('data-state'), 'falling');
    assert.equal(await detail(), false);
    await letters.nth(3).focus();
    await page.keyboard.press('Space');
    assert.equal(await letters.nth(3).getAttribute('data-state'), 'falling');
    await page.locator('.nav-arrow.right').focus();
    await page.keyboard.press('Enter');
    assert.equal(await detail(), false);
    await page.waitForTimeout(800);
    console.log('PASS: keyboard letters and carousel navigation remain independent');

    const card = page.locator('.library-card.is-active');
    const chosen = await card.getAttribute('aria-label');
    await card.click();
    assert.equal(await page.locator('[data-state="falling"]').count(), 13);
    assert.equal(await detail(), false);
    await page.waitForTimeout(250);
    assert.equal(await detail(), false);
    // These synthetic clicks intentionally bypass Playwright's stability wait.
    await card.evaluate(el => { el.click(); el.click(); });
    await page.locator('.nav-arrow.right').evaluate(el => el.click());
    assert.equal(await card.getAttribute('aria-label'), chosen);
    await waitDetail();
    assert.equal(await page.locator('.mosaic-canvas').isVisible(), false);
    assert.equal(await letters.first().getAttribute('tabindex'), '-1');
    await back();
    await page.waitForTimeout(1800);
    assert.equal(await detail(), false); // No delayed duplicate opens after returning.
    console.log('PASS: all-letter collapse precedes one menu open; return restores title');

    await card.click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2400);
    assert.equal(await detail(), false);
    assert.equal(await page.locator('[data-state]').count(), 0);
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Enter');
    await waitDetail();
    await back();
    console.log('PASS: Escape cancels pending opening; unfocused Enter opens through collapse');

    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(250);
      const bounds = await letters.evaluateAll(items => items.map(item => item.getBoundingClientRect().toJSON()));
      assert(bounds.every(rect => rect.left >= 0 && rect.right <= viewport.width));
      assert.equal(await page.evaluate(() => document.querySelector('canvas').width), viewport.width);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await card.evaluate(el => el.click());
    await page.setViewportSize({ width: 844, height: 390 });
    await waitDetail();
    await back();
    console.log('PASS: mobile/landscape layouts and resize during card opening');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('.mosaic-letter').disabled);
    assert.equal(await letters.first().isDisabled(), true);
    await card.evaluate(el => el.click());
    await waitDetail();
    assert.equal(await page.locator('.mosaic-opening').count(), 0);
    await back();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => !document.querySelector('.mosaic-letter').disabled);
    assert.equal(await letters.first().isEnabled(), true);
    console.log('PASS: reduced motion skips physics and navigation delay');
    const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    touch.on('pageerror', error => errors.push(error.message));
    await touch.goto(`http://127.0.0.1:${server.address().port}/`);
    await touch.waitForTimeout(900);
    await touch.locator('.mosaic-letter').first().tap();
    assert.equal(await touch.locator('[data-state="falling"]').count(), 1);
    await touch.locator('.library-card.is-active').tap();
    await touch.waitForFunction(() => document.querySelector('.app.is-detail'));
    await touch.close();
    console.log('PASS: touch letter and card activation');
    assert.deepEqual(errors, []);
    console.log('PASS: no browser runtime errors');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
