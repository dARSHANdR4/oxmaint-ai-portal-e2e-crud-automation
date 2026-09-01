import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/maintenance/pm-schedules';

export class PMSchedulesPage {
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
   * Required: title, last service date, category, asset-or-location,
   * assignment (assignee/team/department — same empty-org-data gap as
   * Work Orders/Maintenance Requests, so assign to the logged-in admin),
   * and the one default task's description.
   */
  async createSchedule(title: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Create Schedule$/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#schedule_title').fill(title);

    const today = new Date().toISOString().split('T')[0];
    await dialog.locator('#last_service_date').fill(today);

    // Category already defaults to a value ("Preventive Maintenance") — no action needed.

    // Asset (mandatory) — opens a picker modal; retry if the click doesn't
    // stick (same dialog-animation race seen in Maintenance Requests).
    const assetButton = dialog.getByRole('button', { name: /Select asset/i });
    for (let attempt = 0; attempt < 3; attempt++) {
      await assetButton.click();
      await this.page.waitForTimeout(1500);
      const assetOption = this.page.getByText('Auto Asset', { exact: false }).first();
      await assetOption.click({ timeout: 10000 }).catch(() => assetOption.click({ force: true }));
      await this.page.waitForTimeout(1000);
      if (!(await assetButton.isVisible().catch(() => false))) break;
    }

    // Assignment — Select with an embedded search input.
    await dialog.getByText('Select assignee', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.type('a');
    await this.page.waitForTimeout(800);
    await this.page.getByRole('option', { name: /DARSHAN RAMRAKHYANI/i }).click();
    await this.page.waitForTimeout(500);

    // The one default task requires a description. (Notes textarea appears
    // earlier in the DOM, so target by placeholder, not `.first()`.)
    await dialog.getByPlaceholder('Describe the maintenance task').fill('Automated maintenance task');

    await dialog.getByRole('button', { name: /^Create PM Schedule$/i }).click();
    await this.waitForToast('PM schedule created successfully');
    console.log(`[CREATE] PM Schedule "${title}" created!`);
  }

  async search(title: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search PM schedules...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(title);
    await search.press('Enter');
    await this.page.waitForTimeout(1500);
  }

  private rowFor(title: string) {
    const titleEl = this.page.locator(`[title="${title}"]`).first();
    return titleEl.locator('xpath=ancestor::div[contains(@class,"rounded") or contains(@class,"Card")][1]');
  }

  private async openKebabFor(title: string) {
    const row = this.rowFor(title);
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = row.locator('button').filter({ has: this.page.locator('svg') }).last();
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readSchedule(title: string) {
    await this.search(title);
    await expect(this.rowFor(title)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] PM Schedule "${title}" found in list`);
  }

  /** Edit navigates to a full page (not a modal). */
  async editSchedule(title: string, newTitle: string) {
    await this.search(title);
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForURL(/\/pm-schedules\/edit\//, { timeout: 15000 });
    await this.page.waitForTimeout(1000);

    await this.page.locator('#schedule_title').fill(newTitle);

    await this.page.getByRole('button', { name: /^Update PM Schedule$/i }).click();
    await this.waitForToast('PM Schedule updated successfully');
    console.log(`[UPDATE] PM Schedule "${title}" updated to "${newTitle}"!`);
  }

  /** Delete confirmation is a native window.confirm() dialog, not a custom modal. */
  async deleteSchedule(title: string) {
    await this.search(title);
    this.page.once('dialog', (d) => d.accept());
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Delete$/i }).click();

    await this.waitForToast('PM schedule deleted successfully');
    console.log(`[DELETE] PM Schedule "${title}" deleted!`);
  }
}
