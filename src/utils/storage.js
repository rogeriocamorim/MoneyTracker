const STORAGE_KEY = 'moneytracker_data'

const defaultData = {
  expenses: [],
  income: [],
  budgets: {},
  settings: {
    currency: 'CAD',
    currencySymbol: '$',
  },
}

export const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...defaultData, ...parsed }
    }
    return defaultData
  } catch (error) {
    console.error('Error loading data:', error)
    return defaultData
  }
}

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

export const exportToJson = (data) => {
  const dataStr = JSON.stringify(data, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const date = new Date().toISOString().split('T')[0]
  const filename = `moneytracker_backup_${date}.json`
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const importFromJson = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        
        // Validate structure
        if (!data.expenses || !Array.isArray(data.expenses)) {
          throw new Error('Invalid data: missing expenses array')
        }
        if (!data.income || !Array.isArray(data.income)) {
          throw new Error('Invalid data: missing income array')
        }
        
        resolve({ ...defaultData, ...data })
      } catch (error) {
        reject(new Error('Invalid JSON file: ' + error.message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Error reading file'))
    }
    
    reader.readAsText(file)
  })
}

// Aliases for compatibility
export const exportData = exportToJson
export const importData = importFromJson

