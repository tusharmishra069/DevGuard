import { z } from "zod";

export const providerEnum = z.enum(["anthropic", "gemini", "groq"]);

export const configSchema = z.object({
  provider: providerEnum.default("groq"),
  model: z.string().min(1).default("llama-3.3-70b-versatile"),
  agents: z
    .array(z.string().min(1))
    .min(1)
    .default(["bug-hunter", "security-scan", "performance-check", "style-guide", "test-coverage"]),
  exclude: z.array(z.string()).default([]),
  maxFileSizeKB: z.number().int().positive().default(300),
  customRules: z.array(z.string()).default([])
});

export type DevGuardConfig = z.infer<typeof configSchema>;

export const defaultConfig: DevGuardConfig = configSchema.parse({});
