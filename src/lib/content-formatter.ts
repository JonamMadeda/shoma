import type { RawLine, RawPage } from './pdf-parser';

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export type ContentBlock = HeadingBlock | ParagraphBlock | TableBlock;

const HEADING_SIZE_RATIO = 1.25;
const TABLE_COLUMN_GAP_RATIO = 0.02;

function findBodyFontSize(pages: RawPage[]): number {
  const sizes: number[] = [];
  for (const page of pages) {
    for (const line of page.lines) {
      if (line.text.length > 40) {
        sizes.push(line.avgFontSize);
      }
    }
  }
  if (sizes.length === 0) return 12;
  sizes.sort((a, b) => a - b);
  return sizes[Math.floor(sizes.length / 2)];
}

function detectHeadingLevel(
  line: RawLine,
  bodySize: number
): 1 | 2 | 3 | null {
  const ratio = line.avgFontSize / bodySize;
  if (line.isBold || ratio > HEADING_SIZE_RATIO) {
    if (ratio > 1.6) return 1;
    if (ratio > 1.3) return 2;
    return 3;
  }
  return null;
}

function lineIsEmpty(line: RawLine): boolean {
  return line.text.trim().length === 0;
}

function lineLooksLikeTableHeader(line: RawLine): boolean {
  const text = line.text.trim();
  if (!text) return false;
  const words = line.runs.filter((r) => r.text.trim().length > 0);
  const lastRun = line.runs[line.runs.length - 1];
  const lineWidth = lastRun ? lastRun.x + lastRun.width - line.runs[0].x : 1;
  const charWidth = line.text.length > 0 ? lineWidth / line.text.length : 1;

  let gaps = 0;
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].x - (words[i - 1].x + words[i - 1].width);
    if (gap > charWidth * 3) gaps++;
  }
  return gaps >= 2;
}

function detectTableLines(lines: RawLine[]): number[] {
  const tableStarts: number[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lineLooksLikeTableHeader(lines[i])) {
      let j = i + 1;
      while (
        j < lines.length &&
        lines[j].text.trim().length > 0 &&
        !lineLooksLikeTableHeader(lines[j])
      ) {
        j++;
      }
      if (j - i >= 3) {
        tableStarts.push(i);
        i = j;
        continue;
      }
    }
    i++;
  }
  return tableStarts;
}

function extractTableColumns(headersLine: RawLine): number[][] {
  const runs = headersLine.runs.filter((r) => r.text.trim().length > 0);
  if (runs.length === 0) return [];

  const boundaries: number[][] = [];
  let currentStart = runs[0].x;

  for (let i = 1; i < runs.length; i++) {
    const gap = runs[i].x - (runs[i - 1].x + runs[i - 1].width);
    const avgCharWidth =
      runs[i - 1].width / Math.max(runs[i - 1].text.length, 1);
    if (gap > avgCharWidth * 3) {
      boundaries.push([
        currentStart,
        runs[i - 1].x + runs[i - 1].width,
      ]);
      currentStart = runs[i].x;
    }
  }
  if (runs.length > 0) {
    const last = runs[runs.length - 1];
    boundaries.push([currentStart, last.x + last.width]);
  }
  return boundaries;
}

function extractCellText(line: RawLine, columns: number[][]): string[] {
  return columns.map(([start, end]) => {
    const parts = line.runs
      .filter((r) => r.x + r.width > start && r.x < end)
      .map((r) => r.text);
    return parts.join(' ').trim();
  });
}

function buildTable(
  lines: RawLine[],
  startIdx: number
): { table: TableBlock; endIdx: number } {
  const columns = extractTableColumns(lines[startIdx]);
  const headers = extractCellText(lines[startIdx], columns);
  const rows: string[][] = [];

  let endIdx = startIdx + 1;
  while (endIdx < lines.length && lines[endIdx].text.trim().length > 0) {
    const cells = extractCellText(lines[endIdx], columns);
    if (cells.some((c) => c.length > 0)) {
      rows.push(cells);
    }
    endIdx++;
  }

  return {
    table: { type: 'table', headers, rows },
    endIdx: endIdx - 1,
  };
}

function cleanParagraph(text: string): string {
  return text
    .replace(/(\p{L}+)-\n(\p{L}+)/gu, '$1$2')
    .replace(/(\p{L})-\n/gu, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(\S)\n(?=\p{Lu}|\d+[\.\)])/gu, '$1\n\n')
    .replace(/(?<!\n)\n(?!\n)/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .trim();
}

export function formatContent(pages: RawPage[]): ContentBlock[] {
  const bodySize = findBodyFontSize(pages);
  const blocks: ContentBlock[] = [];

  for (const page of pages) {
    const lines = page.lines;
    const tableStarts = new Set(detectTableLines(lines));
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (lineIsEmpty(line)) {
        i++;
        continue;
      }

      if (tableStarts.has(i)) {
        const { table, endIdx } = buildTable(lines, i);
        blocks.push(table);
        i = endIdx + 1;
        continue;
      }

      const headingLevel = detectHeadingLevel(line, bodySize);
      if (headingLevel) {
        blocks.push({ type: 'heading', level: headingLevel, text: line.text.trim() });
        i++;
        continue;
      }

      const paraLines: string[] = [line.text];
      i++;
      while (
        i < lines.length &&
        !lineIsEmpty(lines[i]) &&
        !detectHeadingLevel(lines[i], bodySize) &&
        !tableStarts.has(i)
      ) {
        paraLines.push(lines[i].text);
        i++;
      }
      blocks.push({
        type: 'paragraph',
        text: cleanParagraph(paraLines.join('\n')),
      });
    }

    blocks.push({ type: 'paragraph', text: '' });
  }

  return blocks.filter(
    (b) => b.type !== 'paragraph' || b.text.length > 0
  );
}
