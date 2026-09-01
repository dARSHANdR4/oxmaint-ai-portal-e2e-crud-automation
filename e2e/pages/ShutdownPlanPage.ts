import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/shutdown/plans';

export class ShutdownPlanPage {
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

  /** Required: name, type, planned start/end dates, manager, and the pre-populated Task 1's description. */
  async createShutdownPlan(name: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Create Shutdown Schedule$/i }).first().click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#shutdown_name').fill(name);

    await dialog.locator('#schedule_type_id').click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await dialog.locator('#planned_start_date').fill(today);
    await dialog.locator('#planned_end_date').fill(tomorrow);

    await dialog.locator('#schedule_manager').click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    // A default Task 1 row is pre-populated and its description is required.
    await dialog.getByPlaceholder('Describe the shutdown tasks').fill('Automated shutdown task');

    await dialog.getByRole('button', { name: /^Create Shutdown Schedule$/i }).click();
    await this.waitForToast('Shutdown schedule created successfully');
    console.log(`[CREATE] Shutdown Plan "${name}" created!`);
  }

  async search(name: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(name);
    await this.page.waitForTimeout(1000);
  }

  private rowFor(name: string) {
    const titleEl = this.page.getByText(name, { exact: false }).first();
    return titleEl.locator('xpath=ancestor::div[1]');
  }

  private async openKebabFor(name: string) {
    const row = this.rowFor(name);
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = this.page.locator('button').filter({ has: this.page.locator('svg.lucide-ellipsis-vertical, svg.lucide-more-vertical') }).last();
    await kebab.scrollIntoViewIfNeeded();
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readShutdownPlan(name: string) {
    await this.search(name);
    await expect(this.rowFor(name)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Shutdown Plan "${name}" found in list`);
  }

  /** Edit is a dedicated route, not a modal. */
  async editShutdownPlan(name: string, newName: string) {
    await this.search(name);
    await this.openKebabFor(name);
    await this.page.getByRole('menuitem', { name: /^Edit Schedule$/i }).click();
    await this.page.waitForURL(/\/plans\/edit\//, { timeout: 15000 });
    await this.page.waitForTimeout(1500);

    await this.page.locator('#shutdown_name').fill(newName);

    // Edit form's Task 1 additionally requires Start/End Time (stricter than Create's form).
    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const laterLocal = new Date(Date.now() + 3600000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    await this.page.locator('#start_time_0').fill(nowLocal);
    await this.page.locator('#end_time_0').fill(laterLocal);

    await this.page.getByRole('button', { name: /^Save$/i }).click();
    await this.waitForToast('Shutdown schedule updated successfully');
    console.log(`[UPDATE] Shutdown Plan "${name}" updated to "${newName}"!`);
  }

  /**
   * Delete is NOT available anywhere in this module — the card's kebab menu
   * only offers "Edit Schedule" and "View Details", with no delete option
   * at all, and page.tsx has no delete handler wired up. This documents
   * that real app limitation.
   */
  async confirmDeleteUnavailable(name: string) {
    await this.search(name);
    await this.openKebabFor(name);
    await expect(this.page.getByRole('menuitem', { name: /^Edit Schedule$/i })).toBeVisible({ timeout: 5000 });
    await expect(this.page.getByRole('menuitem', { name: /Delete/i })).toHaveCount(0);
    console.log(`[DELETE] Shutdown Plan "${name}" — confirmed no delete option exists in this module`);
  }
}
