import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MoneyProvider } from '../../context/MoneyContext'
import { ThemeProvider } from '../../context/ThemeContext'
import Sidebar from './Sidebar'
import Header from './Header'

// Mock googleDrive to avoid import errors
vi.mock('../../utils/googleDrive', () => ({
  saveToGoogleDrive: vi.fn(),
  isSignedIn: vi.fn(() => false),
}))

function renderInRouter(ui, { initialEntries = ['/'] } = {}) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </ThemeProvider>
  )
}

function renderInProviders(ui, { initialEntries = ['/'] } = {}) {
  localStorage.setItem('moneytracker_data', JSON.stringify({
    expenses: [],
    income: [],
    budgets: {},
    customCategories: [],
    settings: { currency: 'CAD', currencySymbol: '$', autoSyncEnabled: false },
    setupComplete: true,
  }))

  return render(
    <ThemeProvider>
      <MoneyProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {ui}
        </MemoryRouter>
      </MoneyProvider>
    </ThemeProvider>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

describe('Sidebar', () => {
  it('renders the app name', () => {
    renderInRouter(<Sidebar isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('MoneyTracker')).toBeInTheDocument()
  })

  it('renders the storage type label', () => {
    renderInRouter(<Sidebar isOpen={true} onClose={() => {}} />)
    // Redesigned sidebar shows "Local Storage" as the storage type label
    expect(screen.getByText('Local Storage')).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    renderInRouter(<Sidebar isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Budget')).toBeInTheDocument()
    expect(screen.getByText('Compare')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders the storage footer', () => {
    renderInRouter(<Sidebar isOpen={true} onClose={() => {}} />)
    // Redesigned sidebar footer text
    expect(screen.getByText('Saved in browser')).toBeInTheDocument()
  })

  it('has nav links with correct hrefs', () => {
    renderInRouter(<Sidebar isOpen={true} onClose={() => {}} />)
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveAttribute('href', '/')
    
    const expensesLink = screen.getByText('Expenses').closest('a')
    expect(expensesLink).toHaveAttribute('href', '/expenses')
  })
})

// ─── Header ───────────────────────────────────────────────────────────────────

describe('Header', () => {
  it('renders Dashboard title on root path', () => {
    renderInRouter(<Header onMenuClick={() => {}} />, { initialEntries: ['/'] })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview of your finances')).toBeInTheDocument()
  })

  it('renders Expenses title on /expenses path', () => {
    renderInRouter(<Header onMenuClick={() => {}} />, { initialEntries: ['/expenses'] })
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Track your spending')).toBeInTheDocument()
  })

  it('renders Income title on /income path', () => {
    renderInRouter(<Header onMenuClick={() => {}} />, { initialEntries: ['/income'] })
    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('renders Budget title on /budget path', () => {
    renderInRouter(<Header onMenuClick={() => {}} />, { initialEntries: ['/budget'] })
    expect(screen.getByText('Budget')).toBeInTheDocument()
  })

  it('renders Settings title on /settings path', () => {
    renderInRouter(<Header onMenuClick={() => {}} />, { initialEntries: ['/settings'] })
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders current date', () => {
    renderInRouter(<Header onMenuClick={() => {}} />)
    // Just check that some date text is rendered (the date container exists)
    const dateElements = screen.getAllByText(/\w{3},/)
    expect(dateElements.length).toBeGreaterThan(0)
  })
})
