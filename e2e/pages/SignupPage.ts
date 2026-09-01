import { Page, expect } from '@playwright/test';

export class SignupPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('/en?signup=true', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1500);
  }

  /** Fills and submits the registration form. Returns true if it redirected past the captcha/API call. */
  async signup(name: string, email: string, password: string, role = 'business_owner') {
    await this.page.locator('#name').fill(name);
    await this.page.locator('#email').fill(email);

    // Role — Radix Select (only combobox on this form; trigger has no id)
    await this.page.getByRole('combobox').click();
    await this.page.getByRole('option', { name: new RegExp(role.replace('_', ' '), 'i') }).click();

    await this.page.locator('#password').fill(password);
    await this.page.locator('#confirmPassword').fill(password);

    const submitBtn = this.page.locator('button[type="submit"]').filter({ hasText: /Create Account/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();
  }
}
