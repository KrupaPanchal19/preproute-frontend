/* ============================================================
   SHARED TYPES
   ============================================================ */

export type TestType = 'chapterwise' | 'pyq' | 'mocktest';

export interface FormState {
  testName: string;
  subject: string;       // display name (e.g. "Mathematics")
  subject_id: string;    // ID for API calls
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
  testType: TestType;
}

export interface SubjectOption  { id: string; name: string; }
export interface TopicOption    { id: string; name: string; subject_id: string; }
export interface SubTopicOption { id: string; name: string; topic_id: string; }

export const INITIAL_FORM: FormState = {
  testName: '',
  subject: '', subject_id: '',
  topic: '',   topic_id: '',
  subTopic: '', subTopic_id: '',
  duration: 0,
  difficultyLevel: 'Easy',
  negativeMarking: -1,
  unattempted: 0,
  correctMarking: 5,
  totalQuestions: 0,
  testType: 'chapterwise',
};

export const TEST_TABS: { key: TestType; label: string }[] = [
  { key: 'chapterwise', label: 'Chapterwise' },
  { key: 'pyq',         label: 'PYQ' },
  { key: 'mocktest',    label: 'Mock Test' },
];
