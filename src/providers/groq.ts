import { ChatGroq } from "@langchain/groq";

export const groqModels = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"] as const;

export function createGroqModel(model?: string): ChatGroq {
  return new ChatGroq({
    model: model ?? groqModels[0],
    temperature: 0
  });
}
