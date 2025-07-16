chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape') {
    try {
      // Wait 5 seconds for page and network loads
      setTimeout(() => {
        // Step 1: Extract total 90-day views from page DOM (fallback if not in GraphQL)
        let total90DayViews = document.querySelector('.profile-views-insights__total-views')?.textContent.trim() || '0'; // Update selector based on inspection (e.g., class for "123 views in 90 days")
        total90DayViews = total90DayViews.match(/\d+/)?.[0] || 0; // Extract number

        // Step 2: Intercept GraphQL responses for viewer list
        const viewers = [];
        // We override XMLHttpRequest to capture responses (simple way to intercept)
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
          this.addEventListener('load', () => {
            if (url.includes('graphql') && this.responseText) { // Filter GraphQL requests
              try {
                const response = JSON.parse(this.responseText);
                console.log('Intercepted GraphQL response:', response); // Debug: Check console for data

                // Assuming response structure (update based on your inspection)
                // Example: response.data.profileViews.elements = array of viewers
                const viewerData = response.data?.dashProfileViewsByViewer?.elements || []; // Change to match actual path, e.g., response.data.profileViewEvents
                viewerData.forEach((viewer) => {
                  const name = viewer.viewer?.fullName || 'N/A';
                  const headline = viewer.viewer?.headline || 'N/A';
                  const company = viewer.viewer?.currentPositions?.[0]?.companyName || 'N/A';
                  const timestamp = viewer.viewedAt || 'N/A'; // Might be a timestamp; format if needed
                  viewers.push({ name, headline, company, timestamp });
                });

                // Extract total 90-day views from GraphQL if available
                if (response.data?.dashProfileViewsByViewer?.totalCount) {
                  total90DayViews = response.data.dashProfileViewsByViewer.totalCount;
                }
              } catch (e) {
                console.error('GraphQL parse error:', e);
              }
            }
          });
          originalOpen.apply(this, arguments);
        };

        // Trigger a page reload or wait to capture requests (since page is already loaded)
        location.reload(); // Forces reload to capture fresh requests; remove if causes issues

        // Wait a bit more for interception, then send response
        setTimeout(() => {
          console.log('Extracted viewers:', viewers);
          console.log('Total 90-day views:', total90DayViews);
          if (viewers.length === 0) {
            console.log('DEBUG: No viewers found - check GraphQL responses in Network tab');
          }
          sendResponse({ viewers, total90DayViews });
        }, 5000); // Wait for interception

      }, 5000);
    } catch (error) {
      console.error('Scrape error:', error);
      sendResponse({ error: error.message });
    }
    return true;
  }
});