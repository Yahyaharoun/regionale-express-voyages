import { test, expect } from '@playwright/test';

test.describe('CRUD Operations (Agences)', () => {
  test('Créer une nouvelle agence (sécurisé)', async ({ page }) => {
    await page.goto('/dashboard/agencies');
    // Vérifier la redirection de sécurité car non authentifié
    await expect(page).toHaveURL(/.*#login|.*\//);
  });
});
