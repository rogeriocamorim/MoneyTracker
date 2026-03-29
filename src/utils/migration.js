import { resolveCategoryId } from '@/data/categories'
import { format } from 'date-fns'

/**
 * Data Migration
 *
 * v1 → v2: flat budgets (number) → { amount, period, rollover }, add expense/income fields
 * v2 → v3: flat budgets { catId: { amount } } → monthly { "YYYY-MM": { catId: { amount } } }
 */

export function migrateData(data) {
  if (!data) return data

  // Already current
  if (data.version === 3) return data

  let migrated = { ...data }

  // ─── v1 → v2 ───────────────────────────────────
  if (!migrated.version || migrated.version < 2) {
    console.log('Migrating data from v1 to v2...')
    migrated.version = 2

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
  }

  // ─── v2 → v3: monthly budgets ──────────────────
  if (migrated.version === 2) {
    console.log('Migrating data from v2 to v3 (monthly budgets)...')
    migrated.version = 3

    if (migrated.budgets && typeof migrated.budgets === 'object') {
      const oldBudgets = migrated.budgets
      // Check if already in monthly format (keys look like "YYYY-MM")
      const isAlreadyMonthly = Object.keys(oldBudgets).some((k) => /^\d{4}-\d{2}$/.test(k))

      if (!isAlreadyMonthly) {
        // Move flat budgets under the current month, filtering out invalid entries
        const currentMonth = format(new Date(), 'yyyy-MM')
        const validBudgets = {}
        for (const [cat, config] of Object.entries(oldBudgets)) {
          // Skip "undefined" or entries without amount
          if (cat === 'undefined' || !config || (!config.amount && typeof config !== 'number')) continue
          validBudgets[cat] = typeof config === 'number'
            ? { amount: config, period: 'monthly', rollover: false }
            : config
        }
        migrated.budgets = Object.keys(validBudgets).length > 0
          ? { [currentMonth]: validBudgets }
          : {}
      }
    }
  }

  return migrated
}
