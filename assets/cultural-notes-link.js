(() => {
  const culturalNotesUrl = "./assets/linked-pages/cultural-notes/index.html";

  function addCulturalNotesLink() {
    const existingCulturalNotesLinks = [
      ...document.querySelectorAll("[data-cultural-notes-link]"),
    ];
    const heading = [...document.querySelectorAll("h2")].find(
      (element) => element.textContent.trim() === "AP Reading",
    );

    if (!heading) {
      existingCulturalNotesLinks.forEach((link) => link.remove());
      return;
    }

    const panel =
      heading.closest('[role="region"]') ||
      heading.closest("section") ||
      heading.parentElement;
    if (!panel) {
      existingCulturalNotesLinks.forEach((link) => link.remove());
      return;
    }

    existingCulturalNotesLinks
      .filter((link) => !panel.contains(link))
      .forEach((link) => link.remove());

    if (panel.querySelector("[data-cultural-notes-link]")) return;

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
