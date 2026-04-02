import { ChatAnthropic } from "@langchain/anthropic";

export const anthropicModels = ["claude-sonnet-4-5", "claude-haiku-3-5"] as const;

export function createAnthropicModel(model?: string): ChatAnthropic {
  return new ChatAnthropic({
    model: model ?? anthropicModels[0],
    temperature: 0
  });
}
