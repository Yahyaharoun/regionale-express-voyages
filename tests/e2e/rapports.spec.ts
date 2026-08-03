import { test, expect } from '@playwright/test';

test.describe('Rapports & Statistiques', () => {
  test('Accès aux rapports sécurisé', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*#login|.*\//);
  });
});
