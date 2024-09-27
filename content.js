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
    alert('Capture session started. The cards will be made smaller to load more results.');
    makeCardsSmaller();
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
            showCheckmark();
          }
        });
      }, 5); // Wait for 5 seconds before capturing to allow for more results to load
    }
  });
}

// Function to show checkmark
function showCheckmark() {
  const checkmark = document.createElement('div');
  checkmark.innerHTML = '✓';
  checkmark.style.position = 'fixed';
  checkmark.style.top = '50%';
  checkmark.style.left = '50%';
  checkmark.style.transform = 'translate(-50%, -50%)';
  checkmark.style.fontSize = '100px';
  checkmark.style.color = 'green';
  checkmark.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  checkmark.style.borderRadius = '50%';
  checkmark.style.padding = '20px';
  checkmark.style.zIndex = '9999';
  checkmark.style.opacity = '0';
  checkmark.style.transition = 'opacity 0.5s ease-in-out';

  document.body.appendChild(checkmark);

  // Fade in
  setTimeout(() => {
    checkmark.style.opacity = '1';
  }, 0);

  // Fade out and remove
  setTimeout(() => {
    checkmark.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(checkmark);
    }, 500);
  }, 1000);
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

// Function to make property cards smaller
function makeCardsSmaller() {
  const style = document.createElement('style');
  style.textContent = `
    /* Target cards by data attributes, common structures, and specific classes */
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
      transform: scale(0.3) !important;
      margin: -50px !important;
      padding: 0 !important;
      max-height: 100px !important;
      min-height: 100px !important;
      height: 100px !important;
      overflow: hidden !important;
      position: relative !important;
      z-index: 1 !important;
      opacity: 0.7 !important;
      transition: transform 0.3s ease, opacity 0.3s ease !important;
    }
    
    /* Hover effect to show more details */
    [data-test="property-card"]:hover,
    [data-test="search-page-list-card"]:hover,
    .property-card:hover,
    .list-card:hover,
    article[role="presentation"]:hover,
    div[id^="zpid_"]:hover,
    div[id^="card-"]:hover,
    div[class*="ListItem-"]:hover,
    .ListItem-c11n-8-105-0__sc-13rwu5a-0:hover,
    .StyledListCardWrapper-srp-8-105-0__sc-wtsrtn-0:hover,
    .gpgmwS:hover,
    .cXzrsE:hover {
      transform: scale(0.5) !important;
      opacity: 1 !important;
      z-index: 2 !important;
    }
    
    /* Ensure the container of the cards doesn't have a large height */
    .List-c11n-8-105-0__sc-1smrmqp-0,
    .StyledSearchListWrapper-srp-8-105-0__sc-1ieen0c-0,
    .fNTnXQ,
    .dtRiBi {
      min-height: 0 !important;
      height: auto !important;
    }
  `;
  document.head.appendChild(style);
  console.log('Cards made smaller');
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
    makeCardsSmaller();
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