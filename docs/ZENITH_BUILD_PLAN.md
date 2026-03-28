# Zenith — MoneyTracker Rebuild Master Plan

> **Branch:** `ui-rework`
> **Created:** 2026-03-26
> **App Name:** Zenith (financial tracking web app)
> **Stack:** React 19 + Tailwind CSS v4 + Vite 7 + Recharts 3

---

## 1. Design System — "Zenith"

### Color Palette
- **Primary (Soft Indigo):** `#6366f1` (indigo-500) — buttons, active states, links
- **Primary Light:** `#818cf8` (indigo-400) — hover states
- **Primary Dark:** `#4f46e5` (indigo-600) — pressed states
- **Success (Emerald Green):** `#10b981` (emerald-500) — income, positive values
- **Success Light:** `#34d399` (emerald-400)
- **Danger (Rose):** `#f43f5e` (rose-500) — expenses, negative values, destructive
- **Warning (Amber):** `#f59e0b` (amber-500) — budget warnings, alerts
- **Info (Sky):** `#0ea5e9` (sky-500) — informational
- **Background:** `#f8fafc` (slate-50) — page background
- **Surface:** `#ffffff` — cards, panels
- **Border:** `#e2e8f0` (slate-200) — dividers, card borders
- **Text Primary:** `#0f172a` (slate-900) — headings, primary text
- **Text Secondary:** `#64748b` (slate-500) — descriptions, labels
- **Text Muted:** `#94a3b8` (slate-400) — placeholders, disabled

### Typography
- **Font Family:** Inter (sans-serif), with JetBrains Mono for numbers/code
- **Heading Sizes:** text-2xl (page titles), text-lg (section titles), text-base (card titles)
- **Body:** text-sm (default), text-xs (captions, labels)

### Spacing & Layout
- **Sidebar Width:** 256px expanded, 72px collapsed
- **Header Height:** 64px
- **Content Padding:** 24px (desktop), 16px (mobile)
- **Card Border Radius:** 12px (rounded-xl)
- **Card Shadow:** `shadow-sm` default, `shadow-md` on hover

### Mode
- **Light-mode only** (for now — dark mode can be added later)

---

## 2. Global Layout

### Sidebar (Left, Persistent)
- Logo "Zenith" at top
- Nav items with icons + labels:
  - **Main:** Dashboard, Transactions, Income, Budgets, Goals
  - **Tools:** Compare/Reports, Settings
- Active state: indigo background + white text
- Hover state: slate-100 background
- Collapsible on desktop (icon-only mode)
- Drawer overlay on mobile (hamburger trigger)

### Header (Top, Persistent)
- Page title (dynamic per route)
- Universal search bar (Cmd+K)
- Notifications bell icon
- User profile avatar/icon
- Prominent `+ Add Expense` button (indigo, rounded)

---

## 3. Pages Specification

### 3.1 Dashboard
- **Stat Cards Row (3 cards):**
  - Net Worth (total income - total expenses, all time)
  - Monthly Income (current month)
  - Monthly Spending (current month)
  - Each card: icon, label, value, trend % vs last month
- **Donut/Pie Chart:** Spending by category with legend, timeframe dropdown
- **Budget Progress:** Top 3-5 budgets with color-coded progress bars
- **Recent Transactions:** Last 5-8 transactions, quick list
- **Upcoming Bills:** Scheduled/recurring items (future feature placeholder)
- **Cash Flow Chart:** Bar/line chart showing income vs expenses over 6 months

### 3.2 Transactions (Expenses)
- **Overview Cards:** Filtered total, top category, top merchant, transaction count
- **Filter Bar:** Date range, category multi-select, payment method, amount range, search
- **Data Table:** Sortable columns (date, description, category, amount, payment method)
  - Row click opens detail sidebar
- **Detail Sidebar (right panel):**
  - Full transaction details
  - Edit/delete actions
  - Notes/tags
  - Category badge
  - Receipt preview placeholder

### 3.3 Income
- **Overview Cards:** Monthly total, top source, number of entries
- **Income List/Table:** Date, source, description, amount
- **Add/Edit Income Form:** Modal or inline
- **Source Breakdown:** Pie chart or bar chart by income source

### 3.4 Budgets
- **Overall Budget Gauge:** Dial/gauge showing total budget usage %
- **Period Selector:** This month / last month / custom
- **Budget Cards Grid:** One card per category budget
  - Category icon + name
  - Budget amount vs spent amount
  - Progress bar (green < 70%, amber 70-90%, red > 90%)
  - Remaining amount
- **Create New Budget:** Form/modal
- **Projected Savings Calculator:** Sidebar widget

### 3.5 Goals (NEW feature)
- **Overview Cards:** Total saved across all goals, number of active goals
- **Goal Cards:** Visual cards with:
  - Goal name, target amount, current saved
  - Progress bar + percentage
  - Target date / timeline
  - "Contribute" button
- **Line Chart:** Historical progress vs projected trajectory
- **Create Goal Form:** Name, target amount, target date, initial amount

### 3.6 Compare / Reports
- **Period Comparison:** Side-by-side month comparison
- **Charts:** Income vs expenses, category breakdown comparison
- **Export:** PDF/CSV export of reports

### 3.7 Settings
- **Currency:** Select currency + symbol
- **Google Drive Sync:** Connect/disconnect, manual sync, auto-sync toggle
- **Data Management:** Import JSON, export JSON, clear all data
- **Categories:** Manage custom categories (add/remove/edit)
- **About:** App version, links

### 3.8 Onboarding
- **First-run wizard:** Currency selection, optional budget setup, optional Google Drive connect

---

## 4. Data Layer

### 4.1 Old Data Structure (backward-compatible)
```json
{
  "expenses": [
    { "id": "uuid", "date": "2026-03-15", "amount": 45.50, "category": "food", "description": "Groceries", "paymentMethod": "debit", "merchant": "Walmart", "createdAt": 1711234567890 }
  ],
  "income": [
    { "id": "uuid", "date": "2026-03-01", "amount": 3100, "source": "salary", "description": "March salary" }
  ],
  "budgets": {
    "food": 500,
    "transport": 200,
    "entertainment": 100
  },
  "customCategories": [
    { "id": "custom_dining", "name": "Dining Out", "color": "#f97316" }
  ],
  "settings": {
    "currency": "CAD",
    "currencySymbol": "$",
    "autoSyncEnabled": false
  },
  "setupComplete": true
}
```

### 4.2 New Data Structure (extended)
```json
{
  "version": 2,
  "expenses": [
    {
      "id": "uuid",
      "date": "2026-03-15",
      "amount": 45.50,
      "category": "food",
      "description": "Groceries",
      "paymentMethod": "debit",
      "merchant": "Walmart",
      "tags": ["weekly", "essential"],
      "notes": "",
      "recurring": false,
      "receiptUrl": null,
      "createdAt": 1711234567890,
      "updatedAt": 1711234567890
    }
  ],
  "income": [
    {
      "id": "uuid",
      "date": "2026-03-01",
      "amount": 3100,
      "source": "salary",
      "description": "March salary",
      "recurring": false,
      "tags": [],
      "createdAt": 1711234567890,
      "updatedAt": 1711234567890
    }
  ],
  "budgets": {
    "food": { "amount": 500, "period": "monthly", "rollover": false },
    "transport": { "amount": 200, "period": "monthly", "rollover": false }
  },
  "goals": [
    {
      "id": "uuid",
      "name": "Emergency Fund",
      "targetAmount": 10000,
      "currentAmount": 3500,
      "targetDate": "2026-12-31",
      "contributions": [
        { "date": "2026-03-01", "amount": 500 }
      ],
      "icon": "Shield",
      "color": "#10b981",
      "createdAt": 1711234567890
    }
  ],
  "accounts": [
    {
      "id": "uuid",
      "name": "Chequing",
      "type": "chequing",
      "balance": 5000,
      "institution": "CIBC",
      "color": "#6366f1"
    }
  ],
  "customCategories": [
    { "id": "custom_dining", "name": "Dining Out", "color": "#f97316", "icon": "UtensilsCrossed" }
  ],
  "settings": {
    "currency": "CAD",
    "currencySymbol": "$",
    "autoSyncEnabled": false,
    "theme": "light",
    "sidebarCollapsed": false,
    "defaultPeriod": "this_month"
  },
  "setupComplete": true
}
```

### 4.3 Migration Strategy
When loading data:
1. Check for `version` field
2. If missing (v1), run migration:
   - Wrap budget amounts: `500` → `{ amount: 500, period: "monthly", rollover: false }`
   - Add missing fields to expenses/income (tags, notes, recurring, updatedAt)
   - Add empty `goals` and `accounts` arrays
   - Set `version: 2`
3. Save migrated data back to localStorage

### 4.4 Storage
- **localStorage key:** `moneytracker_data` (unchanged)
- **Google Drive file:** `moneytracker-backup.json` in `MoneyTracker Backups` folder (unchanged)
- **Import/Export:** JSON files, backward-compatible reader

---

## 5. Tech Stack & Dependencies

### Core
- `react` ^19 + `react-dom` ^19
- `react-router-dom` ^7
- `vite` ^7 + `@vitejs/plugin-react`
- `tailwindcss` ^4 + `@tailwindcss/vite`

### UI
- `lucide-react` — icons
- `recharts` ^3 — charts (donut, line, bar, gauge)
- `framer-motion` ^12 — animations
- `@headlessui/react` ^2 — accessible dropdowns, modals, transitions
- `cmdk` ^1 — command palette
- `react-hot-toast` ^2 — toast notifications

### Data
- `date-fns` ^4 — date manipulation
- `uuid` ^13 — unique IDs

### Tables
- `@tanstack/react-table` ^8 — headless table with sorting, filtering, pagination

### Dev
- `vitest` + `@testing-library/react` — unit tests
- `eslint` + plugins
- `jsdom` — test environment

---

## 6. File Structure

```
src/
  config/
    routes.js                        # Route definitions, nav items, icons
  context/
    MoneyContext.jsx                  # Main state (useReducer + localStorage + Google Drive)
    ThemeContext.jsx                  # Light/dark theme state
  components/
    ui/                              # Reusable primitives
      Button.jsx
      Card.jsx
      Input.jsx
      Select.jsx
      Badge.jsx
      Modal.jsx
      Table.jsx
      Dropdown.jsx
      EmptyState.jsx
      Spinner.jsx
      Toggle.jsx
      Tooltip.jsx
      CommandPalette.jsx
      BottomNav.jsx
      ProgressBar.jsx
      index.js                       # Barrel export
    layout/
      Layout.jsx                     # Main wrapper (sidebar + header + content)
      Sidebar.jsx
      Header.jsx
    dashboard/
      Dashboard.jsx
      StatCardsGrid.jsx
      SpendingDonutChart.jsx
      CashFlowChart.jsx
      BudgetProgressList.jsx
      RecentTransactions.jsx
    transactions/
      TransactionsPage.jsx
      TransactionTable.jsx
      TransactionDetail.jsx
      TransactionFilters.jsx
    income/
      IncomePage.jsx
      IncomeTable.jsx
      IncomeForm.jsx
    budgets/
      BudgetsPage.jsx
      BudgetGauge.jsx
      BudgetCard.jsx
      BudgetForm.jsx
    goals/
      GoalsPage.jsx
      GoalCard.jsx
      GoalForm.jsx
      GoalProgressChart.jsx
    reports/
      ReportsPage.jsx
      PeriodComparison.jsx
    settings/
      SettingsPage.jsx
      GoogleDriveSection.jsx
      CategoryManager.jsx
      DataManagement.jsx
    onboarding/
      Onboarding.jsx
  data/
    categories.js                    # Default expense/income categories
    mockData.js                      # Sample data for development
  hooks/
    useMediaQuery.js
    useDebounce.js
  utils/
    storage.js                       # localStorage load/save/export/import
    migration.js                     # v1 → v2 data migration
    calculations.js                  # Financial calculations, formatters
    googleDrive.js                   # Google Drive API integration
  App.jsx
  main.jsx
  index.css                          # Tailwind directives + Zenith design tokens
index.html
package.json
vite.config.js
tailwind.config.js (if needed for v4)
eslint.config.js
```

---

## 7. Phase Breakdown & Status

### Phase 0: Project Scaffold — `STATUS: PENDING`
- [ ] Create `package.json` with all dependencies
- [ ] Create `vite.config.js`
- [ ] Create `index.html` (with Inter font, favicon)
- [ ] Create `src/main.jsx` (React root)
- [ ] Create `src/App.jsx` (router shell)
- [ ] Create `src/index.css` (Tailwind directives only — design tokens in Phase 2)
- [ ] Create `eslint.config.js`
- [ ] Run `npm install`
- [ ] Verify `npm run dev` starts successfully

### Phase 1: Data Layer — `STATUS: PENDING`
- [ ] Create `src/utils/storage.js` — loadData, saveData, exportToJson, importFromJson
- [ ] Create `src/utils/migration.js` — migrateV1toV2
- [ ] Create `src/data/categories.js` — expense categories, income sources, payment methods
- [ ] Create `src/utils/calculations.js` — formatCurrency, getMonthlyExpenses, getTotalByCategory, etc.
- [ ] Create `src/utils/googleDrive.js` — initGoogleApi, signIn, signOut, saveToGoogleDrive, loadFromGoogleDrive
- [ ] Create `src/context/MoneyContext.jsx` — reducer, provider, useMoney hook (v2 schema)
- [ ] Create `src/data/mockData.js` — sample expenses, income, budgets, goals for dev

### Phase 2: Design System — `STATUS: PENDING`
- [ ] Define CSS custom properties for Zenith theme in `src/index.css`
- [ ] Configure Inter + JetBrains Mono fonts
- [ ] Add base utility classes (transitions, focus rings, scrollbar styles)
- [ ] Create `src/context/ThemeContext.jsx` (light-mode with future dark-mode support)

### Phase 3: UI Component Library — `STATUS: PENDING`
- [ ] `Button.jsx` — primary, secondary, outline, ghost, danger variants + sizes
- [ ] `Card.jsx` — base card, stat card with icon/value/trend
- [ ] `Input.jsx` — text, number, date, with label + error + icon
- [ ] `Select.jsx` — styled select with optional search
- [ ] `Badge.jsx` — color variants (success, danger, warning, info, neutral)
- [ ] `Modal.jsx` — portal-based, sizes, backdrop, animations
- [ ] `Table.jsx` — @tanstack/react-table wrapper with sort/filter/pagination
- [ ] `Dropdown.jsx` — @headlessui based, keyboard nav
- [ ] `EmptyState.jsx` — icon + message + action CTA
- [ ] `Spinner.jsx` — loading spinner + skeleton
- [ ] `Toggle.jsx` — switch component
- [ ] `Tooltip.jsx` — hover tooltips
- [ ] `ProgressBar.jsx` — colored progress bar with label
- [ ] `index.js` — barrel export

### Phase 4: Layout Shell — `STATUS: PENDING`
- [ ] `src/components/layout/Sidebar.jsx` — collapsible, responsive, nav items from routes.js
- [ ] `src/components/layout/Header.jsx` — title, search, notifications, profile, + Add Expense
- [ ] `src/components/layout/Layout.jsx` — grid wrapper, sidebar + header + scrollable content
- [ ] `src/config/routes.js` — route definitions with icons, labels, groups
- [ ] Wire up react-router-dom routes in App.jsx
- [ ] Test responsive behavior (desktop collapsed, mobile drawer)

### Phase 5: Dashboard — `STATUS: PENDING`
- [ ] `Dashboard.jsx` — page wrapper with stat cards + charts + activity
- [ ] `StatCardsGrid.jsx` — Net Worth, Income, Spending cards with trends
- [ ] `SpendingDonutChart.jsx` — Recharts PieChart with category legend
- [ ] `CashFlowChart.jsx` — income vs expenses bar/line chart (6 months)
- [ ] `BudgetProgressList.jsx` — top budget categories with progress bars
- [ ] `RecentTransactions.jsx` — last 5-8 transactions quick list

### Phase 6: Transactions — `STATUS: PENDING`
- [ ] `TransactionsPage.jsx` — layout with table + sidebar
- [ ] `TransactionFilters.jsx` — date range, category, payment method, search, amount
- [ ] `TransactionTable.jsx` — sortable, clickable rows
- [ ] `TransactionDetail.jsx` — right sidebar with full details + edit/delete
- [ ] Overview cards (filtered total, top category, count)
- [ ] Add/Edit expense modal

### Phase 7: Income — `STATUS: PENDING`
- [ ] `IncomePage.jsx` — overview cards + table + form
- [ ] `IncomeTable.jsx` — sortable list
- [ ] `IncomeForm.jsx` — add/edit modal
- [ ] Source breakdown chart

### Phase 8: Budgets — `STATUS: PENDING`
- [ ] `BudgetsPage.jsx` — gauge + cards grid + form
- [ ] `BudgetGauge.jsx` — Recharts radial chart showing overall usage
- [ ] `BudgetCard.jsx` — category budget with progress bar
- [ ] `BudgetForm.jsx` — create/edit budget modal
- [ ] Period selector (this month, last month, custom)
- [ ] Projected savings calculator widget

### Phase 9: Goals — `STATUS: PENDING`
- [ ] `GoalsPage.jsx` — overview + cards + chart
- [ ] `GoalCard.jsx` — visual card with progress bar + contribute button
- [ ] `GoalForm.jsx` — create/edit goal modal
- [ ] `GoalProgressChart.jsx` — line chart: actual vs projected
- [ ] Contribution modal

### Phase 10: Compare/Reports — `STATUS: PENDING`
- [ ] `ReportsPage.jsx` — period comparison layout
- [ ] `PeriodComparison.jsx` — side-by-side month comparison
- [ ] Charts: category breakdown, income vs expenses
- [ ] Export to CSV/JSON

### Phase 11: Settings — `STATUS: PENDING`
- [ ] `SettingsPage.jsx` — sectioned settings layout
- [ ] `GoogleDriveSection.jsx` — connect/disconnect, sync status
- [ ] `CategoryManager.jsx` — CRUD for custom categories
- [ ] `DataManagement.jsx` — import/export/clear
- [ ] Currency selection
- [ ] App info/about

### Phase 12: Onboarding — `STATUS: PENDING`
- [ ] `Onboarding.jsx` — step wizard: currency → budgets → Google Drive → done
- [ ] Show only on first run (setupComplete === false)
- [ ] Skip option

### Phase 13: Polish — `STATUS: PENDING`
- [ ] `CommandPalette.jsx` — Cmd+K search overlay (cmdk)
- [ ] Toast notifications (react-hot-toast)
- [ ] `BottomNav.jsx` — mobile bottom navigation
- [ ] Accessibility audit (ARIA labels, focus management, keyboard nav)
- [ ] Loading states + skeleton screens
- [ ] Error boundaries
- [ ] Responsive final pass

---

## 8. Key Constraints

- **Backward-compatible:** Must load old `moneytracker_data` from localStorage and migrate
- **Same localStorage key:** `moneytracker_data`
- **Same Google Drive file:** `moneytracker-backup.json` in `MoneyTracker Backups` folder
- **No backend:** Everything runs client-side
- **Light-mode only** (for initial release)
- **Currency:** Default CAD, user-configurable
- **Icons:** Lucide React throughout

---

## 9. Default Categories

### Expense Categories
| ID | Name | Icon | Color |
|----|------|------|-------|
| food | Food & Groceries | UtensilsCrossed | #f97316 |
| transport | Transport | Car | #0891b2 |
| utilities | Utilities | Zap | #eab308 |
| entertainment | Entertainment | Gamepad2 | #a855f7 |
| shopping | Shopping | ShoppingBag | #ec4899 |
| health | Health | Heart | #ef4444 |
| housing | Housing/Rent | Home | #6366f1 |
| education | Education | GraduationCap | #0ea5e9 |
| personal | Personal Care | Sparkles | #f472b6 |
| subscriptions | Subscriptions | CreditCard | #8b5cf6 |
| travel | Travel | Plane | #14b8a6 |
| gifts | Gifts & Donations | Gift | #f43f5e |
| insurance | Insurance | Shield | #64748b |
| other | Other | MoreHorizontal | #94a3b8 |

### Income Sources
| ID | Name | Icon | Color |
|----|------|------|-------|
| salary | Salary | Briefcase | #10b981 |
| freelance | Freelance | Laptop | #f59e0b |
| investments | Investments | TrendingUp | #6366f1 |
| business | Business | Store | #f472b6 |
| other | Other | Wallet | #94a3b8 |

### Payment Methods
| ID | Name | Icon |
|----|------|------|
| debit | Debit Card | CreditCard |
| credit | Credit Card | CreditCard |
| cash | Cash | Banknote |
| etransfer | e-Transfer | ArrowRightLeft |
| other | Other | MoreHorizontal |
