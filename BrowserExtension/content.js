chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'savePageHTML') {
    let pageHTML = document.querySelector("html").outerHTML;
    let clipboardMessage = `JobSquirrelBrowserExtensionMessage:<h1 data-job-squirrel-reference="url">${window.location.href}</h1>${pageHTML}`;
    navigator.clipboard.writeText( clipboardMessage);
  }

  // Return true to indicate we'll send a response asynchronously
  return true;
});