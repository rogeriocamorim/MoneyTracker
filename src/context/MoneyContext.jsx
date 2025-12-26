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

const actionTypes = {
  LOAD_DATA: 'LOAD_DATA',
  ADD_EXPENSE: 'ADD_EXPENSE',
  UPDATE_EXPENSE: 'UPDATE_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE',
  ADD_INCOME: 'ADD_INCOME',
  UPDATE_INCOME: 'UPDATE_INCOME',
  DELETE_INCOME: 'DELETE_INCOME',
  UPDATE_BUDGET: 'UPDATE_BUDGET',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  IMPORT_DATA: 'IMPORT_DATA',
}

function reducer(state, action) {
  switch (action.type) {
    case actionTypes.LOAD_DATA:
      return { 
        ...state, 
        ...action.payload,
        budgets: { ...defaultBudgets, ...action.payload.budgets },
        isLoaded: true,
      }
    
    case actionTypes.ADD_EXPENSE:
      return {
        ...state,
        expenses: [...state.expenses, { ...action.payload, id: uuidv4() }],
      }
    
    case actionTypes.UPDATE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.map(e => 
          e.id === action.payload.id ? { ...e, ...action.payload } : e
        ),
      }
    
    case actionTypes.DELETE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.payload),
      }
    
    case actionTypes.ADD_INCOME:
      return {
        ...state,
        income: [...state.income, { ...action.payload, id: uuidv4() }],
      }
    
    case actionTypes.UPDATE_INCOME:
      return {
        ...state,
        income: state.income.map(i => 
          i.id === action.payload.id ? { ...i, ...action.payload } : i
        ),
      }
    
    case actionTypes.DELETE_INCOME:
      return {
        ...state,
        income: state.income.filter(i => i.id !== action.payload),
      }
    
    case actionTypes.UPDATE_BUDGET:
      return {
        ...state,
        budgets: { ...state.budgets, [action.payload.category]: action.payload.amount },
      }
    
    case actionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }
    
    case actionTypes.IMPORT_DATA:
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
    dispatch({ type: actionTypes.LOAD_DATA, payload: data })
  }, [])

  // Save data whenever it changes
  useEffect(() => {
    if (state.isLoaded) {
      const { isLoaded, ...dataToSave } = state
      saveData(dataToSave)
    }
  }, [state])

  const actions = {
    addExpense: (expense) => dispatch({ type: actionTypes.ADD_EXPENSE, payload: expense }),
    updateExpense: (expense) => dispatch({ type: actionTypes.UPDATE_EXPENSE, payload: expense }),
    deleteExpense: (id) => dispatch({ type: actionTypes.DELETE_EXPENSE, payload: id }),
    addIncome: (income) => dispatch({ type: actionTypes.ADD_INCOME, payload: income }),
    updateIncome: (income) => dispatch({ type: actionTypes.UPDATE_INCOME, payload: income }),
    deleteIncome: (id) => dispatch({ type: actionTypes.DELETE_INCOME, payload: id }),
    updateBudget: (category, amount) => dispatch({ type: actionTypes.UPDATE_BUDGET, payload: { category, amount } }),
    updateSettings: (settings) => dispatch({ type: actionTypes.UPDATE_SETTINGS, payload: settings }),
    importData: (data) => dispatch({ type: actionTypes.IMPORT_DATA, payload: data }),
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

