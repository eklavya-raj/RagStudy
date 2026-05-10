export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export interface Doc {
  id: string;
  name: string;
}

export interface ModelOption {
  value: string;
  label: string;
}
