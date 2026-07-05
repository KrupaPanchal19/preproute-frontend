import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ChevronRight, AlignLeft, Image, X, CheckCircle } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../App';

interface Option { id: string; text: string; }
interface Question {
  _id?: string;
  questionText: string;
  options: Option[];
  correctOption: string;  // "A"|"B"|"C"|"D"
  solution: string;
  difficultyLevel: string;
  topic: string;
  subTopic: string;
}

const EMPTY_Q = (): Question => ({
  questionText: '',
  options: [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ],
  correctOption: '',
  solution: '',
  difficultyLevel: 'Easy',
  topic: '',
  subTopic: '',
});

/* ---- Minimal Toolbar ---- */
const EditorToolbar: React.FC = () => (
  <div className="q-editor-toolbar">
    {['B', 'I', 'U'].map(b => (
      <button key={b} type="button" className="toolbar-btn" title={b === 'B' ? 'Bold' : b === 'I' ? 'Italic' : 'Underline'}
        style={b === 'I' ? { fontStyle: 'italic' } : b === 'U' ? { textDecoration: 'underline' } : {}}>
        {b}
      </button>
    ))}
    <div className="toolbar-sep" />
    <button type="button" className="toolbar-btn" title="Align"><AlignLeft size={12} /></button>
    <div className="toolbar-sep" />
    <button type="button" className="toolbar-btn" title="Image"><Image size={12} /></button>
  </div>
);

const AddQuestions: React.FC = () => {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([EMPTY_Q()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  /* ── Load test info + existing questions ── */
  useEffect(() => {
    if (!testId) return;

    api.getTest(testId)
      .then(r => setTest(r?.data || r))
      .catch(() => {});

    api.getQuestions(testId)
      .then(r => {
        // api.getQuestions returns normalized questions with options [{id,text}]
        const arr = Array.isArray(r?.data) ? r.data : [];
        if (arr.length > 0) {
          setQuestions(arr.map((q: any) => ({
            _id: q._id || q.id,
            questionText: q.questionText || '',
            options: q.options?.length >= 4
              ? q.options
              : ['A', 'B', 'C', 'D'].map((id, i) => ({ id, text: q.options?.[i]?.text || '' })),
            correctOption: q.correctOption || '',
            solution: q.solution || '',
            difficultyLevel: q.difficultyLevel || 'Easy',
            topic: q.topic || '',
            subTopic: q.subTopic || '',
          })));
        }
      })
      .catch(() => {});
  }, [testId]);

  const current = questions[activeIdx] || EMPTY_Q();

  const updateCurrent = (updates: Partial<Question>) => {
    setQuestions(qs => qs.map((q, i) => i === activeIdx ? { ...q, ...updates } : q));
  };

  const updateOption = (optId: string, text: string) => {
    const opts = current.options.map(o => o.id === optId ? { ...o, text } : o);
    updateCurrent({ options: opts });
  };

  const addNewQuestion = () => {
    setQuestions(qs => [...qs, EMPTY_Q()]);
    setActiveIdx(questions.length);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return;
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    setActiveIdx(Math.min(idx, updated.length - 1));
  };

  const validateAll = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.showError(`Question ${i + 1}: text is required`);
        setActiveIdx(i);
        return false;
      }
      const filled = q.options.filter(o => o.text.trim());
      if (filled.length < 2) {
        toast.showError(`Question ${i + 1}: at least 2 options required`);
        setActiveIdx(i);
        return false;
      }
      if (!q.correctOption) {
        toast.showError(`Question ${i + 1}: select the correct answer`);
        setActiveIdx(i);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    // Only validate non-empty questions
    const toSave = questions.filter(q => q.questionText.trim());
    if (toSave.length === 0) {
      toast.showError('Add at least one question');
      return;
    }
    for (let i = 0; i < toSave.length; i++) {
      const q = toSave[i];
      if (!q.correctOption) {
        toast.showError(`Question ${i + 1}: select the correct answer`);
        return;
      }
    }

    setSaving(true);
    try {
      // Save all valid questions in one bulk call
      await api.saveQuestionsBulk(testId!, toSave);
      toast.showSuccess(`${toSave.length} question(s) saved!`);
      navigate(`/preview-test/${testId}`);
    } catch (err: any) {
      toast.showError(err?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  const completedCount = questions.filter(q => q.questionText.trim() && q.correctOption).length;
  const targetCount    = test?.totalQuestions || 0;

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ paddingLeft: 0, marginBottom: 8 }}>
        <span className="breadcrumb-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Dashboard</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/edit-test/${testId}`)}>Test Details</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item active">Add Questions</span>
      </div>

      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Add Questions</h1>
          {test && (
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
              <strong style={{ color: '#1A1D23' }}>{test.testName}</strong>
              {test.subject && <span> · {test.subject}</span>}
              {targetCount > 0 && <span> · Target: {targetCount} Qs</span>}
            </p>
          )}
        </div>
      </div>

      {/* Wizard Steps */}
      <div className="steps-header" style={{ marginBottom: 16 }}>
        <div className="step-item completed">
          <div className="step-circle"><CheckCircle size={14} /></div>
          <span className="step-label">Test Details</span>
        </div>
        <div className="step-connector done" />
        <div className="step-item active">
          <div className="step-circle">2</div>
          <span className="step-label">Add Questions</span>
        </div>
        <div className="step-connector" />
        <div className="step-item">
          <div className="step-circle">3</div>
          <span className="step-label">Preview &amp; Publish</span>
        </div>
      </div>

      {/* Split Layout */}
      <div className="q-editor-layout">

        {/* ── LEFT: Question Sidebar ── */}
        <div className="q-sidebar">
          <div className="q-sidebar-header">
            <span>Questions ({questions.length})</span>
            <button className="btn btn-primary btn-sm" onClick={addNewQuestion} type="button">
              <Plus size={12} /> Add
            </button>
          </div>

          <div className="q-list">
            {questions.map((q, i) => (
              <div
                key={i}
                className={`q-list-item${activeIdx === i ? ' active' : ''}`}
                onClick={() => setActiveIdx(i)}
              >
                <div className="q-list-item-num">{i + 1}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.questionText.trim() ? q.questionText.slice(0, 38) + (q.questionText.length > 38 ? '…' : '') : `Question ${i + 1}`}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                    {q.correctOption ? `✓ Ans: ${q.correctOption}` : 'No answer set'}
                  </div>
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeQuestion(i); }}
                    style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 2, borderRadius: 3, flexShrink: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {targetCount > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E5EF', fontSize: 12, color: '#9CA3AF' }}>
              <div style={{ marginBottom: 4 }}>{completedCount} / {targetCount} complete</div>
              <div style={{ height: 3, background: '#E2E5EF', borderRadius: 99 }}>
                <div style={{
                  height: '100%',
                  background: '#4F6EF7',
                  borderRadius: 99,
                  width: `${Math.min(100, (completedCount / targetCount) * 100)}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Editor ── */}
        <div className="q-editor-panel">
          <div className="q-editor-header">
            <span style={{ fontSize: 13, fontWeight: 600 }}>Question {activeIdx + 1}</span>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate(`/edit-test/${testId}`)}>
              ← Edit Test Details
            </button>
          </div>

          <div className="q-editor-body">

            {/* Question Text */}
            <div style={{ marginBottom: 16 }}>
              <div className="options-label" style={{ marginBottom: 8 }}>
                Question Text <span style={{ color: '#EF4444' }}>*</span>
              </div>
              <div className="q-text-editor">
                <EditorToolbar />
                <textarea
                  className="q-textarea"
                  placeholder="Type your question here..."
                  value={current.questionText}
                  onChange={e => updateCurrent({ questionText: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Options */}
            <div className="options-section">
              <div className="options-label">
                Answer Options <span style={{ color: '#EF4444' }}>*</span>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>
                Click the radio button to mark the correct answer
              </p>
              {current.options.map(opt => (
                <div key={opt.id} className="option-row">
                  {/* correct-answer radio */}
                  <div
                    className={`option-radio${current.correctOption === opt.id ? ' selected' : ''}`}
                    onClick={() => updateCurrent({ correctOption: opt.id })}
                    title="Mark as correct"
                  />
                  <span style={{ width: 20, fontSize: 13, fontWeight: 600, color: '#6B7280', flexShrink: 0 }}>
                    {opt.id}.
                  </span>
                  <input
                    type="text"
                    className={`option-input${current.correctOption === opt.id ? ' correct' : ''}`}
                    placeholder={`Option ${opt.id}`}
                    value={opt.text}
                    onChange={e => updateOption(opt.id, e.target.value)}
                  />
                  <button type="button" className="option-clear" onClick={() => updateOption(opt.id, '')} title="Clear">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Solution */}
            <div className="solution-section">
              <div className="solution-label">Solution / Explanation</div>
              <textarea
                className="solution-input"
                placeholder="Enter solution or explanation (optional)..."
                value={current.solution}
                onChange={e => updateCurrent({ solution: e.target.value })}
                rows={3}
              />
            </div>

            {/* Settings */}
            <div className="q-settings">
              <div className="q-settings-title">Question Settings</div>
              <div className="grid-3" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Difficulty</label>
                  <select className="form-select" value={current.difficultyLevel}
                    onChange={e => updateCurrent({ difficultyLevel: e.target.value })}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Difficult</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Topic</label>
                  <input className="form-input" placeholder="Topic" value={current.topic}
                    onChange={e => updateCurrent({ topic: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Sub Topic</label>
                  <input className="form-input" placeholder="Sub Topic" value={current.subTopic}
                    onChange={e => updateCurrent({ subTopic: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="q-editor-footer">
            <button className="btn btn-secondary" onClick={() => navigate(`/edit-test/${testId}`)} disabled={saving}>
              ← Back
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              {activeIdx < questions.length - 1 && (
                <button className="btn btn-secondary" onClick={() => setActiveIdx(i => i + 1)} disabled={saving}>
                  Next Question →
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save & Continue'} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddQuestions;
