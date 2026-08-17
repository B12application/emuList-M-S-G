// src/frontend/components/notes/MarkdownRenderer.tsx
import React, { useState } from 'react';
import {
  FaCheckSquare,
  FaSquare,
  FaCopy,
  FaCheck,
  FaInfoCircle,
  FaLightbulb,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaQuoteLeft,
  FaExternalLinkAlt
} from 'react-icons/fa';

interface MarkdownRendererProps {
  content: string;
  attachments?: Array<{ id: string; url: string; name?: string }>;
  onToggleTask?: (lineIndex: number) => void;
  onImageClick?: (src: string, alt: string) => void;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  attachments,
  onToggleTask,
  onImageClick,
  className = '',
}: MarkdownRendererProps) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const resolveSrc = (src: string): string => {
    if (!src) return '';
    if (src.startsWith('attachment:')) {
      const id = src.replace('attachment:', '').trim();
      const found = attachments?.find((a) => a.id === id);
      return found ? found.url : src;
    }
    return src;
  };

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  if (!content || !content.trim()) {
    return (
      <div className="py-12 text-center text-stone-400 dark:text-zinc-500 italic text-sm">
        Bu not henüz boş. Yazmaya başlamak için düzenleme moduna geçin...
      </div>
    );
  }

  // If the content is HTML, render it directly
  if (content.trim().startsWith('<') || content.trim().includes('</p>') || content.trim().includes('</div>') || content.trim().includes('</h2>') || content.trim().includes('</h1>')) {
    let parsedHtml = content;
    attachments?.forEach(att => {
      parsedHtml = parsedHtml.replace(new RegExp(`attachment:${att.id}`, 'g'), att.url);
    });

    return (
      <div 
        className={`prose dark:prose-invert max-w-none ${className} font-sans`}
        dangerouslySetInnerHTML={{ __html: parsedHtml }} 
      />
    );
  }

  // Parse lines and render
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let i = 0;
  let codeBlockIndex = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Blocks (```)
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim() || 'plaintext';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      const codeText = codeLines.join('\n');
      const currentIndex = codeBlockIndex++;

      renderedElements.push(
        <div
          key={`code-${currentIndex}-${i}`}
          className="my-4 rounded-xl overflow-hidden bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-md font-mono text-sm"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/80 border-b border-zinc-800 text-xs text-zinc-400">
            <span className="uppercase font-semibold tracking-wider">{language}</span>
            <button
              onClick={() => handleCopyCode(codeText, currentIndex)}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors text-xs"
              title="Kodu Kopyala"
            >
              {copiedCodeIndex === currentIndex ? (
                <>
                  <FaCheck className="text-emerald-400 text-xs" />
                  <span className="text-emerald-400 font-medium">Kopyalandı</span>
                </>
              ) : (
                <>
                  <FaCopy className="text-xs" />
                  <span>Kopyala</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed custom-scrollbar">
            <code>{codeText}</code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // 2. Obsidian Callouts (> [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT], > [!CAUTION])
    const calloutMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|QUOTE)\]\s*(.*)$/i);
    if (calloutMatch) {
      const type = calloutMatch[1].toUpperCase();
      const title = calloutMatch[2].trim() || type;
      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        calloutLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }

      let config = {
        bg: 'bg-blue-50/70 dark:bg-blue-950/30',
        border: 'border-blue-400 dark:border-blue-500',
        text: 'text-blue-900 dark:text-blue-300',
        icon: FaInfoCircle,
      };

      if (type === 'TIP') {
        config = {
          bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
          border: 'border-emerald-400 dark:border-emerald-500',
          text: 'text-emerald-900 dark:text-emerald-300',
          icon: FaLightbulb,
        };
      } else if (type === 'WARNING') {
        config = {
          bg: 'bg-amber-50/70 dark:bg-amber-950/30',
          border: 'border-amber-400 dark:border-amber-500',
          text: 'text-amber-900 dark:text-amber-300',
          icon: FaExclamationTriangle,
        };
      } else if (type === 'IMPORTANT' || type === 'CAUTION') {
        config = {
          bg: 'bg-rose-50/70 dark:bg-rose-950/30',
          border: 'border-rose-400 dark:border-rose-500',
          text: 'text-rose-900 dark:text-rose-300',
          icon: FaExclamationCircle,
        };
      } else if (type === 'QUOTE') {
        config = {
          bg: 'bg-purple-50/70 dark:bg-purple-950/30',
          border: 'border-purple-400 dark:border-purple-500',
          text: 'text-purple-900 dark:text-purple-300',
          icon: FaQuoteLeft,
        };
      }

      const CalloutIcon = config.icon;

      renderedElements.push(
        <div
          key={`callout-${i}`}
          className={`my-3 p-4 rounded-xl border-l-4 ${config.border} ${config.bg} shadow-sm`}
        >
          <div className={`flex items-center gap-2 font-bold text-sm mb-1.5 ${config.text}`}>
            <CalloutIcon className="text-base shrink-0" />
            <span>{title}</span>
          </div>
          <div className="text-xs sm:text-sm text-stone-700 dark:text-zinc-300 space-y-1 pl-6">
            {calloutLines.map((cLine, cIdx) => (
              <p key={cIdx}>{renderInlineMarkdown(cLine, onImageClick, resolveSrc)}</p>
            ))}
          </div>
        </div>
      );
      continue;
    }

    // 3. Regular Blockquote (> quote)
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [line.replace(/^>\s?/, '')];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('>') && !lines[i].includes('[!')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      renderedElements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 pl-4 py-1 border-l-4 border-amber-400/80 dark:border-amber-500/80 italic text-stone-600 dark:text-zinc-400 bg-stone-50/50 dark:bg-zinc-900/30 rounded-r-lg"
        >
          {quoteLines.map((qLine, qIdx) => (
            <p key={qIdx} className="my-0.5 text-sm">
              {renderInlineMarkdown(qLine, onImageClick, resolveSrc)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 4. Tables (| col 1 | col 2 |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        
        const isDivider = (str: string) => str.includes('---');
        const dataRows = tableLines.slice(1).filter((l) => !isDivider(l));

        renderedElements.push(
          <div key={`table-${i}`} className="my-6 overflow-x-auto rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 shadow-md bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md font-sans">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-stone-50/80 dark:bg-zinc-900/80 border-b border-stone-200/80 dark:border-zinc-850">
                  {headerCells.map((h, hIdx) => (
                    <th key={hIdx} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                      {renderInlineMarkdown(h, onImageClick, resolveSrc)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-zinc-850">
                {dataRows.map((row, rIdx) => {
                  const cells = row
                    .split('|')
                    .slice(1, -1)
                    .map((c) => c.trim());
                  return (
                    <tr
                      key={rIdx}
                      className="hover:bg-amber-500/5 dark:hover:bg-amber-400/5 transition-colors"
                    >
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="px-5 py-3 text-stone-700 dark:text-zinc-300 font-medium">
                          {renderInlineMarkdown(cell, onImageClick, resolveSrc)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 5. Interactive Checkboxes / Tasks (- [ ] or - [x])
    const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      const indent = taskMatch[1].length;
      const isChecked = taskMatch[2].toLowerCase() === 'x';
      const text = taskMatch[3];
      const lineIdx = i;

      renderedElements.push(
        <div
          key={`task-${i}`}
          className="flex items-start gap-3 my-2 group cursor-pointer font-sans"
          style={{ paddingLeft: `${Math.min(indent * 12, 48)}px` }}
          onClick={() => onToggleTask && onToggleTask(lineIdx)}
        >
          <div
            className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
              isChecked
                ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/20 scale-100'
                : 'border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-transparent group-hover:border-amber-400 group-hover:bg-amber-500/5'
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 stroke-current stroke-[3] fill-none transition-transform duration-200 ${
                isChecked ? 'scale-100 rotate-0' : 'scale-0 -rotate-12'
              }`}
              viewBox="0 0 24 24"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span
            className={`text-sm sm:text-base leading-relaxed transition-all ${
              isChecked
                ? 'line-through text-stone-400 dark:text-zinc-500'
                : 'text-stone-800 dark:text-zinc-200'
            }`}
          >
            {renderInlineMarkdown(text, onImageClick, resolveSrc)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // 6. Headers (# H1, ## H2, ### H3, #### H4, ##### H5, ###### H6)
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];

      const headerClasses = [
        'text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mt-6 mb-3 pb-2 border-b border-stone-200 dark:border-zinc-800',
        'text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-zinc-100 mt-5 mb-2.5 pb-1 border-b border-stone-100 dark:border-zinc-800/60',
        'text-lg sm:text-xl font-bold text-stone-800 dark:text-zinc-100 mt-4 mb-2',
        'text-base sm:text-lg font-bold text-stone-700 dark:text-zinc-200 mt-3 mb-1.5',
        'text-sm sm:text-base font-semibold text-stone-700 dark:text-zinc-300 mt-3 mb-1',
        'text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mt-2 mb-1',
      ][level - 1];

      renderedElements.push(
        <div key={`header-${i}`} className={headerClasses}>
          {renderInlineMarkdown(text, onImageClick, resolveSrc)}
        </div>
      );
      i++;
      continue;
    }

    // 7. Horizontal Rule (---, ***, ___)
    if (line.match(/^(\*{3,}|-{3,}|_{3,})$/)) {
      renderedElements.push(
        <hr key={`hr-${i}`} className="my-6 border-stone-200 dark:border-zinc-800" />
      );
      i++;
      continue;
    }

    // 8. Unordered Lists (- item, * item)
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (ulMatch) {
      const indent = ulMatch[1].length;
      const text = ulMatch[2];
      const indentLevel = Math.floor(indent / 2);
      
      let bulletIcon = (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-2.5 shrink-0 block" />
      );
      if (indentLevel % 3 === 1) {
        bulletIcon = (
          <span className="w-1.5 h-1.5 rounded-full border-2 border-amber-500 dark:border-amber-400 mt-2.5 shrink-0 block" />
        );
      } else if (indentLevel % 3 === 2) {
        bulletIcon = (
          <span className="w-1.5 h-1.5 rounded-none bg-amber-500 dark:bg-amber-400 rotate-45 mt-2.5 shrink-0 block" />
        );
      }

      renderedElements.push(
        <div
          key={`ul-${i}`}
          className="flex items-start gap-3 my-1.5 font-sans"
          style={{ paddingLeft: `${Math.min(indent * 12, 48)}px` }}
        >
          {bulletIcon}
          <span className="text-sm sm:text-base text-stone-800 dark:text-zinc-200 leading-relaxed">
            {renderInlineMarkdown(text, onImageClick, resolveSrc)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // 9. Ordered Lists (1. item)
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (olMatch) {
      const indent = olMatch[1].length;
      const num = olMatch[2];
      const text = olMatch[3];
      renderedElements.push(
        <div
          key={`ol-${i}`}
          className="flex items-start gap-3 my-1.5 font-sans"
          style={{ paddingLeft: `${Math.min(indent * 12, 48)}px` }}
        >
          <span className="font-mono text-xs font-bold text-amber-500 mt-1 shrink-0 min-w-[20px] bg-amber-500/10 px-1 py-0.5 rounded text-center">
            {num}
          </span>
          <span className="text-sm sm:text-base text-stone-800 dark:text-zinc-200 leading-relaxed">
            {renderInlineMarkdown(text, onImageClick, resolveSrc)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // 10. Standalone Images (![alt](url))
    const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
      const alt = imageMatch[1] || 'Görsel';
      const rawSrc = imageMatch[2];
      const src = resolveSrc(rawSrc);
      renderedElements.push(
        <div key={`img-${i}`} className="my-4 group relative inline-block max-w-full">
          <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-md bg-stone-100 dark:bg-zinc-900">
            <img
              src={src}
              alt={alt}
              className="max-h-[500px] w-auto max-w-full object-contain rounded-2xl cursor-zoom-in transition-transform duration-300 hover:scale-[1.01]"
              onClick={() => onImageClick && onImageClick(src, alt)}
              loading="lazy"
            />
          </div>
          {alt && (
            <p className="text-[11px] text-center text-stone-500 dark:text-zinc-400 mt-1 italic">
              {alt}
            </p>
          )}
        </div>
      );
      i++;
      continue;
    }

    // 11. Empty lines / Paragraphs
    if (!line.trim()) {
      renderedElements.push(<div key={`blank-${i}`} className="h-3" />);
      i++;
      continue;
    }

    // Default Paragraph
    renderedElements.push(
      <p key={`p-${i}`} className="my-1.5 text-sm sm:text-base text-stone-800 dark:text-zinc-200 leading-relaxed">
        {renderInlineMarkdown(line, onImageClick, resolveSrc)}
      </p>
    );
    i++;
  }

  return <div className={`prose-container ${className}`}>{renderedElements}</div>;
}

/**
 * Inline Markdown Parser (Bold, Italic, Strikethrough, Highlight, Code, Links, Wiki-links, Images, Tags)
 */
function renderInlineMarkdown(
  text: string,
  onImageClick?: (src: string, alt: string) => void,
  resolveSrcFn?: (src: string) => string
): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  const combinedRegex =
    /(!\[(.*?)\]\((.*?)\))|(\[\[(.*?)\]\])|(\[(.*?)\]\((.*?)\))|(`([^`]+)`)|(==(.*?)==)|(\*\*\*(.*?)\*\*\*)|(\*\*(.*?)\*\*)|(\*(.*?)\*)|(~~(.*?)~~)|(#[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+)/;

  while (remaining.length > 0) {
    const match = remaining.match(combinedRegex);
    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    if (match.index > 0) {
      parts.push(remaining.substring(0, match.index));
    }

    const matchedStr = match[0];

    // Image: ![alt](url)
    if (matchedStr.startsWith('![')) {
      const alt = match[2];
      const rawSrc = match[3];
      const src = resolveSrcFn ? resolveSrcFn(rawSrc) : rawSrc;
      parts.push(
        <img
          key={`inline-img-${keyIdx++}`}
          src={src}
          alt={alt}
          className="inline-block max-h-40 rounded-lg shadow-sm border border-stone-200 dark:border-zinc-700 my-1 cursor-pointer"
          onClick={() => onImageClick && onImageClick(src, alt)}
        />
      );
    }
    // Wiki Link: [[Note Name]]
    else if (matchedStr.startsWith('[[')) {
      const noteName = match[5];
      parts.push(
        <span
          key={`wiki-${keyIdx++}`}
          className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700/50 cursor-pointer hover:underline"
        >
          📄 {noteName}
        </span>
      );
    }
    // Standard Link: [text](url)
    else if (matchedStr.startsWith('[')) {
      const linkText = match[7];
      const url = match[8];
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-medium"
        >
          <span>{linkText}</span>
          <FaExternalLinkAlt className="text-[10px] opacity-70" />
        </a>
      );
    }
    // Inline Code: `code`
    else if (matchedStr.startsWith('`')) {
      const code = match[10];
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400 font-mono text-xs sm:text-sm border border-stone-200 dark:border-zinc-700"
        >
          {code}
        </code>
      );
    }
    // Obsidian Highlight: ==text==
    else if (matchedStr.startsWith('==')) {
      const highlighted = match[12];
      parts.push(
        <mark
          key={`mark-${keyIdx++}`}
          className="bg-amber-300/80 dark:bg-amber-500/40 text-stone-950 dark:text-amber-100 px-1 rounded font-medium"
        >
          {highlighted}
        </mark>
      );
    }
    // Bold Italic: ***text***
    else if (matchedStr.startsWith('***')) {
      const boldItalic = match[14];
      parts.push(
        <strong key={`bi-${keyIdx++}`} className="font-bold italic">
          {boldItalic}
        </strong>
      );
    }
    // Bold: **text**
    else if (matchedStr.startsWith('**')) {
      const bold = match[16];
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-bold text-stone-900 dark:text-white">
          {bold}
        </strong>
      );
    }
    // Italic: *text*
    else if (matchedStr.startsWith('*')) {
      const italic = match[18];
      parts.push(
        <em key={`italic-${keyIdx++}`} className="italic">
          {italic}
        </em>
      );
    }
    // Strikethrough: ~~text~~
    else if (matchedStr.startsWith('~~')) {
      const strike = match[20];
      parts.push(
        <del key={`strike-${keyIdx++}`} className="line-through text-stone-400 dark:text-zinc-500">
          {strike}
        </del>
      );
    }
    // Hashtag: #tag
    else if (matchedStr.startsWith('#')) {
      parts.push(
        <span
          key={`tag-${keyIdx++}`}
          className="inline-block px-1.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200/80 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 mx-0.5"
        >
          {matchedStr}
        </span>
      );
    }

    remaining = remaining.substring(match.index + matchedStr.length);
  }

  return parts;
}
