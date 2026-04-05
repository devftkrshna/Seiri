import { useLiveQuery } from 'dexie-react-hooks';
import { Lightbulb, Plus, Trash2, Search, Pencil } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import db from '../db';
import { SNIPPET_CATEGORIES } from '../constants';
import { timeAgo } from '../helpers';
import Modal from '../components/Modal';

export default function SnippetBoard() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });

  const snippets = useLiveQuery(() => db.snippets.orderBy('createdAt').reverse().toArray()) || [];

  const filtered = snippets.filter(s => {
    if (catFilter !== 'all' && s.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (editId) {
      await db.snippets.update(editId, { title: form.title, content: form.content, category: form.category });
      setEditId(null);
    } else {
      await db.snippets.add({ ...form, createdAt: new Date().toISOString() });
    }
    setForm({ title: '', content: '', category: 'general' });
    setShowModal(false);
  };

  const handleEdit = (s) => {
    setForm({ title: s.title, content: s.content || '', category: s.category || 'general' });
    setEditId(s.id);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditId(null); setForm({ title: '', content: '', category: 'general' }); };

  const getCatLabel = (id) => SNIPPET_CATEGORIES.find(c => c.id === id)?.label || id;
  const getCatColor = (id) => SNIPPET_CATEGORIES.find(c => c.id === id)?.color || 'ghost';

  const catColorMap = {
    system_design: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))',
    project_ideas: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))',
    code_snippet: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.04))',
    bash: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
    general: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Lightbulb size={28} /> Snippet & Idea Board</h1>
          <p className="page-subtitle">Dump your ideas, code snippets & project thoughts. {snippets.length} snippets.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setForm({ title: '', content: '', category: 'general' }); setEditId(null); setShowModal(true); }}><Plus size={18} /> New Snippet</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search /><input className="input" placeholder="Search snippets..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          <button className={`filter-tab ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>All</button>
          {SNIPPET_CATEGORIES.map(c => (
            <button key={c.id} className={`filter-tab ${catFilter === c.id ? 'active' : ''}`} onClick={() => setCatFilter(c.id)}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Snippet Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Lightbulb size={32} /></div>
          <div className="empty-state-title">{search ? 'No matching snippets' : 'Idea board is empty'}</div>
          <div className="empty-state-desc">Dump your random system design ideas, project thoughts, or useful bash/code snippets here so you don't lose them.</div>
          {!search && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> First Snippet</button>}
        </div>
      ) : (
        <div className="snippet-grid">
          {filtered.map(s => (
            <motion.div key={s.id} className="snippet-card" style={{ background: catColorMap[s.category] || catColorMap.general }} layout>
              <div className="snippet-card-header">
                <span className={`badge badge-${getCatColor(s.category)}`}>{getCatLabel(s.category)}</span>
                <div className="flex gap-xs">
                  <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(s)} title="Edit"><Pencil size={14} /></button>
                  <button className="btn btn-ghost btn-icon" onClick={() => db.snippets.delete(s.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="snippet-card-title">{s.title}</div>
              {s.content && <pre className="snippet-card-content">{s.content}</pre>}
              <div className="snippet-card-time">{timeAgo(s.createdAt)}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editId ? 'Edit Snippet' : 'New Snippet'}
        footer={
          <div className="flex items-center justify-between w-full">
            {editId && <button className="btn btn-danger btn-sm" onClick={() => { db.snippets.delete(editId); closeModal(); }}><Trash2 size={14} /> Delete</button>}
            <div className="flex gap-sm" style={{ marginLeft: 'auto' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Update' : 'Save'}</button>
            </div>
          </div>
        }>
        <div className="form-grid">
          <div className="input-group full-width">
            <label className="input-label">Title *</label>
            <input className="input" placeholder="Rate limiter design / Bash trick / Project idea..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {SNIPPET_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="input-group" style={{ marginTop: 'var(--space-md)' }}>
          <label className="input-label">Content</label>
          <textarea className="input formula-textarea" placeholder="Your code snippet, system design notes, or project idea..." rows={6}
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        </div>
      </Modal>
    </motion.div>
  );
}
