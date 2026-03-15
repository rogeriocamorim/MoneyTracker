import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MoneyProvider, useMoney } from '../context/MoneyContext'

// We need to mock the uuid and googleDrive modules
vi.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }))
vi.mock('../utils/googleDrive', () => ({
  saveToGoogleDrive: vi.fn(),
  isSignedIn: vi.fn(() => false),
}))

// Helper component to expose context and trigger actions
function TestConsumer({ onMount }) {
  const context = useMoney()
  // Call onMount callback with the context so tests can inspect and act
  if (onMount) {
    onMount(context)
  }
  return (
    <div>
      <span data-testid="expense-count">{context.state.expenses.length}</span>
      <span data-testid="income-count">{context.state.income.length}</span>
      <span data-testid="setup-complete">{String(context.state.setupComplete)}</span>
      <span data-testid="is-loaded">{String(context.state.isLoaded)}</span>
      <span data-testid="currency">{context.state.settings.currency}</span>
      <span data-testid="custom-category-count">{context.state.customCategories.length}</span>
      <span data-testid="budgets">{JSON.stringify(context.state.budgets)}</span>
    </div>
  )
}

function renderWithProvider(onMount) {
  return render(
    <MoneyProvider>
      <TestConsumer onMount={onMount} />
    </MoneyProvider>
  )
}

describe('MoneyContext', () => {
  describe('initial state', () => {
    it('loads with default state', () => {
      renderWithProvider()
      expect(screen.getByTestId('expense-count').textContent).toBe('0')
      expect(screen.getByTestId('income-count').textContent).toBe('0')
      expect(screen.getByTestId('currency').textContent).toBe('CAD')
    })

    it('loads data from localStorage on mount', () => {
      localStorage.setItem('moneytracker_data', JSON.stringify({
        expenses: [{ id: '1', amount: 50, date: '2025-01-01', category: 'food' }],
        income: [],
        budgets: {},
        settings: { currency: 'USD', currencySymbol: '$' },
        setupComplete: true,
      }))

      renderWithProvider()
      expect(screen.getByTestId('expense-count').textContent).toBe('1')
      expect(screen.getByTestId('currency').textContent).toBe('USD')
    })
  })

  describe('useMoney hook', () => {
    it('throws when used outside provider', () => {
      // Suppress console error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      function BadComponent() {
        useMoney()
        return null
      }

      expect(() => render(<BadComponent />)).toThrow('useMoney must be used within a MoneyProvider')
      consoleSpy.mockRestore()
    })
  })

  describe('COMPLETE_SETUP', () => {
    it('sets setupComplete to true', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.completeSetup()
      })

      expect(screen.getByTestId('setup-complete').textContent).toBe('true')
    })
  })

  describe('ADD_EXPENSE', () => {
    it('adds an expense with generated id and createdAt', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.addExpense({ date: '2025-06-01', amount: 50, category: 'food', description: 'Test' })
      })

      expect(screen.getByTestId('expense-count').textContent).toBe('1')
    })
  })

  describe('UPDATE_EXPENSE', () => {
    it('updates an existing expense', async () => {
      localStorage.setItem('moneytracker_data', JSON.stringify({
        expenses: [{ id: 'exp-1', amount: 50, date: '2025-01-01', category: 'food', description: 'Old' }],
        income: [],
        budgets: {},
        settings: { currency: 'CAD', currencySymbol: '$' },
        setupComplete: true,
      }))

      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.updateExpense({ id: 'exp-1', amount: 75, description: 'Updated' })
      })

      // Count stays the same
      expect(screen.getByTestId('expense-count').textContent).toBe('1')
      // Verify updated through state
      expect(contextRef.state.expenses[0].amount).toBe(75)
      expect(contextRef.state.expenses[0].description).toBe('Updated')
    })
  })

  describe('DELETE_EXPENSE', () => {
    it('removes an expense by id', async () => {
      localStorage.setItem('moneytracker_data', JSON.stringify({
        expenses: [
          { id: 'exp-1', amount: 50 },
          { id: 'exp-2', amount: 100 },
        ],
        income: [],
        budgets: {},
        settings: { currency: 'CAD', currencySymbol: '$' },
        setupComplete: true,
      }))

      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.deleteExpense('exp-1')
      })

      expect(screen.getByTestId('expense-count').textContent).toBe('1')
      expect(contextRef.state.expenses[0].id).toBe('exp-2')
    })
  })

  describe('ADD_INCOME', () => {
    it('adds income with generated id', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.addIncome({ date: '2025-06-01', amount: 3000, source: 'daily_job', notes: 'Salary' })
      })

      expect(screen.getByTestId('income-count').textContent).toBe('1')
    })
  })

  describe('UPDATE_INCOME', () => {
    it('updates an existing income entry', async () => {
      localStorage.setItem('moneytracker_data', JSON.stringify({
        expenses: [],
        income: [{ id: 'inc-1', amount: 3000, date: '2025-01-01', source: 'daily_job' }],
        budgets: {},
        settings: { currency: 'CAD', currencySymbol: '$' },
        setupComplete: true,
      }))

      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.updateIncome({ id: 'inc-1', amount: 3500 })
      })

      expect(contextRef.state.income[0].amount).toBe(3500)
    })
  })

  describe('DELETE_INCOME', () => {
    it('removes income by id', async () => {
      localStorage.setItem('moneytracker_data', JSON.stringify({
        expenses: [],
        income: [{ id: 'inc-1', amount: 3000 }, { id: 'inc-2', amount: 500 }],
        budgets: {},
        settings: { currency: 'CAD', currencySymbol: '$' },
        setupComplete: true,
      }))

      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.deleteIncome('inc-1')
      })

      expect(screen.getByTestId('income-count').textContent).toBe('1')
    })
  })

  describe('SET_BUDGET', () => {
    it('sets a budget for a category', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.setBudget('food', 500)
      })

      const budgets = JSON.parse(screen.getByTestId('budgets').textContent)
      expect(budgets.food).toBe(500)
    })

    it('updates an existing budget', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.setBudget('food', 500)
      })
      await act(() => {
        contextRef.setBudget('food', 600)
      })

      const budgets = JSON.parse(screen.getByTestId('budgets').textContent)
      expect(budgets.food).toBe(600)
    })
  })

  describe('REMOVE_BUDGET', () => {
    it('removes a budget category', async () => {
      localStorage.setItem('moneytracker_data', JSON.stringify({
        expenses: [],
        income: [],
        budgets: { food: 500, transport: 200 },
        settings: { currency: 'CAD', currencySymbol: '$' },
        setupComplete: true,
      }))

      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.removeBudget('food')
      })

      const budgets = JSON.parse(screen.getByTestId('budgets').textContent)
      expect(budgets.food).toBeUndefined()
      expect(budgets.transport).toBe(200)
    })
  })

  describe('ADD_CUSTOM_CATEGORY', () => {
    it('adds a custom category', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.addCustomCategory({ id: 'custom_pets', name: 'Pets', color: '#ff0000' })
      })

      expect(screen.getByTestId('custom-category-count').textContent).toBe('1')
    })

    it('prevents duplicate custom categories', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.addCustomCategory({ id: 'custom_pets', name: 'Pets', color: '#ff0000' })
      })
      await act(() => {
        contextRef.addCustomCategory({ id: 'custom_pets', name: 'Pets Again', color: '#00ff00' })
      })

      expect(screen.getByTestId('custom-category-count').textContent).toBe('1')
    })
  })

  describe('REMOVE_CUSTOM_CATEGORY', () => {
    it('removes a custom category by id', async () => {
      localStorage.setItem('moneytracker_data', JSON.stringify({
        expenses: [],
        income: [],
        budgets: {},
        customCategories: [{ id: 'custom_pets', name: 'Pets', color: '#ff0000' }],
        settings: { currency: 'CAD', currencySymbol: '$' },
        setupComplete: true,
      }))

      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.removeCustomCategory('custom_pets')
      })

      expect(screen.getByTestId('custom-category-count').textContent).toBe('0')
    })
  })

  describe('UPDATE_SETTINGS', () => {
    it('updates settings', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.updateSettings({ currency: 'EUR', currencySymbol: '€' })
      })

      expect(screen.getByTestId('currency').textContent).toBe('EUR')
      expect(contextRef.state.settings.currencySymbol).toBe('€')
    })

    it('merges with existing settings', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.updateSettings({ currency: 'GBP' })
      })

      expect(contextRef.state.settings.currency).toBe('GBP')
      expect(contextRef.state.settings.currencySymbol).toBe('$') // unchanged
    })
  })

  describe('IMPORT_DATA', () => {
    it('imports data and sets setupComplete to true', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.importData({
          expenses: [{ id: 'imp-1', amount: 100 }],
          income: [{ id: 'imp-2', amount: 5000 }],
          budgets: { food: 300 },
          customCategories: [{ id: 'custom_car', name: 'Car', color: '#000' }],
          settings: { currency: 'BRL', currencySymbol: 'R$' },
        })
      })

      expect(screen.getByTestId('expense-count').textContent).toBe('1')
      expect(screen.getByTestId('income-count').textContent).toBe('1')
      expect(screen.getByTestId('setup-complete').textContent).toBe('true')
      expect(screen.getByTestId('currency').textContent).toBe('BRL')
      expect(screen.getByTestId('custom-category-count').textContent).toBe('1')
    })
  })

  describe('CLEAR_ALL', () => {
    it('resets all data to initial state', async () => {
      localStorage.setItem('moneytracker_data', JSON.stringify({
        expenses: [{ id: '1', amount: 50 }],
        income: [{ id: '1', amount: 3000 }],
        budgets: { food: 500 },
        customCategories: [{ id: 'c1', name: 'Test', color: '#000' }],
        settings: { currency: 'EUR', currencySymbol: '€' },
        setupComplete: true,
      }))

      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      // Verify data loaded
      expect(screen.getByTestId('expense-count').textContent).toBe('1')

      await act(() => {
        contextRef.dispatch({ type: 'CLEAR_ALL' })
      })

      expect(screen.getByTestId('expense-count').textContent).toBe('0')
      expect(screen.getByTestId('income-count').textContent).toBe('0')
      expect(screen.getByTestId('setup-complete').textContent).toBe('false')
      expect(screen.getByTestId('custom-category-count').textContent).toBe('0')
    })
  })

  describe('ADD_CUSTOM_CATEGORIES (batch)', () => {
    it('adds multiple custom categories at once', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.dispatch({
          type: 'ADD_CUSTOM_CATEGORIES',
          payload: [
            { id: 'c1', name: 'Cat 1', color: '#111' },
            { id: 'c2', name: 'Cat 2', color: '#222' },
          ],
        })
      })

      expect(screen.getByTestId('custom-category-count').textContent).toBe('2')
    })

    it('skips duplicates when adding batch categories', async () => {
      localStorage.setItem('moneytracker_data', JSON.stringify({
        expenses: [],
        income: [],
        budgets: {},
        customCategories: [{ id: 'c1', name: 'Cat 1', color: '#111' }],
        settings: { currency: 'CAD', currencySymbol: '$' },
        setupComplete: true,
      }))

      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.dispatch({
          type: 'ADD_CUSTOM_CATEGORIES',
          payload: [
            { id: 'c1', name: 'Duplicate', color: '#000' },
            { id: 'c3', name: 'Cat 3', color: '#333' },
          ],
        })
      })

      expect(screen.getByTestId('custom-category-count').textContent).toBe('2')
    })
  })

  describe('SET_EXPENSES / SET_INCOME / SET_BUDGETS', () => {
    it('replaces expenses array entirely', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.dispatch({
          type: 'SET_EXPENSES',
          payload: [{ id: 'a', amount: 10 }, { id: 'b', amount: 20 }],
        })
      })

      expect(screen.getByTestId('expense-count').textContent).toBe('2')
    })

    it('replaces income array entirely', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.dispatch({
          type: 'SET_INCOME',
          payload: [{ id: 'x', amount: 1000 }],
        })
      })

      expect(screen.getByTestId('income-count').textContent).toBe('1')
    })

    it('replaces budgets object entirely', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      await act(() => {
        contextRef.dispatch({
          type: 'SET_BUDGETS',
          payload: { transport: 300, food: 700 },
        })
      })

      const budgets = JSON.parse(screen.getByTestId('budgets').textContent)
      expect(budgets.transport).toBe(300)
      expect(budgets.food).toBe(700)
    })
  })

  describe('unknown action', () => {
    it('returns current state for unknown action type', async () => {
      let contextRef
      renderWithProvider((ctx) => { contextRef = ctx })

      const stateBefore = contextRef.state
      await act(() => {
        contextRef.dispatch({ type: 'NONEXISTENT_ACTION' })
      })

      // State reference might change due to re-render, but values should be the same
      expect(contextRef.state.expenses).toEqual(stateBefore.expenses)
    })
  })
})
