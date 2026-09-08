import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import content from '../content/portfolio.json';

test('portfolio content is responsive and accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(content.profile.intro);
  await expect(page.getByRole('link', { name: `Email ${content.profile.name.split(' ')[0]}` })).toHaveAttribute('href', `mailto:${content.profile.email}`);
  for (const project of content.projects) await expect(page.getByRole('heading', { name: project.title })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('portfolio.png'), fullPage: true });
});

test('chat sends bounded history, renders text safely, and restores focus', async ({ page }) => {
  let requestBody: { messages: { role: string; content: string }[] } | undefined;
  const reply = `The featured project is ${content.projects[0].title}. <script>window.compromised = true</script>`;
  await page.route('**/api/chat', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({ contentType: 'text/plain; charset=utf-8', body: reply });
  });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Ask about the portfolio' });
  await trigger.click();
  const composer = page.getByRole('textbox', { name: 'Message' });
  await expect(composer).toBeFocused();
  await composer.fill('Tell me about a project.');
  await composer.press('Enter');
  await expect(page.getByRole('log')).toContainText(reply);
  expect(requestBody).toEqual({ messages: [{ role: 'user', content: 'Tell me about a project.' }] });
  expect(await page.evaluate(() => 'compromised' in window)).toBe(false);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('chat.png'), fullPage: true });
  await composer.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('disabled chat fails clearly and can be cleared for a new question', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask about the portfolio' }).click();
  await page.getByRole('textbox', { name: 'Message' }).fill('What is on this portfolio?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Chat is unavailable');
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear chat' }).click();
  await expect(page.getByRole('textbox', { name: 'Message' })).toBeEnabled();
  await expect(page.getByRole('log')).toContainText('Try asking');
});

test('clear cancels an in-flight response and a new question keeps its own state', async ({ page }) => {
  let requestCount = 0;
  let releaseFirst: (() => void) | undefined;
  await page.route('**/api/chat', async (route) => {
    requestCount++;
    if (requestCount === 1) {
      await new Promise<void>((resolve) => { releaseFirst = resolve; });
      await route.fulfill({ contentType: 'text/plain', body: 'Stale reply' }).catch(() => {});
    } else {
      await route.fulfill({ contentType: 'text/plain', body: 'New reply' });
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask about the portfolio' }).click();
  const composer = page.getByRole('textbox', { name: 'Message' });
  await composer.fill('First question');
  await composer.press('Enter');
  await expect.poll(() => requestCount).toBe(1);
  await page.getByRole('button', { name: 'Clear chat' }).click();
  await composer.fill('New question');
  await composer.press('Enter');
  releaseFirst?.();
  await expect(page.getByRole('log')).toContainText('New reply');
  await expect(page.getByRole('log')).not.toContainText('Stale reply');
  await expect(page.getByRole('log')).not.toContainText('First question');
  await expect(composer).toBeEnabled();
});
