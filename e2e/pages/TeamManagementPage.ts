import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/team/management';
const ADD_URL = '/en/team/management/add';

export class TeamManagementPage {
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
   * Required: name, email, role. Adding a member here directly invites them
   * (status becomes "invited") — no signup/accept flow needed on our side,
   * unlike FleetRabbit's separate invite-then-accept pattern.
   */
  async addTeamMember(name: string, email: string) {
    await this.page.goto(ADD_URL, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1500);

    await this.page.locator('#name').fill(name);
    await this.page.locator('#email').fill(email);

    // Role — Popover + Command combobox, not a plain Select.
    await this.page.getByText('Select a role', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('[cmdk-item]').first().click();

    await this.page.getByRole('button', { name: /^Add Team Member$/i }).click();
    await this.waitForToast('Team member added successfully');
    console.log(`[CREATE] Team member "${name}" added!`);
  }

  async search(name: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search by name, phone, or ID...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(name);
    await this.page.waitForTimeout(1000);
  }

  /**
   * The default view is a list (TeamMemberListItem), not the card component
   * (TeamMemberCard) — its <h3> has no title attribute, just plain text, and
   * Edit/Delete are plain-text buttons rather than icon buttons with a
   * tooltip title. Anchor on the row via its visible name text instead.
   */
  private rowFor(name: string) {
    const nameEl = this.page.locator('h3', { hasText: name }).first();
    return nameEl.locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
  }

  async readTeamMember(name: string) {
    await this.search(name);
    await expect(this.rowFor(name)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Team member "${name}" found in list`);
  }

  /** Edit is a plain-text button on the row, navigating to a full edit page. */
  async editTeamMember(name: string, newName: string) {
    await this.search(name);
    const row = this.rowFor(name);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('button', { name: /^Edit$/i }).click();
    await this.page.waitForURL(/\/team\/management\/edit\//, { timeout: 15000 });
    await this.page.waitForTimeout(1000);

    await this.page.locator('#name').fill(newName);

    await this.page.getByRole('button', { name: /^Update Team Member$/i }).click();
    await this.waitForToast('Team member updated successfully');
    console.log(`[UPDATE] Team member "${name}" updated to "${newName}"!`);
  }

  /** Delete uses a custom confirmation modal (generic "Confirm" button across block/unblock/delete actions). */
  async deleteTeamMember(name: string) {
    await this.search(name);
    const row = this.rowFor(name);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('button', { name: /^Delete$/i }).click();
    await this.page.waitForTimeout(500);

    await this.page.getByRole('button', { name: /^Confirm$/i }).click();
    await this.waitForToast('Team member deleted successfully');
    console.log(`[DELETE] Team member "${name}" deleted!`);
  }
}
