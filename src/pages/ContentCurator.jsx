import { useLiveQuery } from 'dexie-react-hooks';
import { Bookmark, Plus, Search, Star, Trash2, ExternalLink, Pencil } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import db from '../db';
import { CONTENT_TYPES } from '../constants';
import { formatDate } from '../helpers';
import Modal from '../components/Modal';

const defaultForm = { type: 'github', url: '', title: '', description: '', tags: '', isFavorite: false };

// Auto-detect platform from URL
function detectPlatform(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('github.com')) return 'github';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'tweet';
  if (u.includes('instagram.com')) return 'reel';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'reel';
  if (u.includes('linkedin.com')) return 'article';
  if (u.includes('medium.com') || u.includes('dev.to') || u.includes('hashnode.')) return 'article';
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(u)) return 'image';
  if (/\.(mp4|mov|webm)(\?|$)/i.test(u)) return 'reel';
  return null;
}

export default function ContentCurator() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const contents = useLiveQuery(() => db.contents.orderBy('createdAt').reverse().toArray()) || [];

  const filtered = contents.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.tags?.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const handleUrlChange = (url) => {
    const detected = detectPlatform(url);
    setForm(f => ({ ...f, url, ...(detected && !editId ? { type: detected } : {}) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    const tags = typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : (form.tags || []);
    const data = { ...form, tags };
    if (editId) {
      await db.contents.update(editId, { ...data, updatedAt: new Date().toISOString() });
      setEditId(null);
    } else {
      await db.contents.add({ ...data, createdAt: new Date().toISOString() });
    }
    setForm(defaultForm);
    setShowModal(false);
  };

  const handleEdit = (c) => {
    setForm({
      type: c.type,
      url: c.url || '',
      title: c.title,
      description: c.description || '',
      tags: c.tags?.join(', ') || '',
      isFavorite: c.isFavorite || false,
    });
    setEditId(c.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => { await db.contents.delete(id); };

  const toggleFav = async (id, current) => {
    await db.contents.update(id, { isFavorite: !current });
  };

  const getTypeInfo = (type) => CONTENT_TYPES.find(t => t.id === type) || CONTENT_TYPES[0];

  const closeModal = () => { setShowModal(false); setEditId(null); setForm(defaultForm); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Bookmark size={28} /> Content Curator</h1>
          <p className="page-subtitle">Save repos, tweets, tips, images & more from across the web.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setForm(defaultForm); setEditId(null); setShowModal(true); }}><Plus size={18} /> Save Content</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search />
          <input className="input" placeholder="Search saved content..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          <button className={`filter-tab ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
          {CONTENT_TYPES.map(t => (
            <button key={t.id} className={`filter-tab ${typeFilter === t.id ? 'active' : ''}`} onClick={() => setTypeFilter(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bookmark size={32} /></div>
          <div className="empty-state-title">No content saved yet</div>
          <div className="empty-state-desc">Start curating! Save GitHub repos, tweets with tips, images, and anything useful for your journey.</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Save Your First Link</button>
        </div>
      ) : (
        <div className="content-grid">
          {filtered.map(c => {
            const typeInfo = getTypeInfo(c.type);
            return (
              <motion.div key={c.id} className="content-card" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="content-card-header">
                  <span className={`badge badge-${typeInfo.color}`}>{typeInfo.label}</span>
                  <div className="flex gap-xs">
                    <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(c)} title="Edit"><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => toggleFav(c.id, c.isFavorite)} style={{ color: c.isFavorite ? 'var(--amber)' : undefined }}>
                      <Star size={16} fill={c.isFavorite ? 'var(--amber)' : 'none'} />
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="content-card-title">{c.title}</div>
                {c.description && <div className="content-card-desc">{c.description}</div>}
                {c.tags?.length > 0 && (
                  <div className="content-card-tags">
                    {c.tags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                  </div>
                )}
                <div className="content-card-footer">
                  <span>{formatDate(c.createdAt)}</span>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-xs" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                      Open <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editId ? 'Edit Content' : 'Save Content'}
        footer={
          <div className="flex items-center justify-between w-full">
            {editId && <button className="btn btn-danger btn-sm" onClick={() => { handleDelete(editId); closeModal(); }}><Trash2 size={14} /> Delete</button>}
            <div className="flex gap-sm" style={{ marginLeft: 'auto' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Update' : 'Save'}</button>
            </div>
          </div>
        }>
        <div className="input-group">
          <label className="input-label">URL <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(paste a link to auto-detect platform)</span></label>
          <input className="input" placeholder="https://..." value={form.url} onChange={e => handleUrlChange(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Type</label>
          <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            {CONTENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Title *</label>
          <input className="input" placeholder="e.g. Awesome React Hooks repo" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="input-group">
          <label className="input-label">Description</label>
          <textarea className="input" placeholder="What's useful about this?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="input-group">
          <label className="input-label">Tags (comma separated)</label>
          <input className="input" placeholder="react, hooks, tips" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
        </div>
      </Modal>
    </motion.div>
  );
}
