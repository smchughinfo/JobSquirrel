chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'savePageHTML') {
    let pageHTML = document.querySelector("html").outerHTML;
    let clipboardMessage = "JobSquirrelBrowserExtensionMessage:" + pageHTML;
    navigator.clipboard.writeText( clipboardMessage);
  }

  // Return true to indicate we'll send a response asynchronously
  return true;
});