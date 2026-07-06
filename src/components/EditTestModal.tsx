import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTestForm } from '../hooks/useTestForm';
import { TestDetailsForm } from './TestDetailsForm';
import { api } from '../api';
import { useToast } from '../App';
import { INITIAL_FORM, TEST_TABS } from '../types';
import type { FormState, TestType } from '../types';

type EditTestModalProps = {
  testId: string;
  initial?: Partial<FormState>;
  onClose: () => void;
  onSaved?: () => void;
};

/** "Edit Test creation" dialog — same form body as the Create screen. */
export function EditTestModal({ testId, initial, onClose, onSaved }: EditTestModalProps) {
  const toast = useToast();
  const {
    form, setForm, setField, subjects, topics, subTopics,
    handleSubjectChange, handleTopicChange, handleSubTopicChange,
  } = useTestForm({ ...INITIAL_FORM, ...initial });
  const [activeTab, setActiveTab] = useState<TestType>(form.testType);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateTest(testId, {
        ...form,
        testType: activeTab,
        topic_ids:     form.topic_id    ? [form.topic_id]    : [],
        sub_topic_ids: form.subTopic_id ? [form.subTopic_id] : [],
        topics:        form.topic       ? [form.topic]       : [],
        sub_topics:    form.subTopic    ? [form.subTopic]    : [],
      });
      toast.showSuccess('Test updated successfully!');
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast.showError(err?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Edit Test creation</span>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="tabs tabs-pill">
            {TEST_TABS.map(t => (
              <button
                key={t.key}
                type="button"
                className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
                onClick={() => { setActiveTab(t.key); setForm(f => ({ ...f, testType: t.key })); }}
              >{t.label}</button>
            ))}
          </div>

          <TestDetailsForm
            form={form}
            setField={setField}
            subjects={subjects}
            topics={topics}
            subTopics={subTopics}
            onSubjectChange={handleSubjectChange}
            onTopicChange={handleTopicChange}
            onSubTopicChange={handleSubTopicChange}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditTestModal;
