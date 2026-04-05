import db from './db';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "LOG_JOB") {
    console.log("[DevDash Background] Received job application:", message.payload);
    
    // Save directly to the shared IndexedDB 'DevDashDB' via our db.js wrapper
    db.jobs.add({
      company: message.payload.company,
      role: message.payload.title,
      status: 'applied',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).then(id => {
      console.log("[DevDash Background] Successfully logged job ID:", id);
      
      // Notify the active popup/tab if DevDash is open so it can show a notification or update purely if we used a listener
      // Dexie's useLiveQuery handles re-rendering automatically if the New Tab page is already open!
      
      sendResponse({ success: true, id });
    }).catch(err => {
      console.error("[DevDash Background] Failed to save job to DB:", err);
      sendResponse({ success: false, error: err.toString() });
    });
    
    return true; // Indicates async response
  }
});
