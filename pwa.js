const installButton = document.querySelector('.app-install');
const installButtonLabel = document.querySelector('.app-install-label');
const installGuide = document.querySelector('.install-guide');
const installGuideClose = document.querySelector('.install-guide-close');
const connectionStatus = document.querySelector('.connection-status');
let installPrompt;
let statusTimer;
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function showStatus(message, state = 'online', persistent = false) {
  window.clearTimeout(statusTimer);
  connectionStatus.textContent = message;
  connectionStatus.dataset.state = state;
  connectionStatus.hidden = false;
  if (!persistent) statusTimer = window.setTimeout(() => { connectionStatus.hidden = true; }, 3200);
}

function updateConnectionStatus(event) {
  if (navigator.onLine) {
    if (event) showStatus('已恢復連線，資料將自動更新');
    return;
  }
  showStatus('目前離線，正在使用裝置內保存的行程資料', 'offline', true);
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  if (!isStandalone()) installButton.hidden = false;
});

installButton.addEventListener('click', async () => {
  if (!installPrompt) {
    if (isIos) installGuide.showModal();
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installButton.hidden = true;
  showStatus('東京旅行已安裝，可從主畫面離線開啟');
});

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();
if (isIos && !isStandalone()) {
  installButtonLabel.textContent = '手動安裝離線版方法';
  installButton.hidden = false;
}

installGuideClose.addEventListener('click', () => installGuide.close());
installGuide.addEventListener('click', (event) => {
  const bounds = installGuide.getBoundingClientRect();
  const isInside = event.clientX >= bounds.left && event.clientX <= bounds.right
    && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
  if (!isInside) installGuide.close();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js');
      registration.update();
    } catch (error) {
      console.warn('離線功能暫時無法啟用。', error);
    }
  });
}
