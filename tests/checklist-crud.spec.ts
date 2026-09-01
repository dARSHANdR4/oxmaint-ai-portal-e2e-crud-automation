import { test } from '@playwright/test';
import { ChecklistPage } from '../e2e/pages/ChecklistPage';

test.describe('Inspection Checklist - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const name = `Auto Checklist ${Date.now()}`;

  test('1. CREATE - New Checklist', async ({ page }) => {
    const checklistPage = new ChecklistPage(page);
    await checklistPage.createChecklist(name);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const checklistPage = new ChecklistPage(page);
    await checklistPage.readChecklist(name);
  });

  test('3. UPDATE - Edit Name', async ({ page }) => {
    const checklistPage = new ChecklistPage(page);
    await checklistPage.editChecklist(name, `${name} Updated`);
  });

  test('4. DELETE - Delete Checklist', async ({ page }) => {
    const checklistPage = new ChecklistPage(page);
    await checklistPage.deleteChecklist(`${name} Updated`);
  });
});
