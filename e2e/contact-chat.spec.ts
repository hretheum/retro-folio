import { test, expect } from '@playwright/test';

test.describe('Contact and Chat Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.retro-container', { state: 'visible' });
    await page.waitForTimeout(1500);
  });

  test('should submit contact form', async ({ page }) => {
    // Navigate to contact section
    await page.click('text=Contact');
    await page.waitForTimeout(500);
    
    // Fill out the contact form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'This is a test message.');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Thank you')).toBeVisible({ timeout: 10000 });
  });

  test('should interact with AI chat', async ({ page }) => {
    // Navigate to contact section
    await page.click('text=Contact');
    await page.waitForTimeout(500);
    
    // Open chat widget
    const chatToggle = await page.locator('.chat-toggle, [aria-label="Open chat"]');
    if (await chatToggle.isVisible()) {
      await chatToggle.click();
      await page.waitForTimeout(300);
    }
    
    // Send a message
    const chatInput = await page.locator('.chat-input input, .chat-input textarea');
    await chatInput.fill('Hello, what technologies do you work with?');
    await chatInput.press('Enter');
    
    // Wait for AI response
    await expect(page.locator('.chat-message').last()).toBeVisible({ timeout: 15000 });
  });
});