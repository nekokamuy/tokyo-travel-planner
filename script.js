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
const siteNav = document.querySelector('.nav');

function updateBackToTopVisibility() {
  backToTop.classList.toggle('is-visible', window.scrollY > 420);
}

function updateNavigationState() {
  siteNav.classList.toggle('is-sticky', window.scrollY > 8);
}

window.addEventListener('scroll', () => {
  updateBackToTopVisibility();
  updateNavigationState();
}, { passive: true });
updateBackToTopVisibility();
updateNavigationState();

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

document.querySelectorAll('.food-reference a').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    const dayCard = target?.closest('.day-card');

    if (!target) return;

    if (dayCard) dayCard.open = true;
    history.replaceState(null, '', link.getAttribute('href'));

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
});

document.querySelector('.collapse-days').addEventListener('click', () => {
  document.querySelectorAll('.day-card[open]').forEach((card) => {
    card.open = false;
  });
});

const checklistStorageKey = 'tokyo-trip-preflight-checklist-v1';
const checklistInputs = document.querySelectorAll('[data-checklist-id]');
let savedChecklist = {};

try {
  savedChecklist = JSON.parse(localStorage.getItem(checklistStorageKey)) || {};
} catch {
  savedChecklist = {};
}

checklistInputs.forEach((input) => {
  input.checked = savedChecklist[input.dataset.checklistId] === true;
  input.addEventListener('change', () => {
    savedChecklist[input.dataset.checklistId] = input.checked;
    localStorage.setItem(checklistStorageKey, JSON.stringify(savedChecklist));
  });
});
