import { Timer, Play, Pause, RotateCcw, SkipForward, Square, Settings } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import db from '../db';
import { formatTimer } from '../helpers';

export default function Pomodoro() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('pomodoroSettings');
    return saved ? JSON.parse(saved) : { focus: 25, shortBreak: 5, longBreak: 15, sessionsCount: 4 };
  });

  const POMODORO_MODES = useMemo(() => [
    { id: 'work', label: 'Focus', duration: settings.focus * 60 },
    { id: 'short_break', label: 'Short Break', duration: settings.shortBreak * 60 },
    { id: 'long_break', label: 'Long Break', duration: settings.longBreak * 60 },
  ], [settings]);

  const [modeIndex, setModeIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(POMODORO_MODES[0].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [taskCategory, setTaskCategory] = useState('GATE');
  const [taskTitle, setTaskTitle] = useState('');
  const [tags, setTags] = useState('');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef(null);

  const mode = POMODORO_MODES[modeIndex];
  const totalDuration = mode.duration;

  // Sync timeLeft if duration setting changes while timer is stopped
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(POMODORO_MODES[modeIndex].duration);
    }
  }, [POMODORO_MODES, modeIndex, isRunning]);
  const progress = (totalDuration - timeLeft) / totalDuration;
  const circumference = 2 * Math.PI * 140;
  const dashOffset = circumference * (1 - progress);

  const recentPomodoros = useLiveQuery(() => {
    const sixtyDaysAgo = subDays(startOfDay(new Date()), 60);
    return db.pomodoros.where('completedAt').above(sixtyDaysAgo.toISOString()).toArray();
  }) || [];

  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Month Calendar data
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); 
  
  const dailyFocusMap = useMemo(() => {
    const map = {};
    recentPomodoros.forEach(p => {
      if (p.type === 'work') {
        const dStr = p.completedAt.split('T')[0];
        map[dStr] = (map[dStr] || 0) + p.duration;
      }
    });
    return map;
  }, [recentPomodoros]);

  const topicData = useMemo(() => {
    const topicMap = {};
    recentPomodoros.forEach(p => {
      if (p.type === 'work' && p.taskTitle && p.completedAt.startsWith(selectedDate)) {
        topicMap[p.taskTitle] = (topicMap[p.taskTitle] || 0) + (p.duration || 0);
      }
    });
    return Object.entries(topicMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [recentPomodoros, selectedDate]);

  const COLORS = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#64748b'];

  const displayPomodoros = recentPomodoros
    .filter(p => p.completedAt.startsWith(selectedDate))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  const todayPoms = recentPomodoros.filter(p => p.completedAt.startsWith(todayStr));
  const todayMinutes = todayPoms.reduce((sum, p) => sum + (p.duration || 0), 0);

  const completeSession = async (isStop = false, finalTimeLeft = timeLeft) => {
    setIsRunning(false);
    clearInterval(intervalRef.current);

    const elapsedSeconds = totalDuration - finalTimeLeft;
    
    const finalTaskTitle = taskCategory === 'Others' 
      ? (taskTitle.trim() || 'General Focus') 
      : taskCategory;

    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);

    if (mode.id === 'work' && elapsedSeconds > 0) {
      const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      await db.pomodoros.add({ 
        duration: elapsedMinutes, 
        type: mode.id, 
        taskTitle: finalTaskTitle,
        tags: parsedTags,
        completedAt: new Date().toISOString() 
      });
      if (!isStop) setSessionsCompleted(s => s + 1);
    }

    if (isStop) {
      setTimeLeft(POMODORO_MODES[modeIndex].duration);
    } else {
      if (mode.id === 'work') {
        // Auto switch to break
        const nextIndex = (sessionsCompleted + 1) % settings.sessionsCount === 0 ? 2 : 1;
        setModeIndex(nextIndex);
        setTimeLeft(POMODORO_MODES[nextIndex].duration);
      } else {
        // After break, back to work
        setModeIndex(0);
        setTimeLeft(POMODORO_MODES[0].duration);
      }
    }
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setTimeout(() => completeSession(false, 0), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, totalDuration, mode, sessionsCompleted, taskCategory, taskTitle, tags, settings, POMODORO_MODES]); // adding dependencies for closure

  const handleModeChange = (index) => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setModeIndex(index);
    setTimeLeft(POMODORO_MODES[index].duration);
  };

  const handleReset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(mode.duration);
  };

  const handleStop = () => {
    completeSession(true, timeLeft);
  };

  const handleSkip = () => {
    completeSession(false, timeLeft);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Timer size={28} /> Pomodoro Timer</h1>
          <p className="page-subtitle">Stay focused. You've completed {todayPoms.length} sessions ({todayMinutes} min) today.</p>
        </div>
        <button className="icon-btn" onClick={() => setShowSettings(!showSettings)} style={{ padding: 8 }}>
          <Settings size={22} color="var(--text-secondary)" />
        </button>
      </div>

      <div className="pomodoro-container">
        {showSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card" style={{ marginBottom: 'var(--space-lg)', width: '100%', maxWidth: 500 }}>
            <h4 style={{ marginBottom: 'var(--space-md)' }}>Timer Settings</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-md)' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Focus (min)</label>
                <input type="number" className="input" value={settings.focus} onChange={e => {
                  const val = Number(e.target.value);
                  const updated = { ...settings, focus: val > 0 ? val : 1 };
                  setSettings(updated); localStorage.setItem('pomodoroSettings', JSON.stringify(updated));
                }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Short Break (min)</label>
                <input type="number" className="input" value={settings.shortBreak} onChange={e => {
                  const val = Number(e.target.value);
                  const updated = { ...settings, shortBreak: val > 0 ? val : 1 };
                  setSettings(updated); localStorage.setItem('pomodoroSettings', JSON.stringify(updated));
                }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Long Break (min)</label>
                <input type="number" className="input" value={settings.longBreak} onChange={e => {
                  const val = Number(e.target.value);
                  const updated = { ...settings, longBreak: val > 0 ? val : 1 };
                  setSettings(updated); localStorage.setItem('pomodoroSettings', JSON.stringify(updated));
                }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Long Break After (sessions)</label>
                <input type="number" className="input" value={settings.sessionsCount} onChange={e => {
                  const val = Number(e.target.value);
                  const updated = { ...settings, sessionsCount: val > 0 ? val : 1 };
                  setSettings(updated); localStorage.setItem('pomodoroSettings', JSON.stringify(updated));
                }} />
              </div>
            </div>
          </motion.div>
        )}
        {/* Task Input */}
        <div style={{ marginBottom: 'var(--space-md)', width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <select 
            className="input" 
            style={{ textAlign: 'center', fontWeight: '500' }}
            value={taskCategory}
            onChange={e => setTaskCategory(e.target.value)}
          >
            <option value="GATE">GATE</option>
            <option value="LeetCode">LeetCode</option>
            <option value="Project">Project</option>
            <option value="Reading">Reading</option>
            <option value="Others">Others (Custom)</option>
          </select>
          
          {taskCategory === 'Others' && (
            <input 
              type="text" 
              className="input" 
              style={{ textAlign: 'center', fontWeight: '500' }}
              placeholder="What are you focusing on?" 
              value={taskTitle} 
              onChange={e => setTaskTitle(e.target.value)} 
            />
          )}

          <input 
            type="text"
            className="input"
            style={{ textAlign: 'center', fontSize: '0.85rem' }}
            placeholder="Tags (comma separated)..."
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </div>

        {/* Mode Selector */}
        <div className="timer-modes">
          {POMODORO_MODES.map((m, i) => (
            <button key={m.id} className={`timer-mode-btn ${modeIndex === i ? 'active' : ''}`} onClick={() => handleModeChange(i)}>{m.label}</button>
          ))}
        </div>

        {/* Timer Ring */}
        <div className="timer-ring-container">
          <svg className="timer-ring" viewBox="0 0 300 300">
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <circle className="timer-ring-bg" cx="150" cy="150" r="140" />
            <circle
              className={`timer-ring-progress ${mode.id === 'work' ? 'work' : 'break'}`}
              cx="150" cy="150" r="140"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              stroke={mode.id === 'work' ? 'url(#timerGradient)' : '#10b981'}
            />
          </svg>
          <div className="timer-display">
            <div className="timer-time">{formatTimer(timeLeft)}</div>
            <div className="timer-mode-label">{mode.label}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="timer-controls">
          <button className="timer-btn-secondary" onClick={handleReset} title="Reset"><RotateCcw size={20} /></button>
          {isRunning && (
            <button className="timer-btn-secondary" style={{ background: 'var(--surface-3)', border: 'none' }} onClick={handleStop} title="Stop & Log">
              <Square size={20} fill="#f43f5e" color="#f43f5e" />
            </button>
          )}
          <button className="timer-btn-primary" onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
          </button>
          <button className="timer-btn-secondary" onClick={handleSkip} title="Skip"><SkipForward size={20} /></button>
        </div>

        {/* Session Dots */}
        <div className="pomodoro-sessions">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 8 }}>Sessions:</span>
          {Array.from({ length: settings.sessionsCount }).map((_, i) => (
            <div key={i} className={`session-dot ${i < (sessionsCompleted % settings.sessionsCount) ? 'completed' : ''}`} />
          ))}
        </div>

        {/* Analytics & History */}
        <div style={{ width: '100%', maxWidth: 650, marginTop: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
            
            <div className="glass-card no-hover" style={{ flex: '1 1 250px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                <h4 style={{ color: 'var(--text-secondary)' }}>{format(calendarDate, 'MMMM yyyy')}</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{d}</div>)}
                {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`b-${i}`} />)}
                {monthDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const focusMins = dailyFocusMap[dateStr] || 0;
                  const isSel = dateStr === selectedDate;
                  const today = isSameDay(day, new Date());
                  
                  let bg = 'var(--surface-2)';
                  let color = 'var(--text-secondary)';
                  if (focusMins > 180) { bg = 'var(--accent-strong, #6d28d9)'; color = '#fff'; }
                  else if (focusMins > 120) { bg = 'var(--accent, #8b5cf6)'; color = '#fff'; }
                  else if (focusMins > 60) { bg = 'var(--accent-muted, rgba(139, 92, 246, 0.6))'; color = '#fff'; }
                  else if (focusMins > 0) { bg = 'rgba(139, 92, 246, 0.25)'; color = 'var(--text-primary)'; }
                  
                  return (
                    <div 
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className="cal-day-cell"
                      style={{
                        aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', borderRadius: 4, cursor: 'pointer',
                        background: bg, color: color,
                        border: isSel ? '2px solid var(--text-primary)' : (today ? '2px solid var(--accent)' : '1px solid transparent'),
                        opacity: focusMins === 0 && !isSel && !today ? 0.6 : 1,
                        transition: '0.1s'
                      }}
                      title={`${format(day, 'MMM d')}: ${focusMins} min`}
                    >
                      {format(day, 'd')}
                    </div>
                  );
                })}
              </div>
            </div>

            {topicData.length > 0 && (
              <div className="glass-card no-hover" style={{ flex: '1 1 200px' }}>
                <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>Topic Breakdowns</h4>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="var(--text-primary)" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {topicData.reduce((acc, curr) => acc + curr.value, 0)}m
                      </text>
                      <Pie
                        data={topicData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {topicData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                        formatter={(value, name) => [`${value} min`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {(displayPomodoros.length > 0 || selectedDate !== todayStr) && (
            <div className="glass-card no-hover">
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                <h4 style={{ color: 'var(--text-secondary)' }}>
                  {selectedDate === todayStr ? "Today's Sessions" : `Sessions on ${format(new Date(selectedDate), 'MMM d')}`}
                </h4>
                {selectedDate !== todayStr && (
                  <button className="badge" onClick={() => setSelectedDate(todayStr)}>Go to Today</button>
                )}
              </div>
              
              {displayPomodoros.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: 'var(--space-md) 0' }}>
                  No sessions recorded on this day.
                </div>
              ) : (
                <div className="flex flex-col gap-sm">
                  {displayPomodoros.map((p, i) => {
                    const end = new Date(p.completedAt);
                    const start = new Date(end.getTime() - p.duration * 60000);
                    return (
                      <div key={i} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '500', color: p.type === 'work' ? 'var(--accent)' : 'var(--emerald)' }}>
                            {p.type === 'work' ? '🍅 Focus' : '☕ Break'}
                          </div>
                          {p.type === 'work' && p.taskTitle && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                              {p.taskTitle}
                              {p.tags && p.tags.length > 0 && (
                                <span style={{ display: 'inline-flex', gap: 4, marginLeft: 4 }}>
                                  {p.tags.map(t => <span key={t} className="badge" style={{ padding: '0 6px', fontSize: '0.65rem' }}>{t}</span>)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{p.duration} min</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
