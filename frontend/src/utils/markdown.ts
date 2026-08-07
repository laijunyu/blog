import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdown(body: string): string {
  return marked.parse(body, { async: false }) as string;
}
