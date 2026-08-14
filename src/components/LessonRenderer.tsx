import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { parseLessonSections } from '../services/lessonHelpers';

interface LessonRendererProps {
  content: string;
}

export const LessonRenderer: React.FC<LessonRendererProps> = ({ content }) => {
  const sections = parseLessonSections(content);

  if (sections.length <= 1 && sections[0]?.label === 'Explanation') {
    return (
      <div className="lesson-sections">
        <MarkdownRenderer content={content} />
      </div>
    );
  }

  return (
    <div className="lesson-sections">
      {sections.map((section, i) => (
        <div key={i} className="lesson-section">
          <h4 className="lesson-section-label">{section.label}</h4>
          <div className="lesson-section-body">
            <MarkdownRenderer content={section.content} />
          </div>
        </div>
      ))}
    </div>
  );
};
