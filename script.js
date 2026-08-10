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
