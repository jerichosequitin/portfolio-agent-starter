'use client';

import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const MAX_INPUT_LENGTH = 1000;
const MAX_MESSAGES = 12;
const MAX_TOTAL_CONTENT = 16000;

function messageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function messagesForRequest(messages: Message[]) {
  const valid: Message[] = [];

  for (const message of messages) {
    const expectedRole = valid.length % 2 === 0 ? 'user' : 'assistant';
    if (message.role === expectedRole && message.content.trim()) valid.push(message);
  }

  let start = Math.max(0, valid.length - MAX_MESSAGES);
  if (valid[start]?.role === 'assistant') start += 1;
  let selected = valid.slice(start, start + MAX_MESSAGES);

  while (
    selected.length > 1 &&
    selected.reduce((total, message) => total + message.content.length, 0) > MAX_TOTAL_CONTENT
  ) {
    selected = selected.slice(2);
  }

  return selected.map(({ role, content }) => ({ role, content }));
}

export function ChatPanel({ name }: { name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [entryInput, setEntryInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [error, setError] = useState('');
  const [failedMessages, setFailedMessages] = useState<Message[] | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestGenerationRef = useRef(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const entryInputId = useId();

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    dialogRef.current.showModal();
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => () => {
    requestGenerationRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  function closePanel() {
    if (dialogRef.current?.open) dialogRef.current.close();
    setIsOpen(false);
    requestAnimationFrame(() => (returnFocusRef.current ?? triggerRef.current)?.focus());
  }

  function openPanel(origin: HTMLElement, question?: string) {
    returnFocusRef.current = origin;
    setIsOpen(true);
    if (!question?.trim() || status !== 'idle') return;

    const nextMessages = [...messages, { id: messageId(), role: 'user' as const, content: question.trim() }];
    setMessages(nextMessages);
    setEntryInput('');
    void requestReply(nextMessages);
  }

  function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const field = event.currentTarget.elements.namedItem('question');
    if (field instanceof HTMLInputElement) openPanel(field, entryInput);
  }

  async function requestReply(requestMessages: Message[]) {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    const requestGeneration = requestGenerationRef.current + 1;
    requestGenerationRef.current = requestGeneration;
    abortControllerRef.current = controller;
    setStatus('sending');
    setError('');
    setFailedMessages(null);

    const isCurrentRequest = () => requestGenerationRef.current === requestGeneration;

    let activeDraftId: string | null = null;
    let completeText = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForRequest(requestMessages),
        }),
        signal: controller.signal,
      });
      if (!isCurrentRequest()) return;

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: unknown } | null;
        if (!isCurrentRequest()) return;
        throw new Error(typeof body?.error === 'string' ? body.error : 'The assistant could not respond.');
      }

      if (!response.body) throw new Error('The assistant returned an empty response.');

      activeDraftId = messageId();
      setMessages([...requestMessages, { id: activeDraftId, role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (!isCurrentRequest()) return;
        if (done) break;
        completeText += decoder.decode(value, { stream: true });
        setMessages([...requestMessages, { id: activeDraftId, role: 'assistant', content: completeText }]);
      }

      completeText += decoder.decode();
      if (!isCurrentRequest()) return;
      if (!completeText.trim()) throw new Error('The assistant returned an empty response.');
      setMessages([...requestMessages, { id: activeDraftId, role: 'assistant', content: completeText }]);
      setStatus('idle');
    } catch (requestError) {
      if (!isCurrentRequest()) return;

      if (controller.signal.aborted) {
        if (activeDraftId && completeText.trim()) {
          setMessages([...requestMessages, { id: activeDraftId, role: 'assistant', content: completeText }]);
          setStatus('idle');
          setError('');
        } else {
          setMessages(requestMessages);
          setStatus('error');
          setError('Response stopped. You can retry the message.');
          setFailedMessages(requestMessages);
        }
      } else {
        setMessages(requestMessages);
        setStatus('error');
        setError(requestError instanceof Error ? requestError.message : 'The assistant could not respond.');
        setFailedMessages(requestMessages);
      }
    } finally {
      if (isCurrentRequest() && abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }

  function sendMessage() {
    const content = input.trim();
    if (!content || status === 'sending' || content.length > MAX_INPUT_LENGTH) return;

    const nextMessages = [...messages, { id: messageId(), role: 'user' as const, content }];
    setMessages(nextMessages);
    setInput('');
    void requestReply(nextMessages);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  }

  function containDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusable[0];
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function clearChat() {
    requestGenerationRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages([]);
    setInput('');
    setError('');
    setFailedMessages(null);
    setStatus('idle');
    inputRef.current?.focus();
  }

  return (
    <section className="assistant-band" aria-labelledby="assistant-intro-title">
      <div className="page-shell assistant-entry">
        <div>
          <h2 id="assistant-intro-title">
            <button
              className="assistant-heading-trigger"
              type="button"
              ref={triggerRef}
              aria-label="A little more curious? Ask about the portfolio"
              aria-expanded={isOpen}
              aria-controls="portfolio-chat"
              onClick={(event) => openPanel(event.currentTarget)}
            >
              A little more curious?
            </button>
          </h2>
          <p>Ask my portfolio assistant about the work behind the work.</p>
        </div>
        <div>
          <form className="assistant-form" onSubmit={submitEntry}>
            <label className="sr-only" htmlFor={entryInputId}>Ask the portfolio assistant</label>
            <input
              id={entryInputId}
              name="question"
              value={entryInput}
              maxLength={MAX_INPUT_LENGTH}
              placeholder="What would you like to know?"
              onChange={(event) => setEntryInput(event.target.value)}
            />
            <button type="submit" aria-label="Ask question"><ArrowRight size={26} weight="thin" aria-hidden="true" /></button>
          </form>
          <button className="assistant-suggestion" type="button" onClick={(event) => openPanel(event.currentTarget, 'How do you approach a project?')}>
            Try: How do you approach a project?
          </button>
        </div>
      </div>

      {isOpen ? (
        <dialog
          ref={dialogRef}
          className="chat-panel"
          id="portfolio-chat"
          aria-labelledby="chat-title"
          onKeyDown={containDialogFocus}
          onCancel={(event) => {
            event.preventDefault();
            closePanel();
          }}
        >
          <div className="chat-header">
            <div>
              <h2 id="chat-title">Portfolio assistant</h2>
              <p>Ask a question about {name}’s work.</p>
            </div>
            <button className="icon-button" type="button" onClick={closePanel}>Close</button>
          </div>

          <div className="chat-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 ? (
              <p className="chat-empty">Ask about this portfolio or ways to get in touch.</p>
            ) : messages.map((message) => (
              <div className={`message message-${message.role}`} key={message.id}>
                <span>{message.role === 'user' ? 'You' : 'Assistant'}</span>
                <p>{message.content || 'Responding...'}</p>
              </div>
            ))}
          </div>

          <div className="chat-controls">
            <div className="chat-status" role="status" aria-live="polite">
              {status === 'sending' ? 'Assistant is responding.' : null}
              {status === 'error' ? error : null}
            </div>
            {status === 'error' && failedMessages ? (
              <button className="text-button" type="button" onClick={() => void requestReply(failedMessages)}>Retry</button>
            ) : null}
            <form onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor={inputId}>Message</label>
              <textarea
                id={inputId}
                ref={inputRef}
                value={input}
                maxLength={MAX_INPUT_LENGTH}
                rows={2}
                placeholder="Ask a question"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                readOnly={status !== 'idle'}
                aria-disabled={status !== 'idle'}
              />
              <div className="composer-actions">
                <span>{input.length}/{MAX_INPUT_LENGTH}</span>
                {status === 'sending' ? (
                  <button type="button" className="secondary-button" onClick={() => abortControllerRef.current?.abort()}>Stop</button>
                ) : (
                  <button type="submit" disabled={!input.trim() || status === 'error'}>Send</button>
                )}
              </div>
            </form>
            <div className="chat-footer">
              <p>Messages go to the configured AI provider. This application does not save this conversation.</p>
              <button className="text-button" type="button" onClick={clearChat} disabled={messages.length === 0}>Clear chat</button>
            </div>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}
