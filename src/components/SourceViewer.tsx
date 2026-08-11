import React from 'react';
import type { Slide, Lecture } from '../types';
import { X, ChevronLeft, ChevronRight, BookOpen, MessageSquare, Image, HelpCircle } from 'lucide-react';
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
  const currentIdx = lecture.slides.findIndex((s) => s.slide_number === slideNumber);
  const slide: Slide | undefined = lecture.slides[currentIdx];

  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < lecture.slides.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onNavigateSlide(lecture.slides[currentIdx - 1].slide_number);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigateSlide(lecture.slides[currentIdx + 1].slide_number);
    }
  };

  if (!slide) {
    return (
      <div className="p-6 text-center text-neutral-500">
        <HelpCircle className="mx-auto mb-2 text-neutral-400" size={32} />
        <p>Slide not found.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-neutral-100 rounded text-sm font-medium">
          Close
        </button>
      </div>
    );
  }

  // Helper to render LaTeX math safely in the slide
  const renderFormula = (formula: string, idx: number) => {
    try {
      const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
      return (
        <div
          key={idx}
          className="slide-formula my-3 py-1 overflow-x-auto text-neutral-900 border-l-2 border-emerald-700 pl-3 bg-neutral-50/50"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch (e) {
      return (
        <pre key={idx} className="my-2 p-2 bg-red-50 text-red-600 rounded text-xs">
          <code>{formula}</code>
        </pre>
      );
    }
  };

  return (
    <div className="source-viewer flex flex-col h-full bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden text-neutral-800">
      {/* Viewer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/60">
        <div className="flex items-center gap-2">
          <BookOpen className="text-emerald-800" size={18} />
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Lecture {String(lecture.week).padStart(2, '0')}
            </span>
            <h4 className="text-sm font-bold text-neutral-800 leading-tight line-clamp-1">
              {lecture.title}
            </h4>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-neutral-200/80 transition-colors text-neutral-400 hover:text-neutral-600 focus:outline-none"
          aria-label="Close slide source viewer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Slide Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Slide Title Box */}
        <div className="border-b border-neutral-100 pb-4">
          <span className="text-xs font-semibold text-neutral-400 block mb-1">
            Slide {slide.slide_number} of {lecture.slides.length}
          </span>
          <h3 className="font-serif text-xl font-bold text-neutral-900 leading-snug">
            {slide.title}
          </h3>
        </div>

        {/* Slide Bullets */}
        {slide.bullets && slide.bullets.length > 0 && (
          <ul className="space-y-3.5 list-disc pl-5 text-sm leading-relaxed text-neutral-700">
            {slide.bullets.map((bullet, idx) => (
              <li key={idx} className="marker:text-emerald-800">
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {/* Slide Formulas */}
        {slide.formulas && slide.formulas.length > 0 && (
          <div className="space-y-2 mt-4">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Equations
            </span>
            {slide.formulas.map((formula, idx) => renderFormula(formula, idx))}
          </div>
        )}

        {/* Slide Figures */}
        {slide.figure && (
          <div className="mt-4 p-4 bg-neutral-50 rounded border border-neutral-200/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              <Image size={14} className="text-neutral-400" />
              <span>Figure Description</span>
            </div>
            <p className="text-xs italic text-neutral-600 leading-relaxed">
              {slide.figure.description}
            </p>
          </div>
        )}

        {/* Speaker Notes */}
        {slide.notes && (
          <div className="mt-6 p-4 bg-amber-50/50 rounded border border-amber-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wider">
              <MessageSquare size={14} />
              <span>Instructor Notes</span>
            </div>
            <p className="text-xs text-amber-900/85 leading-relaxed font-sans">
              {slide.notes}
            </p>
          </div>
        )}
      </div>

      {/* Slide Navigation Footer */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-100 bg-neutral-50/60 text-xs">
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          className={`flex items-center gap-1 px-3 py-1.5 rounded border border-neutral-200 transition-colors font-medium ${
            hasPrev
              ? 'bg-white hover:bg-neutral-50 text-neutral-700 cursor-pointer'
              : 'bg-neutral-50 text-neutral-300 cursor-not-allowed border-neutral-100'
          }`}
        >
          <ChevronLeft size={14} />
          <span>Prev Slide</span>
        </button>

        <span className="text-neutral-500 font-mono font-medium">
          {formatSlideLocation(lecture, slideNumber)}
        </span>

        <button
          onClick={handleNext}
          disabled={!hasNext}
          className={`flex items-center gap-1 px-3 py-1.5 rounded border border-neutral-200 transition-colors font-medium ${
            hasNext
              ? 'bg-white hover:bg-neutral-50 text-neutral-700 cursor-pointer'
              : 'bg-neutral-50 text-neutral-300 cursor-not-allowed border-neutral-100'
          }`}
        >
          <span>Next Slide</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
