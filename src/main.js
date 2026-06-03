import { pageView } from './utils/gtm.js';
import { getTrackingData, initTracking } from './utils/tracking.js';
import {
  trackEvent,
  trackCTA,
  trackModalOpen,
  trackModalClose,
  trackModalCTA
} from './utils/events.js';

initTracking();
pageView();

// Expose on window for inline EJS onclick hooks and admin tooling
window.tpclubTrackEvent = trackEvent;
window.getTrackingData = getTrackingData;

// ── CTA auto-binding ──────────────────────────────────────────────────────────
// Any element with data-track-cta fires cta_click with its visible text.
document.querySelectorAll('[data-track-cta]').forEach((el) => {
  el.addEventListener('click', () => {
    const label = el.dataset.trackCta || el.textContent?.trim() || 'CTA';
    trackCTA(label, { cta_href: el.href || '' });
  });
});

// ── Hero image modal ──────────────────────────────────────────────────────────

const heroModal = document.querySelector('[data-hero-modal]');
const heroModalOpen = document.querySelector('[data-hero-modal-open]');
const heroModalCard = document.querySelector('[data-hero-modal-card]');
const heroModalCloseButtons = document.querySelectorAll('[data-hero-modal-close]');
const heroModalCta = document.querySelector('[data-hero-modal] .btn-primary');

if (heroModal && heroModalOpen && heroModalCard) {
  const openHeroModal = () => {
    heroModal.hidden = false;
    document.body.style.overflow = 'hidden';
    heroModalCard.focus();
    trackModalOpen('hero_image_modal', {
      path: window.location.pathname
    });
  };

  const closeHeroModal = () => {
    heroModal.hidden = true;
    document.body.style.overflow = '';
    heroModalOpen.focus();
    trackModalClose('hero_image_modal', {
      path: window.location.pathname
    });
  };

  heroModalOpen.addEventListener('click', openHeroModal);

  heroModalCloseButtons.forEach((button) => {
    button.addEventListener('click', closeHeroModal);
  });

  if (heroModalCta) {
    heroModalCta.addEventListener('click', () => {
      trackModalCTA('hero_image_modal', {
        button_text: heroModalCta.textContent?.trim() || 'Join Telegram',
        path: window.location.pathname
      });
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !heroModal.hidden) {
      closeHeroModal();
    }
  });
}
