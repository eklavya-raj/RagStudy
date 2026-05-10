import type { ModelOption } from "./types";

export const MODELS: ModelOption[] = [
  { value: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B" },
  { value: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B" },
  { value: "google/gemma-4-31b-it:free", label: "Gemma 4 31B" },
  { value: "nousresearch/hermes-3-llama-3.1-405b:free", label: "Hermes 3 405B" },
  { value: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron Super 120B" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o mini" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { value: "google/gemma-4-31b-it", label: "Gemma 4 31B" },
  { value: "deepseek/deepseek-v3.2-speciale", label: "DeepSeek V3.2" },
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
  { value: "mistralai/mistral-nemo", label: "Mistral Nemo" },
];

export const DEFAULT_MODEL = MODELS[10].value;

export function isFreeModel(value: string) {
  return value.endsWith(":free");
}
