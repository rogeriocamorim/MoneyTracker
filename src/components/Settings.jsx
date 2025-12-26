import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Database,
  Trash2,
  Shield
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { exportToJson, importFromJson } from '../utils/storage'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const currencies = [
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
]

export default function Settings() {
  const { state, updateSettings, importData } = useMoney()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const fileInputRef = useRef(null)

  const handleExport = () => {
    const { isLoaded, ...dataToExport } = state
    exportToJson(dataToExport)
    toast.success('Data exported successfully!')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await importFromJson(file)
      importData(data)
      toast.success('Data imported successfully!')
    } catch (error) {
      toast.error(error.message)
    }

    e.target.value = ''
  }

  const handleCurrencyChange = (e) => {
    const currency = currencies.find(c => c.code === e.target.value)
    if (currency) {
      updateSettings({
        currency: currency.code,
        currencySymbol: currency.symbol,
      })
      toast.success('Currency updated!')
    }
  }

  const handleClearAllData = () => {
    localStorage.clear()
    toast.success('All data cleared!')
    setTimeout(() => window.location.reload(), 500)
  }

  const stats = {
    expenses: state.expenses.length,
    income: state.income.length,
    budgetsSet: Object.values(state.budgets).filter(b => b > 0).length,
  }

  return (
    <motion.div 
      className="max-w-2xl space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Currency Settings */}
      <motion.div variants={item} className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Currency</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Set your preferred currency</p>
          </div>
        </div>
        
        <select
          value={state.settings.currency}
          onChange={handleCurrencyChange}
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} - {currency.name} ({currency.code})
            </option>
          ))}
        </select>
      </motion.div>

      {/* Data Statistics */}
      <motion.div variants={item} className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-info-muted)] flex items-center justify-center">
            <Database className="w-5 h-5 text-[var(--color-info)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Your Data</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Overview of stored information</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-xl">
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
              {stats.expenses}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Expenses</p>
          </div>
          <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-xl">
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
              {stats.income}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Income</p>
          </div>
          <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-xl">
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
              {stats.budgetsSet}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Budgets</p>
          </div>
        </div>
      </motion.div>

      {/* Export/Import */}
      <motion.div variants={item} className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-success-muted)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[var(--color-success)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Backup & Restore</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Export or import your data</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <motion.button
            onClick={handleExport}
            className="flex-1 px-4 py-3 rounded-xl btn-primary flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
          
          <motion.button
            onClick={handleImportClick}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-semibold flex items-center justify-center gap-2 border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Upload className="w-4 h-4" />
            Import
          </motion.button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
        
        <p className="text-xs text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Importing will replace all current data
        </p>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={item} className="glass-card rounded-2xl p-6 border-[var(--color-danger)]/20">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-danger-muted)] flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-[var(--color-danger)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-danger)]">Danger Zone</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Irreversible actions</p>
          </div>
        </div>
        
        {showClearConfirm ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearAllData}
              className="px-4 py-2 rounded-xl bg-[var(--color-danger)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-2 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] font-semibold text-sm hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-3 rounded-xl bg-[var(--color-danger-muted)] text-[var(--color-danger)] font-semibold text-sm flex items-center gap-2 hover:bg-[var(--color-danger)]/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        )}
      </motion.div>

      {/* Info */}
      <motion.div variants={item} className="text-center text-sm text-[var(--color-text-muted)] space-y-1 py-4">
        <p className="font-medium">MoneyTracker v1.0.0</p>
        <p>Data stored locally in your browser</p>
      </motion.div>
    </motion.div>
  )
}
