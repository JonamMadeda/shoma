export function cleanPDFText(text: string): string {
  return text
    .replace(/(\p{L}+)-\n(\p{L}+)/gu, '$1$2')
    .replace(/(\p{L})-\n/gu, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(\S)\n(?=\p{Lu}|\d+[\.\)])/gu, '$1\n\n')
    .replace(/(?<!\n)\n(?!\n)/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .trim()
    .split('\n\n')
    .filter((p) => p.trim().length > 0)
    .join('\n\n');
}
