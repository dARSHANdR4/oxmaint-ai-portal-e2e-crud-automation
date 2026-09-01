import { test } from '@playwright/test';
import { TeamManagementPage } from '../e2e/pages/TeamManagementPage';

// NOTE: Adding a member here only reaches "invited" status. Fully accepting
// the invite (setting a password) would need the actual invite link, which
// is only ever sent by email server-side — it's never returned in the "Add
// Team Member" API response (unlike FleetRabbit, where the invite link IS
// present in the response body and gets captured via network interception).
// No test-email-inbox integration exists here, so the accept step is out of
// scope for now.
test.describe('Team Management - CRUD Automation', () => {
  test.describe.configure({ mode: 'serial' });
  const name = `Auto Member ${Date.now()}`;
  const email = `auto_${Date.now()}@teamtest.io`;

  test('1. CREATE - Add New Team Member', async ({ page }) => {
    const teamPage = new TeamManagementPage(page);
    await teamPage.addTeamMember(name, email);
  });

  test('2. READ - Verify in List', async ({ page }) => {
    const teamPage = new TeamManagementPage(page);
    await teamPage.readTeamMember(name);
  });

  test('3. UPDATE - Edit Name', async ({ page }) => {
    const teamPage = new TeamManagementPage(page);
    await teamPage.editTeamMember(name, `${name} Updated`);
  });

  test('4. DELETE - Delete Team Member', async ({ page }) => {
    const teamPage = new TeamManagementPage(page);
    await teamPage.deleteTeamMember(`${name} Updated`);
  });
});
