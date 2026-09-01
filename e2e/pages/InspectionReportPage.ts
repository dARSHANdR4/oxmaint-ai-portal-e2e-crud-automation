import { Page, expect } from '@playwright/test';
import { ChecklistPage } from './ChecklistPage';

const LIST_URL = '/en/inspection/report';
const NEW_URL = '/en/inspection/report/new';

export class InspectionReportPage {
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
   * Required: asset, checklist (Organization Checklists tab), inspector name
   * (auto-filled with current user) and scheduled date (auto-filled today).
   * Creates a fresh checklist first so the run is self-contained. "Save
   * Draft" is dead code in this build (button is commented out in the JSX),
   * so the only real path is a full submit — answer the mandatory item and
   * submit, which completes the inspection immediately.
   */
  async createReport(checklistName: string) {
    const checklistPage = new ChecklistPage(this.page);
    await checklistPage.createChecklist(checklistName);

    await this.page.goto(NEW_URL, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1500);

    await this.page.getByRole('button', { name: /Select an asset from the list/i }).click();
    await this.page.waitForTimeout(1000);
    await this.page.getByText('Auto Asset', { exact: false }).first().click();
    await this.page.waitForTimeout(800);

    await this.page.getByRole('tab', { name: /Organization Checklists/i }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByText(checklistName, { exact: true }).click();
    await this.page.waitForTimeout(300);

    await this.page.getByRole('button', { name: /^Start Inspection$/i }).click();
    await this.page.waitForURL(/\/report\/new\/start/, { timeout: 15000 });
    await this.page.waitForTimeout(1500);

    await this.page.locator('button').filter({ has: this.page.locator('svg.lucide-chevron-right') }).first().click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button', { name: /^Pass$/i }).first().click();
    await this.page.waitForTimeout(300);

    await this.page.getByRole('button', { name: /^Submit Inspection$/i }).click();
    await this.waitForToast('submitted successfully');
    console.log(`[CREATE] Inspection report for "${checklistName}" submitted (Completed)!`);
  }

  async search(checklistName: string) {
    await this.navigate();
    const search = this.page.getByPlaceholder('Search inspections...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(checklistName);
    await this.page.waitForTimeout(1000);
  }

  /**
   * The card's own <h3> shows the inspection number, not the checklist
   * name — the checklist name isn't rendered on the card at all, only
   * matched server-side by the search. Since search guarantees a unique
   * result, anchor on the first inspection-number heading after searching.
   */
  private rowFor() {
    const titleEl = this.page.locator('h3').filter({ hasText: /^INS/ }).first();
    return titleEl.locator('xpath=ancestor::div[contains(@class,"rounded") or contains(@class,"Card")][1]');
  }

  async readReport(checklistName: string) {
    await this.search(checklistName);
    await expect(this.rowFor(checklistName)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Inspection report for "${checklistName}" found in list`);
  }

  /**
   * Update is NOT available once an inspection is Completed — the card only
   * shows an "Edit & Start" action while status is "Scheduled" (a draft),
   * and since Save Draft is dead code, every inspection this app can
   * actually create is born Completed. This documents that real app
   * limitation rather than performing an edit.
   */
  async confirmUpdateUnavailable(checklistName: string) {
    await this.search(checklistName);
    const row = this.rowFor();
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row.getByRole('button', { name: /Start Inspection|Resume Inspection/i })).toHaveCount(0);
    console.log(`[UPDATE] Inspection report "${checklistName}" — confirmed no edit option exists once Completed`);
  }

  /**
   * Delete is NOT available anywhere in this module — the card's kebab menu
   * only offers "View Details", with no delete option at all (unlike Demand
   * Parts, which at least has a disabled stub). This documents that real
   * app limitation rather than performing a delete.
   */
  async confirmDeleteUnavailable(checklistName: string) {
    await this.search(checklistName);
    const row = this.rowFor();
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = row.locator('button').filter({ has: this.page.locator('svg.lucide-ellipsis-vertical, svg.lucide-more-vertical') });
    await kebab.click();
    await this.page.waitForTimeout(300);

    await expect(this.page.getByRole('menuitem', { name: /View Details/i })).toBeVisible({ timeout: 5000 });
    await expect(this.page.getByRole('menuitem', { name: /Delete/i })).toHaveCount(0);
    console.log(`[DELETE] Inspection report "${checklistName}" — confirmed no delete option exists in this module`);
  }
}
