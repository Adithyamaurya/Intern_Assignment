export interface Slide {
  slide_number: number;
  title: string;
  bullets: string[];
  notes: string;
  formulas?: string[];
  figure?: {
    description: string;
  };
}

export interface Lecture {
  lecture_id: string;
  course_code: string;
  course_title: string;
  week: number;
  title: string;
  slides: Slide[];
}

export interface Citation {
  lecture: string; // matches "Week X — Lecture Title"
  slide: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  created_at: string;
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  isCancelled?: boolean;
  error?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  instructor: string;
}

export interface Student {
  id: string;
  name: string;
}

export interface Conversation {
  id: string;
  course: Course;
  student: Student;
  started_at: string | null;
  messages: Message[];
}

export type ConceptStatus = 'covered' | 'needs_review' | 'unexplored';

export interface Concept {
  id: string;
  name: string;
  description: string;
  lectureWeek: number; // 1, 2, 3
  slides: { week: number; slide: number }[];
  status: ConceptStatus;
  relatedIds: string[];
  citationCount: number;
  lastDiscussedAt?: string; // ISO timestamp
}
