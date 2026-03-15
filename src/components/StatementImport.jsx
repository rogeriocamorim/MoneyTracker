import { useState, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FileUp, Upload, FileSpreadsheet, Check, AlertTriangle,
  ArrowRight, ArrowLeft, Loader2, CheckCircle2, XCircle,
  CreditCard, Landmark, ArrowDownCircle, ArrowUpCircle,
  CheckSquare, Square, MinusSquare, Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, incomeSources, getAllCategories } from '../data/categories'
import { parseBankStatement, findDuplicates } from '../utils/pdfParser'

// ─── Step 1: Upload ─────────────────────────────────────────────────────────

function UploadStep({ onFileProcessed, isProcessing, setIsProcessing }) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    setError(null)
    setIsProcessing(true)

    try {
      const result = await parseBankStatement(file)

      if (result.transactions.length === 0) {
        setError('No transactions found in this PDF. The format may not be recognized. Try a CIBC checking or credit card statement.')
        setIsProcessing(false)
        return
      }

      onFileProcessed(result, file.name)
    } catch (err) {
      console.error('PDF parsing error:', err)
      setError(`Failed to parse PDF: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }, [onFileProcessed, setIsProcessing])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet className="w-8 h-8 text-[var(--color-accent)]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Import Bank Statement</h2>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
          Upload a PDF from CIBC Checking, CIBC Visa, or Costco Mastercard
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200"
        style={{
          borderColor: dragOver ? 'var(--color-accent)' : 'var(--color-border)',
          background: dragOver ? 'var(--color-accent-light)' : 'var(--color-bg-muted)',
        }}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-[var(--color-accent)] animate-spin" />
            <p className="text-[14px] text-[var(--color-text-muted)]">Reading PDF...</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-[14px] text-[var(--color-text-primary)] font-medium">
              Drop your PDF here or click to browse
            </p>
            <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
              Supports CIBC Checking, CIBC Visa, Costco Mastercard
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-red-500">{error}</p>
        </div>
      )}

      {/* Supported formats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { icon: Landmark, label: 'CIBC Checking', color: '#6366f1' },
          { icon: CreditCard, label: 'CIBC Visa', color: '#4f46e5' },
          { icon: CreditCard, label: 'Costco MC', color: '#e11d48' },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 p-3 rounded-xl"
            style={{ background: 'var(--color-bg-muted)' }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
            <span className="text-[11px] text-[var(--color-text-muted)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Review & Classify ──────────────────────────────────────────────

function ReviewStep({ transactions, duplicateIndices, statementType, allCategories, dateFrom, dateTo, onDateFromChange, onDateToChange, onUpdateTransaction, onToggleSelected, onSelectAll, onDeselectDuplicates }) {
  // Compute min/max dates from all transactions for input bounds
  const { minDate, maxDate } = useMemo(() => {
    const dates = transactions.map(t => t.date).filter(Boolean).sort()
    return { minDate: dates[0] || '', maxDate: dates[dates.length - 1] || '' }
  }, [transactions])

  // Filter transactions by date range
  const filteredEntries = useMemo(() => {
    return transactions.map((t, idx) => ({ transaction: t, originalIndex: idx }))
      .filter(({ transaction }) => {
        if (dateFrom && transaction.date < dateFrom) return false
        if (dateTo && transaction.date > dateTo) return false
        return true
      })
  }, [transactions, dateFrom, dateTo])

  // Map duplicate indices to filtered set
  const filteredDuplicateCount = useMemo(() => {
    return filteredEntries.filter(({ originalIndex }) => duplicateIndices.has(originalIndex)).length
  }, [filteredEntries, duplicateIndices])

  const filteredTotal = filteredEntries.length
  const filteredSelectedCount = filteredEntries.filter(({ transaction }) => transaction.selected).length
  const totalCount = transactions.length

  const allFilteredSelected = filteredTotal > 0 && filteredSelectedCount === filteredTotal
  const noneFilteredSelected = filteredSelectedCount === 0
  const someFilteredSelected = !allFilteredSelected && !noneFilteredSelected

  return (
    <div className="flex flex-col" style={{ maxHeight: '70vh' }}>
      {/* Header info */}
      <div className="p-4 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
            style={{ background: 'var(--color-accent)/10', color: 'var(--color-accent)', border: '1px solid var(--color-accent)' }}
          >
            {statementType.label}
          </div>
          <span className="text-[13px] text-[var(--color-text-muted)]">
            {filteredTotal === totalCount
              ? `${totalCount} transactions`
              : `${filteredTotal} of ${totalCount} transactions`}
          </span>
          {filteredDuplicateCount > 0 && (
            <span className="text-[12px] text-amber-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {filteredDuplicateCount} possible duplicates
            </span>
          )}
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Date range:</span>
          </div>
          <input
            type="date"
            className="input text-[12px] py-1 px-2"
            value={dateFrom}
            min={minDate}
            max={dateTo || maxDate}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
          <span className="text-[12px] text-[var(--color-text-muted)]">to</span>
          <input
            type="date"
            className="input text-[12px] py-1 px-2"
            value={dateTo}
            min={dateFrom || minDate}
            max={maxDate}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => onSelectAll(filteredEntries.map(e => e.originalIndex))}
            className="flex items-center gap-1.5 text-[12px] text-[var(--color-accent)] hover:underline"
          >
            {allFilteredSelected ? <CheckSquare className="w-3.5 h-3.5" /> : someFilteredSelected ? <MinusSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            {allFilteredSelected ? 'Deselect All' : 'Select All'}
          </button>
          {filteredDuplicateCount > 0 && (
            <button
              onClick={() => onDeselectDuplicates(filteredEntries.map(e => e.originalIndex))}
              className="flex items-center gap-1.5 text-[12px] text-amber-500 hover:underline"
            >
              <XCircle className="w-3.5 h-3.5" />
              Deselect Duplicates
            </button>
          )}
          <span className="text-[12px] text-[var(--color-text-muted)] ml-auto">
            {filteredSelectedCount} of {filteredTotal} selected
          </span>
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-2">
        {filteredEntries.map(({ transaction, originalIndex }) => (
          <TransactionRow
            key={originalIndex}
            transaction={transaction}
            index={originalIndex}
            isDuplicate={duplicateIndices.has(originalIndex)}
            allCategories={allCategories}
            onToggleSelected={() => onToggleSelected(originalIndex)}
            onUpdate={(field, value) => onUpdateTransaction(originalIndex, field, value)}
          />
        ))}
        {filteredTotal === 0 && (
          <div className="text-center py-8">
            <p className="text-[13px] text-[var(--color-text-muted)]">No transactions in this date range</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TransactionRow({ transaction, index, isDuplicate, allCategories, onToggleSelected, onUpdate }) {
  const { selected, date, description, amount, type, category, source } = transaction

  return (
    <div
      className="rounded-xl p-3 transition-all duration-150"
      style={{
        background: selected ? 'var(--color-bg-elevated)' : 'var(--color-bg-muted)',
        opacity: selected ? 1 : 0.5,
        border: `1px solid ${isDuplicate ? 'var(--color-warning, #f59e0b)' : 'var(--color-border)'}`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button onClick={onToggleSelected} className="mt-1 shrink-0">
          {selected ? (
            <CheckCircle2 className="w-5 h-5 text-[var(--color-accent)]" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'var(--color-border)' }} />
          )}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top row: date, description, amount */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] text-[var(--color-text-muted)] shrink-0">{date}</span>
            <span className="text-[13px] text-[var(--color-text-primary)] truncate flex-1 font-medium">
              {description}
            </span>
            <span
              className="text-[14px] font-semibold font-mono shrink-0"
              style={{ color: type === 'debit' ? 'var(--color-danger)' : 'var(--color-success)' }}
            >
              {type === 'debit' ? '-' : '+'}${amount.toFixed(2)}
            </span>
          </div>

          {/* Bottom row: type toggle + category */}
          <div className="flex items-center gap-2">
            {/* Type toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              <button
                onClick={() => onUpdate('type', 'debit')}
                className="flex items-center gap-1 px-2 py-1 text-[11px] transition-colors"
                style={{
                  background: type === 'debit' ? 'var(--color-danger)' : 'transparent',
                  color: type === 'debit' ? 'white' : 'var(--color-text-muted)',
                }}
              >
                <ArrowDownCircle className="w-3 h-3" />
                Expense
              </button>
              <button
                onClick={() => onUpdate('type', 'credit')}
                className="flex items-center gap-1 px-2 py-1 text-[11px] transition-colors"
                style={{
                  background: type === 'credit' ? 'var(--color-success)' : 'transparent',
                  color: type === 'credit' ? 'white' : 'var(--color-text-muted)',
                }}
              >
                <ArrowUpCircle className="w-3 h-3" />
                Income
              </button>
            </div>

            {/* Category / Source dropdown */}
            {type === 'debit' ? (
              <select
                value={category || 'other'}
                onChange={(e) => onUpdate('category', e.target.value)}
                className="text-[11px] py-1 px-2 rounded-lg bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex-1 min-w-0"
              >
                {allCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            ) : (
              <select
                value={source || 'other'}
                onChange={(e) => onUpdate('source', e.target.value)}
                className="text-[11px] py-1 px-2 rounded-lg bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex-1 min-w-0"
              >
                {incomeSources.map(src => (
                  <option key={src.id} value={src.id}>{src.name}</option>
                ))}
              </select>
            )}

            {/* Duplicate badge */}
            {isDuplicate && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                Duplicate?
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Confirm ────────────────────────────────────────────────────────

function ConfirmStep({ transactions, statementType, dateFrom, dateTo }) {
  const selected = transactions.filter(t => {
    if (!t.selected) return false
    if (dateFrom && t.date < dateFrom) return false
    if (dateTo && t.date > dateTo) return false
    return true
  })
  const expenses = selected.filter(t => t.type === 'debit')
  const income = selected.filter(t => t.type === 'credit')
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Ready to Import</h3>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
          From {statementType.label}
        </p>
      </div>

      <div className="space-y-3">
        {/* Expenses summary */}
        {expenses.length > 0 && (
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-[var(--color-danger)]" />
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {expenses.length} Expense{expenses.length !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-[16px] font-bold font-mono text-[var(--color-danger)]">
                -${totalExpenses.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Income summary */}
        {income.length > 0 && (
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-muted)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-[var(--color-success)]" />
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {income.length} Income Record{income.length !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-[16px] font-bold font-mono text-[var(--color-success)]">
                +${totalIncome.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {selected.length === 0 && (
          <div className="p-4 rounded-xl text-center" style={{ background: 'var(--color-bg-muted)' }}>
            <p className="text-[14px] text-[var(--color-text-muted)]">No transactions selected</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main StatementImport Component ─────────────────────────────────────────

export default function StatementImport({ onClose }) {
  const { state, bulkAddExpenses, bulkAddIncome } = useMoney()
  const allCategories = getAllCategories(state.customCategories)

  const [step, setStep] = useState(1) // 1=Upload, 2=Review, 3=Confirm
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState('')
  const [statementType, setStatementType] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [duplicateIndices, setDuplicateIndices] = useState(new Set())
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Handle parsed PDF result
  const handleFileProcessed = useCallback((result, name) => {
    setFileName(name)
    setStatementType(result.statementType)

    // Find duplicates
    const dupes = findDuplicates(result.transactions, state.expenses, state.income)
    setDuplicateIndices(dupes)

    // Compute date range from transactions
    const dates = result.transactions.map(t => t.date).sort()
    if (dates.length > 0) {
      setDateFrom(dates[0])
      setDateTo(dates[dates.length - 1])
    }

    // Prepare transactions with UI state
    const prepared = result.transactions.map((t, idx) => ({
      ...t,
      selected: !dupes.has(idx), // Pre-deselect duplicates
      category: t.type === 'debit' ? 'other' : undefined,
      source: t.type === 'credit' ? 'other' : undefined,
    }))

    setTransactions(prepared)
    setStep(2)
  }, [state.expenses, state.income])

  // Update a single transaction field
  const handleUpdateTransaction = useCallback((index, field, value) => {
    setTransactions(prev => prev.map((t, i) => {
      if (i !== index) return t

      // When switching type, set defaults for category/source
      if (field === 'type') {
        return {
          ...t,
          type: value,
          category: value === 'debit' ? (t.category || 'other') : undefined,
          source: value === 'credit' ? (t.source || 'other') : undefined,
        }
      }

      return { ...t, [field]: value }
    }))
  }, [])

  // Toggle selection
  const handleToggleSelected = useCallback((index) => {
    setTransactions(prev => prev.map((t, i) =>
      i === index ? { ...t, selected: !t.selected } : t
    ))
  }, [])

  // Select/Deselect all (scoped to provided indices)
  const handleSelectAll = useCallback((indices) => {
    const targetSet = new Set(indices)
    const allSelected = indices.every(i => transactions[i]?.selected)
    setTransactions(prev => prev.map((t, i) =>
      targetSet.has(i) ? { ...t, selected: !allSelected } : t
    ))
  }, [transactions])

  // Deselect duplicates (scoped to provided indices)
  const handleDeselectDuplicates = useCallback((indices) => {
    const targetSet = new Set(indices)
    setTransactions(prev => prev.map((t, i) => ({
      ...t,
      selected: (targetSet.has(i) && duplicateIndices.has(i)) ? false : t.selected,
    })))
  }, [duplicateIndices])

  // Import the selected transactions (filtered by date range)
  const handleImport = useCallback(() => {
    const selected = transactions.filter(t => {
      if (!t.selected) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      return true
    })

    const expenses = selected
      .filter(t => t.type === 'debit')
      .map(t => ({
        date: t.date,
        amount: t.amount,
        category: t.category || 'other',
        description: t.description,
        paymentMethod: t.paymentMethod,
      }))

    const income = selected
      .filter(t => t.type === 'credit')
      .map(t => ({
        date: t.date,
        amount: t.amount,
        source: t.source || 'other',
        notes: t.description,
      }))

    if (expenses.length > 0) bulkAddExpenses(expenses)
    if (income.length > 0) bulkAddIncome(income)

    const parts = []
    if (expenses.length > 0) parts.push(`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`)
    if (income.length > 0) parts.push(`${income.length} income record${income.length !== 1 ? 's' : ''}`)

    toast.success(`Imported ${parts.join(' and ')}`)
    onClose()
  }, [transactions, dateFrom, dateTo, bulkAddExpenses, bulkAddIncome, onClose])

  const selectedCount = useMemo(() => {
    return transactions.filter(t => {
      if (!t.selected) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      return true
    }).length
  }, [transactions, dateFrom, dateTo])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="card w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar with steps + close */}
          <div className="flex items-center justify-between p-4 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {/* Step indicators */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors"
                    style={{
                      background: step >= s ? 'var(--color-accent)' : 'var(--color-bg-muted)',
                      color: step >= s ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                  </div>
                  <span className="text-[12px] text-[var(--color-text-muted)] hidden sm:inline">
                    {s === 1 ? 'Upload' : s === 2 ? 'Review' : 'Import'}
                  </span>
                  {s < 3 && <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)] mx-1" />}
                </div>
              ))}
            </div>

            <button onClick={onClose} className="btn btn-ghost p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {step === 1 && (
              <UploadStep
                onFileProcessed={handleFileProcessed}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            )}
            {step === 2 && (
              <ReviewStep
                transactions={transactions}
                duplicateIndices={duplicateIndices}
                statementType={statementType}
                allCategories={allCategories}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onUpdateTransaction={handleUpdateTransaction}
                onToggleSelected={handleToggleSelected}
                onSelectAll={handleSelectAll}
                onDeselectDuplicates={handleDeselectDuplicates}
              />
            )}
            {step === 3 && (
              <ConfirmStep
                transactions={transactions}
                statementType={statementType}
                dateFrom={dateFrom}
                dateTo={dateTo}
              />
            )}
          </div>

          {/* Footer with navigation */}
          {step > 1 && (
            <div className="flex items-center justify-between p-4 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={() => setStep(s => s - 1)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedCount === 0}
                  className="btn btn-primary flex items-center gap-2"
                >
                  Review ({selectedCount})
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <FileUp className="w-4 h-4" />
                  Import {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
