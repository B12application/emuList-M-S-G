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
import TextareaAutosize from 'react-textarea-autosize';
import type { NoteItem, NoteFolder, NoteViewMode, NoteFontFamily, NoteFontSize, NoteLineHeight, NoteTheme, NoteAttachment } from '../../types/notes';
import MarkdownRenderer from './MarkdownRenderer';
import NoteThemePicker, { THEME_OPTIONS } from './NoteThemePicker';
import ImageLightboxModal from './ImageLightboxModal';
import toast from 'react-hot-toast';

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
  const [viewMode, setViewMode] = useState<NoteViewMode>('edit');
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>('Ekran Görüntüsü');
  const [tagInput, setTagInput] = useState('');
  const [isTagInputVisible, setIsTagInputVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);

  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderMenuRef = useRef<HTMLDivElement | null>(null);

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

  // Sync viewMode on mobile resize
  useEffect(() => {
    if (isMobile && viewMode === 'split') {
      setViewMode('edit');
    }
  }, [isMobile]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (!cmdKey) return;

      if (e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (note) {
          onUpdateNote({ content: note.content });
          toast.success('Not anında kaydedildi');
        }
      } else if (e.key === 'b') {
        e.preventDefault();
        insertMarkdownFormat('**', '**');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertMarkdownFormat('*', '*');
      } else if (e.key === 'k') {
        e.preventDefault();
        insertMarkdownFormat('[', '](https://)');
      } else if (e.key === 'S' && e.shiftKey) {
        e.preventDefault();
        handleScreenCaptureClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, onUpdateNote]);

  // Paste handler to capture screenshots directly from clipboard
  // Insert attachment block logic
  const insertAttachmentTag = useCallback((att: NoteAttachment) => {
    if (!note) return;
    const blocks = (note.content || '').split(/(!\[[^\]]*\]\(attachment:[^)]+\))/g);
    let newContent = '';
    const textarea = textareaRefs.current[activeBlockIndex];

    if (textarea) {
      const start = textarea.selectionStart;
      const blockText = blocks[activeBlockIndex] || '';
      
      const textBefore = blockText.substring(0, start);
      const textAfter = blockText.substring(textarea.selectionEnd);
      const markdown = `\n![${att.name}](attachment:${att.id})\n`;
      
      const newBlocks = [...blocks];
      newBlocks[activeBlockIndex] = textBefore + markdown + textAfter;
      newContent = newBlocks.join('');
      
      onUpdateNote({ content: newContent });
      
      setTimeout(() => {
        const nextIdx = activeBlockIndex + 2;
        const nextEl = textareaRefs.current[nextIdx];
        if (nextEl) {
          nextEl.focus();
          nextEl.setSelectionRange(0, 0);
          setActiveBlockIndex(nextIdx);
        }
      }, 50);
    } else {
      newContent = (note.content || '') + `\n![${att.name}](attachment:${att.id})\n`;
      onUpdateNote({ content: newContent });
    }
  }, [note, activeBlockIndex, onUpdateNote]);

  // Paste handler to capture screenshots directly from clipboard
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            toast.loading('Panodaki ekran görüntüsü ekleniyor...', { id: 'paste-img' });
            const att = await onAttachImageFile(file);
            if (att) {
              insertAttachmentTag(att);
            }
            toast.success('Pano görüntüsü nota eklendi!', { id: 'paste-img' });
          }
          break;
        }
      }
    },
    [onAttachImageFile, insertAttachmentTag]
  );

  // Drag & drop file handler
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          const att = await onAttachImageFile(files[i]);
          if (att) {
            insertAttachmentTag(att);
          }
        }
      }
    }
  };

  // Block deletion & navigation logic
  const handleBlockKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    const textarea = e.currentTarget;
    if (e.key === 'Backspace' && textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
      if (index >= 2) {
        e.preventDefault();
        const blocks = (note?.content || '').split(/(!\[[^\]]*\]\(attachment:[^)]+\))/g);
        const prevTextLength = blocks[index - 2].length;
        
        const newBlocks = [...blocks];
        newBlocks[index - 2] = newBlocks[index - 2] + newBlocks[index];
        newBlocks.splice(index - 1, 2);
        
        onUpdateNote({ content: newBlocks.join('') });
        
        setTimeout(() => {
          const prevEl = textareaRefs.current[index - 2];
          if (prevEl) {
            prevEl.focus();
            prevEl.setSelectionRange(prevTextLength, prevTextLength);
            setActiveBlockIndex(index - 2);
          }
        }, 50);
      }
    } else if (e.key === 'ArrowUp' && textarea.selectionStart === 0) {
      if (index >= 2) {
        e.preventDefault();
        const prevEl = textareaRefs.current[index - 2];
        if (prevEl) {
          prevEl.focus();
          const len = prevEl.value.length;
          prevEl.setSelectionRange(len, len);
          setActiveBlockIndex(index - 2);
        }
      }
    } else if (e.key === 'ArrowDown' && textarea.selectionStart === textarea.value.length) {
      const blocks = (note?.content || '').split(/(!\[[^\]]*\]\(attachment:[^)]+\))/g);
      if (index + 2 < blocks.length) {
        e.preventDefault();
        const nextEl = textareaRefs.current[index + 2];
        if (nextEl) {
          nextEl.focus();
          nextEl.setSelectionRange(0, 0);
          setActiveBlockIndex(index + 2);
        }
      }
    }
  };

  // Helper to insert markdown syntax at cursor position
  const insertMarkdownFormat = useCallback((before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRefs.current[activeBlockIndex];
    if (!textarea || !note) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const blocks = (note.content || '').split(/(!\[[^\]]*\]\(attachment:[^)]+\))/g);
    const blockText = blocks[activeBlockIndex] || '';
    const selectedText = blockText.substring(start, end) || defaultText;

    const replacement = `${before}${selectedText}${after}`;
    const newBlockText = blockText.substring(0, start) + replacement + blockText.substring(end);

    const newBlocks = [...blocks];
    newBlocks[activeBlockIndex] = newBlockText;

    onUpdateNote({ content: newBlocks.join('') });

    setTimeout(() => {
      const el = textareaRefs.current[activeBlockIndex];
      if (el) {
        el.focus();
        el.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      }
    }, 10);
  }, [note, activeBlockIndex, onUpdateNote]);

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
                placeholder="etiket..."
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
              <span>Etiket Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* MARKDOWN FORMATTING TOOLBAR (Visible in Edit & Split modes) */}
      {viewMode !== 'preview' && (
        <div className="px-4 py-2 border-y border-stone-200/60 dark:border-zinc-800/60 bg-stone-50/70 dark:bg-zinc-900/60 flex items-center gap-1 flex-wrap shrink-0 text-xs">
          <button
            onClick={() => insertMarkdownFormat('**', '**', 'kalın metin')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold"
            title="Kalın (Ctrl+B)"
          >
            <FaBold />
          </button>
          <button
            onClick={() => insertMarkdownFormat('*', '*', 'eğik metin')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 italic"
            title="İtalik (Ctrl+I)"
          >
            <FaItalic />
          </button>
          <button
            onClick={() => insertMarkdownFormat('~~', '~~', 'üstü çizili')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title="Üstü Çizili"
          >
            <FaStrikethrough />
          </button>
          <button
            onClick={() => insertMarkdownFormat('==', '==', 'vurgulanan metin')}
            className="px-1.5 py-0.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-400 font-bold text-xs"
            title="Obsidian Vurgusu (==vurgu==)"
          >
            ==Vurgu==
          </button>

          <div className="w-px h-4 bg-stone-300 dark:bg-zinc-700 mx-1" />

          <button
            onClick={() => insertMarkdownFormat('# ', '', 'Başlık 1')}
            className="px-1.5 py-0.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-xs"
            title="Başlık 1"
          >
            H1
          </button>
          <button
            onClick={() => insertMarkdownFormat('## ', '', 'Başlık 2')}
            className="px-1.5 py-0.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-xs"
            title="Başlık 2"
          >
            H2
          </button>
          <button
            onClick={() => insertMarkdownFormat('### ', '', 'Başlık 3')}
            className="px-1.5 py-0.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-xs"
            title="Başlık 3"
          >
            H3
          </button>

          <div className="w-px h-4 bg-stone-300 dark:bg-zinc-700 mx-1" />

          <button
            onClick={() => insertMarkdownFormat('- [ ] ', '', 'Yapılacak görev')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title="Kontrol Listesi / Görev (- [ ])"
          >
            <FaCheckSquare />
          </button>
          <button
            onClick={() => insertMarkdownFormat('- ', '', 'Madde')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title="Madde İşaretli Liste"
          >
            <FaListUl />
          </button>
          <button
            onClick={() => insertMarkdownFormat('1. ', '', 'Numaralı madde')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title="Numaralı Liste"
          >
            <FaListOl />
          </button>

          <div className="w-px h-4 bg-stone-300 dark:bg-zinc-700 mx-1" />

          <button
            onClick={() => insertMarkdownFormat('> ', '', 'Alıntı')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title="Alıntı Blok"
          >
            <FaQuoteRight />
          </button>
          <button
            onClick={() => insertMarkdownFormat('> [!NOTE]\n> ', '', 'Önemli not')}
            className="px-1.5 py-0.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold text-xs"
            title="Obsidian Callout Kutusu"
          >
            [!NOTE]
          </button>
          <button
            onClick={() => insertMarkdownFormat('```javascript\n', '\n```', '// kod buraya')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title="Kod Bloğu"
          >
            <FaCode />
          </button>
          <button
            onClick={() =>
              insertMarkdownFormat(
                '| Başlık 1 | Başlık 2 |\n| --- | --- |\n| Veri 1 | Veri 2 |\n'
              )
            }
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title="Tablo Ekle"
          >
            <FaTable />
          </button>
          <button
            onClick={() => insertMarkdownFormat('[', '](https://)', 'Bağlantı')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title="Link Ekle (Ctrl+K)"
          >
            <FaLink />
          </button>
          <button
            onClick={() => insertMarkdownFormat('\n---\n')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300"
            title="Yatay Çizgi"
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
              {(() => {
                const blocks = (note.content || '').split(/(!\[[^\]]*\]\(attachment:[^)]+\))/g);
                if (blocks.length === 0) blocks.push(''); // ensure at least one block
                
                return blocks.map((block, index) => {
                  if (index % 2 === 1) {
                    // Attachment block
                    const match = block.match(/!\[([^\]]*)\]\(attachment:([^)]+)\)/);
                    const alt = match?.[1] || '';
                    const id = match?.[2] || '';
                    const att = note.attachments?.find(a => a.id === id);
                    
                    if (!att) {
                      return (
                        <div key={index} className="my-2 p-3 rounded bg-red-50 dark:bg-red-900/20 text-red-500 text-xs border border-red-200 dark:border-red-900/30 flex items-center gap-2">
                          <FaTimes />
                          <span>Görsel bulunamadı veya silinmiş.</span>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={index} className="my-4 relative group flex flex-col items-center">
                        <img src={att.url} alt={alt} className="max-w-full max-h-[600px] object-contain rounded-xl shadow-sm border border-stone-200 dark:border-zinc-800" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1.5 p-1 bg-black/60 rounded-xl backdrop-blur-sm">
                          <button onClick={() => { setLightboxSrc(att.url); setLightboxAlt(att.name); }} className="p-2 hover:bg-white/20 text-white rounded-lg transition-colors" title="Büyüt">
                            <FaEye className="text-xs" />
                          </button>
                          <button onClick={(e) => handleDeleteAttachment(att.id, e)} className="p-2 hover:bg-red-500/50 text-red-300 rounded-lg transition-colors" title="Eki Sil">
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    // Text block
                    return (
                      <TextareaAutosize
                        key={index}
                        ref={(el) => { textareaRefs.current[index] = el; }}
                        value={block}
                        onChange={(e) => {
                          const newBlocks = [...blocks];
                          newBlocks[index] = e.target.value;
                          onUpdateNote({ content: newBlocks.join('') });
                        }}
                        onFocus={() => setActiveBlockIndex(index)}
                        onKeyDown={(e) => handleBlockKeyDown(e, index)}
                        onPaste={handlePaste}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        placeholder={index === 0 && blocks.length === 1 ? "Düşüncelerinizi yazmaya başlayın... (Markdown, Ekran görüntüleri vb.)" : ""}
                        className="w-full bg-transparent resize-none focus:outline-none placeholder:text-stone-400 dark:placeholder:text-zinc-600 outline-none"
                      />
                    );
                  }
                });
              })()}
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
              Kaydediliyor...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <FaCheck className="text-[10px]" />
              Kaydedildi
            </span>
          )}
        </div>

        {/* Word, Character, Reading info */}
        <div className="flex items-center gap-4">
          <span>{wordsCount} Kelime</span>
          <span>{charsCount} Karakter</span>
          <span>~{readTimeMin} dk okuma süresi</span>
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
