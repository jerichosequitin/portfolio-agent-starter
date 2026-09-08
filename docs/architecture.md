# Architecture

Portfolio Agent Starter keeps the content model, page, and concierge in one Next.js
application. This makes the owner facts easy to review and avoids infrastructure that
a small portfolio does not need.

## Content flow

`content/portfolio.json` is the single source of public facts. `lib/portfolio.ts`
validates it with Zod and exports the typed result. Static portfolio components and
the server chat route consume that same value. Components contain layout and
interaction only, while CSS owns the visual system.

The schema has four sections:

- `profile`: identity, introduction, contact, availability, and public links
- `about`: one or more prose paragraphs
- `experience`: role, organization, period, and summary entries
- `projects`: title, summary, tags, and an optional public URL

Invalid content fails early during development, tests, or build instead of producing
a partially rendered portfolio or ungrounded chat context.

## Chat boundary

The browser sends `POST /api/chat` with this JSON shape:

```json
{
  "messages": [
    { "role": "user", "content": "What kind of work do you do?" }
  ]
}
```

Only `user` and `assistant` roles are accepted. The route limits a user message to
1,000 characters, accepts at most 12 messages and 16,000 total characters, limits
output to 512 tokens, and gives provider work 30 seconds. A successful response is a
plain UTF-8 text stream. Errors use sanitized JSON and never expose provider details
or credentials.

The server builds its grounding from validated portfolio content. It instructs the
model to acknowledge unknown facts and direct visitors to the portfolio contact when
follow-up is needed. The model receives no tools and cannot send messages, browse,
write data, or perform other external actions.

Conversation messages live in React memory and disappear when the page is reloaded
or closed. The application does not persist transcripts. The selected AI provider
still processes each request and may retain data according to its configuration and
terms.

## Provider boundary

`CHAT_PROVIDER` selects an explicitly supported adapter: `gateway` or `openrouter`.
`AI_MODEL` is passed to that adapter and defaults to `openai/gpt-4.1-mini`. This does
not imply that every model identifier works with every provider. Confirm the chosen
model in the current provider catalog.

Secrets remain in server environment variables. A Vercel deployment using AI
Gateway can use project OIDC. Local or non-Vercel Gateway use requires
`AI_GATEWAY_API_KEY`; OpenRouter requires `OPENROUTER_API_KEY`.

Chat is an optional enhancement. Missing or invalid chat configuration must leave
the static portfolio available and present a useful unavailable state in the chat UI.

## Deliberate limits

There is no database, authentication, CMS, RAG pipeline, analytics system, or
application transcript store. The starter also does not implement an in-memory
production quota because server instances do not share durable counters. Vercel
deployments require a WAF rule for `/api/chat`. Other hosts need an equivalent
distributed control, such as a shared rate limiter, before chat is public.
