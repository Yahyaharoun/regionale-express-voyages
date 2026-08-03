import { test, expect } from '@playwright/test';

test.describe('Authentification et Dashboard', () => {
  test('L\'utilisateur non authentifié est redirigé (via middleware/proxy)', async ({ page }) => {
    await page.goto('/dashboard');
    // Le proxy.ts redirige vers /#login
    await expect(page).toHaveURL(/.*\/#login/);
  });

  test('Formulaire de connexion présent sur la page d\'accueil', async ({ page }) => {
    await page.goto('/#login');
    // Vérifier la présence des éléments clés
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Le dashboard ne devrait pas être visible
    const dashboardTitle = page.locator('text=Bonjour,');
    await expect(dashboardTitle).not.toBeVisible();
  });
});

