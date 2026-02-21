import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('@a11y home screen has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
