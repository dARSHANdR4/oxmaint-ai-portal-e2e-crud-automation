import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/inventory/vendors';

export class VendorsPage {
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

  /** All plain inputs with ids; required: name, contact, email, phone, address, city, state, country, postal code. */
  async createVendor(name: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Add Vendor$/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#vendor_name').fill(name);
    await dialog.locator('#contact_person').fill('Auto Contact');
    await dialog.locator('#email').fill(`auto_${Date.now()}@vendortest.io`);
    await dialog.locator('#phone').fill('+1-555-0123');
    await dialog.locator('#address').fill('123 Automation St');
    await dialog.locator('#city').fill('Test City');
    await dialog.locator('#state').fill('Test State');
    await dialog.locator('#country').fill('United States');
    await dialog.locator('#postal_code').fill('12345');

    await dialog.getByRole('button', { name: /^Create Vendor$/i }).click();
    await this.waitForToast('Vendor created successfully');
    console.log(`[CREATE] Vendor "${name}" created!`);
  }

  async search(name: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search vendors...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(name);
    await this.page.waitForTimeout(1000);
  }

  private rowFor(name: string) {
    const titleEl = this.page.locator('h3', { hasText: name }).first();
    return titleEl.locator('xpath=ancestor::div[contains(@class,"rounded") or contains(@class,"Card")][1]');
  }

  private async openKebabFor(name: string) {
    const row = this.rowFor(name);
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = row.locator('button').filter({ has: this.page.locator('svg') }).last();
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readVendor(name: string) {
    await this.search(name);
    await expect(this.rowFor(name)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Vendor "${name}" found in list`);
  }

  async editVendor(name: string, newAddress: string) {
    await this.search(name);
    await this.openKebabFor(name);
    await this.page.getByRole('menuitem', { name: /Edit Vendor/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#address').fill(newAddress);

    await dialog.getByRole('button', { name: /^Update Vendor$/i }).click();
    await this.waitForToast('Vendor updated successfully');
    console.log(`[UPDATE] Vendor "${name}" updated!`);
  }

  /** Delete is a custom confirmation modal (not window.confirm) with its own destructive submit button. */
  async deleteVendor(name: string) {
    await this.search(name);
    await this.openKebabFor(name);
    await this.page.getByRole('menuitem', { name: /Delete Vendor/i }).click();
    await this.page.waitForTimeout(500);

    await this.page.getByRole('dialog').getByRole('button', { name: /^Delete Vendor$/i }).click();
    await this.waitForToast('Vendor deleted successfully');
    console.log(`[DELETE] Vendor "${name}" deleted!`);
  }
}
