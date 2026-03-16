import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MoneyProvider } from '../context/MoneyContext'
import { format, subMonths } from 'date-fns'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock googleDrive
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

// Mock ReceiptScanner
vi.mock('./ReceiptScanner', () => ({
  default: ({ onExtracted, onClose }) => (
    <div data-testid="mock-receipt-scanner">
      <button onClick={() => onExtracted({ total: 42.99, date: '2025-06-20', paymentMethod: 'visa', description: 'Costco' })}>
        Mock Extract
      </button>
      <button onClick={onClose}>Close Scanner</button>
    </div>
  ),
}))

// Mock framer-motion to avoid AnimatePresence mode="wait" blocking step transitions
vi.mock('framer-motion', () => {
  const React = require('react')
  return {
    motion: new Proxy({}, {
      get: (_, tag) => React.forwardRef((props, ref) => {
        const { initial, animate, exit, variants, transition, whileHover, whileTap, layout, ...rest } = props
        return React.createElement(tag, { ...rest, ref })
      }),
    }),
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  }
})

// Mock Recharts
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

const thisMonth = format(new Date(), 'yyyy-MM')

function renderWithProviders(ui, { initialData = {} } = {}) {
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
      <MemoryRouter initialEntries={['/']}>
        {ui}
      </MemoryRouter>
    </MoneyProvider>
  )
}

// ─── ExpenseList Filters ──────────────────────────────────────────────────────

describe('ExpenseList filters', () => {
  let ExpenseList

  beforeEach(async () => {
    ExpenseList = (await import('./ExpenseList')).default
    localStorage.clear()
  })

  it('filters by category', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExpenseList />, {
      initialData: {
        expenses: [
          { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Groceries', createdAt: Date.now() },
          { id: 'e2', date: `${thisMonth}-10`, amount: 30, category: 'transport', paymentMethod: 'bank', description: 'Gas', createdAt: Date.now() - 1 },
        ],
      },
    })

    // Both visible initially
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Gas')).toBeInTheDocument()

    // Select "Food & Groceries" category from the All Categories dropdown
    const categorySelect = screen.getByDisplayValue('All Categories')
    await user.selectOptions(categorySelect, 'food')

    // Only food expense should be visible
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.queryByText('Gas')).not.toBeInTheDocument()
  })

  it('filters by payment method', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExpenseList />, {
      initialData: {
        expenses: [
          { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Visa expense', createdAt: Date.now() },
          { id: 'e2', date: `${thisMonth}-10`, amount: 30, category: 'transport', paymentMethod: 'bank', description: 'Bank expense', createdAt: Date.now() - 1 },
        ],
      },
    })

    expect(screen.getByText('Visa expense')).toBeInTheDocument()
    expect(screen.getByText('Bank expense')).toBeInTheDocument()

    // Select bank from the All Payments dropdown
    const paymentSelect = screen.getByDisplayValue('All Payments')
    await user.selectOptions(paymentSelect, 'bank')

    expect(screen.queryByText('Visa expense')).not.toBeInTheDocument()
    expect(screen.getByText('Bank expense')).toBeInTheDocument()
  })

  it('filters by month selector', async () => {
    const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM')
    renderWithProviders(<ExpenseList />, {
      initialData: {
        expenses: [
          { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'This month exp', createdAt: Date.now() },
          { id: 'e2', date: `${lastMonth}-10`, amount: 30, category: 'transport', paymentMethod: 'bank', description: 'Last month exp', createdAt: Date.now() - 1 },
        ],
      },
    })

    // Default is current month, so only this month expense visible
    expect(screen.getByText('This month exp')).toBeInTheDocument()
    expect(screen.queryByText('Last month exp')).not.toBeInTheDocument()

    // Use fireEvent.change for month inputs
    const monthInput = screen.getByDisplayValue(thisMonth)
    fireEvent.change(monthInput, { target: { value: lastMonth } })

    expect(screen.queryByText('This month exp')).not.toBeInTheDocument()
    expect(screen.getByText('Last month exp')).toBeInTheDocument()
  })
})

// ─── IncomeList Filters ───────────────────────────────────────────────────────

describe('IncomeList filters', () => {
  let IncomeList

  beforeEach(async () => {
    IncomeList = (await import('./IncomeList')).default
    localStorage.clear()
  })

  it('filters by source', async () => {
    const user = userEvent.setup()
    renderWithProviders(<IncomeList />, {
      initialData: {
        income: [
          { id: 'i1', date: `${thisMonth}-01`, amount: 3000, source: 'daily_job', notes: 'Salary' },
          { id: 'i2', date: `${thisMonth}-15`, amount: 500, source: 'freelance', notes: 'Side gig' },
        ],
      },
    })

    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('Side gig')).toBeInTheDocument()

    // Filter by source
    const sourceSelect = screen.getByDisplayValue('All Sources')
    await user.selectOptions(sourceSelect, 'freelance')

    expect(screen.queryByText('Salary')).not.toBeInTheDocument()
    expect(screen.getByText('Side gig')).toBeInTheDocument()
  })

  it('filters by month selector', async () => {
    const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM')
    renderWithProviders(<IncomeList />, {
      initialData: {
        income: [
          { id: 'i1', date: `${thisMonth}-01`, amount: 3000, source: 'daily_job', notes: 'This month pay' },
          { id: 'i2', date: `${lastMonth}-01`, amount: 2500, source: 'daily_job', notes: 'Last month pay' },
        ],
      },
    })

    expect(screen.getByText('This month pay')).toBeInTheDocument()
    expect(screen.queryByText('Last month pay')).not.toBeInTheDocument()

    // Use fireEvent.change for month inputs — userEvent.type doesn't work reliably with type="month"
    const monthInput = screen.getByDisplayValue(thisMonth)
    fireEvent.change(monthInput, { target: { value: lastMonth } })

    expect(screen.queryByText('This month pay')).not.toBeInTheDocument()
    expect(screen.getByText('Last month pay')).toBeInTheDocument()
  })
})

// ─── Dashboard interactions ───────────────────────────────────────────────────

describe('Dashboard interactions', () => {
  let Dashboard

  beforeEach(async () => {
    Dashboard = (await import('./Dashboard')).default
    localStorage.clear()
  })

  it('opens period selector dropdown and changes period', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard />)

    // Click the period selector button (shows "This Month")
    const periodBtn = screen.getByText('This Month')
    await user.click(periodBtn)

    // Dropdown should show other options
    expect(screen.getByText('Last Month')).toBeInTheDocument()
    expect(screen.getByText('Last 3 Months')).toBeInTheDocument()
    expect(screen.getByText('All Time')).toBeInTheDocument()

    // Click "Last Month"
    await user.click(screen.getByText('Last Month'))

    // Period should now show "Last Month" — appears in both overview text and button
    const lastMonthElements = screen.getAllByText(/last month/i)
    expect(lastMonthElements.length).toBeGreaterThanOrEqual(1)
  })

  it('clicking a category opens CategoryExpensesModal', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard />, {
      initialData: {
        expenses: [
          { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Grocery run', createdAt: Date.now() },
          { id: 'e2', date: `${thisMonth}-10`, amount: 80, category: 'food', paymentMethod: 'bank', description: 'Costco trip', createdAt: Date.now() - 1 },
        ],
      },
    })

    // In the "Spending by Category" detailed list, click "Food & Groceries"
    // Category name now appears in both Recent Activity and Spending by Category,
    // so we target the one inside the spending breakdown section (has cursor-pointer)
    const categoryItems = screen.getAllByText('Food & Groceries')
    // Find the one that is inside a clickable spending category row (cursor-pointer parent)
    const spendingCategoryItem = categoryItems.find(el => el.closest('[class*="cursor-pointer"]'))
    await user.click(spendingCategoryItem)

    // CategoryExpensesModal should appear with category heading and expense count
    // Text "2 expenses" is split across elements (with middot and currency span), use regex on content
    expect(screen.getByText((content) => content.includes('2 expenses'))).toBeInTheDocument()
    // Category name now appears as primary label in each row + in the modal header
    // Descriptions appear as secondary text below the category name
    const groceryEls = screen.getAllByText('Grocery run')
    expect(groceryEls.length).toBeGreaterThanOrEqual(1)
    const costcoEls = screen.getAllByText('Costco trip')
    expect(costcoEls.length).toBeGreaterThanOrEqual(1)
    // Category name should appear multiple times (header + each expense row)
    const foodEls = screen.getAllByText('Food & Groceries')
    expect(foodEls.length).toBeGreaterThanOrEqual(3) // header + 2 expense rows
  })
})

// ─── CategoryExpensesModal ────────────────────────────────────────────────────

describe('CategoryExpensesModal', () => {
  let CategoryExpensesModal

  beforeEach(async () => {
    CategoryExpensesModal = (await import('./CategoryExpensesModal')).default
    localStorage.clear()
  })

  it('renders filtered expenses for the category', () => {
    const category = { id: 'food', name: 'Food & Groceries', color: '#22c55e', icon: 'ShoppingCart' }
    const expenses = [
      { id: 'e1', date: '2025-06-05', amount: 50, category: 'food', paymentMethod: 'visa', description: 'Groceries', createdAt: Date.now() },
      { id: 'e2', date: '2025-06-10', amount: 30, category: 'transport', paymentMethod: 'bank', description: 'Gas', createdAt: Date.now() },
    ]
    const onClose = vi.fn()

    renderWithProviders(
      <CategoryExpensesModal category={category} expenses={expenses} onClose={onClose} />
    )

    // Category name now appears in both the modal header and each expense row
    const foodEls = screen.getAllByText('Food & Groceries')
    expect(foodEls.length).toBeGreaterThanOrEqual(2) // header + expense row
    // Should show only food expenses (1 expense)
    // Text "1 expense" is split across elements (with middot and currency span), use flexible matcher
    expect(screen.getByText((content) => content.includes('1 expense'))).toBeInTheDocument()
    // Description appears as secondary text below the category name
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    // Transport expense should not be visible
    expect(screen.queryByText('Gas')).not.toBeInTheDocument()
  })

  it('deletes an expense from the modal', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const category = { id: 'food', name: 'Food & Groceries', color: '#22c55e', icon: 'ShoppingCart' }
    const expenses = [
      { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Groceries', createdAt: Date.now() },
    ]
    const onClose = vi.fn()

    renderWithProviders(
      <CategoryExpensesModal category={category} expenses={expenses} onClose={onClose} />,
      {
        initialData: {
          expenses: [...expenses],
        },
      }
    )

    expect(screen.getByText('Groceries')).toBeInTheDocument()

    // Click delete button
    const deleteBtn = screen.getByTitle('Delete expense')
    await user.click(deleteBtn)

    // Verify confirm was called
    expect(window.confirm).toHaveBeenCalledWith('Delete this expense?')

    // The modal receives expenses as a static prop, so it won't re-render to show empty state.
    // Instead, verify the expense was deleted from localStorage (context persists to localStorage).
    const stored = JSON.parse(localStorage.getItem('moneytracker_data'))
    expect(stored.expenses.find(e => e.id === 'e1')).toBeUndefined()

    window.confirm.mockRestore()
  })

  it('opens edit form from modal', async () => {
    const user = userEvent.setup()

    const category = { id: 'food', name: 'Food & Groceries', color: '#22c55e', icon: 'ShoppingCart' }
    const expenses = [
      { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Groceries', createdAt: Date.now() },
    ]
    const onClose = vi.fn()

    renderWithProviders(
      <CategoryExpensesModal category={category} expenses={expenses} onClose={onClose} />,
      {
        initialData: {
          expenses: [...expenses],
        },
      }
    )

    // Click edit button
    const editBtn = screen.getByTitle('Edit expense')
    await user.click(editBtn)

    // ExpenseForm should open in edit mode
    expect(screen.getByText('Edit Expense')).toBeInTheDocument()
    const amountInput = screen.getByPlaceholderText('0.00')
    expect(amountInput.value).toBe('50')
  })
})

// ─── Onboarding ───────────────────────────────────────────────────────────────

describe('Onboarding', () => {
  let Onboarding

  beforeEach(async () => {
    Onboarding = (await import('./Onboarding')).default
    localStorage.clear()
  })

  it('navigates through steps: Welcome -> Currency -> Budget', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Onboarding />, {
      initialData: { setupComplete: false },
    })

    // Step 1: Welcome — should see "MoneyTracker" heading and features
    expect(screen.getByText('MoneyTracker')).toBeInTheDocument()
    expect(screen.getByText('Track Expenses')).toBeInTheDocument()
    expect(screen.getByText(/Set Up New/i)).toBeInTheDocument()

    // Click "Set Up New" to go to Step 2
    await user.click(screen.getByText(/Set Up New/i))

    // Step 2: Currency — should see "Choose Currency"
    expect(screen.getByText('Choose Currency')).toBeInTheDocument()
    expect(screen.getByText('Canadian Dollar')).toBeInTheDocument()
    expect(screen.getByText('US Dollar')).toBeInTheDocument()

    // Click Continue to go to Step 3
    await user.click(screen.getByText('Continue'))

    // Step 3: Budget — should see "Set Your Budgets"
    expect(screen.getByText('Set Your Budgets')).toBeInTheDocument()
    expect(screen.getByText('Predefined')).toBeInTheDocument()
  })

  it('selects a different currency', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Onboarding />, {
      initialData: { setupComplete: false },
    })

    // Go to Step 2
    await user.click(screen.getByText(/Set Up New/i))

    // Select "US Dollar"
    await user.click(screen.getByText('US Dollar'))

    // The USD item should show the checkmark (be selected)
    // Verify it by checking that "USD" text is visible alongside the selection
    expect(screen.getByText('USD')).toBeInTheDocument()
  })

  it('completes setup with budgets', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Onboarding />, {
      initialData: { setupComplete: false },
    })

    // Step 1 → Step 2
    await user.click(screen.getByText(/Set Up New/i))

    // Step 2 → Step 3
    await user.click(screen.getByText('Continue'))

    // In Step 3, add a budget: select category, enter amount
    const categorySelect = screen.getByDisplayValue('Select category...')
    await user.selectOptions(categorySelect, 'food')

    const amountInput = screen.getByPlaceholderText('0.00')
    // Use fireEvent for number inputs to avoid character-by-character issues
    fireEvent.change(amountInput, { target: { value: '300' } })

    // Click "Add" button
    const addBtn = screen.getByRole('button', { name: /^Add$/i })
    await user.click(addBtn)

    // Budget should be added to the list — now shows "Food & Groceries" 
    expect(screen.getByText('Food & Groceries')).toBeInTheDocument()

    // Button text should change from "Skip for Now" to "Complete Setup"
    expect(screen.getByText('Complete Setup')).toBeInTheDocument()

    // Complete setup
    await user.click(screen.getByText('Complete Setup'))

    // After completion, data should be saved with budget
    const stored = JSON.parse(localStorage.getItem('moneytracker_data'))
    expect(stored.setupComplete).toBe(true)
    expect(stored.budgets.food).toBe(300)
  })
})
