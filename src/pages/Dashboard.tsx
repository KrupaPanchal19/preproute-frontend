import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, ChevronDown, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../App';

/* ---- helpers ---- */
const fmt = (d?: string | null) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = (status || 'draft').toLowerCase();
  if (s === 'published' || s === 'live') return <span className="badge badge-live">● Live</span>;
  if (s === 'draft') return <span className="badge badge-draft">Draft</span>;
  return <span className="badge badge-neutral capitalize">{status}</span>;
};

const DifficultyBadge: React.FC<{ level?: string }> = ({ level }) => {
  if (!level) return null;
  const l = level.toLowerCase();
  if (l === 'easy') return <span className="badge badge-easy">{level}</span>;
  if (l === 'medium') return <span className="badge" style={{ background: '#FEF3C7', color: '#D97706' }}>{level}</span>;
  return <span className="badge" style={{ background: '#FEE2E2', color: '#DC2626' }}>{level}</span>;
};

interface Test { _id: string; testName: string; subject: string; status: string; difficultyLevel?: string; createdAt?: string; totalQuestions?: number; topic?: string; }

const Dashboard: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [filtered, setFiltered] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; testId: string; testName: string }>({ open: false, testId: '', testName: '' });
  const navigate = useNavigate();
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getTests();
      const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setTests(arr);
      setFiltered(arr);
    } catch {
      toast.showError('Failed to load tests');
      setTests([]); setFiltered([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let arr = tests;
    if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter(t => t.testName?.toLowerCase().includes(s) || t.subject?.toLowerCase().includes(s));
    }
    if (statusFilter !== 'all') arr = arr.filter(t => (t.status || 'draft').toLowerCase() === statusFilter);
    setFiltered(arr);
  }, [search, statusFilter, tests]);

  const handleDelete = async () => {
    try {
      await api.deleteTest(deleteModal.testId);
      toast.showSuccess('Test deleted successfully');
      setDeleteModal({ open: false, testId: '', testName: '' });
      load();
    } catch { toast.showError('Failed to delete test'); }
  };

  /* Stats */
  const total = tests.length;
  const live = tests.filter(t => ['published', 'live'].includes((t.status || '').toLowerCase())).length;
  const draft = tests.filter(t => (t.status || 'draft').toLowerCase() === 'draft').length;
  const totalQ = tests.reduce((s, t) => s + (t.totalQuestions || 0), 0);

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ paddingLeft: 0 }}>
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item active">Dashboard</span>
      </div>

      {/* Page Header */}
      <div className="page-header" style={{ marginTop: 8 }}>
        <h1 className="page-title">Dashboard</h1>
        <button className="btn btn-primary" onClick={() => navigate('/create-test')}>
          <Plus size={15} />
          Create New Test
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#EEF2FF' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F6EF7" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </div>
          <div className="kpi-info">
            <h3>{total}</h3>
            <p>Total Tests</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#DBEAFE' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div className="kpi-info">
            <h3>{live}</h3>
            <p>Live Tests</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#FEF3C7' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className="kpi-info">
            <h3>{draft}</h3>
            <p>Drafts</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#D1FAE5' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
          </div>
          <div className="kpi-info">
            <h3>{totalQ}</h3>
            <p>Total Questions</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          {/* Search */}
          <div className="input-with-icon" style={{ maxWidth: 320, flex: 1 }}>
            <Search size={15} className="input-icon" />
            <input
              className="form-input"
              placeholder="Search by test name or subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>
          {/* Status filter */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ minWidth: 130, paddingRight: 32 }}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="live">Live</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Test Name</th>
              <th>Subject</th>
              <th>Topic</th>
              <th>Difficulty</th>
              <th>Status</th>
              <th>Questions</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9}>
                  <div className="loading-state" style={{ padding: 40 }}>
                    <div className="spinner" />
                    <span>Loading tests…</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" className="empty-state-icon">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                    </svg>
                    <h3>No tests found</h3>
                    <p>{search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Click "Create New Test" to add your first test'}</p>
                    {!search && statusFilter === 'all' && (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-test')}>
                        <Plus size={13} />Create New Test
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : filtered.map((t, i) => (
              <tr key={t._id}>
                <td style={{ color: '#9CA3AF', fontWeight: 500 }}>{i + 1}</td>
                <td>
                  <span style={{ fontWeight: 500, color: '#1A1D23' }}>{t.testName || '—'}</span>
                </td>
                <td style={{ color: '#6B7280' }}>{t.subject || '—'}</td>
                <td style={{ color: '#6B7280' }}>{t.topic || '—'}</td>
                <td><DifficultyBadge level={t.difficultyLevel} /></td>
                <td><StatusBadge status={t.status} /></td>
                <td style={{ fontWeight: 500 }}>{t.totalQuestions ?? 0}</td>
                <td style={{ color: '#9CA3AF', fontSize: 12.5 }}>{fmt(t.createdAt)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      title="View"
                      onClick={() => navigate(`/preview-test/${t._id}`)}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      title="Edit"
                      onClick={() => navigate(`/edit-test/${t._id}`)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      title="Delete"
                      style={{ color: '#EF4444' }}
                      onClick={() => setDeleteModal({ open: true, testId: t._id, testName: t.testName })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Showing count */}
      {!loading && filtered.length > 0 && (
        <div style={{ padding: '10px 0', fontSize: 12.5, color: '#9CA3AF' }}>
          Showing {filtered.length} of {tests.length} tests
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteModal.open && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, testId: '', testName: '' })}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Delete Test</span>
              <button className="modal-close" onClick={() => setDeleteModal({ open: false, testId: '', testName: '' })}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>"{deleteModal.testName}"</strong>?<br />
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>This action cannot be undone.</span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, testId: '', testName: '' })}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
