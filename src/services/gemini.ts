import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const generateCustomDeck = async (prompt: string, level: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemInstruction = `
    You are Sensei AI, a helpful Japanese teacher. 
    A student wants a custom flashcard deck. 
    Create a deck of Japanese flashcards based on their prompt: "${prompt}".
    The student's current proficiency level is ${level}.
    If they specified a level in the prompt, use that level for content.
    If the prompt doesn't specify a number of cards, generate 10.
    Maximum number of cards is 50.
    
    Return a JSON object with:
    1. "name": A creative name for the deck.
    2. "level": The proficiency level (N1, N2, N3, N4, N5).
    3. "cards": An array of objects, each containing:
       - "kanji": The word in kanji (if applicable).
       - "kana": The word in hiragana/katakana.
       - "meaning": The English meaning.
       - "kun": Kunyomi (if kanji).
       - "on": Onyomi (if kanji).
       - "example": A simple example sentence in Japanese with English translation in parentheses.
    
    Ensure the JSON is valid.
  `;

  const result = await model.generateContent(systemInstruction);
  const response = await result.response;
  const text = response.text();
  
  // Try to parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Failed to generate deck. Please try again.");
};

export const getSentenceSuggestions = async (word: string, meaning: string, level: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemInstruction = `
    You are Sensei AI. A student wants to practice using the word "${word}" (${meaning}).
    Their level is ${level}.
    1. Give a brief explanation of the word usage for context.
    2. Provide 3 sentence examples. Each example should include:
       - "kanji": Sentence with kanji.
       - "hiragana": Sentence in hiragana/katakana.
       - "meaning": English translation.
    
    Return as JSON:
    {
      "explanation": "...",
      "suggestions": [
        { "kanji": "...", "hiragana": "...", "meaning": "..." },
        ...
      ]
    }
  `;

  const result = await model.generateContent(systemInstruction);
  const response = await result.response;
  const text = response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Failed to get suggestions.");
};

export const getSentenceFeedback = async (sentence: string, word: string, level: string, isFromSuggestion: boolean) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemInstruction = `
    You are Sensei AI. A student submitted a Japanese sentence: "${sentence}".
    They are using the word "${word}" and their level is ${level}.
    The student ${isFromSuggestion ? "used one of your suggestions" : "created their own sentence"}.
    
    Provide feedback in a polite, encouraging way.
    
    Return a JSON object:
    {
      "isGibberish": boolean (true if the sentence is incoherent or just random characters),
      "feedback": "Your encouraging feedback and grammar insights here",
      "suggestions": [ // Only if isGibberish is true, provide 3 examples as a replacement
        { "kanji": "...", "hiragana": "...", "meaning": "..." },
        ...
      ],
      "explanation": "Brief explanation of word usage if isGibberish is true"
    }
    
    If isGibberish is false:
    1. Acknowledge their effort (especially if they used a suggestion or made their own).
    2. Provide grammar insights about the sentence.
    3. Give suggestions on how to improve or sound more natural/polite/casual.
    
    If isGibberish is true:
    1. State politely that the sentence doesn't seem to make sense.
    2. Provide the "explanation" and "suggestions" as if they had asked for Sensei AI Assist.
  `;

  const result = await model.generateContent(systemInstruction);
  const response = await result.response;
  const text = response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Failed to get feedback.");
};
