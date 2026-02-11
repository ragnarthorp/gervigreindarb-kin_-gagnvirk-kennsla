
import { GoogleGenAI, Type } from "@google/genai";
import { Message, Chapter } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;
  private modelName = 'gemini-2-flash';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async askAboutChapter(question: string, chapter: Chapter, history: Message[]): Promise<string> {
    if (!this.apiKey) {
      return "Gervigreindar-sturlan er ekki sett upp. Reyndu aftur síðar.";
    }
    const systemInstruction = `
      Þú ert sérfræðingur og kennari í gervigreind. 
      Þú ert að aðstoða nemanda sem er að lesa kaflann "${chapter.title}" í kennslubók.
      
      Hér er efni kaflans:
      ${chapter.content}
      
      Markmið þitt er að útskýra flókin hugtök á einfaldan en nákvæman hátt á íslensku. 
      Svaraðu spurningum nemandans byggt á textanum hér að ofan en bættu við þekkingu þinni ef þörf krefur til að dýpka skilninginn.
      Notaðu vinalegt og hvetjandi tónalag.
    `;

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Add current question
    contents.push({
      role: 'user',
      parts: [{ text: question }]
    });

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: contents as any,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      return response.text || "Afsakið, ég gat ekki svarað þessu í augnablikinu.";
    } catch (error) {
      console.error("Gemini API error:", error);
      return "Það kom upp villa við að tengjast gervigreindinni. Vinsamlegast reyndu aftur síðar.";
    }
  }
}

export const gemini = new GeminiService();
