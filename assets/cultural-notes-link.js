(() => {
  const culturalNotesUrl =
    "https://pliny-vergil-cultural-notes.qualisartifex.chatgpt.site/";

  function addCulturalNotesLink() {
    const heading = [...document.querySelectorAll("h2")].find(
      (element) => element.textContent.trim() === "AP Reading",
    );

    if (!heading) return;

    const panel =
      heading.closest('[role="region"]') ||
      heading.closest("section") ||
      heading.parentElement;
    if (!panel || panel.querySelector("[data-cultural-notes-link]")) return;

    const existingLink = [...panel.querySelectorAll("a")].find(
      (element) => element.textContent.trim() === "Commentary",
    );

    if (!existingLink) return;

    const culturalNotesLink = existingLink.cloneNode(true);
    culturalNotesLink.href = culturalNotesUrl;
    culturalNotesLink.textContent = "Cultural Notes";
    culturalNotesLink.dataset.culturalNotesLink = "true";
    culturalNotesLink.setAttribute(
      "aria-label",
      "Open Pliny and Vergil Cultural Notes",
    );
    existingLink.parentElement.append(culturalNotesLink);
  }

  const observer = new MutationObserver(addCulturalNotesLink);
  observer.observe(document.body, { childList: true, subtree: true });
  addCulturalNotesLink();
})();
