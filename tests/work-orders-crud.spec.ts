import { test } from '@playwright/test';
import { WorkOrdersPage } from '../e2e/pages/WorkOrdersPage';

test.describe('Work Orders - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const title = `Auto WO ${Date.now()}`;

  test('1. CREATE - New Work Order', async ({ page }) => {
    const workOrdersPage = new WorkOrdersPage(page);
    await workOrdersPage.createWorkOrder(title);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const workOrdersPage = new WorkOrdersPage(page);
    await workOrdersPage.readWorkOrder(title);
  });

  test('3. UPDATE - Edit Title', async ({ page }) => {
    const workOrdersPage = new WorkOrdersPage(page);
    await workOrdersPage.editWorkOrder(title, `${title} Updated`);
  });

  test('4. DELETE - Delete Work Order', async ({ page }) => {
    const workOrdersPage = new WorkOrdersPage(page);
    await workOrdersPage.deleteWorkOrder(`${title} Updated`);
  });
});
