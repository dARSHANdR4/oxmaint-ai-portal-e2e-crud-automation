import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/purchasing/purchase-orders';

export class PurchaseOrdersPage {
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

  /** Required: title, due date, vendor, requester (both Popover+Command search-selects). */
  async createPurchaseOrder(title: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Create Purchase Order$/i }).first().click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#title').fill(title);

    const today = new Date().toISOString().split('T')[0];
    await dialog.locator('#dueDate').fill(today);

    await dialog.getByText('Not provided', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.getByText('Select requester from team', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByText('DARSHAN', { exact: false }).first().click();
    await this.page.waitForTimeout(300);

    // At least one line item is required — Item Name + Unit Cost.
    await dialog.getByText('Select item from inventory', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByText('Auto Part', { exact: false }).first().click();
    await this.page.waitForTimeout(300);
    await dialog.locator('input[placeholder="0.00"]').first().fill('10');

    await dialog.getByRole('button', { name: /^Create Purchase Order$/i }).click();
    await this.waitForToast('Purchase order created successfully');
    console.log(`[CREATE] Purchase Order "${title}" created!`);
  }

  async search(title: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search by title, PO number, vendor, or requester...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(title);
    await this.page.waitForTimeout(1000);
  }

  private rowFor(title: string) {
    const titleEl = this.page.locator(`h3[title="${title}"]`).first();
    return titleEl.locator('xpath=ancestor::div[contains(@class,"rounded") or contains(@class,"Card")][1]');
  }

  private async openKebabFor(title: string) {
    const row = this.rowFor(title);
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = row.locator('button').filter({ has: this.page.locator('svg.lucide-ellipsis-vertical, svg.lucide-more-vertical') });
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readPurchaseOrder(title: string) {
    await this.search(title);
    await expect(this.rowFor(title)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Purchase Order "${title}" found in list`);
  }

  async editPurchaseOrder(title: string, newTitle: string) {
    await this.search(title);
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#title').fill(newTitle);

    await dialog.getByRole('button', { name: /^Update Purchase Order$/i }).click();
    await this.waitForToast('Purchase order updated successfully');
    console.log(`[UPDATE] Purchase Order "${title}" updated to "${newTitle}"!`);
  }

  async deletePurchaseOrder(title: string) {
    await this.search(title);
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Delete$/i }).click();
    await this.page.waitForTimeout(500);

    await this.page.getByRole('alertdialog').getByRole('button', { name: /^Delete$/i }).click();
    await this.waitForToast('Purchase order deleted successfully');
    console.log(`[DELETE] Purchase Order "${title}" deleted!`);
  }
}
