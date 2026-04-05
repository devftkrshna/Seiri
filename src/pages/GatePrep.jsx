import { useLiveQuery } from 'dexie-react-hooks';
import { GraduationCap, ChevronDown, ChevronRight, Check, RotateCcw, Plus, Minus, Trash2, Activity, PenTool } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import db, { seedGateTopics } from '../db';

const GATE_DATE = new Date('2027-02-07');

export default function GatePrep() {
  const [expandedSubject, setExpandedSubject] = useState(null);
  const gateTopics = useLiveQuery(() => db.gateTopics.toArray()) || [];
  const gateScores = useLiveQuery(() => db.gateScores.orderBy('date').toArray()) || [];
  const [showMockForm, setShowMockForm] = useState(false);
  const [mockForm, setMockForm] = useState({ testName: '', score: '', maxScore: '100', weakAreas: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => { seedGateTopics(); }, []);

  // Countdown
  const now = new Date();
  const diff = GATE_DATE - now;
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const mins = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

  // Group by subject
  const subjects = useMemo(() => {
    const map = {};
    gateTopics.forEach(t => {
      if (!map[t.subject]) map[t.subject] = [];
      map[t.subject].push(t);
    });
    return Object.entries(map).map(([name, topics]) => {
      const done = topics.filter(t => t.completed).length;
      const totalRevisions = topics.reduce((s, t) => s + (t.revisionCount || 0), 0);
      const totalProblemsSolved = topics.reduce((s, t) => s + (t.problemsSolved || 0), 0);
      return { name, topics, done, total: topics.length, pct: topics.length > 0 ? Math.round((done / topics.length) * 100) : 0, totalRevisions, totalProblemsSolved };
    });
  }, [gateTopics]);

  const overall = useMemo(() => {
    const done = gateTopics.filter(t => t.completed).length;
    return { done, total: gateTopics.length, pct: gateTopics.length > 0 ? Math.round((done / gateTopics.length) * 100) : 0 };
  }, [gateTopics]);

  const toggleTopic = async (id, current) => {
    await db.gateTopics.update(id, { completed: !current });
  };

  const incrementRevision = async (id) => {
    const topic = gateTopics.find(t => t.id === id);
    if (topic) {
      await db.gateTopics.update(id, { revisionCount: (topic.revisionCount || 0) + 1 });
    }
  };

  const decrementRevision = async (id) => {
    const topic = gateTopics.find(t => t.id === id);
    if (topic && (topic.revisionCount || 0) > 0) {
      await db.gateTopics.update(id, { revisionCount: (topic.revisionCount || 0) - 1 });
    }
  };

  const incrementProblems = async (id) => {
    const topic = gateTopics.find(t => t.id === id);
    if (topic) {
      await db.gateTopics.update(id, { problemsSolved: (topic.problemsSolved || 0) + 1 });
    }
  };

  const decrementProblems = async (id) => {
    const topic = gateTopics.find(t => t.id === id);
    if (topic && (topic.problemsSolved || 0) > 0) {
      await db.gateTopics.update(id, { problemsSolved: (topic.problemsSolved || 0) - 1 });
    }
  };

  const handleAddMockTest = async () => {
    if (!mockForm.testName || !mockForm.score || !mockForm.maxScore) return;
    await db.gateScores.add({
      testName: mockForm.testName,
      score: Number(mockForm.score),
      maxScore: Number(mockForm.maxScore),
      weakAreas: mockForm.weakAreas,
      date: mockForm.date
    });
    setMockForm({ testName: '', score: '', maxScore: '100', weakAreas: '', date: new Date().toISOString().split('T')[0] });
    setShowMockForm(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><GraduationCap size={28} /> GATE 2027 Prep</h1>
          <p className="page-subtitle">CSE Syllabus Tracker · {overall.done}/{overall.total} topics covered · {overall.pct}%</p>
        </div>
      </div>

      {/* Countdown */}
      <div className="countdown-strip">
        <div className="countdown-unit"><div className="countdown-value">{days}</div><div className="countdown-label">Days</div></div>
        <div className="countdown-unit"><div className="countdown-value">{hours}</div><div className="countdown-label">Hours</div></div>
        <div className="countdown-unit"><div className="countdown-value">{mins}</div><div className="countdown-label">Minutes</div></div>
        <div style={{ marginLeft: 'var(--space-xl)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Until GATE 2027</div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Feb 7, 2027</div>
        </div>
      </div>

      {/* Overall Progress & Syllabus Chart */}
      <div className="glass-card no-hover" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="flex items-center justify-between mb-md">
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Overall Syllabus Progress</div>
          <div className="text-mono" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.2rem' }}>{overall.pct}%</div>
        </div>
        <div className="progress-bar" style={{ height: 14 }}>
          <div className="progress-bar-fill" style={{ width: `${overall.pct}%` }} />
        </div>
        <div className="flex justify-between mt-sm mb-lg" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>{overall.done} completed</span><span>{overall.total - overall.done} remaining</span>
        </div>

        {/* Syllabus Tracking Chart */}
        {subjects.length > 0 && (
          <div style={{ height: 250, width: '100%', marginTop: 'var(--space-md)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjects} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} angle={-45} textAnchor="end" truncateBy="10" />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                  labelStyle={{ color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 600 }}
                  itemStyle={{ color: 'var(--emerald)' }}
                  formatter={(val, name) => [`${val}%`, 'Completed']}
                />
                <Bar dataKey="pct" fill="var(--emerald)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    {/* Subject Cards */}
      <div className="gate-subjects-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
        {subjects.map(sub => {
          const isExpanded = expandedSubject === sub.name;
          return (
            <div key={sub.name} className="gate-subject-card">
              <div className="gate-subject-header" onClick={() => setExpandedSubject(isExpanded ? null : sub.name)} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="gate-subject-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {sub.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, paddingLeft: 24 }}>
                    Rev: {sub.totalRevisions} · Problems: {sub.totalProblemsSolved}
                  </div>
                </div>
                <div className="gate-subject-progress-text">{sub.done}/{sub.total}</div>
              </div>
              <div className="progress-bar" style={{ height: 6, margin: '0 var(--space-md)' }}>
                <div className="progress-bar-fill" style={{ width: `${sub.pct}%`, background: sub.pct === 100 ? 'var(--emerald)' : undefined }} />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="gate-topic-list">
                    {sub.topics.map(topic => (
                      <div key={topic.id} className="gate-topic-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-sm" style={{ flex: 1, minWidth: 0 }}>
                            <button className={`todo-checkbox ${topic.completed ? 'checked' : ''}`}
                              style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0 }}
                              onClick={() => toggleTopic(topic.id, topic.completed)}>
                              {topic.completed && <Check size={10} color="white" />}
                            </button>
                            <span style={{ textDecoration: topic.completed ? 'line-through' : 'color: topic.completed ? \'var(--text-muted)\' : \'var(--text-primary)\'', fontSize: '0.85rem' }}>
                              {topic.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-md" style={{ paddingLeft: 28, fontSize: '0.75rem' }}>
                          {/* Revisions */}
                          <div className="flex items-center gap-xs" style={{ color: 'var(--cyan)' }}>
                            <RotateCcw size={11} />
                            <span className="text-mono" style={{ fontWeight: 600 }}>Rev: {topic.revisionCount || 0}</span>
                            <button className="btn btn-ghost btn-icon" onClick={() => decrementRevision(topic.id)} style={{ padding: 1, width: 18, height: 18 }} title="Decrease"><Minus size={10} /></button>
                            <button className="btn btn-ghost btn-icon" onClick={() => incrementRevision(topic.id)} style={{ padding: 1, width: 18, height: 18 }} title="Increase"><Plus size={10} /></button>
                          </div>
                          {/* Problems */}
                          <div className="flex items-center gap-xs" style={{ color: 'var(--amber)' }}>
                            <span className="text-mono" style={{ fontWeight: 600 }}>☑ Problems: {topic.problemsSolved || 0}</span>
                            <button className="btn btn-ghost btn-icon" onClick={() => decrementProblems(topic.id)} style={{ padding: 1, width: 18, height: 18 }} title="Decrease"><Minus size={10} /></button>
                            <button className="btn btn-ghost btn-icon" onClick={() => incrementProblems(topic.id)} style={{ padding: 1, width: 18, height: 18 }} title="Increase"><Plus size={10} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Mock Test Analytics */}
      <div className="glass-card no-hover" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="flex items-center justify-between mb-md">
          <div className="flex items-center gap-sm">
            <Activity size={20} color="royalblue" />
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Mock Test Analytics</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowMockForm(!showMockForm)}><Plus size={14}/> Add Score</button>
        </div>

        {/* Add Mock Test Form */}
        <AnimatePresence>
          {showMockForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ background: 'var(--surface-2)', padding: 'var(--space-md)', borderRadius: 8, marginBottom: 'var(--space-lg)', display: 'grid', gap: 'var(--space-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--space-sm)' }}>
                  <input className="input" placeholder="Test Name (e.g. Made Easy Mock 1)" value={mockForm.testName} onChange={e => setMockForm({...mockForm, testName: e.target.value})} />
                  <input className="input" type="number" placeholder="Score" value={mockForm.score} onChange={e => setMockForm({...mockForm, score: e.target.value})} />
                  <input className="input" type="number" placeholder="Max" value={mockForm.maxScore} onChange={e => setMockForm({...mockForm, maxScore: e.target.value})} />
                  <input className="input" type="date" value={mockForm.date} onChange={e => setMockForm({...mockForm, date: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <input className="input" style={{ flex: 1 }} placeholder="Weak Areas (e.g. 'Pipelining, Recurrence relations')" value={mockForm.weakAreas} onChange={e => setMockForm({...mockForm, weakAreas: e.target.value})} />
                  <button className="btn btn-primary" onClick={handleAddMockTest}>Save Score</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mock Tests Chart */}
        {gateScores.length > 0 ? (
          <>
            <div style={{ height: 250, width: '100%', marginBottom: 'var(--space-xl)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gateScores.map(g => ({ ...g, pct: ((g.score / g.maxScore) * 100).toFixed(1) }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="testName" stroke="var(--text-muted)" fontSize={11} truncateBy="15" />
                  <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 600 }}
                    itemStyle={{ color: 'royalblue' }}
                  />
                  <Line type="monotone" dataKey="pct" name="Score %" stroke="royalblue" strokeWidth={3} dot={{ r: 4, fill: 'royalblue' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Mock Tests Table */}
            <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px', fontWeight: 600 }}>Test Name</th>
                    <th style={{ padding: '8px', fontWeight: 600 }}>Score</th>
                    <th style={{ padding: '8px', fontWeight: 600 }}>Weak Areas</th>
                    <th style={{ padding: '8px', width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {gateScores.map(score => (
                    <tr key={score.id} style={{ borderBottom: '1px solid var(--border-hover)' }}>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{score.date}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 500, color: 'var(--text-primary)' }}>{score.testName}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontWeight: 600, color: 'royalblue' }}>{score.score}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> / {score.maxScore}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {score.weakAreas ? (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <PenTool size={12} style={{ color: 'var(--rose)', marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{score.weakAreas}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => db.gateScores.delete(score.id)} style={{ color: 'var(--rose)' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--text-muted)' }}>
            <Activity size={32} style={{ opacity: 0.2, margin: '0 auto var(--space-md)' }} />
            <p>No mock tests recorded yet. Start tracking your scores!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
