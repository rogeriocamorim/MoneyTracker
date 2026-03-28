export const expenseCategories = [
  { id: 'food', name: 'Food & Groceries', icon: 'UtensilsCrossed', color: '#f97316' },
  { id: 'transport', name: 'Transport', icon: 'Car', color: '#0891b2' },
  { id: 'utilities', name: 'Utilities', icon: 'Zap', color: '#eab308' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Gamepad2', color: '#a855f7' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'health', name: 'Health', icon: 'Heart', color: '#ef4444' },
  { id: 'housing', name: 'Housing / Rent', icon: 'Home', color: '#6366f1' },
  { id: 'education', name: 'Education', icon: 'GraduationCap', color: '#0ea5e9' },
  { id: 'personal', name: 'Personal Care', icon: 'Sparkles', color: '#f472b6' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'CreditCard', color: '#8b5cf6' },
  { id: 'travel', name: 'Travel', icon: 'Plane', color: '#14b8a6' },
  { id: 'gifts', name: 'Gifts & Donations', icon: 'Gift', color: '#f43f5e' },
  { id: 'insurance', name: 'Insurance', icon: 'Shield', color: '#64748b' },
  { id: 'wife_business', name: "Wife's Business", icon: 'Store', color: '#f472b6' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal', color: '#94a3b8' },
]

export const incomeSources = [
  { id: 'salary', name: 'Salary', icon: 'Briefcase', color: '#10b981' },
  { id: 'freelance', name: 'Freelance', icon: 'Laptop', color: '#f59e0b' },
  { id: 'investments', name: 'Investments', icon: 'TrendingUp', color: '#6366f1' },
  { id: 'business', name: 'Business', icon: 'Store', color: '#f472b6' },
  { id: 'other', name: 'Other', icon: 'Wallet', color: '#94a3b8' },
]

export const paymentMethods = [
  { id: 'debit', name: 'Debit Card', icon: 'CreditCard' },
  { id: 'credit', name: 'Credit Card', icon: 'CreditCard' },
  { id: 'cash', name: 'Cash', icon: 'Banknote' },
  { id: 'etransfer', name: 'e-Transfer', icon: 'ArrowRightLeft' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal' },
]

export const accountTypes = [
  { id: 'chequing', name: 'Chequing', icon: 'Landmark' },
  { id: 'savings', name: 'Savings', icon: 'PiggyBank' },
  { id: 'credit', name: 'Credit Card', icon: 'CreditCard' },
  { id: 'investment', name: 'Investment', icon: 'TrendingUp' },
  { id: 'cash', name: 'Cash', icon: 'Banknote' },
]

/**
 * Maps old MoneyTracker v1 category IDs to v2 IDs.
 * Covers common aliases and slight naming differences.
 */
export const categoryAliases = {
  // Old food-related
  dining: 'food',
  groceries: 'food',
  'food & dining': 'food',
  'food_dining': 'food',
  restaurant: 'food',
  restaurants: 'food',
  // Old transport-related
  transportation: 'transport',
  gas: 'transport',
  fuel: 'transport',
  auto: 'transport',
  car: 'transport',
  transit: 'transport',
  // Old utilities
  bills: 'utilities',
  'bills & utilities': 'utilities',
  electricity: 'utilities',
  internet: 'utilities',
  phone: 'utilities',
  // Old entertainment
  fun: 'entertainment',
  leisure: 'entertainment',
  movies: 'entertainment',
  games: 'entertainment',
  // Old housing
  rent: 'housing',
  mortgage: 'housing',
  home: 'housing',
  // Old health
  medical: 'health',
  healthcare: 'health',
  gym: 'health',
  fitness: 'health',
  // Old education
  school: 'education',
  tuition: 'education',
  books: 'education',
  courses: 'education',
  // Old personal
  clothing: 'personal',
  clothes: 'personal',
  beauty: 'personal',
  haircut: 'personal',
  // Old subscriptions
  subscription: 'subscriptions',
  streaming: 'subscriptions',
  membership: 'subscriptions',
  // Old gifts
  donation: 'gifts',
  donations: 'gifts',
  charity: 'gifts',
  gift: 'gifts',
  // Old travel
  vacation: 'travel',
  trips: 'travel',
  flight: 'travel',
  hotel: 'travel',
}

/**
 * Resolve a category ID, checking aliases for old v1 data.
 */
export const resolveCategoryId = (id) => {
  if (!id) return id
  return categoryAliases[id.toLowerCase()] || id
}

// Apply name overrides from categoryOverrides state
const applyOverride = (cat, overrides) => {
  if (!overrides || !cat) return cat
  const override = overrides[cat.id]
  return override ? { ...cat, ...override } : cat
}

export const getCategoryById = (id, customCategories = [], overrides = {}) => {
  // Try direct match first
  const predefined = expenseCategories.find((c) => c.id === id)
  if (predefined) return applyOverride(predefined, overrides)

  // Try alias resolution
  const resolvedId = resolveCategoryId(id)
  if (resolvedId !== id) {
    const aliased = expenseCategories.find((c) => c.id === resolvedId)
    if (aliased) return applyOverride(aliased, overrides)
  }

  const custom = customCategories.find((c) => c.id === id)
  if (custom) return applyOverride({ ...custom, icon: custom.icon || 'Tag' }, overrides)

  if (id) {
    return {
      id,
      name: id.replace(/^custom_/, '').replace(/_/g, ' '),
      icon: 'Tag',
      color: '#94a3b8',
    }
  }

  return null
}

export const getAllCategories = (customCategories = [], overrides = {}) => {
  const customWithIcon = customCategories.map((c) => ({
    ...c,
    icon: c.icon || 'Tag',
  }))
  return [...expenseCategories, ...customWithIcon].map((c) => applyOverride(c, overrides))
}

export const getIncomeSourceById = (id, customSources = [], overrides = {}) => {
  const predefined = incomeSources.find((s) => s.id === id)
  if (predefined) return applyOverride(predefined, overrides)

  const custom = customSources.find((c) => c.id === id)
  if (custom) return applyOverride({ ...custom, icon: custom.icon || 'Wallet' }, overrides)

  if (id) {
    return {
      id,
      name: id.replace(/^custom_/, '').replace(/_/g, ' '),
      icon: 'Wallet',
      color: '#94a3b8',
    }
  }

  return null
}

export const getAllIncomeSources = (customSources = [], overrides = {}) => {
  const customWithIcon = customSources
    .filter((c) => c.type === 'income')
    .map((c) => ({ ...c, icon: c.icon || 'Wallet' }))
  return [...incomeSources, ...customWithIcon].map((c) => applyOverride(c, overrides))
}

export const getPaymentMethodById = (id) => {
  return paymentMethods.find((p) => p.id === id) || { id, name: id, icon: 'MoreHorizontal' }
}
