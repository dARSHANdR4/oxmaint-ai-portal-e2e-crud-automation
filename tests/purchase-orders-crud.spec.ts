import { test } from '@playwright/test';
import { PurchaseOrdersPage } from '../e2e/pages/PurchaseOrdersPage';

test.describe('Purchase Orders - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const title = `Auto PO ${Date.now()}`;

  test('1. CREATE - New Purchase Order', async ({ page }) => {
    const poPage = new PurchaseOrdersPage(page);
    await poPage.createPurchaseOrder(title);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const poPage = new PurchaseOrdersPage(page);
    await poPage.readPurchaseOrder(title);
  });

  test('3. UPDATE - Edit Title', async ({ page }) => {
    const poPage = new PurchaseOrdersPage(page);
    await poPage.editPurchaseOrder(title, `${title} Updated`);
  });

  test('4. DELETE - Delete Purchase Order', async ({ page }) => {
    const poPage = new PurchaseOrdersPage(page);
    await poPage.deletePurchaseOrder(`${title} Updated`);
  });
});
