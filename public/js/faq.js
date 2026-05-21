document.querySelectorAll('.faq-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const panelId = trigger.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

    trigger.setAttribute('aria-expanded', String(!isExpanded));
    if (panel) {
      panel.hidden = isExpanded;
    }
  });
});
