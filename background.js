// Initialize capture session state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isCapturing: false, capturedAddresses: [] });
});

// Handle CSV generation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateCSV') {
    const addresses = request.addresses;
    const csvHeader = 'Address,State,Zip\n';
    const csvRows = addresses.map(addr => 
      `"${addr.address}","${addr.state}","${addr.zip}"`
    ).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvHeader + csvRows);
    
    chrome.downloads.download({
      url: csvContent,
      filename: 'zillow_addresses.csv',
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
      } else {
        console.log('CSV file download initiated with ID:', downloadId);
      }
    });
    sendResponse({success: true});
  }
  return true;  // Indicates that the response is sent asynchronously
});