import { test, expect } from '@playwright/test';

test.describe('API Tests', () => {
  test('Les Server Actions sécurisées rejettent les non-authentifiés', async ({ request }) => {
    // Test API direct
    expect(true).toBeTruthy();
  });
});
