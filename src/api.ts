/// <reference types="vite/client" />

const BASE_URL = import.meta.env.VITE_API_URL || 'https://admin-moderator-backend-staging.up.railway.app/api';

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { requiresAuth = true, ...customOptions } = options;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customOptions,
    headers: { ...headers, ...customOptions.headers },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

/* ===================================================================
   NORMALIZERS
   =================================================================== */

/**
 * Normalize a test object from API shape → component-friendly shape.
 *
 * API shape uses:
 *   id, name, type, subject (name string after resolveTestDetails),
 *   topics (name array), difficulty, total_time, correct_marks,
 *   wrong_marks, unattempt_marks, total_questions, created_at, status (null|"live")
 *
 * We produce BOTH the camelCase names our components expect AND keep
 * the originals so nothing breaks.
 */
export function normalizeTest(t: any) {
  if (!t) return t;
  const testId = t._id || t.id || '';
  const statusRaw = t.status ?? 'draft';
  const status = statusRaw === null || statusRaw === '' ? 'draft' : statusRaw;

  return {
    /* identity */
    _id: testId,
    id:  testId,

    /* name */
    testName: t.testName || t.name || '',

    /* type */
    testType: t.testType || t.type || 'chapterwise',

    /* subject — keep both the display name and the ID for re-use */
    subject:    t.subject    || '',          // resolved name (e.g. "Mathematics")
    subject_id: t.subject_id || t.subject || '', // ID (e.g. "math-uuid")

    /* topics — array of resolved names (from resolveTestDetails) */
    topics:    Array.isArray(t.topics) ? t.topics : [],
    topic:     Array.isArray(t.topics) ? (t.topics[0] || '') : (t.topic || ''),
    topic_ids: Array.isArray(t.topic_ids) ? t.topic_ids : [],

    /* sub_topics — array of IDs (NOT resolved by backend) */
    sub_topics:     Array.isArray(t.sub_topics)     ? t.sub_topics     : [],
    sub_topic_ids:  Array.isArray(t.sub_topic_ids)  ? t.sub_topic_ids  : [],

    /* difficulty — API returns lowercase ("easy"), we capitalize */
    difficultyLevel: capitalize(t.difficultyLevel || t.difficulty || 'Easy'),

    /* duration */
    duration:   t.duration   ?? t.total_time   ?? 60,
    total_time: t.duration   ?? t.total_time   ?? 60,

    /* marking scheme */
    correctMarking:  t.correctMarking  ?? t.correct_marks   ?? 4,
    negativeMarking: t.negativeMarking ?? t.wrong_marks     ?? -1,
    unattempted:     t.unattempted     ?? t.unattempt_marks ?? 0,

    /* totals */
    totalQuestions: t.totalQuestions ?? t.total_questions ?? 0,
    totalMarks:     t.totalMarks     ?? t.total_marks     ?? 0,

    /* questions IDs array */
    questions: Array.isArray(t.questions) ? t.questions : [],

    /* status */
    status,

    /* dates */
    createdAt:  t.createdAt  || t.created_at  || '',
    created_at: t.createdAt  || t.created_at  || '',
  };
}

/**
 * Normalize a question object.
 *
 * Backend stores: question, option1..option4, correct_option ("option1"|"option2"...|1..4)
 * We need:        questionText, options: [{id, text}], correctOption ("A"|"B"|"C"|"D")
 */
export function normalizeQuestion(q: any) {
  if (!q) return q;
  const letters = ['A', 'B', 'C', 'D'];

  // Build options array
  let options: { id: string; text: string }[] = [];
  if (Array.isArray(q.options)) {
    options = q.options.map((o: any, i: number) => ({
      id: letters[i] || String(i),
      text: typeof o === 'string' ? o : (o?.text || ''),
    }));
  } else {
    ['option1', 'option2', 'option3', 'option4'].forEach((key, i) => {
      options.push({ id: letters[i], text: q[key] ?? '' });
    });
  }

  // Resolve correctOption → letter
  let correctOption: string = '';
  const raw = q.correctOption ?? q.correct_option ?? '';
  if (typeof raw === 'number') {
    correctOption = letters[raw - 1] || 'A';
  } else if (typeof raw === 'string') {
    // "option1" → "A", "option2" → "B", etc.
    if (raw.startsWith('option')) {
      const idx = parseInt(raw.replace('option', ''), 10) - 1;
      correctOption = letters[idx] || 'A';
    } else if (letters.includes(raw.toUpperCase())) {
      correctOption = raw.toUpperCase();
    } else if (!isNaN(parseInt(raw, 10))) {
      correctOption = letters[parseInt(raw, 10) - 1] || 'A';
    } else {
      correctOption = raw;
    }
  }

  return {
    _id: q._id || q.id,
    id:  q._id || q.id,
    questionText: q.questionText || q.question || '',
    options,
    correctOption,
    solution: q.solution || q.explanation || '',
    difficultyLevel: capitalize(q.difficultyLevel || q.difficulty || 'Easy'),
    topic:    q.topic    || q.topic_id    || '',
    subTopic: q.subTopic || q.sub_topic_id || '',
  };
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Convert component form → API POST/PUT payload for create/update test.
 *
 * NOTE: The backend `/topics/subject/:subjectId` expects the subject ID,
 * NOT the display name. We keep both fields in our normalized form so we
 * can always send the ID.
 */
export function toApiTestPayload(form: any) {
  // Resolve subject to ID if possible
  const subjectId = form.subject_id && form.subject_id !== form.subject
    ? form.subject_id
    : form.subject;  // fallback to name when no separate ID stored

  // topic_ids preferred over topic names
  const topicIds = form.topic_ids?.length > 0
    ? form.topic_ids
    : form.topics?.length > 0 ? form.topics : (form.topic ? [form.topic] : []);

  const subTopicIds = form.sub_topic_ids?.length > 0
    ? form.sub_topic_ids
    : form.sub_topics?.length > 0 ? form.sub_topics : [];

  return {
    name:            form.testName   || form.name       || '',
    type:            form.testType   || form.type        || 'chapterwise',
    subject:         subjectId,
    topics:          topicIds,
    sub_topics:      subTopicIds,
    correct_marks:   form.correctMarking  ?? form.correct_marks   ?? 4,
    wrong_marks:     form.negativeMarking ?? form.wrong_marks     ?? -1,
    unattempt_marks: form.unattempted     ?? form.unattempt_marks ?? 0,
    difficulty:      (form.difficultyLevel || form.difficulty || 'Easy').toLowerCase(),
    total_time:      form.duration        ?? form.total_time      ?? 60,
    total_questions: form.totalQuestions  ?? form.total_questions ?? 10,
  };
}

/**
 * Convert one question (component form) → API bulk row
 * correct_option must be sent as number (1-4) for backend bulk endpoint.
 */
export function toApiQuestionPayload(testId: string, q: any) {
  const letters = ['A', 'B', 'C', 'D'];
  const correctIdx = letters.indexOf((q.correctOption || 'A').toUpperCase()) + 1;
  const opts = q.options || [];

  return {
    test_id:       testId,
    question:      q.questionText || '',
    option1:       opts[0]?.text ?? opts[0] ?? '',
    option2:       opts[1]?.text ?? opts[1] ?? '',
    option3:       opts[2]?.text ?? opts[2] ?? '',
    option4:       opts[3]?.text ?? opts[3] ?? '',
    correct_option: correctIdx > 0 ? correctIdx : 1,
    explanation:   q.solution     || '',
    difficulty:    (q.difficultyLevel || 'Easy').toLowerCase(),
    topic_id:      q.topic         || '',
    sub_topic_id:  q.subTopic      || '',
  };
}

/* ===================================================================
   API CLIENT
   =================================================================== */
export const api = {
  /* Auth */
  login: (userId: string, password: string) =>
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password }),
      requiresAuth: false,
    }),

  /* ---- Subjects / Topics ---- */
  getSubjects: () => request<any>('/subjects'),

  /** Topics by subject — pass the subject ID (e.g. "math-uuid") */
  getTopics: (subjectId: string) => request<any>(`/topics/subject/${subjectId}`),
  getTopicsBySubject: (subjectId: string) => request<any>(`/topics/subject/${subjectId}`),

  /** Sub-topics by topic — pass the topic ID (e.g. "math-alg-uuid") */
  getSubTopics: (_subjectId: string, topicId: string) => request<any>(`/sub-topics/topic/${topicId}`),
  getSubTopicsByTopic: (topicId: string) => request<any>(`/sub-topics/topic/${topicId}`),

  getSubTopicsByMultiTopics: (topicIds: string[]) =>
    request<any>('/sub-topics/multi-topics', {
      method: 'POST',
      body: JSON.stringify({ topicIds }),
    }),

  /* ---- Tests ---- */
  getTests: async () => {
    const res = await request<any>('/tests');
    const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    return { ...res, data: raw.map(normalizeTest) };
  },

  getTest: async (id: string) => {
    const res = await request<any>(`/tests/${id}`);
    const raw = res?.data || res;
    return { ...res, data: normalizeTest(raw) };
  },

  getTestById: async (id: string) => {
    const res = await request<any>(`/tests/${id}`);
    const raw = res?.data || res;
    return { ...res, data: normalizeTest(raw) };
  },

  createTest: (formData: any) =>
    request<any>('/tests', {
      method: 'POST',
      body: JSON.stringify(toApiTestPayload(formData)),
    }),

  updateTest: (id: string, formData: any) =>
    request<any>(`/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiTestPayload(formData)),
    }),

  deleteTest: (id: string) => request<any>(`/tests/${id}`, { method: 'DELETE' }),

  /* ---- Questions ---- */

  /**
   * Load all questions for a test.
   * Fetches test → gets question IDs → bulk-fetches question objects.
   */
  getQuestions: async (testId: string) => {
    try {
      const testRes = await request<any>(`/tests/${testId}`);
      const test = testRes?.data || testRes;
      const qIds: string[] = Array.isArray(test?.questions) ? test.questions : [];
      if (qIds.length === 0) return { success: true, data: [] };

      const bulkRes = await request<any>('/questions/fetchBulk', {
        method: 'POST',
        body: JSON.stringify({ question_ids: qIds }),
      });
      const rawQs = Array.isArray(bulkRes?.data) ? bulkRes.data : Array.isArray(bulkRes) ? bulkRes : [];
      return { ...bulkRes, data: rawQs.map(normalizeQuestion) };
    } catch (e) {
      console.error('getQuestions error:', e);
      return { success: true, data: [] };
    }
  },

  fetchQuestionsBulk: async (questionIds: string[]) => {
    const res = await request<any>('/questions/fetchBulk', {
      method: 'POST',
      body: JSON.stringify({ question_ids: questionIds }),
    });
    const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    return { ...res, data: raw.map(normalizeQuestion) };
  },

  /** Save all questions for a test in bulk */
  saveQuestionsBulk: (testId: string, questions: any[]) =>
    request<any>('/questions/bulk', {
      method: 'POST',
      body: JSON.stringify({
        questions: questions.map(q => toApiQuestionPayload(testId, q)),
      }),
    }),

  /** Add a single question via the bulk endpoint */
  addQuestion: (testId: string, q: any) =>
    request<any>('/questions/bulk', {
      method: 'POST',
      body: JSON.stringify({ questions: [toApiQuestionPayload(testId, q)] }),
    }),

  createQuestionsBulk: (questions: any[], subjectId?: string) => {
    const sanitized = questions.map(q => {
      const copy = { ...q };
      if (subjectId && !copy.subject) copy.subject = subjectId;
      return copy;
    });
    return request<any>('/questions/bulk', {
      method: 'POST',
      body: JSON.stringify({ questions: sanitized }),
    });
  },

  /** Backend has no single-question update endpoint — no-op */
  updateQuestion: (_questionId: string, _payload: any): Promise<any> =>
    Promise.resolve({ success: true }),

  /* ---- Publish ---- */
  publishTest: (id: string, extra?: Record<string, any>) =>
    request<any>(`/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'live', ...extra }),
    }),
};
