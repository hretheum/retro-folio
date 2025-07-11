import { test, expect } from '@playwright/test';

test.describe('Portfolio Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
  });

  test('should display portfolio projects', async ({ page }) => {
    // Check if portfolio grid is visible
    await expect(page.locator('.portfolio-grid, .projects-grid')).toBeVisible();
    
    // Check if there are project cards
    const projectCards = await page.locator('.project-card, .portfolio-item').count();
    expect(projectCards).toBeGreaterThan(0);
  });

  test('should filter projects by category', async ({ page }) => {
    // Look for filter buttons
    const filterButtons = await page.locator('button').filter({ hasText: /All|Web|Mobile|Design/i });
    
    if (await filterButtons.first().isVisible()) {
      // Click on a filter
      await page.click('button:has-text("Web")');
      await page.waitForTimeout(300);
      
      // Check if projects are filtered
      const visibleProjects = await page.locator('.project-card:visible, .portfolio-item:visible').count();
      expect(visibleProjects).toBeGreaterThan(0);
    }
  });

  test('should open project details', async ({ page }) => {
    // Click on first project
    await page.locator('.project-card, .portfolio-item').first().click();
    await page.waitForTimeout(500);
    
    // Check if we navigated to case study or project detail
    const url = page.url();
    expect(url).toMatch(/\/(case|experiment)\//);
    
    // Check if project details are visible
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should have working back navigation', async ({ page }) => {
    // Click on a project
    await page.locator('.project-card, .portfolio-item').first().click();
    await page.waitForLoadState('networkidle');
    
    // Click back button
    await page.click('button:has-text("Back"), a:has-text("Back")');
    await page.waitForTimeout(500);
    
    // Should be back at portfolio
    await expect(page).toHaveURL('/portfolio');
  });
});