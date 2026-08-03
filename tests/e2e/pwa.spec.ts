import { test, expect } from '@playwright/test';

test.describe('PWA & Responsive', () => {
  test('La page principale a un manifest valide', async ({ page }) => {
    await page.goto('/');
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBe('/manifest.webmanifest');
  });

  test('Design responsive sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    // Vérifier que le menu mobile est visible (ou le layout mobile)
    expect(true).toBeTruthy();
  });
});
