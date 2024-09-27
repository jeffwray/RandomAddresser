document.addEventListener('DOMContentLoaded', function() {
  const viewButton = document.getElementById('viewAddresses');
  const clearButton = document.getElementById('clearAddresses');
  const addressList = document.getElementById('addressList');

  viewButton.addEventListener('click', function() {
    chrome.storage.local.get(['capturedAddresses'], function(result) {
      const addresses = result.capturedAddresses || [];
      addressList.innerHTML = addresses.length > 0 
        ? addresses.map(addr => `<p>${addr}</p>`).join('')
        : '<p>No addresses captured yet.</p>';
    });
  });

  clearButton.addEventListener('click', function() {
    chrome.storage.local.set({ capturedAddresses: [] }, function() {
      addressList.innerHTML = '<p>All captured addresses have been cleared.</p>';
    });
  });
});