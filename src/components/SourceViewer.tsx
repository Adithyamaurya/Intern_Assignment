import React, { useState } from 'react';
import type { Slide, Lecture } from '../types';
import { X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { formatSlideLocation } from '../services/courseData';
import katex from 'katex';

interface SourceViewerProps {
  lecture: Lecture;
  slideNumber: number;
  onClose: () => void;
  onNavigateSlide: (slideNumber: number) => void;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  lecture,
  slideNumber,
  onClose,
  onNavigateSlide,
}) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const idx = lecture.slides.findIndex((s) => s.slide_number === slideNumber);
  const slide: Slide | undefined = lecture.slides[idx];
  const hasPrev = idx > 0;
  const hasNext = idx < lecture.slides.length - 1;

  if (!slide) {
    return (
      <div className="source-panel">
        <p>Slide not found.</p>
        <button type="button" className="btn-text" onClick={onClose}>Close</button>
      </div>
    );
  }

  const renderFormula = (f: string, i: number) => {
    try {
      const html = katex.renderToString(f, { displayMode: true, throwOnError: false });
      return <div key={i} className="slide-formula" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <pre key={i} className="slide-formula-fallback"><code>{f}</code></pre>;
    }
  };

  return (
    <div className="source-panel">
      <header className="source-header">
        <div>
          <p className="source-lecture">Lecture 0{lecture.week}</p>
          <p className="source-location">{formatSlideLocation(lecture, slideNumber)}</p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      <div className="source-body">
        <h2 className="source-title">{slide.title}</h2>

        {slide.bullets?.length > 0 && (
          <ul className="source-bullets">
            {slide.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}

        {slide.formulas?.map(renderFormula)}

        {slide.figure && (
          <blockquote className="source-figure">{slide.figure.description}</blockquote>
        )}

        {slide.notes && (
          <div className="source-notes">
            <button type="button" className="source-notes-toggle" onClick={() => setNotesOpen(!notesOpen)}>
              <ChevronDown size={14} className={notesOpen ? 'is-open' : ''} />
              Professor's notes
            </button>
            {notesOpen && <p className="source-notes-text">{slide.notes}</p>}
          </div>
        )}
      </div>

      <footer className="source-footer">
        <button type="button" className="source-nav" disabled={!hasPrev} onClick={() => hasPrev && onNavigateSlide(lecture.slides[idx - 1].slide_number)}>
          <ChevronLeft size={16} /> Prev
        </button>
        <span className="source-page">{slide.slide_number} / {lecture.slides.length}</span>
        <button type="button" className="source-nav" disabled={!hasNext} onClick={() => hasNext && onNavigateSlide(lecture.slides[idx + 1].slide_number)}>
          Next <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
};
