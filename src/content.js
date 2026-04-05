// content.js
// Injected into linkedin.com/jobs/*

function extractJobDetails() {
  // LinkedIn DOM changes frequently, so we use multiple fallbacks
  const titleEl = document.querySelector('h1') || document.querySelector('.job-details-jobs-unified-top-card__job-title');
  let title = titleEl ? titleEl.innerText.trim() : document.title;
  // Clean up title if it contains " | LinkedIn"
  title = title.replace(/\s*\|\s*LinkedIn$/, '');

  const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name') || 
                    document.querySelector('.jobs-unified-top-card__company-name') ||
                    document.querySelector('.job-details-jobs-unified-top-card__subtitle-primary-grouping > span');
  
  let company = companyEl ? companyEl.innerText.trim() : 'LinkedIn Company';

  // Normalize URL (strip tracking params if possible)
  const urlParams = window.location.href.split('?')[0];

  return { title, company, url: urlParams };
}

// We want to listen for the user initiating the application process.
// "Easy Apply" opens a modal. "Apply" opens a new tab.
// To keep it simple and robust, we detect clicks on the main apply button.
document.addEventListener('click', (e) => {
  // Try to find if an apply button was clicked
  const btn = e.target.closest('button');
  if (!btn) return;
  
  const text = btn.innerText.trim().toLowerCase();
  const classes = btn.className.toLowerCase();
  
  const isApplyInitial = (text.includes('apply') && !text.includes('applied')) || classes.includes('jobs-apply-button');
  // If user submits easy apply modal (usually labeled "Submit application")
  const isSubmitModal = text.includes('submit application');

  if (isApplyInitial || isSubmitModal) {
    const jobData = extractJobDetails();
    
    // Only send if we actually found something reasonable
    if (jobData.title) {
      console.log("[DevDash] Intercepted Application:", jobData);
      
      // Debounce sending to avoid double clicks
      if (!window.__devdashLogged) {
        window.__devdashLogged = true;
        chrome.runtime.sendMessage({
          type: "LOG_JOB",
          payload: jobData
        });
        
        setTimeout(() => { window.__devdashLogged = false; }, 2000);
      }
    }
  }
});
