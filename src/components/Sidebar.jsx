import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bookmark, Briefcase, Code2, Timer, ListTodo, GraduationCap, BookOpen, Lightbulb, Target, Moon, Sun, User } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'overview' },
  { path: '/habits', icon: Target, label: 'Habits', section: 'overview' },
  { path: '/content', icon: Bookmark, label: 'Content Curator', section: 'tools' },
  { path: '/jobs', icon: Briefcase, label: 'Job Tracker', section: 'tools' },
  { path: '/leetcode', icon: Code2, label: 'LeetCode', section: 'tools' },
  { path: '/snippets', icon: Lightbulb, label: 'Snippet Board', section: 'tools' },
  { path: '/pomodoro', icon: Timer, label: 'Pomodoro', section: 'focus' },
  { path: '/todos', icon: ListTodo, label: 'To-Do List', section: 'focus' },
  { path: '/gate', icon: GraduationCap, label: 'GATE Prep', section: 'study' },
  { path: '/formulas', icon: BookOpen, label: 'Formula Vault', section: 'study' },
  { path: '/profile', icon: User, label: 'Profile', section: 'account' },
];

const ZEN_VISIBLE = ['/pomodoro', '/todos'];

export default function Sidebar({ zenMode, toggleZen }) {
  const [time, setTime] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const visibleItems = zenMode ? navItems.filter(i => ZEN_VISIBLE.includes(i.path)) : navItems;

  const sections = zenMode
    ? [{ label: 'Focus Mode', items: visibleItems }]
    : [
        { label: 'Overview', items: visibleItems.filter(i => i.section === 'overview') },
        { label: 'Tools', items: visibleItems.filter(i => i.section === 'tools') },
        { label: 'Focus', items: visibleItems.filter(i => i.section === 'focus') },
        { label: 'Study', items: visibleItems.filter(i => i.section === 'study') },
        { label: 'Account', items: visibleItems.filter(i => i.section === 'account') },
      ];

  return (
    <aside className={`sidebar ${zenMode ? 'zen' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/favicon.svg" alt="Seiri Logo" width="28" height="28" />
        </div>
        <div className="sidebar-brand-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}><span>Seiri</span></div>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                end={item.path === '/'}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className={`zen-toggle ${zenMode ? 'active' : ''}`} onClick={toggleZen} title={zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}>
          {zenMode ? <Sun size={16} /> : <Moon size={16} />}
          <span>{zenMode ? 'Exit Zen' : 'Zen Mode'}</span>
        </button>
        <div className="sidebar-time">{formatTime(time)}</div>
        <div className="sidebar-time" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{formatDate(time)}</div>
      </div>
    </aside>
  );
}
