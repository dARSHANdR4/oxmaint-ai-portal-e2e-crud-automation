import { Page, expect } from '@playwright/test';
import { ChecklistPage } from './ChecklistPage';

const LIST_URL = '/en/inspection/inspection-reminder';

export class InspectionReminderPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(LIST_URL, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1500);
  }

  private async waitForToast(text: string, timeout = 15000) {
    const toast = this.page.getByText(text, { exact: false }).first();
    await expect(toast).toBeVisible({ timeout });
  }

  /**
   * Required: title, notification time, asset-or-location, checklist,
   * assignment (one of member/team/department). Creates a fresh checklist
   * first so the checklist grid inside the modal has something to pick.
   */
  async createReminder(title: string, checklistName: string) {
    const checklistPage = new ChecklistPage(this.page);
    await checklistPage.createChecklist(checklistName);

    await this.navigate();
    await this.page.getByRole('button', { name: /^Create Reminder$/i }).first().click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#reminder_title').fill(title);
    await dialog.locator('#notification_time').fill('09:00');

    await dialog.getByRole('button', { name: /Select an asset/i }).click();
    await this.page.waitForTimeout(1500);
    const assetModal = this.page.getByRole('dialog').last();
    await assetModal.getByText('Auto Asset', { exact: false }).first().click({ timeout: 15000 });
    await this.page.waitForTimeout(1000);

    await dialog.getByText('Organization Checklists', { exact: true }).click();
    await this.page.waitForTimeout(500);
    const checklistSearch = dialog.getByPlaceholder('Search by name or code...');
    await checklistSearch.fill(checklistName);
    await checklistSearch.press('Enter');
    await this.page.waitForTimeout(1000);
    await dialog.getByText(checklistName, { exact: true }).click();
    await this.page.waitForTimeout(300);

    await dialog.getByText('Select team member', { exact: true }).click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.getByRole('button', { name: /^Create Reminder$/i }).click();
    await this.waitForToast('Inspection reminder created successfully');
    console.log(`[CREATE] Inspection Reminder "${title}" created!`);
  }

  async search(title: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search Reminder Title, Description, Assigned To Name, Interval Type');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(title);
    await this.page.getByRole('button', { name: /^Search$/i }).click();
    await this.page.waitForTimeout(1000);
  }

  private rowFor(title: string) {
    return this.page.getByRole('heading', { name: title }).first();
  }

  /** Search guarantees a single result, so the only kebab button on the page belongs to it. */
  private async openKebabFor(title: string) {
    await expect(this.rowFor(title)).toBeVisible({ timeout: 10000 });
    const kebab = this.page.locator('button').filter({ has: this.page.locator('svg.lucide-ellipsis-vertical, svg.lucide-more-vertical') }).last();
    await kebab.scrollIntoViewIfNeeded();
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readReminder(title: string) {
    await this.search(title);
    await expect(this.rowFor(title)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Inspection Reminder "${title}" found in list`);
  }

  async editReminder(title: string, newTitle: string) {
    await this.search(title);
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForTimeout(1500);

    await this.page.locator('#reminder_title').fill(newTitle);

    await this.page.getByRole('button', { name: /^Update Reminder$/i }).click();
    await this.waitForToast('updated successfully');
    console.log(`[UPDATE] Inspection Reminder "${title}" updated to "${newTitle}"!`);
  }

  /** Delete confirmation is a native window.confirm() dialog, not a custom modal. */
  async deleteReminder(title: string) {
    await this.search(title);
    this.page.once('dialog', (d) => d.accept());
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Delete$/i }).click();

    await this.waitForToast('deleted successfully');
    console.log(`[DELETE] Inspection Reminder "${title}" deleted!`);
  }
}
