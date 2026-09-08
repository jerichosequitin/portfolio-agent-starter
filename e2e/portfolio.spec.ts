import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { portfolio as content } from '../lib/portfolio';

test('portfolio content is responsive and accessible', async ({ page }) => {
  await page.goto('/');
  const headline = content.profile.headline;
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(headline ? `${headline.text} ${headline.emphasis}` : content.profile.intro);
  await expect(page.getByRole('link', { name: `Email ${content.profile.name.split(' ')[0]}` })).toHaveAttribute('href', `mailto:${content.profile.email}`);
  for (const project of content.projects) await expect(page.getByRole('heading', { name: project.title, exact: false })).toBeVisible();
  for (const image of await page.locator('main img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('complete', true);
    expect(await image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  }
  await page.getByRole('link', { name: content.projects.length ? 'Explore my work' : 'A little about me' }).click();
  await expect(page).toHaveURL(content.projects.length ? /#projects$/ : /#about$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('portfolio.png'), fullPage: true });
});

test('inline question and suggestion open the same conversation and restore focus', async ({ page }) => {
  const requests: { messages: { role: string; content: string }[] }[] = [];
  await page.route('**/api/chat', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ contentType: 'text/plain', body: 'I work across product strategy, interface design, and engineering.' });
  });
  await page.goto('/');
  const entry = page.getByRole('textbox', { name: 'Ask the portfolio assistant' });
  await entry.fill('What kind of work do you do?');
  await entry.press('Enter');
  await expect(page.getByRole('log')).toContainText('I work across product strategy');
  await page.getByRole('textbox', { name: 'Message' }).press('Escape');
  await expect(entry).toBeFocused();
  const suggestion = page.getByRole('button', { name: 'Try: How do you approach a project?' });
  await suggestion.click();
  await expect(page.getByRole('log')).toContainText('How do you approach a project?');
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].messages.map((message) => message.role)).toEqual(['user', 'assistant', 'user']);
  expect(requests[1].messages.at(-1)?.content).toBe('How do you approach a project?');
  await expect(page.getByRole('status')).toBeEmpty();
  await page.getByRole('textbox', { name: 'Message' }).press('Escape');
  await expect(suggestion).toBeFocused();
});

test('chat sends bounded history, renders text safely, and restores focus', async ({ page }) => {
  let requestBody: { messages: { role: string; content: string }[] } | undefined;
  const reply = `This portfolio belongs to ${content.profile.name}. <script>window.compromised = true</script>`;
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
  await expect(page.getByRole('log')).toContainText('Ask about this portfolio');
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

test('mobile chat contains focus when empty and populated', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile focus containment regression');

  await page.route('**/api/chat', async (route) => {
    await route.fulfill({ contentType: 'text/plain; charset=utf-8', body: 'A concise answer.' });
  });
  await page.goto('/');

  const trigger = page.getByRole('button', { name: 'Ask about the portfolio' });
  const dialog = page.getByRole('dialog');
  const close = page.getByRole('button', { name: 'Close' });
  await trigger.click();

  const composer = page.getByRole('textbox', { name: 'Message' });
  await expect(composer).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(composer).toBeFocused();

  await composer.fill('First question');
  await composer.press('Enter');
  await expect(dialog).toContainText('A concise answer.');
  await expect(composer).toBeFocused();
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await composer.fill('Second question');

  const send = page.getByRole('button', { name: 'Send', exact: true });
  const clear = page.getByRole('button', { name: 'Clear chat' });
  await expect(composer).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(send).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(clear).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(clear).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(send).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(composer).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('focus-contained.png') });

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
