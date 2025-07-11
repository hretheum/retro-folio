import { test, expect } from '@playwright/test';

test.describe('Guestbook Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.retro-container', { state: 'visible' });
    await page.waitForTimeout(1500);
    
    // Navigate to guestbook
    await page.click('text=Guestbook');
    await page.waitForTimeout(500);
  });

  test('should display guestbook entries', async ({ page }) => {
    // Check if guestbook section is visible
    const guestbook = await page.locator('#guestbook');
    await expect(guestbook).toBeVisible();
    
    // Check if there are existing entries or a message about no entries
    const entries = await page.locator('.guestbook-entry, .guest-message').count();
    const emptyMessage = await page.locator('text=/No entries yet|Be the first/i');
    
    expect(entries > 0 || await emptyMessage.isVisible()).toBeTruthy();
  });

  test('should submit a new guestbook entry', async ({ page }) => {
    // Fill out guestbook form
    await page.fill('input[name="guest-name"], input[placeholder*="name"]', 'Test Guest');
    await page.fill('textarea[name="guest-message"], textarea[placeholder*="message"]', 'This is a test entry from Playwright!');
    
    // Submit the form
    await page.click('button:has-text("Sign"), button:has-text("Submit"), button[type="submit"]');
    
    // Wait for submission
    await page.waitForTimeout(2000);
    
    // Check if entry was added
    await expect(page.locator('text=Test Guest')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=This is a test entry from Playwright!')).toBeVisible();
  });

  test('should validate guestbook form', async ({ page }) => {
    // Try to submit empty form
    await page.click('button:has-text("Sign"), button:has-text("Submit"), button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=/Name.*required|Please.*name/i')).toBeVisible();
    await expect(page.locator('text=/Message.*required|Please.*message/i')).toBeVisible();
  });

  test('should paginate through entries', async ({ page }) => {
    // Check if pagination exists
    const pagination = await page.locator('.pagination, nav[aria-label="Pagination"]');
    
    if (await pagination.isVisible()) {
      // Click next page
      await page.click('button:has-text("Next"), a:has-text("Next"), [aria-label="Next page"]');
      await page.waitForTimeout(500);
      
      // Should show different entries
      const firstEntryText = await page.locator('.guestbook-entry, .guest-message').first().textContent();
      
      // Go back to first page
      await page.click('button:has-text("Previous"), a:has-text("Previous"), [aria-label="Previous page"]');
      await page.waitForTimeout(500);
      
      // First entry should be different
      const newFirstEntryText = await page.locator('.guestbook-entry, .guest-message').first().textContent();
      expect(firstEntryText).not.toBe(newFirstEntryText);
    }
  });

  test('should work on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Guestbook should still be functional
    await page.fill('input[name="guest-name"], input[placeholder*="name"]', 'Mobile User');
    await page.fill('textarea[name="guest-message"], textarea[placeholder*="message"]', 'Testing from mobile device');
    
    // Submit should work
    await page.click('button:has-text("Sign"), button:has-text("Submit"), button[type="submit"]');
    
    // Wait for submission
    await page.waitForTimeout(2000);
    
    // Entry should be visible
    await expect(page.locator('text=Mobile User')).toBeVisible({ timeout: 10000 });
  });
});