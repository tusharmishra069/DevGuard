import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { DevGuardConfig } from "../config/schema.js";
import { createAnthropicModel } from "./anthropic.js";
import { createGeminiModel } from "./gemini.js";
import { createGroqModel } from "./groq.js";

export function createProviderModel(config: DevGuardConfig): BaseChatModel {
  if (config.provider === "anthropic") {
    return createAnthropicModel(config.model);
  }

  if (config.provider === "gemini") {
    return createGeminiModel(config.model);
  }

  return createGroqModel(config.model);
}
