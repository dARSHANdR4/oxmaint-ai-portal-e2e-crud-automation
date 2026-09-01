import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/assets/asset-master';
const ADD_URL = '/en/assets/asset-master/add';

export class AssetsPage {
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

  /** Only asset_name is required; everything else on this form is optional. */
  async createAsset(name: string) {
    await this.page.goto(ADD_URL, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1500);

    await this.page.locator('#asset_name').fill(name);

    const submitBtn = this.page.locator('button[type="submit"]').filter({ hasText: /Create Asset/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    await this.waitForToast('Asset created successfully');
    console.log(`[CREATE] Asset "${name}" created!`);
  }

  /**
   * Clicks Refresh before searching — a just-created asset can otherwise be
   * absent from search results for a moment (indexing delay), returning
   * "0 of N assets" even though the total count already includes it.
   */
  async search(name: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /Refresh/i }).click();
    await this.page.waitForTimeout(1500);

    const search = this.page.getByPlaceholder('Search assets by name, number, or description...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(name);
    await this.page.getByRole('button', { name: /^Search$/i }).click();
    await this.page.waitForTimeout(1500);
  }

  /**
   * Each row's select-checkbox carries a unique `aria-label="Select asset {name}"`
   * — the most reliable anchor to the row, since the row wrapper itself has no
   * identifying attribute.
   */
  private rowFor(name: string) {
    const checkbox = this.page.getByLabel(`Select asset ${name}`, { exact: true });
    return this.page.locator('div.rounded-lg.shadow-sm').filter({ has: checkbox }).first();
  }

  private async openKebabFor(name: string) {
    const row = this.rowFor(name);
    await expect(row).toBeVisible({ timeout: 10000 });
    // Kebab is an icon-only ghost button (lucide "ellipsis-vertical"), no accessible name.
    const kebab = row.locator('button').filter({ has: this.page.locator('svg.lucide-ellipsis-vertical') });
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readAsset(name: string) {
    await this.search(name);
    await expect(this.rowFor(name)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Asset "${name}" found in list`);
  }

  async editAsset(name: string, newDescription: string) {
    await this.search(name);
    await this.openKebabFor(name);
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForURL(/\/assets\/asset-master\/edit\//, { timeout: 15000 });
    await this.page.waitForTimeout(1000);

    await this.page.locator('#description').fill(newDescription);

    const submitBtn = this.page.locator('button[type="submit"]').filter({ hasText: /Update Asset/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    await this.waitForToast('Asset updated successfully');
    console.log(`[UPDATE] Asset "${name}" updated!`);
  }

  async deleteAsset(name: string) {
    await this.search(name);
    await this.openKebabFor(name);
    await this.page.getByRole('menuitem', { name: /^Delete$/i }).click();

    const confirmBtn = this.page.getByRole('button', { name: /^Delete$/i }).last();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    await this.waitForToast('Asset deleted successfully');
    console.log(`[DELETE] Asset "${name}" deleted!`);
  }
}
