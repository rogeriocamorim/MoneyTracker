export const expenseCategories = [
  { id: 'food', name: 'Food & Groceries', icon: 'UtensilsCrossed', color: '#f97316' },
  { id: 'transport', name: 'Transport', icon: 'Car', color: '#3b82f6' },
  { id: 'utilities', name: 'Utilities', icon: 'Zap', color: '#eab308' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Gamepad2', color: '#a855f7' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'health', name: 'Health', icon: 'Heart', color: '#ef4444' },
  { id: 'education', name: 'Education', icon: 'GraduationCap', color: '#14b8a6' },
  { id: 'dining', name: 'Dining Out', icon: 'Coffee', color: '#f59e0b' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'Repeat', color: '#8b5cf6' },
  { id: 'housing', name: 'Housing', icon: 'Home', color: '#6366f1' },
  { id: 'insurance', name: 'Insurance', icon: 'Shield', color: '#0ea5e9' },
  { id: 'personal', name: 'Personal Care', icon: 'Sparkles', color: '#f472b6' },
  { id: 'gifts', name: 'Gifts & Donations', icon: 'Gift', color: '#22c55e' },
  { id: 'travel', name: 'Travel', icon: 'Plane', color: '#06b6d4' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal', color: '#6b7280' },
]

export const paymentMethods = [
  { id: 'bank', name: 'Bank Account', icon: 'Landmark', color: '#3b82f6' },
  { id: 'visa', name: 'Visa Credit Card', icon: 'CreditCard', color: '#1a1f71' },
  { id: 'mastercard', name: 'MasterCard', icon: 'CreditCard', color: '#eb001b' },
]

export const incomeSources = [
  { id: 'daily_job', name: 'Daily Job', icon: 'Briefcase', color: '#10b981' },
  { id: 'business', name: 'Personal Business', icon: 'Building2', color: '#8b5cf6' },
  { id: 'wife_business', name: "Wife's Business", icon: 'Store', color: '#f472b6' },
  { id: 'investments', name: 'Investments', icon: 'TrendingUp', color: '#3b82f6' },
  { id: 'freelance', name: 'Freelance', icon: 'Laptop', color: '#f59e0b' },
  { id: 'other', name: 'Other', icon: 'Wallet', color: '#6b7280' },
]

export const defaultBudgets = {
  food: 800,
  transport: 200,
  utilities: 300,
  entertainment: 150,
  shopping: 200,
  health: 100,
  education: 100,
  dining: 200,
  subscriptions: 100,
  housing: 1500,
  insurance: 200,
  personal: 100,
  gifts: 50,
  travel: 200,
  other: 100,
}

export const getCategoryById = (id) => expenseCategories.find(c => c.id === id)
export const getPaymentMethodById = (id) => paymentMethods.find(p => p.id === id)
export const getIncomeSourceById = (id) => incomeSources.find(s => s.id === id)

