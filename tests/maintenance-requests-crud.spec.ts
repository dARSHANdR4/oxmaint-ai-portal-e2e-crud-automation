import { test } from '@playwright/test';
import { MaintenanceRequestsPage } from '../e2e/pages/MaintenanceRequestsPage';

test.describe('Maintenance Requests - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const title = `Auto MR ${Date.now()}`;

  test('1. CREATE - New Maintenance Request', async ({ page }) => {
    const mrPage = new MaintenanceRequestsPage(page);
    await mrPage.createRequest(title, 'Automated request for testing.');
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const mrPage = new MaintenanceRequestsPage(page);
    await mrPage.readRequest(title);
  });

  test('3. UPDATE - Edit Description', async ({ page }) => {
    const mrPage = new MaintenanceRequestsPage(page);
    await mrPage.editRequest(title, `Updated by automation at ${Date.now()}`);
  });

  test('4. DELETE - Delete Request', async ({ page }) => {
    const mrPage = new MaintenanceRequestsPage(page);
    await mrPage.deleteRequest(title);
  });
});
