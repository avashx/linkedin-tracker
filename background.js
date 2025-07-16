chrome.alarms.create('scrapeAlarm', { periodInMinutes: 3 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'scrapeAlarm') {
    scrapeLinkedIn();
  }
});

async function scrapeLinkedIn(manual = false) {
  try {
    const { cookies } = await chrome.storage.local.get('cookies');
    if (!cookies) throw new Error('No cookies found');

    chrome.tabs.create({ url: 'https://www.linkedin.com/me/profile-views/', active: false }, async (tab) => {
      for (const cookie of cookies) {
        await chrome.cookies.set({
          url: 'https://www.linkedin.com',
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          expirationDate: cookie.expirationDate
        });
      }

      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
            // Capture screenshot for debugging
chrome.tabs.captureVisibleTab(tab.id, { format: 'png' }, (dataUrl) => {
  chrome.downloads.download({ url: dataUrl, filename: 'debug_screenshot.png', saveAs: false });
  logToStorage('DEBUG', 'Screenshot saved as debug_screenshot.png');
});
          chrome.tabs.sendMessage(tab.id, { action: 'scrape' }, (response) => {
            if (response) {
              chrome.storage.local.get('viewers', (data) => {
                const viewers = data.viewers || [];
                viewers.push(...response.viewers);
                chrome.storage.local.set({ viewers });
                logToStorage('INFO', `Scraped ${response.viewers.length} viewers`);
              });
            }
            chrome.tabs.remove(tab.id);
          });
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    });

    logToStorage('INFO', manual ? 'Manual scrape started' : 'Automatic scrape started');
  } catch (error) {
    logToStorage('ERROR', error.message);
  }
}

function logToStorage(level, message) {
  chrome.storage.local.get('logs', (data) => {
    const logs = data.logs || [];
    logs.push({ level, message, timestamp: new Date().toISOString() });
    chrome.storage.local.set({ logs });
  });
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'manualScrape') scrapeLinkedIn(true);
});