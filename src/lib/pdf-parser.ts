'use client';

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export interface TextRun {
  text: string;
  fontSize: number;
  fontName: string;
  x: number;
  y: number;
  width: number;
}

export interface RawLine {
  runs: TextRun[];
  text: string;
  avgFontSize: number;
  isBold: boolean;
  y: number;
}

export interface RawPage {
  lines: RawLine[];
  pageNum: number;
}

const BOLD_PATTERN = /bold|heavy|black|demi|semibold/i;
const Y_THRESHOLD = 5;

function detectBold(fontName: string): boolean {
  return BOLD_PATTERN.test(fontName);
}

export async function extractPages(file: File): Promise<RawPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: RawPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as TextItem[];
    const lines: RawLine[] = [];
    let currentRuns: TextRun[] = [];
    let lastY: number | null = null;

    function flushLine() {
      if (currentRuns.length === 0) return;
      const text = currentRuns.map((r) => r.text).join('');
      const avgFs =
        currentRuns.reduce((s, r) => s + r.fontSize, 0) / currentRuns.length;
      const isBold = currentRuns.some((r) => detectBold(r.fontName));
      lines.push({
        runs: currentRuns,
        text,
        avgFontSize: Math.round(avgFs * 100) / 100,
        isBold,
        y: currentRuns[0].y,
      });
      currentRuns = [];
    }

    for (const item of items) {
      const y = item.transform[5];
      const fontSize = Math.round(Math.abs(item.transform[0]) * 100) / 100;

      if (lastY !== null && Math.abs(y - lastY) > Y_THRESHOLD) {
        flushLine();
      }

      currentRuns.push({
        text: item.str,
        fontSize,
        fontName: item.fontName,
        x: item.transform[4],
        y,
        width: item.width,
      });
      lastY = y;

      if (item.hasEOL) {
        flushLine();
        lastY = null;
      }
    }

    flushLine();
    pages.push({ lines, pageNum: i });
  }

  return pages;
}
