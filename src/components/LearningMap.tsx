import React, { useState, useMemo } from 'react';
import type { Concept, Message, Lecture } from '../types';
import { BookOpen, HelpCircle, CheckCircle, AlertTriangle, ArrowRight, ArrowUpRight } from 'lucide-react';
import { getLectures, getLectureByIdOrWeek, getSlideFromCitation } from '../services/courseData';

interface LearningMapProps {
  concepts: Concept[];
  messages: Message[];
  onSelectSlide: (lecture: Lecture, slideNum: number) => void;
  onJumpToMessage: (msgId: string) => void;
  onNavigateToTab: (tab: 'tutor' | 'revision' | 'map') => void;
}

export const LearningMap: React.FC<LearningMapProps> = ({
  concepts,
  messages,
  onSelectSlide,
  onJumpToMessage,
  onNavigateToTab,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Group concepts by week
  const groupedConcepts = useMemo(() => {
    const weeks: { [key: number]: Concept[] } = { 1: [], 2: [], 3: [] };
    concepts.forEach((c) => {
      if (weeks[c.lectureWeek]) {
        weeks[c.lectureWeek].push(c);
      }
    });
    return weeks;
  }, [concepts]);

  // Find currently selected concept
  const selectedConcept = useMemo(() => {
    return concepts.find((c) => c.id === selectedId) || null;
  }, [concepts, selectedId]);

  // Find the message in history that discusses this concept
  const associatedMessage = useMemo(() => {
    if (!selectedConcept || selectedConcept.status === 'unexplored') return null;

    // Look for the first assistant message that cites one of the slides of the selected concept
    return messages.find((msg) => {
      if (msg.role !== 'assistant' || !msg.citations) return false;
      return msg.citations.some((cit) => {
        const weekMatch = cit.lecture.match(/Week (\d+)/i);
        const weekNum = weekMatch ? parseInt(weekMatch[1], 10) : 0;
        return selectedConcept.slides.some(
          (s) => s.week === weekNum && s.slide === cit.slide
        );
      });
    }) || null;
  }, [selectedConcept, messages]);

  const lectures = getLectures();

  const handleConceptClick = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
  };

  const getStatusIcon = (status: Concept['status']) => {
    switch (status) {
      case 'covered':
        return <CheckCircle size={14} className="text-green-600 fill-green-50" />;
      case 'needs_review':
        return <AlertTriangle size={14} className="text-amber-600 fill-amber-50" />;
      case 'unexplored':
      default:
        return <HelpCircle size={14} className="text-neutral-400" />;
    }
  };

  const getStatusClass = (status: Concept['status'], isSelected: boolean) => {
    const base = "p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ";
    if (isSelected) {
      return base + "border-emerald-800 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-800";
    }
    switch (status) {
      case 'covered':
        return base + "border-green-200 bg-green-50/20 hover:bg-green-50/40 text-neutral-800 hover:border-green-300";
      case 'needs_review':
        return base + "border-amber-200 bg-amber-50/20 hover:bg-amber-50/40 text-neutral-800 hover:border-amber-300";
      case 'unexplored':
      default:
        return base + "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:border-neutral-300";
    }
  };

  const getStatusLabel = (status: Concept['status']) => {
    switch (status) {
      case 'covered':
        return 'Covered';
      case 'needs_review':
        return 'Needs Review';
      case 'unexplored':
      default:
        return 'Not Explored';
    }
  };

  return (
    <div className="learning-map flex flex-col lg:flex-row gap-6 h-full text-neutral-800 p-1">
      {/* Concept Map Main Panel */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
        <div className="map-intro mb-1">
          <h2 className="font-serif text-2xl font-bold text-neutral-900">Learning Map</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Visual syllabus of CS 4780. Click a concept to review slides, check study states, or jump to conversation contexts.
          </p>
        </div>

        {/* 3 Columns for weeks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((weekNum) => {
            const lecture = getLectureByIdOrWeek(weekNum);
            const weekConcepts = groupedConcepts[weekNum] || [];

            return (
              <div key={weekNum} className="flex flex-col gap-4 bg-neutral-50/40 p-4 rounded-xl border border-neutral-200/50">
                {/* Column Header */}
                <div className="border-b border-neutral-200/70 pb-3">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Week {weekNum} Lecture
                  </span>
                  <h3 className="font-serif text-base font-bold text-neutral-900 leading-tight mt-1 line-clamp-1">
                    {lecture?.title || `Lecture 0${weekNum}`}
                  </h3>
                </div>

                {/* Concepts list */}
                <div className="flex flex-col gap-2.5">
                  {weekConcepts.map((concept) => {
                    const isSelected = selectedId === concept.id;
                    return (
                      <button
                        key={concept.id}
                        onClick={() => handleConceptClick(concept.id)}
                        className={getStatusClass(concept.status, isSelected)}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 shrink-0">{getStatusIcon(concept.status)}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold block leading-tight text-neutral-900 line-clamp-2">
                              {concept.name}
                            </span>
                            <span className="text-xxs text-neutral-400 block mt-1 font-mono uppercase">
                              Slide {concept.slides[0]?.slide || ''}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Concept Info Panel */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm lg:max-h-full">
        {selectedConcept ? (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Concept Header */}
            <div className="p-5 border-b border-neutral-100 bg-neutral-50/30">
              <div className="flex items-center gap-1.5 mb-2">
                {getStatusIcon(selectedConcept.status)}
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  selectedConcept.status === 'covered' ? 'text-green-700' :
                  selectedConcept.status === 'needs_review' ? 'text-amber-700' : 'text-neutral-500'
                }`}>
                  {getStatusLabel(selectedConcept.status)}
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-neutral-900 leading-snug">
                {selectedConcept.name}
              </h3>
            </div>

            {/* Concept Content */}
            <div className="p-5 flex-1 space-y-5 text-sm">
              <div className="space-y-1">
                <span className="text-xxs uppercase tracking-wider font-semibold text-neutral-400">Description</span>
                <p className="text-neutral-600 leading-relaxed">{selectedConcept.description}</p>
              </div>

              {/* Slide references */}
              <div className="space-y-2">
                <span className="text-xxs uppercase tracking-wider font-semibold text-neutral-400 block">Course References</span>
                <div className="flex flex-col gap-1.5">
                  {selectedConcept.slides.map((sMap, idx) => {
                    const resolved = getSlideFromCitation(`Week ${sMap.week} — ${lectures.find(l => l.week === sMap.week)?.title}`, sMap.slide);
                    return (
                      <button
                        key={idx}
                        onClick={() => resolved && onSelectSlide(resolved.lecture, sMap.slide)}
                        className="flex items-center justify-between text-left p-2.5 rounded bg-neutral-50 border border-neutral-200/60 hover:bg-neutral-100 hover:border-neutral-300 transition-all text-xs font-medium text-neutral-700 group focus:outline-none"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen size={13} className="text-emerald-800 shrink-0" />
                          <span className="line-clamp-1">Lecture 0{sMap.week} · Slide {sMap.slide}</span>
                        </div>
                        <ArrowUpRight size={12} className="text-neutral-400 group-hover:text-neutral-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Related concepts */}
              {selectedConcept.relatedIds.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xxs uppercase tracking-wider font-semibold text-neutral-400 block">Related Topics</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedConcept.relatedIds.map((relId) => {
                      const relConcept = concepts.find((c) => c.id === relId);
                      if (!relConcept) return null;
                      return (
                        <button
                          key={relId}
                          onClick={() => setSelectedId(relId)}
                          className="text-xs px-2.5 py-1.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-colors text-neutral-700 font-medium"
                        >
                          {relConcept.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 space-y-2">
              {associatedMessage ? (
                <button
                  onClick={() => {
                    onJumpToMessage(associatedMessage.id);
                    onNavigateToTab('tutor');
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-800 hover:bg-emerald-950 text-white rounded-lg text-xs font-semibold shadow-sm transition-all focus:outline-none"
                >
                  <span>Jump to Chat Explanation</span>
                  <ArrowRight size={14} />
                </button>
              ) : selectedConcept.status === 'unexplored' ? (
                <button
                  onClick={() => {
                    onNavigateToTab('tutor');
                    // We can pre-fill chat input with exploring query
                    const inputElement = document.getElementById('chat-composer') as HTMLTextAreaElement;
                    if (inputElement) {
                      inputElement.value = `Explain ${selectedConcept.name.toLowerCase()} and how it works in the lecture.`;
                      inputElement.focus();
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all focus:outline-none"
                >
                  <span>Explore in Chat</span>
                  <ArrowRight size={14} />
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400">
            <HelpCircle size={36} className="text-neutral-300 mb-2" />
            <span className="text-xs font-semibold uppercase tracking-wider block mb-1">Concept Details</span>
            <p className="text-xs leading-relaxed max-w-[200px]">
              Select any concept pill in the map to see its definitions, slides, and study logs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
