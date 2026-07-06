import React from 'react';
import { BookOpen, Clock, FileText, Layers, Pencil } from 'lucide-react';

type SummaryTest = {
  testName?: string;
  testType?: string;
  subject?: string;
  topics?: string[];
  topic?: string;
  sub_topics?: string[];
  subTopic?: string;
  difficultyLevel?: string;
  duration?: number;
  totalQuestions?: number;
  correctMarking?: number;
  totalMarks?: number;
};

const TYPE_LABEL: Record<string, string> = {
  chapterwise: 'Chapter Wise',
  pyq: 'PYQ',
  mocktest: 'Mock Test',
};

function difficultyClass(level?: string) {
  const l = (level || '').toLowerCase();
  if (l === 'medium') return 'badge-medium';
  if (l === 'difficult' || l === 'hard') return 'badge-hard';
  return 'badge-easy';
}

/** The "Chapter Wise / Chapter 1 / Easy …" test-header card used on the
 *  question-creation and confirmation screens. */
export function TestSummaryCard({ test, onEdit }: { test: SummaryTest; onEdit?: () => void }) {
  const topics = (test.topics?.length ? test.topics : test.topic ? [test.topic] : []).filter(Boolean);
  const subTopics = (test.sub_topics?.length ? test.sub_topics : test.subTopic ? [test.subTopic] : []).filter(Boolean);
  const marks = test.totalMarks || (test.totalQuestions ?? 0) * (test.correctMarking ?? 0);

  return (
    <div className="summary-card">
      <div className="summary-card-top">
        <span className="type-pill">{TYPE_LABEL[test.testType || 'chapterwise'] || 'Chapter Wise'}</span>
        {onEdit && (
          <button className="summary-edit" onClick={onEdit} aria-label="Edit test details">
            <Pencil size={15} />
          </button>
        )}
      </div>

      <div className="summary-card-body">
        <div className="summary-main">
          <div className="summary-title-row">
            <Layers size={16} className="summary-title-icon" />
            <span className="summary-title">{test.testName || 'Chapter 1'}</span>
            <span className={`badge ${difficultyClass(test.difficultyLevel)}`}>
              {test.difficultyLevel || 'Easy'}
            </span>
          </div>

          <dl className="summary-meta-list">
            <div className="summary-meta-row">
              <dt>Subject</dt><dd>: {test.subject || '—'}</dd>
            </div>
            <div className="summary-meta-row">
              <dt>Topic</dt>
              <dd>: {topics.length
                ? topics.map(t => <span key={t} className="chip-tag">{t}</span>)
                : '—'}</dd>
            </div>
            <div className="summary-meta-row">
              <dt>Sub Topic</dt>
              <dd>: {subTopics.length
                ? subTopics.map(t => <span key={t} className="chip-tag">{t}</span>)
                : '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="summary-stats">
          <span><Clock size={13} /> {test.duration ?? 60} Min</span>
          <span><BookOpen size={13} /> {test.totalQuestions ?? 0} Q's</span>
          <span><FileText size={13} /> {marks} Marks</span>
        </div>
      </div>
    </div>
  );
}

export default TestSummaryCard;
