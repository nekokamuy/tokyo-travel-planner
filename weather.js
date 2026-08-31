(() => {
  const CACHE_KEY = 'tokyo-trip-weather-v1';
  const FORECAST_DAYS = 16;
  const FUTURE_TTL = 6 * 60 * 60 * 1000;
  const TODAY_TTL = 2 * 60 * 60 * 1000;
  const cards = [...document.querySelectorAll('[data-weather-date]')];
  const labels = {
    0:['☀️','晴'],1:['🌤️','大致晴朗'],2:['⛅','多雲'],3:['☁️','陰'],45:['🌫️','有霧'],48:['🌫️','霧淞'],
    51:['🌦️','毛毛雨'],53:['🌦️','毛毛雨'],55:['🌧️','毛毛雨'],56:['🌧️','凍雨'],57:['🌧️','凍雨'],
    61:['🌦️','小雨'],63:['🌧️','雨'],65:['🌧️','大雨'],66:['🌧️','凍雨'],67:['🌧️','凍雨'],
    71:['🌨️','小雪'],73:['🌨️','雪'],75:['❄️','大雪'],77:['🌨️','雪粒'],80:['🌦️','陣雨'],
    81:['🌧️','陣雨'],82:['🌧️','強陣雨'],85:['🌨️','陣雪'],86:['❄️','強陣雪'],95:['⛈️','雷雨'],
    96:['⛈️','雷雨伴冰雹'],99:['⛈️','強雷雨伴冰雹']
  };

  function tokyoDate() {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function daysBetween(from, to) {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || { version:1, days:{} }; }
    catch { return { version:1, days:{} }; }
  }

  function writeCache(cache) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
    catch { /* Storage can be disabled; live forecasts remain available. */ }
  }

  function viewFor(card) {
    let view = card.querySelector('.day-weather');
    if (view) return view;
    view = document.createElement('span');
    view.className = 'day-weather';
    view.setAttribute('aria-live', 'polite');
    view.innerHTML = '<span class="day-weather-main"><span class="day-weather-icon" aria-hidden="true">—</span><span class="day-weather-temp">天氣載入中</span></span><span class="day-weather-rain"></span><span class="day-weather-meta">請稍候</span>';
    card.querySelector('.day-number').append(view);
    return view;
  }

  function setStatus(card, message, state = 'idle') {
    const view = viewFor(card);
    view.querySelector('.day-weather-icon').textContent = '';
    view.querySelector('.day-weather-temp').textContent = message;
    view.querySelector('.day-weather-rain').textContent = '';
    const meta = view.querySelector('.day-weather-meta');
    meta.textContent = card.dataset.weatherLocation;
    meta.dataset.state = state;
    view.setAttribute('aria-label', `${card.dataset.weatherLocation}：${message}`);
    window.dispatchEvent(new CustomEvent('tripweatherupdate', { detail: {
      date:card.dataset.weatherDate, icon:'', summary:message, location:card.dataset.weatherLocation, state
    } }));
  }

  function formatUpdated(iso) {
    return new Intl.DateTimeFormat('zh-TW', { timeZone:'Asia/Tokyo', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date(iso));
  }

  function render(card, data, state = 'fresh') {
    const view = viewFor(card);
    const [icon, label] = labels[data.weatherCode] || ['🌡️','天氣'];
    view.querySelector('.day-weather-icon').textContent = icon;
    view.querySelector('.day-weather-temp').textContent = `${Math.round(data.temperatureMin)}–${Math.round(data.temperatureMax)}°C`;
    view.querySelector('.day-weather-rain').textContent = `降雨 ${Math.round(data.precipitationProbability)}%`;
    const meta = view.querySelector('.day-weather-meta');
    const prefix = data.isFinal ? '最終紀錄' : state === 'cached' ? '離線資料' : '預報';
    meta.textContent = `${card.dataset.weatherLocation}・${prefix} ${formatUpdated(data.fetchedAt)} 更新`;
    meta.dataset.state = state;
    view.setAttribute('aria-label', `${card.dataset.weatherLocation}，${label}，最低 ${Math.round(data.temperatureMin)} 度，最高 ${Math.round(data.temperatureMax)} 度，降雨機率 ${Math.round(data.precipitationProbability)}%`);
    window.dispatchEvent(new CustomEvent('tripweatherupdate', { detail: {
      date:card.dataset.weatherDate,
      icon,
      summary:`${label}・${Math.round(data.temperatureMin)}–${Math.round(data.temperatureMax)}°C・降雨 ${Math.round(data.precipitationProbability)}%`,
      location:card.dataset.weatherLocation,
      state
    } }));
  }

  async function fetchForecast(card) {
    const params = new URLSearchParams({
      latitude:card.dataset.weatherLatitude, longitude:card.dataset.weatherLongitude,
      daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone:'Asia/Tokyo', forecast_days:String(FORECAST_DAYS)
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
    const result = await response.json();
    const index = result.daily?.time?.indexOf(card.dataset.weatherDate) ?? -1;
    if (index < 0) throw new Error('Requested date is outside forecast response');
    return {
      location:card.dataset.weatherLocation, weatherCode:result.daily.weather_code[index],
      temperatureMin:result.daily.temperature_2m_min[index], temperatureMax:result.daily.temperature_2m_max[index],
      precipitationProbability:result.daily.precipitation_probability_max[index] ?? 0,
      fetchedAt:new Date().toISOString(), isFinal:false
    };
  }

  async function updateCard(card, cache, today) {
    const date = card.dataset.weatherDate;
    const offset = daysBetween(today, date);
    const cached = cache.days[date];
    if (offset < 0) {
      if (cached) { cached.isFinal = true; render(card, cached); writeCache(cache); }
      else setStatus(card, '行程已結束');
      return;
    }
    if (offset >= FORECAST_DAYS) { setStatus(card, '尚未進入天氣預報範圍'); return; }
    const ttl = offset === 0 ? TODAY_TTL : FUTURE_TTL;
    if (cached && Date.now() - Date.parse(cached.fetchedAt) < ttl) { render(card, cached); return; }
    if (!navigator.onLine) {
      if (cached) render(card, cached, 'cached'); else setStatus(card, '離線・尚無資料', 'error');
      return;
    }
    if (cached) render(card, cached, 'cached'); else setStatus(card, '正在更新預報');
    try {
      const forecast = await fetchForecast(card);
      cache.days[date] = forecast; writeCache(cache); render(card, forecast);
    } catch {
      if (cached) render(card, cached, 'cached'); else setStatus(card, '暫時無法取得天氣', 'error');
    }
  }

  const cache = readCache();
  const today = tokyoDate();
  cards.forEach(viewFor);
  Promise.allSettled(cards.map((card) => updateCard(card, cache, today)));
  window.addEventListener('online', () => {
    const latest = readCache();
    cards.forEach((card) => updateCard(card, latest, tokyoDate()));
  });
})();
