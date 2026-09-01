import { Page, expect } from '@playwright/test';
import { WorkOrdersPage } from './WorkOrdersPage';

const LIST_URL = '/en/ehs/work-permits';

export class WorkPermitsPage {
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
   * Required: work order, permit title, valid from, valid to. Each work
   * order can only have one approved permit at a time, so we pick a work
   * order from the dropdown fresh each run (leftover WOs exist from earlier
   * modules). valid_from/valid_to use a custom Popover date-time picker with
   * a "Today" shortcut + "OK" confirm — valid_to needs an hour later than
   * valid_from or validation rejects it as not-after.
   */
  async createPermit(title: string) {
    // Only work orders with requires_permits=true appear in the picker, and
    // there's no other UI path to set that flag — create one fresh.
    const workOrdersPage = new WorkOrdersPage(this.page);
    await workOrdersPage.createWorkOrder(`Auto WO for Permit ${Date.now()}`, true);

    await this.navigate();
    await this.page.getByRole('button', { name: /^Create Work Permit$/i }).first().click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');

    await dialog.getByText('Select a Work Order that requires a permit...', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.locator('#permit_title').fill(title);

    // Valid From — open picker, click Today, confirm.
    await this.page.locator('#valid-from').click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button', { name: /^Today$/i }).click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('button', { name: /^OK$/i }).click();
    await this.page.waitForTimeout(500);

    // Valid To — click tomorrow's date on the calendar (guarantees strictly
    // after Valid From without touching the hour dropdown, which is
    // ambiguous to target: role="combobox" elsewhere on the page — e.g.
    // "Type of Work" — sits earlier in the DOM than the picker's own hour
    // select, and clicking it counts as an outside-click that silently
    // closes the popover).
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = String(tomorrow.getDate());

    await this.page.locator('#valid-to').click();
    await this.page.waitForTimeout(500);
    // The day cell isn't a <button> — plain text, and the number can appear
    // twice (leading padding days from the previous month + the real date),
    // so take the last match (the real one, later in DOM/row order).
    await this.page.getByText(tomorrowDay, { exact: true }).last().click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('button', { name: /^OK$/i }).click();
    await this.page.waitForTimeout(500);

    await dialog.getByRole('button', { name: /^Create Permit$/i }).click();
    await this.waitForToast('Work Permit created successfully');
    console.log(`[CREATE] Work Permit "${title}" created!`);
  }

  async search(title: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search work permits...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(title);
    await this.page.waitForTimeout(1000);
  }

  private rowFor(title: string) {
    // The permit title renders as a plain text line under the WP number
    // (an <h3>), not as an h3 itself — anchor on the visible text directly.
    const titleEl = this.page.getByText(title, { exact: true }).first();
    return titleEl.locator('xpath=ancestor::div[contains(@class,"rounded") or contains(@class,"Card")][1]');
  }

  private async openKebabFor(title: string) {
    const row = this.rowFor(title);
    await expect(row).toBeVisible({ timeout: 10000 });
    // The card also has visible Approve/Reject buttons — target the
    // MoreVertical icon specifically, not just "last button with an svg".
    const kebab = row.locator('button').filter({ has: this.page.locator('svg.lucide-ellipsis-vertical, svg.lucide-more-vertical') });
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readPermit(title: string) {
    await this.search(title);
    await expect(this.rowFor(title)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Work Permit "${title}" found in list`);
  }

  /** Edit is hidden once a permit is Approved/Rejected/Expired — fine right after creation (starts Pending/Draft). */
  async editPermit(title: string, newTitle: string) {
    await this.search(title);
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForURL(/\/work-permits\/edit\//, { timeout: 15000 });
    await this.page.waitForTimeout(1000);

    await this.page.locator('#permit_title').fill(newTitle);

    await this.page.getByRole('button', { name: /^Save Changes$/i }).click();
    await this.waitForToast('Work Permit updated successfully');
    console.log(`[UPDATE] Work Permit "${title}" updated to "${newTitle}"!`);
  }

  /** Delete confirmation is a native window.confirm() dialog, not a custom modal. */
  async deletePermit(title: string) {
    await this.search(title);
    this.page.once('dialog', (d) => d.accept());
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Delete$/i }).click();

    await this.waitForToast('Work Permit deleted successfully');
    console.log(`[DELETE] Work Permit "${title}" deleted!`);
  }
}
