import { GoogleGenerativeAI } from "@google/generative-ai";
import { Level, Card, SentenceFeedback, AiAssistResponse } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);
// Using gemini-2.5-flash as requested.
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateDeckFromAi = async (prompt: string, currentLevel: Level): Promise<{ cards: Card[], targetLevel: Level }> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing. Please check your .env file.");
  }

  const systemPrompt = `You are Sensei AI, a supportive Japanese language teacher. 
  Create a list of Japanese vocabulary/kanji flashcards based on the user's prompt.
  - User is currently level ${currentLevel}. 
  - If the user specifies a specific JLPT level (N1-N5), use that level instead.
  - If the user specifies a number of cards, generate exactly that number (min 1, max 50). 
  - If not specified, default to 10 cards.
  - Return JSON only.
  
  Format:
  {
    "targetLevel": "N5",
    "cards": [
      { 
        "kanji": "家族", 
        "kana": "かぞく", 
        "meaning": "family", 
        "kun": "---", 
        "on": "カゾク", 
        "example": "私の家族は四人です。",
        "furiganaExample": "私[わたし]の 家[か][ぞく]族は 四[よ]人[にん]です。"
      }
    ]
  }`;

  try {
    const result = await model.generateContent(`${systemPrompt}\n\nUser prompt: ${prompt}`);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const getSentenceFeedback = async (
  sentence: string, 
  word: string, 
  usedAssist: boolean, 
  level: Level
): Promise<SentenceFeedback & { examples?: any[] }> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing. Please check your .env file.");
  }

  const systemPrompt = `You are Sensei AI, a Japanese teacher. 
  Evaluate the user's sentence for the word "${word}" at ${level} level.
  Used Assist: ${usedAssist} (if true, the user used one of your provided examples).
  
  1. If the sentence is random characters, keyboard mashing, or total gibberish, set isCoherent to false and PROVIDE 3 helpful examples for that word.
  2. If isCoherent is true:
     - Acknowledge their effort. If they used Assist, mention you're glad they liked the example. If they wrote it themselves, give polite encouragement.
     - Provide grammar insights.
     - Suggest improvements for naturalness or different politeness levels.
  
  Return JSON only:
  {
    "isCoherent": true,
    "acknowledgement": "...",
    "grammar": "...",
    "suggestions": "...",
    "politeness": "...",
    "examples": [] // Only if isCoherent is false
  }`;

  try {
    const result = await model.generateContent(`${systemPrompt}\n\nUser Sentence: "${sentence}"`);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Feedback Error:", error);
    throw error;
  }
};

export const getAiAssist = async (word: string, level: Level): Promise<AiAssistResponse> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing. Please check your .env file.");
  }

  const systemPrompt = `You are Sensei AI. Give usage advice for the word "${word}" at ${level} JLPT level.
  Provide a brief explanation of how the word is used and 3 example sentences.
  
  Return JSON only:
  {
    "explanation": "...",
    "examples": [
      { "kanji": "...", "kana": "...", "english": "..." }
    ]
  }`;

  try {
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Assist Error:", error);
    throw error;
  }
};
