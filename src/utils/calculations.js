import { startOfMonth, endOfMonth, isWithinInterval, format, parseISO, subMonths } from 'date-fns'

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
  
  return Object.keys(budgets).map(category => ({
    category,
    budget: budgets[category] || 0,
    spent: totals[category] || 0,
    remaining: (budgets[category] || 0) - (totals[category] || 0),
    percentage: budgets[category] ? Math.min(100, ((totals[category] || 0) / budgets[category]) * 100) : 0,
  }))
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


