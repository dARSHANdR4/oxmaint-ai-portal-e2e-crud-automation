import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/maintenance/request-maintenance';

export class MaintenanceRequestsPage {
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
   * Required: title, description, asset-or-location, and an assignment
   * (assignee/team/department — mutually exclusive, exactly one needed).
   * Priority defaults to "Medium" already. Requester name/email auto-fill
   * from the logged-in profile. Same org-data gap as Work Orders: teams/
   * departments are empty, so assign to the logged-in admin individually.
   */
  async createRequest(title: string, description: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Create Request$/i }).click();
    await this.page.waitForTimeout(1000);

    await this.page.locator('#title').fill(title);
    await this.page.locator('#description').fill(description);

    // This modal is single-select and closes itself on click — no "Done" step.
    // The dialog-open animation can briefly intercept pointer events, and a
    // force-click can silently miss the actual React handler (click lands on
    // the animating overlay instead), leaving the asset unselected without
    // any visible error (the "Either Asset or Location..." text is a
    // permanent helper label, always rendered — NOT a conditional error, so
    // it can't be used to detect failure). Instead check the button's own
    // text: it still says "Select an asset" only while nothing is chosen.
    const assetButton = this.page.getByRole('button', { name: /Select an asset/i });
    for (let attempt = 0; attempt < 3; attempt++) {
      await assetButton.click();
      await this.page.waitForTimeout(1500);
      const assetOption = this.page.getByText('Auto Asset', { exact: false }).first();
      await assetOption.click({ timeout: 10000 }).catch(() => assetOption.click({ force: true }));
      await this.page.waitForTimeout(1000);
      if (!(await assetButton.isVisible().catch(() => false))) break;
      console.log(`⚠️ Asset selection didn't stick, retrying (attempt ${attempt + 1})...`);
    }

    await this.page.getByText('Select team member', { exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.type('a');
    await this.page.waitForTimeout(800);
    await this.page.getByRole('option', { name: /DARSHAN RAMRAKHYANI/i }).click();
    await this.page.waitForTimeout(500);

    await this.page.getByRole('dialog').getByRole('button', { name: /^Create Request$/i }).click();
    await this.waitForToast('Maintenance request created successfully');
    console.log(`[CREATE] Request "${title}" created!`);
  }

  async search(title: string) {
    await this.navigate();
    // The filter bar (incl. search box) is collapsed by default.
    await this.page.getByRole('button', { name: /^Filters$/i }).click();
    await this.page.waitForTimeout(500);
    const search = this.page.getByPlaceholder('Search requests...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(title);
    await search.press('Enter');
    await this.page.waitForTimeout(1500);
  }

  private rowFor(title: string) {
    // Anchor tightly on the card's <h3> title, then walk up to its Card
    // wrapper — a broad class-based row selector risks matching multiple
    // nested/sibling containers and grabbing an unrelated disabled button.
    const titleEl = this.page.locator('h3', { hasText: title }).first();
    return titleEl.locator('xpath=ancestor::div[contains(@class,"shadow-md")][1]');
  }

  private async openKebabFor(title: string) {
    const row = this.rowFor(title);
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = row.locator('button').filter({ has: this.page.locator('svg.lucide-ellipsis-vertical, svg.lucide-more-vertical') });
    await kebab.click();
    await this.page.waitForTimeout(300);
  }

  async readRequest(title: string) {
    await this.search(title);
    await expect(this.rowFor(title)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Request "${title}" found in list`);
  }

  async editRequest(title: string, newDescription: string) {
    await this.search(title);
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForTimeout(1000);

    await this.page.locator('#description').fill(newDescription);

    await this.page.getByRole('dialog').getByRole('button', { name: /^Update Request$/i }).click();
    await this.waitForToast('Maintenance request updated successfully');
    console.log(`[UPDATE] Request "${title}" updated!`);
  }

  /** Delete confirmation is a native window.confirm() dialog, not a custom modal. */
  async deleteRequest(title: string) {
    await this.search(title);
    this.page.once('dialog', (d) => d.accept());
    await this.openKebabFor(title);
    await this.page.getByRole('menuitem', { name: /^Delete$/i }).click();

    await this.waitForToast('Maintenance request deleted successfully');
    console.log(`[DELETE] Request "${title}" deleted!`);
  }
}
