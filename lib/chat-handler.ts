import { ChatConfigurationError } from './ai-config';
import { ChatRequestError, readChatRequest, type ChatMessage } from './chat-request';

export type GenerateReply = (messages: ChatMessage[], signal: AbortSignal) => AsyncIterable<string>;

const unavailable = 'Chat is unavailable right now. Please try again later or use the contact link.';
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

// The injectable generator keeps the HTTP contract testable without credentials or paid requests.
export async function handleChat(request: Request, generate: GenerateReply): Promise<Response> {
  const cancellation = new AbortController();
  const signal = AbortSignal.any([request.signal, cancellation.signal, AbortSignal.timeout(30000)]);
  let iterator: AsyncIterator<string> | undefined;
  try {
    const messages = await readChatRequest(request);
    iterator = generate(messages, signal)[Symbol.asyncIterator]();
    // Wait for the first output so an unavailable model returns an HTTP error, not an empty success.
    const first = await iterator.next();
    if (first.done) throw new Error('Empty model response');
    const encoder = new TextEncoder();
    const reply = iterator;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(encoder.encode(first.value)); },
      async pull(controller) {
        try {
          const part = await reply.next();
          if (part.done) controller.close();
          else controller.enqueue(encoder.encode(part.value));
        } catch {
          cancellation.abort();
          controller.error(new Error(unavailable));
          await reply.return?.();
        }
      },
      async cancel() {
        cancellation.abort();
        await reply.return?.();
      },
    });
    return new Response(stream, { headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    cancellation.abort();
    await iterator?.return?.();
    if (error instanceof ChatRequestError) {
      return Response.json({ error: error.message }, { status: error.status, headers });
    }
    return Response.json({ error: unavailable }, {
      status: error instanceof ChatConfigurationError ? 503 : 502,
      headers,
    });
  }
}
