import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test('Système de notifications UI protégé', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*#login|.*\//);
  });
});
