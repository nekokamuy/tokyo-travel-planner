const menuButton = document.querySelector('.menu-button');
const siteMenu = document.querySelector('.site-menu');

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '開啟導覽選單');
  siteMenu.hidden = true;
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  if (isOpen) {
    closeMenu();
    return;
  }

  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.setAttribute('aria-label', '關閉導覽選單');
  siteMenu.hidden = false;
});

siteMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('click', (event) => {
  if (!event.target.closest('.menu-wrap')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

const backToTop = document.querySelector('.back-to-top');

function updateBackToTopVisibility() {
  backToTop.classList.toggle('is-visible', window.scrollY > 420);
}

window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
updateBackToTopVisibility();

document.querySelectorAll('.ticket-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));

    if (!target) return;

    history.replaceState(null, '', link.getAttribute('href'));
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

document.querySelectorAll('.ticket-return').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    const dayCard = target?.closest('.day-card');

    if (dayCard) dayCard.open = true;

    requestAnimationFrame(() => {
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
});

document.querySelectorAll('.day-card').forEach((card) => {
  card.addEventListener('toggle', () => {
    if (!card.open) return;
    const previouslyOpenCards = [...document.querySelectorAll('.day-card[open]')].filter(
      (other) => other !== card,
    );

    previouslyOpenCards.forEach((other) => {
      if (other !== card) other.open = false;
    });

    if (previouslyOpenCards.length) {
      requestAnimationFrame(() => {
        card.querySelector('summary').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });
});
