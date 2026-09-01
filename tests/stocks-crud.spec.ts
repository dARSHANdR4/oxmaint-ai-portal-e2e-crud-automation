import { test } from '@playwright/test';
import { StocksPage } from '../e2e/pages/StocksPage';

test.describe('Stocks - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const storageLocation = `Auto Warehouse ${Date.now()}`;

  test('1. CREATE - New Stock', async ({ page }) => {
    const stocksPage = new StocksPage(page);
    await stocksPage.createStock(storageLocation);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const stocksPage = new StocksPage(page);
    await stocksPage.readStock(storageLocation);
  });

  test('3. UPDATE - Edit Storage Location', async ({ page }) => {
    const stocksPage = new StocksPage(page);
    await stocksPage.editStock(storageLocation, `${storageLocation} Updated`);
  });

  test('4. DELETE - Delete Stock', async ({ page }) => {
    const stocksPage = new StocksPage(page);
    await stocksPage.deleteStock(`${storageLocation} Updated`);
  });
});
