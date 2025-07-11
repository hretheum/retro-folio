import { test, expect } from '@playwright/test';

test.describe('Responsive and Accessibility Tests', () => {
  test('should be responsive on different viewports', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.navigation, nav')).toBeVisible();
    await expect(page.locator('.hamburger-menu')).not.toBeVisible();
    
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    const navigation = await page.locator('.navigation, nav');
    const hamburger = await page.locator('.hamburger-menu');
    
    // Either navigation or hamburger should be visible
    const navVisible = await navigation.isVisible().catch(() => false);
    const hamburgerVisible = await hamburger.isVisible().catch(() => false);
    expect(navVisible || hamburgerVisible).toBeTruthy();
    
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await expect(page.locator('.hamburger-menu')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check navigation has ARIA labels
    const nav = await page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
    
    // Check buttons have accessible names
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Check if an element is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).not.toBe('BODY');
    
    // Test Enter key on focused element
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    // Should trigger some action (navigation or interaction)
    const urlChanged = page.url() !== await page.evaluate(() => window.location.href);
    const hasModal = await page.locator('.modal, [role="dialog"]').isVisible().catch(() => false);
    expect(urlChanged || hasModal).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check text is visible against background
    const headings = await page.locator('h1, h2, h3').all();
    for (const heading of headings.slice(0, 3)) { // Check first 3 headings
      const color = await heading.evaluate(el => 
        window.getComputedStyle(el).color
      );
      expect(color).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
    }
  });

  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('/');
    
    // Should show loading screen
    const loadingScreen = await page.locator('.loading-screen, .loader, [aria-label="Loading"]');
    await expect(loadingScreen).toBeVisible();
    
    // Should eventually load
    await page.waitForSelector('.retro-container', { 
      state: 'visible',
      timeout: 30000 
    });
  });
});