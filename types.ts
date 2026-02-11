export interface ChapterElement {
  type: 'text' | 'story' | 'table' | 'chat-example' | 'highlight' | 'note' | 'image';
  value?: string;       // Fyrir texta, story, highlight
  title?: string;       // Fyrir töflur eða ramma
  headers?: string[];   // Fyrir töflur
  rows?: string[][];    // Fyrir töflur
  prompt?: string;      // Fyrir chat-example
  response?: string;    // Fyrir chat-example
  src?: string;         // Fyrir myndir
  caption?: string;     // Fyrir myndir
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  part?: number;  // 1, 2, eða 3
  elements: ChapterElement[]; // Hér breytum við úr 'content' í 'elements'
}

export interface BookContent {
  title: string;
  author: string;
  version: string;
  chapters: Chapter[];
}