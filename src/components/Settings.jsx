import { useState, useRef } from 'react'
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Database,
  Trash2
} from 'lucide-react'
import { useMoney } from '../context/MoneyContext'
import { exportToJson, importFromJson } from '../utils/storage'

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
  const [message, setMessage] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const fileInputRef = useRef(null)

  const handleExport = () => {
    const { isLoaded, ...dataToExport } = state
    exportToJson(dataToExport)
    setMessage({ type: 'success', text: 'Data exported successfully!' })
    setTimeout(() => setMessage(null), 3000)
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
      setMessage({ type: 'success', text: 'Data imported successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }

    // Reset file input
    e.target.value = ''
    setTimeout(() => setMessage(null), 5000)
  }

  const handleCurrencyChange = (e) => {
    const currency = currencies.find(c => c.code === e.target.value)
    if (currency) {
      updateSettings({
        currency: currency.code,
        currencySymbol: currency.symbol,
      })
      setMessage({ type: 'success', text: 'Currency updated!' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleClearAllData = () => {
    localStorage.clear()
    window.location.reload()
  }

  // Stats
  const stats = {
    expenses: state.expenses.length,
    income: state.income.length,
    budgetsSet: Object.values(state.budgets).filter(b => b > 0).length,
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Message */}
      {message && (
        <div 
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
              : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Currency Settings */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Currency</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Set your preferred currency</p>
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
      </div>

      {/* Data Statistics */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-info)]/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-[var(--color-info)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Your Data</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Overview of stored data</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-xl">
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
              {stats.expenses}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">Expenses</p>
          </div>
          <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-xl">
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
              {stats.income}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">Income entries</p>
          </div>
          <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-xl">
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
              {stats.budgetsSet}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">Budgets set</p>
          </div>
        </div>
      </div>

      {/* Export/Import */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Backup & Restore</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Export your data as a JSON file for backup, or import a previous backup.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Download className="w-5 h-5" />
            Export Data
          </button>
          
          <button
            onClick={handleImportClick}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] transition-colors"
          >
            <Upload className="w-5 h-5" />
            Import Data
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
        
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          Note: Importing data will replace all your current data.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-danger)]/30">
        <h3 className="font-semibold text-[var(--color-danger)] mb-2">Danger Zone</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Permanently delete all your data. This action cannot be undone.
        </p>
        
        {showClearConfirm ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearAllData}
              className="px-4 py-2 rounded-xl bg-[var(--color-danger)] text-white font-semibold hover:bg-[var(--color-danger)]/80 transition-colors"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-2 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] font-semibold hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-3 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] font-semibold flex items-center gap-2 hover:bg-[var(--color-danger)]/20 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Clear All Data
          </button>
        )}
      </div>

      {/* Info */}
      <div className="text-center text-sm text-[var(--color-text-muted)] space-y-1">
        <p>MoneyTracker v1.0.0</p>
        <p>Your data is stored locally in your browser.</p>
        <p>Remember to export backups regularly!</p>
      </div>
    </div>
  )
}

