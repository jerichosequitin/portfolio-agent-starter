# Portfolio Agent Starter

A warm, editorial portfolio with an optional AI assistant. Your portfolio and
the concierge share one validated JSON file, so visitors see the same facts whether
they browse the page or ask a question.

The starter uses Next.js 16, React 19, TypeScript, Bun, and the AI SDK. It has no
database, authentication, CMS, vector store, or transcript persistence. The sample
content describes a fictional person named Alex Morgan and is meant to be replaced.

## Start with an agent

Open this repository in your coding agent and use this prompt:

> Inspect `AGENTS.md` and `content/portfolio.json`. Ask me for the facts and visual
> preferences needed to make this portfolio mine. Update the content and styling,
> preserve the chat and validation contracts, run `bun run check` and
> `bun run test:e2e`, show me a local preview, then help me deploy through my own
> Vercel account. Confirm the target account and project before deploying.

No global agent plugin is required. The repository instructions and ordinary shell,
editor, and browser tools are enough.

## Run locally

Requirements: Bun 1.4 or newer and Node.js 22 or newer.

```bash
bun install --frozen-lockfile
cp .env.example .env.local
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The portfolio works with chat
disabled, which is the default.

Edit `content/portfolio.json` to replace the fictional content. The application
validates this file during startup and build. Keep public facts in the content file,
components responsible for presentation, and styles in CSS.
The visual theme lives in the tokens near the top of `app/globals.css`: `--paper`
and `--paper-deep` set the backgrounds, `--ink` sets the main text and buttons, and
`--accent` and `--accent-dark` set supporting accents. Cormorant Garamond is bundled
locally, so builds and visitors do not depend on a remote font service.

The optional `profile.headline` has `text` and `emphasis` fields. Remove it to use
the introduction as the main heading. The hero and each project accept an optional
`image` with a local `src` and descriptive `alt`. Put your images in `public/images/`
and refer to them as `/images/your-image.webp`. WebP, AVIF, PNG, and JPEG are supported;
use simple filenames with letters, numbers, hyphens, or underscores. Remove an
`image` field to use a layout without that image. `bun run doctor` catches missing
image files.

The bundled artwork is AI-generated illustration for the fictional sample projects.
Replace it with your own work or remove it when personalizing. It is not evidence of
real products, clients, or research. See [asset credits](public/images/README.md).

Useful commands:

```bash
bun run doctor       # check local configuration without exposing secrets
bun run check        # lint, typecheck, unit tests, and production build
bun run test:e2e     # desktop, mobile, and accessibility browser checks
bun run start        # serve a completed production build
```

Browser checks save desktop and mobile screenshots under `test-results/`. Inspect
those images as part of a visual change; automated checks cannot judge composition.

## Enable the concierge

Chat stays off until `CHAT_ENABLED=true`. Before enabling it on a public deployment:

1. Choose and fund a provider account.
2. Set a provider or project budget. Treat provider budgets as soft limits because
   the request that crosses a threshold can still complete.
3. Add a Vercel WAF rate-limit rule for `/api/chat`, counted by source IP.
4. Set the environment variables for your provider, redeploy, and run one bounded
   live smoke test.

Vercel AI Gateway is the default provider. Vercel deployments can authenticate with
the project's automatic OIDC token. Local development and hosting outside Vercel use
`AI_GATEWAY_API_KEY`. OpenRouter uses `OPENROUTER_API_KEY`. Provider services may
process or retain prompts and responses according to their own settings and terms.

See [Deployment](docs/deployment.md) for the full setup and verification steps.

## Deploy

Both buttons create a copy in your Git provider and a new Vercel project. Chat is
created disabled so you can configure cost and abuse controls before making it live.

[![Deploy with Vercel using AI Gateway](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjerichosequitin%2Fportfolio-agent-starter&project-name=portfolio-agent-starter&repository-name=portfolio-agent-starter&env=CHAT_PROVIDER%2CCHAT_ENABLED%2CAI_MODEL&envDefaults=%7B%22CHAT_PROVIDER%22%3A%22gateway%22%2C%22CHAT_ENABLED%22%3A%22false%22%2C%22AI_MODEL%22%3A%22openai%2Fgpt-4.1-mini%22%7D&envDescription=Chat%20is%20disabled%20until%20you%20configure%20a%20provider%20budget%20and%20a%20rate-limit%20rule.)

[![Deploy with Vercel using OpenRouter](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjerichosequitin%2Fportfolio-agent-starter&project-name=portfolio-agent-starter&repository-name=portfolio-agent-starter&env=CHAT_PROVIDER%2CCHAT_ENABLED%2CAI_MODEL%2COPENROUTER_API_KEY&envDefaults=%7B%22CHAT_PROVIDER%22%3A%22openrouter%22%2C%22CHAT_ENABLED%22%3A%22false%22%2C%22AI_MODEL%22%3A%22openai%2Fgpt-4.1-mini%22%7D&envDescription=Add%20an%20OpenRouter%20API%20key.%20Chat%20remains%20disabled%20until%20you%20also%20configure%20provider%20and%20rate-limit%20controls.&envLink=https%3A%2F%2Fopenrouter.ai%2Fsettings%2Fkeys)

## How it works

- `content/portfolio.json` is the only source of portfolio facts.
- `lib/portfolio.ts` validates that content and exports a typed value.
- The page renders the content statically.
- `POST /api/chat` grounds replies in the same content and streams plain UTF-8 text.
- Conversation state lives only in React memory for the current visit.

Read [Architecture](docs/architecture.md), [Deployment](docs/deployment.md), and
[Agent workflow](docs/agent-workflow.md) for the contracts worth preserving.

## License

[MIT](LICENSE)
