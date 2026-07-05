import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, CheckCircle } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../App';

/* ---- Types ---- */
interface FormState {
  testName: string;
  subject: string;       // display name (e.g. "Mathematics")
  subject_id: string;    // ID for API calls (e.g. "math-uuid")
  topic: string;         // display name
  topic_id: string;      // ID for API calls
  subTopic: string;      // display name
  subTopic_id: string;   // ID for API calls
  duration: number;
  difficultyLevel: string;
  negativeMarking: number;
  unattempted: number;
  correctMarking: number;
  totalQuestions: number;
  testType: string;
}

const INITIAL: FormState = {
  testName: '',
  subject: '', subject_id: '',
  topic: '',   topic_id: '',
  subTopic: '', subTopic_id: '',
  duration: 60,
  difficultyLevel: 'Easy',
  negativeMarking: -1,
  unattempted: 0,
  correctMarking: 4,
  totalQuestions: 10,
  testType: 'chapterwise',
};

interface SubjectOption  { id: string; name: string; }
interface TopicOption    { id: string; name: string; subject_id: string; }
interface SubTopicOption { id: string; name: string; topic_id: string; }

/* ---- Number Stepper ---- */
const NumStepper: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ value, onChange, min = 0, max = 999, step = 1 }) => (
  <div className="number-stepper">
    <button type="button" onClick={() => onChange(Math.max(min, value - step))}>−</button>
    <input
      type="number"
      value={value}
      onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
      min={min} max={max}
    />
    <button type="button" onClick={() => onChange(Math.min(max, value + step))}>+</button>
  </div>
);

/* ---- Main ---- */
const CreateTest: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<{ testName?: string; subject?: string }>({});
  const [subjects,  setSubjects]  = useState<SubjectOption[]>([]);
  const [topics,    setTopics]    = useState<TopicOption[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopicOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapterwise' | 'faq' | 'mocktest'>('chapterwise');

  /* ── Load subjects once ── */
  useEffect(() => {
    api.getSubjects()
      .then(r => {
        const arr: SubjectOption[] = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
        setSubjects(arr.map((s: any) => ({ id: s.id, name: s.name || s.subject || '' })));
      })
      .catch(() => {
        // Fallback for staging / offline
        setSubjects([
          { id: 'math-uuid',     name: 'Mathematics' },
          { id: 'physics-uuid',  name: 'Physics' },
          { id: 'chemistry-uuid',name: 'Chemistry' },
          { id: 'biology-uuid',  name: 'Biology' },
        ]);
      });
  }, []);

  /* ── Load topics when subject changes ── */
  useEffect(() => {
    if (!form.subject_id) { setTopics([]); setSubTopics([]); return; }
    api.getTopics(form.subject_id)
      .then(r => {
        const arr: TopicOption[] = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
        setTopics(arr.map((t: any) => ({ id: t.id, name: t.name || t.topic || '', subject_id: t.subject_id })));
      })
      .catch(() => setTopics([]));
  }, [form.subject_id]);

  /* ── Load sub-topics when topic changes ── */
  useEffect(() => {
    if (!form.topic_id) { setSubTopics([]); return; }
    api.getSubTopics(form.subject_id, form.topic_id)
      .then(r => {
        const arr: SubTopicOption[] = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
        setSubTopics(arr.map((s: any) => ({ id: s.id, name: s.name || s.subTopic || '', topic_id: s.topic_id })));
      })
      .catch(() => setSubTopics([]));
  }, [form.topic_id]);

  /* ── Load existing test when editing ── */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getTest(id)
      .then(r => {
        const d = r?.data;
        if (!d) return;
        // d is already normalized by api.getTest → normalizeTest
        setForm(f => ({
          ...f,
          testName:       d.testName || '',
          subject:        d.subject  || '',
          subject_id:     d.subject_id || d.subject || '',
          topic:          d.topic    || (d.topics?.[0] || ''),
          topic_id:       d.topic_ids?.[0] || '',
          subTopic:       '',
          subTopic_id:    d.sub_topic_ids?.[0] || '',
          duration:       d.duration        ?? 60,
          difficultyLevel: d.difficultyLevel || 'Easy',
          negativeMarking: d.negativeMarking ?? -1,
          unattempted:     d.unattempted     ?? 0,
          correctMarking:  d.correctMarking  ?? 4,
          totalQuestions:  d.totalQuestions  ?? 10,
          testType:        d.testType        || 'chapterwise',
        }));
        if (d.testType) setActiveTab(d.testType as any);
      })
      .catch(() => toast.showError('Failed to load test data'))
      .finally(() => setLoading(false));
  }, [id]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'testName' && errors.testName) setErrors(e => ({ ...e, testName: undefined }));
    if (k === 'subject'  && errors.subject)  setErrors(e => ({ ...e, subject:  undefined }));
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = e.target.value;
    const subObj = subjects.find(s => s.id === subId);
    setForm(f => ({
      ...f,
      subject_id: subId,
      subject:    subObj?.name || subId,
      topic: '', topic_id: '',
      subTopic: '', subTopic_id: '',
    }));
    if (errors.subject) setErrors(e2 => ({ ...e2, subject: undefined }));
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const topId = e.target.value;
    const topObj = topics.find(t => t.id === topId);
    setForm(f => ({
      ...f,
      topic_id: topId,
      topic:    topObj?.name || topId,
      subTopic: '', subTopic_id: '',
    }));
  };

  const handleSubTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stId = e.target.value;
    const stObj = subTopics.find(s => s.id === stId);
    setForm(f => ({ ...f, subTopic_id: stId, subTopic: stObj?.name || stId }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.testName.trim()) e.testName = 'Test name is required';
    if (!form.subject_id)      e.subject  = 'Subject is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Build the payload with ID fields for backend
      const payload = {
        ...form,
        testType: activeTab,
        // Make sure topic_ids and sub_topics are arrays for toApiTestPayload
        topic_ids:    form.topic_id    ? [form.topic_id]    : [],
        sub_topic_ids: form.subTopic_id ? [form.subTopic_id] : [],
        topics:       form.topic       ? [form.topic]       : [],
        sub_topics:   form.subTopic    ? [form.subTopic]    : [],
      };

      if (isEdit) {
        await api.updateTest(id!, payload);
        toast.showSuccess('Test updated successfully!');
        navigate('/');
      } else {
        const res = await api.createTest(payload);
        // Backend returns: { success: true, data: { id, name, ... } }
        const newId = res?.data?.id || res?.data?._id || res?.id;
        if (newId) {
          toast.showSuccess('Test created! Now add questions.');
          navigate(`/add-questions/${newId}`);
          return;
        }
        toast.showSuccess('Test saved!');
        navigate('/');
      }
    } catch (err: any) {
      toast.showError(err?.message || 'Save failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="page-container">
        <div className="loading-state"><div className="spinner" /><span>Loading test…</span></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ paddingLeft: 0, marginBottom: 8 }}>
        <span className="breadcrumb-item" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Dashboard</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item active">{isEdit ? 'Edit Test' : 'Create Test'}</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Test' : 'Create New Test'}</h1>
      </div>

      {/* Wizard Steps */}
      <div className="steps-header" style={{ marginBottom: 20 }}>
        <div className="step-item active">
          <div className="step-circle">1</div>
          <span className="step-label">Test Details</span>
        </div>
        <div className="step-connector" />
        <div className="step-item">
          <div className="step-circle">2</div>
          <span className="step-label">Add Questions</span>
        </div>
        <div className="step-connector" />
        <div className="step-item">
          <div className="step-circle">3</div>
          <span className="step-label">Preview &amp; Publish</span>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #E2E5EF', borderRadius: 12, overflow: 'hidden' }}>
        {/* Tabs */}
        <div className="tabs" style={{ padding: '0 20px', marginBottom: 0, borderBottom: '1px solid #E2E5EF' }}>
          {([
            { key: 'chapterwise', label: 'Chapterwise' },
            { key: 'faq',         label: 'FAQ' },
            { key: 'mocktest',    label: 'Mock Test' },
          ] as const).map(t => (
            <button
              key={t.key}
              className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              type="button"
            >{t.label}</button>
          ))}
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px 24px 16px' }}>
          <div className="grid-2" style={{ gap: 20 }}>

            {/* Subject — shows names, sends IDs */}
            <div className="form-group">
              <label className="form-label" htmlFor="subject">
                Subject <span className="required">*</span>
              </label>
              <select
                id="subject"
                className="form-select"
                value={form.subject_id}
                onChange={handleSubjectChange}
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.subject && <span className="error-text">{errors.subject}</span>}
            </div>

            {/* Test Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="testName">
                Name of Test <span className="required">*</span>
              </label>
              <input
                id="testName"
                className="form-input"
                placeholder="Enter test name"
                value={form.testName}
                onChange={e => setField('testName', e.target.value)}
              />
              {errors.testName && <span className="error-text">{errors.testName}</span>}
            </div>

            {/* Topic */}
            <div className="form-group">
              <label className="form-label" htmlFor="topic">Topic</label>
              <select
                id="topic"
                className="form-select"
                value={form.topic_id}
                onChange={handleTopicChange}
                disabled={!form.subject_id}
              >
                <option value="">Select Topic</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {!form.subject_id && (
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>Select a subject first</span>
              )}
            </div>

            {/* Sub Topic */}
            <div className="form-group">
              <label className="form-label" htmlFor="subTopic">Sub Topic</label>
              <select
                id="subTopic"
                className="form-select"
                value={form.subTopic_id}
                onChange={handleSubTopicChange}
                disabled={!form.topic_id}
              >
                <option value="">Select Sub Topic</option>
                {subTopics.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label">
                Duration (minutes) <span className="required">*</span>
              </label>
              <NumStepper
                value={form.duration}
                onChange={v => setField('duration', v)}
                min={1} max={360} step={5}
              />
            </div>

            {/* empty cell for grid alignment */}
            <div />
          </div>

          {/* Difficulty */}
          <div style={{ marginTop: 20 }}>
            <div className="form-label" style={{ marginBottom: 10 }}>Test Difficulty Level</div>
            <div className="radio-group">
              {['Easy', 'Medium', 'Difficult'].map(d => (
                <label key={d} className={`radio-option${form.difficultyLevel === d ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="difficultyLevel"
                    value={d}
                    checked={form.difficultyLevel === d}
                    onChange={() => setField('difficultyLevel', d)}
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>

          <hr className="divider" style={{ margin: '20px 0' }} />

          {/* Marking Scheme */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label" style={{ marginBottom: 14, fontSize: 13, fontWeight: 600, color: '#1A1D23' }}>
              Marking Scheme
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Wrong Answer</label>
                <NumStepper value={form.negativeMarking} onChange={v => setField('negativeMarking', v)} min={-5} max={0} step={1} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Unattempted</label>
                <NumStepper value={form.unattempted} onChange={v => setField('unattempted', v)} min={-5} max={0} step={1} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Correct Answer</label>
                <NumStepper value={form.correctMarking} onChange={v => setField('correctMarking', v)} min={0} max={10} step={1} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>No. of Questions</label>
                <NumStepper value={form.totalQuestions} onChange={v => setField('totalQuestions', v)} min={1} max={200} step={1} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E5EF', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ gap: 6 }}>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Next'}
            {!isEdit && !loading && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTest;
