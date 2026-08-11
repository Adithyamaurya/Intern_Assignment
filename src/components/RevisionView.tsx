import React from 'react';
import type { Concept, Lecture } from '../types';
import { getCourseProgress } from '../services/conceptExtractor';
import { getLectures, getSlideFromCitation } from '../services/courseData';
import { BookOpen, AlertTriangle, Play, HelpCircle, CheckCircle } from 'lucide-react';

interface RevisionViewProps {
  concepts: Concept[];
  onSelectSlide: (lecture: Lecture, slideNum: number) => void;
  onNavigateToTab: (tab: 'tutor' | 'revision' | 'map') => void;
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  concepts,
  onSelectSlide,
  onNavigateToTab,
}) => {
  const stats = getCourseProgress(concepts);
  const lectures = getLectures();

  // Filter concepts
  const needsReviewConcepts = concepts.filter((c) => c.status === 'needs_review');
  const unexploredConcepts = concepts.filter((c) => c.status === 'unexplored');

  // Trigger review action: autofill composer, focus it, navigate to tutor
  const handleReviewClick = (conceptName: string) => {
    onNavigateToTab('tutor');
    setTimeout(() => {
      const composer = document.getElementById('chat-composer') as HTMLTextAreaElement;
      if (composer) {
        composer.value = `I need to review ${conceptName}. Can you explain it and clarify what the most common mistakes are?`;
        composer.focus();
        // Trigger auto-growth of textarea if applicable
        composer.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  };

  // Trigger explore slide action
  const handleExploreClick = (concept: Concept) => {
    const slideRef = concept.slides[0];
    if (!slideRef) return;
    const lectureTitle = `Week ${slideRef.week} — ${lectures.find((l) => l.week === slideRef.week)?.title}`;
    const resolved = getSlideFromCitation(lectureTitle, slideRef.slide);
    if (resolved) {
      onSelectSlide(resolved.lecture, slideRef.slide);
    }
  };

  return (
    <div className="revision-view space-y-8 overflow-y-auto h-full text-neutral-800 pr-1 pb-6">
      {/* Page Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Study Revision Planner</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Ground your preparation in lecture facts. Focus on what needs review and explore what you haven't touched.
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Progress Bar Column */}
        <div className="md:col-span-2 bg-white border border-neutral-200 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-xxs uppercase tracking-wider font-semibold text-neutral-400">Course Coverage</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-serif font-bold text-emerald-800">{stats.explored}</span>
              <span className="text-neutral-400 text-sm">/ {stats.total} concepts explored</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/50">
              <div
                className="h-full bg-emerald-800 rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xxs text-neutral-400 mt-2 font-mono">
              <span>{stats.percentage}% COMPLETE</span>
              <span>{stats.total - stats.explored} REMAINING</span>
            </div>
          </div>
        </div>

        {/* Stats 1 */}
        <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xxs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">Needs Review</span>
            <span className="text-3xl font-serif font-bold text-amber-600 block">{stats.needsReview}</span>
          </div>
          <p className="text-xxs text-neutral-500 leading-relaxed mt-2">
            Discussed in chat but flagged with confusion or errors.
          </p>
        </div>

        {/* Stats 2 */}
        <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xxs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">Not Explored</span>
            <span className="text-3xl font-serif font-bold text-neutral-400 block">{stats.unexplored}</span>
          </div>
          <p className="text-xxs text-neutral-500 leading-relaxed mt-2">
            In syllabus lectures but not yet referenced in your discussion.
          </p>
        </div>
      </div>

      {/* Main Revision Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Needs Review */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200/60">
            <AlertTriangle className="text-amber-600" size={18} />
            <h3 className="font-serif text-lg font-bold text-neutral-900">Needs Review ({needsReviewConcepts.length})</h3>
          </div>

          {needsReviewConcepts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {needsReviewConcepts.map((concept) => (
                <div
                  key={concept.id}
                  className="bg-white border border-neutral-200 hover:border-neutral-300 p-4 rounded-xl shadow-sm flex items-start gap-4 transition-all"
                >
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wider scale-90 origin-left">
                        Review Needed
                      </span>
                      <span className="text-xxs font-mono text-neutral-400">
                        Lecture 0{concept.slides[0]?.week} · Slide {concept.slides[0]?.slide}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{concept.name}</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{concept.description}</p>
                  </div>
                  <button
                    onClick={() => handleReviewClick(concept.name)}
                    className="shrink-0 flex items-center justify-center p-2 rounded-lg border border-neutral-200 hover:border-emerald-800 bg-white hover:bg-emerald-50 text-neutral-500 hover:text-emerald-800 transition-all focus:outline-none"
                    title={`Review ${concept.name} in chat`}
                  >
                    <Play size={14} className="fill-current" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-neutral-200 rounded-xl text-center text-neutral-400 bg-neutral-50/10">
              <CheckCircle className="text-green-500/80 mx-auto mb-2" size={28} />
              <p className="text-xs font-medium">Clear study logs!</p>
              <p className="text-xxs text-neutral-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                You have no concepts marked as needing review right now.
              </p>
            </div>
          )}
        </div>

        {/* Right: Unexplored */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200/60">
            <HelpCircle className="text-neutral-400" size={18} />
            <h3 className="font-serif text-lg font-bold text-neutral-900">Not Explored ({unexploredConcepts.length})</h3>
          </div>

          {unexploredConcepts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {unexploredConcepts.map((concept) => (
                <div
                  key={concept.id}
                  className="bg-white border border-neutral-200 hover:border-neutral-300 p-4 rounded-xl shadow-sm flex items-start gap-4 transition-all"
                >
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200 uppercase tracking-wider scale-90 origin-left">
                        Unexplored
                      </span>
                      <span className="text-xxs font-mono text-neutral-400">
                        Lecture 0{concept.slides[0]?.week} · Slide {concept.slides[0]?.slide}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{concept.name}</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{concept.description}</p>
                  </div>
                  <button
                    onClick={() => handleExploreClick(concept)}
                    className="shrink-0 flex items-center justify-center p-2 rounded-lg border border-neutral-200 hover:border-neutral-800 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-emerald-800 transition-all focus:outline-none"
                    title={`Open slide reference for ${concept.name}`}
                  >
                    <BookOpen size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-neutral-200 rounded-xl text-center text-neutral-400 bg-neutral-50/10">
              <CheckCircle className="text-emerald-800/80 mx-auto mb-2" size={28} />
              <p className="text-xs font-medium">All material explored!</p>
              <p className="text-xxs text-neutral-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                You have touched on every single syllabus topic in your chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
