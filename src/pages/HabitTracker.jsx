import { useLiveQuery } from 'dexie-react-hooks';
import { Target, Plus, Trash2, Flame, Check, Pencil, X, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import db from '../db';
import { DEFAULT_HABITS } from '../constants';

const getToday = () => new Date().toISOString().split('T')[0];
const getDayLabel = (offset) => {
  const d = new Date(); d.setDate(d.getDate() - offset);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
};
const getDateStr = (offset) => {
  const d = new Date(); d.setDate(d.getDate() - offset);
  return d.toISOString().split('T')[0];
};

export default function HabitTracker() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '✅' });

  const habits = useLiveQuery(() => db.habits.orderBy('order').toArray()) || [];
  const allLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];

  // Seed default habits on first load
  useEffect(() => {
    (async () => {
      const count = await db.habits.count();
      if (count === 0) {
        for (let i = 0; i < DEFAULT_HABITS.length; i++) {
          await db.habits.add({ ...DEFAULT_HABITS[i], order: i });
        }
      }
    })();
  }, []);

  const [selectedDate, setSelectedDate] = useState(getToday());
  const today = getToday();

  const currentLogs = useMemo(() => {
    const map = {};
    allLogs.filter(l => l.date === selectedDate).forEach(l => { map[l.habitId] = l; });
    return map;
  }, [allLogs, selectedDate]);

  const completedCurrent = Object.values(currentLogs).filter(l => l.completed).length;
  const totalHabits = habits.length;
  const completionPct = totalHabits > 0 ? Math.round((completedCurrent / totalHabits) * 100) : 0;

  // Streak calculation for each habit
  const getStreak = (habitId) => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const dateStr = getDateStr(i);
      const log = allLogs.find(l => l.habitId === habitId && l.date === dateStr && l.completed);
      if (log) streak++;
      else break;
    }
    return streak;
  };

  // 30-day Month grid data
  const monthData = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const dateStr = getDateStr(29 - i);
      const d = new Date(dateStr);
      const label = d.getDate();
      const completedCount = habits.filter(h => allLogs.find(l => l.habitId === h.id && l.date === dateStr && l.completed)).length;
      return { dateStr, label, completedCount, total: totalHabits };
    });
  }, [habits, allLogs, totalHabits]);

  const toggleHabit = async (habitId) => {
    const existing = allLogs.find(l => l.habitId === habitId && l.date === selectedDate);
    if (existing) {
      await db.habitLogs.update(existing.id, { completed: !existing.completed });
    } else {
      await db.habitLogs.add({ habitId, date: selectedDate, completed: true });
    }
  };

  const addHabit = async () => {
    if (!newHabit.name.trim()) return;
    await db.habits.add({ name: newHabit.name, icon: newHabit.icon, category: 'custom', order: habits.length });
    setNewHabit({ name: '', icon: '✅' });
    setShowAddForm(false);
  };

  const startEdit = (habit) => {
    setEditingId(habit.id);
    setNewHabit({ name: habit.name, icon: habit.icon });
  };

  const saveEdit = async () => {
    if (!newHabit.name.trim() || !editingId) return;
    await db.habits.update(editingId, { name: newHabit.name, icon: newHabit.icon });
    setEditingId(null);
    setNewHabit({ name: '', icon: '✅' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewHabit({ name: '', icon: '✅' });
  };

  const deleteHabit = async (id) => {
    await db.habits.delete(id);
    await db.habitLogs.where('habitId').equals(id).delete();
    if (editingId === id) cancelEdit();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Target size={28} /> Habit Tracker</h1>
          <p className="page-subtitle">Build non-negotiable daily routines. {completedCurrent}/{totalHabits} done for this day.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { cancelEdit(); setShowAddForm(!showAddForm); }}><Plus size={18} /> Add Habit</button>
        </div>
      </div>

      {/* Daily Progress */}
      <div className="glass-card no-hover" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="flex items-center justify-between mb-md">
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedDate === today ? "Today's Progress" : `Progress for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}`}
              {selectedDate !== today && (
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(today)} title="Back to Today">
                  <RotateCcw size={14} /> Today
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: completionPct === 100 ? 'var(--emerald)' : 'var(--accent)' }}>
            {completionPct}%
          </div>
        </div>
        <div className="progress-bar" style={{ height: 12 }}>
          <div className="progress-bar-fill" style={{ width: `${completionPct}%`, background: completionPct === 100 ? 'var(--emerald)' : undefined }} />
        </div>
      </div>

      {/* Add Habit Form */}
      {showAddForm && (
        <motion.div className="glass-card no-hover" style={{ marginBottom: 'var(--space-lg)' }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <div className="flex items-center gap-md">
            <input className="input" style={{ width: 50, textAlign: 'center', fontSize: '1.3rem', padding: '8px' }} placeholder="✅" maxLength={2}
              value={newHabit.icon} onChange={e => setNewHabit({ ...newHabit, icon: e.target.value })} />
            <input className="input" style={{ flex: 1 }} placeholder="Habit name (e.g., Read 20 pages)" value={newHabit.name}
              onChange={e => setNewHabit({ ...newHabit, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && addHabit()} />
            <button className="btn btn-primary" onClick={addHabit}>Add</button>
          </div>
        </motion.div>
      )}

      <div className="two-col">
        {/* Habit Checklist */}
        <div>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
            {selectedDate === today ? "Today's Checklist" : "Checklist"}
          </h4>
          <div className="flex flex-col gap-sm">
            {habits.map(habit => {
              const isCompleted = currentLogs[habit.id]?.completed;
              const streak = getStreak(habit.id);
              const isEditing = editingId === habit.id;
              return (
                <motion.div key={habit.id} className={`habit-item ${isCompleted ? 'completed' : ''}`} layout>
                  <button className={`todo-checkbox ${isCompleted ? 'checked' : ''}`} onClick={() => toggleHabit(habit.id)}>
                    {isCompleted && <Check size={14} color="white" />}
                  </button>
                  {isEditing ? (
                    <div className="flex items-center gap-sm" style={{ flex: 1 }}>
                      <input className="input" style={{ width: 40, textAlign: 'center', fontSize: '1.1rem', padding: '4px' }}
                        value={newHabit.icon} onChange={e => setNewHabit({ ...newHabit, icon: e.target.value })} />
                      <input className="input" style={{ flex: 1, padding: '6px 10px' }}
                        value={newHabit.name} onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                      <button className="btn btn-primary btn-sm" onClick={saveEdit}><Check size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={cancelEdit}><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="habit-icon">{habit.icon}</span>
                      <div className="habit-content">
                        <div className="habit-name">{habit.name}</div>
                        {streak > 0 && (
                          <div className="habit-streak"><Flame size={12} style={{ color: 'var(--amber)' }} /> {streak} day streak</div>
                        )}
                      </div>
                      <button className="btn btn-ghost btn-icon" onClick={() => startEdit(habit)} title="Edit"><Pencil size={14} /></button>
                      <button className="btn btn-ghost btn-icon" onClick={() => deleteHabit(habit.id)}><Trash2 size={14} /></button>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Monthly Grid */}
        <div className="glass-card no-hover">
          <div className="flex items-center gap-sm mb-lg">
            <CalendarIcon size={18} className="text-secondary" />
            <h4 style={{ color: 'var(--text-secondary)' }}>Last 30 Days</h4>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '8px',
            alignItems: 'start'
          }}>
            {monthData.map((day, i) => {
              const pct = day.total > 0 ? day.completedCount / day.total : 0;
              const isSelected = day.dateStr === selectedDate;
              const isToday = day.dateStr === today;
              
              return (
                <div key={i} 
                     onClick={() => setSelectedDate(day.dateStr)}
                     style={{
                       display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                       cursor: 'pointer', padding: '6px 2px', borderRadius: '8px',
                       background: isSelected ? 'var(--surface-3)' : 'transparent',
                       border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                       transition: 'all 0.2s ease'
                     }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: isToday ? 600 : 400
                  }}>
                    {day.label}
                  </div>
                  <div className="week-day-circle" style={{
                    width: '24px', height: '24px',
                    background: pct >= 1 ? 'var(--emerald)' : pct > 0 ? `conic-gradient(var(--accent) ${pct * 360}deg, var(--surface-3) ${pct * 360}deg)` : 'var(--surface-3)',
                    boxShadow: pct >= 1 && isSelected ? '0 0 12px var(--emerald-glow)' : 'none',
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                  }}>
                    {pct >= 1 ? <Check size={12} color="white" /> : (
                      <div style={{ width: '80%', height: '80%', borderRadius: '50%', background: 'var(--surface-2)', display: pct > 0 ? 'block' : 'none' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
