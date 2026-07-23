'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  ContentBlock,
  HeadingBlock,
  ParagraphBlock,
  TableBlock,
} from '@/lib/content-formatter';

interface ReaderViewProps {
  blocks: ContentBlock[];
  fontSize: number;
}

export function ReaderView({ blocks, fontSize }: ReaderViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      setProgress(maxScroll > 0 ? Math.min((scrollTop / maxScroll) * 100, 100) : 0);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [blocks]);

  return (
    <div className="relative flex flex-1 flex-col">
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div
          className="mx-auto max-w-[680px] px-4 py-8 sm:px-6 sm:py-12"
          style={{ fontFamily: "'Merriweather', Georgia, 'Times New Roman', serif" }}
        >
          {blocks.map((block, i) => {
            switch (block.type) {
              case 'heading':
                return renderHeading(block, fontSize, i);
              case 'paragraph':
                return renderParagraph(block, fontSize, i);
              case 'table':
                return renderTable(block, fontSize, i);
            }
          })}
        </div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-slate-100">
        <div
          className="h-full bg-slate-600 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

const HEADING_SIZES = { 1: 1.6, 2: 1.35, 3: 1.15 } as const;

function renderHeading(block: HeadingBlock, baseSize: number, key: number) {
  const scale = HEADING_SIZES[block.level];
  const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
  return (
    <Tag
      key={key}
      className="mb-4 mt-10 font-semibold text-slate-900 first:mt-0"
      style={{ fontSize: `${baseSize * scale}px`, lineHeight: 1.3 }}
    >
      {block.text}
    </Tag>
  );
}

function renderParagraph(block: ParagraphBlock, fontSize: number, key: number) {
  return (
    <p
      key={key}
      className="mb-6 leading-relaxed text-slate-800 last:mb-0"
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}
    >
      {block.text}
    </p>
  );
}

function renderTable(block: TableBlock, _fontSize: number, key: number) {
  return (
    <div key={key} className="mb-6 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-sm text-slate-700">
        {block.headers.length > 0 && (
          <thead>
            <tr className="bg-slate-50">
              {block.headers.map((h, i) => (
                <th key={i} className="px-3 py-2.5 text-left font-semibold text-slate-800 border-b border-slate-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri} className="even:bg-slate-50/50">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 border-b border-slate-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
