# University Course Tutor (CS 4780)

A polished, production-quality React web application designed for students of **CS 4780: Machine Learning for Engineers**. 

Unlike standard conversational clones, this interface is built around a grounded learning layer that turns chat discussions into visual maps, maps citation footnotes to slide pages, and coordinates revision.

---

## Product Decisions

### Why a Learning-Oriented Tutor Instead of a Chatbot?
Generic LLM surfaces (like ChatGPT) are built for *answering*, not *teaching*. For students:
1. **Lack of Grounding**: A chatbot can hallucinate mathematical formulas or introduce parameters not covered in their syllabus, leading to exam confusion.
2. **Invisible Journey**: Students ask disconnected questions without understanding how concepts (e.g., Sigmoid saturation and Vanishing Gradients) link together.
3. **No Retrospective**: Standard chats disappear into lists. Students have no visual record of what they have covered, what they struggled with, or what they still need to study.

This product acts as an **interactive study workspace**. The chat window is simply the input mechanism. The real output is the student's conceptual mastery, visualized in real-time.

---

## Key UX Decisions

### 1. Learning Map
The syllabus concepts are extracted from the chat and arranged in a clean, column-based map (categorized by lecture weeks). Nodes are color-coded in real-time:
* **Covered (Green)**: Concept discussed in chat and verified in references.
* **Needs Review (Amber)**: Discussion highlighted student confusion (detected via question text keyword heuristics) or dropped streams.
* **Not Explored (Gray)**: In the syllabus but untouched.
Clicking a node slides open its references and offers a single-click action to scroll directly to the discussion segment in the chat.

### 2. Verified Citations & Slide Viewer
Citations are elevated to first-class UI items (e.g., `Lecture 02 · Slide 09`). Clicking a citation opens a custom slide viewer displaying:
* Slide title & bullets.
* Latex equations.
* Diagrams (rendered as descriptive text alt boxes).
* Speaker notes (revealing professor contexts not in the slide bullets).
Students can navigate adjacent slides (`Prev Slide` / `Next Slide`) within the viewer to inspect context.

### 3. Revision View
An actionable page answering: *"What should I revise next?"* It displays:
* An explored concept progress bar.
* A prioritized list of concepts marked as **Needs Review** (with a `Review` button that autofills the chat composer and triggers a clarifying discussion).
* A list of **Not Explored** concepts (with an `Explore` button that opens their source slides).

### 4. Resilient Streaming & Failure UX
Streaming handles:
* **Delayed Starts**: Displays a calm state ("Reviewing lecture materials...") instead of a blank screen or a spinner.
* **Cancellations**: Supports stopping stream generation, saving the partial text, and marking it as halted.
* **Mid-Stream Interruptions**: If a stream crashes, the partial text is saved, and a styled recovery banner with a `Try again` action appears.
* **Uncertainty**: Refusals (like requesting grade details) display a grounding note explaining *why* the tutor is refusing (lack of syllabus context), reinforcing grounded trust.

### 5. Responsive Mobile Shell
The application scales cleanly down to mobile viewports:
* Sidebar navigations collapse into a drawer (hamburger menu).
* The context panel (slide viewer) collapses into an accessible, slide-up bottom sheet.
* Math blocks and code blocks remain horizontally scrollable without breaking the page layout.

---

## Architecture & Technical Structure

The project is structured with strict separation between styling, data resolution, and UI layout:

```
src/
├── types.ts                   # TypeScript interfaces (Slide, Lecture, Message, Concept)
├── App.tsx                    # Main state machine, stream coordinator, and route switcher
├── index.css                  # Vanilla CSS variables, custom typography, and layout rules
├── services/
│   ├── courseData.ts          # Syllabus slide loader and citation matcher
│   ├── conceptExtractor.ts    # Heuristics mapping chat history to study states
│   └── mockStream.ts          # TypeScript ESM streaming generator (LCG text divider)
└── components/
    ├── AppShell.tsx           # Multi-column responsive grid and mobile drawers
    ├── TutorView.tsx          # Chat thread list, delayed loader, and composer
    ├── MarkdownRenderer.tsx   # Custom markdown, HTML table, and KaTeX math renderer
    ├── SourceViewer.tsx       # Slide visualizer with prev/next navigation
    ├── LearningMap.tsx        # Concept grid cards and details drawer
    └── RevisionView.tsx       # Progress statistics and revision actions
```

---

## Data Integration

The application reads directly from the provided static files:
* `data/conversation.json`: Loaded on start to represent the initial student thread.
* `data/conversation-empty.json`: Used when resetting or starting as a new student.
* `data/responses.json`: Mock streaming scenarios (plain, code, math, tables, long, refusal, error, slow).
* `data/lectures/lecture-*.json`: The technical lecture contents, slides, notes, and formulas.

*Note: You can switch between the "Demo Thread" and "Fresh Student" states at any time using the Sandbox Toggle at the bottom of the right panel.*

---

## Setup & Running Locally

Ensure you have **Node.js** (v18+) installed.

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173/](http://localhost:5173/) in your browser.
3. **Build the production bundle**:
   ```bash
   npm run build
   ```

---

## Deliberately Excluded Features

1. **Active LLM Integration (OpenAI/Gemini)**: No external API keys were integrated. The mock stream acts as our canned backend contract to ensure identical and deterministic testing.
2. **Student Authentication**: Unnecessary for single-user offline assignments; state is kept in local React memories.
3. **Persisted Databases**: No database is required. Resetting the conversation simply switches the active React state tree back to the JSON seed templates.
4. **General-Purpose Web Search/Plugins**: Disabled to keep the tutor grounded strictly in the three course lectures.

---

## Known Heuristic Limitations

* **State Heuristics**: The `needs_review` state relies on keyword matching in the student's prompts. While highly effective for queries like *"I keep mixing up L1 and L2"*, complex sentences lacking trigger words might default to `covered` unless cited multiple times.
* **Slide Coordinates**: Slides are resolved by matching the citation's week and number prefix to the lecture filenames. If filename formats change, the regex matcher in `courseData.ts` will need updating.
