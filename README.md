# TexFlow — Textile Manufacturing Management (Frontend)

Front-end application for a textile manufacturing ERP: buyer orders, raw-material
inventory, production planning, machine monitoring, quality inspection, finished
goods, dispatch, workforce, and finance/reporting.

This repository contains **only the frontend**. It runs entirely on mock data held
in memory by the service layer — there is no backend, no database, and no
persistence. See [Mock data and its limits](#mock-data-and-its-limits) and
[Backend integration](#backend-integration) before wiring it to a real API.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 |
| Build tool | Vite 8 |
| Language | TypeScript (~6.0.2, `strict`) |
| Styling | Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config.js`) |
| Routing | react-router-dom v7 |
| Charts | recharts v3 |
| Server state | TanStack Query |
| Forms / validation | react-hook-form + zod |
| Notifications | sonner |
| Icons | lucide-react |
| Linting | oxlint |

## Getting started

```bash
npm install       # install dependencies
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # type-check (tsc -b) + production build to dist/
npm run preview   # serve the production build locally
npm run lint      # run oxlint
```

Requirements: Node.js 20.19+ or 22.12+ (Vite 8 baseline). There is no `.env`
file required to run the app.

## Modules

| Route | Module | What it covers |
| --- | --- | --- |
| `/dashboard` | Overview | KPI cards, production charts, machine status, inventory alerts, recent orders, activity feed |
| `/orders` | Buyer Orders | Buyer directory, search, status filters, row actions |
| `/inventory` | Inventory | Raw materials, stock levels, reorder thresholds, add-material form |
| `/production` | Production | Production plans and per-stage (spinning → weaving → dyeing → finishing) progress |
| `/machines` | Machines | Machine registry, status, utilization, efficiency, downtime |
| `/quality` | Quality | Inspection records, pass/fail/conditional results, defects, rework |
| `/finished-goods` | Finished Goods | Finished rolls, QC gating, "mark ready for dispatch" |
| `/dispatch` | Dispatch | Shipments built from QC-passed rolls, forward-only status progression, returns |
| `/workforce` | Workforce | Workers, daily attendance, wage periods (approve → paid) |
| `/finance` | Finance | Expenses, invoices, payments, profitability, revenue/expense charts |
| `/settings` | Settings | Company profile, preferences, user management |

There is no separate Buyers module: `/orders` renders the Buyer Orders page (buyer
directory). The root path `/` redirects to `/dashboard`, and any unmatched path
renders an in-app "Page not found" screen instead of a raw router error.

### Demo workflow

The fixtures are wired so the modules tell one coherent story:

```
Buyer order → inventory check → production plan → quality inspection
→ finished rolls → dispatch → invoice + payment → finance reports
```

For example `ORD-2026-0184` (Global Textiles Inc., Combed Cotton Poplin, 12,000 m)
appears on the dashboard, has production plan `PP-2026-0158`, appears on the
Finance screen, and its finished rolls `FR-2026-0101`/`0102` ship on
`DIS-2026-0091`. Order numbers, quantities, statuses, and financial figures are
kept consistent across screens so the demo can be walked end to end.

## Mock data and its limits

- Mock data lives in `src/services/fixtures/*.ts` and is deliberately separated
  from the UI components.
- `src/services/apiClient.ts` exports a `USE_MOCK` flag. While `USE_MOCK === true`
  every service mutates an in-memory copy of its fixtures and returns it.
- **Nothing is persisted.** Any create/edit/delete is lost on page reload.
- Mutations only apply for the current session and are not shared between pages
  that do not read from the same service instance.
- Actions that cannot be meaningfully simulated report honestly in a toast,
  usually marked `(demo)` — for example exports, notifications, and
  settings/system-level actions.
- Shell-level controls that have no data layer behind them (global search
  submission, print/export, bulk selection) are presentational only.
- The dashboard and the Buyers page read a small amount of data directly from
  their local fixture modules rather than through a service. This is intentional
  for the demo; route them through services when a backend exists.

## Backend integration

1. Point the client at your API by setting the base URL in
   `src/services/apiClient.ts` (`API_BASE_URL`, expected to serve under `/api`).
2. Set `USE_MOCK = false`. Each service then issues a real request through
   `apiRequest<T>(path, { method, body, signal })` instead of touching fixtures.
3. Each service already contains the typed placeholder path it will call. Match
   your backend to these, or update the paths — but keep the return types.
4. Preserve the shapes in `src/models/index.ts`. They are the contract the pages
   and tables render against (`Buyer`, `Order`/`OrderItem`, `FinishedRoll`,
   `Dispatch`/`DispatchItem`, `Expense`, `Invoice`/`InvoiceItem`, `Payment`,
   `Worker`, `Attendance`, `Wage`, `Machine`, `QualityInspection`).
5. Keep the service functions as the only data-entry point. Pages should not call
   `fetch` directly; that keeps the mock/live switch in one place.

### Placeholder endpoints by service

| Service | Expected calls |
| --- | --- |
| `inventoryService` | `GET/POST /inventory/materials`, `GET/PUT/DELETE /inventory/materials/:id` |
| `productionService` | `GET/POST /production/plans`, `GET/PUT /production/plans/:id`, `GET /production/plans/:id/stages`, `PUT /production/stages/:id` |
| `machineService` | `GET/POST /machines`, `GET/PUT/DELETE /machines/:id`, `GET /machines/summary` |
| `qualityService` | `GET/POST /quality/inspections`, `GET/PUT/DELETE /quality/inspections/:id` |
| `finishedGoodsService` | `GET/POST /finished-goods/rolls`, `GET/PUT /finished-goods/rolls/:id`, `POST /finished-goods/rolls/:id/ready` |
| `dispatchService` | `GET/POST /dispatch`, `GET/PUT /dispatch/:id`, `PUT /dispatch/:id/status`, `GET /dispatch/board` |
| `workforceService` | `GET/POST /workforce/workers`, `GET/PUT/DELETE /workforce/workers/:id`, `GET/POST /workforce/attendance`, `GET/POST /workforce/wages`, `PUT /workforce/wages/:id/status` |
| `financeService` | `GET/POST /finance/expenses`, `GET/POST /finance/invoices`, `GET/POST /finance/payments`, `GET /finance/summary`, `GET /finance/profitability` |

The paths above are placeholders written into the services as part of the mock
implementation. Confirm them against your API before integrating.

### Semantics to preserve

- Dispatch status moves forward only along
  `planned → packed → loaded → in_transit → delivered`; `returned` is reachable
  only from `in_transit`. Delivering records an actual delivery date.
- A roll can only be dispatched if it passed QC and is marked ready for dispatch,
  and a roll cannot be reused across dispatches.
- Invoice totals are tax-inclusive; payments are matched to an invoice and an
  overpayment is rejected. An invoice becomes `Received` once fully paid.
- Only approved expenses count toward order cost and profitability.
- Attendance allows a checkout earlier than check-in (night shifts).
- Wage records progress `calculated → approved → paid`.

## Testing and quality checks

```bash
npx tsc -b --force   # full type-check (use this, not bare `tsc --noEmit`)
npm run lint         # oxlint
npm run build        # type-check + production build
```

The app was also exercised in a headless Chromium/Edge session over the Chrome
DevTools Protocol: every route loads, search/filter/validation flows behave,
modals submit, toasts fire, the responsive sidebar opens and closes at tablet and
mobile widths, unknown URLs render the in-app "Page not found" screen, and the
console stays free of errors.

Note: `npx tsc --noEmit` can report a false pass because of the project
references set up in `tsconfig.json`. Use `npx tsc -b --force`.

`npm run lint` reports one pre-existing warning in
`src/components/ui/Toast.tsx` (`react/only-export-components`) from the shared
file exporting both a component and its context helper.

## Project layout

```
src/
  components/
    charts/        KPI card, line/bar/pie chart wrappers (recharts)
    layout/        App shell: Sidebar, TopNav, PageLayout
    ui/            Button, Input, Select, Textarea, Card, Badge, Table,
                   Modal, ConfirmDialog, Dropdown, Toast, Feedback, StatCard
  hooks/           useServiceData, useMockAction
  models/          Shared TypeScript domain models
  pages/           One folder per module (page + modals)
  services/        API client + one service per module
  services/fixtures/  Mock data per module
  utils/           cn() and formatters
```

## Known limitations

- All data is in-memory mock data; there is no persistence or authentication.
- Role-based access control is not implemented — Settings users are a flat list.
- Bulk selection, export/print, and global search are presentational.
- The dashboard and Buyers page read local fixtures directly instead of services.
- No automated unit or integration test suite is committed; verification so far
  has been type-check, lint, build, and scripted browser checks.