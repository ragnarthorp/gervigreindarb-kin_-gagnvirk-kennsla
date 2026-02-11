
import { BookContent } from '../types';

export class ContentService {
  private cache: BookContent | null = null;

  async getBookData(): Promise<BookContent> {
    if (this.cache) return this.cache;

    try {
      const basePath = window.location.pathname.includes('gervigreindarb-kin_-gagnvirk-kennsla') 
        ? '/gervigreindarb-kin_-gagnvirk-kennsla/'
        : '/';
      const response = await fetch(`${basePath}book-content.json`);
      if (!response.ok) throw new Error(`Failed to load book content: ${response.status}`);
      const data = await response.json();
      this.cache = data;
      return data;
    } catch (error) {
      console.error('Error loading book:', error);
      throw error;
    }
  }

  async getChapter(id: string): Promise<any> {
    const book = await this.getBookData();
    return book.chapters.find(c => c.id === id);
  }
}

export const contentService = new ContentService();
