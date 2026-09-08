# Agent workflow

An agent can personalize this starter safely when it treats the owner as the source
for facts and preferences, then uses the repository contracts as implementation
constraints.

## Discovery

Read `AGENTS.md`, `content/portfolio.json`, and the current interface. Ask the owner
for missing facts and visual preferences in a compact group. Useful inputs include:

- name, role, introduction, location, public email, and availability
- public links, work history, projects, project URLs, and preferred emphasis
- color, type, density, tone, and examples of interfaces they like

Do not infer biography, employment, availability, or contact details. Do not copy
content, design, prompts, or assets from an unrelated private portfolio.

## Personalize

Replace the fictional data in `content/portfolio.json`. Keep all owner facts there so
the static page and concierge stay aligned. Change components for structure and CSS
for presentation. Keep credentials out of the repository.

Preserve the request validation, plain-text stream, sanitized errors, server-only
secrets, bounded output and timeout, factual grounding, uncertainty behavior, and
the portfolio's ability to work with chat disabled.

## Validate and preview

Run:

```bash
bun run check
bun run test:e2e
```

Preview the real application at desktop and mobile sizes. Check keyboard navigation,
focus visibility, contrast, reduced motion, content wrapping, links, chat disabled
behavior, and a provider-double chat response. Show the owner the preview and any
material assumptions that remain.

## Deploy with owner authority

Deployment uses the owner's repository, Vercel project, provider account, and budget.
Confirm those targets before making changes. Keep chat disabled through the first
deployment. Follow `docs/deployment.md` to configure provider access, cost controls,
and the `/api/chat` WAF rule. Enable chat only after those controls exist, then run
the bounded live smoke test.

Repository access alone does not authorize commits, pushes, pull requests,
deployments, account changes, purchases, or secret creation. Obtain a clear owner
request for those actions.
