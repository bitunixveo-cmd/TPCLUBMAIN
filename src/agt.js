import { trackTelegramClick } from './utils/events.js';

document.querySelectorAll('[data-track-cta]').forEach((element) => {
  element.addEventListener('click', () => {
    trackTelegramClick({
      cta_label: element.getAttribute('data-track-cta') || 'TP Club Meta Landing Telegram CTA',
      cta_location: 'meta_landing'
    });
  });
});
