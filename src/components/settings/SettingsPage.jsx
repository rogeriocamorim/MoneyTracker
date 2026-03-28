import { useState } from 'react'
import { Save, Download, Upload, Trash2, Cloud, Plus, X } from 'lucide-react'
import { useMoney } from '@/context/MoneyContext'
import { exportToJson, importFromJson } from '@/utils/storage'
import {
  initGoogleApi,
  signIn,
  signOut,
  saveToGoogleDrive,
  loadFromGoogleDrive,
  isSignedIn as isSignedInFn,
  setClientId as setClientIdFn,
  getStoredClientId,
} from '@/utils/googleDrive'
import { Card, Button, Input, Select, Toggle, Modal, Badge } from '@/components/ui'
import { expenseCategories, incomeSources } from '@/data/categories'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { state, dispatch } = useMoney()
  const { settings, customCategories = [] } = state

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <CurrencySettings settings={settings} dispatch={dispatch} />
      <CategoryManager customCategories={customCategories} dispatch={dispatch} />
      <DataManagement state={state} dispatch={dispatch} />
      <GoogleDriveSection settings={settings} state={state} dispatch={dispatch} />
      <DangerZone dispatch={dispatch} />
    </div>
  )
}

function CurrencySettings({ settings, dispatch }) {
  const [currency, setCurrency] = useState(settings?.currency || 'CAD')
  const currencies = [
    { value: 'CAD', label: 'CAD - Canadian Dollar ($)' },
    { value: 'USD', label: 'USD - US Dollar ($)' },
    { value: 'EUR', label: 'EUR - Euro (\u20AC)' },
    { value: 'GBP', label: 'GBP - British Pound (\u00A3)' },
    { value: 'BRL', label: 'BRL - Brazilian Real (R$)' },
    { value: 'JPY', label: 'JPY - Japanese Yen (\u00A5)' },
  ]

  const symbolMap = { CAD: '$', USD: '$', EUR: '\u20AC', GBP: '\u00A3', BRL: 'R$', JPY: '\u00A5' }

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { currency, currencySymbol: symbolMap[currency] || '$' },
    })
    toast.success('Currency updated')
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Currency</h3>
      <div className="flex items-end gap-3">
        <Select
          label="Display Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          options={currencies}
          placeholder=""
          wrapperClassName="flex-1"
        />
        <Button variant="primary" size="md" icon={Save} onClick={handleSave}>
          Save
        </Button>
      </div>
    </Card>
  )
}

function CategoryManager({ customCategories, dispatch }) {
  const [showModal, setShowModal] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', type: 'expense' })

  const handleAdd = () => {
    if (!newCat.name.trim()) return
    const id = `custom_${newCat.name.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
    dispatch({
      type: 'ADD_CUSTOM_CATEGORY',
      payload: { id, name: newCat.name.trim(), type: newCat.type, icon: 'Tag', color: '#94a3b8' },
    })
    setNewCat({ name: '', type: 'expense' })
    toast.success('Category added')
  }

  const handleRemove = (id) => {
    dispatch({ type: 'REMOVE_CUSTOM_CATEGORY', payload: id })
    toast.success('Category removed')
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Custom Categories</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              {customCategories.length === 0
                ? 'No custom categories yet'
                : `${customCategories.length} custom categor${customCategories.length === 1 ? 'y' : 'ies'}`}
            </p>
          </div>
          <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowModal(true)}>
            Manage
          </Button>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Custom Categories" size="md">
        <div className="space-y-4">
          {/* Add form */}
          <div className="p-3 rounded-lg bg-slate-50 space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Add New</p>
            <div className="flex gap-2">
              <Input
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                placeholder="e.g., Pet Care"
                size="sm"
                wrapperClassName="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Select
                value={newCat.type}
                onChange={(e) => setNewCat({ ...newCat, type: e.target.value })}
                options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]}
                placeholder=""
                size="sm"
                wrapperClassName="w-28"
              />
              <Button variant="primary" size="sm" onClick={handleAdd}>Add</Button>
            </div>
          </div>

          {/* List */}
          {customCategories.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No custom categories yet. Add one above.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {customCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-700">{cat.name}</span>
                    <Badge variant={(cat.type || 'expense') === 'expense' ? 'danger' : 'success'} size="sm">{cat.type || 'expense'}</Badge>
                  </div>
                  <button onClick={() => handleRemove(cat.id)} className="text-slate-400 hover:text-danger-500 cursor-pointer p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

function DataManagement({ state, dispatch }) {
  const handleExport = () => {
    const blob = exportToJson(state)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `moneytracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported successfully')
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      dispatch({ type: 'IMPORT_DATA', payload: data })
      toast.success('Data imported successfully')
    } catch (err) {
      toast.error('Failed to import data. Invalid file format.')
    }
    e.target.value = ''
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Data Management</h3>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
          Export JSON
        </Button>
        <label>
          <Button variant="outline" size="sm" icon={Upload} as="span" className="cursor-pointer">
            Import JSON
          </Button>
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>
    </Card>
  )
}

function GoogleDriveSection({ settings, state, dispatch }) {
  const [clientId, setClientId] = useState(getStoredClientId() || '')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showClientId, setShowClientId] = useState(!getStoredClientId())

  const handleConnect = async () => {
    if (!clientId.trim()) {
      toast.error('Please enter a Google Client ID first')
      return
    }
    setLoading(true)
    try {
      setClientIdFn(clientId.trim())
      await initGoogleApi()
      await signIn()
      setConnected(true)
      dispatch({ type: 'UPDATE_SETTINGS', payload: { autoSyncEnabled: true } })
      toast.success('Connected to Google Drive')
    } catch (err) {
      console.error('Google Drive connect error:', err)
      toast.error(err?.message || 'Failed to connect to Google Drive')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    signOut()
    setConnected(false)
    dispatch({ type: 'UPDATE_SETTINGS', payload: { autoSyncEnabled: false } })
    toast.success('Disconnected from Google Drive')
  }

  const handleSyncNow = async () => {
    setLoading(true)
    try {
      await saveToGoogleDrive(state)
      toast.success('Data synced to Google Drive')
    } catch (err) {
      toast.error(err?.message || 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    setLoading(true)
    try {
      const result = await loadFromGoogleDrive()
      if (!result) {
        toast.error('No backup found on Google Drive')
        return
      }
      dispatch({ type: 'IMPORT_DATA', payload: result.data })
      toast.success(`Restored from backup (${new Date(result.modifiedTime).toLocaleDateString()})`)
    } catch (err) {
      toast.error(err?.message || 'Restore failed')
    } finally {
      setLoading(false)
    }
  }

  const isConnected = connected || (settings?.autoSyncEnabled && isSignedInFn())

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Cloud className="w-5 h-5 text-primary-500" />
        <h3 className="text-sm font-semibold text-slate-900">Google Drive Sync</h3>
      </div>
      <p className="text-sm text-slate-500 mb-3">
        {isConnected
          ? 'Connected. Your data can be backed up to Google Drive.'
          : 'Connect Google Drive to automatically back up your data.'}
      </p>

      {/* Client ID config */}
      {!isConnected && (
        <div className="mb-3">
          {showClientId ? (
            <div className="space-y-2">
              <Input
                label="Google OAuth Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="123456789-abc.apps.googleusercontent.com"
                size="sm"
              />
              <p className="text-xs text-slate-400">
                Create credentials at{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowClientId(true)}
              className="text-xs text-primary-500 hover:text-primary-600 underline cursor-pointer"
            >
              Change Client ID
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {isConnected ? (
          <>
            <Button variant="outline" size="sm" icon={Upload} onClick={handleSyncNow} loading={loading}>
              Sync Now
            </Button>
            <Button variant="outline" size="sm" icon={Download} onClick={handleRestore} loading={loading}>
              Restore
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button variant="primary" size="sm" icon={Cloud} onClick={handleConnect} loading={loading}>
            Connect Google Drive
          </Button>
        )}
      </div>
    </Card>
  )
}

function DangerZone({ dispatch }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClear = () => {
    dispatch({ type: 'CLEAR_ALL' })
    setShowConfirm(false)
    toast.success('All data cleared')
  }

  return (
    <Card className="border-danger-200">
      <h3 className="text-sm font-semibold text-danger-600 mb-2">Danger Zone</h3>
      <p className="text-sm text-slate-500 mb-3">
        This will permanently delete all your data including expenses, income, budgets, and goals.
      </p>
      <Button variant="danger" size="sm" icon={Trash2} onClick={() => setShowConfirm(true)}>
        Clear All Data
      </Button>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Clear All Data?" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          This action cannot be undone. All your financial data will be permanently deleted.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleClear}>Yes, Clear Everything</Button>
        </div>
      </Modal>
    </Card>
  )
}
