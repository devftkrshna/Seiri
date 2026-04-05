import React from 'react';
import { createRoot } from 'react-dom/client';
import { Link2, LayoutDashboard, Briefcase } from 'lucide-react';
import db from './db';

function Popup() {
  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: 'index.html' });
  };

  const handleSaveLink = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        let type = 'article';
        const u = tab.url.toLowerCase();
        if (u.includes('youtube.com') || u.includes('vimeo.com') || u.includes('instagram.com/reel') || u.includes('tiktok.com')) type = 'reel';
        if (u.includes('github.com') || u.includes('gitlab.com') || u.includes('bitbucket.org')) type = 'github';
        if (u.includes('twitter.com') || u.includes('x.com')) type = 'tweet';
        if (u.match(/\.(jpeg|jpg|gif|png|svg|webp)(\?.*)?$/i) || u.includes('instagram.com/post') || u.includes('unsplash.com') || u.includes('pinterest.com')) type = 'image';

        await db.contents.add({
          title: tab.title,
          url: tab.url,
          type: type,
          tags: ['Saved from Extension'],
          isFavorite: false,
          createdAt: new Date().toISOString()
        });
        const btn = document.getElementById('save-link-btn');
        const orig = btn.innerHTML;
        btn.innerHTML = 'Saved!';
        setTimeout(() => btn.innerHTML = orig, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveJob = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        let company = 'Saved from Web';
        let role = tab.title.split(' - ')[0] || tab.title;

        if (tab.url.includes('linkedin.com')) {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Extract from LinkedIn Job details pane
              const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title') || document.querySelector('h1');
              const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name') || document.querySelector('.jobs-unified-top-card__company-name');

              return {
                title: titleEl ? titleEl.innerText.trim() : null,
                company: companyEl ? companyEl.innerText.trim() : null
              };
            }
          });

          if (results && results[0] && results[0].result) {
            const res = results[0].result;
            if (res.title) role = res.title;
            if (res.company) company = res.company;
          }
        }

        await db.jobs.add({
          company: company,
          role: role,
          status: 'saved',
          appliedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: tab.url.split('?')[0]
        });

        const btn = document.getElementById('save-job-btn');
        const orig = btn.innerHTML;
        btn.innerHTML = 'Saved!';
        setTimeout(() => btn.innerHTML = orig, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', textAlign: 'center', color: '#94a3b8' }}>Seiri Tools</h3>

      <button
        id="save-link-btn"
        onClick={handleSaveLink}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#1e2028', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', cursor: 'pointer', transition: 'background 0.2s' }}
        onMouseOver={e => e.currentTarget.style.background = '#334155'}
        onMouseOut={e => e.currentTarget.style.background = '#1e2028'}
      >
        <Link2 size={16} color="#38bdf8" /> Save Page Link
      </button>

      <button
        id="save-job-btn"
        onClick={handleSaveJob}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#1e2028', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', cursor: 'pointer', transition: 'background 0.2s' }}
        onMouseOver={e => e.currentTarget.style.background = '#334155'}
        onMouseOut={e => e.currentTarget.style.background = '#1e2028'}
      >
        <Briefcase size={16} color="#fbbf24" /> Save as Job Lead
      </button>

      <div style={{ height: '1px', background: '#334155', margin: '4px 0' }}></div>

      <button
        onClick={handleOpenDashboard}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#6366f1', border: 'none', borderRadius: '6px', color: '#ffffff', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
        onMouseOver={e => e.currentTarget.style.background = '#4f46e5'}
        onMouseOut={e => e.currentTarget.style.background = '#6366f1'}
      >
        <LayoutDashboard size={16} /> Open Dashboard
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<Popup />);
