import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadData, saveData, exportToJson, importFromJson } from '../utils/storage'

// ─── loadData ─────────────────────────────────────────────────────────────────

describe('loadData', () => {
  it('returns default data when localStorage is empty', () => {
    const result = loadData()
    expect(result).toEqual({
      expenses: [],
      income: [],
      budgets: {},
      settings: {
        currency: 'CAD',
        currencySymbol: '$',
      },
    })
  })

  it('returns stored data merged with defaults', () => {
    const storedData = {
      expenses: [{ id: '1', amount: 50 }],
      income: [],
      budgets: { food: 200 },
      settings: { currency: 'USD', currencySymbol: '$' },
    }
    localStorage.setItem('moneytracker_data', JSON.stringify(storedData))

    const result = loadData()
    expect(result.expenses).toHaveLength(1)
    expect(result.expenses[0].amount).toBe(50)
    expect(result.budgets.food).toBe(200)
    expect(result.settings.currency).toBe('USD')
  })

  it('merges missing keys from defaults', () => {
    localStorage.setItem('moneytracker_data', JSON.stringify({ expenses: [] }))
    const result = loadData()
    expect(result.income).toEqual([])
    expect(result.budgets).toEqual({})
    expect(result.settings).toBeDefined()
  })

  it('returns default data when localStorage has invalid JSON', () => {
    localStorage.setItem('moneytracker_data', 'not-json')
    const result = loadData()
    expect(result.expenses).toEqual([])
    expect(result.income).toEqual([])
  })
})

// ─── saveData ─────────────────────────────────────────────────────────────────

describe('saveData', () => {
  it('saves data to localStorage', () => {
    const data = { expenses: [{ id: '1' }], income: [], budgets: {}, settings: {} }
    saveData(data)

    const stored = JSON.parse(localStorage.getItem('moneytracker_data'))
    expect(stored.expenses).toHaveLength(1)
    expect(stored.expenses[0].id).toBe('1')
  })

  it('overwrites previous data', () => {
    saveData({ expenses: [{ id: '1' }] })
    saveData({ expenses: [{ id: '2' }, { id: '3' }] })

    const stored = JSON.parse(localStorage.getItem('moneytracker_data'))
    expect(stored.expenses).toHaveLength(2)
  })
})

// ─── importFromJson ───────────────────────────────────────────────────────────

describe('importFromJson', () => {
  const createMockFile = (content) => {
    return new Blob([JSON.stringify(content)], { type: 'application/json' })
  }

  it('resolves with valid data', async () => {
    const data = {
      expenses: [{ id: '1', amount: 50 }],
      income: [{ id: '1', amount: 3000 }],
      budgets: { food: 200 },
    }
    const file = createMockFile(data)
    const result = await importFromJson(file)

    expect(result.expenses).toHaveLength(1)
    expect(result.income).toHaveLength(1)
    expect(result.budgets.food).toBe(200)
  })

  it('merges with defaults for missing keys', async () => {
    const data = { expenses: [], income: [] }
    const file = createMockFile(data)
    const result = await importFromJson(file)

    expect(result.budgets).toEqual({})
    expect(result.settings).toBeDefined()
  })

  it('rejects when expenses is missing', async () => {
    const data = { income: [] }
    const file = createMockFile(data)
    await expect(importFromJson(file)).rejects.toThrow('missing expenses array')
  })

  it('rejects when income is missing', async () => {
    const data = { expenses: [] }
    const file = createMockFile(data)
    await expect(importFromJson(file)).rejects.toThrow('missing income array')
  })

  it('rejects for invalid JSON', async () => {
    const file = new Blob(['not json'], { type: 'application/json' })
    await expect(importFromJson(file)).rejects.toThrow('Invalid JSON file')
  })
})

// ─── exportToJson ─────────────────────────────────────────────────────────────

describe('exportToJson', () => {
  it('creates a download link with correct filename and clicks it', () => {
    const mockClick = vi.fn()
    const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
    const mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    // Mock createElement to return a trackable link element
    const fakeLink = { href: '', download: '', click: mockClick }
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return fakeLink
      return originalCreateElement(tag)
    })

    const data = { expenses: [], income: [], budgets: {} }
    exportToJson(data)

    // Should set a download filename matching pattern moneytracker_backup_YYYY-MM-DD.json
    expect(fakeLink.download).toMatch(/^moneytracker_backup_\d{4}-\d{2}-\d{2}\.json$/)
    // Should have a blob URL
    expect(fakeLink.href).toMatch(/^blob:/)
    // Should click the link
    expect(mockClick).toHaveBeenCalledOnce()
    // Should clean up
    expect(mockAppendChild).toHaveBeenCalledWith(fakeLink)
    expect(mockRemoveChild).toHaveBeenCalledWith(fakeLink)
    expect(mockRevokeObjectURL).toHaveBeenCalledOnce()

    mockAppendChild.mockRestore()
    mockRemoveChild.mockRestore()
    mockRevokeObjectURL.mockRestore()
    document.createElement.mockRestore()
  })
})
