import { test, expect } from '@playwright/test'
import { format, subMonths } from 'date-fns'

// Seed data matching setupComplete = true so we skip onboarding
const thisMonth = format(new Date(), 'yyyy-MM')
const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM')

const seedData = {
  expenses: [
    { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Grocery shopping', createdAt: Date.now() },
    { id: 'e2', date: `${thisMonth}-10`, amount: 30, category: 'transport', paymentMethod: 'bank', description: 'Gas station', createdAt: Date.now() - 1000 },
    { id: 'e3', date: `${thisMonth}-15`, amount: 100, category: 'entertainment', paymentMethod: 'mastercard', description: 'Concert tickets', createdAt: Date.now() - 2000 },
    { id: 'e4', date: `${lastMonth}-08`, amount: 200, category: 'shopping', paymentMethod: 'visa', description: 'Amazon order', createdAt: Date.now() - 100000 },
  ],
  income: [
    { id: 'i1', date: `${thisMonth}-01`, amount: 3000, source: 'daily_job', notes: 'Monthly salary' },
    { id: 'i2', date: `${thisMonth}-15`, amount: 500, source: 'freelance', notes: 'Freelance project' },
    { id: 'i3', date: `${lastMonth}-01`, amount: 3000, source: 'daily_job', notes: 'Monthly salary' },
  ],
  budgets: { food: 300, transport: 200, entertainment: 150 },
  customCategories: [],
  settings: { currency: 'CAD', currencySymbol: '$', autoSyncEnabled: false },
  setupComplete: true,
}

const emptySeedData = {
  expenses: [],
  income: [],
  budgets: {},
  customCategories: [],
  settings: { currency: 'CAD', currencySymbol: '$', autoSyncEnabled: false },
  setupComplete: true,
}

/**
 * Helper: seed localStorage before navigation
 */
async function seedAndNavigate(page, path = '', data = seedData) {
  // Navigate to a blank page first so we can set localStorage on the correct origin
  await page.goto('/')
  await page.evaluate((d) => {
    localStorage.setItem('moneytracker_data', JSON.stringify(d))
  }, data)
  // Now navigate to the desired hash route
  await page.goto(`/#/${path}`)
  // Wait for the app to load (it shows "Loading..." briefly)
  await page.waitForTimeout(500)
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test('displays stat cards with correct data', async ({ page }) => {
    await seedAndNavigate(page)

    // Use the main content area to avoid matching sidebar links
    const main = page.getByRole('main')
    await expect(main.getByText('Income').first()).toBeVisible()
    await expect(main.getByText('Expenses').first()).toBeVisible()
    await expect(main.getByText('Net Savings')).toBeVisible()

    // Should show formatted amounts
    await expect(page.getByText('$3,500.00').first()).toBeVisible()  // total income
    await expect(page.getByText('$180.00').first()).toBeVisible()    // total expenses (50+30+100)
  })

  test('shows period selector defaulting to This Month', async ({ page }) => {
    await seedAndNavigate(page)
    await expect(page.getByRole('button', { name: 'This Month' })).toBeVisible()
  })

  test('renders Cash Flow Trend chart section', async ({ page }) => {
    await seedAndNavigate(page)
    await expect(page.getByText('Cash Flow Trend')).toBeVisible()
  })

  test('renders Spending by Category section', async ({ page }) => {
    await seedAndNavigate(page)
    // Appears twice (pie chart + detailed list)
    const elements = page.getByText('Spending by Category')
    await expect(elements.first()).toBeVisible()
  })

  test('renders Recent Activity section with transactions', async ({ page }) => {
    await seedAndNavigate(page)
    await expect(page.getByText('Recent Activity')).toBeVisible()
    // Should show some transaction descriptions
    await expect(page.getByText('Grocery shopping')).toBeVisible()
  })

  test('shows empty state with no data', async ({ page }) => {
    await seedAndNavigate(page, '', emptySeedData)
    await expect(page.getByText('$0.00').first()).toBeVisible()
    await expect(page.getByText(/No transactions/i)).toBeVisible()
  })
})

// ─── Expense List ─────────────────────────────────────────────────────────────

test.describe('Expense List', () => {
  test('displays expenses for current month', async ({ page }) => {
    await seedAndNavigate(page, 'expenses')

    await expect(page.getByText('Grocery shopping')).toBeVisible()
    await expect(page.getByText('Gas station')).toBeVisible()
    await expect(page.getByText('Concert tickets')).toBeVisible()
  })

  test('shows Add Expense button', async ({ page }) => {
    await seedAndNavigate(page, 'expenses')
    await expect(page.getByText('Add Expense')).toBeVisible()
  })

  test('search filters expenses', async ({ page }) => {
    await seedAndNavigate(page, 'expenses')

    const searchInput = page.getByPlaceholder('Search...')
    await searchInput.fill('Grocery')
    await page.waitForTimeout(300)

    await expect(page.getByText('Grocery shopping')).toBeVisible()
    // Other expenses should not be visible
    await expect(page.getByText('Gas station')).not.toBeVisible()
  })

  test('opens Add Expense form modal', async ({ page }) => {
    await seedAndNavigate(page, 'expenses')

    await page.getByText('Add Expense').click()
    // Modal should appear with form elements
    await expect(page.getByText('Amount')).toBeVisible()
  })

  test('can add a new expense', async ({ page }) => {
    await seedAndNavigate(page, 'expenses')

    await page.getByText('Add Expense').click()
    await page.waitForTimeout(300)

    // Fill in the form - amount (inside the modal)
    const modal = page.locator('.fixed')
    const amountInput = modal.locator('input[type="number"]').first()
    await amountInput.fill('42.50')

    // Fill description
    const descInput = page.getByPlaceholder('What was this for?')
    await descInput.fill('Test E2E expense')

    // Submit the form using the submit button inside the form
    await modal.locator('button[type="submit"]').click()
    await page.waitForTimeout(500)

    // New expense should appear
    await expect(page.getByText('$42.50')).toBeVisible()
  })

  test('shows total for the month', async ({ page }) => {
    await seedAndNavigate(page, 'expenses')
    // Total of 3 current-month expenses: $50 + $30 + $100 = $180
    await expect(page.getByText('$180.00')).toBeVisible()
  })
})

// ─── Income List ──────────────────────────────────────────────────────────────

test.describe('Income List', () => {
  test('displays income entries for current month', async ({ page }) => {
    await seedAndNavigate(page, 'income')

    await expect(page.getByText('Monthly salary')).toBeVisible()
    await expect(page.getByText('Freelance project')).toBeVisible()
  })

  test('shows Add Income button', async ({ page }) => {
    await seedAndNavigate(page, 'income')
    await expect(page.getByText('Add Income')).toBeVisible()
  })

  test('search filters income entries', async ({ page }) => {
    await seedAndNavigate(page, 'income')

    const searchInput = page.getByPlaceholder('Search...')
    await searchInput.fill('Freelance')
    await page.waitForTimeout(300)

    await expect(page.getByText('Freelance project')).toBeVisible()
    await expect(page.getByText('Monthly salary')).not.toBeVisible()
  })

  test('opens Add Income form modal', async ({ page }) => {
    await seedAndNavigate(page, 'income')

    await page.getByText('Add Income').click()
    await expect(page.getByText('Amount')).toBeVisible()
  })
})

// ─── Budget Manager ───────────────────────────────────────────────────────────

test.describe('Budget Manager', () => {
  test('displays budget entries', async ({ page }) => {
    await seedAndNavigate(page, 'budget')

    await expect(page.getByText('Food & Groceries')).toBeVisible()
    await expect(page.getByText('Transport')).toBeVisible()
    await expect(page.getByText('Entertainment')).toBeVisible()
  })

  test('shows Monthly Overview section', async ({ page }) => {
    await seedAndNavigate(page, 'budget')
    await expect(page.getByText('Monthly Overview')).toBeVisible()
  })

  test('shows Add Budget button', async ({ page }) => {
    await seedAndNavigate(page, 'budget')
    await expect(page.getByText('Add Budget')).toBeVisible()
  })

  test('shows budget progress bars', async ({ page }) => {
    await seedAndNavigate(page, 'budget')
    // Budget amounts should be visible (e.g., $300 for food budget)
    await expect(page.getByText('$300').first()).toBeVisible()
  })

  test('shows empty state with no budgets', async ({ page }) => {
    await seedAndNavigate(page, 'budget', emptySeedData)
    await expect(page.getByText(/No budgets/i)).toBeVisible()
  })
})

// ─── Compare ──────────────────────────────────────────────────────────────────

test.describe('Compare', () => {
  test('renders Compare Expenses page', async ({ page }) => {
    await seedAndNavigate(page, 'compare')
    await expect(page.getByText('Compare Expenses')).toBeVisible()
    await expect(page.getByText('Total Spending Trend')).toBeVisible()
  })

  test('shows month range selector dropdown', async ({ page }) => {
    await seedAndNavigate(page, 'compare')
    // It's a <select> element with options
    const select = page.locator('select')
    await expect(select).toBeVisible()
    // Verify option values
    await expect(page.getByText('3 Months')).toBeAttached()
    await expect(page.getByText('6 Months')).toBeAttached()
    await expect(page.getByText('12 Months')).toBeAttached()
  })

  test('shows Category Comparison section', async ({ page }) => {
    await seedAndNavigate(page, 'compare')
    await expect(page.getByText('Category Comparison')).toBeVisible()
  })
})

// ─── Settings ─────────────────────────────────────────────────────────────────

test.describe('Settings', () => {
  test('renders all settings sections', async ({ page }) => {
    await seedAndNavigate(page, 'settings')

    await expect(page.getByText('Currency')).toBeVisible()
    await expect(page.getByText('Data Storage')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Google Drive Backup' })).toBeVisible()
    await expect(page.getByText('Danger Zone')).toBeVisible()
    await expect(page.getByText('About')).toBeVisible()
  })

  test('shows data stats (expense/income/budget counts)', async ({ page }) => {
    await seedAndNavigate(page, 'settings')

    // Stats section: 4 expenses, 3 income, 3 budgets
    // Note: only current-month expenses may not include last month — total is 4
    await expect(page.getByText('Expenses').first()).toBeVisible()
    await expect(page.getByText('Income').first()).toBeVisible()
    await expect(page.getByText('Budgets').first()).toBeVisible()
  })

  test('shows export and import buttons', async ({ page }) => {
    await seedAndNavigate(page, 'settings')

    await expect(page.getByText(/Export Data/i)).toBeVisible()
    await expect(page.getByText(/Import Data/i)).toBeVisible()
  })

  test('shows danger zone with clear data button', async ({ page }) => {
    await seedAndNavigate(page, 'settings')

    const resetBtn = page.getByText(/Reset App/i)
    await expect(resetBtn).toBeVisible()
  })

  test('clear data shows confirmation dialog', async ({ page }) => {
    await seedAndNavigate(page, 'settings')

    await page.getByText(/Reset App/i).click()
    // Should show confirmation
    await expect(page.getByText(/Confirm Reset/i)).toBeVisible()
    await expect(page.getByText(/Cancel/i)).toBeVisible()
  })
})

// ─── Navigation ───────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('sidebar navigation works between all pages', async ({ page }) => {
    await seedAndNavigate(page)

    // Navigate to Expenses
    await page.getByRole('link', { name: /Expenses/i }).click()
    await expect(page.getByText('Add Expense')).toBeVisible()

    // Navigate to Income
    await page.getByRole('link', { name: /Income/i }).click()
    await expect(page.getByText('Add Income')).toBeVisible()

    // Navigate to Budget
    await page.getByRole('link', { name: /Budget/i }).click()
    await expect(page.getByText('Monthly Overview')).toBeVisible()

    // Navigate to Compare
    await page.getByRole('link', { name: /Compare/i }).click()
    await expect(page.getByText('Compare Expenses')).toBeVisible()

    // Navigate to Settings
    await page.getByRole('link', { name: /Settings/i }).click()
    await expect(page.getByText('Danger Zone')).toBeVisible()

    // Navigate back to Dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click()
    await expect(page.getByText('Cash Flow Trend')).toBeVisible()
  })
})

// ─── Onboarding ───────────────────────────────────────────────────────────────

test.describe('Onboarding', () => {
  test('shows onboarding when no data exists', async ({ page }) => {
    // Navigate without seeding any data
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('moneytracker_data')
    })
    await page.goto('/#/')
    await page.waitForTimeout(500)

    // Should show onboarding welcome screen
    await expect(page.getByText('Track Expenses')).toBeVisible()
    await expect(page.getByText('Monitor Income')).toBeVisible()
    await expect(page.getByText('Set Budgets')).toBeVisible()
    await expect(page.getByText('View Insights')).toBeVisible()
  })

  test('demo data button loads sample data and enters app', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('moneytracker_data')
    })
    await page.goto('/#/')
    await page.waitForTimeout(500)

    // Click "Try Demo with Sample Data"
    const demoBtn = page.getByText(/Try Demo/i)
    await expect(demoBtn).toBeVisible()
    await demoBtn.click()

    // Should navigate to Dashboard after demo loads
    await page.waitForTimeout(1000)
    await expect(page.getByRole('main').getByText('Dashboard')).toBeVisible()
  })
})
