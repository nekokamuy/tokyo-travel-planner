(() => {
  const converter = document.querySelector('[data-currency-converter]');
  if (!converter) return;

  const API_URL = 'https://open.er-api.com/v6/latest/JPY';
  const CACHE_KEY = 'tokyo-guide:exchange-rate:v1';
  const INPUT_KEY = 'tokyo-guide:currency-input:v1';
  const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
  const requestTimeout = 8000;

  const jpyInput = converter.querySelector('#currency-jpy');
  const twdInput = converter.querySelector('#currency-twd');
  const rateText = converter.querySelector('#currency-rate');
  const statusText = converter.querySelector('#currency-status');
  const refreshButton = converter.querySelector('.currency-refresh');

  let rate = null;
  let lastEditedCurrency = 'JPY';
  let isLoading = false;

  function readStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The converter still works when private browsing blocks local storage.
    }
  }

  function parseAmount(value) {
    const normalized = String(value).replace(/,/g, '').replace(/[^\d.]/g, '');
    const [integer = '', ...decimals] = normalized.split('.');
    const cleaned = decimals.length ? `${integer}.${decimals.join('')}` : integer;
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? amount : null;
  }

  function formatAmount(value) {
    if (!Number.isFinite(value)) return '';
    return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(value);
  }

  function formatUpdatedTime(timestamp) {
    return new Intl.DateTimeFormat('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(timestamp));
  }

  function saveInput() {
    writeStorage(INPUT_KEY, {
      currency: lastEditedCurrency,
      value: lastEditedCurrency === 'JPY' ? jpyInput.value : twdInput.value,
    });
  }

  function convertFrom(currency) {
    if (!rate) return;

    lastEditedCurrency = currency;
    if (currency === 'JPY') {
      const amount = parseAmount(jpyInput.value);
      twdInput.value = amount === null ? '' : formatAmount(amount * rate.value);
    } else {
      const amount = parseAmount(twdInput.value);
      jpyInput.value = amount === null ? '' : formatAmount(amount / rate.value);
    }
    saveInput();
  }

  function renderRate(cachedRate, mode = 'current') {
    rate = cachedRate;
    rateText.textContent = `1 JPY ≈ ${cachedRate.value.toFixed(4)} TWD`;
    const updated = formatUpdatedTime(cachedRate.sourceUpdatedAt || cachedRate.fetchedAt);

    if (mode === 'offline') {
      statusText.textContent = `目前離線，使用 ${updated} 的最後匯率。`;
    } else if (mode === 'stale') {
      statusText.textContent = `暫時無法更新，使用 ${updated} 的最後匯率。`;
    } else {
      statusText.textContent = `匯率更新於 ${updated}，已保存供離線使用。`;
    }

    convertFrom(lastEditedCurrency);
  }

  function restoreInput() {
    const saved = readStorage(INPUT_KEY);
    if (!saved || !['JPY', 'TWD'].includes(saved.currency) || parseAmount(saved.value) === null) return;

    lastEditedCurrency = saved.currency;
    if (saved.currency === 'JPY') jpyInput.value = saved.value;
    else twdInput.value = saved.value;
  }

  function validCachedRate(value) {
    return value?.version === 1 && Number.isFinite(value.value) && value.value > 0 && Number.isFinite(value.fetchedAt);
  }

  async function fetchRate({ force = false } = {}) {
    if (isLoading) return;

    const cached = readStorage(CACHE_KEY);
    if (!force && validCachedRate(cached) && Date.now() - cached.fetchedAt < CACHE_MAX_AGE) {
      renderRate(cached, navigator.onLine ? 'current' : 'offline');
      return;
    }

    if (!navigator.onLine) {
      if (validCachedRate(cached)) renderRate(cached, 'offline');
      else statusText.textContent = '目前離線，尚無已保存的匯率資料。';
      return;
    }

    isLoading = true;
    refreshButton.disabled = true;
    refreshButton.textContent = '更新中…';
    statusText.textContent = validCachedRate(cached) ? '正在背景更新匯率…' : '正在取得最新匯率…';

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeout);

    try {
      const response = await fetch(API_URL, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`Exchange rate request failed: ${response.status}`);

      const data = await response.json();
      const twdRate = Number(data?.rates?.TWD);
      if (data?.result !== 'success' || !Number.isFinite(twdRate) || twdRate <= 0) {
        throw new Error('Exchange rate response was invalid.');
      }

      const freshRate = {
        version: 1,
        base: 'JPY',
        target: 'TWD',
        value: twdRate,
        sourceUpdatedAt: Number(data.time_last_update_unix) * 1000 || Date.now(),
        fetchedAt: Date.now(),
      };
      writeStorage(CACHE_KEY, freshRate);
      renderRate(freshRate);
    } catch (error) {
      if (validCachedRate(cached)) renderRate(cached, 'stale');
      else {
        rateText.textContent = '目前無法取得匯率';
        statusText.textContent = '請確認網路連線後再試一次。';
      }
      console.warn('Unable to update exchange rate.', error);
    } finally {
      window.clearTimeout(timeoutId);
      isLoading = false;
      refreshButton.disabled = false;
      refreshButton.textContent = '更新匯率';
    }
  }

  jpyInput.addEventListener('input', () => convertFrom('JPY'));
  twdInput.addEventListener('input', () => convertFrom('TWD'));
  jpyInput.addEventListener('blur', () => { jpyInput.value = formatAmount(parseAmount(jpyInput.value)); });
  twdInput.addEventListener('blur', () => { twdInput.value = formatAmount(parseAmount(twdInput.value)); });
  refreshButton.addEventListener('click', () => fetchRate({ force: true }));
  window.addEventListener('online', () => fetchRate());
  window.addEventListener('offline', () => {
    const cached = readStorage(CACHE_KEY);
    if (validCachedRate(cached)) renderRate(cached, 'offline');
  });

  restoreInput();
  fetchRate();
})();
