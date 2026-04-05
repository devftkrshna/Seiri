import { useLiveQuery } from 'dexie-react-hooks';
import { ListTodo, Plus, Trash2, Check, Calendar, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import db from '../db';
import { TASK_CATEGORIES, TASK_PRIORITIES } from '../constants';
import { formatDate, isDueToday, isDueThisWeek, isOverdue } from '../helpers';
import Modal from '../components/Modal';

export default function TodoList() {
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'work', priority: 'p2', dueDate: '' });

  const tasks = useLiveQuery(() => db.tasks.orderBy('createdAt').reverse().toArray()) || [];

  const filtered = tasks.filter(t => {
    if (filter === 'today') return isDueToday(t.dueDate) || (!t.dueDate && !t.completed);
    if (filter === 'week') return isDueThisWeek(t.dueDate) || isDueToday(t.dueDate);
    if (filter === 'done') return t.completed;
    if (filter === 'pending') return !t.completed;
    return true;
  }).filter(t => {
    if (catFilter !== 'all') return t.category === catFilter;
    return true;
  });

  const handleQuickAdd = async () => {
    if (!newTask.trim()) return;
    await db.tasks.add({ title: newTask.trim(), category: 'work', priority: 'p2', completed: false, createdAt: new Date().toISOString() });
    setNewTask('');
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (editId) {
      await db.tasks.update(editId, { title: form.title, category: form.category, priority: form.priority, dueDate: form.dueDate || null });
      setEditId(null);
    } else {
      await db.tasks.add({ ...form, completed: false, createdAt: new Date().toISOString(), dueDate: form.dueDate || null });
    }
    setForm({ title: '', category: 'work', priority: 'p2', dueDate: '' });
    setShowModal(false);
  };

  const handleEdit = (task) => {
    setForm({ title: task.title, category: task.category || 'work', priority: task.priority || 'p2', dueDate: task.dueDate || '' });
    setEditId(task.id);
    setShowModal(true);
  };

  const toggleComplete = async (task) => {
    await db.tasks.update(task.id, { completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null });
  };

  const deleteTask = async (id) => { await db.tasks.delete(id); };

  const closeModal = () => { setShowModal(false); setEditId(null); setForm({ title: '', category: 'work', priority: 'p2', dueDate: '' }); };

  const getPriorityInfo = (p) => TASK_PRIORITIES.find(pr => pr.id === p) || TASK_PRIORITIES[2];
  const getCatInfo = (c) => TASK_CATEGORIES.find(ca => ca.id === c) || TASK_CATEGORIES[0];

  const pendingCount = tasks.filter(t => !t.completed).length;
  const doneCount = tasks.filter(t => t.completed).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><ListTodo size={28} /> To-Do List</h1>
          <p className="page-subtitle">{pendingCount} pending · {doneCount} completed</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setForm({ title: '', category: 'work', priority: 'p2', dueDate: '' }); setEditId(null); setShowModal(true); }}><Plus size={18} /> Add Task</button>
        </div>
      </div>

      {/* Quick Add */}
      <div className="todo-add-input">
        <input className="input" placeholder="Quick add a task... press Enter" value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleQuickAdd()} />
        <button className="btn btn-primary" onClick={handleQuickAdd}><Plus size={18} /></button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`filter-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
          <button className={`filter-tab ${filter === 'today' ? 'active' : ''}`} onClick={() => setFilter('today')}>Today</button>
          <button className={`filter-tab ${filter === 'week' ? 'active' : ''}`} onClick={() => setFilter('week')}>This Week</button>
          <button className={`filter-tab ${filter === 'done' ? 'active' : ''}`} onClick={() => setFilter('done')}>Done</button>
        </div>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          <button className={`filter-tab ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>All</button>
          {TASK_CATEGORIES.map(c => (
            <button key={c.id} className={`filter-tab ${catFilter === c.id ? 'active' : ''}`} onClick={() => setCatFilter(c.id)}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ListTodo size={32} /></div>
          <div className="empty-state-title">{filter === 'done' ? 'No completed tasks' : 'No tasks yet'}</div>
          <div className="empty-state-desc">{filter === 'done' ? 'Complete some tasks to see them here.' : 'Add your first task above to get started.'}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {filtered.map(task => {
            const priority = getPriorityInfo(task.priority);
            const cat = getCatInfo(task.category);
            return (
              <motion.div key={task.id} className={`todo-item ${task.completed ? 'completed' : ''}`} layout>
                <button className={`todo-checkbox ${task.completed ? 'checked' : ''}`} onClick={() => toggleComplete(task)}>
                  {task.completed && <Check size={14} color="white" />}
                </button>
                <div className="todo-content" onClick={() => handleEdit(task)} style={{ cursor: 'pointer' }}>
                  <div className="todo-title">{task.title}</div>
                  <div className="todo-meta">
                    <span className={`badge badge-${priority.color}`}>{priority.label}</span>
                    <span className={`badge badge-${cat.color}`}>{cat.label}</span>
                    {task.dueDate && (
                      <span className={isOverdue(task.dueDate) && !task.completed ? 'overdue' : ''}>
                        <Calendar size={12} style={{ display: 'inline', marginRight: 3 }} />
                        {formatDate(task.dueDate)}
                        {isOverdue(task.dueDate) && !task.completed && ' (overdue)'}
                      </span>
                    )}
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(task)} title="Edit"><Pencil size={14} /></button>
                <button className="btn btn-ghost btn-icon" onClick={() => deleteTask(task.id)}><Trash2 size={16} /></button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editId ? 'Edit Task' : 'Add Task'}
        footer={
          <div className="flex items-center justify-between w-full">
            {editId && <button className="btn btn-danger btn-sm" onClick={() => { deleteTask(editId); closeModal(); }}><Trash2 size={14} /> Delete</button>}
            <div className="flex gap-sm" style={{ marginLeft: 'auto' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Update' : 'Add'}</button>
            </div>
          </div>
        }>
        <div className="form-grid">
          <div className="input-group full-width">
            <label className="input-label">Task Title *</label>
            <input className="input" placeholder="What needs to be done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {TASK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Priority</label>
            <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {TASK_PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Due Date</label>
            <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
