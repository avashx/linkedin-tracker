chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape') {
    try {
      // Wait 2 seconds to mimic user (helps avoid detection)
      setTimeout(() => {
        const viewers = [];
        const viewerElements = document.querySelectorAll('[data-view-name="profile-card"]'); // This selector might need update; inspect LinkedIn page
        viewerElements.forEach((el) => {
          const name = el.querySelector('.pv-top-card__name')?.textContent.trim() || '';
          const headline = el.querySelector('.pv-top-card__headline')?.textContent.trim() || '';
          const company = el.querySelector('.pv-top-card__company')?.textContent.trim() || '';
          const timestamp = el.querySelector('.pv-top-card__viewed-time')?.textContent.trim() || '';
          if (name) viewers.push({ name, headline, company, timestamp });
        });

        // Debugging: Log HTML for issues
        console.log('Potential viewer containers:', document.querySelectorAll('[data-view-name="profile-card"]').length);

        sendResponse({ viewers });
      }, 2000);
    } catch (error) {
      sendResponse({ error: error.message });
    }
    return true;
  }
});