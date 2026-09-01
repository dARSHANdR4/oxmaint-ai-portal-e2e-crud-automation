import { test } from '@playwright/test';
import { VendorsPage } from '../e2e/pages/VendorsPage';

test.describe('Vendors - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const name = `Auto Vendor ${Date.now()}`;

  test('1. CREATE - New Vendor', async ({ page }) => {
    const vendorsPage = new VendorsPage(page);
    await vendorsPage.createVendor(name);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const vendorsPage = new VendorsPage(page);
    await vendorsPage.readVendor(name);
  });

  test('3. UPDATE - Edit Address', async ({ page }) => {
    const vendorsPage = new VendorsPage(page);
    await vendorsPage.editVendor(name, `456 Updated Ave ${Date.now()}`);
  });

  test('4. DELETE - Delete Vendor', async ({ page }) => {
    const vendorsPage = new VendorsPage(page);
    await vendorsPage.deleteVendor(name);
  });
});
