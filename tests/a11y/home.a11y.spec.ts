import { expect, test } from '../fixtures';

test('@a11y home screen has no accessibility violations', async ({ page, makeAxeBuilder }) => {
  await page.goto('/');
  await page.waitForSelector('main', { state: 'visible' });
  const results = await makeAxeBuilder().analyze();
  expect(results.violations).toEqual([]);
});
