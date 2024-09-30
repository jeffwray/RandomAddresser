// Function to inject buttons
function injectButtons() {
  console.log('Attempting to inject buttons');
  const existingButtons = document.getElementById('zillow-scraper-buttons');
  if (existingButtons) {
    console.log('Buttons already exist');
    return;
  }

  const saveSearchButton = document.querySelector('button[aria-label="Save search"]');
  
  if (saveSearchButton) {
    console.log('Found Save search button');
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'zillow-scraper-buttons';
    buttonContainer.style.margin = '10px 0';
    buttonContainer.style.display = 'inline-flex';
    buttonContainer.style.marginLeft = '10px';
    
    const startButton = createButton('Start Capture', 'blue', startCaptureSession);
    const captureButton = createButton('Capture', 'green', captureResults);
    const endButton = createButton('End Capture', 'red', endCaptureSession);
    
    buttonContainer.appendChild(startButton);
    buttonContainer.appendChild(captureButton);
    buttonContainer.appendChild(endButton);
    
    saveSearchButton.parentNode.insertBefore(buttonContainer, saveSearchButton.nextSibling);
    console.log('Buttons injected successfully');
  } else {
    console.error('Save search button not found on the page');
  }
}

// Helper function to create styled buttons
function createButton(text, color, clickHandler) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.marginRight = '5px';
  button.style.padding = '5px 10px';
  button.style.backgroundColor = color;
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '12px';
  button.addEventListener('click', clickHandler);
  return button;
}

// Function to start capture session
function startCaptureSession() {
  chrome.storage.local.set({ isCapturing: true, capturedAddresses: [] }, () => {
    alert('Capture session started. The cards will be adjusted to load more results.');
    adjustCardSize();
    setupAutomaticCapture();
    captureResults();
  });
}

// Function to end capture session
function endCaptureSession() {
  chrome.storage.local.get(['capturedAddresses'], (result) => {
    const addresses = result.capturedAddresses || [];
    if (addresses.length > 0) {
      chrome.runtime.sendMessage({ action: 'generateCSV', addresses: addresses }, (response) => {
        handleChromeError();
        if (response && response.success) {
          alert('CSV file generation initiated. Check your downloads folder.');
        } else {
          alert('Error generating CSV file. Please try again.');
        }
      });
    } else {
      alert('No addresses captured in this session');
    }
    chrome.storage.local.set({ isCapturing: false, capturedAddresses: [] });
  });
}

// Function to capture results with delay
function captureResults() {
  chrome.storage.local.get(['isCapturing', 'capturedAddresses'], (result) => {
    handleChromeError();
    if (result.isCapturing) {
      // Delay capture to allow for infinite scrolling to load more results
      setTimeout(() => {
        const addressElements = document.querySelectorAll('address[data-test="property-card-addr"]');
        const existingAddresses = new Set(result.capturedAddresses.map(addr => JSON.stringify(addr)));
        const newAddresses = Array.from(addressElements)
          .map(el => {
            const fullAddress = el.textContent.trim();
            const parts = fullAddress.split(',');
            const zipMatch = parts[parts.length - 1].match(/\d{5}/);
            const zip = zipMatch ? zipMatch[0] : '';
            const state = parts[parts.length - 1].replace(zip, '').trim();
            const address = parts.slice(0, -1).join(',').trim();
            return { address, state, zip };
          })
          .filter(addr => !existingAddresses.has(JSON.stringify(addr)));
        
        const updatedAddresses = [...result.capturedAddresses, ...newAddresses];
        chrome.storage.local.set({ capturedAddresses: updatedAddresses }, () => {
          handleChromeError();
          console.log(`Captured ${newAddresses.length} new unique addresses`);
          if (newAddresses.length > 0) {
            showCheckmark(newAddresses.length);
          }
        });
      }, 5000); // Wait for 5 seconds before capturing to allow for more results to load
    }
  });
}

// Function to show checkmark and number of homes added
function showCheckmark(numHomes) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '50%';
  container.style.left = '50%';
  container.style.transform = 'translate(-50%, -50%)';
  container.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  container.style.borderRadius = '10px';
  container.style.padding = '20px';
  container.style.zIndex = '9999';
  container.style.opacity = '0';
  container.style.transition = 'opacity 0.5s ease-in-out';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

  const checkmark = document.createElement('div');
  checkmark.innerHTML = '✓';
  checkmark.style.fontSize = '60px';
  checkmark.style.color = 'green';

  const homesAdded = document.createElement('div');
  homesAdded.textContent = `${numHomes} homes added`;
  homesAdded.style.fontSize = '24px';
  homesAdded.style.fontWeight = 'bold';
  homesAdded.style.marginTop = '10px';
  homesAdded.style.color = '#333';

  container.appendChild(checkmark);
  container.appendChild(homesAdded);

  document.body.appendChild(container);

  // Fade in
  setTimeout(() => {
    container.style.opacity = '1';
  }, 0);

  // Fade out and remove
  setTimeout(() => {
    container.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(container);
    }, 500);
  }, 2000);
}

// Function to handle automatic pagination (now just triggers more loading)
function handleAutomaticPagination() {
  chrome.storage.local.get(['isCapturing'], (result) => {
    handleChromeError();
    if (result.isCapturing) {
      // Scroll to bottom to trigger more loading
      window.scrollTo(0, document.body.scrollHeight);
      console.log('Scrolled to bottom to load more results');
      
      // Capture results after scrolling
      captureResults();
    }
  });
}

// Modify setupAutomaticCapture to use the new approach
function setupAutomaticCapture() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        handleAutomaticPagination();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 }); // Reduced threshold to trigger earlier

  function observeLastCard() {
    const listingCards = document.querySelectorAll('[data-test="property-card"]');
    if (listingCards.length > 0) {
      const lastCard = listingCards[listingCards.length - 1];
      observer.observe(lastCard);
    }
  }

  // Initial observation
  observeLastCard();

  // Set up a MutationObserver to watch for new content
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        observeLastCard();
      }
    });
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

// Function to adjust card size
function adjustCardSize() {
  const style = document.createElement('style');
  style.textContent = `
    /* Completely destyle the specified elements */
    [data-test="property-card"],
    [data-test="search-page-list-card"],
    .property-card,
    .list-card,
    article[role="presentation"],
    div[id^="zpid_"],
    div[id^="card-"],
    div[class*="ListItem-"],
    .ListItem-c11n-8-105-0__sc-13rwu5a-0,
    .StyledListCardWrapper-srp-8-105-0__sc-wtsrtn-0,
    .gpgmwS,
    .cXzrsE {
      all: unset !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: none !important;
      box-shadow: none !important;
      position: static !important;
      transform: none !important;
      transition: none !important;
      z-index: auto !important;
      opacity: 1 !important;
      overflow: visible !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
    }

    /* Hide photo area and related elements */
    .StyledPropertyCardPhotoWrapper-c11n-8-105-0__sc-1gbptz1-0,
    .StyledPropertyCardPhotoHeader-c11n-8-105-0__sc-4wdzry-0,
    .StyledPropertyCardPhotoFooter-c11n-8-105-0__sc-12lm4o3-0,
    .StyledPropertyCardPhotoBody-c11n-8-105-0__sc-yln73l-0,
    .StyledPhotoCarousel-c11n-8-105-0__sc-2dw10y-0 {
      display: none !important;
    }

    /* Adjust layout for remaining content */
    .StyledPropertyCardDataWrapper-c11n-8-105-0__sc-hfbvv9-0 {
      padding: 10px !important;
      margin-top: 0 !important;
    }

    /* Remove any unnecessary padding or margins from parent elements */
    .StyledCard-c11n-8-105-0__sc-1w6p0lv-0,
    .StyledPropertyCardBody-c11n-8-105-0__sc-1danayh-0,
    .PropertyCardWrapper__StyledPropertyCardBody-srp-8-105-0__sc-16e8gqd-4 {
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Ensure the container of the cards doesn't have a large height */
    .List-c11n-8-105-0__sc-1smrmqp-0,
    .StyledSearchListWrapper-srp-8-105-0__sc-1ieen0c-0,
    .fNTnXQ,
    .dtRiBi {
      min-height: 0 !important;
      height: auto !important;
    }

    /* Override specific styles to remove blank area */
    .cazKst .StyledPropertyCardBody-c11n-8-105-0__sc-1danayh-0 {
      display: grid !important;
      grid-template-areas:
        "photo"
        "data"
        "flex" !important;
      grid-template-rows: 0px 1fr auto !important;
      height: 89% !important;
      padding: 0px !important;
      -webkit-tap-highlight-color: transparent !important;
      grid-gap: 0 !important; /* Remove all grid gaps */
    }

    /* Hide the ad block */
    .container .wrapper {
      display: none !important;
    }

    /* Remove gaps and padding for .dtRiBi */
    .dtRiBi {
      display: grid !important;
      gap: 0 !important;
      margin-bottom: 0px !important;
      padding: 0 !important;
      grid-template-columns: repeat(1, 1fr) !important;
    }

    /* Set text size in result-list-container to 3px */
    .result-list-container {
      font-size: 3px !important;
    }
  `;
  document.head.appendChild(style);
  console.log('Cards adjusted and photo area removed');
}

// Function to check and apply card resizing
function checkAndResizeCards() {
  const cardSelectors = [
    '[data-test="property-card"]',
    '[data-test="search-page-list-card"]',
    '.property-card',
    '.list-card',
    'article[role="presentation"]',
    'div[id^="zpid_"]',
    'div[id^="card-"]',
    'div[class*="ListItem-"]',
    '.ListItem-c11n-8-105-0__sc-13rwu5a-0',
    '.StyledListCardWrapper-srp-8-105-0__sc-wtsrtn-0',
    '.gpgmwS',
    '.cXzrsE'
  ];
  
  const cards = document.querySelectorAll(cardSelectors.join(', '));
  
  if (cards.length > 0) {
    adjustCardSize();
  } else {
    console.log('No property cards found. Retrying...');
    setTimeout(checkAndResizeCards, 1000); // Retry after 1 second
  }
}

// Make cards smaller immediately when the script loads
checkAndResizeCards();

// Ensure cards are made smaller when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', checkAndResizeCards);

// Add a mutation observer to handle dynamic content loading
const observer = new MutationObserver((mutations) => {
  for (let mutation of mutations) {
    if (mutation.type === 'childList') {
      checkAndResizeCards();
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Function to check and inject buttons
function checkAndInjectButtons(retries = 5) {
  if (!document.getElementById('zillow-scraper-buttons')) {
    const saveSearchButton = document.querySelector('button[aria-label="Save search"]');
    if (saveSearchButton) {
      injectButtons();
    } else if (retries > 0) {
      console.log(`Save search button not found. Retrying... (${retries} attempts left)`);
      setTimeout(() => checkAndInjectButtons(retries - 1), 1000);
    } else {
      console.error('Failed to find Save search button after multiple attempts');
    }
  }
}

// Inject buttons immediately when the script loads
checkAndInjectButtons();

// Ensure buttons are injected when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', checkAndInjectButtons);

// Add a mutation observer to handle dynamic content loading
const buttonObserver = new MutationObserver((mutations) => {
  for (let mutation of mutations) {
    if (mutation.type === 'childList') {
      checkAndInjectButtons();
    }
  }
});

buttonObserver.observe(document.body, { childList: true, subtree: true });

// Call setupAutomaticCapture when the content script loads
setupAutomaticCapture();

function handleChromeError() {
  if (chrome.runtime.lastError) {
    console.log("Chrome runtime error: ", chrome.runtime.lastError.message);
    // Attempt to reconnect or reload the extension
    setTimeout(() => {
      chrome.runtime.connect();
    }, 1000);
  }
}