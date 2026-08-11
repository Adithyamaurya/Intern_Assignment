import React, { useState } from 'react';
import katex from 'katex';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Parse code blocks first
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="tutor-markdown">
      {blocks.map((block, index) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          // Extract language and code content
          const match = block.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2].trim() : block.slice(3, -3).trim();
          return <CodeBlock key={index} language={lang} code={code} />;
        } else {
          // Parse block math ($$ ... $$)
          const mathBlocks = block.split(/(\$\$[\s\S]*?\$\$)/g);
          return (
            <React.Fragment key={index}>
              {mathBlocks.map((mathBlock, mIdx) => {
                if (mathBlock.startsWith('$$') && mathBlock.endsWith('$$')) {
                  const math = mathBlock.slice(2, -2).trim();
                  return <MathBlock key={mIdx} math={math} />;
                } else {
                  return <TextBlock key={mIdx} text={mathBlock} />;
                }
              })}
            </React.Fragment>
          );
        }
      })}
    </div>
  );
};

/* --- CODE BLOCK COMPONENT WITH COPY BUTTON --- */
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="code-block-container my-4 rounded-md border border-neutral-200 bg-neutral-900 text-neutral-100 overflow-hidden font-mono text-sm">
      <div className="code-block-header flex items-center justify-between px-4 py-2 bg-neutral-800 text-neutral-400 text-xs border-b border-neutral-700">
        <span>{language.toUpperCase() || 'CODE'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-neutral-200 transition-colors focus:outline-none"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="code-block-scroll overflow-x-auto p-4">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

/* --- MATH BLOCK COMPONENT --- */
const MathBlock: React.FC<{ math: string }> = ({ math }) => {
  try {
    const html = katex.renderToString(math, {
      displayMode: true,
      throwOnError: false,
    });
    return (
      <div
        className="math-block overflow-x-auto my-4 py-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (e) {
    return (
      <pre className="math-block-error text-red-500 my-2">
        <code>{math}</code>
      </pre>
    );
  }
};

/* --- TEXT BLOCK PARSER --- */
const TextBlock: React.FC<{ text: string }> = ({ text }) => {
  // If the text block is empty, do nothing
  if (!text.trim()) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: { text: string; num?: number }[] = [];
  let isNumberedList = false;
  let tableLines: string[] = [];

  const flushList = (keyIdx: number) => {
    if (listItems.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol key={`ol-${keyIdx}`} className="list-decimal pl-6 my-2 space-y-1">
            {listItems.map((item, i) => (
              <li key={i}>{parseInline(item.text)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${keyIdx}`} className="list-disc pl-6 my-2 space-y-1">
            {listItems.map((item, i) => (
              <li key={i}>{parseInline(item.text)}</li>
            ))}
          </ul>
        );
      }
      listItems = [];
    }
  };

  const flushTable = (keyIdx: number) => {
    if (tableLines.length > 0) {
      elements.push(<Table key={`table-${keyIdx}`} lines={tableLines} />);
      tableLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if it is a table line
    if (trimmed.startsWith('|')) {
      flushList(i);
      tableLines.push(line);
      continue;
    } else {
      flushTable(i);
    }

    // Check if it is a heading
    if (trimmed.startsWith('### ')) {
      flushList(i);
      elements.push(
        <h4 key={i} className="text-base font-semibold mt-4 mb-2">
          {parseInline(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList(i);
      elements.push(
        <h3 key={i} className="text-lg font-bold mt-6 mb-3">
          {parseInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList(i);
      elements.push(
        <h2 key={i} className="text-xl font-extrabold mt-8 mb-4">
          {parseInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Check if it is a bullet list item
    const bulletMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
    if (bulletMatch) {
      if (isNumberedList) {
        flushList(i);
      }
      isNumberedList = false;
      listItems.push({ text: bulletMatch[3] });
      continue;
    }

    // Check if it is a numbered list item
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (!isNumberedList) {
        flushList(i);
      }
      isNumberedList = true;
      listItems.push({ text: numMatch[3], num: parseInt(numMatch[2], 10) });
      continue;
    }

    // Normal paragraph
    if (trimmed === '') {
      flushList(i);
      // Represent spacing, but don't output empty p tags
      continue;
    }

    // If we reach here, it's a regular text line
    flushList(i);
    elements.push(
      <p key={i} className="my-3 leading-relaxed">
        {parseInline(line)}
      </p>
    );
  }

  // Flush remaining buffers
  flushList(lines.length);
  flushTable(lines.length);

  return <>{elements}</>;
};

/* --- INLINE PARSING (MATH, CODE, BOLD, ITALIC) --- */
function parseInline(text: string): React.ReactNode {
  // Split by inline math: $ ... $
  const mathParts = text.split(/(\$[^\$]+\$)/g);
  return (
    <>
      {mathParts.map((part, idx) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          try {
            const html = katex.renderToString(math, {
              throwOnError: false,
              displayMode: false,
            });
            return (
              <span
                key={idx}
                className="inline-math px-0.5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return (
              <code key={idx} className="inline-math-error bg-red-50 text-red-600 px-1 rounded text-xs">
                {math}
              </code>
            );
          }
        }

        // Split by inline code: `...`
        const codeParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={idx}>
            {codeParts.map((subPart, subIdx) => {
              if (subPart.startsWith('`') && subPart.endsWith('`')) {
                return (
                  <code
                    key={subIdx}
                    className="inline-code bg-neutral-100 text-neutral-800 font-mono text-xs px-1.5 py-0.5 rounded border border-neutral-200"
                  >
                    {subPart.slice(1, -1)}
                  </code>
                );
              }

              // Split by bold: **...**
              const boldParts = subPart.split(/(\*\*[^*]+\*\*)/g);
              return (
                <span key={subIdx}>
                  {boldParts.map((bPart, bIdx) => {
                    if (bPart.startsWith('**') && bPart.endsWith('**')) {
                      return <strong key={bIdx} className="font-semibold text-neutral-900">{bPart.slice(2, -2)}</strong>;
                    }

                    // Split by italic: *...*
                    const italicParts = bPart.split(/(\*[^*]+\*)/g);
                    return (
                      <span key={bIdx}>
                        {italicParts.map((iPart, iIdx) => {
                          if (iPart.startsWith('*') && iPart.endsWith('*')) {
                            return <em key={iIdx} className="italic">{iPart.slice(1, -1)}</em>;
                          }
                          return iPart;
                        })}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </span>
        );
      })}
    </>
  );
}

/* --- TABLE COMPONENT --- */
const Table: React.FC<{ lines: string[] }> = ({ lines }) => {
  // Parse rows
  const parsedRows = lines.map((line) => {
    const cells = line.split('|');
    // Remove the first and last empty elements if they exist (since markdown rows start and end with |)
    if (cells[0] === '') cells.shift();
    if (cells[cells.length - 1] === '') cells.pop();
    return cells.map((cell) => cell.trim());
  });

  const headerCells = parsedRows[0];
  const alignRow = parsedRows[1] || [];
  const bodyRows = parsedRows.slice(2);

  // Parse alignments: :--- center/left etc
  const alignments = alignRow.map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    return 'left';
  });

  return (
    <div className="table-container my-6 w-full overflow-x-auto border border-neutral-200 rounded-md">
      <table className="w-full text-sm text-left border-collapse text-neutral-800">
        <thead className="bg-neutral-50 text-xs font-semibold text-neutral-600 uppercase border-b border-neutral-200">
          <tr>
            {headerCells.map((cell, colIdx) => (
              <th
                key={colIdx}
                className="px-4 py-3 font-medium"
                style={{ textAlign: alignments[colIdx] as any }}
              >
                {parseInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {bodyRows.map((row, rowIdx) => {
            // Ignore horizontal divider lines
            if (row.every((cell) => cell.match(/^[-:]+$/))) return null;

            return (
              <tr key={rowIdx} className="hover:bg-neutral-50/55 transition-colors">
                {row.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-4 py-3 leading-relaxed"
                    style={{ textAlign: alignments[colIdx] as any }}
                  >
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
