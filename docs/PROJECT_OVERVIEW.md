# MoneyTracker -- Complete Project Documentation

## Overview

MoneyTracker is a **100% client-side** personal finance management SPA. There is **no backend server, no database, and no API**. All data lives in `localStorage` with optional Google Drive backup.

**Tech stack:** React 19 + Vite 7 + Tailwind CSS 4, deployed to GitHub Pages via HashRouter.

---

## Domain Models

All models are plain JavaScript objects (no TypeScript):

| Entity | Key Fields | ID Strategy |
|---|---|---|
| **Expense** | `id`, `date`, `amount`, `category`, `paymentMethod`, `description`, `createdAt` | UUID v4 |
| **Income** | `id`, `date`, `amount`, `source`, `notes` | UUID v4 |
| **Budget** | Flat map `{ [categoryId]: amount }` | Category ID as key |
| **Custom Category** | `id`, `name`, `color` | Slugified string |
| **Settings** | `currency`, `currencySymbol`, `autoSyncEnabled` | Singleton |

### Entity Shapes

```javascript
// Expense
{
  id: string,           // UUID v4, auto-generated on add
  date: string,         // 'yyyy-MM-dd' format
  amount: number,       // Positive decimal
  category: string,     // One of 15 predefined IDs or custom ID
  paymentMethod: string, // 'bank' | 'visa' | 'mastercard'
  description: string,  // Free text
  createdAt: number,    // Date.now() timestamp, auto-generated
}

// Income
{
  id: string,           // UUID v4, auto-generated on add
  date: string,         // 'yyyy-MM-dd' format
  amount: number,       // Positive decimal
  source: string,       // One of 6 source IDs
  notes: string,        // Free text (optional)
}

// Budget -- stored as flat object map
{ [categoryId: string]: number }
// e.g. { food: 300, transport: 200 }

// Custom Category
{
  id: string,           // Slug like 'custom_gym' or 'pet-supplies'
  name: string,         // Display name
  color: string,        // Hex color
}

// Settings
{
  currency: string,       // 'CAD' | 'USD' | 'EUR' | 'GBP' | 'BRL' | 'JPY' | 'AUD'
  currencySymbol: string, // '$' | '€' | '£' | 'R$' | '¥' | 'A$'
  autoSyncEnabled: boolean, // Google Drive auto-sync toggle
}

// Full Application State (localStorage key: moneytracker_data)
{
  expenses: Expense[],
  income: Income[],
  budgets: { [categoryId]: number },
  customCategories: CustomCategory[],
  settings: Settings,
  setupComplete: boolean,
}
```

### Predefined Enums

**Expense categories (15 built-in):** `food`, `transport`, `utilities`, `entertainment`, `shopping`, `health`, `education`, `dining`, `subscriptions`, `housing`, `insurance`, `personal`, `gifts`, `travel`, `other` -- each with `{ id, name, icon, color }`.

**Payment methods (3):** `bank` (Bank Account), `visa` (Visa Credit Card), `mastercard` (MasterCard).

**Income sources (6):** `daily_job`, `business`, `wife_business`, `investments`, `freelance`, `other`.

---

## Data Persistence

1. **Primary:** `localStorage` key `moneytracker_data` -- full state serialized as JSON
2. **Secondary:** Google Drive via OAuth2 (GIS + GAPI) -- single backup file `moneytracker-backup.json` in a "MoneyTracker Backups" folder
3. **Theme:** `localStorage` key `moneytracker_theme`
4. **Receipt pending:** `localStorage` key `moneytracker_pending_receipt` -- base64 image from phone camera
5. **JSON export/import:** manual file download/upload for backup

---

## State Management

Uses **React Context + `useReducer`** pattern with two contexts:

### MoneyContext (`src/context/MoneyContext.jsx`)

**18 reducer actions:**

| Action | Effect |
|--------|--------|
| `LOAD_DATA` | Hydrates state from localStorage, sets `isLoaded: true` |
| `COMPLETE_SETUP` | Sets `setupComplete: true` |
| `ADD_EXPENSE` | Appends expense with auto-generated `id` (UUID) and `createdAt` |
| `UPDATE_EXPENSE` | Merges payload into matching expense by `id` |
| `DELETE_EXPENSE` | Removes expense by `id` |
| `SET_EXPENSES` | Replaces entire expenses array |
| `ADD_INCOME` | Appends income with auto-generated `id` |
| `UPDATE_INCOME` | Merges payload into matching income by `id` |
| `DELETE_INCOME` | Removes income by `id` |
| `SET_INCOME` | Replaces entire income array |
| `SET_BUDGET` | Sets `budgets[category] = amount` |
| `REMOVE_BUDGET` | Deletes a budget key |
| `SET_BUDGETS` | Replaces entire budgets object |
| `ADD_CUSTOM_CATEGORY` | Appends category (with duplicate guard by `id`) |
| `ADD_CUSTOM_CATEGORIES` | Batch-adds categories (filters duplicates) |
| `REMOVE_CUSTOM_CATEGORY` | Removes category by `id` |
| `UPDATE_SETTINGS` | Shallow merges into settings |
| `CLEAR_ALL` | Resets to `initialState` with `isLoaded: true` |
| `BULK_ADD_EXPENSES` | Appends multiple expenses with duplicate guard (`date\|amount` key) |
| `BULK_ADD_INCOME` | Appends multiple income items with duplicate guard |
| `IMPORT_DATA` | Replaces all data fields, sets `setupComplete: true` |

**Side effects:**
- Auto-saves to localStorage on every state change
- Debounced Google Drive sync (2s delay) when `autoSyncEnabled` is true and Drive is connected

**Exposed actions via context:** `dispatch`, `completeSetup`, `addExpense`, `updateExpense`, `deleteExpense`, `addIncome`, `updateIncome`, `deleteIncome`, `setBudget`, `removeBudget`, `addCustomCategory`, `removeCustomCategory`, `updateSettings`, `bulkAddExpenses`, `bulkAddIncome`, `importData`

**Sync state exposed:** `{ isSyncing, lastSyncTime, syncError }`

**Consumer hook:** `useMoney()` -- throws if used outside `MoneyProvider`

### ThemeContext (`src/context/ThemeContext.jsx`)

- State: `preference` (`'light'` | `'dark'` | `'system'`) and `resolved` (`'light'` | `'dark'`)
- Persists to `localStorage` key `moneytracker_theme`
- Listens to `prefers-color-scheme` media query when `preference === 'system'`
- Applies `data-theme` attribute to `document.documentElement`
- Exposed: `{ theme, preference, setTheme, toggleTheme, isDark }`
- Consumer hook: `useTheme()` -- throws if used outside `ThemeProvider`

### Provider Hierarchy

```
ThemeProvider
  -> MoneyProvider
       -> Toaster
       -> HashRouter
            -> Routes
```

---

## Business Logic

### Financial Calculations (`src/utils/calculations.js`)

| Function | Description |
|----------|-------------|
| `formatCurrency(amount, symbol)` | Formats number to currency string with `en-CA` locale |
| `getMonthlyExpenses(expenses, date)` | Filters expenses within a calendar month |
| `getMonthlyIncome(income, date)` | Filters income within a calendar month |
| `getTotalByCategory(expenses)` | Aggregates amounts grouped by category |
| `getTotalByPaymentMethod(expenses)` | Aggregates amounts grouped by payment method |
| `getTotalBySource(income)` | Aggregates amounts grouped by income source |
| `getTotal(items)` | Sums all `.amount` values |
| `getBudgetProgress(expenses, budgets)` | Returns per-category: `{ budget, spent, remaining, percentage }` |
| `getMonthlyTrend(expenses, months)` | Returns N-month array of `{ month, shortMonth, total }` |
| `getIncomeTrend(income, months)` | Same for income |
| `getCombinedTrend(expenses, income, months)` | Returns `{ month, expenses, income, savings }` per month |
| `getDateRangeForPeriod(period)` | Maps period string to `{ start, end }` Date range |
| `filterByDateRange(items, range)` | Filters items by date interval |
| `getPeriodLabel(period, customRange)` | Returns display label for period selector |

**Supported periods:** `this_month`, `last_month`, `last_3_months`, `last_6_months`, `this_year`, `all_time`, `custom`.

### PDF Bank Statement Parser (`src/utils/pdfParser.js` -- 831 lines)

The most complex module. Parses PDFs from **CIBC Checking**, **CIBC Visa**, and **Costco MasterCard**.

**Statement types (4):** `cibc_checking`, `cibc_visa`, `costco_mastercard`, `unknown` -- each mapped to a payment method.

**Parsed transaction output:**
```javascript
{
  date: string,           // 'yyyy-MM-dd'
  description: string,    // Cleaned description
  amount: number,         // Always positive
  type: 'debit' | 'credit',
  paymentMethod: string,  // 'bank' | 'visa' | 'mastercard'
}
```

**Key algorithms:**
- **Text extraction**: Uses `pdfjs-dist` to extract text items with x/y coordinates from each PDF page
- **Line reconstruction**: Groups text items by Y-coordinate (3px tolerance), sorts left-to-right
- **Statement type detection**: Keyword matching (`cibc`, `visa`, `mastercard`, `costco`, `checking`)
- **Year extraction**: Regex for 4-digit years within +/-2 of current year
- **Column position detection**: Finds header line and records x-coordinates for debit/credit/balance columns
- **Amount classification**: Dollar amount x-position compared to column positions (nearest-neighbor)
- **Description cleaning**: Strips type phrases, reference numbers (9+ digits), footer boilerplate, CIBC channel codes
- **Auto-categorization** (`autoCategorize(description)`): 150+ keywords across 14 categories (Canadian merchants)
- **Duplicate detection** (`findDuplicates()`): Uses `date|amount` composite key

### Google Drive Sync

**Module:** `src/utils/googleDrive.js`
- OAuth2 flow via Google Identity Services (GIS) + GAPI client library
- Client ID from: `import.meta.env.VITE_GOOGLE_CLIENT_ID` or `localStorage.getItem('googleDriveClientId')`
- Scope: `https://www.googleapis.com/auth/drive.file`
- Creates folder "MoneyTracker Backups" on Drive
- Single backup file: `moneytracker-backup.json`
- Multipart upload via `fetch()` to Google Drive REST API v3
- Functions: `initGoogleApi()`, `signIn()`, `signOut()`, `isSignedIn()`, `saveToGoogleDrive(data)`, `loadFromGoogleDrive()`, `getBackupInfo()`, `setClientId(id)`, `hasClientId()`

**Hook:** `src/hooks/useGoogleDriveSync.js`
- Debounced sync (2s) and immediate sync
- Returns: `{ syncToGoogleDrive, syncNow, isSyncing, lastSyncTime, syncError, isConnected }`

### Category Helpers (`src/data/categories.js`)

| Function | Description |
|----------|-------------|
| `getCategoryById(id, customCategories)` | Resolves category from predefined or custom list; returns fallback for unknowns |
| `getAllCategories(customCategories)` | Merges predefined + custom categories |
| `getPaymentMethodById(id)` | Looks up payment method |
| `getIncomeSourceById(id)` | Looks up income source |

---

## Routing

6 routes via `HashRouter` (GitHub Pages compatible):

| Path | Purpose | Nav Group |
|---|---|---|
| `/` | Dashboard | main |
| `/expenses` | Expense list | main |
| `/income` | Income list | main |
| `/budget` | Budget manager | main |
| `/compare` | Month comparison | tools |
| `/settings` | Settings | tools |

**Special route:** `/scan-receipt` -- standalone mobile scanner page (Tesseract.js OCR), bypasses main layout.

**Pre-route guards:**
- Loading spinner until `state.isLoaded === true`
- Onboarding flow if `state.setupComplete === false`

**Route config:** `src/config/routes.js` -- centralized definitions with helpers: `getRouteByPath()`, `getGroupedRoutes()`, `getBottomNavRoutes()`.

---

## Hooks

| Hook | File | Purpose |
|---|---|---|
| `useMoney()` | `src/context/MoneyContext.jsx` | Access full state + all actions |
| `useTheme()` | `src/context/ThemeContext.jsx` | Theme preference + toggle |
| `useGoogleDriveSync()` | `src/hooks/useGoogleDriveSync.js` | Drive sync state + triggers |
| `useMediaQuery(query)` | `src/hooks/useMediaQuery.js` | Generic CSS media query tracker |
| `useIsDesktop()` | `src/hooks/useMediaQuery.js` | `>=1024px` |
| `useIsTablet()` | `src/hooks/useMediaQuery.js` | `>=768px` |
| `useIsMobile()` | `src/hooks/useMediaQuery.js` | `<768px` |

---

## Testing

### Unit Tests (Vitest + jsdom) -- ~151 cases

| File | Tests | Coverage |
|------|-------|---------|
| `storage.test.js` | 9 | loadData, saveData, importFromJson, exportToJson |
| `calculations.test.js` | 27 | All 13 calculation functions with edge cases |
| `googleDrive.test.js` | 4 | setClientId, hasClientId |
| `categories.test.js` | 15 | Data integrity, lookups, custom categories |
| `MoneyContext.test.jsx` | 18 | All 18 reducer actions, provider behavior |
| `useGoogleDriveSync.test.js` | 7 | Debounce, immediate sync, cancellation, errors |
| `pages.test.jsx` | 19 | Page smoke tests for all 6 routes |
| `forms.test.jsx` | 14 | Form submission, edit mode, custom categories |
| `interactions.test.jsx` | 11 | Filters, period selector, modals, onboarding |
| `p4.test.jsx` | 8 | Routing, compare nav, budget warnings, demo data |
| `receiptScanner.test.jsx` | 10 | OCR parsing (6 strategies), date/payment detection |
| `Layout.test.jsx` | 9 | Sidebar links, Header titles |

### E2E Tests (Playwright + Chromium) -- 19 cases

Covers: Dashboard, Expense List, Income List, Budget Manager, Compare, Settings, Navigation, and Onboarding flows.

---

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`):
- Trigger: push to `main` or manual dispatch
- Node.js 20 -> `npm ci` -> `npm run build` -> deploy `dist/` to GitHub Pages
- Base path: `/MoneyTracker/`

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2.4 | UI framework |
| `react-router-dom` | 7.13.1 | Client-side routing |
| `date-fns` | 4.1.0 | Date manipulation |
| `recharts` | 3.8.0 | Charts |
| `uuid` | 13.0.0 | ID generation |
| `pdfjs-dist` | 5.5.207 | PDF text extraction |
| `tesseract.js` | 7.0.0 | OCR for receipts |
| `qrcode.react` | 4.2.0 | QR code for mobile scanner |
| `framer-motion` | 12.36.0 | Animations |
| `react-hot-toast` | 2.6.0 | Toast notifications |
| `@headlessui/react` | 2.2.9 | Accessible UI primitives |
| `cmdk` | 1.1.1 | Command palette |
| `lucide-react` | 0.577.0 | Icons |
| `@tanstack/react-table` | 8.21.3 | Data tables |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth2 client ID (can also be set via localStorage at runtime) |
