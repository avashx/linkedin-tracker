chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape') {
    try {
      // Wait 3 seconds for initial page load
      setTimeout(() => {
        const viewers = [];
        let total90DayViews = 0;

        // Fallback: Extract total 90-day views from DOM (update selector if needed)
        const totalElement = document.querySelector('.profile-views-insights__total-views, .pv-profile-views__total'); // Change to your inspected class
        if (totalElement) {
          total90DayViews = parseInt(totalElement.textContent.match(/\d+/)[0]) || 0;
          console.log('Total 90-day views from DOM:', total90DayViews);
        }

        // Intercept fetch requests (LinkedIn uses fetch for GraphQL)
        const originalFetch = window.fetch;
        window.fetch = async function(url, options) {
          const response = await originalFetch(url, options);
          const clonedResponse = response.clone(); // Clone to read without affecting original
          if (url.includes('graphql')) {
            clonedResponse.json().then(data => {
              console.log('Intercepted GraphQL response from:', url); // Debug: Logs URL
              console.log('Response data:', data); // Debug: Full JSON for you to check

              // Parse for viewers (update paths based on your Step 1 findings)
              // Assuming structure like data.dashProfileViewsByViewer.elements
              const viewerData = data?.data?.dashProfileViewsByViewer?.elements || // Common path
                                data?.data?.profileViewEvents?.elements || // Alternative
                                data?.data?.profileViews?.elements || []; // Fallback
              viewerData.forEach((viewer) => {
                const name = viewer.viewer?.fullName || viewer.profile?.fullName || 'N/A';
                const headline = viewer.viewer?.headline || viewer.profile?.headline || 'N/A';
                const company = viewer.viewer?.currentPositions?.[0]?.companyName || viewer.profile?.occupation || 'N/A';
                const timestamp = new Date(viewer.viewedAt || viewer.createdAt).toLocaleString() || 'N/A';
                viewers.push({ name, headline, company, timestamp });
              });

              // Parse total 90-day views from GraphQL
              total90DayViews = data?.data?.dashProfileViewsByViewer?.totalCount || // Common
                                data?.data?.profileViewEvents?.metadata?.totalCount || // Alternative
                                total90DayViews; // Fallback to DOM

              console.log('Parsed viewers:', viewers);
              console.log('Parsed total 90-day views:', total90DayViews);
            }).catch(e => console.error('JSON parse error:', e));
          }
          return response;
        };

        // Force a reload to trigger fresh GraphQL requests
        location.reload();

        // Wait 7 seconds for interceptions, then send data back
        setTimeout(() => {
          if (viewers.length === 0) {
            console.log('DEBUG: No viewers found. Check console for "Intercepted GraphQL response" logs and reply with them.');
          }
          sendResponse({ viewers, total90DayViews });
        }, 7000);

      }, 3000);
    } catch (error) {
      console.error('Scrape error:', error);
      sendResponse({ error: error.message });
    }
    return true; // Keep channel open
  }
});