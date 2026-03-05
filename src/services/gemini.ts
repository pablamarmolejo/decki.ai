import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY is not set in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);

export const generateCustomDeck = async (prompt: string, level: string) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const systemInstruction = `
      You are Sensei AI, a helpful Japanese teacher. 
      Create a deck of Japanese flashcards based on: "${prompt}".
      Student level: ${level}.
      Generate 10 cards if not specified. Max 50.
      
      Return JSON:
      {
        "name": "string",
        "level": "N1|N2|N3|N4|N5",
        "cards": [
          {
            "kanji": "string",
            "kana": "string",
            "meaning": "string",
            "kun": "string",
            "on": "string",
            "example": "Japanese sentence (English translation)"
          }
        ]
      }
    `;

    const result = await model.generateContent(systemInstruction);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini generateCustomDeck error:", error);
    throw error;
  }
};

export const getSentenceFeedback = async (sentence: string, word: string, level: string, isFromSuggestion: boolean) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const systemInstruction = `
      You are Sensei AI. Student submitted Japanese sentence: "${sentence}".
      Word used: "${word}". Level: ${level}.
      From suggestion: ${isFromSuggestion}.
      
      Return JSON:
      {
        "isGibberish": boolean,
        "feedback": "Short encouraging comment in English",
        "grammar": "Bullet points (•) breakdown in English. No markdown asterisks.",
        "improvements": "Naturality tips/alternatives in English with bullet points (•). No markdown asterisks.",
        "explanation": "Word usage explanation if isGibberish is true",
        "suggestions": [
          { "kanji": "string", "hiragana": "string", "meaning": "string" }
        ]
      }
      
      If isGibberish is true, provide suggestions and explanation.
    `;

    const result = await model.generateContent(systemInstruction);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini getSentenceFeedback error:", error);
    throw error;
  }
};
