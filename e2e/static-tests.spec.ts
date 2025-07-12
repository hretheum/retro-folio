import { test, expect } from '@playwright/test';
import { existsSync } from 'fs';
import { join } from 'path';

test.describe('Static Tests - No Server Required', () => {
  test('build output should exist', async () => {
    const distPath = join(process.cwd(), 'dist');
    const indexPath = join(distPath, 'index.html');
    
    expect(existsSync(distPath)).toBeTruthy();
    expect(existsSync(indexPath)).toBeTruthy();
  });

  test('should test basic page structure from file', async ({ page }) => {
    const filePath = `file://${join(process.cwd(), 'dist', 'index.html')}`;
    
    await page.goto(filePath);
    
    // Check basic structure
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check if root div exists
    const rootDiv = await page.locator('#root');
    await expect(rootDiv).toBeVisible();
  });

  test('source files should exist', async () => {
    const files = [
      'src/App.tsx',
      'src/components/Hero.tsx',
      'src/components/Contact.tsx',
      'src/components/Navigation.tsx',
      'lib/chat-intelligence.ts',
      'lib/unified-intelligent-chat.ts'
    ];
    
    for (const file of files) {
      const filePath = join(process.cwd(), file);
      expect(existsSync(filePath)).toBeTruthy();
    }
  });

  test('API endpoints should be configured', async () => {
    const apiPath = join(process.cwd(), 'api', 'ai', 'chat.ts');
    expect(existsSync(apiPath)).toBeTruthy();
  });

  test('test files should pass basic validation', async () => {
    const testFiles = [
      'lib/chat-intelligence.test.ts',
      'lib/unified-intelligent-chat.test.ts',
      'lib/end-to-end-tests.test.ts'
    ];
    
    for (const file of testFiles) {
      const filePath = join(process.cwd(), file);
      expect(existsSync(filePath)).toBeTruthy();
    }
  });
});