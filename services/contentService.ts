
import { BookContent } from '../types';

export class ContentService {
  private cache: BookContent | null = null;

  async getBookData(): Promise<BookContent> {
    if (this.cache) return this.cache;

    try {
      const response = await fetch('./book-content.json');
      if (!response.ok) throw new Error('Failed to load book content');
      const data = await response.json();
      this.cache = data;
      return data;
    } catch (error) {
      console.error('Error loading book:', error);
      // Fallback or re-throw
      throw error;
    }
  }

  async getChapter(id: string): Promise<any> {
    const book = await this.getBookData();
    return book.chapters.find(c => c.id === id);
  }
}

export const contentService = new ContentService();
