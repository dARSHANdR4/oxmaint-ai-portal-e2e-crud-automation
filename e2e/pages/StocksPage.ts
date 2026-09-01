import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/inventory/stocks';

export class StocksPage {
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
   * Required: material, storage location, current stock, average cost.
   * `storageLocation` is used as the unique row anchor since material names
   * are shared/reused across runs (leftover data from the Parts module).
   */
  async createStock(storageLocation: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Add Stock$/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');

    await dialog.getByText('Select a material', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.locator('#storage_location').fill(storageLocation);
    await dialog.locator('#current_stock').fill('10');
    await dialog.locator('#average_cost').fill('5.00');

    await dialog.getByRole('button', { name: /^Create Stock$/i }).click();
    await this.waitForToast('Stock created successfully');
    console.log(`[CREATE] Stock "${storageLocation}" created!`);
  }

  /**
   * Confirmed all fields in this filter are null-safe (`?.`), unlike the
   * Scraps module's search bug. Still clicks Refresh first though — a
   * just-created/updated record can briefly miss the search index (same
   * class of delay seen in Assets), leaving "No stocks found" even though
   * the record exists.
   */
  async search(text: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /Refresh/i }).click();
    await this.page.waitForTimeout(1000);

    const search = this.page.getByPlaceholder('Search stocks...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(text);
    await this.page.waitForTimeout(1000);
  }

  private rowFor(storageLocation: string) {
    const locEl = this.page.getByText(storageLocation, { exact: false }).first();
    return locEl.locator('xpath=ancestor::div[contains(@class,"rounded") or contains(@class,"Card")][1]');
  }

  private async openKebabFor(storageLocation: string) {
    const row = this.rowFor(storageLocation);
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = row.locator('button').filter({ has: this.page.locator('svg') }).last();
    await kebab.click();
    await this.page.waitForTimeout(600);
  }

  async readStock(storageLocation: string) {
    await this.search(storageLocation);
    await expect(this.rowFor(storageLocation)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Stock "${storageLocation}" found in list`);
  }

  async editStock(storageLocation: string, newStorageLocation: string) {
    await this.search(storageLocation);
    await this.openKebabFor(storageLocation);
    await this.page.getByRole('menuitem', { name: /Edit/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#storage_location').fill(newStorageLocation);

    await dialog.getByRole('button', { name: /^Update Stock$/i }).click();
    await this.waitForToast('Stock updated successfully');
    console.log(`[UPDATE] Stock updated to "${newStorageLocation}"!`);
  }

  async deleteStock(storageLocation: string) {
    await this.search(storageLocation);
    await this.openKebabFor(storageLocation);
    await this.page.getByRole('menuitem', { name: /Delete/i }).click();
    await this.page.waitForTimeout(500);

    await this.page.getByRole('alertdialog').getByRole('button', { name: /^Delete Stock$/i }).click();
    await this.waitForToast('Stock deleted successfully');
    console.log(`[DELETE] Stock "${storageLocation}" deleted!`);
  }
}
