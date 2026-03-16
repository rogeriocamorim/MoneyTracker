import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MoneyProvider } from '../context/MoneyContext'
import { format, subMonths } from 'date-fns'

// Mock googleDrive — must mock ALL named exports used by Settings.jsx
vi.mock('../utils/googleDrive', () => ({
  saveToGoogleDrive: vi.fn(),
  loadFromGoogleDrive: vi.fn(),
  isSignedIn: vi.fn(() => false),
  initGoogleApi: vi.fn(() => Promise.resolve()),
  signIn: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
  getBackupInfo: vi.fn(() => Promise.resolve(null)),
  setClientId: vi.fn(),
  hasClientId: vi.fn(() => false),
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Recharts to avoid canvas/SVG rendering issues in jsdom
vi.mock('recharts', () => {
  const React = require('react')
  return {
    ResponsiveContainer: ({ children }) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    AreaChart: ({ children }) => React.createElement('div', { 'data-testid': 'area-chart' }, children),
    Area: () => null,
    PieChart: ({ children }) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
    Pie: () => null,
    Cell: () => null,
    BarChart: ({ children }) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
    Bar: () => null,
    LineChart: ({ children }) => React.createElement('div', { 'data-testid': 'line-chart' }, children),
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  }
})

// Helper to render with providers
function renderPage(Page, { initialEntries = ['/'], initialData = {} } = {}) {
  const defaultData = {
    expenses: [],
    income: [],
    budgets: {},
    customCategories: [],
    settings: { currency: 'CAD', currencySymbol: '$', autoSyncEnabled: false },
    setupComplete: true,
    ...initialData,
  }
  localStorage.setItem('moneytracker_data', JSON.stringify(defaultData))

  return render(
    <MoneyProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Page />
      </MemoryRouter>
    </MoneyProvider>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe('Dashboard', () => {
  let Dashboard

  beforeEach(async () => {
    Dashboard = (await import('./Dashboard')).default
  })

  it('renders stat cards', () => {
    renderPage(Dashboard)
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    // Actual label is "Net Savings"
    expect(screen.getByText('Net Savings')).toBeInTheDocument()
  })

  it('renders period selector with "This Month" default', () => {
    renderPage(Dashboard)
    expect(screen.getByText('This Month')).toBeInTheDocument()
  })

  it('shows $0.00 values with no data', () => {
    renderPage(Dashboard)
    const zeroValues = screen.getAllByText(/\$0\.00/)
    expect(zeroValues.length).toBeGreaterThanOrEqual(1)
  })

  it('renders with expense data', () => {
    const thisMonth = format(new Date(), 'yyyy-MM')
    renderPage(Dashboard, {
      initialData: {
        expenses: [
          { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Test', createdAt: Date.now() },
        ],
        income: [
          { id: 'i1', date: `${thisMonth}-01`, amount: 3000, source: 'daily_job', notes: 'Salary' },
        ],
      },
    })
    // Amounts may appear multiple times (stat card + recent activity), use getAllByText
    const income3k = screen.getAllByText(/\$3,000\.00/)
    expect(income3k.length).toBeGreaterThanOrEqual(1)
    const expense50 = screen.getAllByText(/\$50\.00/)
    expect(expense50.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Cash Flow Trend section', () => {
    renderPage(Dashboard)
    // Actual heading is "Cash Flow Trend"
    expect(screen.getByText('Cash Flow Trend')).toBeInTheDocument()
  })

  it('renders Spending by Category section', () => {
    renderPage(Dashboard)
    // "Spending by Category" appears twice (PieChart card + detailed list card)
    const elements = screen.getAllByText('Spending by Category')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Recent Activity section', () => {
    renderPage(Dashboard)
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
  })
})

// ─── ExpenseList ──────────────────────────────────────────────────────────────

describe('ExpenseList', () => {
  let ExpenseList

  beforeEach(async () => {
    ExpenseList = (await import('./ExpenseList')).default
  })

  it('renders the Add Expense button', () => {
    renderPage(ExpenseList)
    // "Add Expense" appears in both the header button and the empty state action
    const addButtons = screen.getAllByText('Add Expense')
    expect(addButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows search input', () => {
    renderPage(ExpenseList)
    // Actual placeholder is "Search..."
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('shows empty state when no expenses', () => {
    renderPage(ExpenseList)
    expect(screen.getByText(/No expenses/i)).toBeInTheDocument()
  })

  it('renders expenses when data exists', () => {
    const thisMonth = format(new Date(), 'yyyy-MM')
    renderPage(ExpenseList, {
      initialData: {
        expenses: [
          { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Groceries', createdAt: Date.now() },
        ],
      },
    })
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('shows total for the month', () => {
    const thisMonth = format(new Date(), 'yyyy-MM')
    renderPage(ExpenseList, {
      initialData: {
        expenses: [
          { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Groceries', createdAt: Date.now() },
          { id: 'e2', date: `${thisMonth}-10`, amount: 30, category: 'transport', paymentMethod: 'bank', description: 'Gas', createdAt: Date.now() },
        ],
      },
    })
    expect(screen.getByText(/\$80\.00/)).toBeInTheDocument()
  })
})

// ─── IncomeList ───────────────────────────────────────────────────────────────

describe('IncomeList', () => {
  let IncomeList

  beforeEach(async () => {
    IncomeList = (await import('./IncomeList')).default
  })

  it('renders the Add Income button', () => {
    renderPage(IncomeList)
    // "Add Income" appears in both the header button and the empty state action
    const addButtons = screen.getAllByText('Add Income')
    expect(addButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows search input', () => {
    renderPage(IncomeList)
    // Actual placeholder is "Search..."
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('shows empty state when no income', () => {
    renderPage(IncomeList)
    expect(screen.getByText(/No income/i)).toBeInTheDocument()
  })

  it('renders income entries when data exists', () => {
    const thisMonth = format(new Date(), 'yyyy-MM')
    renderPage(IncomeList, {
      initialData: {
        income: [
          { id: 'i1', date: `${thisMonth}-01`, amount: 3000, source: 'daily_job', notes: 'Salary' },
        ],
      },
    })
    expect(screen.getByText('Salary')).toBeInTheDocument()
  })
})

// ─── BudgetManager ────────────────────────────────────────────────────────────

describe('BudgetManager', () => {
  let BudgetManager

  beforeEach(async () => {
    BudgetManager = (await import('./BudgetManager')).default
  })

  it('renders the Add Budget button', () => {
    renderPage(BudgetManager)
    // "Add Budget" appears in both the header button and the empty state action
    const addButtons = screen.getAllByText('Add Budget')
    expect(addButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Monthly Overview section', () => {
    renderPage(BudgetManager)
    expect(screen.getByText('Monthly Overview')).toBeInTheDocument()
  })

  it('shows empty state when no budgets', () => {
    renderPage(BudgetManager)
    expect(screen.getByText(/No budgets/i)).toBeInTheDocument()
  })

  it('renders budget entries with data', () => {
    renderPage(BudgetManager, {
      initialData: {
        budgets: { food: 300, transport: 200 },
      },
    })
    expect(screen.getByText('Food & Groceries')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
  })
})

// ─── Compare ──────────────────────────────────────────────────────────────────

describe('Compare', () => {
  let Compare

  beforeEach(async () => {
    Compare = (await import('./Compare')).default
  })

  it('renders the Compare page', () => {
    renderPage(Compare)
    // Actual heading is "Total Spending Trend"
    expect(screen.getByText('Total Spending Trend')).toBeInTheDocument()
  })

  it('renders month range selector as dropdown', () => {
    renderPage(Compare)
    // Compare uses a <select> with option text "3 Months", "6 Months", "12 Months"
    expect(screen.getByText('3 Months')).toBeInTheDocument()
    expect(screen.getByText('6 Months')).toBeInTheDocument()
    expect(screen.getByText('12 Months')).toBeInTheDocument()
  })
})

// ─── Settings ─────────────────────────────────────────────────────────────────

describe('Settings', () => {
  let Settings

  beforeEach(async () => {
    Settings = (await import('./Settings')).default
  })

  it('renders currency display', () => {
    renderPage(Settings)
    // Section heading: "Currency"
    expect(screen.getByText('Currency')).toBeInTheDocument()
  })

  it('renders data storage section', () => {
    renderPage(Settings)
    // Section heading: "Data Storage"
    expect(screen.getByText('Data Storage')).toBeInTheDocument()
  })

  it('renders export button', () => {
    renderPage(Settings)
    // Button text includes "Export Data (JSON)"
    expect(screen.getByText(/Export Data/i)).toBeInTheDocument()
  })

  it('renders import button', () => {
    renderPage(Settings)
    // Button text: "Import Data"
    expect(screen.getByText(/Import Data/i)).toBeInTheDocument()
  })

  it('renders danger zone', () => {
    renderPage(Settings)
    // Section heading: "Danger Zone"
    expect(screen.getByText('Danger Zone')).toBeInTheDocument()
  })

  it('renders Google Drive section', () => {
    renderPage(Settings)
    // Section heading: "Google Drive Backup"
    expect(screen.getByText('Google Drive Backup')).toBeInTheDocument()
  })
})
