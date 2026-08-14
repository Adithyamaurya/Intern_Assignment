import type { Citation, Concept, Message } from '../types';
import {
  formatSlideLocation,
  getLectureByCitationName,
  getLectureByIdOrWeek,
  getSlideFromCitation,
  INITIAL_CONVERSATION,
} from './courseData';

const LECTURE_TOPICS: Record<number, string> = {
  1: 'Linear Models',
  2: 'Optimization',
  3: 'Regularization',
};

const COURSE_NAME = 'Machine Learning';

export interface ContextPath {
  segments: string[];
  primaryConcept: Concept | null;
}

export interface LessonSection {
  label: string;
  content: string;
}

export interface RichCitation {
  citation: Citation;
  location: string;
  slideTitle: string;
}

/** Find concepts referenced by citations. */
export function getConceptsFromCitations(
  citations: Citation[],
  concepts: Concept[]
): Concept[] {
  const found = new Map<string, Concept>();
  citations.forEach((cit) => {
    const weekMatch = cit.lecture.match(/Week (\d+)/i);
    const week = weekMatch ? parseInt(weekMatch[1], 10) : 0;
    concepts.forEach((c) => {
      if (c.slides.some((s) => s.week === week && s.slide === cit.slide)) {
        found.set(c.id, c);
      }
    });
  });
  return Array.from(found.values());
}

/** Full context path: Machine Learning → Regularization → L2 Regularization */
export function getContextPath(
  citations: Citation[],
  concepts: Concept[],
  userQuestion?: string
): ContextPath {
  const matched = getConceptsFromCitations(citations, concepts);
  let primary = matched[0] ?? null;

  if (!primary && userQuestion) {
    primary = findConceptByText(userQuestion, concepts);
  }

  const segments: string[] = [COURSE_NAME];

  if (primary) {
    segments.push(LECTURE_TOPICS[primary.lectureWeek] ?? `Lecture 0${primary.lectureWeek}`);
    segments.push(primary.name);
  } else if (citations.length > 0) {
    const lec = getLectureByCitationName(citations[0].lecture);
    if (lec) {
      segments.push(LECTURE_TOPICS[lec.week] ?? lec.title);
    }
  }

  return { segments, primaryConcept: primary };
}

function findConceptByText(text: string, concepts: Concept[]): Concept | null {
  const lower = text.toLowerCase();
  const hits = concepts.filter((c) => lower.includes(c.name.toLowerCase()));
  if (hits.length) return hits[0];
  if (lower.includes('l1') || lower.includes('lasso')) return concepts.find((c) => c.id === 'l1_regularization') ?? null;
  if (lower.includes('l2') || lower.includes('ridge')) return concepts.find((c) => c.id === 'l2_regularization') ?? null;
  if (lower.includes('regularization')) return concepts.find((c) => c.id === 'l2_regularization') ?? null;
  if (lower.includes('gradient')) return concepts.find((c) => c.id === 'gradient_descent') ?? null;
  if (lower.includes('overfitting')) return concepts.find((c) => c.id === 'overfitting') ?? null;
  return null;
}

/** Current concept from the latest assistant message. */
export function getCurrentConceptFromMessages(
  messages: Message[],
  concepts: Concept[]
): Concept | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant') continue;
    const matched = getConceptsFromCitations(msg.citations ?? [], concepts);
    if (matched.length) return matched[0];
    const userMsg = messages[i - 1];
    if (userMsg?.role === 'user') {
      const fromQ = findConceptByText(userMsg.content, concepts);
      if (fromQ) return fromQ;
    }
  }
  return null;
}

/** Build a chain of related concepts for display. */
export function getConceptChain(
  primary: Concept | null,
  allConcepts: Concept[]
): Concept[] {
  if (!primary) return [];
  const chain: Concept[] = [primary];
  const seen = new Set<string>([primary.id]);

  primary.relatedIds.forEach((id) => {
    if (seen.has(id)) return;
    const c = allConcepts.find((x) => x.id === id);
    if (c) { chain.push(c); seen.add(id); }
  });

  return chain.slice(0, 6);
}

export function getRelatedConcepts(
  matchedConcepts: Concept[],
  allConcepts: Concept[]
): Concept[] {
  const matchedIds = new Set(matchedConcepts.map((c) => c.id));
  const related: Concept[] = [];
  const seen = new Set<string>();

  matchedConcepts.forEach((primary) => {
    primary.relatedIds.forEach((relId) => {
      if (matchedIds.has(relId) || seen.has(relId)) return;
      const rel = allConcepts.find((c) => c.id === relId);
      if (rel) { seen.add(relId); related.push(rel); }
    });
  });

  return related.slice(0, 5);
}

/** Parse markdown into labeled lesson sections. */
export function parseLessonSections(content: string): LessonSection[] {
  if (!content.trim()) return [];

  const h2Parts = content.split(/\n(?=## )/);
  if (h2Parts.length > 1) {
    return h2Parts.map((part) => {
      const m = part.match(/^## (.+?)\n([\s\S]*)$/);
      if (m) return { label: m[1].trim(), content: m[2].trim() };
      return { label: 'Explanation', content: part.trim() };
    }).filter((s) => s.content);
  }

  const sections: LessonSection[] = [];
  const hasTable = /^\|.+\|/m.test(content);
  const hasCode = /```/.test(content);
  const hasMath = /\$\$/.test(content);

  const paragraphs = content.split(/\n\n+/);
  const tableStart = paragraphs.findIndex((p) => p.trim().startsWith('|'));
  const codeStart = paragraphs.findIndex((p) => p.trim().startsWith('```'));
  const mathStart = paragraphs.findIndex((p) => p.trim().startsWith('$$'));

  if (paragraphs[0] && !paragraphs[0].trim().startsWith('|') && !paragraphs[0].trim().startsWith('```')) {
    sections.push({ label: 'In one sentence', content: paragraphs[0].trim() });
  }

  if (hasTable && tableStart >= 0) {
    let tableContent = paragraphs[tableStart];
    if (tableStart + 1 < paragraphs.length && paragraphs[tableStart + 1].trim().match(/^[-|:\s]+$/)) {
      tableContent += '\n\n' + paragraphs[tableStart + 1];
      if (tableStart + 2 < paragraphs.length && paragraphs[tableStart + 2].trim().startsWith('|')) {
        tableContent += '\n\n' + paragraphs.slice(tableStart + 2).find((p) => p.trim().startsWith('|')) ?? '';
      }
    }
    const fullTable = extractTable(content);
    sections.push({ label: 'Compare', content: fullTable || tableContent.trim() });
  }

  const middleParts = paragraphs.filter((p, i) => {
    const t = p.trim();
    if (i === 0 && sections.some((s) => s.label === 'In one sentence')) return false;
    if (t.startsWith('|') || t.match(/^[-|:\s]+$/)) return false;
    if (t.startsWith('```') || t.startsWith('$$')) return false;
    return true;
  });

  if (middleParts.length > 0) {
    const last = middleParts[middleParts.length - 1];
    const rest = middleParts.slice(0, -1);
    if (rest.length) {
      sections.push({ label: 'Why it works', content: rest.join('\n\n').trim() });
    }
    if (last && last !== paragraphs[0]) {
      sections.push({ label: middleParts.length > 1 ? 'Takeaway' : 'Why it works', content: last.trim() });
    }
  }

  if (hasCode) {
    const code = extractFenced(content, '```');
    if (code) sections.push({ label: 'Mental model', content: code });
  }

  if (hasMath && !hasCode) {
    const math = extractFenced(content, '$$');
    if (math) sections.push({ label: 'Mental model', content: '$$\n' + math + '\n$$' });
  }

  if (sections.length === 0) {
    sections.push({ label: 'Explanation', content: content.trim() });
  }

  return sections;
}

function extractTable(content: string): string {
  const lines = content.split('\n');
  const start = lines.findIndex((l) => l.trim().startsWith('|'));
  if (start < 0) return '';
  const rows: string[] = [];
  for (let i = start; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('|')) break;
    rows.push(lines[i]);
  }
  return rows.join('\n');
}

function extractFenced(content: string, fence: string): string {
  const parts = content.split(fence);
  if (parts.length < 2) return '';
  if (fence === '```') {
    const m = content.match(/```[\s\S]*?```/);
    return m ? m[0] : '';
  }
  const m = content.match(/\$\$[\s\S]*?\$\$/);
  return m ? m[0].replace(/\$\$/g, '').trim() : '';
}

/** Extract a "what to remember" line from content. */
export function extractRememberLine(content: string, concepts: Concept[]): string | null {
  const rememberMatch = content.match(/(?:remember|key takeaway|important)[:\s]+([^.!?]+\.?)/i);
  if (rememberMatch) return rememberMatch[1].trim();

  const lastParagraph = content.trim().split(/\n\n+/).pop()?.trim() ?? '';
  if (lastParagraph.length > 20 && lastParagraph.length < 180 && !lastParagraph.startsWith('|')) {
    if (lastParagraph.toLowerCase().includes('honest') || lastParagraph.includes('**')) {
      return lastParagraph.replace(/\*\*/g, '');
    }
  }

  const matched = getConceptsFromCitations([], concepts);
  void matched;

  const boldMatch = content.match(/\*\*([^*]{15,120})\*\*/);
  if (boldMatch) return boldMatch[1];

  return null;
}

/** Rich citation with slide title. */
export function formatRichCitation(cit: Citation): RichCitation {
  const resolved = getSlideFromCitation(cit.lecture, cit.slide);
  const lecture = getLectureByCitationName(cit.lecture);
  const location = lecture ? formatSlideLocation(lecture, cit.slide) : `Slide ${cit.slide}`;
  const slideTitle = resolved?.slide.title ?? '';
  return { citation: cit, location, slideTitle };
}

export function formatCitationLabel(cit: Citation): string {
  const rich = formatRichCitation(cit);
  return rich.slideTitle
    ? `${rich.location} — ${rich.slideTitle}`
    : rich.location;
}

export function getReviewReason(concept: Concept, messages: Message[]): string {
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'assistant' || !msg.citations) continue;
    const weekMatch = (lecture: string) => {
      const m = lecture.match(/Week (\d+)/i);
      return m ? parseInt(m[1], 10) : 0;
    };
    const citesConcept = msg.citations.some((cit) =>
      concept.slides.some((s) => s.week === weekMatch(cit.lecture) && s.slide === cit.slide)
    );
    if (!citesConcept) continue;
    const userMsg = messages[i - 1];
    if (userMsg?.role === 'user') {
      const text = userMsg.content.toLowerCase();
      if (text.includes('stuck') || text.includes('confused') || text.includes("don't understand") || text.includes('dont understand')) {
        return 'You explored this but had follow-up questions.';
      }
      if (text.includes('mix up') || text.includes('difference') || text.includes('is this right')) {
        return 'You asked for clarification.';
      }
    }
    if (msg.error || msg.isCancelled) return 'Last explanation was interrupted.';
    if (concept.citationCount > 1) return 'You returned to this more than once.';
  }
  return 'Explored earlier in your session.';
}

export function getNextReviewConcept(
  concepts: Concept[],
  messages: Message[]
): (Concept & { reason: string }) | null {
  const needsReview = concepts.filter((c) => c.status === 'needs_review');
  if (!needsReview.length) return null;
  const sorted = [...needsReview].sort((a, b) => {
    const aT = a.lastDiscussedAt ? new Date(a.lastDiscussedAt).getTime() : 0;
    const bT = b.lastDiscussedAt ? new Date(b.lastDiscussedAt).getTime() : 0;
    return bT - aT;
  });
  return { ...sorted[0], reason: getReviewReason(sorted[0], messages) };
}

export function isRefusalMessage(message: Message): boolean {
  return message.role === 'assistant' && message.content.includes('I could not find that in the course materials');
}

export function getStatusLabel(status: Concept['status']): string {
  switch (status) {
    case 'covered': return '✓ Explored';
    case 'needs_review': return '● Review later';
    default: return '○ Not explored';
  }
}

export function getContextualPlaceholder(concept: Concept | null): string {
  if (concept) return `Continue learning about ${concept.name}…`;
  return 'Ask about something from the lectures…';
}

/** Concept clusters for the learning map visual. */
export const MAP_CLUSTERS = [
  {
    id: 'regularization',
    label: 'Regularization',
    week: 3,
    conceptIds: ['overfitting', 'l2_regularization', 'l1_regularization', 'dropout', 'early_stopping', 'bias_variance'],
  },
  {
    id: 'optimization',
    label: 'Optimization',
    week: 2,
    conceptIds: ['gradient_descent', 'learning_rate', 'backpropagation', 'vanishing_gradient', 'relu', 'chain_rule'],
  },
  {
    id: 'linear',
    label: 'Linear Models',
    week: 1,
    conceptIds: ['supervised_vs_unsupervised', 'linear_models', 'loss_functions', 'squared_error', 'sigmoid', 'cross_entropy'],
  },
];

export { INITIAL_CONVERSATION };
