import { useLiveQuery } from 'dexie-react-hooks';
import { Briefcase, Plus, Trash2, ArrowRight, Building2 } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import db from '../db';
import { JOB_STATUSES } from '../constants';
import { formatDate } from '../helpers';
import Modal from '../components/Modal';

const defaultForm = { company: '', role: '', url: '', salary: '', location: '', notes: '', status: 'saved' };

export default function JobTracker() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);

  const jobs = useLiveQuery(() => db.jobs.orderBy('appliedAt').reverse().toArray()) || [];

  const handleSave = async () => {
    if (!form.company.trim() || !form.role.trim()) return;
    const data = { ...form, appliedAt: form.appliedAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (editId) {
      await db.jobs.update(editId, data);
      setEditId(null);
    } else {
      await db.jobs.add(data);
    }
    setForm(defaultForm);
    setShowModal(false);
  };

  const handleDelete = async (id) => { await db.jobs.delete(id); };

  const moveJob = async (id, newStatus) => {
    await db.jobs.update(id, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  const editJob = (job) => {
    setForm({ company: job.company, role: job.role, url: job.url || '', salary: job.salary || '', location: job.location || '', notes: job.notes || '', status: job.status });
    setEditId(job.id);
    setShowModal(true);
  };

  const getStatusColor = (status) => JOB_STATUSES.find(s => s.id === status)?.color || 'ghost';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Briefcase size={28} /> Job Tracker</h1>
          <p className="page-subtitle">Track your applications from saved to offer. {jobs.length} total.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setForm(defaultForm); setEditId(null); setShowModal(true); }}><Plus size={18} /> Add Job</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        {JOB_STATUSES.map(s => (
          <div key={s.id} className="stat-card" style={{ padding: 'var(--space-md)' }}>
            <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{jobs.filter(j => j.status === s.id).length}</div>
            <div className="stat-card-label" style={{ fontSize: '0.78rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Building2 size={32} /></div>
          <div className="empty-state-title">No jobs tracked yet</div>
          <div className="empty-state-desc">Start tracking your job applications. Add companies, roles, and watch your pipeline grow.</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add First Job</button>
        </div>
      ) : (
        <div className="kanban-board">
          {JOB_STATUSES.map(status => {
            const columnJobs = jobs.filter(j => j.status === status.id);
            return (
              <div key={status.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span className={`badge badge-${status.color}`} style={{ width: 8, height: 8, padding: 0, borderRadius: '50%' }}></span>
                    {status.label}
                  </div>
                  <span className="kanban-column-count">{columnJobs.length}</span>
                </div>
                <div className="kanban-column-body">
                  {columnJobs.map(job => (
                    <div key={job.id} className="kanban-card" onClick={() => editJob(job)}>
                      <div className="kanban-card-company">{job.company}</div>
                      <div className="kanban-card-role">{job.role}</div>
                      <div className="kanban-card-meta">
                        <span>{formatDate(job.appliedAt)}</span>
                        {job.location && <span>{job.location}</span>}
                      </div>
                      <div className="flex gap-xs mt-sm" onClick={e => e.stopPropagation()}>
                        {JOB_STATUSES.filter(s => s.id !== status.id).slice(0, 3).map(s => (
                          <button key={s.id} className={`btn btn-sm badge-${s.color}`} style={{ fontSize: '0.65rem', padding: '2px 8px', background: `var(--${s.color === 'ghost' ? 'surface-2' : s.color + '-bg'})` }}
                            onClick={() => moveJob(job.id, s.id)}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditId(null); setForm(defaultForm); }} title={editId ? 'Edit Job' : 'Add Job'}
        footer={
          <div className="flex items-center justify-between w-full">
            {editId && <button className="btn btn-danger btn-sm" onClick={() => { handleDelete(editId); setShowModal(false); setEditId(null); }}><Trash2 size={14} /> Delete</button>}
            <div className="flex gap-sm" style={{ marginLeft: 'auto' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Update' : 'Add'}</button>
            </div>
          </div>
        }>
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">Company *</label>
            <input className="input" placeholder="Google" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Role *</label>
            <input className="input" placeholder="SDE-1" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {JOB_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Location</label>
            <input className="input" placeholder="Bangalore" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="input-group full-width">
            <label className="input-label">Job URL</label>
            <input className="input" placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          </div>
          <div className="input-group full-width">
            <label className="input-label">Notes</label>
            <textarea className="input" placeholder="Referral from..., interview prep notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
