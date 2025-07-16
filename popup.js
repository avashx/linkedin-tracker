document.addEventListener('DOMContentLoaded', () => {
  const launchBtn = document.getElementById('launchBtn');
  const totalViewers = document.getElementById('totalViewers');
  const tableBody = document.querySelector('#viewersTable tbody');
  const logsConsole = document.getElementById('logsConsole');

  updateDashboard();

  launchBtn.addEventListener('click', () => {
    // Change button state to show it's working
    launchBtn.disabled = true;
    launchBtn.style.backgroundColor = '#ccc'; // Gray color
    launchBtn.textContent = 'Scraping...';

    chrome.runtime.sendMessage({ action: 'manualScrape' });

    // Revert button after 10 seconds (scrape time)
    setTimeout(() => {
      launchBtn.disabled = false;
      launchBtn.style.backgroundColor = '#0073b1'; // Original blue
      launchBtn.textContent = 'Launch!!';
      updateDashboard();
    }, 10000); // Adjust if scrape takes longer/shorter
  });

  chrome.storage.onChanged.addListener(updateDashboard);

  function updateDashboard() {
    chrome.storage.local.get(['viewers', 'logs'], (data) => {
      const viewers = data.viewers || [];
      totalViewers.textContent = `Total Viewers: ${viewers.length}`;
      tableBody.innerHTML = viewers.map(v => `<tr><td>${v.name || 'N/A'}</td><td>${v.headline || 'N/A'}</td><td>${v.company || 'N/A'}</td><td>${v.timestamp || 'N/A'}</td></tr>`).join('');

      logsConsole.innerHTML = (data.logs || []).map(log => 
        `<div class="log-${log.level.toLowerCase()}">[${log.timestamp}] ${log.level}: ${log.message}</div>`
      ).join('');
      logsConsole.scrollTop = logsConsole.scrollHeight;
    });
  }
});