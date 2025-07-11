import { test, expect } from '@playwright/test';

test.describe('Basic Tests', () => {
  test('should load homepage', async ({ page }) => {
    // Try different ports
    const ports = [5173, 5174, 3000, 8080];
    let loaded = false;
    
    for (const port of ports) {
      try {
        await page.goto(`http://localhost:${port}`, { 
          timeout: 5000,
          waitUntil: 'domcontentloaded' 
        });
        loaded = true;
        console.log(`Successfully loaded on port ${port}`);
        break;
      } catch (e) {
        console.log(`Failed to load on port ${port}`);
      }
    }
    
    expect(loaded).toBeTruthy();
    
    // Check if basic elements exist
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});