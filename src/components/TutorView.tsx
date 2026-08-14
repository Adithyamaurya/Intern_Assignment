import React, { useState, useRef, useEffect } from 'react';
import type { Message, Lecture, Citation, Concept } from '../types';
import { LessonRenderer } from './LessonRenderer';
import { getSlideFromCitation, LECTURES, INITIAL_CONVERSATION } from '../services/courseData';
import {
  getConceptsFromCitations,
  getContextPath,
  extractRememberLine,
  getRelatedConcepts,
  formatCitationLabel,
  isRefusalMessage,
  getCurrentConceptFromMessages,
  getContextualPlaceholder,
  getStatusLabel,
} from '../services/lessonHelpers';
import { Send, Square, RefreshCw, ArrowRight, ChevronRight } from 'lucide-react';

interface TutorViewProps {
  messages: Message[];
  concepts: Concept[];
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onStopGeneration: () => void;
  onRetryMessage: () => void;
  onSelectSlide: (lecture: Lecture, slideNum: number) => void;
  onConceptClick: (concept: Concept) => void;
  onLoadDemo: () => void;
}

export const TutorView: React.FC<TutorViewProps> = ({
  messages,
  concepts,
  isStreaming,
  onSendMessage,
  onStopGeneration,
  onRetryMessage,
  onSelectSlide,
  onConceptClick,
  onLoadDemo,
}) => {
  const [inputText, setInputText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConcept = getCurrentConceptFromMessages(messages, concepts);
  const placeholder = getContextualPlaceholder(currentConcept);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  const send = () => {
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const turns: { question: Message; answer?: Message }[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      turns.push({
        question: messages[i],
        answer: messages[i + 1]?.role === 'assistant' ? messages[i + 1] : undefined,
      });
      if (messages[i + 1]?.role === 'assistant') i++;
    }
  }

  return (
    <div className="tutor">
      {messages.length === 0 ? (
        <div className="hero">
          <h1 className="hero-title">
            Your entire course.<br />
            <em className="hero-accent">One coherent tutor.</em>
          </h1>
          <p className="hero-sub">
            Ask questions grounded in your lecture materials — linear models, gradient descent,
            regularization, and more. Every answer cites the exact slide it came from.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn-gradient"
              onClick={() => onSendMessage('Give me an overview of the key ideas from Linear Models and Loss Functions.')}
            >
              Start learning <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => onSendMessage('Explain gradient descent — what is it and why do we use it?')}
            >
              Ask a question
            </button>
          </div>
          <p className="hero-foot">
            Built for <strong>students</strong> preparing with lecture-grounded explanations.
          </p>
          <button type="button" className="hero-demo-link" onClick={onLoadDemo}>
            Load demo conversation ({INITIAL_CONVERSATION.messages.length} messages)
          </button>
          <div className="hero-lectures">
            {LECTURES.map((lec) => (
              <button
                key={lec.lecture_id}
                type="button"
                className="hero-lecture-link"
                onClick={() => onSendMessage(`Give me an overview of the key ideas from ${lec.title}.`)}
              >
                Lecture 0{lec.week} · {lec.title}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="tutor-thread">
          {turns.map((turn, idx) => {
            const isLast = idx === turns.length - 1;
            return (
              <article key={turn.question.id} className="turn">
                <div className="turn-q" id={`msg-${turn.question.id}`}>
                  {turn.question.content}
                </div>
                {turn.answer && (
                  <LessonBlock
                    message={turn.answer}
                    question={turn.question.content}
                    concepts={concepts}
                    isLast={isLast}
                    isStreaming={isStreaming && isLast}
                    onRetry={onRetryMessage}
                    onConceptClick={onConceptClick}
                    onCitationClick={(cit) => {
                      const r = getSlideFromCitation(cit.lecture, cit.slide);
                      if (r) onSelectSlide(r.lecture, cit.slide);
                    }}
                  />
                )}
              </article>
            );
          })}
          <div ref={endRef} />
        </div>
      )}

      <div className="composer-bar">
        {isStreaming && (
          <button type="button" className="composer-stop" onClick={onStopGeneration}>
            <Square size={9} className="fill-current" /> Stop generating
          </button>
        )}
        <div className="composer-input">
          <textarea
            id="chat-composer"
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            disabled={isStreaming}
            placeholder={isStreaming ? 'Preparing your explanation…' : placeholder}
          />
          <button
            type="button"
            className={`composer-send${inputText.trim() && !isStreaming ? ' ready' : ''}`}
            onClick={send}
            disabled={!inputText.trim() || isStreaming}
            aria-label="Send"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

function LessonBlock({
  message: msg,
  question,
  concepts,
  isLast,
  isStreaming,
  onRetry,
  onConceptClick,
  onCitationClick,
}: {
  message: Message;
  question: string;
  concepts: Concept[];
  isLast: boolean;
  isStreaming: boolean;
  onRetry: () => void;
  onConceptClick: (c: Concept) => void;
  onCitationClick: (c: Citation) => void;
}) {
  const citations = msg.citations || [];
  const matched = getConceptsFromCitations(citations, concepts);
  const path = getContextPath(citations, concepts, question);
  const related = getRelatedConcepts(matched, concepts);
  const remember = msg.content ? extractRememberLine(msg.content, concepts) : null;
  const preparing = !msg.content && isStreaming;
  const primary = path.primaryConcept ?? matched[0] ?? null;

  if (isRefusalMessage(msg)) {
    return (
      <div className="turn-a refusal" id={`msg-${msg.id}`}>
        <p>I couldn't find enough in the course lectures to answer this confidently.</p>
        <ul>{LECTURES.map((l) => <li key={l.lecture_id}>Lecture 0{l.week} — {l.title}</li>)}</ul>
      </div>
    );
  }

  return (
    <div className="turn-a" id={`msg-${msg.id}`}>
      {path.segments.length > 1 && (
        <nav className="context-path-line" aria-label="Learning context">
          {path.segments.map((seg, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={12} className="path-sep" />}
              <span className={i === path.segments.length - 1 ? 'path-active' : ''}>{seg}</span>
            </React.Fragment>
          ))}
        </nav>
      )}

      {primary && (
        <div className="turn-concept-header">
          <h3 className="turn-title">{primary.name}</h3>
          <span className={`turn-status status-${primary.status}`}>{getStatusLabel(primary.status)}</span>
        </div>
      )}

      {preparing && <div className="preparing"><span className="dot-pulse" /> Preparing explanation…</div>}

      {msg.content && (
        <div className="turn-body">
          <LessonRenderer content={msg.content} />
        </div>
      )}

      {remember && !msg.error && (
        <div className="remember-block">
          <span className="remember-label">Remember</span>
          <p>{remember}</p>
        </div>
      )}

      {msg.error && (
        <div className="turn-error">
          <p>Explanation interrupted — partial answer kept above.</p>
          {isLast && <button type="button" className="btn-text" onClick={onRetry}><RefreshCw size={13} /> Try again</button>}
        </div>
      )}

      {msg.isCancelled && <p className="turn-cancelled">Stopped. Partial response kept above.</p>}

      {related.length > 0 && !msg.error && (
        <div className="turn-footer">
          <span className="turn-footer-label">Related concepts</span>
          <div className="related-chain">
            {related.map((c, i) => (
              <React.Fragment key={c.id}>
                {i > 0 && <span className="chain-arrow">→</span>}
                <button type="button" className="related-link" onClick={() => onConceptClick(c)}>
                  {c.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {!msg.error && citations.length > 0 && (
        <div className="turn-footer">
          <span className="turn-footer-label">Source</span>
          <div className="source-row">
            {citations.map((cit, i) => (
              <button key={i} type="button" className="source-chip" onClick={() => onCitationClick(cit)}>
                {formatCitationLabel(cit)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
