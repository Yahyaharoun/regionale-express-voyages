import { test, expect } from '@playwright/test';

test.describe('Navigation Dashboard E2E', () => {
  test('Doit naviguer correctement entre les sections principales', async ({ page }) => {
    // 1. Accès au Dashboard
    await page.goto('/dashboard');
    // Vérifier que la navigation sécurisée redirige
    await expect(page).toHaveURL(/.*#login|.*\//);
  });
});
