import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index) => Object.keys(store)[index] ?? null,
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock URL.createObjectURL / revokeObjectURL
window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
window.URL.revokeObjectURL = vi.fn()

// Reset localStorage before each test
beforeEach(() => {
  localStorage.clear()
})
