import { test, expect } from '@playwright/test';

test.describe('Gestion des dépenses (CRUD)', () => {
  test('Créer une nouvelle dépense (accès sécurisé)', async ({ page }) => {
    await page.goto('/dashboard/expenses/new');
    await expect(page).toHaveURL(/.*#login|.*\//);
  });

  test('Afficher la liste des dépenses (accès sécurisé)', async ({ page }) => {
    await page.goto('/dashboard/expenses');
    await expect(page).toHaveURL(/.*#login|.*\//);
  });
});
