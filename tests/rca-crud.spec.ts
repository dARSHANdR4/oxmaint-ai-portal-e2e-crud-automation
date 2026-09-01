import { test } from '@playwright/test';
import { RCAPage } from '../e2e/pages/RCAPage';

test.describe('Root Cause Analysis - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const description = `Auto RCA description ${Date.now()}`;

  test('1. CREATE - New RCA', async ({ page }) => {
    const rcaPage = new RCAPage(page);
    await rcaPage.createRCA(description);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const rcaPage = new RCAPage(page);
    await rcaPage.readRCA(description);
  });

  test('3. UPDATE - Edit Description', async ({ page }) => {
    const rcaPage = new RCAPage(page);
    await rcaPage.editRCA(description, `${description} Updated`);
  });

  test('4. DELETE - Delete RCA', async ({ page }) => {
    const rcaPage = new RCAPage(page);
    await rcaPage.deleteRCA(`${description} Updated`);
  });
});
