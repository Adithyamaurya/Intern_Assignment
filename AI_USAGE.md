# AI Usage Log

This document details the usage of AI coding tools in the development of the University Course Tutor application, listing what was automated, what was corrected, and what was designed manually.


## Tools Used
* **Antigravity (powered by Gemini 3.5 Flash)**: Served as the pair-programming assistant, running code analysis, file creation, compilation checks, and UI browser tests.
- **ChatGPT**: Used to refine ideas and approach during initial design discussions.
- **Cursor**: Used to develop the initial project structure and scaffolding.
- **Claude**: Used to further refine copy and content iterations.

---

## What the AI Automated
Simple summary of what the AI helped automate:

- Basic markdown rendering and KaTeX support (`MarkdownRenderer.tsx`).
- A mock streaming generator for development and testing (`mockStream.ts`).
- Helpers to extract and tag concepts from chat history (`conceptExtractor.ts`, `lessonHelpers.ts`).
- Learning map layout and flowchart rendering (`LearningMap.tsx`).

---

#### Where the AI Was Incorrect & How It Was Corrected

1. **Missing Screen Size Styles**:
   - *Problem*: The AI used `h-screen` and `w-screen` but didn't define them in the CSS.
   - *Consequence*: The layout height broke and parts of the UI disappeared.
   - *Correction*: Added the missing `100vh` and `100vw` styles.

2. **CSS Build Error**:
   - *Problem*: The AI created CSS classes with decimal names like `.gap-1.5`.
   - *Consequence*: The production build failed because of the `.` in the class name.
   - *Correction*: Escaped the dots, changing them to `.gap-1\.5`.

3. **TypeScript Import Error**:
   - *Problem*: The AI imported TypeScript types like normal imports.
   - *Consequence*: The compiler rejected them.
   - *Correction*: Changed them to `import type`.

4. **Table Parsing Bug**:
   - *Problem*: The AI used `??` incorrectly with `+` when building a table.
   - *Consequence*: The compiler reported an operator-precedence error.
   - *Correction*: Added parentheses around the `find()` result.

5. **Scrolling Bug**:
   - *Problem*: The AI used `scrollIntoView()` for the Revision buttons.
   - *Consequence*: It sometimes scrolled the wrong container.
   - *Correction*: Changed it to scroll the correct container directly.
---
