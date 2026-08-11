import React, { useState, useRef, useEffect } from 'react';
import type { Message, Lecture, Citation } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getSlideFromCitation, formatSlideLocation, getLectureByCitationName } from '../services/courseData';
import { listScenarios } from '../services/mockStream';
import { Send, Square, AlertCircle, RefreshCw, Info } from 'lucide-react';

interface TutorViewProps {
  messages: Message[];
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onStopGeneration: () => void;
  onRetryMessage: () => void;
  onSelectSlide: (lecture: Lecture, slideNum: number) => void;
}

export const TutorView: React.FC<TutorViewProps> = ({
  messages,
  isStreaming,
  onSendMessage,
  onStopGeneration,
  onRetryMessage,
  onSelectSlide,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scenarios = listScenarios();

  // Scroll to bottom on new messages or while streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (promptText: string) => {
    onSendMessage(promptText);
  };

  const handleCitationClick = (cit: Citation) => {
    const resolved = getSlideFromCitation(cit.lecture, cit.slide);
    if (resolved) {
      onSelectSlide(resolved.lecture, cit.slide);
    }
  };

  // Determine if a message content represents the "I don't know" refusal
  const isRefusalMessage = (message: Message) => {
    const refusalText = "I could not find that in the course materials";
    return message.role === 'assistant' && message.content.includes(refusalText);
  };

  return (
    <div className="tutor-view flex flex-col h-full overflow-hidden relative">
      {/* 1. Empty State (Onboarding) */}
      {messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto flex flex-col justify-center max-w-2xl mx-auto px-4 py-8 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="font-serif text-3xl font-bold text-neutral-900 leading-tight">
              Where should we start?
            </h2>
            <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
              I am your grounded tutor for CS 4780. Ask me technical questions about linear models, gradient descent, and regularization.
            </p>
          </div>

          {/* Suggestions list */}
          <div className="space-y-3">
            <span className="text-xxs uppercase tracking-wider font-semibold text-neutral-400 block text-center">
              Suggested Questions from Syllabus
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scenarios.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleSuggestionClick(sc.prompt)}
                  className="p-4 bg-white border border-neutral-200 hover:border-emerald-800 rounded-xl text-left text-xs font-semibold text-neutral-700 hover:text-emerald-950 transition-all hover:shadow-xs group focus:outline-none flex flex-col justify-between h-20"
                >
                  <span className="line-clamp-2 leading-relaxed">{sc.prompt}</span>
                  <span className="text-xxs font-mono uppercase text-neutral-400 group-hover:text-emerald-800/70 mt-2 block">
                    Scenario: {sc.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 2. Chat Conversation Thread */
        <div className="flex-1 overflow-y-auto px-1 space-y-8 pb-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLast = index === messages.length - 1;
            const isRefusal = isRefusalMessage(msg);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} ${
                  msg.id === 'streaming-temp' ? 'animate-pulse-subtle' : ''
                }`}
              >
                {/* User Message: compact card bubble */}
                {isUser ? (
                  <div className="max-w-[85%] bg-neutral-900 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm font-medium shadow-xs leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  /* Tutor Message: document style lesson format */
                  <div className="w-full max-w-3xl space-y-4">
                    {/* Header bar indicating tutor identity */}
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                      <span className="font-serif text-sm font-bold text-neutral-900">Tutor Response</span>
                      <span className="text-xxs text-neutral-400">•</span>
                      <span className="text-xxs text-emerald-800 font-semibold uppercase tracking-wider">
                        Grounded in Course Material
                      </span>
                    </div>

                    {/* Grounding Refusal banner for "I don't know" answers */}
                    {isRefusal && (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex items-start gap-2.5 text-xs">
                        <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold block">Not enough evidence in course material</strong>
                          <span className="text-amber-800 leading-relaxed block mt-0.5">
                            The query asks about course administration (exams) which is not in the technical lecture slides. I am programmed to not speculate or hallucinate.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Plain/Math/Table/Code Markdown body */}
                    <div className="tutor-doc-body font-sans text-sm text-neutral-800 leading-relaxed">
                      {msg.content ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        /* Delayed starts placeholder status */
                        <div className="flex items-center gap-2.5 py-2 text-neutral-500 text-xs italic">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-800"></span>
                          </span>
                          <span>Tutor is reviewing lecture materials...</span>
                        </div>
                      )}
                    </div>

                    {/* Interrupted error banner */}
                    {msg.error && (
                      <div className="p-4 bg-red-50 border border-red-200/60 text-red-900 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs my-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-semibold block">That explanation was interrupted</strong>
                            <span className="text-red-800/80 mt-0.5 block">{msg.error}</span>
                          </div>
                        </div>
                        {isLast && (
                          <button
                            onClick={onRetryMessage}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 border border-red-200 hover:border-red-300 font-semibold rounded-lg transition-colors focus:outline-none"
                          >
                            <RefreshCw size={12} />
                            <span>Try again</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Cancellation State banner */}
                    {msg.isCancelled && (
                      <div className="text-xxs text-neutral-400 italic font-mono pt-1">
                        * Generation stopped by student.
                      </div>
                    )}

                    {/* Citations at bottom */}
                    {!msg.error && msg.citations && msg.citations.length > 0 && (
                      <div className="citations-area pt-3 border-t border-neutral-100/60 space-y-2">
                        <span className="text-xxs uppercase tracking-wider font-semibold text-neutral-400 block">
                          Verified References
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cit, cIdx) => {
                            const resolvedLecture = getLectureByCitationName(cit.lecture);
                            const locStr = resolvedLecture
                              ? formatSlideLocation(resolvedLecture, cit.slide)
                              : `Slide ${cit.slide}`;
                            return (
                              <button
                                key={cIdx}
                                onClick={() => handleCitationClick(cit)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 hover:border-emerald-200 transition-colors text-xxs font-semibold text-emerald-800 focus:outline-none"
                              >
                                <span>{locStr}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 3. Chat Input Composer */}
      <div className="mt-auto pt-4 border-t border-neutral-200/80 bg-[#FCFAF6] shrink-0 sticky bottom-0 select-none">
        <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full">
          {/* Active Streaming Controls */}
          {isStreaming && (
            <div className="flex justify-center">
              <button
                onClick={onStopGeneration}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold shadow-sm transition-all focus:outline-none"
              >
                <Square size={10} className="fill-current" />
                <span>Stop generating</span>
              </button>
            </div>
          )}

          {/* Composer Textbox */}
          <div className="flex items-end gap-2 bg-white border border-neutral-300 rounded-2xl p-2 focus-within:ring-1 focus-within:ring-emerald-800 focus-within:border-emerald-800 transition-all shadow-xs">
            <textarea
              id="chat-composer"
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={isStreaming ? "Tutor is drafting an explanation..." : "Ask the tutor about linear models, gradient descent..."}
              className="flex-1 resize-none bg-transparent max-h-44 py-1.5 px-2.5 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isStreaming}
              className={`p-2 rounded-xl transition-all focus:outline-none ${
                inputText.trim() && !isStreaming
                  ? 'bg-emerald-800 hover:bg-emerald-950 text-white cursor-pointer'
                  : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-400 px-2 font-mono">
            <span>PRESS ENTER TO SEND</span>
            <span>GROUNDED CS 4780 TUTOR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
