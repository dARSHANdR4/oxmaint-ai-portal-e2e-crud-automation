import { test } from '@playwright/test';
import { WorkPermitsPage } from '../e2e/pages/WorkPermitsPage';

test.describe('Work Permits - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const title = `Auto Permit ${Date.now()}`;

  test('1. CREATE - New Work Permit', async ({ page }) => {
    const permitsPage = new WorkPermitsPage(page);
    await permitsPage.createPermit(title);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const permitsPage = new WorkPermitsPage(page);
    await permitsPage.readPermit(title);
  });

  test('3. UPDATE - Edit Title', async ({ page }) => {
    const permitsPage = new WorkPermitsPage(page);
    await permitsPage.editPermit(title, `${title} Updated`);
  });

  test('4. DELETE - Delete Work Permit', async ({ page }) => {
    const permitsPage = new WorkPermitsPage(page);
    await permitsPage.deletePermit(`${title} Updated`);
  });
});
