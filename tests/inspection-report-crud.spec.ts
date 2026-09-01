import { test } from '@playwright/test';
import { InspectionReportPage } from '../e2e/pages/InspectionReportPage';

test.describe('Inspection Report - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const checklistName = `Auto Report Checklist ${Date.now()}`;

  test('1. CREATE - New Inspection Report', async ({ page }) => {
    const reportPage = new InspectionReportPage(page);
    await reportPage.createReport(checklistName);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const reportPage = new InspectionReportPage(page);
    await reportPage.readReport(checklistName);
  });

  test('3. UPDATE - Confirm Update Is Unavailable Once Completed', async ({ page }) => {
    const reportPage = new InspectionReportPage(page);
    await reportPage.confirmUpdateUnavailable(checklistName);
  });

  test('4. DELETE - Confirm Delete Is Unavailable', async ({ page }) => {
    const reportPage = new InspectionReportPage(page);
    await reportPage.confirmDeleteUnavailable(checklistName);
  });
});
