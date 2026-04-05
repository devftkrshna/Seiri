import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [zenMode, setZenMode] = useState(false);

  return (
    <div className={`app-layout ${zenMode ? 'zen-mode' : ''}`}>
      <Sidebar zenMode={zenMode} toggleZen={() => setZenMode(!zenMode)} />
      <main className="main-content">
        <div className="page-container">
          <Outlet context={{ zenMode }} />
        </div>
      </main>
    </div>
  );
}
