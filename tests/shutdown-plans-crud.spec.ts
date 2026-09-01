import { test } from '@playwright/test';
import { ShutdownPlanPage } from '../e2e/pages/ShutdownPlanPage';

test.describe('Shutdown Plans - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const name = `Auto Shutdown Plan ${Date.now()}`;

  test('1. CREATE - New Shutdown Plan', async ({ page }) => {
    const shutdownPage = new ShutdownPlanPage(page);
    await shutdownPage.createShutdownPlan(name);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const shutdownPage = new ShutdownPlanPage(page);
    await shutdownPage.readShutdownPlan(name);
  });

  test('3. UPDATE - Edit Name', async ({ page }) => {
    const shutdownPage = new ShutdownPlanPage(page);
    await shutdownPage.editShutdownPlan(name, `${name} Updated`);
  });

  test('4. DELETE - Confirm Delete Is Unavailable', async ({ page }) => {
    const shutdownPage = new ShutdownPlanPage(page);
    await shutdownPage.confirmDeleteUnavailable(`${name} Updated`);
  });
});
