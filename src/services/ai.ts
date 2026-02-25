import { GoogleGenerativeAI } from "@google/generative-ai";
import { Level, Card } from "../types";

// Replace with your API Key or handle securely through environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateDeckFromAi = async (prompt: string, level: Level): Promise<Card[]> => {
  if (API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    // If no API key, return mock data for demonstration
    return [
      { kanji: '家族', kana: 'かぞく', meaning: 'family', kun: '---', on: 'カゾク', example: '私の家族は四人です。 (My family has four people.)' },
      { kanji: '父', kana: 'ちち', meaning: 'father', kun: 'ちち', on: 'フ', example: '父は会社員です。 (My father is an office worker.)' },
      { kanji: '母', kana: 'はは', meaning: 'mother', kun: 'はは', on: 'ボ', example: "母の料理はおいしいです。 (My mother's cooking is delicious.)" },
    ];
  }

  const systemPrompt = `You are Sensei AI, a Japanese language teacher. 
  Create a list of 10 Japanese vocabulary/kanji flashcards based on the user's prompt for level ${level}.
  Return ONLY a JSON array of objects with the following keys: kanji, kana, meaning, kun, on, example.
  Each entry must be suitable for level ${level}. Example should include English translation in parentheses.`;

  try {
    const result = await model.generateContent(`${systemPrompt}
User prompt: ${prompt}`);
    const response = await result.response;
    const text = response.text();
    // Clean potential markdown if AI returns it
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const getSentenceFeedback = async (sentence: string, word: string): Promise<{ en: string, jp: string }> => {
  if (API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    return {
      en: "Good sentence! It uses the word correctly.",
      jp: "いい文章ですね。正しく使えています。"
    };
  }

  const systemPrompt = `You are Sensei AI, a Japanese language teacher. 
  The user is practicing the word "${word}". 
  Provide feedback in both English and Japanese on the sentence: "${sentence}".
  Return ONLY a JSON object with keys "en" and "jp".`;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Feedback Error:", error);
    return { en: "Error getting feedback.", jp: "エラーが発生しました。" };
  }
};
