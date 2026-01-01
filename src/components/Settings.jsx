import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Download, 
  Upload, 
  Trash2, 
  Globe, 
  Database, 
  AlertTriangle, 
  Check, 
  Cloud, 
  CloudOff,
  RefreshCw,
  Settings as SettingsIcon,
  ExternalLink,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { exportData, importData } from '../utils/storage'
import { 
  initGoogleApi, 
  isSignedIn, 
  signIn, 
  signOut, 
  saveToGoogleDrive, 
  loadFromGoogleDrive,
  getBackupInfo,
  setClientId,
  hasClientId
} from '../utils/googleDrive'

export default function Settings() {
  const { state, dispatch } = useMoney()
  const fileInputRef = useRef(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Google Drive state
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleSyncing, setGoogleSyncing] = useState(false)
  const [backupInfo, setBackupInfo] = useState(null)
  const [showClientIdSetup, setShowClientIdSetup] = useState(false)
  const [clientIdInput, setClientIdInput] = useState('')
  const [clientIdConfigured, setClientIdConfigured] = useState(false)

  // Check Google connection on mount
  useEffect(() => {
    setClientIdConfigured(hasClientId())
    if (hasClientId()) {
      checkGoogleConnection()
    }
  }, [])

  const checkGoogleConnection = async () => {
    try {
      setGoogleLoading(true)
      await initGoogleApi()
      const connected = isSignedIn()
      setGoogleConnected(connected)
      if (connected) {
        const info = await getBackupInfo()
        setBackupInfo(info)
      }
    } catch (err) {
      console.error('Google API init error:', err)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleConnect = async () => {
    try {
      setGoogleLoading(true)
      await initGoogleApi()
      await signIn()
      setGoogleConnected(true)
      const info = await getBackupInfo()
      setBackupInfo(info)
      toast.success('Connected to Google Drive')
    } catch (err) {
      console.error('Google sign in error:', err)
      toast.error('Failed to connect to Google Drive')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleDisconnect = () => {
    signOut()
    setGoogleConnected(false)
    setBackupInfo(null)
    toast.success('Disconnected from Google Drive')
  }

  const handleSaveToGoogle = async () => {
    try {
      setGoogleSyncing(true)
      const dataToSave = {
        expenses: state.expenses,
        income: state.income,
        budgets: state.budgets,
        currency: state.currency,
        customCategories: state.customCategories,
        exportedAt: new Date().toISOString(),
      }
      await saveToGoogleDrive(dataToSave)
      const info = await getBackupInfo()
      setBackupInfo(info)
      toast.success('Saved to Google Drive')
    } catch (err) {
      console.error('Save to Google error:', err)
      toast.error('Failed to save to Google Drive')
    } finally {
      setGoogleSyncing(false)
    }
  }

  const handleLoadFromGoogle = async () => {
    try {
      setGoogleSyncing(true)
      const result = await loadFromGoogleDrive()
      if (!result) {
        toast.error('No backup found on Google Drive')
        return
      }
      
      const { data } = result
      if (data.expenses) dispatch({ type: 'SET_EXPENSES', payload: data.expenses })
      if (data.income) dispatch({ type: 'SET_INCOME', payload: data.income })
      if (data.budgets) dispatch({ type: 'SET_BUDGETS', payload: data.budgets })
      if (data.customCategories) dispatch({ type: 'ADD_CUSTOM_CATEGORIES', payload: data.customCategories })
      
      toast.success('Loaded from Google Drive')
    } catch (err) {
      console.error('Load from Google error:', err)
      toast.error('Failed to load from Google Drive')
    } finally {
      setGoogleSyncing(false)
    }
  }

  const handleSaveClientId = () => {
    if (clientIdInput.trim()) {
      setClientId(clientIdInput.trim())
      setClientIdConfigured(true)
      setShowClientIdSetup(false)
      setClientIdInput('')
      toast.success('Google Client ID saved')
      checkGoogleConnection()
    }
  }

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

      {/* Google Drive */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#4285f4]/10">
            <Cloud className="w-5 h-5 text-[#4285f4]" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Google Drive Backup</h3>
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {googleConnected ? 'Connected - sync your data to the cloud' : 'Save your data to Google Drive'}
            </p>
          </div>
          {googleConnected && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-success-muted)]">
              <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
              <span className="text-[11px] font-medium text-[var(--color-success)]">Connected</span>
            </div>
          )}
        </div>

        {!clientIdConfigured ? (
          // Client ID Setup
          <div className="space-y-3">
            {!showClientIdSetup ? (
              <>
                <div className="p-4 rounded-xl bg-[var(--color-bg-muted)] border border-[var(--color-border)]">
                  <p className="text-[13px] text-[var(--color-text-secondary)] mb-3">
                    To use Google Drive backup, you need to set up a Google Cloud project with OAuth credentials.
                  </p>
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                  >
                    Google Cloud Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button 
                  onClick={() => setShowClientIdSetup(true)} 
                  className="btn btn-secondary w-full"
                >
                  <SettingsIcon className="w-4 h-4" /> Configure Google Client ID
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[var(--color-bg-muted)] text-[12px] text-[var(--color-text-muted)] space-y-2">
                  <p className="font-medium text-[var(--color-text-secondary)]">Setup Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
                    <li>Create OAuth 2.0 Client ID (Web application)</li>
                    <li>Add <code className="px-1 py-0.5 rounded bg-[var(--color-bg-base)] font-mono text-[11px]">{window.location.origin}</code> to authorized JavaScript origins</li>
                    <li>Copy the Client ID and paste below</li>
                  </ol>
                </div>
                <input 
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="Enter Google Client ID (*.apps.googleusercontent.com)"
                  className="input w-full font-mono text-[12px]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowClientIdSetup(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveClientId} 
                    disabled={!clientIdInput.trim()}
                    className="btn btn-primary"
                  >
                    Save Client ID
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : !googleConnected ? (
          // Not connected - show connect button
          <button 
            onClick={handleGoogleConnect} 
            disabled={googleLoading}
            className="btn btn-primary w-full"
          >
            {googleLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
            ) : (
              <><Cloud className="w-4 h-4" /> Connect to Google Drive</>
            )}
          </button>
        ) : (
          // Connected - show sync options
          <div className="space-y-3">
            {backupInfo && (
              <div className="p-3 rounded-xl bg-[var(--color-bg-muted)] flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-[var(--color-text-muted)]">Last backup</p>
                  <p className="text-[13px] text-[var(--color-text-secondary)] font-medium">
                    {new Date(backupInfo.modifiedTime).toLocaleString()}
                  </p>
                </div>
                <Cloud className="w-5 h-5 text-[var(--color-text-muted)]" />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleSaveToGoogle} 
                disabled={googleSyncing}
                className="btn btn-primary"
              >
                {googleSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Save to Drive
              </button>
              <button 
                onClick={handleLoadFromGoogle} 
                disabled={googleSyncing}
                className="btn btn-secondary"
              >
                {googleSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Load from Drive
              </button>
            </div>
            
            <button 
              onClick={handleGoogleDisconnect}
              className="btn btn-secondary w-full text-[var(--color-danger)]"
            >
              <CloudOff className="w-4 h-4" /> Disconnect Google Drive
            </button>
          </div>
        )}
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
            <Trash2 className="w-4 h-4" /> Reset App & Clear All Data
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-[var(--color-text-muted)] text-center py-2">
              This will delete all expenses, income, budgets and return to the setup screen.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleClearData} className="btn btn-danger">
                <Check className="w-4 h-4" /> Confirm Reset
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
