import React, { useState } from 'react';
import { Menu, X, BookOpen, MessageSquare, Compass, Award, PanelRight, ChevronRight } from 'lucide-react';
import type { Lecture } from '../types';
import { LECTURES } from '../services/courseData';

interface AppShellProps {
  currentTab: 'tutor' | 'revision' | 'map';
  onNavigateTab: (tab: 'tutor' | 'revision' | 'map') => void;
  progressPercentage: number;
  exploredCount: number;
  totalConcepts: number;
  rightPanelContent: React.ReactNode;
  hasActiveSlide: boolean;
  onSelectLectureSlide: (lecture: Lecture, slideNum: number) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onNavigateTab,
  progressPercentage,
  exploredCount,
  totalConcepts,
  rightPanelContent,
  hasActiveSlide,
  onSelectLectureSlide,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileContextOpen, setIsMobileContextOpen] = useState(false);
  const [expandedLectures, setExpandedLectures] = useState<{ [key: string]: boolean }>({});

  const handleTabClick = (tab: 'tutor' | 'revision' | 'map') => {
    onNavigateTab(tab);
    setIsMobileMenuOpen(false);
  };

  const toggleLectureExpand = (lectureId: string) => {
    setExpandedLectures((prev) => ({
      ...prev,
      [lectureId]: !prev[lectureId],
    }));
  };

  const activeTabClass = 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-800';
  const inactiveTabClass = 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 border-l-4 border-transparent';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-neutral-800 font-sans border-r border-neutral-200">
      {/* Course Heading */}
      <div className="p-5 border-b border-neutral-100 bg-neutral-50/20">
        <span className="text-xxs font-bold text-emerald-800 tracking-wider uppercase">University Course</span>
        <h1 className="font-serif text-lg font-bold text-neutral-950 mt-1 leading-snug">
          Machine Learning for Engineers
        </h1>
        <div className="flex items-center gap-1.5 mt-1.5 text-xxs text-neutral-500 font-medium">
          <span>CS 4780</span>
          <span>•</span>
          <span>Dr. Elena Márquez</span>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="py-4 border-b border-neutral-100">
        <span className="px-5 text-xxs font-bold text-neutral-400 uppercase tracking-widest block mb-2">
          Navigation
        </span>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => handleTabClick('tutor')}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all focus:outline-none ${
              currentTab === 'tutor' ? activeTabClass : inactiveTabClass
            }`}
          >
            <MessageSquare size={16} />
            <span>Tutor Discussion</span>
          </button>

          <button
            onClick={() => handleTabClick('map')}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all focus:outline-none ${
              currentTab === 'map' ? activeTabClass : inactiveTabClass
            }`}
          >
            <Compass size={16} />
            <span>Learning Map</span>
          </button>

          <button
            onClick={() => handleTabClick('revision')}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all focus:outline-none ${
              currentTab === 'revision' ? activeTabClass : inactiveTabClass
            }`}
          >
            <Award size={16} />
            <span>Revision Planner</span>
          </button>
        </div>
      </nav>

      {/* Progress Section */}
      <div className="p-5 border-b border-neutral-100 bg-neutral-50/20">
        <span className="text-xxs font-bold text-neutral-400 uppercase tracking-widest block mb-2">
          Syllabus Progress
        </span>
        <div className="flex justify-between items-baseline text-xs text-neutral-500 font-semibold mb-1.5">
          <span>Concepts Cover</span>
          <span className="font-mono text-emerald-800">
            {exploredCount}/{totalConcepts} ({progressPercentage}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/50">
          <div
            className="h-full bg-emerald-800 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Syllabus lectures list */}
      <div className="flex-1 overflow-y-auto py-4">
        <span className="px-5 text-xxs font-bold text-neutral-400 uppercase tracking-widest block mb-2">
          Lectures & Slides
        </span>
        <div className="flex flex-col gap-1 px-2">
          {LECTURES.map((lecture) => {
            const isExpanded = !!expandedLectures[lecture.lecture_id];
            return (
              <div key={lecture.lecture_id} className="flex flex-col">
                <button
                  onClick={() => toggleLectureExpand(lecture.lecture_id)}
                  className="w-full flex items-center justify-between p-2 rounded text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen size={13} className="text-neutral-400 shrink-0" />
                    <span className="line-clamp-1">
                      Week 0{lecture.week} — {lecture.title}
                    </span>
                  </div>
                  <ChevronRight
                    size={12}
                    className={`text-neutral-400 shrink-0 transition-transform ${
                      isExpanded ? 'rotate-90 text-neutral-600' : ''
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="pl-6 pr-2 py-1 flex flex-col gap-1 border-l border-neutral-200/60 ml-3.5 mt-0.5 mb-1.5">
                    {lecture.slides.map((slide) => (
                      <button
                        key={slide.slide_number}
                        onClick={() => {
                          onSelectLectureSlide(lecture, slide.slide_number);
                          setIsMobileMenuOpen(false);
                          setIsMobileContextOpen(true); // Auto-open sheet on mobile
                        }}
                        className="w-full text-left py-1 text-xxs text-neutral-500 hover:text-emerald-800 transition-colors truncate focus:outline-none font-medium"
                      >
                        Slide {slide.slide_number} — {slide.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell flex h-screen w-screen overflow-hidden bg-neutral-50/50 text-neutral-800 font-sans">
      {/* 1. LEFT COLUMN: Sidebar (Desktop only) */}
      <aside className="hidden lg:block w-64 shrink-0 h-full select-none">
        {sidebarContent}
      </aside>

      {/* 2. CENTER & MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header (Navbar) */}
        <header className="lg:hidden h-14 shrink-0 bg-white border-b border-neutral-200 px-4 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded hover:bg-neutral-100 text-neutral-600 focus:outline-none"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <span className="font-serif text-sm font-bold text-neutral-900 line-clamp-1">
              CS 4780 Tutor
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Slide viewer trigger */}
            <button
              onClick={() => setIsMobileContextOpen(true)}
              className={`p-1.5 rounded hover:bg-neutral-100 focus:outline-none flex items-center gap-1 text-xs font-semibold ${
                hasActiveSlide ? 'text-emerald-800 bg-emerald-50 border border-emerald-100' : 'text-neutral-500'
              }`}
              aria-label="Open context slides panel"
            >
              <PanelRight size={18} />
              {hasActiveSlide && <span className="text-[10px] pr-0.5">Slide Open</span>}
            </button>
          </div>
        </header>

        {/* Core Content Area */}
        <main className="flex-1 overflow-hidden p-4 lg:p-6 bg-[#FCFAF6]">
          {children}
        </main>
      </div>

      {/* 3. RIGHT COLUMN: Context Panel (Desktop only) */}
      <aside className="hidden lg:block w-80 shrink-0 h-full border-l border-neutral-200 bg-white p-4 overflow-hidden">
        {rightPanelContent}
      </aside>

      {/* MOBILE LEFT MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex select-none">
          {/* Overlay background */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity"
          />
          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-[80vw] h-full bg-white shadow-xl animate-slide-right">
            {sidebarContent}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 focus:outline-none"
              aria-label="Close menu drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE RIGHT SLIDE BOTTOM SHEET / DRAWER */}
      {isMobileContextOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay background */}
          <div
            onClick={() => setIsMobileContextOpen(false)}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity"
          />
          {/* Drawer content sheet */}
          <div className="relative w-full h-[82vh] bg-white rounded-t-2xl shadow-xl flex flex-col overflow-hidden animate-slide-up">
            {/* Drag Handle top bar */}
            <div className="h-6 flex items-center justify-center border-b border-neutral-100/50 bg-neutral-50 shrink-0">
              <div className="w-10 h-1 bg-neutral-300 rounded-full" />
            </div>
            {/* Main content inside the sheet */}
            <div className="flex-1 overflow-hidden">
              {rightPanelContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
