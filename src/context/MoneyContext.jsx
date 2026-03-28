import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import { loadData, saveData } from '../utils/storage'
import { migrateData } from '../utils/migration'
import { saveToGoogleDrive, isSignedIn } from '../utils/googleDrive'

const MoneyContext = createContext(null)

const initialState = {
  version: 2,
  expenses: [],
  income: [],
  budgets: {},
  goals: [],
  accounts: [],
  customCategories: [],
  settings: {
    currency: 'CAD',
    currencySymbol: '$',
    autoSyncEnabled: false,
    theme: 'light',
    sidebarCollapsed: false,
    defaultPeriod: 'this_month',
  },
  setupComplete: false,
  isLoaded: false,
}

function reducer(state, action) {
  const now = Date.now()

  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        ...action.payload,
        customCategories: action.payload.customCategories || [],
        goals: action.payload.goals || [],
        accounts: action.payload.accounts || [],
        isLoaded: true,
      }

    case 'COMPLETE_SETUP':
      return { ...state, setupComplete: true }

    // ─── Expenses ────────────────────────────────
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [
          ...state.expenses,
          { ...action.payload, id: uuidv4(), createdAt: now, updatedAt: now },
        ],
      }

    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload, updatedAt: now } : e
        ),
      }

    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
      }

    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload }

    case 'BULK_ADD_EXPENSES': {
      if (!Array.isArray(action.payload) || action.payload.length === 0) return state
      const existingKeys = new Set(
        state.expenses.map((e) => `${e.date}|${e.amount}|${e.description}`)
      )
      const newExpenses = action.payload
        .filter((e) => !existingKeys.has(`${e.date}|${e.amount}|${e.description}`))
        .map((e) => ({ ...e, id: uuidv4(), createdAt: now, updatedAt: now }))
      if (newExpenses.length === 0) return state
      return { ...state, expenses: [...state.expenses, ...newExpenses] }
    }

    // ─── Income ──────────────────────────────────
    case 'ADD_INCOME':
      return {
        ...state,
        income: [
          ...state.income,
          { ...action.payload, id: uuidv4(), createdAt: now, updatedAt: now },
        ],
      }

    case 'UPDATE_INCOME':
      return {
        ...state,
        income: state.income.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload, updatedAt: now } : i
        ),
      }

    case 'DELETE_INCOME':
      return {
        ...state,
        income: state.income.filter((i) => i.id !== action.payload),
      }

    case 'SET_INCOME':
      return { ...state, income: action.payload }

    case 'BULK_ADD_INCOME': {
      if (!Array.isArray(action.payload) || action.payload.length === 0) return state
      const existingIncomeKeys = new Set(
        state.income.map((i) => `${i.date}|${i.amount}`)
      )
      const newIncome = action.payload.filter(
        (i) => !existingIncomeKeys.has(`${i.date}|${i.amount}`)
      )
      if (newIncome.length === 0) return state
      return {
        ...state,
        income: [
          ...state.income,
          ...newIncome.map((i) => ({ ...i, id: uuidv4(), createdAt: now, updatedAt: now })),
        ],
      }
    }

    // ─── Budgets ─────────────────────────────────
    case 'SET_BUDGET':
      return {
        ...state,
        budgets: {
          ...state.budgets,
          [action.payload.category]: {
            amount: action.payload.amount,
            period: action.payload.period || 'monthly',
            rollover: action.payload.rollover ?? false,
          },
        },
      }

    case 'REMOVE_BUDGET': {
      const { [action.payload]: _removed, ...remainingBudgets } = state.budgets
      return { ...state, budgets: remainingBudgets }
    }

    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload }

    // ─── Goals ───────────────────────────────────
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [
          ...state.goals,
          { ...action.payload, id: uuidv4(), contributions: [], createdAt: now },
        ],
      }

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? { ...g, ...action.payload } : g
        ),
      }

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      }

    case 'CONTRIBUTE_TO_GOAL': {
      const { goalId, amount, date } = action.payload
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                currentAmount: g.currentAmount + amount,
                contributions: [...g.contributions, { date, amount }],
              }
            : g
        ),
      }
    }

    // ─── Accounts ────────────────────────────────
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, { ...action.payload, id: uuidv4() }],
      }

    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ),
      }

    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.payload),
      }

    // ─── Custom Categories ───────────────────────
    case 'ADD_CUSTOM_CATEGORY':
      if (state.customCategories.some((c) => c.id === action.payload.id)) return state
      return {
        ...state,
        customCategories: [...state.customCategories, action.payload],
      }

    case 'ADD_CUSTOM_CATEGORIES': {
      const newCats = action.payload.filter(
        (newCat) => !state.customCategories.some((c) => c.id === newCat.id)
      )
      return {
        ...state,
        customCategories: [...state.customCategories, ...newCats],
      }
    }

    case 'UPDATE_CUSTOM_CATEGORY':
      return {
        ...state,
        customCategories: state.customCategories.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      }

    case 'REMOVE_CUSTOM_CATEGORY':
      return {
        ...state,
        customCategories: state.customCategories.filter((c) => c.id !== action.payload),
      }

    // ─── Settings ────────────────────────────────
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }

    // ─── Bulk ────────────────────────────────────
    case 'IMPORT_DATA':
      return {
        ...state,
        expenses: action.payload.expenses || [],
        income: action.payload.income || [],
        budgets: action.payload.budgets || {},
        goals: action.payload.goals || [],
        accounts: action.payload.accounts || [],
        customCategories: action.payload.customCategories || [],
        settings: { ...state.settings, ...(action.payload.settings || {}) },
        setupComplete: true,
      }

    case 'CLEAR_ALL':
      return { ...initialState, isLoaded: true, setupComplete: false }

    default:
      return state
  }
}

const SYNC_DEBOUNCE_MS = 2000

export function MoneyProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    lastSyncTime: null,
    syncError: null,
  })
  const syncTimerRef = useRef(null)
  const pendingDataRef = useRef(null)

  // Load + migrate data on mount
  useEffect(() => {
    const raw = loadData()
    const migrated = migrateData(raw)
    // If migration happened, save immediately
    if (raw.version !== migrated.version) {
      saveData(migrated)
    }
    dispatch({ type: 'LOAD_DATA', payload: migrated })
  }, [])

  const checkGoogleConnection = useCallback(() => {
    try {
      return isSignedIn()
    } catch {
      return false
    }
  }, [])

  const performGoogleSync = useCallback(
    async (data) => {
      if (!checkGoogleConnection()) return false
      setSyncStatus((prev) => ({ ...prev, isSyncing: true, syncError: null }))
      try {
        await saveToGoogleDrive(data)
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: Date.now(),
        }))
        return true
      } catch (error) {
        console.error('Google Drive sync failed:', error)
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          syncError: error.message,
        }))
        return false
      }
    },
    [checkGoogleConnection]
  )

  const debouncedGoogleSync = useCallback(
    (data) => {
      pendingDataRef.current = data
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      syncTimerRef.current = setTimeout(() => {
        if (pendingDataRef.current) {
          performGoogleSync(pendingDataRef.current)
          pendingDataRef.current = null
        }
      }, SYNC_DEBOUNCE_MS)
    },
    [performGoogleSync]
  )

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    }
  }, [])

  // Auto-save on state change
  useEffect(() => {
    if (state.isLoaded) {
      const { isLoaded, ...dataToSave } = state
      saveData(dataToSave)
      if (state.settings?.autoSyncEnabled && checkGoogleConnection()) {
        debouncedGoogleSync(dataToSave)
      }
    }
  }, [state, checkGoogleConnection, debouncedGoogleSync])

  const actions = {
    dispatch,
    completeSetup: () => dispatch({ type: 'COMPLETE_SETUP' }),
    // Expenses
    addExpense: (expense) => dispatch({ type: 'ADD_EXPENSE', payload: expense }),
    updateExpense: (expense) => dispatch({ type: 'UPDATE_EXPENSE', payload: expense }),
    deleteExpense: (id) => dispatch({ type: 'DELETE_EXPENSE', payload: id }),
    bulkAddExpenses: (expenses) => dispatch({ type: 'BULK_ADD_EXPENSES', payload: expenses }),
    // Income
    addIncome: (income) => dispatch({ type: 'ADD_INCOME', payload: income }),
    updateIncome: (income) => dispatch({ type: 'UPDATE_INCOME', payload: income }),
    deleteIncome: (id) => dispatch({ type: 'DELETE_INCOME', payload: id }),
    bulkAddIncome: (income) => dispatch({ type: 'BULK_ADD_INCOME', payload: income }),
    // Budgets
    setBudget: (category, amount, period, rollover) =>
      dispatch({ type: 'SET_BUDGET', payload: { category, amount, period, rollover } }),
    removeBudget: (category) => dispatch({ type: 'REMOVE_BUDGET', payload: category }),
    // Goals
    addGoal: (goal) => dispatch({ type: 'ADD_GOAL', payload: goal }),
    updateGoal: (goal) => dispatch({ type: 'UPDATE_GOAL', payload: goal }),
    deleteGoal: (id) => dispatch({ type: 'DELETE_GOAL', payload: id }),
    contributeToGoal: (goalId, amount, date) =>
      dispatch({ type: 'CONTRIBUTE_TO_GOAL', payload: { goalId, amount, date } }),
    // Accounts
    addAccount: (account) => dispatch({ type: 'ADD_ACCOUNT', payload: account }),
    updateAccount: (account) => dispatch({ type: 'UPDATE_ACCOUNT', payload: account }),
    deleteAccount: (id) => dispatch({ type: 'DELETE_ACCOUNT', payload: id }),
    // Categories
    addCustomCategory: (cat) => dispatch({ type: 'ADD_CUSTOM_CATEGORY', payload: cat }),
    addCustomCategories: (cats) => dispatch({ type: 'ADD_CUSTOM_CATEGORIES', payload: cats }),
    updateCustomCategory: (cat) => dispatch({ type: 'UPDATE_CUSTOM_CATEGORY', payload: cat }),
    removeCustomCategory: (id) => dispatch({ type: 'REMOVE_CUSTOM_CATEGORY', payload: id }),
    // Settings
    updateSettings: (settings) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    // Bulk
    importData: (data) => dispatch({ type: 'IMPORT_DATA', payload: data }),
    clearAll: () => dispatch({ type: 'CLEAR_ALL' }),
  }

  return (
    <MoneyContext.Provider value={{ state, syncStatus, ...actions }}>
      {children}
    </MoneyContext.Provider>
  )
}

export function useMoney() {
  const context = useContext(MoneyContext)
  if (!context) {
    throw new Error('useMoney must be used within a MoneyProvider')
  }
  return context
}
