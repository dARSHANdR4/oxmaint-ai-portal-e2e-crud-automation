import { test } from '@playwright/test';
import { PartsPage } from '../e2e/pages/PartsPage';

// NOTE: There is no delete functionality for materials in this module —
// confirmed by source inspection (only deleteMaterialCategory exists, no
// deleteMaterial). So this is Create -> Read -> Update only, 3 steps.
test.describe('Parts (Materials) - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const name = `Auto Part ${Date.now()}`;

  test('1. CREATE - New Material', async ({ page }) => {
    const partsPage = new PartsPage(page);
    await partsPage.createMaterial(name);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const partsPage = new PartsPage(page);
    await partsPage.readMaterial(name);
  });

  test('3. UPDATE - Edit Description', async ({ page }) => {
    const partsPage = new PartsPage(page);
    await partsPage.editMaterial(name, `Updated by automation at ${Date.now()}`);
  });
});
