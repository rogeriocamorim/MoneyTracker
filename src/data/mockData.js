import { v4 as uuidv4 } from 'uuid'
import { format, subDays, subMonths } from 'date-fns'

const d = (daysAgo) => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
const m = (monthsAgo, day = 1) => {
  const date = subMonths(new Date(), monthsAgo)
  date.setDate(day)
  return format(date, 'yyyy-MM-dd')
}

export const mockExpenses = [
  { id: uuidv4(), date: d(0), amount: 67.43, category: 'food', description: 'Weekly groceries', paymentMethod: 'debit', merchant: 'Loblaws', tags: ['weekly'], notes: '', recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(1), amount: 14.99, category: 'subscriptions', description: 'Netflix', paymentMethod: 'credit', merchant: 'Netflix', tags: ['streaming'], notes: '', recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(2), amount: 45.00, category: 'transport', description: 'Gas fill-up', paymentMethod: 'debit', merchant: 'Petro-Canada', tags: [], notes: '', recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(3), amount: 120.00, category: 'utilities', description: 'Hydro bill', paymentMethod: 'etransfer', merchant: 'Hydro One', tags: ['bills'], notes: 'March bill', recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(4), amount: 35.50, category: 'entertainment', description: 'Movie night', paymentMethod: 'credit', merchant: 'Cineplex', tags: [], notes: '', recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(5), amount: 89.99, category: 'shopping', description: 'New headphones', paymentMethod: 'credit', merchant: 'Amazon', tags: ['electronics'], notes: '', recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(7), amount: 1500.00, category: 'housing', description: 'Rent', paymentMethod: 'etransfer', merchant: 'Landlord', tags: ['rent'], notes: '', recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(8), amount: 52.30, category: 'health', description: 'Pharmacy', paymentMethod: 'debit', merchant: 'Shoppers', tags: [], notes: '', recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(10), amount: 28.00, category: 'food', description: 'Lunch with coworkers', paymentMethod: 'credit', merchant: "Tim Horton's", tags: ['dining'], notes: '', recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(12), amount: 200.00, category: 'insurance', description: 'Car insurance', paymentMethod: 'debit', merchant: 'TD Insurance', tags: ['insurance'], notes: 'Monthly premium', recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(15), amount: 75.00, category: 'personal', description: 'Haircut & grooming', paymentMethod: 'cash', merchant: 'Barber', tags: [], notes: '', recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: d(18), amount: 42.15, category: 'food', description: 'Grocery run', paymentMethod: 'debit', merchant: 'No Frills', tags: ['weekly'], notes: '', recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  // Last month expenses
  { id: uuidv4(), date: m(1, 5), amount: 1500.00, category: 'housing', description: 'Rent', paymentMethod: 'etransfer', merchant: 'Landlord', tags: ['rent'], notes: '', recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(1, 8), amount: 310.00, category: 'food', description: 'Monthly groceries', paymentMethod: 'debit', merchant: 'Costco', tags: [], notes: '', recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(1, 12), amount: 55.00, category: 'transport', description: 'Gas', paymentMethod: 'debit', merchant: 'Shell', tags: [], notes: '', recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(1, 15), amount: 200.00, category: 'insurance', description: 'Car insurance', paymentMethod: 'debit', merchant: 'TD Insurance', tags: ['insurance'], notes: '', recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(1, 20), amount: 14.99, category: 'subscriptions', description: 'Spotify', paymentMethod: 'credit', merchant: 'Spotify', tags: ['streaming'], notes: '', recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
]

export const mockIncome = [
  { id: uuidv4(), date: m(0, 1), amount: 3100.00, source: 'salary', description: 'March salary', tags: [], recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(0, 15), amount: 3100.00, source: 'salary', description: 'March salary (2nd)', tags: [], recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(0, 10), amount: 450.00, source: 'freelance', description: 'Logo design project', tags: ['design'], recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(1, 1), amount: 3100.00, source: 'salary', description: 'Feb salary', tags: [], recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(1, 15), amount: 3100.00, source: 'salary', description: 'Feb salary (2nd)', tags: [], recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(2, 1), amount: 3100.00, source: 'salary', description: 'Jan salary', tags: [], recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(2, 15), amount: 3100.00, source: 'salary', description: 'Jan salary (2nd)', tags: [], recurring: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), date: m(2, 20), amount: 250.00, source: 'investments', description: 'Dividend payout', tags: ['passive'], recurring: false, createdAt: Date.now(), updatedAt: Date.now() },
]

export const mockBudgets = {
  food: { amount: 500, period: 'monthly', rollover: false },
  transport: { amount: 200, period: 'monthly', rollover: false },
  entertainment: { amount: 150, period: 'monthly', rollover: false },
  shopping: { amount: 200, period: 'monthly', rollover: false },
  utilities: { amount: 250, period: 'monthly', rollover: false },
  subscriptions: { amount: 50, period: 'monthly', rollover: false },
  housing: { amount: 1600, period: 'monthly', rollover: false },
  health: { amount: 100, period: 'monthly', rollover: false },
}

export const mockGoals = [
  {
    id: uuidv4(),
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 4500,
    targetDate: '2026-12-31',
    contributions: [
      { date: m(3, 1), amount: 500 },
      { date: m(2, 1), amount: 1000 },
      { date: m(1, 1), amount: 1500 },
      { date: m(0, 1), amount: 1500 },
    ],
    icon: 'Shield',
    color: '#10b981',
    createdAt: Date.now(),
  },
  {
    id: uuidv4(),
    name: 'Vacation Fund',
    targetAmount: 5000,
    currentAmount: 1200,
    targetDate: '2026-08-01',
    contributions: [
      { date: m(2, 15), amount: 400 },
      { date: m(1, 15), amount: 400 },
      { date: m(0, 15), amount: 400 },
    ],
    icon: 'Plane',
    color: '#0ea5e9',
    createdAt: Date.now(),
  },
  {
    id: uuidv4(),
    name: 'New Laptop',
    targetAmount: 2500,
    currentAmount: 2100,
    targetDate: '2026-05-01',
    contributions: [
      { date: m(4, 1), amount: 500 },
      { date: m(3, 1), amount: 500 },
      { date: m(2, 1), amount: 500 },
      { date: m(1, 1), amount: 300 },
      { date: m(0, 1), amount: 300 },
    ],
    icon: 'Laptop',
    color: '#6366f1',
    createdAt: Date.now(),
  },
]

export const mockAccounts = [
  { id: uuidv4(), name: 'CIBC Chequing', type: 'chequing', balance: 4250.00, institution: 'CIBC', color: '#6366f1' },
  { id: uuidv4(), name: 'CIBC Savings', type: 'savings', balance: 12500.00, institution: 'CIBC', color: '#10b981' },
  { id: uuidv4(), name: 'Visa Infinite', type: 'credit', balance: -1340.00, institution: 'CIBC', color: '#f43f5e' },
  { id: uuidv4(), name: 'TFSA', type: 'investment', balance: 28500.00, institution: 'Wealthsimple', color: '#0ea5e9' },
]

export const mockData = {
  version: 2,
  expenses: mockExpenses,
  income: mockIncome,
  budgets: mockBudgets,
  goals: mockGoals,
  accounts: mockAccounts,
  customCategories: [],
  settings: {
    currency: 'CAD',
    currencySymbol: '$',
    autoSyncEnabled: false,
    theme: 'light',
    sidebarCollapsed: false,
    defaultPeriod: 'this_month',
  },
  setupComplete: true,
}
