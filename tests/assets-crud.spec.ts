import { test } from '@playwright/test';
import { AssetsPage } from '../e2e/pages/AssetsPage';

test.describe('Assets - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const assetName = `Auto Asset ${Date.now()}`;

  test('1. CREATE - New Asset', async ({ page }) => {
    const assetsPage = new AssetsPage(page);
    await assetsPage.createAsset(assetName);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const assetsPage = new AssetsPage(page);
    await assetsPage.readAsset(assetName);
  });

  test('3. UPDATE - Edit Description', async ({ page }) => {
    const assetsPage = new AssetsPage(page);
    await assetsPage.editAsset(assetName, `Updated by automation at ${Date.now()}`);
  });

  test('4. DELETE - Delete Asset', async ({ page }) => {
    const assetsPage = new AssetsPage(page);
    await assetsPage.deleteAsset(assetName);
  });
});
