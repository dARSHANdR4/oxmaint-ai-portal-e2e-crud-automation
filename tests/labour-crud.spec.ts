import { test } from '@playwright/test';
import { LabourPage } from '../e2e/pages/LabourPage';

test.describe('Labour - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const name = `Auto Labour ${Date.now()}`;

  test('1. CREATE - New Labour Entry', async ({ page }) => {
    const labourPage = new LabourPage(page);
    await labourPage.createLabour(name);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const labourPage = new LabourPage(page);
    await labourPage.readLabour(name);
  });

  test('3. UPDATE - Edit Description', async ({ page }) => {
    const labourPage = new LabourPage(page);
    await labourPage.editLabour(name, `Updated by automation at ${Date.now()}`);
  });

  test('4. DELETE - Mark Inactive', async ({ page }) => {
    const labourPage = new LabourPage(page);
    await labourPage.deleteLabour(name);
  });
});
