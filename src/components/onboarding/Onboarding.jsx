import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  PiggyBank,
  Cloud,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Sparkles,
} from 'lucide-react'
import { useMoney } from '@/context/MoneyContext'
import { expenseCategories } from '@/data/categories'
import { Button } from '@/components/ui'

const CURRENCIES = [
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
]

const SUGGESTED_BUDGETS = [
  { id: 'food', amount: 600 },
  { id: 'transport', amount: 200 },
  { id: 'utilities', amount: 250 },
  { id: 'entertainment', amount: 100 },
  { id: 'shopping', amount: 150 },
  { id: 'housing', amount: 1500 },
  { id: 'subscriptions', amount: 50 },
  { id: 'health', amount: 100 },
]

const STEPS = [
  { id: 'currency', label: 'Currency', icon: DollarSign },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'cloud', label: 'Sync', icon: Cloud },
  { id: 'done', label: 'Done', icon: CheckCircle },
]

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

export default function Onboarding() {
  const { updateSettings, setBudgets, completeSetup } = useMoney()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [currency, setCurrency] = useState('CAD')
  const [budgetSelections, setBudgetSelections] = useState(() => {
    const init = {}
    SUGGESTED_BUDGETS.forEach((b) => {
      init[b.id] = { enabled: true, amount: b.amount }
    })
    return init
  })

  const currencySymbol = useMemo(
    () => CURRENCIES.find((c) => c.code === currency)?.symbol || '$',
    [currency],
  )

  function goNext() {
    setDirection(1)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  function handleSkip() {
    updateSettings({ currency, currencySymbol })
    completeSetup()
  }

  function handleFinish() {
    updateSettings({ currency, currencySymbol })

    // Build budgets object from selections
    const budgets = {}
    Object.entries(budgetSelections).forEach(([catId, sel]) => {
      if (sel.enabled && sel.amount > 0) {
        budgets[catId] = { amount: sel.amount, period: 'monthly', rollover: false }
      }
    })
    if (Object.keys(budgets).length > 0) {
      setBudgets(budgets)
    }

    completeSetup()
  }

  function toggleBudget(catId) {
    setBudgetSelections((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], enabled: !prev[catId]?.enabled },
    }))
  }

  function updateBudgetAmount(catId, amount) {
    setBudgetSelections((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], amount: Number(amount) || 0 },
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <div className="w-full max-w-lg mx-4">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Money Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Let's set up your finances in under a minute</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  i < step
                    ? 'bg-indigo-600 text-white'
                    : i === step
                      ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${i < step ? 'bg-indigo-600' : 'bg-slate-200'}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 min-h-[320px] flex flex-col">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex-1"
              >
                {step === 0 && (
                  <StepCurrency currency={currency} setCurrency={setCurrency} />
                )}
                {step === 1 && (
                  <StepBudgets
                    selections={budgetSelections}
                    toggle={toggleBudget}
                    updateAmount={updateBudgetAmount}
                    currencySymbol={currencySymbol}
                  />
                )}
                {step === 2 && <StepCloud />}
                {step === 3 && (
                  <StepDone currency={currency} budgetCount={
                    Object.values(budgetSelections).filter((s) => s.enabled).length
                  } />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <div>
              {step > 0 && step < STEPS.length - 1 && (
                <Button variant="ghost" size="sm" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {step < STEPS.length - 1 && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip Setup
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button size="sm" onClick={goNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleFinish}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────── Step Components ────────────

function StepCurrency({ currency, setCurrency }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Choose your currency</h2>
      <p className="text-sm text-slate-500 mb-5">
        This will be used for formatting amounts throughout the app.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {CURRENCIES.map((c) => (
          <button
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              currency === c.code
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 font-mono font-bold text-sm text-slate-700">
              {c.symbol}
            </span>
            <div>
              <div className="text-sm font-medium text-slate-900">{c.code}</div>
              <div className="text-xs text-slate-500">{c.name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepBudgets({ selections, toggle, updateAmount, currencySymbol }) {
  const cats = useMemo(
    () => expenseCategories.filter((c) => SUGGESTED_BUDGETS.some((b) => b.id === c.id)),
    [],
  )

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Set monthly budgets</h2>
      <p className="text-sm text-slate-500 mb-4">
        Toggle categories on/off and adjust amounts. You can change these later.
      </p>
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {cats.map((cat) => {
          const sel = selections[cat.id] || { enabled: false, amount: 0 }
          return (
            <div
              key={cat.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                sel.enabled
                  ? 'border-indigo-200 bg-indigo-50/50'
                  : 'border-slate-100 bg-slate-50/50 opacity-60'
              }`}
            >
              <button
                onClick={() => toggle(cat.id)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  sel.enabled
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {sel.enabled && (
                  <CheckCircle className="w-3 h-3" />
                )}
              </button>
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">
                {cat.name}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-slate-400 font-mono">{currencySymbol}</span>
                <input
                  type="number"
                  value={sel.amount || ''}
                  onChange={(e) => updateAmount(cat.id, e.target.value)}
                  disabled={!sel.enabled}
                  className="w-20 px-2 py-1 text-sm font-mono text-right rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
                  min="0"
                  step="50"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepCloud() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-4">
      <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mb-4">
        <Cloud className="w-8 h-8 text-sky-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Google Drive Sync</h2>
      <p className="text-sm text-slate-500 mb-5 max-w-xs">
        Back up your data to Google Drive automatically. You can set this up anytime from Settings.
      </p>
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 max-w-xs">
        You can enable Google Drive sync later in{' '}
        <span className="font-semibold">Settings &gt; Google Drive</span>.
      </div>
    </div>
  )
}

function StepDone({ currency, budgetCount }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">You're all set!</h2>
      <p className="text-sm text-slate-500 mb-5 max-w-xs">
        Currency set to <span className="font-semibold">{currency}</span> with{' '}
        <span className="font-semibold">{budgetCount} budget{budgetCount !== 1 ? 's' : ''}</span>{' '}
        configured. You can adjust everything in Settings.
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100">
          <DollarSign className="w-3.5 h-3.5" /> Track expenses
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100">
          <PiggyBank className="w-3.5 h-3.5" /> Monitor budgets
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100">
          <Sparkles className="w-3.5 h-3.5" /> Set goals
        </div>
      </div>
    </div>
  )
}
