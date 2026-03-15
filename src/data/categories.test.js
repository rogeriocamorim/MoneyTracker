import { describe, it, expect } from 'vitest'
import {
  expenseCategories,
  paymentMethods,
  incomeSources,
  defaultBudgets,
  getCategoryById,
  getAllCategories,
  getPaymentMethodById,
  getIncomeSourceById,
} from '../data/categories'

// ─── Data Integrity ───────────────────────────────────────────────────────────

describe('expenseCategories', () => {
  it('has 15 predefined categories', () => {
    expect(expenseCategories).toHaveLength(15)
  })

  it('each category has required properties', () => {
    expenseCategories.forEach(cat => {
      expect(cat).toHaveProperty('id')
      expect(cat).toHaveProperty('name')
      expect(cat).toHaveProperty('icon')
      expect(cat).toHaveProperty('color')
      expect(typeof cat.id).toBe('string')
      expect(typeof cat.name).toBe('string')
      expect(typeof cat.color).toBe('string')
    })
  })

  it('has unique IDs', () => {
    const ids = expenseCategories.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes expected categories', () => {
    const ids = expenseCategories.map(c => c.id)
    expect(ids).toContain('food')
    expect(ids).toContain('transport')
    expect(ids).toContain('utilities')
    expect(ids).toContain('entertainment')
    expect(ids).toContain('shopping')
    expect(ids).toContain('health')
    expect(ids).toContain('education')
    expect(ids).toContain('dining')
    expect(ids).toContain('subscriptions')
    expect(ids).toContain('housing')
    expect(ids).toContain('insurance')
    expect(ids).toContain('personal')
    expect(ids).toContain('gifts')
    expect(ids).toContain('travel')
    expect(ids).toContain('other')
  })
})

describe('paymentMethods', () => {
  it('has 3 payment methods', () => {
    expect(paymentMethods).toHaveLength(3)
  })

  it('includes bank, visa, mastercard', () => {
    const ids = paymentMethods.map(p => p.id)
    expect(ids).toContain('bank')
    expect(ids).toContain('visa')
    expect(ids).toContain('mastercard')
  })

  it('each has required properties', () => {
    paymentMethods.forEach(method => {
      expect(method).toHaveProperty('id')
      expect(method).toHaveProperty('name')
      expect(method).toHaveProperty('icon')
      expect(method).toHaveProperty('color')
    })
  })
})

describe('incomeSources', () => {
  it('has 6 income sources', () => {
    expect(incomeSources).toHaveLength(6)
  })

  it('includes expected sources', () => {
    const ids = incomeSources.map(s => s.id)
    expect(ids).toContain('daily_job')
    expect(ids).toContain('business')
    expect(ids).toContain('wife_business')
    expect(ids).toContain('investments')
    expect(ids).toContain('freelance')
    expect(ids).toContain('other')
  })
})

describe('defaultBudgets', () => {
  it('is an empty object', () => {
    expect(defaultBudgets).toEqual({})
  })
})

// ─── getCategoryById ──────────────────────────────────────────────────────────

describe('getCategoryById', () => {
  it('returns a predefined category by ID', () => {
    const result = getCategoryById('food')
    expect(result).toBeDefined()
    expect(result.id).toBe('food')
    expect(result.name).toBe('Food & Groceries')
  })

  it('returns a custom category when provided', () => {
    const customCategories = [{ id: 'custom_pets', name: 'Pets', color: '#ff0000' }]
    const result = getCategoryById('custom_pets', customCategories)
    expect(result).toBeDefined()
    expect(result.id).toBe('custom_pets')
    expect(result.name).toBe('Pets')
    expect(result.icon).toBe('Tag')  // Custom categories get Tag icon
  })

  it('prioritizes predefined over custom categories', () => {
    const customCategories = [{ id: 'food', name: 'Custom Food', color: '#000' }]
    const result = getCategoryById('food', customCategories)
    expect(result.name).toBe('Food & Groceries') // Predefined wins
  })

  it('returns fallback for unknown IDs', () => {
    const result = getCategoryById('custom_unknown')
    expect(result).toBeDefined()
    expect(result.icon).toBe('Tag')
    expect(result.color).toBe('#94918b')
  })

  it('returns null for falsy ID', () => {
    expect(getCategoryById(null)).toBeNull()
    expect(getCategoryById(undefined)).toBeNull()
    expect(getCategoryById('')).toBeNull()
  })
})

// ─── getAllCategories ─────────────────────────────────────────────────────────

describe('getAllCategories', () => {
  it('returns predefined categories when no custom categories', () => {
    const result = getAllCategories()
    expect(result).toHaveLength(15)
  })

  it('includes custom categories appended after predefined', () => {
    const custom = [{ id: 'custom_pets', name: 'Pets', color: '#ff0000' }]
    const result = getAllCategories(custom)
    expect(result).toHaveLength(16)
    expect(result[result.length - 1].id).toBe('custom_pets')
    expect(result[result.length - 1].icon).toBe('Tag')
  })

  it('does not mutate original arrays', () => {
    const custom = [{ id: 'test', name: 'Test', color: '#000' }]
    getAllCategories(custom)
    expect(expenseCategories).toHaveLength(15)
  })
})

// ─── getPaymentMethodById ─────────────────────────────────────────────────────

describe('getPaymentMethodById', () => {
  it('returns correct payment method', () => {
    expect(getPaymentMethodById('visa').name).toBe('Visa Credit Card')
    expect(getPaymentMethodById('bank').name).toBe('Bank Account')
    expect(getPaymentMethodById('mastercard').name).toBe('MasterCard')
  })

  it('returns undefined for unknown ID', () => {
    expect(getPaymentMethodById('unknown')).toBeUndefined()
  })
})

// ─── getIncomeSourceById ──────────────────────────────────────────────────────

describe('getIncomeSourceById', () => {
  it('returns correct income source', () => {
    expect(getIncomeSourceById('daily_job').name).toBe('Daily Job')
    expect(getIncomeSourceById('freelance').name).toBe('Freelance')
    expect(getIncomeSourceById('investments').name).toBe('Investments')
  })

  it('returns undefined for unknown ID', () => {
    expect(getIncomeSourceById('unknown')).toBeUndefined()
  })
})
