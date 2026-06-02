import { pageView, trackEvent } from './utils/gtm.js';
import { getTrackingData, initTracking } from './utils/tracking.js';

initTracking();
pageView();

window.tpclubTrackEvent = trackEvent;
window.getTrackingData = getTrackingData;

const heroModal = document.querySelector('[data-hero-modal]');
const heroModalOpen = document.querySelector('[data-hero-modal-open]');
const heroModalCard = document.querySelector('[data-hero-modal-card]');
const heroModalCloseButtons = document.querySelectorAll('[data-hero-modal-close]');

if (heroModal && heroModalOpen && heroModalCard) {
  const openHeroModal = () => {
    heroModal.hidden = false;
    document.body.style.overflow = 'hidden';
    heroModalCard.focus();
    trackEvent('hero_image_modal_open', {
      path: window.location.pathname
    });
  };

  const closeHeroModal = () => {
    heroModal.hidden = true;
    document.body.style.overflow = '';
    heroModalOpen.focus();
  };

  heroModalOpen.addEventListener('click', openHeroModal);
  heroModalCloseButtons.forEach((button) => {
    button.addEventListener('click', closeHeroModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !heroModal.hidden) {
      closeHeroModal();
    }
  });
}
