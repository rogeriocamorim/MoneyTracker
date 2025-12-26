import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Edit3
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

// Generate a random color for custom categories
const randomColor = () => {
  const colors = ['#f97316', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#ef4444', '#14b8a6', '#22c55e', '#06b6d4', '#8b5cf6']
  return colors[Math.floor(Math.random() * colors.length)]
}

// Step 1: Welcome
function WelcomeStep({ onNext, onImport, isImporting, importSuccess }) {
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
    </motion.div>
  )
}

// Step 2: Budget Setup
function BudgetStep({ budgets, onUpdateBudget, onRemoveBudget, onBack, onComplete }) {
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="input pl-7"
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
              ${val}
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
              const amount = typeof budgetData === 'object' ? budgetData.amount : budgetData
              
              return (
                <div key={catId} className={`flex items-center gap-3 p-3 ${i !== 0 ? 'border-t border-[var(--color-border)]' : ''}`}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <span className="text-[14px] font-bold" style={{ color }}>$</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{name}</p>
                  </div>
                  <span className="font-mono text-[14px] text-[var(--color-accent)]">
                    ${amount.toFixed(2)}
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
          <span className="font-mono font-semibold text-lg text-[var(--color-accent)]">${totalBudget.toFixed(2)}</span>
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
  const { completeSetup, dispatch, setBudget } = useMoney()
  const [step, setStep] = useState(1)
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
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
          <div className={`w-2 h-2 rounded-full transition-colors ${step >= 1 ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
          <div className={`w-2 h-2 rounded-full transition-colors ${step >= 2 ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <WelcomeStep 
              key="welcome"
              onNext={() => setStep(2)}
              onImport={handleImport}
              isImporting={isImporting}
              importSuccess={importSuccess}
            />
          )}
          {step === 2 && (
            <BudgetStep
              key="budget"
              budgets={budgets}
              onUpdateBudget={handleUpdateBudget}
              onRemoveBudget={handleRemoveBudget}
              onBack={() => setStep(1)}
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
