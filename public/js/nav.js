const header = document.querySelector('[data-nav]');
const toggle = document.querySelector('[data-nav-toggle]');
const menu = document.querySelector('[data-nav-menu]');

if (header && toggle && menu) {
  const setOpen = (isOpen) => {
    header.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  toggle.addEventListener('click', () => {
    setOpen(!header.classList.contains('is-open'));
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      setOpen(false);
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });
}
