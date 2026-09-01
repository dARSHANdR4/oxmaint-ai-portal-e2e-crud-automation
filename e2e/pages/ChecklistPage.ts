import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/inspection/checklist';
const CREATE_URL = '/en/inspection/checklist/create';

const LONG_DESCRIPTION = Array(260).fill('inspection').join(' ');

export class ChecklistPage {
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
   * Required: checklist name, description (250-500 words), and at least one
   * section with at least one item. A default "General Condition" section
   * already exists on load, so we only need to add one item into it.
   */
  async createChecklist(name: string) {
    await this.page.goto(CREATE_URL, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1500);

    await this.page.locator('#checklistName').fill(name);
    await this.page.locator('#description').fill(LONG_DESCRIPTION);

    await this.page.getByRole('button', { name: /^Add First Item$/i }).first().click();
    await this.page.waitForTimeout(800);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#description').fill('Automated inspection item');
    await dialog.getByRole('button', { name: /^Save Item$/i }).click();
    await this.page.waitForTimeout(500);

    await this.page.getByRole('button', { name: /^Save Checklist$/i }).click();
    await this.waitForToast('Checklist created successfully');
    console.log(`[CREATE] Checklist "${name}" created!`);
  }

  async search(name: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search checklists by name, code, or description...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(name);
    await search.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  private rowFor(name: string) {
    const titleEl = this.page.getByRole('heading', { name, exact: true }).first();
    return titleEl.locator('xpath=ancestor::div[contains(@class,"rounded") or contains(@class,"Card")][1]');
  }

  private async openKebabFor(name: string) {
    const row = this.rowFor(name);
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = row.locator('button').filter({ has: this.page.locator('svg.lucide-ellipsis-vertical, svg.lucide-more-vertical') });
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readChecklist(name: string) {
    await this.search(name);
    await expect(this.rowFor(name)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Checklist "${name}" found in list`);
  }

  /** Edit is a dedicated route, not a modal. */
  async editChecklist(name: string, newName: string) {
    await this.search(name);
    await this.openKebabFor(name);
    await this.page.getByRole('menuitem', { name: /^Edit Checklist$/i }).click();
    await this.page.waitForURL(/\/checklist\/update\//, { timeout: 15000 });
    await this.page.waitForTimeout(1500);

    await this.page.locator('#checklistName').fill(newName);

    await this.page.getByRole('button', { name: /^Update Checklist$/i }).click();
    await this.waitForToast('updated successfully');
    console.log(`[UPDATE] Checklist "${name}" updated to "${newName}"!`);
  }

  async deleteChecklist(name: string) {
    await this.search(name);
    await this.openKebabFor(name);
    await this.page.getByRole('menuitem', { name: /^Delete Checklist$/i }).click();
    await this.page.waitForTimeout(500);

    await this.page.getByRole('alertdialog').getByRole('button', { name: /^Delete$/i }).click();
    await this.waitForToast('deleted successfully');
    console.log(`[DELETE] Checklist "${name}" deleted!`);
  }
}
