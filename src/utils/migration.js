import { resolveCategoryId } from '@/data/categories'

/**
 * Data Migration — v1 (old format) → v2 (Money Tracker format)
 *
 * v1 shape:
 *   budgets: { food: 500, transport: 200 }
 *   expenses: [{ id, date, amount, category, description, paymentMethod, merchant, createdAt }]
 *   income: [{ id, date, amount, source, description }]
 *   No version field, no goals, no accounts
 *
 * v2 shape:
 *   budgets: { food: { amount: 500, period: "monthly", rollover: false } }
 *   expenses get: tags[], notes, recurring, updatedAt
 *   income gets: tags[], recurring, createdAt, updatedAt
 *   New: goals[], accounts[], version: 2
 */

export function migrateData(data) {
  if (!data) return data

  // Already v2
  if (data.version === 2) return data

  console.log('Migrating data from v1 to v2...')

  const migrated = { ...data, version: 2 }

  // Migrate budgets: number → { amount, period, rollover }, remap old category IDs
  if (migrated.budgets && typeof migrated.budgets === 'object') {
    const newBudgets = {}
    for (const [category, value] of Object.entries(migrated.budgets)) {
      const resolvedCategory = resolveCategoryId(category)
      if (typeof value === 'number') {
        newBudgets[resolvedCategory] = { amount: value, period: 'monthly', rollover: false }
      } else {
        newBudgets[resolvedCategory] = value
      }
    }
    migrated.budgets = newBudgets
  }

  // Migrate expenses: add missing fields, remap old category IDs
  if (Array.isArray(migrated.expenses)) {
    migrated.expenses = migrated.expenses.map((e) => ({
      ...e,
      category: resolveCategoryId(e.category),
      tags: e.tags || [],
      notes: e.notes || '',
      recurring: e.recurring ?? false,
      updatedAt: e.updatedAt || e.createdAt || Date.now(),
    }))
  }

  // Migrate income: add missing fields
  if (Array.isArray(migrated.income)) {
    migrated.income = migrated.income.map((i) => ({
      ...i,
      tags: i.tags || [],
      recurring: i.recurring ?? false,
      createdAt: i.createdAt || Date.now(),
      updatedAt: i.updatedAt || Date.now(),
    }))
  }

  // Add missing top-level fields
  migrated.goals = migrated.goals || []
  migrated.accounts = migrated.accounts || []
  migrated.customCategories = migrated.customCategories || []

  // Migrate settings
  migrated.settings = {
    currency: 'CAD',
    currencySymbol: '$',
    autoSyncEnabled: false,
    theme: 'light',
    sidebarCollapsed: false,
    defaultPeriod: 'this_month',
    ...(migrated.settings || {}),
  }

  return migrated
}
