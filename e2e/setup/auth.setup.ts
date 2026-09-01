import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const authFile = 'e2e/.auth/user.json';

/**
 * Auth Setup — runs once before all module tests, logs in with a stored
 * test account and saves the authenticated storage state so every module
 * test reuses the same session instead of logging in repeatedly.
 *
 * Credentials are read from environment variables — copy .env.example to
 * .env and fill in a staging test account before running the suite.
 */
setup('authenticate with stored test account', async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('Set TEST_EMAIL and TEST_PASSWORD (see .env.example) before running the suite.');
  }

  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(email, password);

  console.log(`✅ [AUTH] Logged in! URL: ${page.url()}`);
  await page.context().storageState({ path: authFile });
  console.log(`💾 [AUTH] Session saved to ${authFile}`);
});
