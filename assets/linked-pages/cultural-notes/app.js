const app = document.querySelector("#app");
let notes = [];
let fontScale = 1;
let query = "";

const AUTHORS = {
  pliny: {
    name: "Pliny",
    fullName: "Gaius Plinius Caecilius Secundus",
    work: "Epistulae",
    range: "Lessons 1–32",
    image: "./images/pliny.jpg",
    imageAlt: "Renaissance sculpture of Pliny the Younger at Como Cathedral",
    imageHref: "https://commons.wikimedia.org/wiki/File:Plinio_Il_Giovane.jpg",
    imageCredit: "Riccardo Ortelli / Wikimedia Commons, CC BY-SA 4.0",
  },
  vergil: {
    name: "Vergil",
    fullName: "Publius Vergilius Maro",
    work: "Aeneid",
    range: "Lessons 33–70",
    image: "./images/vergil.jpg",
    imageAlt: "Marble portrait traditionally identified as Vergil",
    imageHref: "https://commons.wikimedia.org/wiki/File:Publius_Vergilius_Maro.jpg",
    imageCredit: "Roman sculptor, public domain / Wikimedia Commons",
  },
};

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[character]));

function richText(value = "") {
  return escapeHtml(value).replace(/(\d+)(st|nd|rd|th)\b/gi, '$1<sup class="ordinal-suffix">$2</sup>');
}

function cleanSubtitle(value = "") {
  return value.replace(/\s+\d+$/, "");
}

function isInlineHeading(text) {
  return text.length < 115 && /^[A-Z]/.test(text) && !/^\d+[.)]/.test(text) && (!/[.!:]$/.test(text) || /\?$/.test(text));
}

function getRoute() {
  const [author, id] = decodeURIComponent(location.hash.slice(1)).split("/");
  return AUTHORS[author] ? { author, id } : null;
}

function go(author, id) {
  location.hash = `${author}/${id || ""}`;
}

function entriesFor(author) {
  return notes.filter((entry) => entry.author === author).map((entry) =>
    author === "vergil" && entry.lesson === 33 ? { ...entry, label: "Introduction" } : entry,
  );
}

function renderLanding() {
  app.innerHTML = `
    <main class="landing">
      <img class="landing-art" src="./images/og.png" alt="Museum-style preview of Pliny and Vergil cultural notes" />
      <div class="landing-shade"></div>
      <header class="landing-header">
        <a class="home-link" href="../../../index.html">← Qualis Artifex</a>
        <span>AP Latin · Cultural &amp; Literary Notes</span>
      </header>
      <nav class="landing-actions" aria-label="Choose an author">
        <button data-author="pliny" type="button"><span>I · Epistulae</span><strong>Enter Pliny</strong><b>→</b></button>
        <button data-author="vergil" type="button"><span>II · Aeneid</span><strong>Enter Vergil</strong><b>→</b></button>
      </nav>
    </main>`;
  app.querySelectorAll("[data-author]").forEach((button) => button.addEventListener("click", () => {
    const entries = entriesFor(button.dataset.author);
    go(button.dataset.author, entries[0]?.id);
  }));
}

function renderTimeline(timeline) {
  if (!timeline) return "";
  return `<ol class="timeline">${timeline.map((item) => `<li><time>${richText(item.date)}</time><span>${richText(item.event)}</span></li>`).join("")}</ol>`;
}

function renderTable(table) {
  if (!table) return "";
  const headers = table.headers.map((header) => `<th>${richText(header)}</th>`).join("");
  const rows = table.rows.map((row, index) => `<tr class="${table.highlightRows?.includes(index) ? "highlight-row" : ""}">${row.map((cell) => `<td>${richText(cell)}</td>`).join("")}</tr>`).join("");
  return `<div class="note-table-wrap"><table class="note-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderContent(content = []) {
  return content.map((item) => {
    if (item.type === "paragraph") return `<p class="${item.numbered ? "numbered" : ""}">${richText(item.text)}</p>`;
    const lines = item.lines.map((line) => `<div class="verse-line"><span>${line.segments.map((segment) => segment.emphasis ? `<strong class="source-emphasis">${escapeHtml(segment.text)}</strong>` : `<span>${escapeHtml(segment.text)}</span>`).join("")}</span>${line.line ? `<small>${escapeHtml(line.line)}</small>` : ""}</div>`).join("");
    return `<figure class="verse-quotation"><div class="verse-lines">${lines}</div>${item.citation ? `<figcaption>${richText(item.citation)}</figcaption>` : ""}</figure>`;
  }).join("");
}

function renderBlock(block) {
  const heading = block.heading !== "Context & analysis" ? `<h3>${richText(block.heading)}</h3>` : "";
  const paragraphs = block.paragraphs.map((paragraph) => isInlineHeading(paragraph)
    ? `<h4>${richText(paragraph)}</h4>`
    : `<p class="${/^\d+[.)]/.test(paragraph) ? "numbered" : ""}">${richText(paragraph)}</p>`).join("");
  return `<section class="note-block ${block.variant === "boxed" ? "boxed-note" : ""}">${heading}${renderTimeline(block.timeline)}${renderTable(block.table)}${paragraphs}${renderContent(block.content)}</section>`;
}

function renderFigures(figures = []) {
  if (!figures.length) return "";
  return `<section class="lesson-figures" aria-label="Figures from the commentary"><p class="figure-kicker">From the commentary</p>${figures.map((figure) => {
    const src = figure.src.replace(/^\/figures\//, "./images/figures/");
    return `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(figure.alt)}" /><figcaption><span>${richText(figure.caption)}</span><small>${richText(figure.credit)}</small></figcaption></figure>`;
  }).join("")}</section>`;
}

function lessonNumber(entry) {
  return entry.lesson === 33 || !entry.lesson ? "INTRO" : String(entry.lesson).padStart(2, "0");
}

function renderStudy(author, requestedId) {
  const config = AUTHORS[author];
  const entries = entriesFor(author);
  const selected = entries.find((entry) => entry.id === requestedId) || entries[0];
  if (!selected) return renderLanding();
  const selectedIndex = entries.findIndex((entry) => entry.id === selected.id);
  const visible = entries.filter((entry) => `${entry.label} ${entry.passage} ${entry.subtitle}`.toLowerCase().includes(query.trim().toLowerCase()));
  const blocks = selected.blocks.length ? `<div class="note-blocks">${selected.blocks.map(renderBlock).join("")}</div>` : `<div class="empty-note"><span aria-hidden="true">∅</span><h3>No qualifying notes on this spread</h3><p>This lesson’s facing page contains vocabulary or grammar material only, so nothing has been carried into this literary and cultural collection.</p></div>`;

  app.innerHTML = `
    <main class="study-shell ${author}" style="--reader-scale:${fontScale}">
      <aside class="identity-panel">
        <a class="site-mark" href="#"><span class="site-mark-kicker">AP LATIN</span><span>Cultural &amp;</span><span>Literary Notes</span></a>
        <a class="back-link" href="../../../index.html">← Back to Qualis Artifex</a>
        <nav class="author-switch" aria-label="Choose an author">
          <button class="${author === "pliny" ? "active" : ""}" data-switch="pliny" type="button"><span>I</span> Pliny</button>
          <button class="${author === "vergil" ? "active" : ""}" data-switch="vergil" type="button"><span>II</span> Vergil</button>
        </nav>
        <figure class="portrait"><img src="${config.image}" alt="${escapeHtml(config.imageAlt)}" /><figcaption>${escapeHtml(config.fullName)}</figcaption></figure>
        <div class="identity-footer"><span>${config.work}</span><span>${config.range}</span></div>
      </aside>
      <aside class="lesson-panel">
        <header><div><p class="eyebrow">${config.name} study notes</p><h1>${config.work}</h1></div><span class="lesson-count">${entries.length} entries</span></header>
        <label class="search-box"><span>Find a lesson</span><input id="lesson-search" type="search" value="${escapeHtml(query)}" placeholder="Number, book, or topic" /></label>
        <label class="mobile-select"><span>Current lesson</span><select id="lesson-select">${entries.map((entry) => `<option value="${entry.id}" ${entry.id === selected.id ? "selected" : ""}>${escapeHtml(entry.label)}: ${escapeHtml(entry.passage)}</option>`).join("")}</select></label>
        <div class="lesson-list" aria-label="${config.name} lessons">${visible.length ? visible.map((entry) => `<button class="${entry.id === selected.id ? "selected" : ""}" data-entry="${entry.id}" type="button"><span class="lesson-number">${lessonNumber(entry)}</span><span class="lesson-copy"><strong>${richText(entry.passage)}</strong><small>${richText(cleanSubtitle(entry.subtitle))}</small></span><span class="lesson-arrow" aria-hidden="true">→</span></button>`).join("") : `<p class="no-results">No matching lessons.</p>`}</div>
      </aside>
      <section class="reader-panel" aria-live="polite">
        <header class="reader-header"><div class="reader-meta"><span>${escapeHtml(selected.label)}</span><span>${escapeHtml(selected.source)}</span></div><div class="reader-tools" aria-label="Reading controls"><button data-font="down" type="button" aria-label="Decrease text size">A−</button><button data-font="up" type="button" aria-label="Increase text size">A+</button></div></header>
        <article class="notes-article"><div class="title-block"><p>${selected.lesson === 33 ? "LESSON 33 · VERGIL" : escapeHtml(selected.label.toUpperCase())}</p><h2>${richText(selected.passage)}</h2><p class="subtitle">${richText(cleanSubtitle(selected.subtitle))}</p></div>${blocks}${renderFigures(selected.figures)}</article>
        <footer class="reader-footer"><button data-move="-1" type="button" ${selectedIndex === 0 ? "disabled" : ""}>← Previous</button><div class="progress" aria-label="Entry ${selectedIndex + 1} of ${entries.length}"><span style="width:${((selectedIndex + 1) / entries.length) * 100}%"></span></div><button data-move="1" type="button" ${selectedIndex === entries.length - 1 ? "disabled" : ""}>Next →</button></footer>
        <div class="credits"><p>Commentary adapted from Geoffrey Steadman, <em>College Pliny and Vergil</em> (2023), used under CC BY-NC-SA 3.0. Vocabulary and grammar notes omitted.</p><p>Portrait: <a href="${config.imageHref}" target="_blank" rel="noreferrer">${escapeHtml(config.imageCredit)}</a>.</p></div>
      </section>
    </main>`;

  app.querySelectorAll("[data-switch]").forEach((button) => button.addEventListener("click", () => go(button.dataset.switch, entriesFor(button.dataset.switch)[0]?.id)));
  app.querySelectorAll("[data-entry]").forEach((button) => button.addEventListener("click", () => go(author, button.dataset.entry)));
  app.querySelector("#lesson-select").addEventListener("change", (event) => go(author, event.target.value));
  app.querySelector("#lesson-search").addEventListener("input", (event) => { query = event.target.value; renderStudy(author, selected.id); const input = app.querySelector("#lesson-search"); input.focus(); input.setSelectionRange(query.length, query.length); });
  app.querySelectorAll("[data-font]").forEach((button) => button.addEventListener("click", () => { fontScale = button.dataset.font === "up" ? Math.min(1.3, fontScale + .1) : Math.max(.9, fontScale - .1); renderStudy(author, selected.id); }));
  app.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => { const next = entries[selectedIndex + Number(button.dataset.move)]; if (next) go(author, next.id); }));
}

function renderRoute() {
  const route = getRoute();
  route ? renderStudy(route.author, route.id) : renderLanding();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

fetch("./notes.json")
  .then((response) => { if (!response.ok) throw new Error("Notes could not be loaded."); return response.json(); })
  .then((data) => { notes = data; renderRoute(); window.addEventListener("hashchange", renderRoute); })
  .catch((error) => { app.innerHTML = `<div class="loading">${escapeHtml(error.message)}</div>`; });
