import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Loader2,
  ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { exportData, importData } from '../utils/storage'
import { APP_VERSION, CHANGELOG } from '../data/version'
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
import { Card, Button, Input } from './ui'
import { Toggle } from './ui/Toggle'

function ChangelogSection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group"
      >
        <span className="text-[13px] font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
          Changelog
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {CHANGELOG.map((release, i) => (
                <div key={release.version}>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[13px] font-semibold ${i === 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                      v{release.version}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {release.date}
                    </span>
                    {i === 0 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-accent)] text-white leading-none">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mt-1">
                    {release.title}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {release.changes.map((change, j) => (
                      <li key={j} className="text-[12px] text-[var(--color-text-muted)] flex gap-2">
                        <span className="text-[var(--color-text-muted)] mt-0.5 shrink-0">-</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Settings() {
  const { state, syncStatus, dispatch, updateSettings } = useMoney()
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
    if (state.settings?.autoSyncEnabled) {
      updateSettings({ autoSyncEnabled: false })
    }
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
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-[var(--radius-xl)] flex items-center justify-center bg-[var(--color-accent-muted)]">
            <Globe className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Currency</h3>
            <p className="text-[13px] text-[var(--color-text-muted)]">Display format for amounts</p>
          </div>
        </div>
        <div className="flex items-center justify-between py-3 px-4 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)]">
          <span className="text-[var(--color-text-secondary)]">Canadian Dollar</span>
          <span className="font-mono font-semibold text-[var(--color-accent)]">CAD $</span>
        </div>
      </Card>

      {/* Data Storage */}
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-[var(--radius-xl)] flex items-center justify-center bg-[var(--color-success-muted)]">
            <Database className="w-5 h-5 text-[var(--color-success)]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Data Storage</h3>
            <p className="text-[13px] text-[var(--color-text-muted)]">Your data is stored locally in this browser</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center py-3 px-4 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)]">
            <p className="text-2xl font-bold font-mono text-[var(--color-danger)]">{stats.expenses}</p>
            <p className="text-[12px] text-[var(--color-text-muted)]">Expenses</p>
          </div>
          <div className="text-center py-3 px-4 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)]">
            <p className="text-2xl font-bold font-mono text-[var(--color-success)]">{stats.income}</p>
            <p className="text-[12px] text-[var(--color-text-muted)]">Income</p>
          </div>
          <div className="text-center py-3 px-4 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)]">
            <p className="text-2xl font-bold font-mono text-[var(--color-accent)]">{stats.budgets}</p>
            <p className="text-[12px] text-[var(--color-text-muted)]">Budgets</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button variant="secondary" icon={Download} onClick={handleExport} className="w-full">
            Export Data (JSON)
          </Button>
          <Button variant="secondary" icon={Upload} onClick={() => fileInputRef.current?.click()} className="w-full">
            Import Data
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </Card>

      {/* Google Drive */}
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-[var(--radius-xl)] flex items-center justify-center bg-[#4285f4]/10">
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
          /* Client ID Setup */
          <div className="space-y-3">
            {!showClientIdSetup ? (
              <>
                <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)] border border-[var(--color-border)]">
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
                <Button
                  variant="secondary"
                  icon={SettingsIcon}
                  onClick={() => setShowClientIdSetup(true)}
                  className="w-full"
                >
                  Configure Google Client ID
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)] text-[12px] text-[var(--color-text-muted)] space-y-2">
                  <p className="font-medium text-[var(--color-text-secondary)]">Setup Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
                    <li>Create OAuth 2.0 Client ID (Web application)</li>
                    <li>Add <code className="px-1 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-base)] font-mono text-[11px]">{window.location.origin}</code> to authorized JavaScript origins</li>
                    <li>Copy the Client ID and paste below</li>
                  </ol>
                </div>
                <Input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="Enter Google Client ID (*.apps.googleusercontent.com)"
                  className="font-mono text-[12px]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => setShowClientIdSetup(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveClientId}
                    disabled={!clientIdInput.trim()}
                  >
                    Save Client ID
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : !googleConnected ? (
          /* Not connected - show connect button */
          <Button
            variant="primary"
            icon={googleLoading ? Loader2 : Cloud}
            onClick={handleGoogleConnect}
            disabled={googleLoading}
            loading={googleLoading}
            className="w-full"
          >
            {googleLoading ? 'Connecting...' : 'Connect to Google Drive'}
          </Button>
        ) : (
          /* Connected - show sync options */
          <div className="space-y-3">
            {/* Auto-sync toggle */}
            <div className="p-3 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)] flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Auto-sync</p>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  Automatically sync changes to Google Drive
                </p>
              </div>
              <Toggle
                checked={!!state.settings?.autoSyncEnabled}
                onChange={(val) => updateSettings({ autoSyncEnabled: val })}
              />
            </div>

            {/* Sync status */}
            {(syncStatus.isSyncing || syncStatus.lastSyncTime || backupInfo) && (
              <div className="p-3 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)] flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-[var(--color-text-muted)]">
                    {syncStatus.isSyncing ? 'Syncing...' : 'Last synced'}
                  </p>
                  <p className="text-[13px] text-[var(--color-text-secondary)] font-medium">
                    {syncStatus.isSyncing ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Saving to Google Drive...
                      </span>
                    ) : syncStatus.lastSyncTime ? (
                      new Date(syncStatus.lastSyncTime).toLocaleString()
                    ) : backupInfo ? (
                      new Date(backupInfo.modifiedTime).toLocaleString()
                    ) : (
                      'Never'
                    )}
                  </p>
                </div>
                {syncStatus.isSyncing ? (
                  <Loader2 className="w-5 h-5 text-[var(--color-accent)] animate-spin" />
                ) : (
                  <Cloud className="w-5 h-5 text-[var(--color-text-muted)]" />
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                icon={googleSyncing ? undefined : Upload}
                onClick={handleSaveToGoogle}
                disabled={googleSyncing}
                loading={googleSyncing}
              >
                Save to Drive
              </Button>
              <Button
                variant="secondary"
                icon={googleSyncing ? undefined : Download}
                onClick={handleLoadFromGoogle}
                disabled={googleSyncing}
                loading={googleSyncing}
              >
                Load from Drive
              </Button>
            </div>

            <Button
              variant="secondary"
              icon={CloudOff}
              onClick={handleGoogleDisconnect}
              className="w-full text-[var(--color-danger)]"
            >
              Disconnect Google Drive
            </Button>
          </div>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="border border-[var(--color-danger)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-[var(--radius-xl)] flex items-center justify-center bg-[var(--color-danger-muted)]">
            <AlertTriangle className="w-5 h-5 text-[var(--color-danger)]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--color-danger)]">Danger Zone</h3>
            <p className="text-[13px] text-[var(--color-text-muted)]">Irreversible actions</p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <Button variant="danger" icon={Trash2} onClick={() => setShowDeleteConfirm(true)} className="w-full">
            Reset App & Clear All Data
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-[var(--color-text-muted)] text-center py-2">
              This will delete all expenses, income, budgets and return to the setup screen.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" icon={Check} onClick={handleClearData}>
                Confirm Reset
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* About */}
      <Card>
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-3">About</h3>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
          MoneyTracker is a personal finance app that helps you track expenses, income, and budgets.
          Import bank statements, scan receipts, sync with Google Drive, and compare spending across months.
          All data is stored locally in your browser - no data is sent to any server.
        </p>
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            Version {APP_VERSION}
          </p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
            {CHANGELOG[0]?.title}
          </p>
        </div>

        {/* Changelog */}
        <ChangelogSection />
      </Card>
    </motion.div>
  )
}
