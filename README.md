# OXmaint AI Portal — E2E CRUD Test Automation

Playwright + TypeScript end-to-end test automation suite covering **19 modules** across the OXmaint AI Portal CMMS, built with the Page Object Model pattern.

## What this demonstrates

- Full CRUD (Create / Read / Update / Delete) automation across Purchasing (Purchase Orders, Demand Parts), Inventory (Labour, Parts, Scraps, Stocks, Vendors), Maintenance (PM Schedules, Maintenance Requests, Work Orders), EHS (Work Permits), Team Management, Assets, and Inspection (Checklists, Reports, Reminders, Incidents, Root Cause Analysis) and Shutdown Plans.
- Page Object Model architecture (`e2e/pages/`) — one class per module.
- Handling of real-world UI complexity: Popover+Command comboboxes, multi-step create flows, native `window.confirm()` dialogs, file uploads, and cross-module setup dependencies (e.g. Work Permits requires a Work Order created with a specific flag first).
- **Distinguishing real app limitations from test bugs**: several modules were found to have genuine gaps — e.g. Demand Parts' delete button is an unimplemented stub, Inspection Reports have no edit/delete path once completed, and Root Cause Analysis deletes with zero confirmation dialog. These are documented in the test code as findings rather than worked around.
- A 3-stage GitHub Actions CI pipeline (`.github/workflows/e2e-crud-pipeline.yml`) that runs the full suite against staging on every push, uploads failure traces/screenshots/videos automatically, and gates deployment on all modules passing.

## Structure

```
tests/          19 CRUD spec files (one per module)
e2e/pages/      Page Object Model classes + test fixtures
e2e/setup/      Authentication setup (runs once, shares session across all tests)
.github/        CI pipeline definition
```

## Running locally

```bash
npm install
npx playwright install --with-deps chromium
cp .env.example .env   # fill in a staging test account
npm test
```

## Note

Real staging credentials, session storage, and generated reports are intentionally excluded — see `.env.example` for what's required to run this against a live staging environment.
