import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../App';
import { useTestForm } from '../hooks/useTestForm';
import { TestDetailsForm } from '../components/TestDetailsForm';
import { INITIAL_FORM, TEST_TABS } from '../types';
import type { TestType } from '../types';

const TYPE_LABEL: Record<TestType, string> = {
  chapterwise: 'Chapter Wise',
  pyq: 'PYQ',
  mocktest: 'Mock Test',
};

const CreateTest: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const {
    form, setForm, setField, subjects, topics, subTopics,
    handleSubjectChange, handleTopicChange, handleSubTopicChange,
  } = useTestForm(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState<TestType>('chapterwise');
  const [errors, setErrors] = useState<{ testName?: string; subject?: string }>({});
  const [loading, setLoading] = useState(false);

  /* Load existing test when editing */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getTest(id)
      .then(r => {
        const d = r?.data;
        if (!d) return;
        const type = (['chapterwise', 'pyq', 'mocktest'].includes(d.testType) ? d.testType : 'chapterwise') as TestType;
        setForm(f => ({
          ...f,
          testName:        d.testName || '',
          subject:         d.subject  || '',
          subject_id:      d.subject_id || d.subject || '',
          topic:           d.topic    || (d.topics?.[0] || ''),
          topic_id:        d.topic_ids?.[0] || '',
          subTopic:        '',
          subTopic_id:     d.sub_topic_ids?.[0] || '',
          duration:        d.duration        ?? 60,
          difficultyLevel: d.difficultyLevel || 'Easy',
          negativeMarking: d.negativeMarking ?? -1,
          unattempted:     d.unattempted     ?? 0,
          correctMarking:  d.correctMarking  ?? 5,
          totalQuestions:  d.totalQuestions  ?? 50,
          testType:        type,
        }));
        setActiveTab(type);
      })
      .catch(() => toast.showError('Failed to load test data'))
      .finally(() => setLoading(false));
  }, [id]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.testName.trim()) e.testName = 'Test name is required';
    if (!form.subject_id)      e.subject  = 'Subject is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setFieldTracked: typeof setField = (k, v) => {
    setField(k, v);
    if (k === 'testName' && errors.testName) setErrors(e => ({ ...e, testName: undefined }));
  };

  const onSubjectChange = (subId: string) => {
    handleSubjectChange(subId);
    if (errors.subject) setErrors(e => ({ ...e, subject: undefined }));
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        testType: activeTab,
        topic_ids:     form.topic_id    ? [form.topic_id]    : [],
        sub_topic_ids: form.subTopic_id ? [form.subTopic_id] : [],
        topics:        form.topic       ? [form.topic]       : [],
        sub_topics:    form.subTopic    ? [form.subTopic]    : [],
      };

      if (isEdit) {
        await api.updateTest(id!, payload);
        toast.showSuccess('Test updated successfully!');
        navigate('/');
      } else {
        const res = await api.createTest(payload);
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

  if (loading && isEdit && !form.testName) {
    return (
      <div className="page-container">
        <div className="loading-state"><div className="spinner" /><span>Loading test…</span></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <span className="breadcrumb-item">Test Creation</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-item">{isEdit ? 'Edit Test' : 'Create Test'}</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-item active">{TYPE_LABEL[activeTab]}</span>
      </nav>

      {/* Tabs */}
      <div className="tabs tabs-pill">
        {TEST_TABS.map(t => (
          <button
            key={t.key}
            type="button"
            className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >{t.label}</button>
        ))}
      </div>

      {/* Form */}
      <TestDetailsForm
        form={form}
        setField={setFieldTracked}
        subjects={subjects}
        topics={topics}
        subTopics={subTopics}
        onSubjectChange={onSubjectChange}
        onTopicChange={handleTopicChange}
        onSubTopicChange={handleSubTopicChange}
        errors={errors}
      />

      {/* Footer */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/')} disabled={loading}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default CreateTest;
