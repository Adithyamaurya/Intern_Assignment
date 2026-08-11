import conversationEmpty from '../../data/conversation-empty.json';
import conversationInitial from '../../data/conversation.json';
import lecture01 from '../../data/lectures/lecture-01-linear-models.json';
import lecture02 from '../../data/lectures/lecture-02-gradient-descent.json';
import lecture03 from '../../data/lectures/lecture-03-regularization.json';
import type { Lecture, Slide, Conversation } from '../types';

// Cast loaded JSON objects to our strong TS types
export const LECTURES: Lecture[] = [
  lecture01 as Lecture,
  lecture02 as Lecture,
  lecture03 as Lecture,
];

export const EMPTY_CONVERSATION = conversationEmpty as Conversation;
export const INITIAL_CONVERSATION = conversationInitial as Conversation;

/**
 * Returns all lectures
 */
export function getLectures(): Lecture[] {
  return LECTURES;
}

/**
 * Finds a lecture by its week number or ID
 */
export function getLectureByIdOrWeek(idOrWeek: string | number): Lecture | undefined {
  if (typeof idOrWeek === 'number') {
    return LECTURES.find((l) => l.week === idOrWeek);
  }
  return LECTURES.find((l) => l.lecture_id === idOrWeek);
}

/**
 * Normalizes a lecture title/string into a structured format for citation matching.
 * e.g., "Week 2 — Gradient Descent and Backpropagation"
 */
export function getLectureName(lecture: Lecture): string {
  return `Week ${lecture.week} — ${lecture.title}`;
}

/**
 * Matches a citation's lecture string to a loaded Lecture object.
 */
export function getLectureByCitationName(citationName: string): Lecture | undefined {
  return LECTURES.find((l) => getLectureName(l) === citationName);
}

/**
 * Resolves slide details from a citation.
 */
export function getSlideFromCitation(lectureName: string, slideNumber: number): { lecture: Lecture; slide: Slide } | undefined {
  const lecture = getLectureByCitationName(lectureName);
  if (!lecture) return undefined;

  const slide = lecture.slides.find((s) => s.slide_number === slideNumber);
  if (!slide) return undefined;

  return { lecture, slide };
}

/**
 * Formats a slide location nicely, e.g., "Lecture 02 · Slide 14"
 */
export function formatSlideLocation(lecture: Lecture, slideNumber: number): string {
  const paddedWeek = String(lecture.week).padStart(2, '0');
  return `Lecture ${paddedWeek} · Slide ${slideNumber}`;
}
