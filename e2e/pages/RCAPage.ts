import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/inspection/rca';

export class RCAPage {
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
   * Required: root cause category, description, and exactly one linked
   * record (Work Order / Inspection / Incident — pick a Work Order, since
   * this org always has some from other module runs). Corrective actions
   * are optional — the array starts empty, so skipping them adds no rows
   * to validate.
   */
  async createRCA(description: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Create RCA$/i }).first().click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.getByText('Select Work Orders', { exact: true }).click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.locator('#root_cause_category').click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.locator('#root_cause_description').fill(description);

    await dialog.getByRole('button', { name: /^Create RCA$/i }).click();
    await this.waitForToast('RCA created successfully');
    console.log(`[CREATE] RCA "${description}" created!`);
  }

  async search(description: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search ...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(description);
    await this.page.waitForTimeout(1000);
  }

  /** The card's h3 shows the category, not the description — search guarantees a unique result. */
  private rowFor() {
    const titleEl = this.page.locator('h3').first();
    return titleEl.locator('xpath=ancestor::div[1]');
  }

  private async openKebabFor() {
    const row = this.rowFor();
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = this.page.locator('button').filter({ has: this.page.locator('svg.lucide-ellipsis-vertical, svg.lucide-more-vertical') }).last();
    await kebab.scrollIntoViewIfNeeded();
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readRCA(description: string) {
    await this.search(description);
    await expect(this.rowFor()).toBeVisible({ timeout: 10000 });
    console.log(`[READ] RCA "${description}" found in list`);
  }

  /** Edit is a dedicated route, not a modal. */
  async editRCA(description: string, newDescription: string) {
    await this.search(description);
    await this.openKebabFor();
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForURL(/\/rca\/edit\//, { timeout: 15000 });
    await this.page.waitForTimeout(1500);

    await this.page.locator('#root_cause_description').fill(newDescription);

    await this.page.getByRole('button', { name: /^Save RCA$/i }).click();
    await this.waitForToast('RCA updated successfully');
    console.log(`[UPDATE] RCA updated to "${newDescription}"!`);
  }

  /** Delete is instant — clicking the menu item deletes immediately, no confirmation dialog at all. */
  async deleteRCA(description: string) {
    await this.search(description);
    await this.openKebabFor();
    await this.page.getByRole('menuitem', { name: /^Delete$/i }).click();
    await this.waitForToast('deleted');
    console.log(`[DELETE] RCA "${description}" deleted!`);
  }
}
