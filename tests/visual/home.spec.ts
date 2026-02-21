import { expect, test } from '@playwright/test';

test('home screen visual snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('main', { state: 'visible' });
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});
