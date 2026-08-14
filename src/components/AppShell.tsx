import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, GraduationCap, ArrowRight } from 'lucide-react';
import type { Lecture } from '../types';
import { LECTURES } from '../services/courseData';

interface AppShellProps {
  currentTab: 'tutor' | 'revision' | 'map';
  onNavigateTab: (tab: 'tutor' | 'revision' | 'map') => void;
  sourcePanel: React.ReactNode | null;
  hasActiveSlide: boolean;
  onCloseSource: () => void;
  onSelectLectureSlide: (lecture: Lecture, slideNum: number) => void;
  onGoHome: () => void;
  contextPanel: React.ReactNode;
  children: React.ReactNode;
}

const NAV = [
  { id: 'tutor' as const, label: 'Tutor' },
  { id: 'map' as const, label: 'Learning Map' },
  { id: 'revision' as const, label: 'Revision' },
];

const COURSE_TITLE = 'Machine Learning for Engineers';

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onNavigateTab,
  sourcePanel,
  hasActiveSlide,
  onCloseSource,
  onSelectLectureSlide,
  onGoHome,
  contextPanel,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [lecturesOpen, setLecturesOpen] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const lecturesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasActiveSlide) setSourceOpen(true);
  }, [hasActiveSlide]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (lecturesRef.current && !lecturesRef.current.contains(e.target as Node)) {
        setLecturesOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pickSlide = (lecture: Lecture, n: number) => {
    onSelectLectureSlide(lecture, n);
    setLecturesOpen(false);
    setMobileOpen(false);
    setSourceOpen(true);
  };

  const tabLabel = NAV.find((n) => n.id === currentTab)?.label ?? 'Tutor';

  return (
    <div className="scholera-app">
      <div className="scholera-bg" aria-hidden />

      <header className="topnav">
        <div className="topnav-inner">
          <button type="button" className="brand" onClick={onGoHome} title="Home — start fresh">
            <GraduationCap size={20} strokeWidth={1.75} />
            <span className="brand-name">Scholera</span>
          </button>

          <div className="topnav-course desktop-only">
            <span className="topnav-course-title">{COURSE_TITLE}</span>
          </div>

          <nav className="topnav-links desktop-only">
            {NAV.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`topnav-link${currentTab === id ? ' is-active' : ''}`}
                onClick={() => onNavigateTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="topnav-right">
            <div className="lectures-dropdown desktop-only" ref={lecturesRef}>
              <button
                type="button"
                className={`topnav-ghost${lecturesOpen ? ' is-open' : ''}`}
                onClick={() => setLecturesOpen(!lecturesOpen)}
              >
                Lectures <ChevronDown size={14} />
              </button>
              {lecturesOpen && (
                <div className="lectures-panel">
                  {LECTURES.map((lec) => (
                    <div key={lec.lecture_id} className="lectures-panel-week">
                      <button
                        type="button"
                        className="lectures-panel-head"
                        onClick={() => setExpandedWeek(expandedWeek === lec.week ? null : lec.week)}
                      >
                        <span>Lecture 0{lec.week}</span>
                        <ChevronDown size={13} className={expandedWeek === lec.week ? 'is-open' : ''} />
                      </button>
                      {expandedWeek === lec.week && (
                        <div className="lectures-panel-slides">
                          <p className="lectures-panel-title">{lec.title}</p>
                          {lec.slides.map((s) => (
                            <button key={s.slide_number} type="button" onClick={() => pickSlide(lec, s.slide_number)}>
                              {s.slide_number}. {s.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hasActiveSlide && (
              <button type="button" className="btn-gradient btn-sm desktop-only" onClick={() => setSourceOpen(true)}>
                View source
              </button>
            )}

            <button type="button" className="mobile-menu-btn mobile-only" onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="main-canvas">
        <div className="canvas-context mobile-only">
          <span className="canvas-context-label">{tabLabel}</span>
          <span className="canvas-context-course">{COURSE_TITLE}</span>
        </div>

        <div className="canvas-row">
          <div className={`canvas-card${currentTab !== 'tutor' ? ' canvas-wide' : ''}`}>
            {children}
          </div>
          <div className="context-panel-slot desktop-only">
            {contextPanel}
          </div>
        </div>
      </main>

      {hasActiveSlide && sourcePanel && sourceOpen && (
        <>
          <div className="overlay-bg" onClick={() => { setSourceOpen(false); onCloseSource(); }} />
          <aside className="source-drawer">{sourcePanel}</aside>
        </>
      )}

      {mobileOpen && (
        <div className="mobile-sheet">
          <div className="overlay-bg" onClick={() => setMobileOpen(false)} />
          <div className="mobile-menu">
            <div className="mobile-menu-head">
              <button type="button" className="brand" onClick={() => { onGoHome(); setMobileOpen(false); }}>
                <span className="brand-name">Scholera</span>
              </button>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <p className="mobile-course-title">{COURSE_TITLE}</p>
            <nav className="mobile-menu-nav">
              {NAV.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={currentTab === id ? 'is-active' : ''}
                  onClick={() => { onNavigateTab(id); setMobileOpen(false); }}
                >
                  {label}
                  {currentTab === id && <ArrowRight size={14} />}
                </button>
              ))}
            </nav>
            <div className="mobile-menu-lectures">
              <p className="mobile-menu-label">Lectures</p>
              {LECTURES.map((lec) => (
                <button key={lec.lecture_id} type="button" onClick={() => pickSlide(lec, 1)}>
                  Lecture 0{lec.week} — {lec.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
