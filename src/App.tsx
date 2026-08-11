import { useState, useMemo, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { TutorView } from './components/TutorView';
import { LearningMap } from './components/LearningMap';
import { RevisionView } from './components/RevisionView';
import { SourceViewer } from './components/SourceViewer';
import type { Message, Lecture, Citation } from './types';
import { INITIAL_CONVERSATION, EMPTY_CONVERSATION, formatSlideLocation, getSlideFromCitation } from './services/courseData';
import { streamResponse, getScenario } from './services/mockStream';
import { extractConcepts } from './services/conceptExtractor';
import { BookOpen, Compass, RotateCcw } from 'lucide-react';
import 'katex/dist/katex.min.css';

function App() {
  const [currentTab, setCurrentTab] = useState<'tutor' | 'revision' | 'map'>('tutor');
  const [useEmptyState, setUseEmptyState] = useState<boolean>(false);

  // Message states
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Active slide viewer states
  const [activeSlide, setActiveSlide] = useState<{ lecture: Lecture; slideNumber: number } | null>(null);

  // Synchronize initial conversation vs empty conversation on load and toggle
  useEffect(() => {
    if (useEmptyState) {
      setMessages([...EMPTY_CONVERSATION.messages]);
    } else {
      setMessages([...INITIAL_CONVERSATION.messages]);
    }
    // Close active slide on reset/switch
    setActiveSlide(null);
  }, [useEmptyState]);

  // Extract concepts dynamically from messages
  const concepts = useMemo(() => {
    return extractConcepts(messages);
  }, [messages]);

  // Calculate course stats
  const totalConcepts = concepts.length;
  const exploredCount = concepts.filter((c) => c.status !== 'unexplored').length;
  const progressPercentage = totalConcepts > 0 ? Math.round((exploredCount / totalConcepts) * 100) : 0;

  // Jump to specific message element in TutorView
  const handleJumpToMessage = (msgId: string) => {
    setCurrentTab('tutor');
    setTimeout(() => {
      // Find the message container element or scroll to it
      const element = document.getElementById(`msg-${msgId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Select slide source viewer
  const handleSelectSlide = (lecture: Lecture, slideNum: number) => {
    setActiveSlide({ lecture, slideNumber: slideNum });
  };

  // Slide navigation callback
  const handleNavigateSlide = (slideNum: number) => {
    if (activeSlide) {
      setActiveSlide({ ...activeSlide, slideNumber: slideNum });
    }
  };

  // Match scenario ID from user question keywords
  const matchScenario = (query: string): string => {
    const clean = query.toLowerCase().trim();

    if (clean.includes('supervised') || clean.includes('unsupervised')) return 'plain';
    if (clean.includes('gradient descent') || clean.includes('implement') || clean.includes('code')) return 'code';
    if (clean.includes('sigmoid') || clean.includes('0.25') || clean.includes('derivative')) return 'math';
    if (clean.includes('regularization') || clean.includes('lasso') || clean.includes('ridge') || clean.includes('l1') || clean.includes('l2')) return 'table';
    if (clean.includes('backpropagation') || clean.includes('backprop') || clean.includes('explain everything')) return 'long';
    if (clean.includes('exam') || clean.includes('final')) return 'refusal';
    if (clean.includes('midterm') || clean.includes('solution')) return 'error-midstream';
    if (clean.includes('summarise') || clean.includes('summary') || clean.includes('whole course')) return 'slow';

    return 'plain'; // Default fallback
  };

  // Streaming core lifecycle
  const handleSendMessage = async (text: string) => {
    if (isStreaming) return;

    // Append user message
    const userMsgId = 'user-' + Date.now();
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Setup assistant streaming message placeholder
    const assistantMsgId = 'assistant-' + Date.now();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '', // Starts empty (triggers "Reviewing lecture materials..." in TutorView if delay is long)
      created_at: new Date().toISOString(),
      citations: [],
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    const scenarioId = matchScenario(text);

    const controller = new AbortController();
    setAbortController(controller);

    let accumulatedText = '';

    try {
      // Yield stream
      for await (const chunk of streamResponse(scenarioId, { signal: controller.signal })) {
        accumulatedText += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
          )
        );
      }

      // Check if aborted
      if (controller.signal.aborted) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, isCancelled: true, content: m.content || accumulatedText }
              : m
          )
        );
        setIsStreaming(false);
        setAbortController(null);
        return;
      }

      // Generation completed successfully. Fetch citations
      const scenario = getScenario(scenarioId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: scenario.text, citations: scenario.citations }
            : m
        )
      );
    } catch (err: any) {
      // Stream failed partway (like error-midstream scenario)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: accumulatedText, error: err.message || 'The connection to the tutor was lost.' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleRetryMessage = () => {
    // Locate the last user query
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) return;
    const lastUserQuery = userMessages[userMessages.length - 1].content;

    // Delete the failed assistant message and its user message
    setMessages((prev) => {
      const copy = [...prev];
      // remove last two (which are user and failed assistant)
      copy.pop();
      copy.pop();
      return copy;
    });

    // Run query again
    handleSendMessage(lastUserQuery);
  };

  // Find all citations currently present in the conversation
  const activeThreadCitations = useMemo(() => {
    const set = new Set<string>();
    const list: Citation[] = [];
    messages.forEach((m) => {
      if (m.citations) {
        m.citations.forEach((cit) => {
          const key = `${cit.lecture}-${cit.slide}`;
          if (!set.has(key)) {
            set.add(key);
            list.push(cit);
          }
        });
      }
    });
    return list;
  }, [messages]);

  // Find concepts explored in the current thread (by matching thread citations)
  const activeThreadConcepts = useMemo(() => {
    return concepts.filter((c) => c.status !== 'unexplored');
  }, [concepts]);

  // Render the right-side context panel content
  const renderRightPanelContent = () => {
    if (activeSlide) {
      return (
        <SourceViewer
          lecture={activeSlide.lecture}
          slideNumber={activeSlide.slideNumber}
          onClose={() => setActiveSlide(null)}
          onNavigateSlide={handleNavigateSlide}
        />
      );
    }

    // Default right panel: current session grounding checklist
    return (
      <div className="flex flex-col h-full overflow-y-auto space-y-6 text-neutral-800 p-1 select-none">
        <div className="border-b border-neutral-100 pb-3">
          <span className="text-xxs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">
            Current Thread
          </span>
          <h3 className="font-serif text-base font-bold text-neutral-900 leading-tight">
            Grounded Groundwork
          </h3>
        </div>

        {/* Explore status */}
        <div className="space-y-3">
          <div className="flex items-center gap-1 text-xxs font-bold text-neutral-400 uppercase tracking-widest">
            <Compass size={12} className="text-emerald-800" />
            <span>Active Concepts</span>
          </div>

          {activeThreadConcepts.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {activeThreadConcepts.slice(0, 5).map((concept) => (
                <div
                  key={concept.id}
                  className="flex items-center justify-between p-2 rounded bg-neutral-50/50 border border-neutral-200/50 text-xs"
                >
                  <span className="font-semibold text-neutral-700 truncate max-w-[150px]">
                    {concept.name}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      concept.status === 'needs_review'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-green-50 text-green-700 border-green-100'
                    }`}
                  >
                    {concept.status === 'needs_review' ? 'Needs Review' : 'Covered'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xxs text-neutral-400 italic leading-relaxed">
              No concepts explored in this session. Explanations will automatically populate mapping cards here.
            </p>
          )}
        </div>

        {/* Cited sources */}
        <div className="space-y-3">
          <div className="flex items-center gap-1 text-xxs font-bold text-neutral-400 uppercase tracking-widest">
            <BookOpen size={12} className="text-emerald-800" />
            <span>Cited Sources</span>
          </div>

          {activeThreadCitations.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {activeThreadCitations.map((cit, idx) => {
                const resolved = getSlideFromCitation(cit.lecture, cit.slide);
                if (!resolved) return null;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectSlide(resolved.lecture, cit.slide)}
                    className="w-full text-left p-2.5 rounded bg-neutral-50 border border-neutral-200/70 hover:bg-neutral-100 hover:border-neutral-300 transition-all text-xxs font-semibold text-neutral-700 flex items-center justify-between focus:outline-none"
                  >
                    <span>{formatSlideLocation(resolved.lecture, cit.slide)}</span>
                    <span className="text-[10px] text-neutral-400 font-normal">View Slide →</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xxs text-neutral-400 italic leading-relaxed">
              Grounding references will register when the tutor responds. Click them to inspect slide notes.
            </p>
          )}
        </div>

        {/* Demo reset toggle at the bottom */}
        <div className="mt-auto pt-4 border-t border-neutral-100 space-y-3">
          <div className="flex items-center gap-1 text-xxs font-bold text-neutral-400 uppercase tracking-widest">
            <RotateCcw size={12} />
            <span>Syllabus Sandbox</span>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-lg flex flex-col gap-2">
            <span className="text-[10px] text-neutral-500 leading-normal block">
              Toggle between the pre-loaded student discussion and a fresh, empty onboarding state for assessment.
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setUseEmptyState(false)}
                className={`flex-1 text-center py-1.5 rounded text-xxs font-bold transition-all border ${
                  !useEmptyState
                    ? 'bg-white border-neutral-300 text-emerald-950 shadow-xs'
                    : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Demo Thread
              </button>
              <button
                onClick={() => setUseEmptyState(true)}
                className={`flex-1 text-center py-1.5 rounded text-xxs font-bold transition-all border ${
                  useEmptyState
                    ? 'bg-white border-neutral-300 text-emerald-950 shadow-xs'
                    : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Fresh Student
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppShell
      currentTab={currentTab}
      onNavigateTab={setCurrentTab}
      progressPercentage={progressPercentage}
      exploredCount={exploredCount}
      totalConcepts={totalConcepts}
      rightPanelContent={renderRightPanelContent()}
      hasActiveSlide={!!activeSlide}
      onSelectLectureSlide={handleSelectSlide}
    >
      {currentTab === 'tutor' && (
        <TutorView
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          onRetryMessage={handleRetryMessage}
          onSelectSlide={handleSelectSlide}
        />
      )}

      {currentTab === 'map' && (
        <LearningMap
          concepts={concepts}
          messages={messages}
          onSelectSlide={handleSelectSlide}
          onJumpToMessage={handleJumpToMessage}
          onNavigateToTab={setCurrentTab}
        />
      )}

      {currentTab === 'revision' && (
        <RevisionView
          concepts={concepts}
          onSelectSlide={handleSelectSlide}
          onNavigateToTab={setCurrentTab}
        />
      )}
    </AppShell>
  );
}

export default App;
