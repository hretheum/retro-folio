import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('.retro-container', { state: 'visible' });
    await page.waitForTimeout(1500); // Wait for loading screen
  });

  test('should navigate through all sections', async ({ page }) => {
    // Define all sections
    const sections = [
      { name: 'Home', selector: '#hero' },
      { name: 'About Me', selector: '#leadership' },
      { name: 'My Work', selector: '#work' },
      { name: 'Timeline', selector: '#timeline' },
      { name: 'Cool Stuff', selector: '#experiments' },
      { name: 'Guestbook', selector: '#guestbook' },
      { name: 'Contact', selector: '#contact' }
    ];

    // Test navigation through each section
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Click on navigation item
      await page.click(`text=${section.name}`);
      
      // Wait for transition
      await page.waitForTimeout(500);
      
      // Check if the section is visible
      const sectionElement = await page.locator(section.selector);
      await expect(sectionElement).toBeVisible();
      
      // Verify URL hash if applicable
      if (i > 0) { // Skip home section
        await expect(page).toHaveURL(/#.*/, { timeout: 5000 });
      }
    }
  });

  test('should navigate using keyboard shortcuts', async ({ page }) => {
    // Test arrow down navigation
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    
    // Check if we moved to the next section
    const aboutSection = await page.locator('#leadership');
    await expect(aboutSection).toBeVisible();
    
    // Test arrow up navigation
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(500);
    
    // Check if we moved back to home
    const heroSection = await page.locator('#hero');
    await expect(heroSection).toBeVisible();
  });

  test('should show scroll progress indicator', async ({ page }) => {
    // Check if scroll progress bar exists
    const progressBar = await page.locator('.scroll-progress-bar');
    await expect(progressBar).toBeVisible();
    
    // Navigate to a different section and check if progress updates
    await page.click('text=My Work');
    await page.waitForTimeout(500);
    
    // Progress bar should have some width
    const progressFill = await page.locator('.scroll-progress-fill');
    const width = await progressFill.evaluate(el => el.style.width);
    expect(parseInt(width)).toBeGreaterThan(0);
  });

  test('should display section navigator', async ({ page }) => {
    // Check if section navigator exists
    const navigator = await page.locator('.section-navigator');
    await expect(navigator).toBeVisible();
    
    // Count navigation dots
    const dots = await page.locator('.section-navigator button').count();
    expect(dots).toBe(7); // 7 sections
    
    // Click on a dot to navigate
    await page.locator('.section-navigator button').nth(2).click();
    await page.waitForTimeout(500);
    
    // Should navigate to My Work section
    const workSection = await page.locator('#work');
    await expect(workSection).toBeVisible();
  });

  test('should work with hamburger menu on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Hamburger menu should be visible
    const hamburger = await page.locator('.hamburger-menu');
    await expect(hamburger).toBeVisible();
    
    // Click to open menu
    await hamburger.click();
    await page.waitForTimeout(300);
    
    // Menu should be open
    const menuOpen = await page.locator('.hamburger-menu.open');
    await expect(menuOpen).toBeVisible();
    
    // Click on a menu item
    await page.click('text=Contact');
    await page.waitForTimeout(500);
    
    // Should navigate to contact section and close menu
    const contactSection = await page.locator('#contact');
    await expect(contactSection).toBeVisible();
    
    // Menu should be closed
    const menuClosed = await page.locator('.hamburger-menu:not(.open)');
    await expect(menuClosed).toBeVisible();
  });
});