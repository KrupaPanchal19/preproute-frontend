import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Bold, Italic, Underline,
  Link2, AlignLeft, List, ListOrdered, Image as ImageIcon, Sigma,
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../App';
import { QuestionCreationPanel, type PanelQuestion } from '../components/QuestionCreationPanel';
import { TestSummaryCard } from '../components/TestSummaryCard';
import { EditTestModal } from '../components/EditTestModal';
import type { FormState, TestType } from '../types';

interface Option { id: string; text: string; }
interface Question {
  _id?: string;
  questionText: string;
  options: Option[];
  correctOption: string;
  solution: string;
  difficultyLevel: string;
  topic: string;
  subTopic: string;
}

const EMPTY_Q = (): Question => ({
  questionText: '',
  options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
  correctOption: '',
  solution: '',
  difficultyLevel: '',
  topic: '',
  subTopic: '',
});

const TOOLBAR_GROUPS: { icon: React.ElementType; label: string }[][] = [
  [{ icon: Italic, label: 'Italic' }, { icon: Bold, label: 'Bold' }, { icon: Underline, label: 'Underline' }, { icon: Link2, label: 'Link' }],
  [{ icon: AlignLeft, label: 'Align' }, { icon: List, label: 'Bullet list' }, { icon: ListOrdered, label: 'Numbered list' }],
  [{ icon: ImageIcon, label: 'Insert image' }, { icon: Sigma, label: 'Formula' }],
];

const EditorToolbar: React.FC = () => (
  <div className="rte-toolbar">
    {TOOLBAR_GROUPS.map((group, gi) => (
      <React.Fragment key={gi}>
        {gi > 0 && <span className="rte-sep" />}
        {group.map(({ icon: Icon, label }) => (
          <button key={label} type="button" className="rte-btn" title={label} aria-label={label}>
            <Icon size={14} />
          </button>
        ))}
      </React.Fragment>
    ))}
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
  const [editOpen, setEditOpen] = useState(false);

  const loadTest = () => {
    if (!testId) return;
    api.getTest(testId).then(r => setTest(r?.data || r)).catch(() => {});
  };

  useEffect(() => {
    if (!testId) return;
    loadTest();
    api.getQuestions(testId)
      .then(r => {
        const arr = Array.isArray(r?.data) ? r.data : [];
        if (arr.length > 0) {
          setQuestions(arr.map((q: any) => ({
            _id: q._id || q.id,
            questionText: q.questionText || '',
            options: q.options?.length >= 4 ? q.options : ['A', 'B', 'C', 'D'].map((id, i) => ({ id, text: q.options?.[i]?.text || '' })),
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
  const targetCount = test?.totalQuestions || questions.length;

  const updateCurrent = (updates: Partial<Question>) =>
    setQuestions(qs => qs.map((q, i) => (i === activeIdx ? { ...q, ...updates } : q)));

  const updateOption = (optId: string, text: string) =>
    updateCurrent({ options: current.options.map(o => (o.id === optId ? { ...o, text } : o)) });

  const addNewQuestion = () => {
    setQuestions(qs => [...qs, EMPTY_Q()]);
    setActiveIdx(questions.length);
  };

  const clearCurrent = () => updateCurrent(EMPTY_Q());

  const isDone = (q: Question) => Boolean(q.questionText.trim() && q.correctOption);

  const persist = async (): Promise<boolean> => {
    const toSave = questions.filter(q => q.questionText.trim());
    if (toSave.length === 0) { toast.showError('Add at least one question'); return false; }
    const missing = toSave.findIndex(q => !q.correctOption);
    if (missing !== -1) { toast.showError(`Question ${missing + 1}: select the correct answer`); return false; }
    setSaving(true);
    try {
      await api.saveQuestionsBulk(testId!, toSave);
      return true;
    } catch (err: any) {
      toast.showError(err?.message || 'Failed to save questions');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (await persist()) navigate(`/preview-test/${testId}`);
  };

  /* Option lists for the per-question settings dropdowns */
  const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));
  const topicOptions = uniq([...(test?.topics ?? []), current.topic]);
  const subTopicOptions = uniq([...(test?.sub_topics ?? []), current.subTopic]);

  const panelQuestions: PanelQuestion[] = questions.map((q, i) => ({
    label: `Question ${i + 1}`,
    done: isDone(q),
  }));

  const editInitial: Partial<FormState> | undefined = test ? {
    testName: test.testName,
    subject: test.subject, subject_id: test.subject_id,
    topic: test.topic, topic_id: test.topic_ids?.[0] || '',
    subTopic_id: test.sub_topic_ids?.[0] || '',
    duration: test.duration,
    difficultyLevel: test.difficultyLevel,
    negativeMarking: test.negativeMarking,
    unattempted: test.unattempted,
    correctMarking: test.correctMarking,
    totalQuestions: test.totalQuestions,
    testType: (['chapterwise', 'pyq', 'mocktest'].includes(test.testType) ? test.testType : 'chapterwise') as TestType,
  } : undefined;

  return (
    <div className="creation-layout">
      <QuestionCreationPanel
        total={targetCount}
        questions={panelQuestions}
        activeIdx={activeIdx}
        onSelect={setActiveIdx}
      />

      <div className="creation-main">
        {/* Top row */}
        <div className="creation-topbar">
          <nav className="breadcrumb">
            <span className="breadcrumb-item">Test Creation</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item">Create Test</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item active">Chapter Wise</span>
          </nav>
          <button className="btn btn-primary" onClick={handleContinue} disabled={saving}>
            {saving ? 'Saving…' : 'Publish'}
          </button>
        </div>

        <TestSummaryCard test={test || {}} onEdit={() => setEditOpen(true)} />

        {/* Question editor */}
        <div className="q-block">
          <div className="q-block-head">
            <span className="q-block-title">Question {activeIdx + 1}<span className="q-block-total">/{targetCount}</span></span>
            <div className="q-block-actions">
              <button className="btn btn-outline btn-sm" onClick={addNewQuestion}><Plus size={14} /> MCQ</button>
              <button className="btn btn-outline btn-sm" type="button"><ImageIcon size={13} /> CSV</button>
            </div>
          </div>

          <button className="link-danger" onClick={clearCurrent} type="button">
            <Trash2 size={13} /> Delete All Edits
          </button>

          {/* Question text */}
          <div className="rte">
            <EditorToolbar />
            <textarea
              className="rte-area"
              placeholder="Type here"
              value={current.questionText}
              onChange={e => updateCurrent({ questionText: e.target.value })}
              rows={4}
            />
          </div>

          {/* Options */}
          <div className="q-options">
            <div className="q-section-label">Type the options below</div>
            {current.options.map(opt => (
              <div key={opt.id} className="q-option-row">
                <button
                  type="button"
                  className={`opt-radio${current.correctOption === opt.id ? ' selected' : ''}`}
                  onClick={() => updateCurrent({ correctOption: opt.id })}
                  aria-label={`Mark option ${opt.id} correct`}
                />
                <input
                  className="form-input"
                  placeholder="Type Option here"
                  value={opt.text}
                  onChange={e => updateOption(opt.id, e.target.value)}
                />
                <button type="button" className="icon-btn" onClick={() => updateOption(opt.id, '')} aria-label="Clear option">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Solution */}
          <div className="q-solution">
            <div className="q-section-label">Add Solution</div>
            <div className="q-solution-row">
              <textarea
                className="form-input"
                placeholder="Type here"
                value={current.solution}
                onChange={e => updateCurrent({ solution: e.target.value })}
                rows={4}
              />
              <button type="button" className="icon-btn" onClick={() => updateCurrent({ solution: '' })} aria-label="Clear solution">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Pager */}
          <div className="q-pager">
            <button
              type="button"
              className="pager-btn"
              onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              aria-label="Previous question"
            ><ChevronLeft size={16} /></button>
            <button
              type="button"
              className="pager-btn"
              onClick={() => setActiveIdx(i => Math.min(questions.length - 1, i + 1))}
              disabled={activeIdx >= questions.length - 1}
              aria-label="Next question"
            ><ChevronRight size={16} /></button>
          </div>

          {/* Settings */}
          <div className="q-settings">
            <div className="q-settings-title">Question settings</div>

            <div className="form-group">
              <label className="form-label">Level of Difficulty</label>
              <select className="form-select" value={current.difficultyLevel} onChange={e => updateCurrent({ difficultyLevel: e.target.value })}>
                <option value="">Select from Drop-down</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Difficult</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Topic</label>
              <select className="form-select" value={current.topic} onChange={e => updateCurrent({ topic: e.target.value })}>
                <option value="">Select from Drop-down</option>
                {topicOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sub-topic</label>
              <select className="form-select" value={current.subTopic} onChange={e => updateCurrent({ subTopic: e.target.value })}>
                <option value="">Select from Drop-down</option>
                {subTopicOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="q-footer">
            <button className="btn btn-coral" onClick={() => navigate('/')} disabled={saving}>Exit Test Creation</button>
            <button className="btn btn-primary" onClick={handleContinue} disabled={saving}>
              {saving ? 'Saving…' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {editOpen && testId && (
        <EditTestModal
          testId={testId}
          initial={editInitial}
          onClose={() => setEditOpen(false)}
          onSaved={loadTest}
        />
      )}
    </div>
  );
};

export default AddQuestions;
