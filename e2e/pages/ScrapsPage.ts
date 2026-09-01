import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/inventory/scraps';

export class ScrapsPage {
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
   * Required: work order, material, scrap reason, quantity, disposition
   * method + date. Scrap reasons are org-empty by default (unlike work
   * orders/materials, which have leftover data from earlier module runs),
   * so a reason is created inline via the "Add Reason" mini-modal first —
   * that itself needs a name/code/type/category (categories ARE pre-seeded).
   * `description` is used as the unique row anchor since work order/material
   * are shared/reused across runs and aren't unique per test.
   */
  async createScrap(description: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /Add Work Order Scrap/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');

    await dialog.getByText('Select work order', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.getByText('Select material', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    // Select an asset (optional per validation) to keep our own record clean,
    // though this alone doesn't prevent the search crash below — see search().
    await dialog.getByText('Select asset', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    // Create a scrap reason inline (none exist for this org by default).
    await dialog.getByRole('button', { name: /Add Reason/i }).click();
    await this.page.waitForTimeout(1000);
    const reasonDialog = this.page.getByRole('dialog').last();
    await reasonDialog.locator('#reason_name').fill(`Auto Reason ${Date.now()}`);
    await reasonDialog.locator('#reason_code').fill(`RC${Date.now()}`);
    await reasonDialog.getByText('Select scrap type', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);
    await reasonDialog.getByText('Select category', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);
    await reasonDialog.getByRole('button', { name: /^Create Reason Code$/i }).click();
    await this.page.waitForTimeout(1000);

    await dialog.getByText('Select scrap reason', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.locator('input[type="number"]').first().fill('5');

    await dialog.getByPlaceholder('Enter description').fill(description);

    await dialog.getByText('Select method', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    const today = new Date().toISOString().split('T')[0];
    await dialog.locator('input[type="date"]').first().fill(today);

    await dialog.getByRole('button', { name: /^Create Work Order Scrap$/i }).click();
    await this.waitForToast('Work Order Scrap created successfully');
    console.log(`[CREATE] Scrap "${description}" created!`);
  }

  /**
   * REAL APP BUG, not a test-timing issue: the search filter does
   * `s.scrap_reason_name.toLowerCase()` / `s.asset_name.toLowerCase()` with
   * no `?.` guard (unlike material_name/description, which are guarded).
   * At least one pre-existing scrap record in this org's shared data has a
   * null value there (created before this POM added asset-selection, and
   * permanently stuck since scraps have no reachable delete in the UI) — so
   * typing ANYTHING into the search box crashes the whole page for every
   * scrap in this org, not just the one being searched for. Selecting an
   * asset on create avoids adding to the problem, but can't fix records
   * that already exist. Workaround: never use the search box — scan the
   * unfiltered list directly (page_size=50, well under the ~10-15 records
   * that exist, so no pagination is needed either).
   */
  private rowFor(description: string) {
    const descEl = this.page.getByText(description, { exact: true }).first();
    return descEl.locator('xpath=ancestor::div[contains(@class,"rounded") or contains(@class,"Card")][1]');
  }

  async readScrap(description: string) {
    await this.navigate();
    await expect(this.rowFor(description)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Scrap "${description}" found in list`);
  }

  /** No delete exists for scraps — the confirmation dialog/handler exist in code but nothing in the UI triggers it. */
  async editScrap(description: string, newDescription: string) {
    await this.navigate();
    const row = this.rowFor(description);
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = row.locator('button').filter({ has: this.page.locator('svg') }).last();
    await kebab.click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.getByPlaceholder('Enter description').fill(newDescription);

    await dialog.getByRole('button', { name: /^Update Scrap$/i }).click();
    await this.waitForToast('Scrap updated successfully');
    console.log(`[UPDATE] Scrap "${description}" updated to "${newDescription}"!`);
  }
}
