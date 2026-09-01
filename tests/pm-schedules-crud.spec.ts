import { test } from '@playwright/test';
import { PMSchedulesPage } from '../e2e/pages/PMSchedulesPage';

test.describe('PM Schedules - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const title = `Auto PM ${Date.now()}`;

  test('1. CREATE - New PM Schedule', async ({ page }) => {
    const pmPage = new PMSchedulesPage(page);
    await pmPage.createSchedule(title);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const pmPage = new PMSchedulesPage(page);
    await pmPage.readSchedule(title);
  });

  test('3. UPDATE - Edit Title', async ({ page }) => {
    const pmPage = new PMSchedulesPage(page);
    await pmPage.editSchedule(title, `${title} Updated`);
  });

  test('4. DELETE - Delete Schedule', async ({ page }) => {
    const pmPage = new PMSchedulesPage(page);
    await pmPage.deleteSchedule(`${title} Updated`);
  });
});
