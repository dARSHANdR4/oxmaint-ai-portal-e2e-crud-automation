import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/purchasing/demand-parts';

export class DemandPartsPage {
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

  /** Required: title, material (Popover+Command search-select), quantity, unit. Asset/Work Order are optional. */
  async createDemandPart(title: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Create Demand Part$/i }).first().click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#title').fill(title);

    await dialog.getByText('Select material', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.locator('#item_count').fill('5');

    await dialog.locator('#unit').click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.getByRole('button', { name: /^Create Demand Part$/i }).click();
    await this.waitForToast('Demand part created successfully');
    console.log(`[CREATE] Demand Part "${title}" created!`);
  }

  async search(title: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search demand parts...');
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

  async readDemandPart(title: string) {
    await this.search(title);
    await expect(this.rowFor(title)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Demand Part "${title}" found in list`);
  }

  async editDemandPart(title: string, newTitle: string) {
    await this.search(title);
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#title').fill(newTitle);

    await dialog.getByRole('button', { name: /^Update Demand Part$/i }).click();
    await this.waitForToast('Demand part updated successfully');
    console.log(`[UPDATE] Demand Part "${title}" updated to "${newTitle}"!`);
  }

  /**
   * Delete is NOT implemented in this app — the Delete menu item only fires
   * a stub toast (raw/untranslated i18n key containing "not_implemented",
   * since the translation entry is missing) with no actual removal. This
   * documents that real app limitation rather than performing a real delete.
   */
  async deleteDemandPart(title: string) {
    await this.search(title);
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Delete$/i }).click();
    await this.waitForToast('not_implemented');
    console.log(`[DELETE] Demand Part "${title}" — confirmed delete is unimplemented (stub toast only)`);
  }
}
