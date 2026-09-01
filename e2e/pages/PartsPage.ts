import { Page, expect } from '@playwright/test';

const LIST_URL = '/en/inventory/parts';

export class PartsPage {
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

  /** Only material_name and category are required. */
  async createMaterial(name: string) {
    await this.navigate();
    await this.page.getByRole('button', { name: /^Add New Material$/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#material_name').fill(name);

    // Combobox order in the dialog: Inventory Type, Site, Category, Material Type.
    const categoryCombobox = dialog.getByRole('combobox').nth(2);
    await categoryCombobox.click();
    await this.page.waitForTimeout(500);
    const hasOptions = await this.page.getByRole('option').first().isVisible().catch(() => false);
    if (hasOptions) {
      await this.page.getByRole('option').first().click();
    } else {
      // No categories exist for this org yet — create one inline via the "+" button.
      await this.page.keyboard.press('Escape');
      await dialog.locator('button').filter({ has: this.page.locator('svg.w-3.h-3') }).first().click();
      await this.page.waitForTimeout(500);
      const categoryModal = this.page.getByRole('dialog').last();
      await categoryModal.locator('#category_name').fill(`Auto Category ${Date.now()}`);
      await categoryModal.getByRole('button', { name: /^Add Category$/i }).click();
      await this.page.waitForTimeout(1000);

      await categoryCombobox.click();
      await this.page.waitForTimeout(500);
      await this.page.getByRole('option').first().click();
    }

    await dialog.getByRole('button', { name: /^Create Material$/i }).click();
    await this.waitForToast('Material created successfully');
    console.log(`[CREATE] Material "${name}" created!`);
  }

  /**
   * No debounce/API delay — search filters the already-loaded list client-side.
   * The list defaults to a collapsed-by-category tree view, so materials
   * aren't visible until switched to the flat "List" view via its icon button.
   */
  async search(name: string) {
    await this.navigate();
    await this.page.locator('button').filter({ has: this.page.locator('svg.lucide-list') }).first().click();
    await this.page.waitForTimeout(500);

    const search = this.page.getByPlaceholder('Search...');
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill(name);
    await this.page.waitForTimeout(800);
  }

  private rowFor(name: string) {
    const titleEl = this.page.locator(`h3[title="${name}"]`).first();
    return titleEl.locator('xpath=ancestor::div[contains(@class,"rounded") or contains(@class,"Card")][1]');
  }

  async readMaterial(name: string) {
    await this.search(name);
    await expect(this.rowFor(name)).toBeVisible({ timeout: 10000 });
    console.log(`[READ] Material "${name}" found in list`);
  }

  async editMaterial(name: string, newDescription: string) {
    await this.search(name);
    const row = this.rowFor(name);
    await expect(row).toBeVisible({ timeout: 10000 });
    const kebab = row.locator('button').filter({ has: this.page.locator('svg') }).last();
    await kebab.click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('menuitem', { name: /^Edit$/i }).click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#description').fill(newDescription);

    await dialog.getByRole('button', { name: /^Update Material$/i }).click();
    await this.waitForToast('Material updated successfully');
    console.log(`[UPDATE] Material "${name}" updated!`);
  }
}
