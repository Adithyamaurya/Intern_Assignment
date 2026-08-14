import { useState, useMemo, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { TutorView } from './components/TutorView';
import { LearningMap } from './components/LearningMap';
import { RevisionView } from './components/RevisionView';
import { SourceViewer } from './components/SourceViewer';
import { ContextPanel } from './components/ContextPanel';
import type { Message, Lecture, Concept } from './types';
import { INITIAL_CONVERSATION, EMPTY_CONVERSATION, getSlideFromCitation } from './services/courseData';
import { streamResponse, getScenario } from './services/mockStream';
import { extractConcepts } from './services/conceptExtractor';
import {
  getCurrentConceptFromMessages,
  getContextPath,
  getConceptChain,
  extractRememberLine,
} from './services/lessonHelpers';
import 'katex/dist/katex.min.css';

function App() {
  const [currentTab, setCurrentTab] = useState<'tutor' | 'revision' | 'map'>('tutor');
  const [useEmptyState, setUseEmptyState] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [activeSlide, setActiveSlide] = useState<{ lecture: Lecture; slideNumber: number } | null>(null);

  useEffect(() => {
    setMessages(useEmptyState ? [...EMPTY_CONVERSATION.messages] : [...INITIAL_CONVERSATION.messages]);
    setActiveSlide(null);
  }, [useEmptyState]);

  const concepts = useMemo(() => extractConcepts(messages), [messages]);
  const exploredCount = concepts.filter((c) => c.status !== 'unexplored').length;
  const progressPercentage = concepts.length > 0 ? Math.round((exploredCount / concepts.length) * 100) : 0;

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i];
    }
    return null;
  }, [messages]);

  const currentConcept = useMemo(
    () => getCurrentConceptFromMessages(messages, concepts),
    [messages, concepts]
  );

  const contextPath = useMemo(() => {
    if (!lastAssistant) return [];
    const userQ = messages[messages.indexOf(lastAssistant) - 1]?.content;
    return getContextPath(lastAssistant.citations ?? [], concepts, userQ).segments;
  }, [lastAssistant, messages, concepts]);

  const relatedConcepts = useMemo(() => {
    if (!currentConcept) return [];
    return getConceptChain(currentConcept, concepts).filter((c) => c.id !== currentConcept.id);
  }, [currentConcept, concepts]);

  const rememberLine = useMemo(() => {
    if (!lastAssistant?.content) return null;
    return extractRememberLine(lastAssistant.content, concepts);
  }, [lastAssistant, concepts]);

  const handleGoHome = () => {
    setUseEmptyState(true);
    setCurrentTab('tutor');
    setActiveSlide(null);
  };

  const handleLoadDemo = () => {
    setUseEmptyState(false);
    setCurrentTab('tutor');
  };

  const handleConceptClick = (concept: Concept) => {
    setCurrentTab('tutor');
    setTimeout(() => {
      const c = document.getElementById('chat-composer') as HTMLTextAreaElement;
      if (c) {
        c.value = `Explain ${concept.name} and how it connects to the rest of the course.`;
        c.focus();
        c.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  };

  const handleJumpToMessage = (msgId: string) => {
    setCurrentTab('tutor');
    setTimeout(() => {
      document.getElementById(`msg-${msgId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleSelectSlide = (lecture: Lecture, slideNum: number) => {
    setActiveSlide({ lecture, slideNumber: slideNum });
  };

  const matchScenario = (query: string): string => {
    const c = query.toLowerCase().trim();
    if (c.includes('supervised') || c.includes('unsupervised')) return 'plain';
    if (c.includes('gradient descent') || c.includes('implement') || c.includes('code')) return 'code';
    if (c.includes('sigmoid') || c.includes('0.25') || c.includes('derivative')) return 'math';
    if (c.includes('regularization') || c.includes('lasso') || c.includes('ridge') || c.includes('l1') || c.includes('l2')) return 'table';
    if (c.includes('backpropagation') || c.includes('backprop') || c.includes('explain everything')) return 'long';
    if (c.includes('exam') || c.includes('final')) return 'refusal';
    if (c.includes('midterm') || c.includes('solution')) return 'error-midstream';
    if (c.includes('summarise') || c.includes('summary') || c.includes('whole course')) return 'slow';
    return 'plain';
  };

  const handleSendMessage = async (text: string) => {
    if (isStreaming) return;
    const userMsg: Message = { id: 'user-' + Date.now(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    const aid = 'assistant-' + Date.now();
    setMessages((p) => [...p, { id: aid, role: 'assistant', content: '', created_at: new Date().toISOString(), citations: [] }]);
    setIsStreaming(true);
    const scenarioId = matchScenario(text);
    const controller = new AbortController();
    setAbortController(controller);
    let accumulated = '';
    try {
      for await (const chunk of streamResponse(scenarioId, { signal: controller.signal })) {
        accumulated += chunk;
        setMessages((p) => p.map((m) => m.id === aid ? { ...m, content: accumulated } : m));
      }
      if (controller.signal.aborted) {
        setMessages((p) => p.map((m) => m.id === aid ? { ...m, isCancelled: true, content: m.content || accumulated } : m));
        return;
      }
      const scenario = getScenario(scenarioId);
      setMessages((p) => p.map((m) => m.id === aid ? { ...m, content: scenario.text, citations: scenario.citations } : m));
    } catch {
      setMessages((p) => p.map((m) => m.id === aid ? { ...m, content: accumulated, error: 'The explanation was interrupted.' } : m));
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  const sourcePanel = activeSlide ? (
    <SourceViewer
      lecture={activeSlide.lecture}
      slideNumber={activeSlide.slideNumber}
      onClose={() => setActiveSlide(null)}
      onNavigateSlide={(n) => setActiveSlide((s) => s ? { ...s, slideNumber: n } : null)}
    />
  ) : null;

  const contextPanel = (
    <ContextPanel
      currentConcept={currentConcept}
      relatedConcepts={relatedConcepts}
      citations={lastAssistant?.citations ?? []}
      rememberLine={rememberLine}
      contextPath={contextPath}
      onConceptClick={handleConceptClick}
      onCitationClick={(cit) => {
        const r = getSlideFromCitation(cit.lecture, cit.slide);
        if (r) handleSelectSlide(r.lecture, cit.slide);
      }}
      onNavigateRevision={() => setCurrentTab('revision')}
    />
  );

  return (
    <AppShell
      currentTab={currentTab}
      onNavigateTab={setCurrentTab}
      sourcePanel={sourcePanel}
      hasActiveSlide={!!activeSlide}
      onCloseSource={() => setActiveSlide(null)}
      onSelectLectureSlide={handleSelectSlide}
      onGoHome={handleGoHome}
      contextPanel={contextPanel}
    >
      {currentTab === 'tutor' && (
        <TutorView
          messages={messages}
          concepts={concepts}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          onStopGeneration={() => abortController?.abort()}
          onRetryMessage={() => {
            const users = messages.filter((m) => m.role === 'user');
            if (!users.length) return;
            const q = users[users.length - 1].content;
            setMessages((p) => { const c = [...p]; c.pop(); c.pop(); return c; });
            handleSendMessage(q);
          }}
          onSelectSlide={handleSelectSlide}
          onConceptClick={handleConceptClick}
          onLoadDemo={handleLoadDemo}
        />
      )}
      {currentTab === 'map' && (
        <LearningMap
          concepts={concepts}
          messages={messages}
          onSelectSlide={handleSelectSlide}
          onJumpToMessage={handleJumpToMessage}
          onNavigateToTab={setCurrentTab}
          onConceptClick={handleConceptClick}
        />
      )}
      {currentTab === 'revision' && (
        <RevisionView
          concepts={concepts}
          messages={messages}
          onSelectSlide={handleSelectSlide}
          onNavigateToTab={setCurrentTab}
        />
      )}
    </AppShell>
  );
}

export default App;
