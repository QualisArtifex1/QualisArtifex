// Adds an "Erase all answers" button to a textbook exercises page.
// Each page saves its own answers whenever a box changes, so this empties every
// box and fires the same events; the page's own code then saves the empty answers.
(() => {
  const exportButton = document.querySelector('#printButton, #exportPdf, #printAnswers');
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'eraseAnswers';
  button.className = exportButton?.className || 'button';
  button.classList.add('erase-answers-button');
  button.textContent = 'Erase all answers';
  button.title = 'Clear every answer on this page';

  const style = document.createElement('style');
  style.textContent = `
    .erase-answers-button { background: #fff !important; color: #8f2f2f !important; border: 1px solid #8f2f2f !important; }
    .erase-answers-button:hover { background: #fbeaea !important; }
    .erase-answers-status { font: 600 13px system-ui, sans-serif; color: #1f7a4c; margin-left: 8px; }
    @media print { .erase-answers-button, .erase-answers-status { display: none !important; } }`;
  document.head.append(style);

  const status = document.createElement('span');
  status.className = 'erase-answers-status';
  status.setAttribute('role', 'status');

  if (exportButton) exportButton.after(button, status);
  else document.body.prepend(button, status);

  const answerFields = () => [...document.querySelectorAll('input, textarea, select')]
    .filter((field) => !field.closest('#conditions-quest, [id^="cq-"], .conditions-quest') && !['button', 'submit', 'reset', 'hidden', 'file'].includes(field.type));

  button.addEventListener('click', () => {
    const filled = answerFields().filter((f) => (f.type === 'checkbox' || f.type === 'radio' ? f.checked : f.value.trim() !== ''));
    if (!filled.length) {
      status.textContent = 'There are no answers to erase.';
      setTimeout(() => (status.textContent = ''), 3000);
      return;
    }
    if (!window.confirm(`Erase all ${filled.length} answer${filled.length === 1 ? '' : 's'} on this page? This can't be undone.`)) return;
    for (const field of answerFields()) {
      if (field.type === 'checkbox' || field.type === 'radio') field.checked = false;
      else if (field.tagName === 'SELECT') field.selectedIndex = 0;
      else field.value = '';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    status.textContent = 'All answers erased.';
    setTimeout(() => (status.textContent = ''), 3000);
  });
})();
