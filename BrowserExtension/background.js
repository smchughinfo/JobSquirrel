// Listen for clicks on the extension button
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Send a message to the content script on the active tab
    await chrome.tabs.sendMessage(tab.id, { action: 'savePageHTML' });
  } catch (error) {
    console.log('Could not send message to content script:', error);
    
    // Alternative: inject and execute a script directly
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // This code runs directly on the page
          alert('Extension button clicked! Page title: ' + document.title);
          console.log('Extension executed on:', window.location.href);
        }
      });
    } catch (scriptError) {
      console.log('Could not execute script:', scriptError);
    }
  }
});