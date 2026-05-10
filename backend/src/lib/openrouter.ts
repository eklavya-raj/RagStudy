import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const EMBEDDING_MODEL = "openai/text-embedding-3-small";
export const DEFAULT_CHAT_MODEL = "openai/gpt-4o-mini";

export const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});
