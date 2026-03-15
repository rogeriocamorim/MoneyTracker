import { describe, it, expect, vi, beforeEach } from 'vitest'
import { format, subMonths } from 'date-fns'
import {
  formatCurrency,
  getMonthlyExpenses,
  getMonthlyIncome,
  getTotalByCategory,
  getTotalByPaymentMethod,
  getTotalBySource,
  getTotal,
  getBudgetProgress,
  getMonthlyTrend,
  getIncomeTrend,
  getCombinedTrend,
  getDateRangeForPeriod,
  filterByDateRange,
  getPeriodLabel,
} from '../utils/calculations'

// ─── Test Data ────────────────────────────────────────────────────────────────

const now = new Date()
const thisMonth = format(now, 'yyyy-MM')
const lastMonth = format(subMonths(now, 1), 'yyyy-MM')

const sampleExpenses = [
  { id: '1', date: `${thisMonth}-05`, amount: 50, category: 'food', paymentMethod: 'visa', description: 'Groceries' },
  { id: '2', date: `${thisMonth}-10`, amount: 30, category: 'transport', paymentMethod: 'bank', description: 'Gas' },
  { id: '3', date: `${thisMonth}-15`, amount: 20, category: 'food', paymentMethod: 'mastercard', description: 'Coffee' },
  { id: '4', date: `${lastMonth}-05`, amount: 100, category: 'utilities', paymentMethod: 'bank', description: 'Electricity' },
  { id: '5', date: `${lastMonth}-20`, amount: 200, category: 'food', paymentMethod: 'visa', description: 'Big grocery run' },
]

const sampleIncome = [
  { id: '1', date: `${thisMonth}-01`, amount: 3000, source: 'daily_job', notes: 'Salary' },
  { id: '2', date: `${thisMonth}-15`, amount: 500, source: 'freelance', notes: 'Side project' },
  { id: '3', date: `${lastMonth}-01`, amount: 3000, source: 'daily_job', notes: 'Salary' },
  { id: '4', date: `${lastMonth}-10`, amount: 200, source: 'investments', notes: 'Dividends' },
]

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats a whole number with 2 decimal places', () => {
    const result = formatCurrency(100)
    expect(result).toContain('100.00')
    expect(result.startsWith('$')).toBe(true)
  })

  it('formats a decimal number', () => {
    const result = formatCurrency(49.5)
    expect(result).toContain('49.50')
  })

  it('uses a custom symbol', () => {
    const result = formatCurrency(10, '€')
    expect(result.startsWith('€')).toBe(true)
  })

  it('formats large numbers with commas', () => {
    const result = formatCurrency(1234567.89)
    expect(result).toContain('1,234,567.89')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0.00')
  })
})

// ─── getMonthlyExpenses ───────────────────────────────────────────────────────

describe('getMonthlyExpenses', () => {
  it('returns only expenses for the current month', () => {
    const result = getMonthlyExpenses(sampleExpenses)
    expect(result).toHaveLength(3)
    result.forEach(e => {
      expect(e.date.startsWith(thisMonth)).toBe(true)
    })
  })

  it('returns expenses for a specific month', () => {
    const result = getMonthlyExpenses(sampleExpenses, subMonths(now, 1))
    expect(result).toHaveLength(2)
    result.forEach(e => {
      expect(e.date.startsWith(lastMonth)).toBe(true)
    })
  })

  it('returns empty array when no expenses match', () => {
    const result = getMonthlyExpenses(sampleExpenses, subMonths(now, 12))
    expect(result).toHaveLength(0)
  })

  it('handles empty expenses array', () => {
    const result = getMonthlyExpenses([])
    expect(result).toHaveLength(0)
  })
})

// ─── getMonthlyIncome ─────────────────────────────────────────────────────────

describe('getMonthlyIncome', () => {
  it('returns only income for the current month', () => {
    const result = getMonthlyIncome(sampleIncome)
    expect(result).toHaveLength(2)
    result.forEach(i => {
      expect(i.date.startsWith(thisMonth)).toBe(true)
    })
  })

  it('returns income for last month', () => {
    const result = getMonthlyIncome(sampleIncome, subMonths(now, 1))
    expect(result).toHaveLength(2)
  })

  it('handles empty income array', () => {
    const result = getMonthlyIncome([])
    expect(result).toHaveLength(0)
  })
})

// ─── getTotalByCategory ───────────────────────────────────────────────────────

describe('getTotalByCategory', () => {
  it('groups expense amounts by category', () => {
    const result = getTotalByCategory(sampleExpenses)
    expect(result.food).toBe(270)       // 50 + 20 + 200
    expect(result.transport).toBe(30)
    expect(result.utilities).toBe(100)
  })

  it('returns empty object for empty expenses', () => {
    const result = getTotalByCategory([])
    expect(result).toEqual({})
  })
})

// ─── getTotalByPaymentMethod ──────────────────────────────────────────────────

describe('getTotalByPaymentMethod', () => {
  it('groups expense amounts by payment method', () => {
    const result = getTotalByPaymentMethod(sampleExpenses)
    expect(result.visa).toBe(250)       // 50 + 200
    expect(result.bank).toBe(130)       // 30 + 100
    expect(result.mastercard).toBe(20)
  })

  it('returns empty object for empty expenses', () => {
    const result = getTotalByPaymentMethod([])
    expect(result).toEqual({})
  })
})

// ─── getTotalBySource ─────────────────────────────────────────────────────────

describe('getTotalBySource', () => {
  it('groups income amounts by source', () => {
    const result = getTotalBySource(sampleIncome)
    expect(result.daily_job).toBe(6000)   // 3000 + 3000
    expect(result.freelance).toBe(500)
    expect(result.investments).toBe(200)
  })

  it('returns empty object for empty income', () => {
    const result = getTotalBySource([])
    expect(result).toEqual({})
  })
})

// ─── getTotal ─────────────────────────────────────────────────────────────────

describe('getTotal', () => {
  it('sums all amounts', () => {
    const result = getTotal(sampleExpenses)
    expect(result).toBe(400) // 50 + 30 + 20 + 100 + 200
  })

  it('returns 0 for empty array', () => {
    expect(getTotal([])).toBe(0)
  })

  it('handles single item', () => {
    expect(getTotal([{ amount: 42 }])).toBe(42)
  })
})

// ─── getBudgetProgress ────────────────────────────────────────────────────────

describe('getBudgetProgress', () => {
  const budgets = { food: 300, transport: 100, entertainment: 200 }

  it('calculates budget progress for each category', () => {
    const result = getBudgetProgress(sampleExpenses, budgets)
    expect(result).toHaveLength(3)

    const foodBudget = result.find(b => b.category === 'food')
    expect(foodBudget.budget).toBe(300)
    expect(foodBudget.spent).toBe(270)
    expect(foodBudget.remaining).toBe(30)
    expect(foodBudget.percentage).toBeCloseTo(90, 0)
  })

  it('returns 0% for categories with no spending', () => {
    const result = getBudgetProgress(sampleExpenses, budgets)
    const entertainment = result.find(b => b.category === 'entertainment')
    expect(entertainment.spent).toBe(0)
    expect(entertainment.percentage).toBe(0)
  })

  it('handles 0 budget amount (avoid division by zero)', () => {
    const result = getBudgetProgress(sampleExpenses, { food: 0 })
    expect(result[0].percentage).toBe(0)
  })

  it('handles empty budgets', () => {
    const result = getBudgetProgress(sampleExpenses, {})
    expect(result).toHaveLength(0)
  })
})

// ─── getMonthlyTrend ──────────────────────────────────────────────────────────

describe('getMonthlyTrend', () => {
  it('returns correct number of months', () => {
    const result = getMonthlyTrend(sampleExpenses, 6)
    expect(result).toHaveLength(6)
  })

  it('each entry has required properties', () => {
    const result = getMonthlyTrend(sampleExpenses, 3)
    result.forEach(entry => {
      expect(entry).toHaveProperty('month')
      expect(entry).toHaveProperty('shortMonth')
      expect(entry).toHaveProperty('total')
      expect(typeof entry.total).toBe('number')
    })
  })

  it('most recent month is last in the array', () => {
    const result = getMonthlyTrend(sampleExpenses, 3)
    const lastEntry = result[result.length - 1]
    expect(lastEntry.month).toBe(format(now, 'MMM yyyy'))
  })
})

// ─── getIncomeTrend ───────────────────────────────────────────────────────────

describe('getIncomeTrend', () => {
  it('returns correct number of months', () => {
    const result = getIncomeTrend(sampleIncome, 6)
    expect(result).toHaveLength(6)
  })

  it('each entry has required properties', () => {
    const result = getIncomeTrend(sampleIncome, 3)
    result.forEach(entry => {
      expect(entry).toHaveProperty('month')
      expect(entry).toHaveProperty('shortMonth')
      expect(entry).toHaveProperty('total')
    })
  })
})

// ─── getCombinedTrend ─────────────────────────────────────────────────────────

describe('getCombinedTrend', () => {
  it('returns entries with expenses, income, and savings', () => {
    const result = getCombinedTrend(sampleExpenses, sampleIncome, 3)
    expect(result).toHaveLength(3)
    result.forEach(entry => {
      expect(entry).toHaveProperty('expenses')
      expect(entry).toHaveProperty('income')
      expect(entry).toHaveProperty('savings')
      expect(entry.savings).toBe(entry.income - entry.expenses)
    })
  })
})

// ─── getDateRangeForPeriod ────────────────────────────────────────────────────

describe('getDateRangeForPeriod', () => {
  it('returns start/end for this_month', () => {
    const result = getDateRangeForPeriod('this_month')
    expect(result.start).toBeInstanceOf(Date)
    expect(result.end).toBeInstanceOf(Date)
    expect(result.start <= result.end).toBe(true)
  })

  it('returns start/end for last_month', () => {
    const result = getDateRangeForPeriod('last_month')
    expect(result.start < now).toBe(true)
  })

  it('returns wide range for all_time', () => {
    const result = getDateRangeForPeriod('all_time')
    expect(result.start.getFullYear()).toBe(2000)
    expect(result.end.getFullYear()).toBe(2100)
  })

  it('defaults to all_time for unknown period', () => {
    const result = getDateRangeForPeriod('nonexistent')
    expect(result.start.getFullYear()).toBe(2000)
  })

  const periods = ['this_month', 'last_month', 'last_3_months', 'last_6_months', 'this_year', 'all_time']
  periods.forEach(period => {
    it(`handles period: ${period}`, () => {
      const result = getDateRangeForPeriod(period)
      expect(result).toHaveProperty('start')
      expect(result).toHaveProperty('end')
    })
  })
})

// ─── filterByDateRange ────────────────────────────────────────────────────────

describe('filterByDateRange', () => {
  it('filters items within a date range', () => {
    const range = getDateRangeForPeriod('this_month')
    const result = filterByDateRange(sampleExpenses, range)
    expect(result).toHaveLength(3)
  })

  it('returns all items for all_time range', () => {
    const range = getDateRangeForPeriod('all_time')
    const result = filterByDateRange(sampleExpenses, range)
    expect(result).toHaveLength(5)
  })

  it('returns empty array when nothing matches', () => {
    const range = { start: new Date(1990, 0, 1), end: new Date(1990, 11, 31) }
    const result = filterByDateRange(sampleExpenses, range)
    expect(result).toHaveLength(0)
  })
})

// ─── getPeriodLabel ───────────────────────────────────────────────────────────

describe('getPeriodLabel', () => {
  it('returns correct labels for known periods', () => {
    expect(getPeriodLabel('this_month')).toBe('This Month')
    expect(getPeriodLabel('last_month')).toBe('Last Month')
    expect(getPeriodLabel('last_3_months')).toBe('Last 3 Months')
    expect(getPeriodLabel('last_6_months')).toBe('Last 6 Months')
    expect(getPeriodLabel('this_year')).toBe('This Year')
    expect(getPeriodLabel('all_time')).toBe('All Time')
  })

  it('returns "Custom Range" for custom without range', () => {
    expect(getPeriodLabel('custom')).toBe('Custom Range')
  })

  it('returns formatted range for custom with range', () => {
    const result = getPeriodLabel('custom', { start: '2025-01-01', end: '2025-01-31' })
    expect(result).toContain('Jan')
    expect(result).toContain('2025')
  })

  it('defaults to "This Month" for unknown period', () => {
    expect(getPeriodLabel('unknown_period')).toBe('This Month')
  })
})
