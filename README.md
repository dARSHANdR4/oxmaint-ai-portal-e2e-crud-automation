# OXmaint AI Portal — E2E CRUD Test Automation

![Playwright](https://img.shields.io/badge/Playwright-1.48-2EAD33?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)
![Modules](https://img.shields.io/badge/Modules-19-blue)

A Playwright + TypeScript end-to-end test automation suite built from scratch for **OXmaint AI Portal**, a CMMS (Computerized Maintenance Management System). Covers **Create → Read → Update → Delete** flows across 19 modules spanning Purchasing, Inventory, Maintenance, EHS, Team, Assets, Inspection, and Shutdown — driven by a Page Object Model architecture and wired into a CI pipeline that gates production deploys.

---

## About the product being tested

**OXmaint AI Portal** is an AI-powered, enterprise-level Computerized Maintenance Management System (CMMS) built with Next.js, React, and TypeScript. It provides intelligent maintenance scheduling, predictive analytics, and automated workflows for manufacturing, industrial, and facility management operations.

Key product features:
- **Synapse AI Platform** — a cognitive AI system for intelligent maintenance automation
- **Real-time Analytics Dashboard** — KPI monitoring and reporting
- **Work Order Management** — full lifecycle management with AI-assisted generation
- **Digital Inspection System** — customizable checklists with compliance tracking
- **Inventory Management** — smart stock control with predictive ordering
- **Team Management** — workforce optimization with a skills matrix
- **Purchasing System** — automated procurement workflows

This repository covers the automated test coverage layer for the product above — it does not include the product's own source code, infrastructure, or deployment configuration.

---

## Why this project

Manually regression-testing 19 modules before every release doesn't scale. This suite replaces that manual pass with an automated one: every module's core lifecycle runs unattended against staging, on every push, with failure evidence (screenshots, video, trace) captured automatically. Where a module's UI genuinely can't support part of the CRUD cycle, the test documents that as a real product finding instead of forcing a workaround.

## Modules covered

| Area | Modules |
|---|---|
| **Purchasing** | Purchase Orders, Demand Parts |
| **Inventory** | Labour, Parts, Scraps, Stocks, Vendors |
| **Maintenance** | PM Schedules, Maintenance Requests, Work Orders |
| **EHS** | Work Permits |
| **Team** | Team Management |
| **Assets** | Assets |
| **Inspection** | Checklists, Reports, Reminders, Incidents, Root Cause Analysis |
| **Shutdown** | Shutdown Plans |

## Engineering highlights

- **Page Object Model** — one class per module in `e2e/pages/`, isolating locator/flow logic from test assertions.
- **Cross-module setup dependencies** — e.g. Work Permits can only be created against a Work Order flagged `requires_permits`, a flag with no other UI entry point, so the Work Permits POM creates a disposable Work Order with that flag set as part of its own setup.
- **Real-world UI patterns handled**: Popover+Command comboboxes that render custom `<div>` cards instead of standard ARIA `option` roles, multi-section/multi-item creation wizards (Checklists, Shutdown Plans), required file-attachment uploads (Incidents), and native `window.confirm()` dialogs mixed with custom `AlertDialog`/no-confirmation deletes depending on the module.
- **Distinguishing real app bugs from test bugs** — several modules turned out to have genuine product gaps, surfaced and documented rather than engineered around:
  - Demand Parts' delete button fires a broken/untranslated toast — no backend deletion occurs.
  - Inspection Reports have no edit path once completed, and no delete option at all.
  - Root Cause Analysis deletes a record instantly with **zero confirmation dialog**.
  - Shutdown Plans have no delete option anywhere in the module.
- **Deterministic, collision-free test data** — every record uses a timestamp-suffixed name so re-runs never collide on unique fields, and `test.describe.configure({ mode: 'serial' })` keeps a Create→Read→Update→Delete chain sharing one generated identifier safely under Playwright's parallel workers.

## CI/CD pipeline

`.github/workflows/e2e-crud-pipeline.yml` runs the full suite in 3 sequential sets on every push/PR to `stg`, plus on demand via `workflow_dispatch`:

| Set | Modules |
|---|---|
| 1 (01–06) | Assets, Labour, Parts, Scraps, Stocks, Vendors |
| 2 (07–12) | Maintenance Requests, PM Schedules, Work Orders, Work Permits, Team Management, Purchase Orders |
| 3 (13–19) | Demand Parts, Checklist, Inspection Report, Inspection Reminder, Incidents, RCA, Shutdown Plans |

Each set caches the Playwright browser binary, runs headless, and uploads the HTML report plus (on failure) traces/screenshots/videos as build artifacts. A final `e2e-gate` job only goes green once all three sets pass — intended to be wired in as a required check before promoting `stg` → production.

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
