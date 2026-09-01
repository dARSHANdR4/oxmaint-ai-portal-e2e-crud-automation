import { test } from '@playwright/test';
import { IncidentReportPage } from '../e2e/pages/IncidentReportPage';

test.describe('Incident Report - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const description = `Auto incident description ${Date.now()}`;

  test('1. CREATE - New Incident Report', async ({ page }) => {
    const incidentPage = new IncidentReportPage(page);
    await incidentPage.createIncident(description);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const incidentPage = new IncidentReportPage(page);
    await incidentPage.readIncident(description);
  });

  test('3. UPDATE - Edit Description', async ({ page }) => {
    const incidentPage = new IncidentReportPage(page);
    await incidentPage.editIncident(description, `${description} Updated`);
  });

  test('4. DELETE - Delete Incident Report', async ({ page }) => {
    const incidentPage = new IncidentReportPage(page);
    await incidentPage.deleteIncident(`${description} Updated`);
  });
});
