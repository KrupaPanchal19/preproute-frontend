import React from 'react';
import { NumberStepper } from './NumberStepper';
import type {
  FormState,
  SubjectOption,
  TopicOption,
  SubTopicOption,
} from '../types';

const DIFFICULTIES = ['Easy', 'Medium', 'Difficult'] as const;

export type TestDetailsFormProps = {
  form: FormState;
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  subjects: SubjectOption[];
  topics: TopicOption[];
  subTopics: SubTopicOption[];
  onSubjectChange: (id: string) => void;
  onTopicChange: (id: string) => void;
  onSubTopicChange: (id: string) => void;
  errors?: { testName?: string; subject?: string };
};

/**
 * The Subject / Name / Topic / Sub Topic / Duration / Difficulty / Marking
 * Scheme form. Rendered both on the full-page Create screen and inside the
 * Edit Test modal, so the two remain pixel-identical.
 */
export function TestDetailsForm({
  form,
  setField,
  subjects,
  topics,
  subTopics,
  onSubjectChange,
  onTopicChange,
  onSubTopicChange,
  errors = {},
}: TestDetailsFormProps) {
  const totalMarks = form.totalQuestions * form.correctMarking;

  return (
    <div className="test-form">
      <div className="test-form-grid">
        {/* Subject */}
        <div className="form-group">
          <label className="form-label" htmlFor="subject">Subject</label>
          <select
            id="subject"
            className="form-select"
            value={form.subject_id}
            onChange={e => onSubjectChange(e.target.value)}
          >
            <option value="">Choose from Drop-down</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.subject && <span className="error-text">{errors.subject}</span>}
        </div>

        {/* Name of Test */}
        <div className="form-group">
          <label className="form-label" htmlFor="testName">Name of Test</label>
          <input
            id="testName"
            className="form-input"
            placeholder="Enter name of Test"
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
            onChange={e => onTopicChange(e.target.value)}
            disabled={!form.subject_id}
          >
            <option value="">Choose from Drop-down</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Sub Topic */}
        <div className="form-group">
          <label className="form-label" htmlFor="subTopic">Sub Topic</label>
          <select
            id="subTopic"
            className="form-select"
            value={form.subTopic_id}
            onChange={e => onSubTopicChange(e.target.value)}
            disabled={!form.topic_id}
          >
            <option value="">Choose from Drop-down</option>
            {subTopics.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Duration */}
        <div className="form-group">
          <label className="form-label" htmlFor="duration">Duration (Minutes)</label>
          <input
            id="duration"
            className="form-input"
            type="number"
            min={1}
            placeholder="Enter the time"
            value={form.duration || ''}
            onChange={e => setField('duration', Number(e.target.value))}
          />
        </div>

        {/* Difficulty */}
        <div className="form-group">
          <span className="form-label">Test Difficulty Level</span>
          <div className="radio-row">
            {DIFFICULTIES.map(d => (
              <label key={d} className="radio-option">
                <input
                  type="radio"
                  name="difficultyLevel"
                  value={d}
                  checked={form.difficultyLevel === d}
                  onChange={() => setField('difficultyLevel', d)}
                />
                <span>{d}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Marking Scheme */}
      <div className="marking-scheme">
        <span className="marking-scheme-title">Marking Scheme:</span>
        <div className="marking-grid">
          <div className="form-group">
            <label className="form-label">Wrong Answer</label>
            <NumberStepper value={form.negativeMarking} onChange={v => setField('negativeMarking', v)} min={-10} max={0} showSign />
          </div>
          <div className="form-group">
            <label className="form-label">Unattempted</label>
            <NumberStepper value={form.unattempted} onChange={v => setField('unattempted', v)} min={-10} max={10} showSign />
          </div>
          <div className="form-group">
            <label className="form-label">Correct Answer</label>
            <NumberStepper value={form.correctMarking} onChange={v => setField('correctMarking', v)} min={0} max={20} showSign />
          </div>
          <div className="form-group">
            <label className="form-label">No of Questions</label>
            <input
              className="form-input"
              type="number"
              min={0}
              placeholder="Ex:250 Marks"
              value={form.totalQuestions || ''}
              onChange={e => setField('totalQuestions', Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Total Marks</label>
            <input
              className="form-input is-readonly"
              placeholder="Ex:250 Marks"
              value={totalMarks ? String(totalMarks) : ''}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestDetailsForm;
