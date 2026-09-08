import { z } from 'zod';

export const MAX_INPUT_LENGTH = 1000;
export const MAX_HISTORY_LENGTH = 12;
export const MAX_HISTORY_CHARACTERS = 16000;
const MAX_BODY_BYTES = 65536;

export const chatRequestSchema = z.object({
  messages: z.array(z.discriminatedUnion('role', [
    z.object({ role: z.literal('user'), content: z.string().trim().min(1).max(MAX_INPUT_LENGTH) }).strict(),
    z.object({ role: z.literal('assistant'), content: z.string().trim().min(1).max(8192) }).strict(),
  ])).min(1).max(MAX_HISTORY_LENGTH),
}).strict().superRefine(({ messages }, ctx) => {
  const tooLong = messages.reduce((length, message) => length + message.content.length, 0) > MAX_HISTORY_CHARACTERS;
  const invalidOrder = messages.some((message, index) => message.role !== (index % 2 === 0 ? 'user' : 'assistant'));
  if (tooLong || invalidOrder || messages.at(-1)?.role !== 'user') {
    ctx.addIssue({ code: 'custom', message: 'Send a bounded conversation ending with a visitor message.' });
  }
});

export type ChatMessage = z.infer<typeof chatRequestSchema>['messages'][number];

export class ChatRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function readChatRequest(request: Request): Promise<ChatMessage[]> {
  const origin = request.headers.get('origin');
  // Next.js can use its internal listening hostname in request.url. Browser Host
  // carries the public destination; do not substitute an arbitrary forwarded host.
  const destination = new URL(request.url);
  destination.host = request.headers.get('host') || destination.host;
  if ((origin && origin !== destination.origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ChatRequestError('Please send messages from this website.', 403);
  }
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    throw new ChatRequestError('Send a JSON message.', 415);
  }
  if (!request.body) throw new ChatRequestError('Enter a message first.', 400);

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new ChatRequestError('This conversation is too long. Start a new chat.', 413);
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  let parsed: unknown;
  try { parsed = JSON.parse(body); } catch {
    throw new ChatRequestError('The message could not be read. Please try again.', 400);
  }
  const result = chatRequestSchema.safeParse(parsed);
  if (!result.success) throw new ChatRequestError('Check the message length or start a new chat.', 400);
  return result.data.messages;
}
