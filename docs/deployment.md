# Deployment

Vercel is the primary hosting path. A conventional Node.js host can run the same
Next.js application, but the owner must supply equivalent secrets, timeouts, and
distributed abuse controls.

## 1. Verify the application

From the repository root:

```bash
bun install --frozen-lockfile
bun run doctor
bun run check
bun run test:e2e
```

The build and automated tests do not need AI credentials and do not call a model.

## 2. Create the Vercel project

Use one of the deploy buttons in `README.md`, or import your repository from the
Vercel dashboard. Confirm the Vercel account or team and project name before creating
the project. Leave `CHAT_ENABLED=false` for the first deployment.

The static portfolio should deploy and remain usable without provider credentials.

## 3. Configure a provider

Common variables:

| Variable | Value | Required |
| --- | --- | --- |
| `CHAT_ENABLED` | `false` until all controls are ready, then `true` | Yes |
| `CHAT_PROVIDER` | `gateway` or `openrouter` | Yes |
| `AI_MODEL` | Provider-supported model ID | No, defaults to `openai/gpt-4.1-mini` |

For Vercel AI Gateway, deployed functions can use the project's automatic OIDC
authentication. Set `AI_GATEWAY_API_KEY` only for local development or hosting where
Vercel OIDC is unavailable. Create credits or billing as needed and configure a
project, team, or API-key budget in AI Gateway. Budgets are soft limits: a request
that begins below the threshold can finish above it.

For OpenRouter, add `OPENROUTER_API_KEY` as a secret environment variable. Create a
dedicated, revocable key and configure the spending or credit controls available in
your OpenRouter account. Verify that `AI_MODEL` is offered through OpenRouter.

Do not prefix secrets with `NEXT_PUBLIC_`. Apply production secrets only to the
environments that need them.

## 4. Add the public rate limit

Before enabling chat, open the Vercel project and create a WAF rate-limiting rule:

- Match request path `/api/chat`.
- Count by source IP.
- Choose a threshold and window appropriate for a small public portfolio.
- Use the rate-limit action, then verify the rule is enabled for production.

The exact threshold depends on expected traffic and provider cost. Review WAF plan
limits and pricing in Vercel's current documentation. Provider budgets and request
validation complement this rule but do not replace it.

On another host, put equivalent distributed rate limiting in front of `/api/chat`.
Do not rely on an in-process map or counter in a horizontally scaled deployment.

## 5. Enable and verify

Set `CHAT_ENABLED=true` and redeploy. Then run a bounded live smoke test:

1. Load the production URL and confirm the portfolio content renders.
2. Ask one question whose answer appears in `content/portfolio.json`.
3. Ask one question whose answer is absent and confirm the reply admits uncertainty
   and offers the published contact path.
4. Confirm the response streams as text and no secret appears in browser output,
   server logs, or sanitized errors.
5. Confirm the deployment uses the intended revision, provider, model, and project.
6. Check provider usage and the WAF dashboard for the expected requests.

Automated tests use provider doubles. Passing CI is not evidence that a live key,
OIDC setup, model, budget, or WAF rule works.

## Disable or recover

Set `CHAT_ENABLED=false` and redeploy to remove model calls while keeping the
portfolio online. If a provider key may be exposed, disable chat first, revoke the
key in the provider, create a replacement, update the Vercel secret, and redeploy.

For a bad application release, use Vercel's rollback or promote a known good
deployment, then verify the active revision and portfolio. Changes to provider logs
or already processed requests are outside the application's rollback boundary.

Current references:

- [Vercel Deploy Button](https://vercel.com/docs/deploy-button)
- [AI Gateway authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok)
- [AI Gateway budgets](https://vercel.com/docs/ai-gateway/observability-and-spend/budgets)
- [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
