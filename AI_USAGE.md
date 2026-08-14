# AI Usage Log

This document details the usage of AI coding tools in the development of the University Course Tutor application, listing what was automated, what was corrected, and what was designed manually.


## Tools Used
* **Antigravity (powered by Gemini 3.5 Flash)**: Served as the pair-programming assistant, running code analysis, file creation, compilation checks, and UI browser tests.
- **ChatGPT**: Used to refine ideas and approach during initial design discussions.
- **Cursor**: Used to develop the initial project structure and scaffolding.
- **Claude**: Used to further refine copy and content iterations.

---

## What the AI Automated

1. **Custom Document Parser (`MarkdownRenderer.tsx`)**:
   - Designed a sequential parsing pipeline that splits block code, block math (`$$`), inline math (`$`), inline code (`` ` ``), and headers, outputting pure, unescaped React elements.
   - Handled markdown table parsing, aligning cells automatically based on the divider indicators (`|---|` vs `|:---|`).
2. **Deterministic LCG Stream Generator (`mockStream.ts`)**:
   - Translated the ESM `.mjs` generator logic into a fully typed TypeScript generator, ensuring compatibility with standard Vite compiler settings.
3. **Concept Extraction & Status Engine (`conceptExtractor.ts` & `lessonHelpers.ts`)**:
   - Curated a catalog of 26 machine learning concepts (including overarching topics like **Regularization** and outcomes like **Feature Selection**) mapped to lecture weeks and slides.
   - Implemented prompt triggers (e.g. `confused`, `mix up`, `stuck`) to classify study states into `covered`, `needs_review`, and `unexplored` dynamically.
4. **Learning Map Custom Flowchart (`LearningMap.tsx`)**:
   - Automated the layout of the Regularization cluster, rendering it as a conceptual flowchart (`Regularization` ➔ `Overfitting` ➔ `L1/L2` ➔ `Feature Selection`) with responsive connecting lines and arrows.

---

## Where the AI was Incorrect & How it was Corrected

1. **Missing Viewport Width/Height CSS Utilities**:
   - *Problem*: The AI laid out the main container class `.app-shell` using `h-screen` and `w-screen` in the React JSX code, but forgot to write the definitions for `.h-screen` and `.w-screen` in `src/index.css`.
   - *Consequence*: The shell fell back to `height: auto` and stretched to the entire height of the chat history, causing the header and composer to scroll offscreen and breaking the desktop flex-sidebar layout.
   - *Correction*: When the browser subagent reported that the sidebars were hidden and the header was missing, the screenshot was analyzed. We diagnosed the missing height constraints and added `.h-screen { height: 100vh; }` and `.w-screen { width: 100vw; }` to `src/index.css`.
2. **LightningCSS Syntax Errors for Decimal CSS Selectors**:
   - *Problem*: The AI defined utility classes like `.gap-1.5` and `.mb-1.5` in `src/index.css` directly.
   - *Consequence*: Vite's CSS minifier (`lightningcss`) crashed during production build because unescaped dots in class selectors are parsed as nested class selections (e.g., class `gap-1` with class `5`), which is invalid for selectors starting with numbers.
   - *Correction*: The build log was inspected, and all decimal dots in `index.css` were escaped with backslashes (e.g., changing `.gap-1.5` to `.gap-1\.5` and `.mb-1.5` to `.mb-1\.5`).
3. **TypeScript Strictly Enforced Pure Type Imports**:
   - *Problem*: The AI imported types using standard ES import syntax: `import { Message, Lecture } from './types'`.
   - *Consequence*: The compiler failed because the workspace has strict `verbatimModuleSyntax` enabled, which forbids loading types using standard runtime import markers.
   - *Correction*: Changed all interface imports to type-only imports, e.g., `import type { Message, Lecture } from './types'`.
4. **Incorrect Operator Precedence in Table Concatenation**:
   - *Problem*: The AI wrote `tableContent += '\n\n' + paragraphs.slice(tableStart + 2).find(...) ?? '';` in `lessonHelpers.ts`.
   - *Consequence*: The `+` operator has higher precedence than `??`, causing the compiler to flag the right operand of `??` as unreachable because a string concatenation is never nullish.
   - *Correction*: Wrapped the find lookup in parentheses: `tableContent += '\n\n' + (paragraphs.slice(tableStart + 2).find(...) ?? '');`.
5. **Layout Scroll Jumps for Interactive Badges**:
   - *Problem*: The AI initially implemented navigation clicks for the Explored and Review later badges using `document.getElementById(...).scrollIntoView()`.
   - *Consequence*: In our custom desktop shell, the page-level scrolling is handled by a custom overflow container (`.revision-page`), causing standard `scrollIntoView` calls to either scroll the outer window (breaking the layout) or do nothing at all when tab switching.
   - *Correction*: Updated the click handlers to use explicit coordinate math targeting the scroll container: `container.scrollTo({ top: target.offsetTop - 20, behavior: 'smooth' })`.

---

## What was Designed Manually

* **The Academic Color System**: Selected deep ivy green (`#104030`) and soft off-white (`#FCFAF6`) to steer the visuals away from typical AI marketing dashboards and towards a focused, calm study print-out theme.
* **The Sandbox Toggle**: Hand-crafted a quick toggle at the bottom of the right panel so evaluators can switch between the populated student thread (`conversation.json`) and a fresh onboarding state (`conversation-empty.json`) without restarting the server.
