'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useOrientation } from '@/hooks/useOrientation';
import type {
  ContentBlock,
  HeadingBlock,
  ParagraphBlock,
  TableBlock,
} from '@/lib/content-formatter';

interface ReaderViewProps {
  blocks: ContentBlock[];
  fontSize: number;
  searchQuery?: string;
  activeMatch?: number;
  onActivePageChange?: (page: number) => void;
  onScrollDirection?: (direction: 'up' | 'down') => void;
  textWidth?: 'normal' | 'wide';
  lineHeight?: number;
  scrollToBlock?: number | null;
  headerVisible?: boolean;
}

export function ReaderView({ blocks, fontSize, searchQuery = '', activeMatch = -1, onActivePageChange, onScrollDirection, textWidth = 'normal', lineHeight = 1.75, scrollToBlock, headerVisible = true }: ReaderViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<number, HTMLElement>>(new Map());
  const lastScrollTopRef = useRef(0);
  const scrollUpAccumRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  // Auto-hide progress bar in landscape
  const [progressVisible, setProgressVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    if (!isLandscape) return;
    setProgressVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setProgressVisible(false), 3000);
  }, [isLandscape]);

  const registerBlock = useCallback((index: number, element: HTMLElement | null) => {
    if (element) blockRefs.current.set(index, element);
    else blockRefs.current.delete(index);
  }, []);

  useEffect(() => {
    if (isLandscape) resetHideTimer();
    else setProgressVisible(true);
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [isLandscape, resetHideTimer]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollDelta = scrollTop - lastScrollTopRef.current;
      if (Math.abs(scrollDelta) > 8) {
        if (scrollDelta > 0) {
          scrollUpAccumRef.current = 0;
          onScrollDirection?.('down');
        } else {
          scrollUpAccumRef.current += Math.abs(scrollDelta);
          if (scrollUpAccumRef.current >= 120) {
            onScrollDirection?.('up');
            scrollUpAccumRef.current = 0;
          }
        }
        lastScrollTopRef.current = scrollTop;
      }
      const maxScroll = scrollHeight - clientHeight;
      setProgress(maxScroll > 0 ? Math.min((scrollTop / maxScroll) * 100, 100) : 0);
      const visibleBlock = blocks.findIndex((_, index) => {
        const element = blockRefs.current.get(index);
        return element && element.offsetTop + element.offsetHeight > scrollTop + 24;
      });
      if (visibleBlock >= 0) onActivePageChange?.(blocks[visibleBlock].page);
      if (isLandscape) resetHideTimer();
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [blocks, isLandscape, resetHideTimer, onActivePageChange, onScrollDirection]);

  const matches = useMemo(() => {
    const normalized = searchQuery.trim().toLocaleLowerCase();
    if (!normalized) return [] as number[];
    return blocks.flatMap((block, index) => {
      const text = block.type === 'table'
        ? `${block.headers.join(' ')} ${block.rows.flat().join(' ')}`
        : block.text;
      const result: number[] = [];
      let offset = 0;
      const lowerText = text.toLocaleLowerCase();
      while ((offset = lowerText.indexOf(normalized, offset)) !== -1) {
        result.push(index);
        offset += 1;
      }
      return result;
    });
  }, [blocks, searchQuery]);

  useEffect(() => {
    const blockIndex = matches[activeMatch];
    blockRefs.current.get(blockIndex)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeMatch, matches]);

  useEffect(() => {
    if (scrollToBlock !== null && scrollToBlock !== undefined) {
      blockRefs.current.get(scrollToBlock)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollToBlock]);

  const maxWidth = textWidth === 'wide' ? 'max-w-[900px]' : isLandscape ? 'max-w-[900px]' : 'max-w-[680px]';
  const padding = isLandscape ? 'px-8 py-6' : 'px-4 py-8 sm:px-6 sm:py-12';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          className={`mx-auto ${maxWidth} ${padding}`}
          style={{ fontFamily: "'Merriweather', Georgia, 'Times New Roman', serif" }}
        >
          {blocks.map((block, i) => {
            switch (block.type) {
              case 'heading':
                return renderHeading(block, fontSize, i, searchQuery, registerBlock);
              case 'paragraph':
                return renderParagraph(block, fontSize, i, searchQuery, registerBlock, lineHeight);
              case 'table':
                return renderTable(block, fontSize, i, searchQuery, registerBlock);
            }
          })}
        </div>
      </div>

      <div className={`pointer-events-none fixed left-0 right-0 z-30 h-0.5 bg-surface-muted transition-[top,opacity] duration-300 ${headerVisible ? 'top-14' : 'top-0'} ${progressVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className="h-full bg-accent transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

const HEADING_SIZES = { 1: 1.6, 2: 1.35, 3: 1.15 } as const;

function renderHeading(block: HeadingBlock, baseSize: number, key: number, query: string, registerBlock: (index: number, element: HTMLElement | null) => void) {
  const scale = HEADING_SIZES[block.level];
  const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
  return (
    <Tag
      key={key}
      ref={(element) => registerBlock(key, element)}
      className="mb-4 mt-10 font-semibold text-foreground first:mt-0"
      style={{ fontSize: `${baseSize * scale}px`, lineHeight: 1.3 }}
    >
      {highlightText(block.text, query)}
    </Tag>
  );
}

function renderParagraph(block: ParagraphBlock, fontSize: number, key: number, query: string, registerBlock: (index: number, element: HTMLElement | null) => void, lineHeight: number) {
  return (
    <p
      key={key}
      ref={(element) => registerBlock(key, element)}
      className="mb-6 leading-relaxed text-foreground last:mb-0"
      style={{ fontSize: `${fontSize}px`, lineHeight }}
    >
      {highlightText(block.text, query)}
    </p>
  );
}

function renderTable(block: TableBlock, _fontSize: number, key: number, query: string, registerBlock: (index: number, element: HTMLElement | null) => void) {
  return (
    <div key={key} ref={(element) => registerBlock(key, element)} className="mb-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm text-muted-medium">
        {block.headers.length > 0 && (
          <thead>
            <tr className="bg-surface-muted">
              {block.headers.map((h, i) => (
                <th key={i} className="px-3 py-2.5 text-left font-semibold text-foreground border-b border-border">
                  {highlightText(h, query)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri} className="even:bg-surface-muted/50">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 border-b border-border-subtle">
                  {highlightText(cell, query)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function highlightText(text: string, query: string): React.ReactNode {
  const term = query.trim();
  if (!term) return text;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, index) =>
    part.toLocaleLowerCase() === term.toLocaleLowerCase()
      ? <mark key={index} className="rounded bg-yellow-200 px-0.5 text-foreground">{part}</mark>
      : part
  );
}
