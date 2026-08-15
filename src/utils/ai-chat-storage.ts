import type { AiChatSuggestion } from '../services/ai.service';

export type AiChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: AiChatSuggestion[];
};

export type AiConversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: AiChatMessage[];
};

type AiChatStore = {
  activeId: string;
  conversations: AiConversation[];
};

const STORAGE_KEY = 'parashop-ai-chats-v1';

export const AI_WELCOME =
  "Hi! I'm the ParaShop+ assistant. Ask me about products, general para tips, or what to browse. I don't replace a doctor.";

function welcomeMessage(): AiChatMessage {
  return { id: 'welcome', role: 'assistant', content: AI_WELCOME };
}

function createConversation(partial?: Partial<AiConversation>): AiConversation {
  const now = new Date().toISOString();
  return {
    id: partial?.id ?? `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: partial?.title ?? 'New chat',
    updatedAt: partial?.updatedAt ?? now,
    messages: partial?.messages ?? [welcomeMessage()],
  };
}

function readStore(): AiChatStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const first = createConversation();
      return { activeId: first.id, conversations: [first] };
    }
    const parsed = JSON.parse(raw) as AiChatStore;
    if (
      !parsed ||
      !Array.isArray(parsed.conversations) ||
      parsed.conversations.length === 0
    ) {
      const first = createConversation();
      return { activeId: first.id, conversations: [first] };
    }
    const activeId =
      parsed.conversations.some((c) => c.id === parsed.activeId)
        ? parsed.activeId
        : parsed.conversations[0].id;
    return { activeId, conversations: parsed.conversations };
  } catch {
    const first = createConversation();
    return { activeId: first.id, conversations: [first] };
  }
}

function writeStore(store: AiChatStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadAiChatStore(): AiChatStore {
  return readStore();
}

export function saveAiChatStore(store: AiChatStore) {
  writeStore(store);
}

export function titleFromMessages(messages: AiChatMessage[]): string {
  const firstUser = messages.find(
    (m) => m.role === 'user' && m.content.trim().length > 0,
  );
  if (!firstUser) return 'New chat';
  const text = firstUser.content.trim().replace(/\s+/g, ' ');
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

export function createEmptyConversation(): AiConversation {
  return createConversation();
}
