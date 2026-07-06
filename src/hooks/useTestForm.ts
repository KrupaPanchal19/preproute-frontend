import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type {
  FormState,
  SubjectOption,
  TopicOption,
  SubTopicOption,
} from '../types';

/**
 * Encapsulates the Create / Edit test-details form state:
 * subject → topic → sub-topic cascading option loading plus the
 * dependent-reset change handlers. Shared by the Create page and the
 * Edit modal so the two stay identical.
 */
export function useTestForm(initial: FormState) {
  const [form, setForm] = useState<FormState>(initial);
  const [subjects,  setSubjects]  = useState<SubjectOption[]>([]);
  const [topics,    setTopics]    = useState<TopicOption[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopicOption[]>([]);

  /* ── Load subjects once ── */
  useEffect(() => {
    api.getSubjects()
      .then(r => {
        const arr: any[] = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
        setSubjects(arr.map(s => ({ id: s.id, name: s.name || s.subject || '' })));
      })
      .catch(() => {
        setSubjects([
          { id: 'math-uuid',      name: 'Mathematics' },
          { id: 'physics-uuid',   name: 'Physics' },
          { id: 'chemistry-uuid', name: 'Chemistry' },
          { id: 'biology-uuid',   name: 'Biology' },
          { id: 'english-uuid',   name: 'English' },
        ]);
      });
  }, []);

  /* ── Load topics when subject changes ── */
  useEffect(() => {
    if (!form.subject_id) { setTopics([]); setSubTopics([]); return; }
    api.getTopics(form.subject_id)
      .then(r => {
        const arr: any[] = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
        setTopics(arr.map(t => ({ id: t.id, name: t.name || t.topic || '', subject_id: t.subject_id })));
      })
      .catch(() => setTopics([]));
  }, [form.subject_id]);

  /* ── Load sub-topics when topic changes ── */
  useEffect(() => {
    if (!form.topic_id) { setSubTopics([]); return; }
    api.getSubTopics(form.subject_id, form.topic_id)
      .then(r => {
        const arr: any[] = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
        setSubTopics(arr.map(s => ({ id: s.id, name: s.name || s.subTopic || '', topic_id: s.topic_id })));
      })
      .catch(() => setSubTopics([]));
  }, [form.subject_id, form.topic_id]);

  const setField = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(f => ({ ...f, [k]: v }));
  }, []);

  const handleSubjectChange = useCallback((subId: string) => {
    setForm(f => {
      const subObj = subjects.find(s => s.id === subId);
      return {
        ...f,
        subject_id: subId,
        subject:    subObj?.name || subId,
        topic: '', topic_id: '',
        subTopic: '', subTopic_id: '',
      };
    });
  }, [subjects]);

  const handleTopicChange = useCallback((topId: string) => {
    setForm(f => {
      const topObj = topics.find(t => t.id === topId);
      return { ...f, topic_id: topId, topic: topObj?.name || topId, subTopic: '', subTopic_id: '' };
    });
  }, [topics]);

  const handleSubTopicChange = useCallback((stId: string) => {
    setForm(f => {
      const stObj = subTopics.find(s => s.id === stId);
      return { ...f, subTopic_id: stId, subTopic: stObj?.name || stId };
    });
  }, [subTopics]);

  return {
    form, setForm, setField,
    subjects, topics, subTopics,
    handleSubjectChange, handleTopicChange, handleSubTopicChange,
  };
}
