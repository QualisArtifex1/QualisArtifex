# Interactive mosaic title

`assets/mosaic-title.js` and `assets/mosaic-title.css` enhance the homepage's existing title without editing the generated application bundle. `index.html` loads both files. Removing those two tags restores the original heading and card behavior.

- Each letter is rendered as irregular, staggered gold tesserae with beveled edges, dark joints, and baked gold-leaf grain inspired by the supplied mosaic reference. Thirty-two cached material textures keep the falling animation lightweight; deterministic variation preserves each tile's appearance during relayout. Pointer position changes their highlights; the canvas stops rendering when idle or hidden.
- Clicking or tapping a letter scatters only its tiles. Reassembly starts after 2.8 seconds and takes 0.85 seconds. Letter buttons also support Enter and Space.
- Side cards still move to the front. Opening the active card drops every letter, waits for the tiles to land, then invokes the original card handler once. Navigation input is held during this sequence; Escape cancels it. A 2.2-second fallback prevents navigation from getting stuck if rendering stalls.
- Returning to the carousel restores the title. Resizing during an opening completes navigation safely.
- Reduced-motion users get a static mosaic, no falling animation, and immediate card navigation.

The heading retains its accessible name. The canvas is decorative and does not intercept pointer events. There are no new production dependencies or external asset requests.

## Integration contract

The enhancement watches `#root` for `.app .intro h1`. It relies on `.library-card.is-active`, `.nav-arrow`, `.progress-rail button`, and `.app.is-detail` from the deployed bundle. If a future app rebuild changes these selectors or replaces the heading, update the enhancement and rerun its browser checks. The click replay is guarded to avoid recursive opening or duplicate React events.

Tune `RETURN_DELAY`, `RETURN_DURATION`, and `GRAVITY` at the top of the module. Tile spacing comes from the heading's computed font size; the viewport floor is near the bottom of the screen.

## Browser checks

From the repository root, with Node.js installed:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/mosaic-title.cjs
```

The test starts its own local HTTP server. Set `CHROMIUM_PATH` if using an existing Chromium executable. It covers changing highlights, individual collapse/reformation, keyboard activation, delayed card opening, rapid clicks, Escape cancellation, returning to cards, narrow and landscape layouts, resizing during opening, reduced motion, and browser errors.

The refined gold material follows the user-supplied mosaic screenshot: hand-set irregular tiles, warm gold-leaf variation, dark joints, and subtle surface reflections. The reference imagery and colored border are not reproduced in the lettering.
