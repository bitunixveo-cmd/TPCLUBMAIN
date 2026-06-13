import { pageView } from './utils/gtm.js';
import {
  decorateInternalLinks,
  decorateLinkWithTracking,
  getTrackingData,
  initTracking
} from './utils/tracking.js';
import {
  trackEvent,
  trackCTA,
  trackModalOpen,
  trackModalClose,
  trackModalCTA
} from './utils/events.js';

initTracking();
decorateInternalLinks();
pageView();

// Expose on window for inline EJS onclick hooks and admin tooling
window.tpclubTrackEvent = trackEvent;
window.getTrackingData = getTrackingData;

// ── CTA auto-binding ──────────────────────────────────────────────────────────
// Any element with data-track-cta fires cta_click with its visible text.
document.querySelectorAll('[data-track-cta]').forEach((el) => {
  el.addEventListener('click', () => {
    decorateLinkWithTracking(el);
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

// ── Community screenshot modal ────────────────────────────────────────────────

const communityModal = document.querySelector('[data-community-modal]');
const communityModalCard = document.querySelector('[data-community-modal-card]');
const communityModalImage = document.querySelector('[data-community-modal-image]');
const communityModalTitle = document.querySelector('[data-community-modal-title]');
const communityModalCloseButtons = document.querySelectorAll('[data-community-modal-close]');
const communityModalOpenButtons = document.querySelectorAll('[data-community-modal-open]');
let lastCommunityModalTrigger = null;

if (communityModal && communityModalCard && communityModalImage && communityModalTitle) {
  const openCommunityModal = (button) => {
    const imageSrc = button.dataset.communityImage;
    const imageTitle = button.dataset.communityTitle || 'Community screenshot';

    if (!imageSrc) return;

    lastCommunityModalTrigger = button;
    communityModalImage.src = imageSrc;
    communityModalImage.alt = imageTitle;
    communityModalTitle.textContent = imageTitle;
    communityModal.hidden = false;
    document.body.style.overflow = 'hidden';
    communityModalCard.focus();
    trackModalOpen('community_image_modal', {
      image_title: imageTitle,
      path: window.location.pathname
    });
  };

  const closeCommunityModal = () => {
    communityModal.hidden = true;
    communityModalImage.src = '';
    document.body.style.overflow = '';
    if (lastCommunityModalTrigger) {
      lastCommunityModalTrigger.focus();
    }
    trackModalClose('community_image_modal', {
      path: window.location.pathname
    });
  };

  communityModalOpenButtons.forEach((button) => {
    button.addEventListener('click', () => openCommunityModal(button));
  });

  communityModalCloseButtons.forEach((button) => {
    button.addEventListener('click', closeCommunityModal);
  });

  const communityModalCta = communityModal.querySelector('.btn-primary');
  if (communityModalCta) {
    communityModalCta.addEventListener('click', () => {
      trackModalCTA('community_image_modal', {
        button_text: communityModalCta.textContent?.trim() || 'Join Telegram',
        path: window.location.pathname
      });
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !communityModal.hidden) {
      closeCommunityModal();
    }
  });
}

// ── Screenshot slider (Meta landing) ──────────────────────────────────────────

document.querySelectorAll('[data-slider]').forEach((slider) => {
  const viewport = slider.querySelector('[data-slider-viewport]');
  const track = slider.querySelector('[data-slider-track]');
  const slides = Array.from(slider.querySelectorAll('[data-slide]'));
  const prevButton = slider.querySelector('[data-slider-prev]');
  const nextButton = slider.querySelector('[data-slider-next]');
  const dotsWrap = slider.parentElement?.querySelector('[data-slider-dots]');

  if (!viewport || !track || slides.length === 0) return;

  let index = 0;

  const slidesPerView = () => {
    const slideWidth = slides[0].getBoundingClientRect().width || 1;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    return Math.max(1, Math.round(viewport.getBoundingClientRect().width / (slideWidth + gap)));
  };

  const maxIndex = () => Math.max(0, slides.length - slidesPerView());

  const dots = [];
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'meta-slider-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });
  }

  function update() {
    const slideWidth = slides[0].getBoundingClientRect().width || 0;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    track.style.transform = `translateX(-${index * (slideWidth + gap)}px)`;

    if (prevButton) prevButton.disabled = index <= 0;
    if (nextButton) nextButton.disabled = index >= maxIndex();

    dots.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function goTo(next) {
    index = Math.min(Math.max(next, 0), maxIndex());
    update();
  }

  prevButton?.addEventListener('click', () => goTo(index - 1));
  nextButton?.addEventListener('click', () => goTo(index + 1));

  slider.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      goTo(index - 1);
    } else if (event.key === 'ArrowRight') {
      goTo(index + 1);
    }
  });

  let startX = 0;
  let dragging = false;
  viewport.addEventListener('touchstart', (event) => {
    startX = event.touches[0].clientX;
    dragging = true;
  }, { passive: true });
  viewport.addEventListener('touchend', (event) => {
    if (!dragging) return;
    dragging = false;
    const deltaX = event.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) > 40) {
      goTo(deltaX < 0 ? index + 1 : index - 1);
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => goTo(index), 150);
  });

  update();
});
