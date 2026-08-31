// src/frontend/components/notes/NotesEditor.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FaArrowLeft,
  FaFolder,
  FaThumbtack,
  FaStar,
  FaCamera,
  FaImage,
  FaPalette,
  FaColumns,
  FaEdit,
  FaEye,
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaHeading,
  FaListUl,
  FaListOl,
  FaCheckSquare,
  FaQuoteRight,
  FaCode,
  FaTable,
  FaLink,
  FaMinus,
  FaShareAlt,
  FaTrash,
  FaFileDownload,
  FaCopy,
  FaCheck,
  FaInfoCircle,
  FaExpand,
  FaCompress,
  FaTag,
  FaTimes,
  FaPlus,
  FaExternalLinkAlt,
  FaChevronDown
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Link } from '@tiptap/extension-link';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import type { NoteItem, NoteFolder, NoteViewMode, NoteFontFamily, NoteFontSize, NoteLineHeight, NoteTheme, NoteAttachment } from '../../types/notes';
import MarkdownRenderer from './MarkdownRenderer';
import NoteThemePicker, { THEME_OPTIONS } from './NoteThemePicker';
import ImageLightboxModal from './ImageLightboxModal';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

interface NotesEditorProps {
  note: NoteItem | null;
  folders: NoteFolder[];
  saveStatus: 'idle' | 'saving' | 'saved';
  onUpdateNote: (updates: Partial<NoteItem>) => void;
  onTogglePin: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onCaptureScreen: () => Promise<NoteAttachment | null>;
  onAttachImageFile: (file: File) => Promise<NoteAttachment | null>;
  onBackToList?: () => void;
  isMobile?: boolean;
}

function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    let childrenContent = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      childrenContent += walk(element.childNodes[i]);
    }

    switch (tagName) {
      case 'b':
      case 'strong':
        return childrenContent.trim() ? `**${childrenContent.trim()}**` : '';
      case 'i':
      case 'em':
        return childrenContent.trim() ? `*${childrenContent.trim()}*` : '';
      case 's':
      case 'strike':
      case 'del':
        return childrenContent.trim() ? `~~${childrenContent.trim()}~~` : '';
      case 'h1':
        return `\n\n# ${childrenContent.trim()}\n\n`;
      case 'h2':
        return `\n\n## ${childrenContent.trim()}\n\n`;
      case 'h3':
        return `\n\n### ${childrenContent.trim()}\n\n`;
      case 'h4':
      case 'h5':
      case 'h6':
        return `\n\n#### ${childrenContent.trim()}\n\n`;
      case 'p':
      case 'div':
        return `\n${childrenContent}\n`;
      case 'br':
        return '\n';
      case 'a':
        const href = element.getAttribute('href') || '';
        return childrenContent.trim() ? `[${childrenContent.trim()}](${href})` : '';
      case 'li':
        const parent = element.parentElement;
        if (parent && parent.tagName.toLowerCase() === 'ol') {
          const index = Array.from(parent.children).indexOf(element) + 1;
          return `\n${index}. ${childrenContent.trim()}`;
        }
        return `\n- ${childrenContent.trim()}`;
      case 'ul':
      case 'ol':
        return `\n${childrenContent}\n`;
      case 'table':
        return `\n\n${childrenContent.trim()}\n\n`;
      case 'tr':
        const cells = Array.from(element.children);
        const cellContents = cells.map(c => {
          let content = '';
          for (let k = 0; k < c.childNodes.length; k++) {
            content += walk(c.childNodes[k]);
          }
          return content.trim().replace(/\|/g, '\\|');
        });
        const isHeader = cells.some(c => c.tagName.toLowerCase() === 'th');
        let rowStr = `| ${cellContents.join(' | ')} |\n`;
        if (isHeader) {
          const divider = `| ${cells.map(() => '---').join(' | ')} |\n`;
          rowStr += divider;
        }
        return rowStr;
      case 'td':
      case 'th':
        return childrenContent;
      default:
        return childrenContent;
    }
  }

  const body = doc.body;
  let result = '';
  for (let i = 0; i < body.childNodes.length; i++) {
    result += walk(body.childNodes[i]);
  }

  return result
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const replaceAttachmentTagsWithUrls = (html: string, attachments: NoteAttachment[]) => {
  let result = html;
  if (!attachments) return result;
  attachments.forEach(att => {
    result = result.replace(new RegExp(`attachment:${att.id}`, 'g'), att.url);
  });
  return result;
};

const replaceUrlsWithAttachmentTags = (html: string, attachments: NoteAttachment[]) => {
  let result = html;
  if (!attachments) return result;
  attachments.forEach(att => {
    result = result.replace(new RegExp(att.url.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), `attachment:${att.id}`);
  });
  return result;
};

function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  if (markdown.trim().startsWith('<') || markdown.trim().includes('</p>') || markdown.trim().includes('</div>')) {
    return markdown;
  }
  
  let html = markdown;
  
  // Headings
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

  // Horizontal Rule
  html = html.replace(/^---$/gm, '<hr />');

  // Task lists
  html = html.replace(/^\s*[-*+]\s+\[x\]\s+(.*)$/gmi, '<ul data-type="taskList"><li data-checked="true"><label><input type="checkbox" checked><span></span></label><div>$1</div></li></ul>');
  html = html.replace(/^\s*[-*+]\s+\[ \]\s+(.*)$/gmi, '<ul data-type="taskList"><li data-checked="false"><label><input type="checkbox"><span></span></label><div>$1</div></li></ul>');

  // Unordered lists
  html = html.replace(/^\s*[-*+]\s+(.*)$/gm, '<ul><li>$1</li></ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<ol><li>$1</li></ol>');
  html = html.replace(/<\/ol>\s*<ol>/g, '');

  // Blockquotes
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br/>');

  // Bold, italic, strikethrough, highlight
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<s>$1</s>');
  html = html.replace(/==(.*?)==/g, '<mark>$1</mark>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[(.*?)\]\(attachment:([a-zA-Z0-9_-]+)\)/g, '<img src="attachment:$2" alt="$1" />');

  // Wrap non-block lines in paragraphs
  const lines = html.split('\n');
  const processed = lines.map(l => {
    const trimmed = l.trim();
    if (!trimmed) return '<p></p>';
    const isBlock = /^(<h[1-6]|<ul|<ol|<li|<blockquote|<hr|<p|<div|<img)/i.test(trimmed);
    if (isBlock) return l;
    return `<p>${l}</p>`;
  });
  
  return processed.join('');
}

export default function NotesEditor({
  note,
  folders,
  saveStatus,
  onUpdateNote,
  onTogglePin,
  onToggleFavorite,
  onDeleteNote,
  onCaptureScreen,
  onAttachImageFile,
  onBackToList,
  isMobile = false,
}: NotesEditorProps) {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<NoteViewMode>('edit');
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>('Ekran Görüntüsü');
  const [tagInput, setTagInput] = useState('');
  const [isTagInputVisible, setIsTagInputVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const [isTablePopoverOpen, setIsTablePopoverOpen] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({ rows: 0, cols: 0 });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderMenuRef = useRef<HTMLDivElement | null>(null);
  const tablePopoverRef = useRef<HTMLDivElement>(null);

  // Close folder menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(event.target as Node)) {
        setIsFolderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close table popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tablePopoverRef.current && !tablePopoverRef.current.contains(event.target as Node)) {
        setIsTablePopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync viewMode on mobile resize
  useEffect(() => {
    if (isMobile && viewMode === 'split') {
      setViewMode('edit');
    }
  }, [isMobile]);

  // TipTap Editor Instantiation
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2.5 my-1.5'
        }
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false
      }),
      Highlight,
      Image.configure({
        allowBase64: true
      })
    ],
    content: note ? replaceAttachmentTagsWithUrls(markdownToHtml(note.content || ''), note.attachments || []) : '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const cleanContent = replaceUrlsWithAttachmentTags(html, note?.attachments || []);
      onUpdateNote({ content: cleanContent });
    },
    editorProps: {
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                toast.loading('Pano ekran görüntüsü yükleniyor...', { id: 'paste-img' });
                onAttachImageFile(file).then(att => {
                  if (att) {
                    view.dispatch(
                      view.state.tr.replaceSelectionWith(
                        view.state.schema.nodes.image.create({ src: att.url, alt: att.name })
                      )
                    );
                    toast.success('Pano görüntüsü nota eklendi!', { id: 'paste-img' });
                  }
                }).catch(() => {
                  toast.error('Görsel eklenemedi.', { id: 'paste-img' });
                });
              }
              return true;
            }
          }
        }
        return false;
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          event.preventDefault();
          for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
              onAttachImageFile(files[i]).then(att => {
                if (att) {
                  view.dispatch(
                    view.state.tr.replaceSelectionWith(
                      view.state.schema.nodes.image.create({ src: att.url, alt: att.name })
                    )
                  );
                }
              });
            }
          }
          return true;
        }
        return false;
      }
    }
  });

  // Sync TipTap readOnly mode based on viewMode
  useEffect(() => {
    if (editor) {
      editor.setEditable(viewMode !== 'preview');
    }
  }, [viewMode, editor]);

  // Sync Note Content with TipTap editor on note change
  useEffect(() => {
    if (editor && note) {
      const rawHtml = markdownToHtml(note.content || '');
      const contentWithUrls = replaceAttachmentTagsWithUrls(rawHtml, note.attachments || []);
      
      const currentClean = replaceUrlsWithAttachmentTags(editor.getHTML(), note.attachments || []);
      const incomingClean = replaceUrlsWithAttachmentTags(contentWithUrls, note.attachments || []);
      
      if (currentClean !== incomingClean) {
        editor.commands.setContent(contentWithUrls, { emitUpdate: false });
      }
    }
  }, [note?.id, editor]);

  // Keyboard Shortcuts Handler (supports Save, Undo/Redo is handled natively by TipTap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const cmdKey = e.metaKey || e.ctrlKey;
      if (!cmdKey) return;

      if (e.key === 's') {
        e.preventDefault();
        if (note) {
          onUpdateNote({ content: note.content });
          toast.success(t('notes.autoSaved'));
        }
      } else if (e.key === 'b') {
        e.preventDefault();
        editor?.chain().focus().toggleBold().run();
      } else if (e.key === 'i') {
        e.preventDefault();
        editor?.chain().focus().toggleItalic().run();
      } else if (e.key === 'S' && e.shiftKey) {
        e.preventDefault();
        handleScreenCaptureClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, onUpdateNote, editor]);

  const insertAttachmentTag = useCallback((att: NoteAttachment) => {
    if (editor) {
      editor.chain().focus().setImage({ src: att.url, alt: att.name }).run();
    }
  }, [editor]);

  const insertTextAtCursor = useCallback((text: string) => {
    if (editor) {
      editor.chain().focus().insertContent(text).run();
    }
  }, [editor]);

  const insertMarkdownFormat = (before: string, after: string = '', defaultText: string = '') => {
    if (!editor) return;
    if (before === '**') editor.chain().focus().toggleBold().run();
    else if (before === '*') editor.chain().focus().toggleItalic().run();
    else if (before === '~~') editor.chain().focus().toggleStrike().run();
    else if (before === '==') editor.chain().focus().toggleHighlight().run();
    else if (before === '# ') editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (before === '## ') editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (before === '### ') editor.chain().focus().toggleHeading({ level: 3 }).run();
    else if (before === '- [ ] ') editor.chain().focus().toggleTaskList().run();
    else if (before === '- ') editor.chain().focus().toggleBulletList().run();
    else if (before === '1. ') editor.chain().focus().toggleOrderedList().run();
    else if (before === '> ') editor.chain().focus().toggleBlockquote().run();
    else if (before === '```javascript\n') editor.chain().focus().toggleCodeBlock().run();
    else if (before === '\n---\n') editor.chain().focus().setHorizontalRule().run();
    else if (before === '[') {
      const url = prompt('Bağlantı adresi / Link URL:');
      if (url) editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleInsertTable = (rows: number, cols: number) => {
    if (editor) {
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    }
    setIsTablePopoverOpen(false);
  };


  // Toggle interactive task in preview mode
  const handleToggleTaskInContent = (lineIndex: number) => {
    if (!note) return;
    const lines = (note.content || '').split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    const taskMatch = line.match(/^(\s*[-*+]\s+\[)([ xX])(\]\s+.*)$/);
    if (taskMatch) {
      const isChecked = taskMatch[2].toLowerCase() === 'x';
      const newCheck = isChecked ? ' ' : 'x';
      lines[lineIndex] = `${taskMatch[1]}${newCheck}${taskMatch[3]}`;
      onUpdateNote({ content: lines.join('\n') });
    }
  };

  // Handle Screen Capture
  const handleScreenCaptureClick = async () => {
    setIsCapturing(true);
    try {
      const att = await onCaptureScreen();
      if (att) {
        insertAttachmentTag(att);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Tag management
  const handleAddTag = () => {
    if (!tagInput.trim() || !note) return;
    const cleanTag = tagInput.trim().replace(/^#/, '').toLowerCase();
    const existingTags = note.tags || [];
    if (!existingTags.includes(cleanTag)) {
      onUpdateNote({ tags: [...existingTags, cleanTag] });
    }
    setTagInput('');
    setIsTagInputVisible(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!note) return;
    const updated = (note.tags || []).filter((t) => t !== tagToRemove);
    onUpdateNote({ tags: updated });
  };

  // Export functions
  const handleExportMarkdown = () => {
    if (!note) return;
    const blob = new Blob([note.content || ''], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(note.title || 'not').replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markdown dosyası indirildi', { id: 'note-action' });
  };

  const handleCopyNoteContent = () => {
    if (!note) return;
    navigator.clipboard.writeText(note.content || '');
    toast.success('Tüm not içeriği kopyalandı', { id: 'note-action' });
  };

  const handleDeleteAttachment = (attId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note) return;
    const updatedAttachments = (note.attachments || []).filter((a) => a.id !== attId);
    const cleanContent = (note.content || '').replace(
      new RegExp(`\\n*!\\[[^\\]]*\\]\\(attachment:${attId}\\)`, 'g'),
      ''
    );
    onUpdateNote({
      attachments: updatedAttachments,
      content: cleanContent,
    });
    toast.success('Görsel eki kaldırıldı', { id: 'note-action' });
  };

  const handleInsertAttachmentTag = (att: NoteAttachment, e: React.MouseEvent) => {
    e.stopPropagation();
    insertAttachmentTag(att);
    toast.success('Görsel metne eklendi', { id: 'note-action' });
  };

  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-950/50 p-8 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-400/10 text-amber-500 flex items-center justify-center mb-4 text-3xl shadow-inner">
          <FaEdit />
        </div>
        <h3 className="text-lg font-bold text-stone-800 dark:text-zinc-200 mb-2">
          Görüntülenecek Not Seçilmedi
        </h3>
        <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-sm">
          Soldaki menüden bir not seçebilir veya yeni bir Obsidian notu oluşturabilirsiniz.
        </p>
      </div>
    );
  }

  // Word & Character count calculation
  const wordsCount = (note.content || '').trim().split(/\s+/).filter(Boolean).length;
  const charsCount = (note.content || '').length;
  const readTimeMin = Math.max(1, Math.ceil(wordsCount / 200));

  // Compute font family class
  const getFontFamilyClass = (font?: NoteFontFamily) => {
    switch (font) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      case 'handwriting':
        return 'italic font-sans tracking-wide';
      default:
        return 'font-sans';
    }
  };

  // Compute font size class
  const getFontSizeClass = (size?: NoteFontSize) => {
    switch (size) {
      case 'sm':
        return 'text-xs sm:text-sm';
      case 'lg':
        return 'text-base sm:text-lg';
      case 'xl':
        return 'text-lg sm:text-xl';
      default:
        return 'text-sm sm:text-base';
    }
  };

  // Compute line height class
  const getLineHeightClass = (lh?: NoteLineHeight) => {
    switch (lh) {
      case 'compact':
        return 'leading-normal';
      case 'relaxed':
        return 'leading-loose';
      default:
        return 'leading-relaxed';
    }
  };

  // Compute Theme Container styling
  const getThemeClass = (th?: NoteTheme) => {
    switch (th) {
      case 'amber':
        return 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-400/30';
      case 'emerald':
        return 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-400/30';
      case 'cyan':
        return 'bg-cyan-50/20 dark:bg-cyan-950/10 border-cyan-400/30';
      case 'purple':
        return 'bg-purple-50/20 dark:bg-purple-950/10 border-purple-400/30';
      case 'rose':
        return 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-400/30';
      case 'sepia':
        return 'bg-[#fbf0d9]/60 dark:bg-[#201a14] border-[#c4a480]/40 text-[#433422] dark:text-[#f4ebd0]';
      case 'slate':
        return 'bg-slate-50/40 dark:bg-slate-900/30 border-slate-400/30';
      default:
        return 'bg-white dark:bg-zinc-950';
    }
  };

  return (
    <div
      className={`h-full flex flex-col ${getThemeClass(note.theme)} ${
        isFullscreen ? 'fixed inset-0 z-[110]' : 'relative'
      }`}
    >
      {/* Hidden File Input for Image Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const att = await onAttachImageFile(file);
            if (att) {
              insertAttachmentTag(att);
            }
            e.target.value = '';
          }
        }}
      />

      {/* TOP HEADER: Breadcrumbs & Primary Actions */}
      <div className="px-4 py-3 border-b border-stone-200/70 dark:border-zinc-800/70 shrink-0 flex flex-wrap items-center justify-between gap-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        {/* Left: Mobile Back Button & Folder Selector */}
        <div className="flex items-center gap-2 min-w-0">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors md:hidden"
              title="Not Listesine Dön"
            >
              <FaArrowLeft />
            </button>
          )}

          {/* Folder dropdown selector */}
          <div className="relative" ref={folderMenuRef}>
            <button
              onClick={() => setIsFolderMenuOpen(!isFolderMenuOpen)}
              className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-zinc-200 bg-stone-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-stone-200/60 dark:border-zinc-700 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all focus:outline-none shadow-sm"
            >
              <FaFolder className="text-amber-500" />
              <span className="truncate max-w-[100px] sm:max-w-[140px]">
                {note.folderId ? folders.find(f => f.id === note.folderId)?.name || 'Kök Dizin' : 'Ana Dizin (Kök)'}
              </span>
              <FaChevronDown className={`text-[10px] text-stone-400 transition-transform duration-200 ${isFolderMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isFolderMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full left-0 mt-2 w-56 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-[100] py-1.5 overflow-hidden origin-top-left"
                >
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => { onUpdateNote({ folderId: null }); setIsFolderMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold transition-colors"
                    >
                      -- Ana Dizin (Kök) --
                    </button>
                    <div className="h-px bg-stone-100 dark:bg-zinc-800/80 my-0.5 mx-3" />
                    {folders.map(f => (
                      <button
                        key={f.id}
                        onClick={() => { onUpdateNote({ folderId: f.id }); setIsFolderMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-medium flex items-center gap-2.5 transition-colors"
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: f.color || '#f59e0b' }} />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Screen Capture, Image Upload, Theme, View Modes, Export & Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Screen Capture Button (Main Feature!) */}
          <button
            onClick={handleScreenCaptureClick}
            disabled={isCapturing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            title="Ekran Görüntüsü Al (Pencereler, Sekmeler veya Tam Ekran)"
          >
            <FaCamera className="text-xs" />
            <span className="hidden sm:inline">Ekran Görüntüsü Al</span>
          </button>

          {/* Upload Image Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors text-xs"
            title="Görsel / Ekran Görüntüsü Yükle"
          >
            <FaImage />
          </button>

          {/* Theme & Font Customizer */}
          <button
            onClick={() => setIsThemePickerOpen(true)}
            className="p-2 rounded-xl text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors text-xs"
            title="Yazı Stili ve Tema Değiştir"
          >
            <FaPalette />
          </button>

          {/* Pin & Star */}
          <button
            onClick={() => onTogglePin(note.id)}
            className={`p-2 rounded-xl transition-colors text-xs ${
              note.isPinned
                ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400'
                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
            }`}
            title={note.isPinned ? 'Sabitlemeyi Kaldır' : 'Başa Sabitle'}
          >
            <FaThumbtack />
          </button>

          <button
            onClick={() => onToggleFavorite(note.id)}
            className={`p-2 rounded-xl transition-colors text-xs ${
              note.isFavorite
                ? 'bg-amber-400/20 text-amber-500'
                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
            }`}
            title={note.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
          >
            <FaStar />
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-100 dark:bg-zinc-800 p-1 rounded-xl border border-stone-200/60 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('edit')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white font-bold shadow-sm'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800'
              }`}
              title="Düzenleme Modu"
            >
              <FaEdit />
            </button>

            {!isMobile && (
              <button
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white font-bold shadow-sm'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800'
                }`}
                title="Bölünmüş Görünüm (Canlı Önizleme)"
              >
                <FaColumns />
              </button>
            )}

            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white font-bold shadow-sm'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800'
              }`}
              title="Önizleme / Okuma Modu"
            >
              <FaEye />
            </button>
          </div>

          {/* Fullscreen & Export */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors text-xs hidden sm:block"
            title={isFullscreen ? 'Tam Ekrandan Çık' : 'Odaklanma Modu (Tam Ekran)'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>

          <button
            onClick={handleExportMarkdown}
            className="p-2 rounded-xl text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors text-xs"
            title="Markdown Olarak İndir (.md)"
          >
            <FaFileDownload />
          </button>

          <button
            onClick={() => onDeleteNote(note.id)}
            className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-xs"
            title="Çöp Kutusuna Taşı"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {/* TITLE & TAGS SECTION */}
      <div className="px-6 pt-5 pb-3 shrink-0 space-y-3">
        {/* Title Input */}
        <input
          type="text"
          value={note.title || ''}
          onChange={(e) => onUpdateNote({ title: e.target.value })}
          placeholder="Not Başlığı..."
          className="w-full bg-transparent text-2xl sm:text-3xl font-black text-stone-900 dark:text-white placeholder:text-stone-300 dark:placeholder:text-zinc-700 focus:outline-none tracking-tight"
        />

        {/* Tags Chips Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(note.tags || []).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 border border-stone-200/50 dark:border-zinc-700"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-500 ml-0.5 text-[10px]"
              >
                <FaTimes />
              </button>
            </span>
          ))}

          {isTagInputVisible ? (
            <div className="inline-flex items-center gap-1 bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-amber-400">
              <span className="text-xs text-amber-500 font-bold">#</span>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  } else if (e.key === 'Escape') {
                    setIsTagInputVisible(false);
                  }
                }}
                onBlur={handleAddTag}
                placeholder={t('notes.tagPlaceholder')}
                className="bg-transparent text-xs text-stone-900 dark:text-white focus:outline-none w-20"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setIsTagInputVisible(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-stone-400 dark:text-zinc-500 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <FaPlus className="text-[9px]" />
              <span>{t('notes.addTag')}</span>
            </button>
          )}
        </div>
      </div>

      {/* MARKDOWN FORMATTING TOOLBAR (Visible in Edit & Split modes) */}
      {viewMode !== 'preview' && (
        <div className="px-4 py-2 border-y border-stone-200/60 dark:border-zinc-800/60 bg-stone-50/70 dark:bg-zinc-900/60 flex items-center gap-1 flex-wrap shrink-0 text-xs">
          <button
            onClick={() => insertMarkdownFormat('**', '**', t('notes.boldText'))}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold"
            title={t('notes.boldTooltip')}
          >
            <FaBold />
          </button>
          <button
            onClick={() => insertMarkdownFormat('*', '*', t('notes.italicText'))}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 italic"
            title={t('notes.italicTooltip')}
          >
            <FaItalic />
          </button>
          <button
            onClick={() => insertMarkdownFormat('~~', '~~', t('notes.strikeText'))}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title={t('notes.strikeTooltip')}
          >
            <FaStrikethrough />
          </button>
          <button
            onClick={() => insertMarkdownFormat('==', '==', t('notes.highlightText'))}
            className="px-1.5 py-0.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-400 font-bold text-xs"
            title={t('notes.highlightTooltip')}
          >
            {t('notes.highlightBtn')}
          </button>

          <div className="w-px h-4 bg-stone-300 dark:bg-zinc-700 mx-1" />

          <button
            onClick={() => insertMarkdownFormat('# ', '', t('notes.h1'))}
            className="px-1.5 py-0.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-xs"
            title={t('notes.h1')}
          >
            H1
          </button>
          <button
            onClick={() => insertMarkdownFormat('## ', '', t('notes.h2'))}
            className="px-1.5 py-0.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-xs"
            title={t('notes.h2')}
          >
            H2
          </button>
          <button
            onClick={() => insertMarkdownFormat('### ', '', t('notes.h3'))}
            className="px-1.5 py-0.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-xs"
            title={t('notes.h3')}
          >
            H3
          </button>

          <div className="w-px h-4 bg-stone-300 dark:bg-zinc-700 mx-1" />

          <button
            onClick={() => insertMarkdownFormat('- [ ] ', '', t('notes.taskText'))}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title={t('notes.taskTooltip')}
          >
            <FaCheckSquare />
          </button>
          <button
            onClick={() => insertMarkdownFormat('- ', '', t('notes.bulletText'))}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title={t('notes.bulletTooltip')}
          >
            <FaListUl />
          </button>
          <button
            onClick={() => insertMarkdownFormat('1. ', '', t('notes.numberText'))}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title={t('notes.numberTooltip')}
          >
            <FaListOl />
          </button>

          <div className="w-px h-4 bg-stone-300 dark:bg-zinc-700 mx-1" />

          <button
            onClick={() => insertMarkdownFormat('> ', '', t('notes.quoteText'))}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title={t('notes.quoteTooltip')}
          >
            <FaQuoteRight />
          </button>
          <button
            onClick={() => insertMarkdownFormat('> [!NOTE]\n> ', '', t('notes.noteText'))}
            className="px-1.5 py-0.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold text-xs"
            title={t('notes.noteTooltip')}
          >
            [!NOTE]
          </button>
          <button
            onClick={() => insertMarkdownFormat('```javascript\n', '\n```', t('notes.codeText'))}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title={t('notes.codeTooltip')}
          >
            <FaCode />
          </button>
          {/* Interactive Table Grid Popover Button */}
          <div className="relative" ref={tablePopoverRef}>
            <button
              onClick={() => setIsTablePopoverOpen(!isTablePopoverOpen)}
              className={`p-1.5 rounded-lg text-stone-700 dark:text-zinc-300 transition-colors flex items-center justify-center cursor-pointer ${
                isTablePopoverOpen ? 'bg-amber-400/25 text-amber-600 dark:text-amber-400' : 'hover:bg-stone-200 dark:hover:bg-zinc-800'
              }`}
              title={t('notes.tableTooltip')}
            >
              <FaTable />
            </button>
            
            <AnimatePresence>
              {isTablePopoverOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-[110] w-[180px] origin-top-left"
                >
                  <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 mb-2 uppercase tracking-wider text-center">
                    {t('notes.tableSize')}
                  </div>
                  
                  {/* 5x5 Grid */}
                  <div className="grid grid-cols-5 gap-1.5 justify-center mb-2 mx-auto">
                    {Array.from({ length: 5 }).map((_, rIdx) => {
                      const row = rIdx + 1;
                      return Array.from({ length: 5 }).map((_, cIdx) => {
                        const col = cIdx + 1;
                        const isHighlighted = row <= hoveredGrid.rows && col <= hoveredGrid.cols;
                        return (
                          <div
                            key={`${row}-${col}`}
                            onMouseEnter={() => setHoveredGrid({ rows: row, cols: col })}
                            onClick={() => handleInsertTable(row, col)}
                            className={`w-5 h-5 rounded-md border transition-all cursor-pointer ${
                              isHighlighted
                                ? 'bg-amber-500 border-amber-500 shadow-sm shadow-amber-500/20 scale-105'
                                : 'border-stone-200 dark:border-zinc-850 bg-stone-50/50 dark:bg-zinc-950/20 hover:border-amber-400 hover:bg-amber-500/5'
                            }`}
                          />
                        );
                      });
                    })}
                  </div>
                  
                  {/* Grid Size label */}
                  <div className="text-[11px] text-center font-bold text-amber-500 bg-amber-500/5 py-1 rounded-lg border border-amber-500/10">
                    {hoveredGrid.rows > 0 && hoveredGrid.cols > 0 ? t('notes.tableInsert').replace('{rows}', hoveredGrid.rows.toString()).replace('{cols}', hoveredGrid.cols.toString()) : t('notes.tableZero')}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => insertMarkdownFormat('[', '](https://)', t('notes.linkText'))}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title={t('notes.linkTooltip')}
          >
            <FaLink />
          </button>
          <button
            onClick={() => insertMarkdownFormat('\n---\n')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title={t('notes.hrTooltip')}
          >
            <FaMinus />
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA (Split / Edit / Preview) */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        {/* Editor Pane (in edit or split mode) */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`h-full flex-1 flex flex-col overflow-hidden ${
              viewMode === 'split' ? 'border-r border-stone-200/70 dark:border-zinc-800/70' : ''
            }`}
          >
            <div
              className={`w-full h-full p-6 bg-transparent custom-scrollbar overflow-y-auto ${getFontFamilyClass(
                note.fontFamily
              )} ${getFontSizeClass(note.fontSize)} ${getLineHeightClass(
                note.lineHeight
              )} text-stone-900 dark:text-zinc-100`}
            >
              <EditorContent editor={editor} className="outline-none" />
            </div>
          </div>
        )}

        {/* Live Preview Pane (in preview or split mode) */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="h-full flex-1 overflow-y-auto p-6 custom-scrollbar bg-white/40 dark:bg-zinc-950/40">
            <MarkdownRenderer
              content={note.content || ''}
              attachments={note.attachments}
              onToggleTask={handleToggleTaskInContent}
              onImageClick={(src, alt) => {
                setLightboxSrc(src);
                setLightboxAlt(alt);
              }}
              className={`${getFontFamilyClass(note.fontFamily)} ${getFontSizeClass(
                note.fontSize
              )} ${getLineHeightClass(note.lineHeight)}`}
            />
          </div>
        )}
      </div>

      {/* SCREENSHOT & ATTACHMENT STRIP GALLERY (If attachments exist) */}
      {note.attachments && note.attachments.length > 0 && (
        <div className="px-6 py-2.5 border-t border-stone-200/70 dark:border-zinc-800/70 bg-stone-50/90 dark:bg-zinc-900/90 shrink-0 flex items-center gap-3 overflow-x-auto custom-scrollbar">
          <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <FaCamera className="text-amber-500 text-sm" />
            <span>Eklenen Görseller ({note.attachments.length})</span>
          </span>

          <div className="flex items-center gap-2.5">
            {note.attachments.map((att) => (
              <div
                key={att.id}
                onClick={() => {
                  setLightboxSrc(att.url);
                  setLightboxAlt(att.name);
                }}
                className="group relative w-16 h-16 rounded-xl overflow-hidden bg-stone-200 dark:bg-zinc-800 border-2 border-stone-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 shrink-0 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 transition-all"
                title={`${att.name} (Tıklayarak büyüt)`}
              >
                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxSrc(att.url);
                      setLightboxAlt(att.name);
                    }}
                    className="p-1 rounded hover:bg-white/20 text-white"
                    title="Büyüt"
                  >
                    <FaEye />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleInsertAttachmentTag(att, e)}
                    className="p-1 rounded hover:bg-white/20 text-amber-300"
                    title="Metne Ekle"
                  >
                    <FaPlus />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteAttachment(att.id, e)}
                    className="p-1 rounded hover:bg-red-500/50 text-red-300"
                    title="Eki Sil"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM FOOTER STATUS BAR */}
      <div className="px-6 py-2 border-t border-stone-200/70 dark:border-zinc-800/70 bg-stone-50/60 dark:bg-zinc-950/60 text-[11px] text-stone-500 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Save indicator */}
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-1.5 text-amber-500 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              {t('notes.saving')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <FaCheck className="text-[10px]" />
              {t('notes.saved')}
            </span>
          )}
        </div>

        {/* Word, Character, Reading info */}
        <div className="flex items-center gap-4">
          <span>{t('notes.wordCount').replace('{count}', wordsCount.toString())}</span>
          <span>{t('notes.charCount').replace('{count}', charsCount.toString())}</span>
          <span>{t('notes.readTime').replace('{time}', readTimeMin.toString())}</span>
        </div>
      </div>

      {/* Theme Picker Modal */}
      <NoteThemePicker
        isOpen={isThemePickerOpen}
        onClose={() => setIsThemePickerOpen(false)}
        fontFamily={note.fontFamily || 'sans'}
        fontSize={note.fontSize || 'base'}
        lineHeight={note.lineHeight || 'normal'}
        theme={note.theme || 'default'}
        onChangeFontFamily={(font) => onUpdateNote({ fontFamily: font })}
        onChangeFontSize={(size) => onUpdateNote({ fontSize: size })}
        onChangeLineHeight={(lh) => onUpdateNote({ lineHeight: lh })}
        onChangeTheme={(th) => onUpdateNote({ theme: th })}
      />

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={Boolean(lightboxSrc)}
        src={lightboxSrc}
        alt={lightboxAlt}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
