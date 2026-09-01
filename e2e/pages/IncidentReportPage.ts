import { Page, expect } from '@playwright/test';
import path from 'path';

const LIST_URL = '/en/inspection/incidents';

export class IncidentReportPage {
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
   * Required: incident type, asset-or-location, description, and at least
   * one attachment file. Asset uses a plain native Select (not a modal).
   */
  async createIncident(description: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Report Incident$/i }).first().click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#incidentTypeId').click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('option').first().click();
    await this.page.waitForTimeout(300);

    await dialog.getByText('No asset selected', { exact: false }).first().click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('option').filter({ hasText: 'Auto Asset' }).first().click();
    await this.page.waitForTimeout(300);

    await dialog.locator('#incidentDescription').fill(description);

    await dialog.getByRole('button', { name: /^Add Attachment$/i }).click();
    await this.page.waitForTimeout(500);
    await dialog.locator('input[type="file"]').first().setInputFiles(path.join(__dirname, 'fixtures', 'dummy-attachment.txt'));
    await this.page.waitForTimeout(500);

    await dialog.getByRole('button', { name: /^Create Incident Report$/i }).click();
    await this.waitForToast('Incident report created successfully');
    console.log(`[CREATE] Incident Report "${description}" created!`);
  }

  async search(description: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search incident reports...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(description);
    await this.page.waitForTimeout(1000);
  }

  /** The card's h3 shows the incident number, not the description — search guarantees a unique result. */
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

  async readIncident(description: string) {
    await this.search(description);
    await expect(this.rowFor()).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Incident Report "${description}" found in list`);
  }

  async editIncident(description: string, newDescription: string) {
    await this.search(description);
    await this.openKebabFor();
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#incidentDescription').fill(newDescription);

    if (await dialog.getByText('No asset selected', { exact: false }).first().isVisible().catch(() => false)) {
      await dialog.getByText('No asset selected', { exact: false }).first().click();
      await this.page.waitForTimeout(300);
      await this.page.getByRole('option').filter({ hasText: 'Auto Asset' }).first().click();
      await this.page.waitForTimeout(300);
    }

    await dialog.getByRole('button', { name: /^Update Incident Report$/i }).click();
    await this.waitForToast('updated successfully');
    console.log(`[UPDATE] Incident Report updated to "${newDescription}"!`);
  }

  async deleteIncident(description: string) {
    await this.search(description);
    await this.openKebabFor();
    await this.page.getByRole('menuitem', { name: /^Delete$/i }).click();
    await this.page.waitForTimeout(500);

    await this.page.getByRole('alertdialog').getByRole('button', { name: /^Delete$/i }).click();
    await this.waitForToast('Incident report deleted successfully');
    console.log(`[DELETE] Incident Report "${description}" deleted!`);
  }
}
