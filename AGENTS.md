# Agent Guide

This repository is a public starter for a personal portfolio with an optional AI
concierge. Keep it understandable and portable for one owner.

## Commands

Use Bun from the repository root.

```bash
bun install --frozen-lockfile
bun run dev
bun run build
bun run start
bun run doctor
bun run typecheck
bun run lint
bun run test
bun run test:e2e
bun run check
```

`bun run check` runs lint, typecheck, unit tests, and the production build.
`bun run test:e2e` separately covers desktop, mobile, and accessibility behavior.
CI must pass without live AI credentials. Provider tests use test doubles.

## File map

- `content/portfolio.json`: public owner facts and the single content source
- `lib/portfolio.ts`: schema, validation, and typed content export
- `app/`: App Router pages, metadata, global styles, and API route
- `components/`: presentation and client interaction, with no owner facts
- `lib/ai-config.ts` and `lib/chat-*.ts`: server-only provider and chat policy
- `tests/`: unit tests
- `e2e/`: Playwright desktop, mobile, and accessibility checks
- `docs/architecture.md`: system boundaries and tradeoffs
- `docs/deployment.md`: provider, rate-limit, rollout, and recovery steps

## Content contract

Replace the fictional Alex Morgan data in `content/portfolio.json`. Preserve this
shape unless the task explicitly changes the public contract:

- `profile`: `name`, `role`, `intro`, `location`, `email`, `availability`, `links`
- `about`: an array of paragraphs
- `experience`: entries with `role`, `organization`, `period`, and `summary`
- `projects`: entries with `title`, `summary`, `tags`, and optional `url`

The static page and chat grounding must import the validated value from
`lib/portfolio.ts`. Do not duplicate owner facts in components, prompts, or tests.

## Chat contract

- `POST /api/chat` accepts only `{ messages: [{ role, content }] }`.
- Roles are `user` or `assistant` only.
- Stream successful replies as plain UTF-8 text. Return sanitized JSON errors.
- Limit the latest user message to 1,000 characters, the request to 12 messages,
  and total message content to 16,000 characters.
- Limit model output to 512 tokens and provider work to 30 seconds.
- Ground replies only in validated portfolio content. Admit uncertainty for unknown
  facts and direct visitors to the published owner contact for follow-up.
- Do not add model tools, external actions, transcript storage, a database, auth,
  a CMS, or RAG without an explicit requirement.
- Keep credentials server-only. Never expose secret values through client bundles,
  logs, errors, fixtures, documentation, or screenshots.

Conversation state is React memory for the current page visit. Do not imply that
this prevents the selected provider from processing or logging requests.

## Implementation rules

- Use Next.js App Router, React, TypeScript, hand-written CSS, and existing packages.
- Keep public content, presentation, and server chat concerns separate.
- Prefer small direct changes over new frameworks or infrastructure.
- The portfolio must remain usable when chat is disabled or misconfigured.
- A production build must not fetch remote fonts or call a model.
- Preserve keyboard use, visible focus, semantic structure, responsive layout,
  reduced-motion behavior, and readable contrast.
- Use 2-space indentation and single quotes in TypeScript and JavaScript.
- Do not use emojis or em and en dashes in repository content.
- Do not add private prompts, personalities, assets, histories, accounts, local
  paths, credentials, agent skills, or approval policies.

## Verification

Run focused tests while editing. Before handing off a completed change, run:

```bash
bun run check
bun run test:e2e
```

For visible changes, inspect desktop and mobile output in a browser. For provider
changes, keep CI credential-free and report the separate bounded live smoke test
that an owner still needs to run.

## Delivery boundaries

Repository tasks do not grant permission to commit, push, create or modify pull
requests, deploy, change provider settings, spend money, or use an owner's account.
Perform those actions only when the owner explicitly requests them and confirm the
target account, repository, project, and environment first.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev`. Verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
