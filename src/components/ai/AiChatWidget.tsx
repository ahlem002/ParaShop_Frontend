import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bot,
  Check,
  History,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  sendAiChat,
  type AiChatHistoryItem,
} from '../../services/ai.service';
import { resolveUploadUrl } from '../../config/api';
import {
  createEmptyConversation,
  loadAiChatStore,
  saveAiChatStore,
  titleFromMessages,
  type AiChatMessage,
  type AiConversation,
} from '../../utils/ai-chat-storage';
import '../../styles/components/ai-chat.css';

const HIDDEN_PREFIXES = ['/admin', '/company', '/delivery', '/auth'];

function money(value: number) {
  return `${Number(value).toFixed(2)} TND`;
}

function sortByUpdated(conversations: AiConversation[]) {
  return [...conversations].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function AiChatWidget() {
  const location = useLocation();
  const hidden = HIDDEN_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix),
  );

  const productId = useMemo(() => {
    const match = location.pathname.match(/^\/products\/([^/]+)/);
    return match?.[1];
  }, [location.pathname]);

  const initialStore = useMemo(() => loadAiChatStore(), []);
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<AiConversation[]>(
    initialStore.conversations,
  );
  const [activeId, setActiveId] = useState(initialStore.activeId);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeChat =
    conversations.find((c) => c.id === activeId) ?? conversations[0];
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    if (!activeChat) return;
    saveAiChatStore({
      activeId: activeChat.id,
      conversations,
    });
  }, [conversations, activeChat]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading, showHistory]);

  if (hidden) return null;

  function updateActiveMessages(
    updater: (prev: AiChatMessage[]) => AiChatMessage[],
  ) {
    setConversations((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeId) return chat;
        const nextMessages = updater(chat.messages);
        return {
          ...chat,
          messages: nextMessages,
          title: titleFromMessages(nextMessages),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  async function askAssistant(
    text: string,
    conversationMessages: AiChatMessage[],
  ) {
    const history: AiChatHistoryItem[] = conversationMessages
      .filter((m) => m.id !== 'welcome')
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    setLoading(true);
    setError('');

    try {
      const response = await sendAiChat({
        message: text,
        history: history.slice(0, -1),
        productId,
      });

      const assistantMessage: AiChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        suggestions: response.suggestions,
      };

      updateActiveMessages(() => [...conversationMessages, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not reach the AI assistant.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    updateActiveMessages(() => nextMessages);
    setInput('');
    await askAssistant(text, nextMessages);
  }

  function handleNewChat() {
    if (loading) return;
    const next = createEmptyConversation();
    setConversations((prev) => [next, ...prev]);
    setActiveId(next.id);
    setShowHistory(false);
    setEditingId(null);
    setError('');
    setInput('');
  }

  function handleSelectChat(id: string) {
    if (loading) return;
    setActiveId(id);
    setShowHistory(false);
    setEditingId(null);
    setError('');
  }

  function handleDeleteConversation(id: string) {
    if (loading) return;
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createEmptyConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });
    setEditingId(null);
    setError('');
  }

  function handleDeleteMessage(messageId: string) {
    if (loading || messageId === 'welcome') return;
    updateActiveMessages((prev) => {
      const index = prev.findIndex((m) => m.id === messageId);
      if (index < 0) return prev;
      const target = prev[index];
      const next = [...prev];
      next.splice(index, 1);
      if (
        target.role === 'user' &&
        next[index]?.role === 'assistant'
      ) {
        next.splice(index, 1);
      }
      return next.length > 0 ? next : prev;
    });
    if (editingId === messageId) {
      setEditingId(null);
      setEditDraft('');
    }
  }

  function startEdit(message: AiChatMessage) {
    if (loading || message.role !== 'user') return;
    setEditingId(message.id);
    setEditDraft(message.content);
    setError('');
  }

  async function saveEdit() {
    if (!editingId || loading) return;
    const text = editDraft.trim();
    if (!text) return;

    const index = messages.findIndex((m) => m.id === editingId);
    if (index < 0) return;

    const truncated = messages.slice(0, index);
    const edited: AiChatMessage = {
      id: editingId,
      role: 'user',
      content: text,
    };
    const nextMessages = [...truncated, edited];
    updateActiveMessages(() => nextMessages);
    setEditingId(null);
    setEditDraft('');
    await askAssistant(text, nextMessages);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft('');
  }

  const historyList = sortByUpdated(conversations);

  return (
    <div className="ai-chat">
      {open && (
        <section className="ai-chat__panel" aria-label="ParaShop+ AI assistant">
          <header className="ai-chat__header">
            <div className="ai-chat__identity">
              <span className="ai-chat__avatar" aria-hidden>
                <Bot size={20} strokeWidth={2} />
              </span>
              <div>
                <strong>ParaShop+ Assistant</strong>
                <p>{activeChat?.title || 'General guidance only'}</p>
              </div>
            </div>
            <div className="ai-chat__header-actions">
              <button
                type="button"
                className="ai-chat__icon-btn"
                aria-label="Chat history"
                title="History"
                onClick={() => setShowHistory((v) => !v)}
              >
                <History size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="ai-chat__icon-btn"
                aria-label="New chat"
                title="New chat"
                onClick={handleNewChat}
              >
                <Plus size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="ai-chat__icon-btn"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </header>

          {showHistory ? (
            <div className="ai-chat__history">
              <div className="ai-chat__history-head">
                <h3>Chat history</h3>
                <button type="button" onClick={handleNewChat}>
                  <Plus size={14} strokeWidth={2} />
                  New chat
                </button>
              </div>
              <ul className="ai-chat__history-list">
                {historyList.map((chat) => (
                  <li
                    key={chat.id}
                    className={
                      chat.id === activeId
                        ? 'ai-chat__history-item active'
                        : 'ai-chat__history-item'
                    }
                  >
                    <button
                      type="button"
                      className="ai-chat__history-open"
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <strong>{chat.title}</strong>
                      <span>
                        {new Date(chat.updatedAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="ai-chat__icon-btn"
                      aria-label="Delete chat"
                      onClick={() => handleDeleteConversation(chat.id)}
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div className="ai-chat__messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`ai-chat__bubble ai-chat__bubble--${message.role}`}
                  >
                    {editingId === message.id ? (
                      <div className="ai-chat__edit">
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={3}
                          maxLength={2000}
                          aria-label="Edit message"
                        />
                        <div className="ai-chat__edit-actions">
                          <button
                            type="button"
                            onClick={() => void saveEdit()}
                            disabled={loading || !editDraft.trim()}
                          >
                            <Check size={14} strokeWidth={2} />
                            Save & ask again
                          </button>
                          <button type="button" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>{message.content}</p>
                        {message.suggestions &&
                          message.suggestions.length > 0 && (
                            <div className="ai-chat__suggestions">
                              {message.suggestions.map((item) => {
                                const image = resolveUploadUrl(item.image);
                                return (
                                  <Link
                                    key={item.productId}
                                    to={`/products/${item.productId}`}
                                    className="ai-chat__product"
                                    onClick={() => setOpen(false)}
                                  >
                                    <div className="ai-chat__product-image">
                                      {image ? (
                                        <img src={image} alt="" />
                                      ) : (
                                        <span>{item.name.slice(0, 1)}</span>
                                      )}
                                    </div>
                                    <div>
                                      <strong>{item.name}</strong>
                                      <span>{money(item.price)}</span>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        {message.id !== 'welcome' && (
                          <div className="ai-chat__msg-actions">
                            {message.role === 'user' && (
                              <button
                                type="button"
                                aria-label="Edit message"
                                title="Edit"
                                disabled={loading}
                                onClick={() => startEdit(message)}
                              >
                                <Pencil size={13} strokeWidth={2} />
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label="Delete message"
                              title="Delete"
                              disabled={loading}
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 size={13} strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="ai-chat__bubble ai-chat__bubble--assistant">
                    <p className="ai-chat__typing">Thinking…</p>
                  </div>
                )}
                {error && <p className="ai-chat__error">{error}</p>}
                <div ref={bottomRef} />
              </div>

              <p className="ai-chat__disclaimer">
                This AI does not replace a doctor or pharmacist.
              </p>

              <form className="ai-chat__composer" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about a product or need…"
                  maxLength={2000}
                  disabled={loading || Boolean(editingId)}
                  aria-label="Message the assistant"
                />
                <button
                  type="submit"
                  className="ai-chat__send"
                  disabled={loading || Boolean(editingId) || !input.trim()}
                  aria-label="Send message"
                >
                  <Send size={16} strokeWidth={2} />
                </button>
              </form>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        className="ai-chat__fab"
        aria-label={open ? 'Close AI chat' : 'Open AI chat'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X size={26} strokeWidth={2.25} />
        ) : (
          <Bot size={28} strokeWidth={2.25} aria-hidden />
        )}
      </button>
    </div>
  );
}
