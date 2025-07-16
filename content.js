chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape') {
    try {
      // Wait 5 seconds for data to load (helps with slow LinkedIn loading)
      setTimeout(() => {
        const viewers = [];
        // Update this selector to the repeating container (from your inspection)
        const viewerElements = document.querySelectorAll('[data-control-name="profile_viewer"]'); // Example; change to e.g., '.profile-viewer-item'

        viewerElements.forEach((el) => {
          // Update these selectors based on inspection
          const name = el.querySelector('.text-heading-xlarge')?.textContent.trim() || 'N/A';
          const headline = el.querySelector('.text-body-small')?.textContent.trim() || 'N/A';
          const company = el.querySelector('.pv-entity__secondary-title')?.textContent.trim() || 'N/A';
          const timestamp = el.querySelector('.pv-viewed-time')?.textContent.trim() || 'N/A';
          if (name !== 'N/A') viewers.push({ name, headline, company, timestamp });
        });

        // Improved debugging logs (check in Chrome dev tools Console)
        console.log('Found viewer elements:', viewerElements.length);
        console.log('Extracted viewers:', viewers);
        if (viewers.length === 0) {
          console.log('DEBUG: Potential containers -', document.querySelectorAll('div[class*="profile-viewer"]')); // Logs alternative HTML for diagnosis
        }

        sendResponse({ viewers });
      }, 5000); // Increased wait time to 5 seconds
    } catch (error) {
      console.error('Scrape error:', error);
      sendResponse({ error: error.message });
    }
    return true; // Keeps the message channel open
  }
});