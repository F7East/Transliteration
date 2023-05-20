// Receive messages from content scripts
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message && message.message === 'Content script loaded') {
    console.log('Content script loaded');
  }
  if (message && message.message === 'Button activated'){
    console.log('Button activated');
  }
  if (message && message.message === 'Button desactivated'){
    console.log('Button desactivated');
  }
  if (message && message.message === 'textNode reverted'){
    console.log('textNode reverted');
  }
  if (message && message.message === 'textNode saved'){
    console.log('textNode saved');
  }
  
});

// Function to handle button click
function handleButtonClick(tab) {
  chrome.storage.local.get('buttonState', function(data) {
    var buttonState = data.buttonState;

    // Toggle the button state
    var newButtonState = (buttonState === 'on') ? 'off' : 'on';
    chrome.storage.local.set({ 'buttonState': newButtonState });

    // Send a message to the content script
    chrome.tabs.sendMessage(tab.id, { message: 'Button state changed', state: newButtonState });
    console.log('Button state changed message sent ' + newButtonState);

    // Update the badge text
    // chrome.action.setBadgeText({ tabId: tab.id, text: newButtonState });
    chrome.action.setIcon({path : 'icon_' + newButtonState + '.png'});
  });
}


// Add click listener to the extension button
chrome.action.onClicked.addListener(function(tab) {
  // Query the tab to check if it exists
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    handleButtonClick(tabs[0]);
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0 && tabs[0].id === tabId) {      
      chrome.storage.local.get('buttonState', function(data) {
        var buttonState = data.buttonState;
        if (buttonState === 'on') {
          // Send a message to the content script
          chrome.tabs.sendMessage(tab.id, { message: 'Page reloaded', state: buttonState }, function(response) {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
              return;
            }
            console.log('Message sent to content script:', response);
          });
        }
      });
    }
  });
});


