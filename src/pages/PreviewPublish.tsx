import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Clock, BookOpen, BarChart2, Edit3, Send, Calendar } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../App';

const DURATION_OPTIONS = [
  { value: '7',       label: '1 week' },
  { value: '14',      label: '2 weeks' },
  { value: '30',      label: '1 month' },
  { value: '90',      label: '3 months' },
  { value: 'forever', label: 'Always live' },
];

const LETTERS = ['A', 'B', 'C', 'D'];

const PreviewPublish: React.FC = () => {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [test,       setTest]       = useState<any>(null);
  const [questions,  setQuestions]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published,  setPublished]  = useState(false);
  const [publishMode,  setPublishMode]  = useState<'now' | 'schedule'>('now');
  const [liveDuration, setLiveDuration] = useState('30');
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    if (!testId) return;
    setLoading(true);

    Promise.all([
      api.getTest(testId).catch(() => null),
      api.getQuestions(testId).catch(() => ({ data: [] })),
    ]).then(([tRes, qRes]) => {
      // Both are already normalized
      setTest(tRes?.data || null);
      const qs = Array.isArray(qRes?.data) ? qRes.data : [];
      setQuestions(qs);
    }).finally(() => setLoading(false));
  }, [testId]);

  const handlePublish = async () => {
    if (!testId) return;
    if (publishMode === 'schedule' && !scheduleDate) {
      toast.showError('Please select a schedule date');
      return;
    }
    setPublishing(true);
    try {
      await api.publishTest(testId, {
        ...(publishMode === 'schedule' && scheduleDate ? { scheduledAt: scheduleDate } : {}),
        live_duration: liveDuration,
      });
      setPublished(true);
      toast.showSuccess('Test published successfully!');
    } catch (err: any) {
      toast.showError(err?.message || 'Failed to publish test');
    } finally {
      setPublishing(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state"><div className="spinner" /><span>Loading preview…</span></div>
      </div>
    );
  }

  /* ── Success Screen ── */
  if (published) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div className="success-modal-icon">
            <CheckCircle size={36} color="#059669" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1D23', marginBottom: 8 }}>Test Published!</h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28, lineHeight: 1.7 }}>
            <strong style={{ color: '#1A1D23' }}>{test?.testName || 'Your test'}</strong> has been published successfully
            {publishMode === 'schedule' && scheduleDate
              ? ` and scheduled for ${new Date(scheduleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
              : ' and is now live'}.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>Back to Dashboard</button>
            <button className="btn btn-primary" onClick={() => navigate('/create-test')}>Create Another Test</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Preview Screen ── */
  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ paddingLeft: 0, marginBottom: 8 }}>
        <span className="breadcrumb-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Dashboard</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/edit-test/${testId}`)}>Test Details</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/add-questions/${testId}`)}>Questions</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item active">Preview &amp; Publish</span>
      </div>

      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 className="page-title">Preview &amp; Publish</h1>
      </div>

      {/* Wizard Steps */}
      <div className="steps-header" style={{ marginBottom: 20 }}>
        <div className="step-item completed">
          <div className="step-circle"><CheckCircle size={14} /></div>
          <span className="step-label">Test Details</span>
        </div>
        <div className="step-connector done" />
        <div className="step-item completed">
          <div className="step-circle"><CheckCircle size={14} /></div>
          <span className="step-label">Add Questions</span>
        </div>
        <div className="step-connector done" />
        <div className="step-item active">
          <div className="step-circle">3</div>
          <span className="step-label">Preview &amp; Publish</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="confirm-layout">

        {/* ── LEFT: Question List ── */}
        <div className="confirm-sidebar">
          {/* Test header */}
          <div style={{ padding: '16px', borderBottom: '1px solid #E2E5EF' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1A1D23', marginBottom: 6 }}>
              {test?.testName || 'Test Preview'}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 12, color: '#6B7280' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {test?.duration ?? 60} min
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <BookOpen size={12} /> {questions.length} Qs
              </span>
              {test?.difficultyLevel && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BarChart2 size={12} /> {test.difficultyLevel}
                </span>
              )}
            </div>
          </div>

          {/* Tab label */}
          <div style={{ borderBottom: '1px solid #E2E5EF' }}>
            <div className="tabs" style={{ padding: '0 12px', marginBottom: 0 }}>
              <button className="tab-btn active">
                {test?.testType === 'mocktest' ? 'Mock Test' : test?.testType === 'faq' ? 'FAQ' : 'Chapter Wise'}
              </button>
            </div>
          </div>

          {/* Questions list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {questions.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                No questions added yet
              </div>
            ) : questions.map((q, i) => (
              <div key={q._id || i} style={{
                padding: '10px 16px',
                borderBottom: '1px solid #E2E5EF',
                background: i === 0 ? '#EEF2FF' : 'white',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>Q{i + 1}</div>
                <div style={{ fontSize: 13, color: '#1A1D23', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.questionText || `Question ${i + 1}`}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  Ans: {q.correctOption || '—'}
                  {q.difficultyLevel && <span style={{ marginLeft: 8 }}>· {q.difficultyLevel}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Edit back */}
          <div style={{ padding: 12, borderTop: '1px solid #E2E5EF' }}>
            <button className="btn btn-secondary w-full" onClick={() => navigate(`/add-questions/${testId}`)}>
              <Edit3 size={13} /> Edit Questions
            </button>
          </div>
        </div>

        {/* ── RIGHT: Publish Controls ── */}
        <div className="confirm-panel">

          {/* Test Summary */}
          <div className="test-preview-header">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1A1D23', marginBottom: 10 }}>Test Summary</h3>
            <div className="test-preview-meta" style={{ flexWrap: 'wrap', gap: '8px 24px' }}>
              <div className="test-meta-item">
                <span>Name:</span>
                <span className="test-meta-value">{test?.testName || '—'}</span>
              </div>
              <div className="test-meta-item">
                <span>Subject:</span>
                <span className="test-meta-value">{test?.subject || '—'}</span>
              </div>
              <div className="test-meta-item">
                <span>Duration:</span>
                <span className="test-meta-value">{test?.duration ?? 60} min</span>
              </div>
              <div className="test-meta-item">
                <span>Questions:</span>
                <span className="test-meta-value">{questions.length}</span>
              </div>
              <div className="test-meta-item">
                <span>Difficulty:</span>
                <span className="test-meta-value">{test?.difficultyLevel || '—'}</span>
              </div>
              <div className="test-meta-item">
                <span>Marking:</span>
                <span className="test-meta-value">
                  +{test?.correctMarking ?? 4} / {test?.negativeMarking ?? -1}
                </span>
              </div>
            </div>
          </div>

          {/* Publish Mode */}
          <div className="publish-section">
            <div className="publish-title">Publish Test</div>
            <div className="publish-actions">
              <button
                className="publish-btn"
                style={publishMode === 'now'
                  ? { background: '#4F6EF7', color: 'white' }
                  : { background: '#F3F4F6', color: '#6B7280', border: '1px solid #E2E5EF' }}
                onClick={() => setPublishMode('now')}
                type="button"
              >
                <Send size={13} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
                Publish Now
              </button>
              <button
                className="publish-btn"
                style={publishMode === 'schedule'
                  ? { background: '#4F6EF7', color: 'white' }
                  : { background: '#F3F4F6', color: '#6B7280', border: '1px solid #E2E5EF' }}
                onClick={() => setPublishMode('schedule')}
                type="button"
              >
                <Calendar size={13} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
                Schedule Publish
              </button>
            </div>

            {publishMode === 'schedule' && (
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Schedule Date &amp; Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>

          {/* Live Until */}
          <div className="live-until-section">
            <div className="live-until-title">Live Until</div>
            <div className="live-until-sub">How long should this test remain accessible?</div>
            <div className="duration-options">
              {DURATION_OPTIONS.map(opt => (
                <label key={opt.value} className={`duration-option${liveDuration === opt.value ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="liveDuration"
                    value={opt.value}
                    checked={liveDuration === opt.value}
                    onChange={() => setLiveDuration(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Question previews (first 3) */}
          {questions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1D23', marginBottom: 12 }}>
                Questions Preview
              </div>
              {questions.slice(0, 3).map((q, i) => (
                <div key={q._id || i} className="q-preview-card">
                  <div className="q-preview-num">Q{i + 1}</div>
                  <div className="q-preview-text">{q.questionText || `Question ${i + 1}`}</div>
                  <div className="q-options-grid">
                    {(q.options || []).slice(0, 4).map((o: any, j: number) => {
                      const letter = LETTERS[j];
                      const isCorrect = q.correctOption === letter;
                      return (
                        <div key={j} className={`q-option${isCorrect ? ' correct' : ''}`}>
                          <div className="q-option-letter">{letter}</div>
                          <span>{typeof o === 'string' ? o : (o?.text || `Option ${letter}`)}</span>
                        </div>
                      );
                    })}
                  </div>
                  {q.solution && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: '#F0FDF4', borderRadius: 4, fontSize: 12, color: '#059669' }}>
                      💡 {q.solution}
                    </div>
                  )}
                </div>
              ))}
              {questions.length > 3 && (
                <div style={{ textAlign: 'center', fontSize: 12.5, color: '#9CA3AF', padding: '8px 0' }}>
                  + {questions.length - 3} more question{questions.length - 3 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => navigate(`/add-questions/${testId}`)} disabled={publishing}>
              ← Back
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={handlePublish}
              disabled={publishing || (publishMode === 'schedule' && !scheduleDate)}
            >
              {publishing
                ? 'Publishing…'
                : publishMode === 'now'
                  ? '✓ Confirm & Publish'
                  : '📅 Schedule Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPublish;
