import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Plus, Trash2, Copy, Search, Check, Pencil, Image, FileText } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import db from '../db';
import { FORMULA_CATEGORIES } from '../constants';
import Modal from '../components/Modal';

export default function FormulaVault() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'General', attachments: [] });
  const fileRef = useRef(null);

  const formulas = useLiveQuery(() => db.formulas.orderBy('createdAt').reverse().toArray()) || [];

  const filtered = formulas.filter(f => {
    if (catFilter !== 'all' && f.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSave = async () => {
    if (!form.title.trim()) return;
    const data = { title: form.title, content: form.content, category: form.category, attachments: form.attachments || [] };
    if (editId) {
      await db.formulas.update(editId, data);
      setEditId(null);
    } else {
      await db.formulas.add({ ...data, createdAt: new Date().toISOString() });
    }
    setForm({ title: '', content: '', category: 'General', attachments: [] });
    setShowModal(false);
  };

  const handleEdit = (f) => {
    setForm({ title: f.title, content: f.content, category: f.category, attachments: f.attachments || [] });
    setEditId(f.id);
    setShowModal(true);
  };

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const closeModal = () => { setShowModal(false); setEditId(null); setForm({ title: '', content: '', category: 'General', attachments: [] }); };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(f => ({
          ...f,
          attachments: [...(f.attachments || []), {
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result, // base64 data URL
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setForm(f => ({ ...f, attachments: f.attachments.filter((_, i) => i !== index) }));
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.includes('pdf')) return '📄';
    return '📎';
  };

  // Viewer for attachments
  const [viewingAttachment, setViewingAttachment] = useState(null);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><BookOpen size={28} /> Formula Vault</h1>
          <p className="page-subtitle">Quick-access cheat sheets, formulas & core concepts. {formulas.length} entries.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setForm({ title: '', content: '', category: 'General', attachments: [] }); setEditId(null); setShowModal(true); }}><Plus size={18} /> Add Formula</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search /><input className="input" placeholder="Search formulas & concepts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="filter-tabs">
        <button className={`filter-tab ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>All</button>
        {FORMULA_CATEGORIES.map(c => (
          <button key={c} className={`filter-tab ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={32} /></div>
          <div className="empty-state-title">{search ? 'No matching formulas' : 'Vault is empty'}</div>
          <div className="empty-state-desc">Add your important formulas, definitions, and key concepts for quick revision during study sessions.</div>
          {!search && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add First Entry</button>}
        </div>
      ) : (
        <div className="formula-grid">
          {filtered.map(f => (
            <motion.div key={f.id} className="formula-card" layout>
              <div className="formula-card-header">
                <span className={`badge badge-${f.category === 'DSA' ? 'emerald' : f.category === 'Mathematics' ? 'cyan' : 'violet'}`}>{f.category}</span>
                <div className="flex gap-xs">
                  <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(f)} title="Edit"><Pencil size={14} /></button>
                  <button className="btn btn-ghost btn-icon" onClick={() => handleCopy(f.id, f.content)} title="Copy to clipboard">
                    {copiedId === f.id ? <Check size={14} style={{ color: 'var(--emerald)' }} /> : <Copy size={14} />}
                  </button>
                  <button className="btn btn-ghost btn-icon" onClick={() => db.formulas.delete(f.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="formula-card-title">{f.title}</div>
              {f.content && <pre className="formula-card-content">{f.content}</pre>}
              {/* Attachments preview */}
              {f.attachments?.length > 0 && (
                <div className="flex flex-wrap gap-sm" style={{ marginTop: 'var(--space-sm)' }}>
                  {f.attachments.map((att, i) => (
                    <div key={i} className="attachment-thumb" onClick={() => setViewingAttachment(att)} style={{ cursor: 'pointer' }}>
                      {att.type?.startsWith('image/') ? (
                        <img src={att.data} alt={att.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                      ) : (
                        <div style={{ width: 60, height: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.65rem', color: 'var(--text-muted)', padding: 4, textAlign: 'center' }}>
                          <span style={{ fontSize: '1.2rem' }}>{getFileIcon(att.type)}</span>
                          <span className="truncate" style={{ maxWidth: 56 }}>{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setViewingAttachment(null)}>
          <div className="modal-box" style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{viewingAttachment.name}</h3>
              <button className="modal-close" onClick={() => setViewingAttachment(null)}>×</button>
            </div>
            <div style={{ padding: 'var(--space-lg)' }}>
              {viewingAttachment.type?.startsWith('image/') ? (
                <img src={viewingAttachment.data} alt={viewingAttachment.name} style={{ width: '100%', borderRadius: 8 }} />
              ) : viewingAttachment.type?.includes('pdf') ? (
                <iframe src={viewingAttachment.data} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }} title={viewingAttachment.name} />
              ) : (
                <div className="empty-state">
                  <p>Preview not available. <a href={viewingAttachment.data} download={viewingAttachment.name} style={{ color: 'var(--accent)' }}>Download file</a></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editId ? 'Edit Formula' : 'Add Formula / Concept'}
        footer={
          <div className="flex items-center justify-between w-full">
            {editId && <button className="btn btn-danger btn-sm" onClick={() => { db.formulas.delete(editId); closeModal(); }}><Trash2 size={14} /> Delete</button>}
            <div className="flex gap-sm" style={{ marginLeft: 'auto' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Update' : 'Save'}</button>
            </div>
          </div>
        }>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">Title *</label><input className="input" placeholder="Floyd-Warshall Algorithm" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="input-group">
            <label className="input-label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {FORMULA_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Content <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(formulas, definitions, pseudocode)</span></label>
          <textarea className="input formula-textarea" placeholder={"O(V³)\nfor k = 1 to V:\n  for i = 1 to V:\n    for j = 1 to V:\n      dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])"} rows={6}
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        </div>

        {/* File Upload */}
        <div className="input-group">
          <label className="input-label">Attachments <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(images, PDFs)</span></label>
          <input ref={fileRef} type="file" accept="image/*,.pdf" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ marginBottom: 'var(--space-sm)' }}>
            <Image size={14} /> Upload Image / PDF
          </button>
          {form.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-sm">
              {form.attachments.map((att, i) => (
                <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                  {att.type?.startsWith('image/') ? (
                    <img src={att.data} alt={att.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: 60, height: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.65rem', color: 'var(--text-muted)', padding: 4, textAlign: 'center' }}>
                      <span style={{ fontSize: '1.2rem' }}>{getFileIcon(att.type)}</span>
                      <span className="truncate" style={{ maxWidth: 56 }}>{att.name}</span>
                    </div>
                  )}
                  <button onClick={() => removeAttachment(i)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--rose)', color: 'white', border: 'none', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}
