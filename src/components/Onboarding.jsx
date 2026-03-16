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
  Play,
  Cloud,
  Loader2,
  Key
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { importData } from '../utils/storage'
import { expenseCategories } from '../data/categories'
import {
  initGoogleApi,
  isSignedIn,
  signIn,
  loadFromGoogleDrive,
  setClientId,
  hasClientId
} from '../utils/googleDrive'
import { Card, Button, Input } from './ui'

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

  const expenseTemplates = [
    { category: 'housing', description: 'Rent payment', baseAmount: 1500, variation: 0, paymentMethod: 'bank', dayOfMonth: 1 },
    { category: 'utilities', description: 'Electricity bill', baseAmount: 120, variation: 40, paymentMethod: 'bank', dayOfMonth: 5 },
    { category: 'utilities', description: 'Internet bill', baseAmount: 75, variation: 0, paymentMethod: 'bank', dayOfMonth: 8 },
    { category: 'subscriptions', description: 'Netflix', baseAmount: 15.99, variation: 0, paymentMethod: 'visa', dayOfMonth: 10 },
    { category: 'subscriptions', description: 'Spotify', baseAmount: 11.99, variation: 0, paymentMethod: 'visa', dayOfMonth: 12 },
    { category: 'insurance', description: 'Car insurance', baseAmount: 180, variation: 0, paymentMethod: 'bank', dayOfMonth: 15 },
    { category: 'food', description: 'Grocery shopping', baseAmount: 95, variation: 35, paymentMethod: 'visa', weekly: true },
    { category: 'food', description: 'Costco run', baseAmount: 150, variation: 50, paymentMethod: 'mastercard', dayOfMonth: 20 },
    { category: 'transport', description: 'Gas station', baseAmount: 55, variation: 15, paymentMethod: 'bank', timesPerMonth: 3 },
    { category: 'dining', description: 'Restaurant dinner', baseAmount: 65, variation: 25, paymentMethod: 'mastercard', timesPerMonth: 2 },
    { category: 'dining', description: 'Coffee shop', baseAmount: 18, variation: 8, paymentMethod: 'visa', timesPerMonth: 4 },
    { category: 'entertainment', description: 'Movie tickets', baseAmount: 35, variation: 10, paymentMethod: 'visa', timesPerMonth: 1 },
    { category: 'health', description: 'Pharmacy', baseAmount: 45, variation: 20, paymentMethod: 'visa', timesPerMonth: 1 },
    { category: 'personal', description: 'Haircut', baseAmount: 35, variation: 0, paymentMethod: 'bank', monthlyChance: 0.5 },
    { category: 'shopping', description: 'Amazon order', baseAmount: 65, variation: 45, paymentMethod: 'visa', timesPerMonth: 2 },
  ]

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

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const monthDate = subMonths(today, monthOffset)
    const currentMonth = monthDate.getMonth()

    expenseTemplates.forEach(template => {
      if (template.weekly) {
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

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
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

    if (monthOffset % 2 === 0) {
      mockIncome.push({
        id: `i${incomeId++}`,
        date: format(subDays(subMonths(today, monthOffset), 20), 'yyyy-MM-dd'),
        amount: 400 + Math.floor(Math.random() * 400),
        source: 'freelance',
        notes: 'Side project work',
      })
    }

    if (monthOffset % 3 === 0) {
      mockIncome.push({
        id: `i${incomeId++}`,
        date: format(subDays(subMonths(today, monthOffset), 25), 'yyyy-MM-dd'),
        amount: 150 + Math.floor(Math.random() * 100),
        source: 'investments',
        notes: 'Quarterly dividend',
      })
    }

    mockIncome.push({
      id: `i${incomeId++}`,
      date: format(subDays(subMonths(today, monthOffset), 10), 'yyyy-MM-dd'),
      amount: 800 + Math.floor(Math.random() * 600),
      source: 'wife_business',
      notes: 'Business revenue',
    })
  }

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
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'EUR', symbol: '\u20AC', name: 'Euro', flag: '\u{1F1EA}\u{1F1FA}' },
  { code: 'GBP', symbol: '\u00A3', name: 'British Pound', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'INR', symbol: '\u20B9', name: 'Indian Rupee', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '\u{1F1E8}\u{1F1ED}' },
]

// Generate a random color for custom categories
const randomColor = () => {
  const colors = ['#f97316', '#6366f1', '#eab308', '#a855f7', '#ec4899', '#ef4444', '#14b8a6', '#22c55e', '#06b6d4', '#8b5cf6']
  return colors[Math.floor(Math.random() * colors.length)]
}

// Step 1: Welcome
function WelcomeStep({ onNext, onImport, onDemo, onGoogleRestore, isImporting, importSuccess }) {
  const fileInputRef = useRef(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showClientIdInput, setShowClientIdInput] = useState(false)
  const [clientIdValue, setClientIdValue] = useState('')

  const handleGoogleRestore = async () => {
    setGoogleLoading(true)
    try {
      if (!hasClientId()) {
        setShowClientIdInput(true)
        setGoogleLoading(false)
        return
      }

      await initGoogleApi()

      if (!isSignedIn()) {
        await signIn()
      }

      const result = await loadFromGoogleDrive()
      if (!result) {
        toast.error('No backup found on Google Drive')
        setGoogleLoading(false)
        return
      }

      onGoogleRestore(result.data)
      toast.success('Data restored from Google Drive!')
    } catch (err) {
      console.error('Google restore error:', err)
      toast.error('Failed to restore from Google Drive')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSaveClientId = () => {
    if (!clientIdValue.trim()) return
    setClientId(clientIdValue.trim())
    setClientIdValue('')
    setShowClientIdInput(false)
    toast.success('Google Client ID saved')
    handleGoogleRestore()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Features */}
      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="flex flex-col items-center text-center p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--color-accent-muted)] flex items-center justify-center mb-2">
                <feature.icon className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)]">{feature.title}</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Import options */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-[var(--radius-xl)] bg-[var(--color-success-muted)] flex items-center justify-center">
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

        {/* Google Drive restore */}
        <Button
          variant="primary"
          icon={googleLoading ? undefined : Cloud}
          loading={googleLoading}
          onClick={handleGoogleRestore}
          disabled={isImporting || importSuccess || googleLoading}
          className="w-full mb-3"
          style={{ backgroundColor: '#4285f4' }}
        >
          {googleLoading ? 'Connecting...' : 'Restore from Google Drive'}
        </Button>

        {/* Client ID setup */}
        <AnimatePresence>
          {showClientIdInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-3 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)] border border-[var(--color-border)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-[var(--color-text-muted)]" />
                <p className="text-[12px] font-medium text-[var(--color-text-primary)]">Google Client ID Required</p>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mb-3">
                Enter your Google OAuth Client ID to connect to Google Drive.
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={clientIdValue}
                  onChange={(e) => setClientIdValue(e.target.value)}
                  placeholder="Your Client ID..."
                  containerClassName="flex-1"
                  size="sm"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveClientId}
                  disabled={!clientIdValue.trim()}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Local JSON import */}
        <Button
          variant="secondary"
          icon={importSuccess ? Check : Upload}
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting || importSuccess}
          loading={isImporting}
          className="w-full"
        >
          {importSuccess ? 'Imported' : isImporting ? 'Importing...' : 'Load JSON File'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onImport}
          className="hidden"
        />
      </Card>

      {/* Divider */}
      <div className="flex items-center gap-4 py-2 mb-4">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-[12px] text-[var(--color-text-muted)]">or</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      {/* Continue to setup */}
      <Button
        variant="primary"
        icon={Sparkles}
        iconRight={ArrowRight}
        onClick={onNext}
        disabled={isImporting}
        className="w-full py-4"
      >
        Set Up New
      </Button>

      {/* Try Demo */}
      <Button
        variant="ghost"
        icon={Play}
        onClick={onDemo}
        disabled={isImporting}
        className="w-full py-3 mt-3"
      >
        Try Demo with Sample Data
      </Button>
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
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-accent-muted)] flex items-center justify-center mx-auto mb-3">
          <Globe className="w-7 h-7 text-[var(--color-accent)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Choose Currency</h2>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
          Select the currency you use for tracking
        </p>
      </div>

      {/* Currency Grid */}
      <Card padding={false} className="mb-4 max-h-[320px] overflow-y-auto">
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
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="secondary" icon={ArrowLeft} onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          variant="primary"
          iconRight={ArrowRight}
          onClick={onNext}
          disabled={!selectedCurrency}
          className="flex-1 py-3"
        >
          Continue
        </Button>
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
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-accent-muted)] flex items-center justify-center mx-auto mb-3">
          <PiggyBank className="w-7 h-7 text-[var(--color-accent)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Set Your Budgets</h2>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
          Define monthly spending limits for each category
        </p>
      </div>

      {/* Add budget form */}
      <Card className="mb-4">
        {/* Toggle between predefined and custom */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={!isCustom ? 'primary' : 'secondary'}
            onClick={() => setIsCustom(false)}
            className="flex-1"
          >
            Predefined
          </Button>
          <Button
            variant={isCustom ? 'primary' : 'secondary'}
            icon={Edit3}
            onClick={() => setIsCustom(true)}
            className="flex-1"
          >
            Custom
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-3">
          {isCustom ? (
            <Input
              type="text"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              placeholder="Enter category name..."
            />
          ) : (
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="
                  w-full bg-[var(--color-bg-input)] border border-[var(--color-border)]
                  rounded-[var(--radius-lg)] text-[var(--color-text-primary)]
                  px-3.5 py-2.5 text-sm appearance-none cursor-pointer
                  transition-all duration-[var(--transition-fast)]
                  focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]
                "
              >
                <option value="">Select category...</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
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
                className="
                  w-full bg-[var(--color-bg-input)] border border-[var(--color-border)]
                  rounded-[var(--radius-lg)] text-[var(--color-text-primary)]
                  py-2.5 text-sm
                  transition-all duration-[var(--transition-fast)]
                  focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]
                "
                style={{ paddingLeft: currencySymbol.length > 1 ? '2.5rem' : '2rem' }}
              />
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleAddBudget}
              disabled={!amount || (isCustom ? !customCategoryName.trim() : !selectedCategory)}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 flex-wrap">
          {[100, 250, 500, 1000].map(val => (
            <Button
              key={val}
              variant="ghost"
              size="sm"
              onClick={() => setAmount(val.toString())}
              className={amount === val.toString() ? 'bg-[var(--color-bg-hover)]' : ''}
            >
              {currencySymbol}{val}
            </Button>
          ))}
        </div>
      </Card>

      {/* Budget list */}
      <Card padding={false} className="mb-4 max-h-[240px] overflow-y-auto">
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
              const color = typeof budgetData === 'object' ? budgetData.color : (expenseCategories.find(c => c.id === catId)?.color || '#94918b')
              const budgetAmount = typeof budgetData === 'object' ? budgetData.amount : budgetData

              return (
                <div key={catId} className={`flex items-center gap-3 p-3 ${i !== 0 ? 'border-t border-[var(--color-border)]' : ''}`}>
                  <div className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <span className="text-[14px] font-bold" style={{ color }}>{currencySymbol}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{name}</p>
                  </div>
                  <span className="font-mono text-[14px] text-[var(--color-accent)]">
                    {currencySymbol}{budgetAmount.toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5 text-[var(--color-danger)]"
                    onClick={() => onRemoveBudget(catId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Total */}
      {usedCategoryIds.length > 0 && (
        <div className="flex items-center justify-between py-3 px-4 mb-4 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)]">
          <span className="text-[var(--color-text-muted)]">Total Monthly Budget</span>
          <span className="font-mono font-semibold text-lg text-[var(--color-accent)]">{currencySymbol}{totalBudget.toFixed(2)}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="secondary" icon={ArrowLeft} onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          variant="primary"
          iconRight={ArrowRight}
          onClick={onComplete}
          className="flex-1 py-3"
        >
          {usedCategoryIds.length === 0 ? 'Skip for Now' : 'Complete Setup'}
        </Button>
      </div>

      <p className="text-center text-[11px] text-[var(--color-text-muted)] mt-4">
        You can always add or modify budgets later
      </p>
    </motion.div>
  )
}

export default function Onboarding() {
  const { state, completeSetup, dispatch, setBudget, updateSettings } = useMoney()
  const [step, setStep] = useState(1)
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0])
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
    updateSettings({
      currency: selectedCurrency.code,
      currencySymbol: selectedCurrency.symbol
    })

    Object.entries(budgets).forEach(([categoryId, data]) => {
      setBudget(categoryId, data.amount)
    })

    const customCategories = Object.entries(budgets)
      .filter(([id]) => id.startsWith('custom_'))
      .map(([id, data]) => ({ id, name: data.name, color: data.color }))

    if (customCategories.length > 0) {
      dispatch({ type: 'ADD_CUSTOM_CATEGORIES', payload: customCategories })
    }

    completeSetup()
    toast.success('Welcome to MoneyTracker!')
  }

  const handleGoogleRestore = (data) => {
    if (data.expenses) dispatch({ type: 'SET_EXPENSES', payload: data.expenses })
    if (data.income) dispatch({ type: 'SET_INCOME', payload: data.income })
    if (data.budgets) dispatch({ type: 'SET_BUDGETS', payload: data.budgets })
    if (data.customCategories) dispatch({ type: 'ADD_CUSTOM_CATEGORIES', payload: data.customCategories })
    if (data.currency || data.currencySymbol) {
      updateSettings({
        currency: data.currency || state?.settings?.currency,
        currencySymbol: data.currencySymbol || state?.settings?.currencySymbol
      })
    }

    setImportSuccess(true)
    setTimeout(() => {
      completeSetup()
    }, 1500)
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
            className="w-16 h-16 rounded-[var(--radius-2xl)] bg-[var(--color-accent)] flex items-center justify-center mx-auto mb-3"
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
              onGoogleRestore={handleGoogleRestore}
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
