import { test, expect } from '@playwright/test';

test.describe('Sahara Frontend E2E', () => {
  test('should display assistant reply for sad message in mock mode', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[aria-label="Message"]', 'I feel sad');
    await page.click('button:text("Send")');
    await expect(page.locator('text=I hear you. Based on your mood (sad)')).toBeVisible();
  });
});
