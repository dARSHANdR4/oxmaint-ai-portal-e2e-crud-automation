import { test } from '@playwright/test';
import { ScrapsPage } from '../e2e/pages/ScrapsPage';

// NOTE: No delete functionality is reachable for scraps in the UI — the
// confirmation dialog and delete handler exist in source but nothing calls
// setScrapToDelete() to open it. So this is Create -> Read -> Update only.
test.describe('Scraps - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const description = `Auto Scrap ${Date.now()}`;

  test('1. CREATE - New Work Order Scrap', async ({ page }) => {
    const scrapsPage = new ScrapsPage(page);
    await scrapsPage.createScrap(description);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const scrapsPage = new ScrapsPage(page);
    await scrapsPage.readScrap(description);
  });

  test('3. UPDATE - Edit Description', async ({ page }) => {
    const scrapsPage = new ScrapsPage(page);
    await scrapsPage.editScrap(description, `${description} Updated`);
  });
});
