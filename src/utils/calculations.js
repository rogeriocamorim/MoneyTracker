import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  format,
  parseISO,
  subMonths,
  differenceInCalendarDays,
} from 'date-fns'

// ─── Currency Formatting ───────────────────────────────

export const formatCurrency = (amount, symbol = '$') => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatCompactCurrency = (amount, symbol = '$') => {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return `${symbol}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${symbol}${(abs / 1_000).toFixed(1)}K`
  return formatCurrency(amount, symbol)
}

// ─── Date Ranges ───────────────────────────────────────

export const getDateRangeForPeriod = (period) => {
  const now = new Date()

  switch (period) {
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'last_month': {
      const lastMonth = subMonths(now, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    }
    case 'last_3_months':
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
    case 'last_6_months':
      return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) }
    case 'this_year':
      return { start: startOfYear(now), end: endOfMonth(now) }
    case 'all_time':
    default:
      return { start: new Date(2000, 0, 1), end: new Date(2100, 11, 31) }
  }
}

export const filterByDateRange = (items, dateRange) => {
  return items.filter((item) => {
    const itemDate = parseISO(item.date)
    return isWithinInterval(itemDate, dateRange)
  })
}

export const getPeriodLabel = (period, customRange = null) => {
  if (period === 'custom' && customRange) {
    return `${format(parseISO(customRange.start), 'MMM d')} – ${format(
      parseISO(customRange.end),
      'MMM d, yyyy'
    )}`
  }
  const labels = {
    this_month: 'This Month',
    last_month: 'Last Month',
    last_3_months: 'Last 3 Months',
    last_6_months: 'Last 6 Months',
    this_year: 'This Year',
    all_time: 'All Time',
    custom: 'Custom Range',
  }
  return labels[period] || 'This Month'
}

// ─── Aggregations ──────────────────────────────────────

export const getMonthlyExpenses = (expenses, date = new Date()) => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return expenses.filter((e) => isWithinInterval(parseISO(e.date), { start, end }))
}

export const getMonthlyIncome = (income, date = new Date()) => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return income.filter((i) => isWithinInterval(parseISO(i.date), { start, end }))
}

export const getTotal = (items) => {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0)
}

export const getTotalByCategory = (expenses) => {
  return expenses.reduce((acc, e) => {
    const cat = e.category || 'other'
    acc[cat] = (acc[cat] || 0) + e.amount
    return acc
  }, {})
}

export const getTotalBySource = (income) => {
  return income.reduce((acc, i) => {
    const source = i.source || 'other'
    acc[source] = (acc[source] || 0) + i.amount
    return acc
  }, {})
}

export const getTotalByPaymentMethod = (expenses) => {
  return expenses.reduce((acc, e) => {
    const method = e.paymentMethod || 'other'
    acc[method] = (acc[method] || 0) + e.amount
    return acc
  }, {})
}

/**
 * Get the effective budgets for a given month key (e.g. "2026-03").
 * Falls back to the most recent previous month if the given month has no budgets.
 * Returns a flat { categoryId: { amount, ... } } object.
 */
export const getBudgetsForMonth = (budgets, monthKey) => {
  if (!budgets || typeof budgets !== 'object') return {}

  // New monthly format: budgets["2026-03"] = { food: { amount: 500 } }
  if (budgets[monthKey]) return budgets[monthKey]

  // Fallback: find the most recent previous month that has data
  const sortedKeys = Object.keys(budgets).sort()
  let fallback = null
  for (const key of sortedKeys) {
    if (key <= monthKey) fallback = key
  }
  return fallback ? budgets[fallback] : {}
}

/**
 * Get all month keys that have explicit budget data, sorted ascending.
 */
export const getBudgetMonths = (budgets) => {
  if (!budgets || typeof budgets !== 'object') return []
  return Object.keys(budgets).filter((k) => /^\d{4}-\d{2}$/.test(k)).sort()
}

export const getBudgetProgress = (expenses, budgets, monthKey) => {
  const key = monthKey || format(new Date(), 'yyyy-MM')
  const [year, month] = key.split('-').map(Number)
  const monthDate = new Date(year, month - 1, 1)
  const start = startOfMonth(monthDate)
  const end = endOfMonth(monthDate)

  const monthExpenses = expenses.filter((e) =>
    isWithinInterval(parseISO(e.date), { start, end })
  )
  const totals = getTotalByCategory(monthExpenses)
  const monthBudgets = getBudgetsForMonth(budgets, key)

  return Object.entries(monthBudgets).map(([category, config]) => {
    const budget = typeof config === 'number' ? config : config.amount || 0
    const spent = totals[category] || 0
    const percentage = budget > 0 ? (spent / budget) * 100 : 0

    return {
      category,
      budget,
      spent,
      remaining: Math.max(0, budget - spent),
      percentage: Math.min(percentage, 100),
      overBudget: spent > budget,
      overAmount: Math.max(0, spent - budget),
    }
  })
}

// ─── Trends ────────────────────────────────────────────

export const getMonthlyTrend = (expenses, months = 6) => {
  const result = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i)
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    const monthExpenses = expenses.filter((e) =>
      isWithinInterval(parseISO(e.date), { start, end })
    )
    result.push({
      month: format(date, 'MMMM yyyy'),
      shortMonth: format(date, 'MMM'),
      total: getTotal(monthExpenses),
      count: monthExpenses.length,
    })
  }

  return result
}

export const getIncomeTrend = (income, months = 6) => {
  const result = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i)
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    const monthIncome = income.filter((item) =>
      isWithinInterval(parseISO(item.date), { start, end })
    )
    result.push({
      month: format(date, 'MMMM yyyy'),
      shortMonth: format(date, 'MMM'),
      total: getTotal(monthIncome),
      count: monthIncome.length,
    })
  }

  return result
}

export const getCashFlowTrend = (expenses, income, months = 6) => {
  const expenseTrend = getMonthlyTrend(expenses, months)
  const incomeTrend = getIncomeTrend(income, months)

  return expenseTrend.map((exp, i) => ({
    month: exp.month,
    shortMonth: exp.shortMonth,
    expenses: exp.total,
    income: incomeTrend[i]?.total || 0,
    savings: (incomeTrend[i]?.total || 0) - exp.total,
  }))
}

// ─── Percentage Change ─────────────────────────────────

export const getPercentChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const getMonthOverMonthChange = (items, type = 'expenses') => {
  const now = new Date()
  const currentMonth = type === 'expenses' ? getMonthlyExpenses(items, now) : getMonthlyIncome(items, now)
  const lastMonth =
    type === 'expenses'
      ? getMonthlyExpenses(items, subMonths(now, 1))
      : getMonthlyIncome(items, subMonths(now, 1))

  const currentTotal = getTotal(currentMonth)
  const lastTotal = getTotal(lastMonth)

  return {
    current: currentTotal,
    previous: lastTotal,
    change: getPercentChange(currentTotal, lastTotal),
  }
}

// ─── Annual Bills ──────────────────────────────────────

/**
 * Check if an annual bill has been paid by matching expenses in the current year.
 * Matches on: same category + amount within 20% tolerance.
 * Returns the matching expense (best match by closest amount) or null.
 */
export const findMatchingExpense = (bill, expenses, year = new Date().getFullYear()) => {
  const yearStart = startOfYear(new Date(year, 0, 1))
  const yearEnd = endOfYear(new Date(year, 0, 1))
  const tolerance = bill.amount * 0.2 // 20% tolerance

  const candidates = expenses.filter((e) => {
    if (e.category !== bill.category) return false
    const d = parseISO(e.date)
    if (!isWithinInterval(d, { start: yearStart, end: yearEnd })) return false
    return Math.abs(e.amount - bill.amount) <= tolerance
  })

  if (candidates.length === 0) return null
  // Return the closest match by amount
  return candidates.reduce((best, e) =>
    Math.abs(e.amount - bill.amount) < Math.abs(best.amount - bill.amount) ? e : best
  )
}

/**
 * Get the status of an annual bill: paid, upcoming, overdue, or due-soon.
 * Returns { status, daysUntilDue, matchedExpense }.
 */
export const getAnnualBillStatus = (bill, expenses, year = new Date().getFullYear()) => {
  const matchedExpense = findMatchingExpense(bill, expenses, year)
  if (matchedExpense || bill.paidManually) {
    return { status: 'paid', daysUntilDue: null, matchedExpense }
  }

  if (!bill.dueDate) {
    return { status: 'unknown', daysUntilDue: null, matchedExpense: null }
  }

  const today = new Date()
  // Build the due date for the target year from the bill's month/day
  const dueParsed = parseISO(bill.dueDate)
  const dueThisYear = new Date(year, dueParsed.getMonth(), dueParsed.getDate())
  const daysUntil = differenceInCalendarDays(dueThisYear, today)

  if (daysUntil < 0) {
    return { status: 'overdue', daysUntilDue: daysUntil, matchedExpense: null }
  }
  if (daysUntil <= 30) {
    return { status: 'due-soon', daysUntilDue: daysUntil, matchedExpense: null }
  }
  return { status: 'upcoming', daysUntilDue: daysUntil, matchedExpense: null }
}

/**
 * Get status for all annual bills, sorted: overdue first, then due-soon, upcoming, paid last.
 */
export const getAllAnnualBillStatuses = (annualBills, expenses, year = new Date().getFullYear()) => {
  const order = { overdue: 0, 'due-soon': 1, upcoming: 2, unknown: 3, paid: 4 }
  return annualBills
    .map((bill) => ({ bill, ...getAnnualBillStatus(bill, expenses, year) }))
    .sort((a, b) => {
      const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3)
      if (diff !== 0) return diff
      // Within same status, sort by due date ascending
      return (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999)
    })
}
