import { useLiveQuery } from 'dexie-react-hooks';
import { Code2, Plus, Trash2, Trophy, Search, RotateCcw, Pencil, RefreshCw } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import db from '../db';
import { LEETCODE_DIFFICULTIES, LEETCODE_TOPICS } from '../constants';
import { formatDate } from '../helpers';
import Modal from '../components/Modal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const defaultProblem = { number: '', title: '', difficulty: 'Easy', topics: [], status: 'solved', notes: '', timeTaken: '', revisionCount: 0 };
const defaultContest = { name: '', rank: '', solved: '', ratingChange: '', date: '' };
const COLORS = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#f43f5e' };

export default function LeetCode() {
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [showContestModal, setShowContestModal] = useState(false);
  const [form, setForm] = useState(defaultProblem);
  const [contestForm, setContestForm] = useState(defaultContest);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('all');
  const [tab, setTab] = useState('problems');

  const problems = useLiveQuery(() => db.problems.orderBy('solvedAt').reverse().toArray()) || [];
  const contests = useLiveQuery(() => db.contests.orderBy('date').reverse().toArray()) || [];

  // Auto-sync: load LeetCode solved count from profile
  const [lcSyncInfo, setLcSyncInfo] = useState(null);
  useEffect(() => {
    (async () => {
      const lcData = await db.settings.get('leetcode_data');
      if (lcData?.value) setLcSyncInfo(lcData.value);
    })();
  }, []);

  const stats = useMemo(() => {
    const easy = problems.filter(p => p.difficulty === 'Easy').length;
    const medium = problems.filter(p => p.difficulty === 'Medium').length;
    const hard = problems.filter(p => p.difficulty === 'Hard').length;
    return { easy, medium, hard, total: problems.length };
  }, [problems]);

  const pieData = [
    { name: 'Easy', value: stats.easy, color: COLORS.Easy },
    { name: 'Medium', value: stats.medium, color: COLORS.Medium },
    { name: 'Hard', value: stats.hard, color: COLORS.Hard },
  ].filter(d => d.value > 0);

  const filtered = problems.filter(p => {
    if (diffFilter !== 'all' && p.difficulty !== diffFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title?.toLowerCase().includes(q) || String(p.number).includes(q);
    }
    return true;
  });

  const handleSaveProblem = async () => {
    if (!form.title.trim()) return;
    const data = { ...form, number: Number(form.number) || 0, topics: form.topics, revisionCount: Number(form.revisionCount) || 0 };
    if (editId) {
      await db.problems.update(editId, data);
      setEditId(null);
    } else {
      await db.problems.add({ ...data, solvedAt: new Date().toISOString(), createdAt: new Date().toISOString() });
    }
    setForm(defaultProblem);
    setShowProblemModal(false);
  };

  const handleEditProblem = (p) => {
    setForm({
      number: String(p.number || ''),
      title: p.title,
      difficulty: p.difficulty,
      topics: p.topics || [],
      status: p.status || 'solved',
      notes: p.notes || '',
      timeTaken: p.timeTaken || '',
      revisionCount: p.revisionCount || 0,
    });
    setEditId(p.id);
    setShowProblemModal(true);
  };

  const handleRevise = async (p) => {
    const newCount = (p.revisionCount || 0) + 1;
    await db.problems.update(p.id, { revisionCount: newCount, lastRevised: new Date().toISOString() });
  };

  const handleSaveContest = async () => {
    if (!contestForm.name.trim()) return;
    await db.contests.add({ ...contestForm, rank: Number(contestForm.rank) || 0, solved: Number(contestForm.solved) || 0, ratingChange: Number(contestForm.ratingChange) || 0, date: contestForm.date || new Date().toISOString() });
    setContestForm(defaultContest);
    setShowContestModal(false);
  };

  const toggleTopic = (topic) => {
    setForm(f => ({ ...f, topics: f.topics.includes(topic) ? f.topics.filter(t => t !== topic) : [...f.topics, topic] }));
  };

  const closeModal = () => { setShowProblemModal(false); setEditId(null); setForm(defaultProblem); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Code2 size={28} /> LeetCode Tracker</h1>
          <p className="page-subtitle">Track your DSA grind. {stats.total} problems solved locally.
            {lcSyncInfo && <span style={{ color: 'var(--emerald)', marginLeft: 8 }}>({lcSyncInfo.totalSolved} on LC profile)</span>}
          </p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={() => setShowContestModal(true)}><Trophy size={16} /> Log Contest</button>
          <button className="btn btn-primary" onClick={() => { setForm(defaultProblem); setEditId(null); setShowProblemModal(true); }}><Plus size={18} /> Add Problem</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--text-primary)' }}>{stats.total}</div>
          <div className="stat-card-label">Total Solved</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: COLORS.Easy }}>{stats.easy}</div>
          <div className="stat-card-label">Easy</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: COLORS.Medium }}>{stats.medium}</div>
          <div className="stat-card-label">Medium</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: COLORS.Hard }}>{stats.hard}</div>
          <div className="stat-card-label">Hard</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'problems' ? 'active' : ''}`} onClick={() => setTab('problems')}>Problems</button>
        <button className={`tab ${tab === 'contests' ? 'active' : ''}`} onClick={() => setTab('contests')}>Contests ({contests.length})</button>
        <button className={`tab ${tab === 'chart' ? 'active' : ''}`} onClick={() => setTab('chart')}>Distribution</button>
      </div>

      {tab === 'problems' && (
        <>
          <div className="flex items-center gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <Search /><input className="input" placeholder="Search problems..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="filter-tabs" style={{ marginBottom: 0 }}>
              <button className={`filter-tab ${diffFilter === 'all' ? 'active' : ''}`} onClick={() => setDiffFilter('all')}>All</button>
              {LEETCODE_DIFFICULTIES.map(d => <button key={d} className={`filter-tab ${diffFilter === d ? 'active' : ''}`} onClick={() => setDiffFilter(d)}>{d}</button>)}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Code2 size={32} /></div>
              <div className="empty-state-title">No problems logged yet</div>
              <div className="empty-state-desc">Start logging your LeetCode problems to track your DSA progress.</div>
              <button className="btn btn-primary" onClick={() => setShowProblemModal(true)}><Plus size={16} /> Log First Problem</button>
            </div>
          ) : (
            <div className="glass-card no-hover" style={{ padding: 0, overflow: 'auto' }}>
              <table className="problem-table">
                <thead><tr><th>#</th><th>Title</th><th>Difficulty</th><th>Topics</th><th>Revisions</th><th>Date</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td className="problem-number">{p.number}</td>
                      <td style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => handleEditProblem(p)}>{p.title}</td>
                      <td><span className={`difficulty-${p.difficulty.toLowerCase()}`} style={{ fontWeight: 600 }}>{p.difficulty}</span></td>
                      <td><div className="tag-list">{p.topics?.slice(0, 3).map((t, i) => <span key={i} className="tag">{t}</span>)}</div></td>
                      <td>
                        <div className="flex items-center gap-xs">
                          <span className="text-mono" style={{ fontWeight: 600, color: (p.revisionCount || 0) > 0 ? 'var(--cyan)' : 'var(--text-dim)' }}>{p.revisionCount || 0}</span>
                          <button className="btn btn-ghost btn-icon" onClick={() => handleRevise(p)} title="Mark revision" style={{ padding: 2 }}>
                            <RotateCcw size={13} style={{ color: 'var(--cyan)' }} />
                          </button>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatDate(p.solvedAt)}</td>
                      <td>
                        <div className="flex gap-xs">
                          <button className="btn btn-ghost btn-icon" onClick={() => handleEditProblem(p)} title="Edit"><Pencil size={13} /></button>
                          <button className="btn btn-ghost btn-icon" onClick={() => db.problems.delete(p.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'contests' && (
        <div>
          {contests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Trophy size={32} /></div>
              <div className="empty-state-title">No contests logged</div>
              <div className="empty-state-desc">Log your LeetCode contests to track rank and rating progress.</div>
            </div>
          ) : (
            <div className="glass-card no-hover" style={{ padding: 0, overflow: 'auto' }}>
              <table className="problem-table">
                <thead><tr><th>Contest</th><th>Rank</th><th>Solved</th><th>Rating Δ</th><th>Date</th><th></th></tr></thead>
                <tbody>{contests.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td className="text-mono">{c.rank}</td>
                    <td className="text-mono">{c.solved}</td>
                    <td style={{ color: c.ratingChange >= 0 ? 'var(--emerald)' : 'var(--rose)', fontWeight: 600 }}>{c.ratingChange >= 0 ? '+' : ''}{c.ratingChange}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatDate(c.date)}</td>
                    <td><button className="btn btn-ghost btn-icon" onClick={() => db.contests.delete(c.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'chart' && (
        <div className="two-col">
          <div className="glass-card no-hover">
            <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>Difficulty Breakdown</h4>
            {stats.total === 0 ? <p style={{ color: 'var(--text-muted)' }}>Solve some problems first!</p> : (
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f8fafc' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="glass-card no-hover">
            <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>Top Topics</h4>
            {(() => {
              const topicCount = {};
              problems.forEach(p => p.topics?.forEach(t => { topicCount[t] = (topicCount[t] || 0) + 1; }));
              const sorted = Object.entries(topicCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
              if (sorted.length === 0) return <p style={{ color: 'var(--text-muted)' }}>No topic data yet.</p>;
              const max = sorted[0][1];
              return sorted.map(([topic, count]) => (
                <div key={topic} style={{ marginBottom: 12 }}>
                  <div className="flex justify-between" style={{ fontSize: '0.85rem', marginBottom: 4 }}>
                    <span>{topic}</span><span className="text-mono" style={{ color: 'var(--accent)' }}>{count}</span>
                  </div>
                  <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${(count / max) * 100}%` }} /></div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Problem Modal */}
      <Modal isOpen={showProblemModal} onClose={closeModal} title={editId ? 'Edit Problem' : 'Log Problem'}
        footer={
          <div className="flex items-center justify-between w-full">
            {editId && <button className="btn btn-danger btn-sm" onClick={() => { db.problems.delete(editId); closeModal(); }}><Trash2 size={14} /> Delete</button>}
            <div className="flex gap-sm" style={{ marginLeft: 'auto' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveProblem}>{editId ? 'Update' : 'Save'}</button>
            </div>
          </div>
        }>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">#</label><input className="input" type="number" placeholder="1" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} /></div>
          <div className="input-group"><label className="input-label">Difficulty</label><select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>{LEETCODE_DIFFICULTIES.map(d => <option key={d}>{d}</option>)}</select></div>
          <div className="input-group full-width"><label className="input-label">Title *</label><input className="input" placeholder="Two Sum" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="input-group"><label className="input-label">Revision Count</label><input className="input" type="number" placeholder="0" min="0" value={form.revisionCount} onChange={e => setForm({ ...form, revisionCount: e.target.value })} /></div>
        </div>
        <div className="input-group">
          <label className="input-label">Topics</label>
          <div className="tag-list">{LEETCODE_TOPICS.map(t => <button key={t} className={`tag ${form.topics.includes(t) ? 'active' : ''}`} onClick={() => toggleTopic(t)}>{t}</button>)}</div>
        </div>
        <div className="input-group"><label className="input-label">Notes</label><textarea className="input" placeholder="Approach, time complexity..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
      </Modal>

      {/* Contest Modal */}
      <Modal isOpen={showContestModal} onClose={() => { setShowContestModal(false); setContestForm(defaultContest); }} title="Log Contest"
        footer={<><button className="btn btn-secondary" onClick={() => setShowContestModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSaveContest}>Save</button></>}>
        <div className="input-group"><label className="input-label">Contest Name *</label><input className="input" placeholder="Weekly Contest 380" value={contestForm.name} onChange={e => setContestForm({ ...contestForm, name: e.target.value })} /></div>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">Rank</label><input className="input" type="number" placeholder="1234" value={contestForm.rank} onChange={e => setContestForm({ ...contestForm, rank: e.target.value })} /></div>
          <div className="input-group"><label className="input-label">Solved</label><input className="input" type="number" placeholder="3" value={contestForm.solved} onChange={e => setContestForm({ ...contestForm, solved: e.target.value })} /></div>
          <div className="input-group"><label className="input-label">Rating Change</label><input className="input" type="number" placeholder="+25" value={contestForm.ratingChange} onChange={e => setContestForm({ ...contestForm, ratingChange: e.target.value })} /></div>
          <div className="input-group"><label className="input-label">Date</label><input className="input" type="date" value={contestForm.date} onChange={e => setContestForm({ ...contestForm, date: e.target.value })} /></div>
        </div>
      </Modal>
    </motion.div>
  );
}
