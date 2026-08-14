import React from 'react';
import type { Concept, Lecture, Message } from '../types';
import { getLectures, getSlideFromCitation } from '../services/courseData';
import { getNextReviewConcept, getReviewReason } from '../services/lessonHelpers';
import { ArrowRight } from 'lucide-react';

interface RevisionViewProps {
  concepts: Concept[];
  messages: Message[];
  onSelectSlide: (lecture: Lecture, slideNum: number) => void;
  onNavigateToTab: (tab: 'tutor' | 'revision' | 'map') => void;
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  concepts,
  messages,
  onSelectSlide,
  onNavigateToTab,
}) => {
  const lectures = getLectures();
  const next = getNextReviewConcept(concepts, messages);
  const needsReview = concepts.filter((c) => c.status === 'needs_review');
  const unexplored = concepts.filter((c) => c.status === 'unexplored');
  const covered = concepts.filter((c) => c.status === 'covered');

  const review = (name: string) => {
    onNavigateToTab('tutor');
    setTimeout(() => {
      const c = document.getElementById('chat-composer') as HTMLTextAreaElement;
      if (c) {
        c.value = `I need to review ${name}. Can you explain it and clarify what the most common mistakes are?`;
        c.focus();
        c.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  };

  const explore = (concept: Concept) => {
    const ref = concept.slides[0];
    if (!ref) return;
    const title = lectures.find((l) => l.week === ref.week)?.title;
    const r = getSlideFromCitation(`Week ${ref.week} — ${title}`, ref.slide);
    if (r) onSelectSlide(r.lecture, ref.slide);
  };

  return (
    <div className="revision-page">
      <header className="page-header">
        <h2>Revision</h2>
        <p>Focus on what needs your attention.</p>
      </header>

      {next && (
        <div className="next-review-card">
          <p className="next-review-label">Recommended next</p>
          <h3>{next.name}</h3>
          <p className="next-review-reason">{next.reason}</p>
          <button type="button" className="btn-primary btn-sm" onClick={() => review(next.name)}>
            Review now <ArrowRight size={14} />
          </button>
        </div>
      )}

      {needsReview.length > 0 && (
        <section className="revision-section">
          <h3 className="section-label">Needs review</h3>
          <div className="revision-list">
            {needsReview.map((c) => (
              <div key={c.id} className="revision-row">
                <div>
                  <span className="revision-name">{c.name}</span>
                  <span className="revision-sub">{getReviewReason(c, messages)}</span>
                </div>
                <button type="button" className="btn-text" onClick={() => review(c.name)}>Review</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {unexplored.length > 0 && (
        <section className="revision-section">
          <h3 className="section-label">Not yet explored</h3>
          <div className="revision-list">
            {unexplored.slice(0, 6).map((c) => (
              <div key={c.id} className="revision-row">
                <div>
                  <span className="revision-name">{c.name}</span>
                  <span className="revision-sub">Lecture 0{c.slides[0]?.week} · Slide {c.slides[0]?.slide}</span>
                </div>
                <button type="button" className="btn-text" onClick={() => explore(c)}>Explore</button>
              </div>
            ))}
          </div>
          {unexplored.length > 6 && (
            <p className="revision-more">+{unexplored.length - 6} more</p>
          )}
        </section>
      )}

      {covered.length > 0 && (
        <section className="revision-section">
          <h3 className="section-label">Comfortable with</h3>
          <div className="comfort-tags">
            {covered.map((c) => (
              <span key={c.id} className="comfort-tag">{c.name}</span>
            ))}
          </div>
        </section>
      )}

      <section className="revision-section revision-by-lecture">
        <h3 className="section-label">By lecture</h3>
        {[1, 2, 3].map((week) => {
          const items = concepts.filter((c) => c.lectureWeek === week);
          const lec = lectures.find((l) => l.week === week);
          return (
            <div key={week} className="lecture-group">
              <p className="lecture-group-title">Lecture 0{week} — {lec?.title}</p>
              <div className="lecture-concepts">
                {items.map((c) => (
                  <span key={c.id} className={`lecture-concept status-${c.status}`}>
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
