import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MoneyProvider } from '../context/MoneyContext'

/**
 * Renders a component wrapped in MoneyProvider and MemoryRouter.
 * 
 * @param {React.ReactElement} ui - Component to render
 * @param {object} options
 * @param {string[]} options.initialEntries - MemoryRouter initial entries
 * @param {object} options.initialData - Data to pre-populate in localStorage
 * @param {object} options.renderOptions - Additional render options
 */
export function renderWithProviders(ui, {
  initialEntries = ['/'],
  initialData = null,
  ...renderOptions
} = {}) {
  if (initialData) {
    localStorage.setItem('moneytracker_data', JSON.stringify({
      expenses: [],
      income: [],
      budgets: {},
      customCategories: [],
      settings: { currency: 'CAD', currencySymbol: '$', autoSyncEnabled: false },
      setupComplete: true,
      ...initialData,
    }))
  } else {
    // Default: setupComplete so app renders main routes
    localStorage.setItem('moneytracker_data', JSON.stringify({
      expenses: [],
      income: [],
      budgets: {},
      customCategories: [],
      settings: { currency: 'CAD', currencySymbol: '$', autoSyncEnabled: false },
      setupComplete: true,
    }))
  }

  function Wrapper({ children }) {
    return (
      <MoneyProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </MoneyProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Sample data for tests
 */
export const sampleExpenses = [
  { id: 'exp-1', date: '2025-06-05', amount: 50, category: 'food', paymentMethod: 'visa', description: 'Groceries', createdAt: Date.now() },
  { id: 'exp-2', date: '2025-06-10', amount: 30, category: 'transport', paymentMethod: 'bank', description: 'Gas', createdAt: Date.now() },
  { id: 'exp-3', date: '2025-06-15', amount: 120, category: 'utilities', paymentMethod: 'bank', description: 'Electricity', createdAt: Date.now() },
]

export const sampleIncome = [
  { id: 'inc-1', date: '2025-06-01', amount: 3000, source: 'daily_job', notes: 'Salary' },
  { id: 'inc-2', date: '2025-06-15', amount: 500, source: 'freelance', notes: 'Side project' },
]

export const sampleBudgets = {
  food: 300,
  transport: 200,
  utilities: 150,
}
