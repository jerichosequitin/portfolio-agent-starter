import { readChatConfiguration, ChatConfigurationError } from '../lib/ai-config';

let contentValid = false;
try {
  const { portfolio } = await import('../lib/portfolio');
  const images = [portfolio.profile.image, ...portfolio.projects.map((project) => project.image)].filter(Boolean);
  const missing = [];
  for (const image of images) {
    if (image && !await Bun.file(new URL(`../public${image.src}`, import.meta.url)).exists()) missing.push(image.src);
  }
  if (missing.length) {
    console.error(`Missing portfolio images: ${missing.join(', ')}. Add them under public/images/ or remove the optional image fields.`);
    process.exitCode = 1;
  }
  console.log(`Portfolio content is valid: ${portfolio.projects.length} projects.`);
  contentValid = true;
} catch {
  console.error('Portfolio content is invalid. Check content/portfolio.json against lib/portfolio.ts, then run bun run test.');
}

try {
  const config = readChatConfiguration(process.env);
  console.log(`Chat configuration is present for ${config.provider}. No live model request was made.`);
  console.log('Verify the model, provider budget, and deployed rate limit before sharing chat publicly.');
} catch (error) {
  console.log(error instanceof ChatConfigurationError ? error.message : 'Chat configuration could not be checked.');
  console.log('The portfolio can still run without chat. See docs/deployment.md.');
}

console.log('Next: bun run check, then bun run dev for a local preview.');
if (!contentValid) process.exitCode = 1;
