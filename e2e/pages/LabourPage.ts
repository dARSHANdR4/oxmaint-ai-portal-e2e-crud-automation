import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/inventory/labour';

export class LabourPage {
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

  /** Only Name is required; the modal's inputs have no id attributes, so fields are addressed by their <Label> text. */
  async createLabour(name: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Add Labou?r$/i }).click();
    await this.page.waitForTimeout(500);

    await this.page.getByRole('dialog').locator('input').first().fill(name);

    await this.page.getByRole('dialog').getByRole('button', { name: /^Create$/i }).click();
    await this.waitForToast('saved successfully');
    console.log(`[CREATE] Labour "${name}" created!`);
  }

  async search(name: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder(/Search labou?r by name/i);
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(name);
    await this.page.waitForTimeout(1000);
  }

  private rowFor(name: string) {
    const nameEl = this.page.locator('span.font-medium', { hasText: name }).first();
    return nameEl.locator('xpath=ancestor::div[contains(@class,"border")][contains(@class,"rounded-lg")][1]');
  }

  async readLabour(name: string) {
    await this.search(name);
    await expect(this.rowFor(name)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Labour "${name}" found in list`);
  }

  async editLabour(name: string, newDescription: string) {
    await this.search(name);
    const row = this.rowFor(name);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('button').first().click(); // Pencil (edit) is the first icon button in the row
    await this.page.waitForTimeout(500);

    await this.page.getByRole('dialog').locator('textarea').first().fill(newDescription);

    await this.page.getByRole('dialog').getByRole('button', { name: /^Update$/i }).click();
    await this.waitForToast('saved successfully');
    console.log(`[UPDATE] Labour "${name}" updated!`);
  }

  /** Soft delete: entry is marked inactive, not removed. */
  async deleteLabour(name: string) {
    await this.search(name);
    const row = this.rowFor(name);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('button').last().click(); // Trash2 (delete) is the second icon button in the row
    await this.page.waitForTimeout(500);

    await this.page.getByRole('dialog').getByRole('button', { name: /^Delete$/i }).click();
    await this.waitForToast('marked as inactive');
    console.log(`[DELETE] Labour "${name}" marked inactive!`);
  }
}
