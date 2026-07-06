import React from 'react';
import { Check, ChevronRight, ChevronsLeft } from 'lucide-react';

export type PanelQuestion = { label: string; done: boolean };

type QuestionCreationPanelProps = {
  total: number;
  questions: PanelQuestion[];
  activeIdx?: number;
  onSelect?: (idx: number) => void;
};

/** Left "Question creation" panel: total count + the per-question status list. */
export function QuestionCreationPanel({
  total,
  questions,
  activeIdx,
  onSelect,
}: QuestionCreationPanelProps) {
  return (
    <aside className="qc-panel">
      <div className="qc-panel-header">
        <span>Question creation</span>
        <ChevronsLeft size={16} className="qc-collapse" aria-hidden="true" />
      </div>

      <div className="qc-total">Total Questions : {total}</div>

      <div className="qc-list">
        {questions.map((q, i) => {
          const active = i === activeIdx;
          const cls = ['qc-item', active ? 'active' : '', q.done ? 'done' : 'pending'].filter(Boolean).join(' ');
          const content = (
            <>
              <span className="qc-dot">{q.done && <Check size={11} strokeWidth={3} />}</span>
              <span className="qc-label">{q.label}</span>
              <ChevronRight size={14} className="qc-chevron" />
            </>
          );
          return onSelect ? (
            <button key={i} type="button" className={cls} onClick={() => onSelect(i)}>{content}</button>
          ) : (
            <div key={i} className={cls}>{content}</div>
          );
        })}
      </div>
    </aside>
  );
}

export default QuestionCreationPanel;
