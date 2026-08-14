import React, { useState, useMemo } from 'react';
import type { Concept, Message, Lecture } from '../types';
import { getLectureByIdOrWeek, getSlideFromCitation } from '../services/courseData';
import { MAP_CLUSTERS, getStatusLabel } from '../services/lessonHelpers';

interface LearningMapProps {
  concepts: Concept[];
  messages: Message[];
  onSelectSlide: (lecture: Lecture, slideNum: number) => void;
  onJumpToMessage: (msgId: string) => void;
  onNavigateToTab: (tab: 'tutor' | 'revision' | 'map') => void;
  onConceptClick: (concept: Concept) => void;
}

export const LearningMap: React.FC<LearningMapProps> = ({
  concepts,
  onSelectSlide,
  onJumpToMessage,
  onNavigateToTab,
  onConceptClick,
  messages,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = concepts.find((c) => c.id === selectedId) ?? null;

  const associatedMsg = useMemo(() => {
    if (!selected || selected.status === 'unexplored') return null;
    return messages.find((msg) => {
      if (msg.role !== 'assistant' || !msg.citations) return false;
      return msg.citations.some((cit) => {
        const m = cit.lecture.match(/Week (\d+)/i);
        const w = m ? parseInt(m[1], 10) : 0;
        return selected.slides.some((s) => s.week === w && s.slide === cit.slide);
      });
    }) ?? null;
  }, [selected, messages]);

  const prefill = (text: string) => {
    onNavigateToTab('tutor');
    setTimeout(() => {
      const c = document.getElementById('chat-composer') as HTMLTextAreaElement;
      if (c) { c.value = text; c.focus(); c.dispatchEvent(new Event('input', { bubbles: true })); }
    }, 100);
  };

  const viewSource = (c: Concept) => {
    const ref = c.slides[0];
    if (!ref) return;
    const lec = getLectureByIdOrWeek(ref.week);
    if (!lec) return;
    const r = getSlideFromCitation(`Week ${ref.week} — ${lec.title}`, ref.slide);
    if (r) onSelectSlide(r.lecture, ref.slide);
  };

  const selectConcept = (c: Concept) => {
    setSelectedId(c.id === selectedId ? null : c.id);
  };

  return (
    <div className="map-page">
      <header className="page-header">
        <h2>Learning Map</h2>
        <p>How concepts connect across lectures and slides.</p>
      </header>

      <div className="map-visual">
        {MAP_CLUSTERS.map((cluster) => {
          const lec = getLectureByIdOrWeek(cluster.week);
          const clusterConcepts = cluster.conceptIds
            .map((id) => concepts.find((c) => c.id === id))
            .filter(Boolean) as Concept[];

          return (
            <section key={cluster.id} className="map-cluster">
              <div className="map-cluster-head">
                <span className="map-cluster-week">Lecture 0{cluster.week}</span>
                <span className="map-cluster-label">{cluster.label}</span>
                <span className="map-cluster-lecture">{lec?.title}</span>
              </div>

              <div className="map-cluster-flow">
                {clusterConcepts.map((c, i) => {
                  const isSelected = selectedId === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      {i > 0 && <span className="flow-arrow" aria-hidden>→</span>}
                      <button
                        type="button"
                        className={`flow-node status-${c.status}${isSelected ? ' is-selected' : ''}`}
                        onClick={() => selectConcept(c)}
                        title={`${getStatusLabel(c.status)} · Lecture 0${c.slides[0]?.week} Slide ${c.slides[0]?.slide}`}
                      >
                        <span className="flow-node-name">{c.name}</span>
                        <span className="flow-node-slide">
                          L0{c.slides[0]?.week} · S{c.slides[0]?.slide}
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {selected && (
        <div className="map-selected-bar">
          <div className="map-selected-info">
            <span className={`map-selected-status status-${selected.status}`}>
              {getStatusLabel(selected.status)}
            </span>
            <strong>{selected.name}</strong>
            <span className="map-selected-desc">{selected.description}</span>
          </div>
          <div className="map-selected-actions">
            <button type="button" className="btn-primary btn-sm" onClick={() => onConceptClick(selected)}>
              Ask about this
            </button>
            {associatedMsg && (
              <button type="button" className="btn-secondary btn-sm" onClick={() => { onJumpToMessage(associatedMsg.id); onNavigateToTab('tutor'); }}>
                Jump to chat
              </button>
            )}
            <button type="button" className="btn-ghost btn-sm" onClick={() => viewSource(selected)}>
              View slide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
