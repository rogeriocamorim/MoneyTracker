import { startOfMonth, endOfMonth, startOfYear, isWithinInterval, format, parseISO, subMonths } from 'date-fns'

export const formatCurrency = (amount, symbol = '$') => {
  return `${symbol}${amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const getMonthlyExpenses = (expenses, date = new Date()) => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  
  return expenses.filter(expense => {
    const expenseDate = parseISO(expense.date)
    return isWithinInterval(expenseDate, { start, end })
  })
}

export const getMonthlyIncome = (income, date = new Date()) => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  
  return income.filter(inc => {
    const incomeDate = parseISO(inc.date)
    return isWithinInterval(incomeDate, { start, end })
  })
}

export const getTotalByCategory = (expenses) => {
  return expenses.reduce((acc, expense) => {
    const category = expense.category
    acc[category] = (acc[category] || 0) + expense.amount
    return acc
  }, {})
}

export const getTotalByPaymentMethod = (expenses) => {
  return expenses.reduce((acc, expense) => {
    const method = expense.paymentMethod
    acc[method] = (acc[method] || 0) + expense.amount
    return acc
  }, {})
}

export const getTotalBySource = (income) => {
  return income.reduce((acc, inc) => {
    const source = inc.source
    acc[source] = (acc[source] || 0) + inc.amount
    return acc
  }, {})
}

export const getTotal = (items) => {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

export const getBudgetProgress = (expenses, budgets) => {
  const totals = getTotalByCategory(expenses)
  
  return Object.keys(budgets).map(category => {
    const budget = budgets[category] || 0
    const spent = totals[category] || 0
    const percentage = budget > 0 ? (spent / budget) * 100 : 0
    
    return {
      category,
      budget,
      spent,
      remaining: budget - spent,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    }
  })
}

export const getMonthlyTrend = (expenses, months = 6) => {
  const trends = []
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i)
    const monthExpenses = getMonthlyExpenses(expenses, date)
    const total = getTotal(monthExpenses)
    
    trends.push({
      month: format(date, 'MMM yyyy'),
      shortMonth: format(date, 'MMM'),
      total,
    })
  }
  
  return trends
}

export const getIncomeTrend = (income, months = 6) => {
  const trends = []
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i)
    const monthIncome = getMonthlyIncome(income, date)
    const total = getTotal(monthIncome)
    
    trends.push({
      month: format(date, 'MMM yyyy'),
      shortMonth: format(date, 'MMM'),
      total,
    })
  }
  
  return trends
}

export const getCombinedTrend = (expenses, income, months = 6) => {
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

// Get date range for a period
export const getDateRangeForPeriod = (period) => {
  const now = new Date()
  
  switch (period) {
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'last_month':
      const lastMonth = subMonths(now, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
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

// Filter expenses by date range
export const filterByDateRange = (items, dateRange) => {
  return items.filter(item => {
    const itemDate = parseISO(item.date)
    return isWithinInterval(itemDate, dateRange)
  })
}

// Get period label for display
export const getPeriodLabel = (period, customRange = null) => {
  if (period === 'custom' && customRange) {
    return `${format(parseISO(customRange.start), 'MMM d')} - ${format(parseISO(customRange.end), 'MMM d, yyyy')}`
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


