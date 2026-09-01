import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/maintenance/work-orders';
const CREATE_URL = '/en/maintenance/work-orders/create';

export class WorkOrdersPage {
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
   * Minimal path through the wizard: title + a related asset (via the asset
   * picker modal) + a vendor name (free-text — this org has zero seeded
   * team members/teams/departments, so Vendor is the only assignment option
   * with no dependency on pre-existing data). The Task List step requires at
   * least one manually-added task (no auto-populate happens) before Review.
   */
  async createWorkOrder(title: string, requiresPermits = false) {
    await this.page.goto(CREATE_URL, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1500);

    await this.page.locator('#title').fill(title);

    // Related Asset (mandatory) — opens a modal listing assets; click one by name, then Done.
    await this.page.getByRole('button', { name: /Select an asset from the list/i }).click();
    await this.page.waitForTimeout(1000);
    await this.page.getByText('Auto Asset', { exact: false }).first().click();
    await this.page.getByRole('button', { name: /^Done$/i }).click();
    await this.page.waitForTimeout(500);

    // Assignment (mandatory) — this org has no seeded departments/teams/vendors,
    // so use "Assigned To (Individual)" and pick the logged-in admin account
    // itself. The vendor free-text path looked like it worked (review page
    // showed the typed name) but silently failed backend validation — this
    // is the only assignment option confirmed to actually work end-to-end.
    await this.page.getByText('Select team member', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.type('a');
    await this.page.waitForTimeout(800);
    await this.page.getByText('DARSHAN RAMRAKHYANI', { exact: true }).click();
    await this.page.getByRole('button', { name: /^Done$/i }).click();
    await this.page.waitForTimeout(500);

    // Task List step (next) requires at least one task before Review will accept the form.
    await this.page.getByRole('button', { name: /^Next$/i }).click();
    await this.page.waitForTimeout(1000);

    await this.page.getByRole('button', { name: /Add Task/i }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByPlaceholder('Describe what needs to be done').fill('Automated task step');
    await this.page.getByRole('button', { name: /^Add Task$/i }).click();
    await this.page.waitForTimeout(500);

    // Walk through the remaining steps to Review, clicking through with no required fields.
    // If requested, toggle "Requires Permits" on the Advanced Details step —
    // it has no default and is otherwise unreachable/unset (Work Permits
    // can only be created against a work order with this flag true, and
    // there is no other place in the app to set it).
    for (let i = 0; i < 8; i++) {
      const nextBtn = this.page.getByRole('button', { name: /^Next$/i });
      const createBtn = this.page.getByRole('button', { name: /^Create Work Order$/i });
      if (await createBtn.isVisible({ timeout: 1000 }).catch(() => false)) break;

      if (requiresPermits) {
        const permitsLabel = this.page.getByText('Requires Permits', { exact: true });
        if (await permitsLabel.isVisible({ timeout: 500 }).catch(() => false)) {
          // Three switches on this step, in fixed order: Requires Approval,
          // Requires Permits, Shutdown Work — confirmed via live DOM inspection.
          await this.page.locator('button[role="switch"]').nth(1).click();
          await this.page.waitForTimeout(300);
        }
      }

      if (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextBtn.click();
        await this.page.waitForTimeout(500);
      } else {
        break;
      }
    }

    const createBtn = this.page.getByRole('button', { name: /^Create Work Order$/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    await this.waitForToast('Work order created successfully');
    console.log(`[CREATE] Work order "${title}" created!`);
  }

  async search(title: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search work orders...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(title);
    await search.press('Enter');
    await this.page.waitForTimeout(1500);
  }

  private rowFor(title: string) {
    const titleEl = this.page.locator('h3').filter({ hasText: title }).first();
    return this.page.locator('div.rounded-lg.shadow-sm').filter({ has: titleEl }).first();
  }

  private async openKebabFor(title: string) {
    const row = this.rowFor(title);
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = row.locator('button').filter({ has: this.page.locator('svg') }).last();
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readWorkOrder(title: string) {
    await this.search(title);
    await expect(this.rowFor(title)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Work order "${title}" found in list`);
  }

  async editWorkOrder(title: string, newTitle: string) {
    await this.search(title);
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForURL(/\/work-orders\/edit\//, { timeout: 15000 });
    await this.page.waitForTimeout(1000);

    await this.page.locator('#title').fill(newTitle);

    const submitBtn = this.page.getByRole('button', { name: /^Update Work Order$/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    await this.waitForToast('Work order updated successfully');
    console.log(`[UPDATE] Work order "${title}" updated to "${newTitle}"!`);
  }

  async deleteWorkOrder(title: string) {
    await this.search(title);
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Delete$/i }).click();

    const confirmBtn = this.page.getByRole('button', { name: /^Delete$/i }).last();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    await this.waitForToast('Work order deleted successfully');
    console.log(`[DELETE] Work order "${title}" deleted!`);
  }
}
