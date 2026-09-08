export type ChatProvider = 'gateway' | 'openrouter';

export interface ChatConfiguration {
  provider: ChatProvider;
  model: string;
  apiKey?: string;
}

export class ChatConfigurationError extends Error {}

export function readChatConfiguration(env: Record<string, string | undefined>): ChatConfiguration {
  if (env.CHAT_ENABLED !== 'true') {
    throw new ChatConfigurationError('Chat is disabled. Complete the deployment safeguards before setting CHAT_ENABLED=true.');
  }

  const provider = env.CHAT_PROVIDER?.trim() || 'gateway';
  if (provider !== 'gateway' && provider !== 'openrouter') {
    throw new ChatConfigurationError('CHAT_PROVIDER must be gateway or openrouter.');
  }

  const model = env.AI_MODEL?.trim() || 'openai/gpt-4.1-mini';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/:-]{1,150}$/.test(model)) {
    throw new ChatConfigurationError('AI_MODEL must be a valid provider model identifier.');
  }

  const apiKey = (provider === 'gateway' ? env.AI_GATEWAY_API_KEY : env.OPENROUTER_API_KEY)?.trim();
  // Vercel Functions supply OIDC through request context; the Gateway SDK resolves it.
  const gatewayOidcAvailable = env.VERCEL === '1' || Boolean(env.VERCEL_OIDC_TOKEN?.trim());
  if (!apiKey && !(provider === 'gateway' && gatewayOidcAvailable)) {
    throw new ChatConfigurationError(provider === 'gateway'
      ? 'Gateway requires AI_GATEWAY_API_KEY locally, or Vercel deployment OIDC authentication.'
      : 'OpenRouter requires OPENROUTER_API_KEY.');
  }

  return { provider, model, apiKey };
}
