import { apiFetch } from '../config/api';

export type AiChatSuggestion = {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  laboratory: string;
};

export type AiChatResponse = {
  reply: string;
  suggestions: AiChatSuggestion[];
  disclaimer: string;
};

export type AiChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

export function sendAiChat(payload: {
  message: string;
  history?: AiChatHistoryItem[];
  productId?: string;
}) {
  return apiFetch<AiChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
