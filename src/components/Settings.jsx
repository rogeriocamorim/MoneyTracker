import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Upload, Trash2, Globe, Database, AlertTriangle, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { exportData, importData } from '../utils/storage'

export default function Settings() {
  const { state, dispatch } = useMoney()
  const fileInputRef = useRef(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleExport = () => {
    try {
      exportData(state)
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await importData(file)
      if (data.expenses) dispatch({ type: 'SET_EXPENSES', payload: data.expenses })
      if (data.income) dispatch({ type: 'SET_INCOME', payload: data.income })
      if (data.budgets) dispatch({ type: 'SET_BUDGETS', payload: data.budgets })
      toast.success('Data imported successfully')
    } catch (error) {
      toast.error('Failed to import: Invalid file format')
    }
    e.target.value = ''
  }

  const handleClearData = () => {
    dispatch({ type: 'CLEAR_ALL' })
    setShowDeleteConfirm(false)
    toast.success('All data cleared')
  }

  const stats = {
    expenses: state.expenses.length,
    income: state.income.length,
    budgets: Object.keys(state.budgets).length,
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div>
        <p className="text-[13px] text-[var(--color-text-muted)]">Manage your preferences</p>
      </div>

      {/* Currency */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-accent-muted)]">
            <Globe className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Currency</h3>
            <p className="text-[13px] text-[var(--color-text-muted)]">Display format for amounts</p>
          </div>
        </div>
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--color-bg-muted)]">
          <span className="text-[var(--color-text-secondary)]">Canadian Dollar</span>
          <span className="font-mono font-semibold text-[var(--color-accent)]">CAD $</span>
        </div>
      </div>

      {/* Data Storage */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-success-muted)]">
            <Database className="w-5 h-5 text-[var(--color-success)]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Data Storage</h3>
            <p className="text-[13px] text-[var(--color-text-muted)]">Your data is stored locally in this browser</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center py-3 px-4 rounded-xl bg-[var(--color-bg-muted)]">
            <p className="text-2xl font-bold font-mono text-[var(--color-danger)]">{stats.expenses}</p>
            <p className="text-[12px] text-[var(--color-text-muted)]">Expenses</p>
          </div>
          <div className="text-center py-3 px-4 rounded-xl bg-[var(--color-bg-muted)]">
            <p className="text-2xl font-bold font-mono text-[var(--color-success)]">{stats.income}</p>
            <p className="text-[12px] text-[var(--color-text-muted)]">Income</p>
          </div>
          <div className="text-center py-3 px-4 rounded-xl bg-[var(--color-bg-muted)]">
            <p className="text-2xl font-bold font-mono text-[var(--color-accent)]">{stats.budgets}</p>
            <p className="text-[12px] text-[var(--color-text-muted)]">Budgets</p>
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={handleExport} className="btn btn-secondary w-full">
            <Download className="w-4 h-4" /> Export Data (JSON)
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary w-full">
            <Upload className="w-4 h-4" /> Import Data
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: 'var(--color-danger)', borderWidth: '1px' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-danger-muted)]">
            <AlertTriangle className="w-5 h-5 text-[var(--color-danger)]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--color-danger)]">Danger Zone</h3>
            <p className="text-[13px] text-[var(--color-text-muted)]">Irreversible actions</p>
          </div>
        </div>
        
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger w-full">
            <Trash2 className="w-4 h-4" /> Clear All Data
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-[var(--color-text-muted)] text-center py-2">
              Are you sure? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleClearData} className="btn btn-danger">
                <Check className="w-4 h-4" /> Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div className="card">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-3">About</h3>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
          MoneyTracker is a personal finance app that helps you track your expenses and income. 
          All data is stored locally in your browser - no data is sent to any server.
        </p>
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <p className="text-[12px] text-[var(--color-text-muted)]">Version 1.0.0</p>
        </div>
      </div>
    </motion.div>
  )
}
