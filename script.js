const menuButton = document.querySelector('.menu-button');
const siteMenu = document.querySelector('.site-menu');

const tripStatus = document.querySelector('[data-trip-status]');
const tripStatusEyebrow = tripStatus?.querySelector('[data-trip-status-eyebrow]');
const tripStatusTitle = tripStatus?.querySelector('[data-trip-status-title]');
const tripStatusLead = tripStatus?.querySelector('[data-trip-status-lead]');
const tripStatusWeather = tripStatus?.querySelector('[data-trip-status-weather]');
const tripStatusActions = tripStatus?.querySelector('[data-trip-status-actions]');
const tripDayCards = [...document.querySelectorAll('.day-card[data-weather-date]')];
let activeTripDate = null;

function tokyoDateString() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function tripDaysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

function previewTripDate() {
  const value = new URLSearchParams(window.location.search).get('preview-date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
}

function tripAction(hint, label, href, primary = false) {
  return `<a class="trip-status-action${primary ? ' trip-status-action-primary' : ''}" href="${href}"><span>${hint}</span><strong>${label}</strong></a>`;
}

function initializeTripStatus() {
  if (!tripStatus || tripDayCards.length === 0) return;
  const today = previewTripDate() || tokyoDateString();
  const firstDate = tripDayCards[0].dataset.weatherDate;
  const lastDate = tripDayCards[tripDayCards.length - 1].dataset.weatherDate;

  if (today < firstDate) {
    const remainingDays = tripDaysBetween(today, firstDate);
    tripStatus.dataset.tripPhase = 'before';
    tripStatusEyebrow.textContent = 'TRIP COUNTDOWN';
    tripStatusTitle.textContent = `距離東京旅行還有 ${remainingDays} 天`;
    tripStatusLead.textContent = '';
    tripStatusWeather.hidden = true;
    tripStatusActions.innerHTML = [
      tripAction('行程規劃好了嗎？', '查看每日行程', '#itinerary', true),
      tripAction('東西收拾好了嗎？', '查看行前確認清單', '#essentials')
    ].join('');
  } else if (today <= lastDate) {
    const card = tripDayCards.find((item) => item.dataset.weatherDate === today);
    if (!card) return;
    const dayIndex = tripDayCards.indexOf(card) + 1;
    const title = card.querySelector('summary strong')?.textContent.trim().replace(/^D\d+｜/, '') || '今日行程';
    const summary = card.querySelector('summary small')?.textContent.trim() || '查看今天的完整安排';
    activeTripDate = today;
    tripStatus.dataset.tripPhase = 'during';
    tripStatusEyebrow.textContent = `TODAY・D${dayIndex}`;
    tripStatusTitle.textContent = title;
    tripStatusLead.textContent = summary;
    tripStatusWeather.hidden = false;
    tripStatusActions.innerHTML = tripAction('今天的安排都在這裡', '查看今天行程', `#trip-day-${dayIndex}`, true);
    card.id = `trip-day-${dayIndex}`;
  } else {
    tripStatus.dataset.tripPhase = 'after';
    tripStatusEyebrow.textContent = 'TRIP MEMORIES';
    tripStatusTitle.textContent = '東京旅行，おつかれさまでした';
    tripStatusLead.textContent = '6 天 5 夜的旅程已完成，隨時回來看看走過的每一天。';
    tripStatusWeather.hidden = true;
    tripStatusActions.innerHTML = tripAction('再走一次東京', '回顧每日行程', '#itinerary', true);
  }

  tripStatus.hidden = false;
}

window.addEventListener('tripweatherupdate', (event) => {
  if (!tripStatusWeather || event.detail.date !== activeTripDate) return;
  const { icon, summary, location } = event.detail;
  tripStatusWeather.querySelector('[data-trip-weather-icon]').textContent = icon || '';
  tripStatusWeather.querySelector('[data-trip-weather-summary]').textContent = summary;
  tripStatusWeather.querySelector('[data-trip-weather-location]').textContent = location;
});

tripStatusActions?.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  const target = link && document.querySelector(link.getAttribute('href'));
  if (!target?.classList.contains('day-card')) return;
  event.preventDefault();
  target.open = true;
  history.replaceState(null, '', link.getAttribute('href'));
  requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
});

initializeTripStatus();

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

const couponFilters = document.querySelectorAll('[data-coupon-filter]');
const couponCards = document.querySelectorAll('[data-coupon-category]');
const couponFilterBar = document.querySelector('.coupon-filters');

function updateCouponFilterFades() {
  const edgeTolerance = 2;
  const maxScrollLeft = couponFilterBar.scrollWidth - couponFilterBar.clientWidth;

  couponFilterBar.classList.toggle('has-left-fade', couponFilterBar.scrollLeft > edgeTolerance);
  couponFilterBar.classList.toggle('has-right-fade', couponFilterBar.scrollLeft < maxScrollLeft - edgeTolerance);
}

couponFilterBar.addEventListener('scroll', updateCouponFilterFades, { passive: true });
window.addEventListener('resize', updateCouponFilterFades);
requestAnimationFrame(updateCouponFilterFades);

couponFilters.forEach((button) => {
  button.addEventListener('click', () => {
    const selectedCategory = button.dataset.couponFilter;

    couponFilters.forEach((filter) => {
      const isActive = filter === button;
      filter.classList.toggle('is-active', isActive);
      filter.setAttribute('aria-pressed', String(isActive));
    });

    couponCards.forEach((card) => {
      const isVisible = selectedCategory === 'all'
        || (selectedCategory === 'featured' && card.hasAttribute('data-coupon-featured'))
        || card.dataset.couponCategory === selectedCategory;
      card.hidden = !isVisible;
    });
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
