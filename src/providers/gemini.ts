import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const geminiModels = ["gemini-2.0-flash", "gemini-1.5-pro"] as const;

export function createGeminiModel(model?: string): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({
    model: model ?? geminiModels[0],
    temperature: 0
  });
}
