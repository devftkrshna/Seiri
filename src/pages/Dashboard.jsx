import { useLiveQuery } from 'dexie-react-hooks';
import { LayoutDashboard, CheckCircle2, Timer, Code2, Briefcase, Bookmark, ListTodo, ExternalLink, Plus, ArrowRight, Trash2, Rocket, Github, Pencil, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import db from '../db';
import { QUOTES, DEFAULT_QUICK_LINKS } from '../constants';
import { getRandomQuote, timeAgo } from '../helpers';
import { useState, useEffect, useMemo } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [quote] = useState(() => getRandomQuote(QUOTES));
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkForm, setLinkForm] = useState({ name: '', url: '', icon: '🔗' });
  const [editLinkId, setEditLinkId] = useState(null);

  // Cached profile data
  const [ghContribs, setGhContribs] = useState(null);
  const [ghProfile, setGhProfile] = useState(null);
  const [lcData, setLcData] = useState(null);

  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const problems = useLiveQuery(() => db.problems.toArray()) || [];
  const jobs = useLiveQuery(() => db.jobs.toArray()) || [];
  const contents = useLiveQuery(() => db.contents.toArray()) || [];
  const quickLinks = useLiveQuery(() => db.quickLinks.orderBy('order').toArray()) || [];
  const pomodoros = useLiveQuery(() => db.pomodoros.toArray()) || [];
  const todayPomodoros = useLiveQuery(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return db.pomodoros.where('completedAt').above(today.toISOString()).toArray();
  }) || [];
  
  const todayPomodoroCount = todayPomodoros.length;

  // Load cached GitHub/LeetCode data
  useEffect(() => {
    (async () => {
      const ghC = await db.settings.get('github_contributions');
      const ghP = await db.settings.get('github_data');
      const lc = await db.settings.get('leetcode_data');
      if (ghC?.value) setGhContribs(ghC.value);
      if (ghP?.value) setGhProfile(ghP.value);
      if (lc?.value) setLcData(lc.value);
    })();
  }, []);

  // Seed default quick links on first load
  useEffect(() => {
    (async () => {
      const count = await db.quickLinks.count();
      if (count === 0) {
        for (let i = 0; i < DEFAULT_QUICK_LINKS.length; i++) {
          await db.quickLinks.add({ ...DEFAULT_QUICK_LINKS[i], order: i });
        }
      }
    })();
  }, []);

  const completedToday = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= today).length;
  }, [tasks]);

  const taskDistribution = useMemo(() => {
    const dist = {};
    todayPomodoros.forEach(p => {
      if (p.type === 'work') {
        const title = p.taskTitle || 'General Focus';
        dist[title] = (dist[title] || 0) + (p.duration || 0);
      }
    });
    return Object.entries(dist).sort((a,b) => b[1] - a[1]);
  }, [todayPomodoros]);

  const handleSaveLink = async () => {
    if (!linkForm.name.trim() || !linkForm.url.trim()) return;
    if (editLinkId) {
      await db.quickLinks.update(editLinkId, { name: linkForm.name, url: linkForm.url, icon: linkForm.icon });
      setEditLinkId(null);
    } else {
      await db.quickLinks.add({ ...linkForm, order: quickLinks.length });
    }
    setLinkForm({ name: '', url: '', icon: '🔗' });
    setShowLinkForm(false);
  };

  const startEditLink = (link) => {
    setLinkForm({ name: link.name, url: link.url, icon: link.icon || '🔗' });
    setEditLinkId(link.id);
    setShowLinkForm(true);
  };

  const cancelLinkForm = () => {
    setShowLinkForm(false);
    setEditLinkId(null);
    setLinkForm({ name: '', url: '', icon: '🔗' });
  };

  // Generate 90-day activity heatmap from all user data
  const heatmapData = useMemo(() => {
    const days = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const dateStr = d.toISOString().split('T')[0];

      let count = 0;
      count += tasks.filter(t => t.completedAt && t.completedAt.startsWith(dateStr)).length;
      count += problems.filter(p => (p.solvedAt || p.createdAt || '').startsWith(dateStr)).length;
      count += pomodoros.filter(p => (p.completedAt || '').startsWith(dateStr)).length;
      count += contents.filter(c => (c.createdAt || '').startsWith(dateStr)).length;

      days.push({ date: dateStr, count, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
    }
    return days;
  }, [tasks, problems, pomodoros, contents]);

  const maxActivity = Math.max(1, ...heatmapData.map(d => d.count));

  const recentActivity = useMemo(() => {
    const items = [];
    tasks.slice(-5).forEach(t => items.push({ type: 'task', text: t.title, time: t.createdAt, icon: 'ListTodo', color: 'blue' }));
    problems.slice(-5).forEach(p => items.push({ type: 'problem', text: `#${p.number} ${p.title}`, time: p.solvedAt || p.createdAt, icon: 'Code2', color: 'emerald' }));
    jobs.slice(-5).forEach(j => items.push({ type: 'job', text: `${j.company} — ${j.role}`, time: j.appliedAt, icon: 'Briefcase', color: 'violet' }));
    contents.slice(-5).forEach(c => items.push({ type: 'content', text: c.title, time: c.createdAt, icon: 'Bookmark', color: 'cyan' }));
    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
  }, [tasks, problems, jobs, contents]);

  const iconMap = { ListTodo, Code2, Briefcase, Bookmark };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const handleAddLink = async () => {
    if (!linkForm.name.trim() || !linkForm.url.trim()) return;
    await db.quickLinks.add({ ...linkForm, order: quickLinks.length });
    setLinkForm({ name: '', url: '', icon: '🔗' });
    setShowLinkForm(false);
  };

  // LC solved count (prefer API data, fallback to local)
  const lcSolved = lcData?.totalSolved ?? problems.length;

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title"><LayoutDashboard size={28} /> Dashboard</h1>
            <p className="page-subtitle">Welcome back! Here's your command center overview.</p>
          </div>
          {!ghProfile && !lcData && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profile')}>Connect Profiles →</button>
          )}
        </div>
      </motion.div>

      {/* Quote Banner */}
      <motion.div variants={item} className="glass-card no-hover" style={{ marginBottom: 'var(--space-xl)', background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(6,182,212,0.06))' }}>
        <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{quote.text}"</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>— {quote.author}</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon violet"><CheckCircle2 size={22} /></div>
          <div className="stat-card-value">{completedToday}</div>
          <div className="stat-card-label">Tasks Done Today</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/pomodoro')}>
          <div className="stat-card-icon emerald"><Timer size={22} /></div>
          <div className="stat-card-value">{todayPomodoroCount}</div>
          <div className="stat-card-label">Pomodoros Today</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate(lcData ? '/profile' : '/leetcode')}>
          <div className="stat-card-icon cyan"><Code2 size={22} /></div>
          <div className="stat-card-value">{lcSolved}</div>
          <div className="stat-card-label">{lcData ? 'LC Solved (API)' : 'Problems Logged'}</div>
        </div>
        <div className="stat-card" style={{ cursor: ghProfile ? 'pointer' : 'default' }} onClick={() => ghProfile && navigate('/profile')}>
          <div className="stat-card-icon amber">{ghProfile ? <Github size={22} /> : <Briefcase size={22} />}</div>
          <div className="stat-card-value">{ghProfile ? ghContribs?.total || 0 : jobs.length}</div>
          <div className="stat-card-label">{ghProfile ? 'GH Contributions' : 'Jobs Tracked'}</div>
        </div>
      </motion.div>

      {/* GitHub Contribution Heatmap (if connected) */}
      {ghContribs?.contributions?.length > 0 && (
        <motion.div variants={item} className="glass-card no-hover" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-sm">
              <Github size={18} style={{ color: 'var(--emerald)' }} />
              <div className="glass-card-title">GitHub Contributions — Last 90 Days</div>
            </div>
            <span className="text-mono" style={{ fontSize: '0.78rem', color: 'var(--emerald)' }}>{ghContribs.total} this year</span>
          </div>
          <div className="heatmap-grid">
            {ghContribs.contributions.slice(-90).map((day, i) => {
              const max = Math.max(1, ...ghContribs.contributions.slice(-90).map(c => c.count));
              const intensity = day.count > 0 ? Math.max(0.15, day.count / max) : 0;
              return (
                <div key={i} className="heatmap-cell" title={`${day.date}: ${day.count} contributions`}
                  style={{ background: day.count > 0 ? `rgba(16,185,129,${intensity})` : 'var(--surface-2)', boxShadow: intensity > 0.6 ? `0 0 6px rgba(16,185,129,${intensity * 0.4})` : 'none' }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-sm" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            <span>90 days ago</span>
            <div className="flex items-center gap-xs">
              <span>Less</span>
              {[0, 0.15, 0.35, 0.6, 0.85].map((o, i) => (
                <div key={i} className="heatmap-cell" style={{ width: 10, height: 10, background: o === 0 ? 'var(--surface-2)' : `rgba(16,185,129,${o})` }} />
              ))}
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </motion.div>
      )}

      {/* LeetCode Summary Widget (if connected) */}
      {lcData && (
        <motion.div variants={item} className="glass-card no-hover" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-sm">
              <Code2 size={18} style={{ color: 'var(--amber)' }} />
              <div className="glass-card-title">LeetCode Progress</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profile')}>Details <ArrowRight size={14} /></button>
          </div>
          <div className="lc-stats-strip">
            <div className="lc-stat">
              <div className="lc-stat-value" style={{ color: 'var(--accent)' }}>{lcData.totalSolved}/{lcData.totalQuestions}</div>
              <div className="lc-stat-label">Total</div>
            </div>
            <div className="lc-stat">
              <div className="lc-stat-value" style={{ color: '#10b981' }}>{lcData.easySolved}</div>
              <div className="lc-stat-label">Easy</div>
            </div>
            <div className="lc-stat">
              <div className="lc-stat-value" style={{ color: '#f59e0b' }}>{lcData.mediumSolved}</div>
              <div className="lc-stat-label">Medium</div>
            </div>
            <div className="lc-stat">
              <div className="lc-stat-value" style={{ color: '#f43f5e' }}>{lcData.hardSolved}</div>
              <div className="lc-stat-label">Hard</div>
            </div>
            <div className="lc-stat">
              <div className="lc-stat-value">{lcData.ranking?.toLocaleString()}</div>
              <div className="lc-stat-label">Ranking</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Time Distribution Widget */}
      {taskDistribution.length > 0 && (
        <motion.div variants={item} className="glass-card no-hover" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-sm">
              <Timer size={18} style={{ color: 'var(--accent)' }} />
              <div className="glass-card-title">Today's Focus Distribution</div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {taskDistribution.reduce((sum, [_, val]) => sum + val, 0)} mins total
            </span>
          </div>
          <div className="flex flex-col gap-sm mt-md">
            {taskDistribution.map(([title, time], i) => (
              <div key={i} className="flex items-center justify-between" style={{ padding: '6px 0' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, flex: 1 }} className="truncate pr-sm">{title}</span>
                <div className="flex items-center gap-sm" style={{ width: '50%' }}>
                  <div className="progress-bar" style={{ height: '6px', flex: 1, margin: 0, background: 'var(--surface-3)' }}>
                    <div className="progress-bar-fill" style={{ width: `${(time / Math.max(...taskDistribution.map(d=>d[1]))) * 100}%`, background: 'var(--accent)' }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right' }}>{time}m</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Launch Dock */}
      <motion.div variants={item} style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="flex items-center justify-between mb-md">
          <h4 style={{ color: 'var(--text-secondary)' }}><Rocket size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: -3 }} />Quick Launch</h4>
          <button className="btn btn-ghost btn-sm" onClick={() => { if (showLinkForm) cancelLinkForm(); else { setEditLinkId(null); setLinkForm({ name: '', url: '', icon: '🔗' }); setShowLinkForm(true); } }}>
            {showLinkForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Link</>}
          </button>
        </div>
        {showLinkForm && (
          <motion.div className="flex items-center gap-sm mb-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <input className="input" style={{ width: 50, textAlign: 'center', fontSize: '1.2rem', padding: '8px' }} placeholder="🔗" maxLength={2}
              value={linkForm.icon} onChange={e => setLinkForm({ ...linkForm, icon: e.target.value })} />
            <input className="input" style={{ flex: 1 }} placeholder="Name" value={linkForm.name}
              onChange={e => setLinkForm({ ...linkForm, name: e.target.value })} />
            <input className="input" style={{ flex: 2 }} placeholder="https://..." value={linkForm.url}
              onChange={e => setLinkForm({ ...linkForm, url: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSaveLink()} />
            <button className="btn btn-primary" onClick={handleSaveLink}>{editLinkId ? 'Update' : 'Add'}</button>
          </motion.div>
        )}
        <div className="quick-launch-grid">
          {quickLinks.map(link => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="quick-launch-item" title={link.url}>
              <span className="quick-launch-icon">{link.icon}</span>
              <span className="quick-launch-name">{link.name}</span>
              <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 2 }}>
                <button className="quick-launch-delete" style={{ right: 22 }} onClick={e => { e.preventDefault(); e.stopPropagation(); startEditLink(link); }}>
                  <Pencil size={9} />
                </button>
                <button className="quick-launch-delete" onClick={e => { e.preventDefault(); e.stopPropagation(); db.quickLinks.delete(link.id); }}>
                  <Trash2 size={10} />
                </button>
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Activity Heatmap */}
      <motion.div variants={item} className="glass-card no-hover" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="flex items-center justify-between mb-md">
          <div className="glass-card-title">Activity Heatmap — Last 90 Days</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {heatmapData.reduce((s, d) => s + d.count, 0)} total actions
          </div>
        </div>
        <div className="heatmap-grid">
          {heatmapData.map((day, i) => {
            const intensity = day.count > 0 ? Math.max(0.15, day.count / maxActivity) : 0;
            return (
              <div key={i} className="heatmap-cell" title={`${day.label}: ${day.count} actions`}
                style={{ background: day.count > 0 ? `rgba(139,92,246,${intensity})` : 'var(--surface-2)', boxShadow: intensity > 0.6 ? `0 0 6px rgba(139,92,246,${intensity * 0.4})` : 'none' }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-sm" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          <span>90 days ago</span>
          <div className="flex items-center gap-xs">
            <span>Less</span>
            {[0, 0.15, 0.35, 0.6, 0.85].map((o, i) => (
              <div key={i} className="heatmap-cell" style={{ width: 10, height: 10, background: o === 0 ? 'var(--surface-2)' : `rgba(139,92,246,${o})` }} />
            ))}
            <span>More</span>
          </div>
          <span>Today</span>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} style={{ marginBottom: 'var(--space-xl)' }}>
        <h4 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Quick Actions</h4>
        <div className="flex gap-sm flex-wrap">
          <button className="btn btn-secondary" onClick={() => navigate('/todos')}><Plus size={16} /> Add Task</button>
          <button className="btn btn-secondary" onClick={() => navigate('/content')}><Bookmark size={16} /> Save Link</button>
          <button className="btn btn-secondary" onClick={() => navigate('/pomodoro')}><Timer size={16} /> Start Focus</button>
          <button className="btn btn-secondary" onClick={() => navigate('/leetcode')}><Code2 size={16} /> Log Problem</button>
          <button className="btn btn-secondary" onClick={() => navigate('/jobs')}><Briefcase size={16} /> Track Job</button>
        </div>
      </motion.div>

      {/* Two Column: Activity + Pending */}
      <motion.div variants={item} className="two-col">
        <div className="glass-card no-hover">
          <div className="glass-card-header">
            <div className="glass-card-title">Recent Activity</div>
          </div>
          {recentActivity.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No activity yet. Start by adding tasks or saving links!</p>
          ) : (
            <div className="activity-feed">
              {recentActivity.map((act, i) => {
                const Icon = iconMap[act.icon] || Bookmark;
                return (
                  <div key={i} className="activity-item">
                    <div className="activity-icon" style={{ background: `var(--${act.color}-bg)`, color: `var(--${act.color === 'violet' ? 'accent' : act.color})` }}>
                      <Icon size={16} />
                    </div>
                    <div className="activity-text">{act.text}</div>
                    <div className="activity-time">{timeAgo(act.time)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card no-hover">
          <div className="glass-card-header">
            <div className="glass-card-title">Pending Tasks</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/todos')}>View All <ArrowRight size={14} /></button>
          </div>
          {tasks.filter(t => !t.completed).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>All caught up! 🎉</p>
          ) : (
            <div className="flex flex-col gap-sm">
              {tasks.filter(t => !t.completed).slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-md" style={{ padding: '8px 0' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.priority === 'p0' ? 'var(--rose)' : t.priority === 'p1' ? 'var(--amber)' : 'var(--blue)' }} />
                  <span style={{ fontSize: '0.9rem', flex: 1 }} className="truncate">{t.title}</span>
                  {t.category && <span className="badge badge-ghost" style={{ fontSize: '0.65rem' }}>{t.category}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
