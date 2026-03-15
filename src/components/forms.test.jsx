import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MoneyProvider } from '../context/MoneyContext'
import { format } from 'date-fns'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock googleDrive (required by Settings)
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

// Mock ReceiptScanner to avoid Tesseract/QR code complexities
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
const today = format(new Date(), 'yyyy-MM-dd')

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

// ─── ExpenseForm ──────────────────────────────────────────────────────────────

describe('ExpenseForm', () => {
  let ExpenseForm

  beforeEach(async () => {
    ExpenseForm = (await import('./ExpenseForm')).default
    localStorage.clear()
  })

  it('submits a new expense', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<ExpenseForm onClose={onClose} />)

    // Fill amount
    const amountInput = screen.getByPlaceholderText('0.00')
    await user.clear(amountInput)
    await user.type(amountInput, '25.50')

    // Fill description
    const descInput = screen.getByPlaceholderText('What was this for?')
    await user.type(descInput, 'Test grocery')

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Add Expense/i })
    await user.click(submitBtn)

    expect(onClose).toHaveBeenCalled()

    // Verify expense was saved to localStorage
    const stored = JSON.parse(localStorage.getItem('moneytracker_data'))
    expect(stored.expenses).toHaveLength(1)
    expect(stored.expenses[0].amount).toBe(25.5)
    expect(stored.expenses[0].description).toBe('Test grocery')
  })

  it('pre-populates fields in edit mode', () => {
    const expense = {
      id: 'e-edit',
      date: '2025-06-10',
      amount: 99.99,
      category: 'food',
      description: 'Original desc',
      paymentMethod: 'visa',
    }
    const onClose = vi.fn()
    renderWithProviders(<ExpenseForm expense={expense} onClose={onClose} />)

    // Check header says Edit
    expect(screen.getByText('Edit Expense')).toBeInTheDocument()

    // Check amount pre-populated
    const amountInput = screen.getByPlaceholderText('0.00')
    expect(amountInput.value).toBe('99.99')

    // Check description pre-populated
    const descInput = screen.getByPlaceholderText('What was this for?')
    expect(descInput.value).toBe('Original desc')

    // Check submit button says Update
    expect(screen.getByRole('button', { name: /Update Expense/i })).toBeInTheDocument()
  })

  it('creates a custom category inline', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<ExpenseForm onClose={onClose} />)

    // Click "Add new category" link
    const addCatBtn = screen.getByText(/Add new category/i)
    await user.click(addCatBtn)

    // Type custom category name
    const catInput = screen.getByPlaceholderText('Enter category name')
    await user.type(catInput, 'Pet Supplies')

    // Click the "Add" button
    const addBtn = screen.getByRole('button', { name: /^Add$/i })
    await user.click(addBtn)

    // Verify custom category was saved
    const stored = JSON.parse(localStorage.getItem('moneytracker_data'))
    expect(stored.customCategories).toHaveLength(1)
    expect(stored.customCategories[0].name).toBe('Pet Supplies')
    expect(stored.customCategories[0].id).toBe('pet-supplies')
  })

  it('merges receipt scanner data into form', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<ExpenseForm onClose={onClose} />)

    // Open receipt scanner
    const scanBtn = screen.getByTitle('Scan Receipt')
    await user.click(scanBtn)

    // Click mock extract button
    const extractBtn = screen.getByText('Mock Extract')
    await user.click(extractBtn)

    // Check that form fields are updated with receipt data
    const amountInput = screen.getByPlaceholderText('0.00')
    expect(amountInput.value).toBe('42.99')

    const descInput = screen.getByPlaceholderText('What was this for?')
    expect(descInput.value).toBe('Costco')
  })
})

// ─── IncomeForm ───────────────────────────────────────────────────────────────

describe('IncomeForm', () => {
  let IncomeForm

  beforeEach(async () => {
    IncomeForm = (await import('./IncomeForm')).default
    localStorage.clear()
  })

  it('submits a new income', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<IncomeForm onClose={onClose} />)

    // Fill amount
    const amountInput = screen.getByPlaceholderText('0.00')
    await user.clear(amountInput)
    await user.type(amountInput, '3000')

    // Fill notes
    const notesInput = screen.getByPlaceholderText('Optional description')
    await user.type(notesInput, 'Monthly salary')

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Add Income/i })
    await user.click(submitBtn)

    expect(onClose).toHaveBeenCalled()

    const stored = JSON.parse(localStorage.getItem('moneytracker_data'))
    expect(stored.income).toHaveLength(1)
    expect(stored.income[0].amount).toBe(3000)
    expect(stored.income[0].notes).toBe('Monthly salary')
  })

  it('pre-populates fields in edit mode', () => {
    const income = {
      id: 'i-edit',
      date: '2025-06-01',
      amount: 5000,
      source: 'freelance',
      notes: 'Side project',
    }
    const onClose = vi.fn()
    renderWithProviders(<IncomeForm income={income} onClose={onClose} />)

    expect(screen.getByText('Edit Income')).toBeInTheDocument()

    const amountInput = screen.getByPlaceholderText('0.00')
    expect(amountInput.value).toBe('5000')

    const notesInput = screen.getByPlaceholderText('Optional description')
    expect(notesInput.value).toBe('Side project')

    expect(screen.getByRole('button', { name: /Update Income/i })).toBeInTheDocument()
  })
})

// ─── BudgetForm ───────────────────────────────────────────────────────────────

describe('BudgetForm', () => {
  let BudgetForm

  beforeEach(async () => {
    BudgetForm = (await import('./BudgetForm')).default
    localStorage.clear()
  })

  it('adds a budget with predefined category', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<BudgetForm onClose={onClose} />)

    // The "Predefined" button should be active by default
    expect(screen.getByRole('button', { name: /Predefined/i })).toBeInTheDocument()

    // Select a category from the dropdown
    const categorySelect = screen.getByRole('combobox')
    await user.selectOptions(categorySelect, 'food')

    // Enter amount
    const amountInput = screen.getByPlaceholderText('0.00')
    await user.clear(amountInput)
    await user.type(amountInput, '300')

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Set Budget/i })
    await user.click(submitBtn)

    expect(onClose).toHaveBeenCalled()

    const stored = JSON.parse(localStorage.getItem('moneytracker_data'))
    expect(stored.budgets.food).toBe(300)
  })

  it('adds a budget with custom category', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<BudgetForm onClose={onClose} />)

    // Switch to Custom tab
    const customBtn = screen.getByRole('button', { name: /Custom/i })
    await user.click(customBtn)

    // Enter custom category name
    const catInput = screen.getByPlaceholderText('Enter category name...')
    await user.type(catInput, 'Gym')

    // Enter amount
    const amountInput = screen.getByPlaceholderText('0.00')
    await user.clear(amountInput)
    await user.type(amountInput, '50')

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Set Budget/i })
    await user.click(submitBtn)

    expect(onClose).toHaveBeenCalled()

    const stored = JSON.parse(localStorage.getItem('moneytracker_data'))
    expect(stored.budgets['custom_gym']).toBe(50)
    expect(stored.customCategories).toHaveLength(1)
    expect(stored.customCategories[0].name).toBe('Gym')
  })

  it('sets amount via quick select buttons', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<BudgetForm onClose={onClose} />)

    // Click $500 quick button
    const quickBtn = screen.getByRole('button', { name: '$500' })
    await user.click(quickBtn)

    const amountInput = screen.getByPlaceholderText('0.00')
    expect(amountInput.value).toBe('500')
  })

  it('disables category select in edit mode', () => {
    const budget = { category: 'food', amount: 300 }
    const onClose = vi.fn()
    renderWithProviders(<BudgetForm budget={budget} onClose={onClose} />)

    expect(screen.getByText('Edit Budget')).toBeInTheDocument()
    expect(screen.getByText('Category cannot be changed when editing')).toBeInTheDocument()

    const categorySelect = screen.getByRole('combobox')
    expect(categorySelect).toBeDisabled()
  })
})

// ─── ExpenseList: Edit & Delete ───────────────────────────────────────────────

describe('ExpenseList interactions', () => {
  let ExpenseList

  beforeEach(async () => {
    ExpenseList = (await import('./ExpenseList')).default
    localStorage.clear()
  })

  it('opens edit form when clicking edit button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExpenseList />, {
      initialData: {
        expenses: [
          { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Groceries', createdAt: Date.now() },
        ],
      },
    })

    // Click edit button (title="Edit expense")
    const editBtn = screen.getByTitle('Edit expense')
    await user.click(editBtn)

    // The edit form should now be visible with "Edit Expense" heading
    expect(screen.getByText('Edit Expense')).toBeInTheDocument()

    // Amount should be pre-populated
    const amountInput = screen.getByPlaceholderText('0.00')
    expect(amountInput.value).toBe('50')
  })

  it('deletes expense when clicking delete and confirming', async () => {
    const user = userEvent.setup()
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(<ExpenseList />, {
      initialData: {
        expenses: [
          { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Groceries', createdAt: Date.now() },
        ],
      },
    })

    expect(screen.getByText('Groceries')).toBeInTheDocument()

    // Click delete button
    const deleteBtn = screen.getByTitle('Delete expense')
    await user.click(deleteBtn)

    expect(window.confirm).toHaveBeenCalledWith('Delete this expense?')

    // Expense should be removed — shows empty state
    expect(screen.getByText(/No expenses/i)).toBeInTheDocument()

    window.confirm.mockRestore()
  })
})

// ─── IncomeList: Delete ───────────────────────────────────────────────────────

describe('IncomeList interactions', () => {
  let IncomeList

  beforeEach(async () => {
    IncomeList = (await import('./IncomeList')).default
    localStorage.clear()
  })

  it('deletes income when clicking delete and confirming', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(<IncomeList />, {
      initialData: {
        income: [
          { id: 'i1', date: `${thisMonth}-01`, amount: 3000, source: 'daily_job', notes: 'Salary' },
        ],
      },
    })

    expect(screen.getByText('Salary')).toBeInTheDocument()

    const deleteBtn = screen.getByTitle('Delete income')
    await user.click(deleteBtn)

    expect(window.confirm).toHaveBeenCalledWith('Delete this income?')
    expect(screen.getByText(/No income/i)).toBeInTheDocument()

    window.confirm.mockRestore()
  })
})

// ─── Settings: Clear Data ─────────────────────────────────────────────────────

describe('Settings clear data', () => {
  let Settings

  beforeEach(async () => {
    Settings = (await import('./Settings')).default
    localStorage.clear()
  })

  it('shows confirmation then clears all data', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Settings />, {
      initialData: {
        expenses: [
          { id: 'e1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Test', createdAt: Date.now() },
        ],
      },
    })

    // Click "Reset App & Clear All Data"
    const resetBtn = screen.getByRole('button', { name: /Reset App/i })
    await user.click(resetBtn)

    // Confirmation text should appear
    expect(screen.getByText(/This will delete all expenses/i)).toBeInTheDocument()

    // Click "Confirm Reset"
    const confirmBtn = screen.getByRole('button', { name: /Confirm Reset/i })
    await user.click(confirmBtn)

    // Data should be cleared in localStorage
    const stored = JSON.parse(localStorage.getItem('moneytracker_data'))
    expect(stored.expenses).toHaveLength(0)
    expect(stored.income).toHaveLength(0)
    expect(stored.setupComplete).toBe(false)
  })
})
