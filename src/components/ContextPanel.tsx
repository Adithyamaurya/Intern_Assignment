import React from 'react';
import type { Concept, Citation } from '../types';
import { getStatusLabel, formatRichCitation } from '../services/lessonHelpers';
import { ChevronRight } from 'lucide-react';

interface ContextPanelProps {
  currentConcept: Concept | null;
  relatedConcepts: Concept[];
  citations: Citation[];
  rememberLine: string | null;
  contextPath: string[];
  onConceptClick: (concept: Concept) => void;
  onCitationClick: (cit: Citation) => void;
  onNavigateRevision: () => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  currentConcept,
  relatedConcepts,
  citations,
  rememberLine,
  contextPath,
  onConceptClick,
  onCitationClick,
  onNavigateRevision,
}) => {
  if (!currentConcept && citations.length === 0) {
    return (
      <aside className="context-panel">
        <div className="context-empty">
          <p className="context-empty-title">Your learning context</p>
          <p className="context-empty-text">
            Ask a question or explore the map — this panel shows where you are in the course.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="context-panel">
      {contextPath.length > 1 && (
        <div className="context-block">
          <p className="context-label">You are here</p>
          <p className="context-path">
            {contextPath.map((seg, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={11} className="path-arrow" />}
                <span className={i === contextPath.length - 1 ? 'path-current' : ''}>{seg}</span>
              </React.Fragment>
            ))}
          </p>
        </div>
      )}

      {currentConcept && (
        <div className="context-block">
          <p className="context-label">Current concept</p>
          <p className="context-concept-name">{currentConcept.name}</p>
          <p className="context-concept-desc">{currentConcept.description}</p>
          <p className={`context-status status-${currentConcept.status}`}>
            {getStatusLabel(currentConcept.status)}
          </p>
        </div>
      )}

      {relatedConcepts.length > 0 && (
        <div className="context-block">
          <p className="context-label">Related concepts</p>
          <div className="context-chain">
            {relatedConcepts.map((c, i) => (
              <React.Fragment key={c.id}>
                {i > 0 && <span className="chain-arrow">→</span>}
                <button type="button" className="chain-link" onClick={() => onConceptClick(c)}>
                  {c.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {citations.length > 0 && (
        <div className="context-block">
          <p className="context-label">Source</p>
          {citations.map((cit, i) => {
            const rich = formatRichCitation(cit);
            return (
              <button key={i} type="button" className="context-source" onClick={() => onCitationClick(cit)}>
                <span className="context-source-loc">{rich.location}</span>
                {rich.slideTitle && <span className="context-source-title">{rich.slideTitle}</span>}
              </button>
            );
          })}
        </div>
      )}

      {rememberLine && (
        <div className="context-block context-remember">
          <p className="context-label">What to remember</p>
          <p className="remember-text">{rememberLine}</p>
        </div>
      )}

      {currentConcept?.status === 'needs_review' && (
        <div className="context-block">
          <p className="context-label">Revision</p>
          <button type="button" className="context-revision-link" onClick={onNavigateRevision}>
            Review {currentConcept.name} →
          </button>
        </div>
      )}
    </aside>
  );
};
