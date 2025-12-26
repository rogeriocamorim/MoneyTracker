import { createContext, useContext, useReducer, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { loadData, saveData } from '../utils/storage'
import { defaultBudgets } from '../data/categories'

const MoneyContext = createContext(null)

const initialState = {
  expenses: [],
  income: [],
  budgets: defaultBudgets,
  settings: {
    currency: 'CAD',
    currencySymbol: '$',
  },
  isLoaded: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { 
        ...state, 
        ...action.payload,
        budgets: { ...defaultBudgets, ...action.payload.budgets },
        isLoaded: true,
      }
    
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, { ...action.payload, id: uuidv4() }],
      }
    
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => 
          e.id === action.payload.id ? { ...e, ...action.payload } : e
        ),
      }
    
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.payload),
      }
    
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload }
    
    case 'ADD_INCOME':
      return {
        ...state,
        income: [...state.income, { ...action.payload, id: uuidv4() }],
      }
    
    case 'UPDATE_INCOME':
      return {
        ...state,
        income: state.income.map(i => 
          i.id === action.payload.id ? { ...i, ...action.payload } : i
        ),
      }
    
    case 'DELETE_INCOME':
      return {
        ...state,
        income: state.income.filter(i => i.id !== action.payload),
      }
    
    case 'SET_INCOME':
      return { ...state, income: action.payload }
    
    case 'SET_BUDGET':
      return {
        ...state,
        budgets: { ...state.budgets, [action.payload.category]: action.payload.amount },
      }
    
    case 'REMOVE_BUDGET':
      const { [action.payload]: removed, ...remainingBudgets } = state.budgets
      return { ...state, budgets: remainingBudgets }
    
    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload }
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }
    
    case 'CLEAR_ALL':
      return {
        ...initialState,
        isLoaded: true,
      }
    
    case 'IMPORT_DATA':
      return {
        ...state,
        ...action.payload,
        budgets: { ...defaultBudgets, ...action.payload.budgets },
      }
    
    default:
      return state
  }
}

export function MoneyProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load data on mount
  useEffect(() => {
    const data = loadData()
    dispatch({ type: 'LOAD_DATA', payload: data })
  }, [])

  // Save data whenever it changes
  useEffect(() => {
    if (state.isLoaded) {
      const { isLoaded, ...dataToSave } = state
      saveData(dataToSave)
    }
  }, [state])

  const actions = {
    dispatch,
    addExpense: (expense) => dispatch({ type: 'ADD_EXPENSE', payload: expense }),
    updateExpense: (expense) => dispatch({ type: 'UPDATE_EXPENSE', payload: expense }),
    deleteExpense: (id) => dispatch({ type: 'DELETE_EXPENSE', payload: id }),
    addIncome: (income) => dispatch({ type: 'ADD_INCOME', payload: income }),
    updateIncome: (income) => dispatch({ type: 'UPDATE_INCOME', payload: income }),
    deleteIncome: (id) => dispatch({ type: 'DELETE_INCOME', payload: id }),
    setBudget: (category, amount) => dispatch({ type: 'SET_BUDGET', payload: { category, amount } }),
    removeBudget: (category) => dispatch({ type: 'REMOVE_BUDGET', payload: category }),
    updateSettings: (settings) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    importData: (data) => dispatch({ type: 'IMPORT_DATA', payload: data }),
  }

  return (
    <MoneyContext.Provider value={{ state, ...actions }}>
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
