import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  Upload, 
  ArrowRight, 
  Check,
  Wallet,
  PiggyBank,
  BarChart3,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { importData } from '../utils/storage'

const features = [
  { icon: Wallet, title: 'Track Expenses', description: 'Record daily spending across bank and credit cards' },
  { icon: TrendingUp, title: 'Monitor Income', description: 'Track earnings from multiple sources' },
  { icon: PiggyBank, title: 'Set Budgets', description: 'Create monthly limits for each category' },
  { icon: BarChart3, title: 'View Insights', description: 'Visualize your finances with charts' },
]

export default function Onboarding() {
  const { completeSetup, dispatch } = useMoney()
  const fileInputRef = useRef(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)

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

  const handleStartFresh = () => {
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
        <div className="text-center mb-8">
          <motion.div 
            className="w-20 h-20 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center mx-auto mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <TrendingUp className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            MoneyTracker
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Personal finance made simple
          </p>
        </div>

        {/* Features */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div 
                key={feature.title}
                className="flex flex-col items-center text-center p-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
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

        {/* Actions */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {/* Import existing data */}
          <div className="card">
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
                  {importSuccess ? 'Redirecting to dashboard...' : 'Import from a previous backup'}
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
              onChange={handleImport}
              className="hidden"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-[12px] text-[var(--color-text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* Start fresh */}
          <button 
            onClick={handleStartFresh}
            disabled={isImporting || importSuccess}
            className="btn btn-primary w-full py-4"
          >
            <Sparkles className="w-4 h-4" />
            Start Fresh
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-[11px] text-[var(--color-text-muted)] mt-4">
            All data is stored locally in your browser.
            <br />
            No account required. Your data never leaves your device.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

