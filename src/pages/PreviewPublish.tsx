import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Calendar } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../App';
import { QuestionCreationPanel, type PanelQuestion } from '../components/QuestionCreationPanel';
import { TestSummaryCard } from '../components/TestSummaryCard';
import { EditTestModal } from '../components/EditTestModal';
import type { FormState, TestType } from '../types';

const LIVE_OPTIONS: { value: string; label: string }[] = [
  { value: 'always', label: 'Always Available' },
  { value: '3w',     label: '3 Weeks' },
  { value: '1w',     label: '1 Week' },
  { value: '1m',     label: '1 Month' },
  { value: '2w',     label: '2 Weeks' },
  { value: 'custom', label: 'Custom Duration' },
];

const END_TIMES = ['09:00', '12:00', '15:00', '18:00', '21:00', '23:59'];

const PreviewPublish: React.FC = () => {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [liveUntil, setLiveUntil] = useState('custom');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');

  const loadTest = () => {
    if (!testId) return;
    api.getTest(testId).then(r => setTest(r?.data || null)).catch(() => {});
  };

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    Promise.all([
      api.getTest(testId).catch(() => null),
      api.getQuestions(testId).catch(() => ({ data: [] })),
    ]).then(([tRes, qRes]) => {
      setTest(tRes?.data || null);
      setQuestions(Array.isArray(qRes?.data) ? qRes.data : []);
    }).finally(() => setLoading(false));
  }, [testId]);

  const handleConfirm = async () => {
    if (!testId) return;
    if (publishMode === 'schedule' && !scheduleAt) { toast.showError('Please select a schedule date'); return; }
    if (publishMode === 'now' && liveUntil === 'custom' && !endDate) { toast.showError('Please choose an end date'); return; }
    setPublishing(true);
    try {
      await api.publishTest(testId, {
        ...(publishMode === 'schedule' && scheduleAt ? { scheduledAt: scheduleAt } : {}),
        live_duration: liveUntil === 'custom' ? `${endDate}${endTime ? `T${endTime}` : ''}` : liveUntil,
      });
      toast.showSuccess('Test published successfully!');
      navigate('/');
    } catch (err: any) {
      toast.showError(err?.message || 'Failed to publish test');
    } finally {
      setPublishing(false);
    }
  };

  const totalQ = test?.totalQuestions || questions.length;

  const panelQuestions: PanelQuestion[] = questions.map((_, i) => ({
    label: `Question ${i + 1}`,
    done: true,
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

  if (loading) {
    return (
      <div className="creation-layout">
        <QuestionCreationPanel total={0} questions={[]} />
        <div className="creation-main">
          <div className="loading-state"><div className="spinner" /><span>Loading preview…</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="creation-layout">
      <QuestionCreationPanel total={totalQ} questions={panelQuestions} />

      <div className="creation-main">
        <div className="confirm-eyebrow">Test creation</div>

        <div className="confirm-heading">
          <h1>Test created</h1>
          <span className="badge badge-easy done-pill">
            <CheckCircle size={13} /> All {totalQ} Questions done
          </span>
        </div>

        <TestSummaryCard test={test || {}} onEdit={() => setEditOpen(true)} />

        {/* Publish tabs */}
        <div className="tabs tabs-pill confirm-tabs">
          <button className={`tab-btn${publishMode === 'now' ? ' active' : ''}`} onClick={() => setPublishMode('now')} type="button">Publish Now</button>
          <button className={`tab-btn${publishMode === 'schedule' ? ' active' : ''}`} onClick={() => setPublishMode('schedule')} type="button">Schedule Publish</button>
        </div>

        {publishMode === 'now' ? (
          <div className="live-until">
            <h2 className="live-until-title">Live Until</h2>
            <p className="live-until-sub">Choose how long this test should remain available on the platform.</p>

            <div className="live-grid">
              {LIVE_OPTIONS.map(opt => (
                <label key={opt.value} className={`live-option${liveUntil === opt.value ? ' selected' : ''}`}>
                  <input type="radio" name="liveUntil" value={opt.value} checked={liveUntil === opt.value} onChange={() => setLiveUntil(opt.value)} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {liveUntil === 'custom' && (
              <div className="custom-duration">
                <div className="form-group">
                  <div className="input-with-icon icon-right">
                    <input
                      className="form-input"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      placeholder="Select End Date"
                    />
                    <Calendar size={15} className="input-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <select className="form-select" value={endTime} onChange={e => setEndTime(e.target.value)}>
                    <option value="">Select End Time</option>
                    {END_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="live-until">
            <h2 className="live-until-title">Schedule Publish</h2>
            <p className="live-until-sub">Pick when this test should go live.</p>
            <div className="form-group" style={{ maxWidth: 360 }}>
              <label className="form-label">Publish Date &amp; Time</label>
              <input
                className="form-input"
                type="datetime-local"
                value={scheduleAt}
                onChange={e => setScheduleAt(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => navigate(`/add-questions/${testId}`)} disabled={publishing}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={publishing}>
            {publishing ? 'Publishing…' : 'Confirm'}
          </button>
        </div>
      </div>

      {editOpen && testId && (
        <EditTestModal testId={testId} initial={editInitial} onClose={() => setEditOpen(false)} onSaved={loadTest} />
      )}
    </div>
  );
};

export default PreviewPublish;