import { test } from '@playwright/test';
import { InspectionReminderPage } from '../e2e/pages/InspectionReminderPage';

test.describe('Inspection Reminder - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const title = `Auto Reminder ${Date.now()}`;
  const checklistName = `Auto Reminder Checklist ${Date.now()}`;

  test('1. CREATE - New Inspection Reminder', async ({ page }) => {
    const reminderPage = new InspectionReminderPage(page);
    await reminderPage.createReminder(title, checklistName);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const reminderPage = new InspectionReminderPage(page);
    await reminderPage.readReminder(title);
  });

  test('3. UPDATE - Edit Title', async ({ page }) => {
    const reminderPage = new InspectionReminderPage(page);
    await reminderPage.editReminder(title, `${title} Updated`);
  });

  test('4. DELETE - Delete Reminder', async ({ page }) => {
    const reminderPage = new InspectionReminderPage(page);
    await reminderPage.deleteReminder(`${title} Updated`);
  });
});
