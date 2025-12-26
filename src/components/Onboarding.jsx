import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, subDays, subMonths } from 'date-fns'
import { 
  TrendingUp, 
  Upload, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Wallet,
  PiggyBank,
  BarChart3,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Globe,
  Play
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { importData } from '../utils/storage'
import { expenseCategories } from '../data/categories'

const features = [
  { icon: Wallet, title: 'Track Expenses', description: 'Record daily spending across bank and credit cards' },
  { icon: TrendingUp, title: 'Monitor Income', description: 'Track earnings from multiple sources' },
  { icon: PiggyBank, title: 'Set Budgets', description: 'Create monthly limits for each category' },
  { icon: BarChart3, title: 'View Insights', description: 'Visualize your finances with charts' },
]

// Generate mock data for demo - full year of realistic data
const generateMockData = () => {
  const today = new Date()
  const mockExpenses = []
  const mockIncome = []
  let expenseId = 1
  let incomeId = 1

  // Expense templates with realistic variations
  const expenseTemplates = [
    // Recurring monthly
    { category: 'housing', description: 'Rent payment', baseAmount: 1500, variation: 0, paymentMethod: 'bank', dayOfMonth: 1 },
    { category: 'utilities', description: 'Electricity bill', baseAmount: 120, variation: 40, paymentMethod: 'bank', dayOfMonth: 5 },
    { category: 'utilities', description: 'Internet bill', baseAmount: 75, variation: 0, paymentMethod: 'bank', dayOfMonth: 8 },
    { category: 'subscriptions', description: 'Netflix', baseAmount: 15.99, variation: 0, paymentMethod: 'visa', dayOfMonth: 10 },
    { category: 'subscriptions', description: 'Spotify', baseAmount: 11.99, variation: 0, paymentMethod: 'visa', dayOfMonth: 12 },
    { category: 'insurance', description: 'Car insurance', baseAmount: 180, variation: 0, paymentMethod: 'bank', dayOfMonth: 15 },
    // Weekly groceries (4x per month)
    { category: 'food', description: 'Grocery shopping', baseAmount: 95, variation: 35, paymentMethod: 'visa', weekly: true },
    { category: 'food', description: 'Costco run', baseAmount: 150, variation: 50, paymentMethod: 'mastercard', dayOfMonth: 20 },
    // Variable expenses
    { category: 'transport', description: 'Gas station', baseAmount: 55, variation: 15, paymentMethod: 'bank', timesPerMonth: 3 },
    { category: 'dining', description: 'Restaurant dinner', baseAmount: 65, variation: 25, paymentMethod: 'mastercard', timesPerMonth: 2 },
    { category: 'dining', description: 'Coffee shop', baseAmount: 18, variation: 8, paymentMethod: 'visa', timesPerMonth: 4 },
    { category: 'entertainment', description: 'Movie tickets', baseAmount: 35, variation: 10, paymentMethod: 'visa', timesPerMonth: 1 },
    { category: 'health', description: 'Pharmacy', baseAmount: 45, variation: 20, paymentMethod: 'visa', timesPerMonth: 1 },
    { category: 'personal', description: 'Haircut', baseAmount: 35, variation: 0, paymentMethod: 'bank', monthlyChance: 0.5 },
    { category: 'shopping', description: 'Amazon order', baseAmount: 65, variation: 45, paymentMethod: 'visa', timesPerMonth: 2 },
  ]

  // Special one-time expenses per month
  const specialExpenses = [
    { month: 11, category: 'gifts', description: 'Christmas gifts', amount: 450, paymentMethod: 'mastercard' },
    { month: 10, category: 'entertainment', description: 'Halloween party supplies', amount: 85, paymentMethod: 'visa' },
    { month: 6, category: 'travel', description: 'Summer vacation', amount: 1200, paymentMethod: 'mastercard' },
    { month: 7, category: 'travel', description: 'Weekend camping trip', amount: 280, paymentMethod: 'visa' },
    { month: 3, category: 'shopping', description: 'Spring wardrobe update', amount: 320, paymentMethod: 'mastercard' },
    { month: 8, category: 'education', description: 'Online course', amount: 199, paymentMethod: 'visa' },
    { month: 4, category: 'health', description: 'Dental cleaning', amount: 150, paymentMethod: 'bank' },
    { month: 9, category: 'health', description: 'Annual checkup', amount: 75, paymentMethod: 'bank' },
    { month: 1, category: 'entertainment', description: 'Concert tickets', amount: 180, paymentMethod: 'mastercard' },
    { month: 5, category: 'gifts', description: "Mother's Day gift", amount: 95, paymentMethod: 'visa' },
  ]

  // Generate expenses for each month (last 12 months)
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const monthDate = subMonths(today, monthOffset)
    const currentMonth = monthDate.getMonth()
    
    expenseTemplates.forEach(template => {
      if (template.weekly) {
        // Weekly expenses (4 times per month)
        for (let week = 0; week < 4; week++) {
          const day = 3 + (week * 7)
          const amount = template.baseAmount + (Math.random() * template.variation * 2 - template.variation)
          mockExpenses.push({
            id: `e${expenseId++}`,
            date: format(subDays(subMonths(today, monthOffset), day), 'yyyy-MM-dd'),
            amount: Math.round(amount * 100) / 100,
            category: template.category,
            description: template.description,
            paymentMethod: template.paymentMethod,
          })
        }
      } else if (template.timesPerMonth) {
        // Multiple times per month
        for (let i = 0; i < template.timesPerMonth; i++) {
          const day = Math.floor(Math.random() * 25) + 1
          const amount = template.baseAmount + (Math.random() * template.variation * 2 - template.variation)
          mockExpenses.push({
            id: `e${expenseId++}`,
            date: format(subDays(subMonths(today, monthOffset), day), 'yyyy-MM-dd'),
            amount: Math.round(amount * 100) / 100,
            category: template.category,
            description: template.description,
            paymentMethod: template.paymentMethod,
          })
        }
      } else if (template.monthlyChance) {
        // Random occurrence
        if (Math.random() < template.monthlyChance) {
          const day = Math.floor(Math.random() * 25) + 1
          mockExpenses.push({
            id: `e${expenseId++}`,
            date: format(subDays(subMonths(today, monthOffset), day), 'yyyy-MM-dd'),
            amount: template.baseAmount,
            category: template.category,
            description: template.description,
            paymentMethod: template.paymentMethod,
          })
        }
      } else if (template.dayOfMonth) {
        // Fixed day of month
        const amount = template.baseAmount + (Math.random() * template.variation * 2 - template.variation)
        mockExpenses.push({
          id: `e${expenseId++}`,
          date: format(subDays(subMonths(today, monthOffset), template.dayOfMonth), 'yyyy-MM-dd'),
          amount: Math.round(amount * 100) / 100,
          category: template.category,
          description: template.description,
          paymentMethod: template.paymentMethod,
        })
      }
    })

    // Add special expenses for specific months
    specialExpenses.forEach(special => {
      if (currentMonth === special.month) {
        mockExpenses.push({
          id: `e${expenseId++}`,
          date: format(subDays(subMonths(today, monthOffset), 15), 'yyyy-MM-dd'),
          amount: special.amount,
          category: special.category,
          description: special.description,
          paymentMethod: special.paymentMethod,
        })
      }
    })
  }

  // Generate income for each month (last 12 months)
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    // Main salary (twice a month)
    mockIncome.push({
      id: `i${incomeId++}`,
      date: format(subDays(subMonths(today, monthOffset), 1), 'yyyy-MM-dd'),
      amount: 2250.00,
      source: 'daily_job',
      notes: 'Salary - first half',
    })
    mockIncome.push({
      id: `i${incomeId++}`,
      date: format(subDays(subMonths(today, monthOffset), 15), 'yyyy-MM-dd'),
      amount: 2250.00,
      source: 'daily_job',
      notes: 'Salary - second half',
    })

    // Occasional freelance (every 2-3 months)
    if (monthOffset % 2 === 0) {
      mockIncome.push({
        id: `i${incomeId++}`,
        date: format(subDays(subMonths(today, monthOffset), 20), 'yyyy-MM-dd'),
        amount: 400 + Math.floor(Math.random() * 400),
        source: 'freelance',
        notes: 'Side project work',
      })
    }

    // Quarterly dividends
    if (monthOffset % 3 === 0) {
      mockIncome.push({
        id: `i${incomeId++}`,
        date: format(subDays(subMonths(today, monthOffset), 25), 'yyyy-MM-dd'),
        amount: 150 + Math.floor(Math.random() * 100),
        source: 'investments',
        notes: 'Quarterly dividend',
      })
    }

    // Wife's business income (monthly, variable)
    mockIncome.push({
      id: `i${incomeId++}`,
      date: format(subDays(subMonths(today, monthOffset), 10), 'yyyy-MM-dd'),
      amount: 800 + Math.floor(Math.random() * 600),
      source: 'wife_business',
      notes: 'Business revenue',
    })
  }

  // Mock budgets
  const mockBudgets = {
    food: 650,
    transport: 200,
    utilities: 220,
    entertainment: 150,
    shopping: 250,
    health: 150,
    dining: 200,
    subscriptions: 60,
    housing: 1550,
    insurance: 200,
    travel: 300,
    gifts: 100,
    personal: 80,
    education: 100,
  }

  return {
    expenses: mockExpenses,
    income: mockIncome,
    budgets: mockBudgets,
    customCategories: [],
    settings: {
      currency: 'CAD',
      currencySymbol: '$',
    },
    setupComplete: true,
  }
}

const currencies = [
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
]

// Generate a random color for custom categories
const randomColor = () => {
  const colors = ['#f97316', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#ef4444', '#14b8a6', '#22c55e', '#06b6d4', '#8b5cf6']
  return colors[Math.floor(Math.random() * colors.length)]
}

// Step 1: Welcome
function WelcomeStep({ onNext, onImport, onDemo, isImporting, importSuccess }) {
  const fileInputRef = useRef(null)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Features */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <motion.div 
              key={feature.title}
              className="flex flex-col items-center text-center p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center mb-2">
                <feature.icon className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)]">{feature.title}</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Import option */}
      <div className="card mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-xl bg-[var(--color-success-muted)] flex items-center justify-center">
            {importSuccess ? (
              <Check className="w-5 h-5 text-[var(--color-success)]" />
            ) : (
              <Upload className="w-5 h-5 text-[var(--color-success)]" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              {importSuccess ? 'Data Imported!' : 'Have existing data?'}
            </h3>
            <p className="text-[12px] text-[var(--color-text-muted)]">
              {importSuccess ? 'Your data has been loaded' : 'Import from a previous backup'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting || importSuccess}
          className="btn btn-secondary w-full"
        >
          {isImporting ? (
            <span className="flex items-center gap-2">
              <motion.div 
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Importing...
            </span>
          ) : importSuccess ? (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" /> Imported
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" /> Load JSON File
            </span>
          )}
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".json"
          onChange={onImport}
          className="hidden"
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 py-2 mb-4">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-[12px] text-[var(--color-text-muted)]">or</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      {/* Continue to setup */}
      <button 
        onClick={onNext}
        disabled={isImporting}
        className="btn btn-primary w-full py-4"
      >
        <Sparkles className="w-4 h-4" />
        Set Up New
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Try Demo */}
      <button 
        onClick={onDemo}
        disabled={isImporting}
        className="btn btn-ghost w-full py-3 mt-3"
      >
        <Play className="w-4 h-4" />
        Try Demo with Sample Data
      </button>
    </motion.div>
  )
}

// Step 2: Currency Selection
function CurrencyStep({ selectedCurrency, onSelectCurrency, onBack, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center mx-auto mb-3">
          <Globe className="w-7 h-7 text-[var(--color-accent)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Choose Currency</h2>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
          Select the currency you use for tracking
        </p>
      </div>

      {/* Currency Grid */}
      <div className="card mb-4" style={{ padding: 0, maxHeight: '320px', overflowY: 'auto' }}>
        {currencies.map((currency, i) => (
          <button
            key={currency.code}
            onClick={() => onSelectCurrency(currency)}
            className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
              selectedCurrency?.code === currency.code 
                ? 'bg-[var(--color-accent-muted)]' 
                : 'hover:bg-[var(--color-bg-hover)]'
            } ${i !== 0 ? 'border-t border-[var(--color-border)]' : ''}`}
          >
            <span className="text-2xl">{currency.flag}</span>
            <div className="flex-1">
              <p className="font-medium text-[var(--color-text-primary)]">{currency.name}</p>
              <p className="text-[12px] text-[var(--color-text-muted)]">{currency.code}</p>
            </div>
            <span className="font-mono text-lg text-[var(--color-accent)]">{currency.symbol}</span>
            {selectedCurrency?.code === currency.code && (
              <Check className="w-5 h-5 text-[var(--color-accent)]" />
            )}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button onClick={onBack} className="btn btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button 
          onClick={onNext}
          disabled={!selectedCurrency}
          className="btn btn-primary flex-1 py-3"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// Step 3: Budget Setup
function BudgetStep({ budgets, currencySymbol, onUpdateBudget, onRemoveBudget, onBack, onComplete }) {
  const [isCustom, setIsCustom] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [amount, setAmount] = useState('')

  const usedCategoryIds = Object.keys(budgets)
  const availableCategories = expenseCategories.filter(cat => !usedCategoryIds.includes(cat.id))

  const handleAddBudget = () => {
    if (!amount) return
    
    if (isCustom) {
      if (!customCategoryName.trim()) return
      // Create a custom category ID from the name
      const customId = 'custom_' + customCategoryName.toLowerCase().replace(/\s+/g, '_')
      onUpdateBudget(customId, parseFloat(amount), customCategoryName.trim(), randomColor())
      setCustomCategoryName('')
    } else {
      if (!selectedCategory) return
      const cat = expenseCategories.find(c => c.id === selectedCategory)
      onUpdateBudget(selectedCategory, parseFloat(amount), cat?.name, cat?.color)
      setSelectedCategory('')
    }
    setAmount('')
  }

  const totalBudget = Object.values(budgets).reduce((sum, b) => sum + (typeof b === 'object' ? b.amount : b), 0)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center mx-auto mb-3">
          <PiggyBank className="w-7 h-7 text-[var(--color-accent)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Set Your Budgets</h2>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
          Define monthly spending limits for each category
        </p>
      </div>

      {/* Add budget form */}
      <div className="card mb-4">
        {/* Toggle between predefined and custom */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setIsCustom(false)}
            className={`btn flex-1 ${!isCustom ? 'btn-primary' : 'btn-secondary'}`}
          >
            Predefined
          </button>
          <button
            onClick={() => setIsCustom(true)}
            className={`btn flex-1 ${isCustom ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Edit3 className="w-4 h-4" />
            Custom
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-3">
          {isCustom ? (
            <input
              type="text"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              placeholder="Enter category name..."
              className="input"
            />
          ) : (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              <option value="">Select category...</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm font-medium">
                {currencySymbol}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="input"
                style={{ paddingLeft: currencySymbol.length > 1 ? '2.5rem' : '2rem' }}
              />
            </div>
            <button
              onClick={handleAddBudget}
              disabled={!amount || (isCustom ? !customCategoryName.trim() : !selectedCategory)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 flex-wrap">
          {[100, 250, 500, 1000].map(val => (
            <button
              key={val}
              onClick={() => setAmount(val.toString())}
              className={`btn btn-ghost text-[12px] py-1 px-3 ${amount === val.toString() ? 'bg-[var(--color-bg-hover)]' : ''}`}
            >
              {currencySymbol}{val}
            </button>
          ))}
        </div>
      </div>

      {/* Budget list */}
      <div className="card mb-4" style={{ padding: 0, maxHeight: '240px', overflowY: 'auto' }}>
        {usedCategoryIds.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[var(--color-text-muted)] text-[13px]">No budgets added yet</p>
            <p className="text-[var(--color-text-muted)] text-[11px] mt-1">Add at least one budget to continue</p>
          </div>
        ) : (
          <div>
            {usedCategoryIds.map((catId, i) => {
              const budgetData = budgets[catId]
              const name = typeof budgetData === 'object' ? budgetData.name : (expenseCategories.find(c => c.id === catId)?.name || catId)
              const color = typeof budgetData === 'object' ? budgetData.color : (expenseCategories.find(c => c.id === catId)?.color || '#6b7280')
              const budgetAmount = typeof budgetData === 'object' ? budgetData.amount : budgetData
              
              return (
                <div key={catId} className={`flex items-center gap-3 p-3 ${i !== 0 ? 'border-t border-[var(--color-border)]' : ''}`}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <span className="text-[14px] font-bold" style={{ color }}>{currencySymbol}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{name}</p>
                  </div>
                  <span className="font-mono text-[14px] text-[var(--color-accent)]">
                    {currencySymbol}{budgetAmount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onRemoveBudget(catId)}
                    className="btn btn-ghost p-2 text-[var(--color-danger)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Total */}
      {usedCategoryIds.length > 0 && (
        <div className="flex items-center justify-between py-3 px-4 mb-4 rounded-xl bg-[var(--color-bg-muted)]">
          <span className="text-[var(--color-text-muted)]">Total Monthly Budget</span>
          <span className="font-mono font-semibold text-lg text-[var(--color-accent)]">{currencySymbol}{totalBudget.toFixed(2)}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button onClick={onBack} className="btn btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button 
          onClick={onComplete}
          className="btn btn-primary flex-1 py-3"
        >
          {usedCategoryIds.length === 0 ? 'Skip for Now' : 'Complete Setup'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-center text-[11px] text-[var(--color-text-muted)] mt-4">
        You can always add or modify budgets later
      </p>
    </motion.div>
  )
}

export default function Onboarding() {
  const { completeSetup, dispatch, setBudget, updateSettings } = useMoney()
  const [step, setStep] = useState(1)
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]) // Default CAD
  const [budgets, setBudgets] = useState({})

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const data = await importData(file)
      dispatch({ type: 'IMPORT_DATA', payload: data })
      setImportSuccess(true)
      toast.success('Data imported successfully!')
      
      // Auto-complete setup after import
      setTimeout(() => {
        completeSetup()
      }, 1500)
    } catch (error) {
      toast.error('Failed to import: ' + error.message)
      setIsImporting(false)
    }
    e.target.value = ''
  }

  const handleUpdateBudget = (categoryId, amount, name, color) => {
    setBudgets(prev => ({ 
      ...prev, 
      [categoryId]: { amount, name, color } 
    }))
  }

  const handleRemoveBudget = (category) => {
    setBudgets(prev => {
      const { [category]: removed, ...rest } = prev
      return rest
    })
  }

  const handleComplete = () => {
    // Save currency settings
    updateSettings({ 
      currency: selectedCurrency.code, 
      currencySymbol: selectedCurrency.symbol 
    })
    
    // Save all budgets to context
    Object.entries(budgets).forEach(([categoryId, data]) => {
      setBudget(categoryId, data.amount)
    })
    
    // Also save custom categories if any
    const customCategories = Object.entries(budgets)
      .filter(([id]) => id.startsWith('custom_'))
      .map(([id, data]) => ({ id, name: data.name, color: data.color }))
    
    if (customCategories.length > 0) {
      dispatch({ type: 'ADD_CUSTOM_CATEGORIES', payload: customCategories })
    }
    
    completeSetup()
    toast.success('Welcome to MoneyTracker!')
  }

  const handleDemo = () => {
    const mockData = generateMockData()
    dispatch({ type: 'IMPORT_DATA', payload: mockData })
    toast.success('Demo data loaded! Explore the app.')
  }

  const totalSteps = 3

  return (
    <div className="min-h-screen min-h-dvh bg-[var(--color-bg-base)] flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <motion.div 
            className="w-16 h-16 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center mx-auto mb-3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <TrendingUp className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
            MoneyTracker
          </h1>
          <p className="text-[var(--color-text-muted)] text-[13px]">
            Personal finance made simple
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div 
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${step >= s ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} 
            />
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <WelcomeStep 
              key="welcome"
              onNext={() => setStep(2)}
              onImport={handleImport}
              onDemo={handleDemo}
              isImporting={isImporting}
              importSuccess={importSuccess}
            />
          )}
          {step === 2 && (
            <CurrencyStep
              key="currency"
              selectedCurrency={selectedCurrency}
              onSelectCurrency={setSelectedCurrency}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <BudgetStep
              key="budget"
              budgets={budgets}
              currencySymbol={selectedCurrency.symbol}
              onUpdateBudget={handleUpdateBudget}
              onRemoveBudget={handleRemoveBudget}
              onBack={() => setStep(2)}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>

        <p className="text-center text-[11px] text-[var(--color-text-muted)] mt-6">
          All data is stored locally in your browser.
          <br />
          No account required. Your data never leaves your device.
        </p>
      </motion.div>
    </div>
  )
}
