import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('/en?login=true', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1500);
  }

  async login(email: string, password: string) {
    await this.page.locator('#email').fill(email);
    await this.page.locator('#password').fill(password);

    const submitBtn = this.page.locator('button[type="submit"]').filter({ hasText: /Sign In/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();

    await this.page.waitForURL((url) => !url.pathname.includes('/login') && !url.search.includes('login=true'), { timeout: 30000 });
  }
}
