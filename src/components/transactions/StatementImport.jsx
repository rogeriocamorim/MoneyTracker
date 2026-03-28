import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Upload, FileText, AlertTriangle, CheckCircle2, Loader2,
  ChevronLeft, ChevronRight, X, Copy, ArrowDownToLine,
} from 'lucide-react'
import { useMoney } from '@/context/MoneyContext'
import { Button, Modal, Badge, SearchSelect } from '@/components/ui'
import { expenseCategories, incomeSources } from '@/data/categories'
import { formatCurrency } from '@/utils/calculations'
import { parseCIBCStatement } from '@/utils/statementParser'
import {
  getMerchantCategory,
  saveMerchantCategories,
} from '@/utils/merchantCategoryMap'

const STEPS = ['Upload', 'Review', 'Done']

/**
 * Check if a parsed transaction already exists in the current data.
 * Match: same date + amount within $0.01 + similar description substring.
 */
function isDuplicate(tx, existingExpenses, existingIncome) {
  const pool = tx.type === 'income' ? existingIncome : existingExpenses
  return pool.some((existing) => {
    if (existing.date !== tx.date) return false
    if (Math.abs(existing.amount - tx.amount) > 0.01) return false
    // Fuzzy description match (first 10 chars or contained)
    const a = (existing.description || '').toLowerCase().slice(0, 15)
    const b = (tx.description || '').toLowerCase().slice(0, 15)
    return a === b || a.includes(b) || b.includes(a)
  })
}

export default function StatementImport({ open, onClose }) {
  const { state, bulkAddExpenses, bulkAddIncome, addCustomCategory } = useMoney()
  const { expenses, income, settings, customCategories } = state
  const currency = settings?.currencySymbol || '$'

  const [step, setStep] = useState(0)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [rows, setRows] = useState([]) // { ...tx, selected, duplicate, category }
  const [importResult, setImportResult] = useState(null)

  const fileRef = useRef(null)

  // Category options for expense rows (predefined + custom)
  const expenseCategoryOptions = useMemo(() => [
    ...expenseCategories.map((c) => ({ value: c.id, label: c.name })),
    ...(customCategories || []).filter((c) => c.type === 'expense').map((c) => ({ value: c.id, label: c.name })),
  ], [customCategories])

  // Category options for income rows (predefined + custom)
  const incomeSourceOptions = useMemo(() => [
    ...incomeSources.map((s) => ({ value: s.id, label: s.name })),
    ...(customCategories || []).filter((c) => c.type === 'income').map((c) => ({ value: c.id, label: c.name })),
  ], [customCategories])

  const reset = useCallback(() => {
    setStep(0)
    setParsing(false)
    setError(null)
    setFileName('')
    setParsedData(null)
    setRows([])
    setImportResult(null)
  }, [])

  const handleClose = () => {
    reset()
    onClose()
  }

  // ── Step 0: File upload ──────────────────────────
  const handleFile = async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file.')
      return
    }

    setError(null)
    setFileName(file.name)
    setParsing(true)

    try {
      const result = await parseCIBCStatement(file)

      if (result.transactions.length === 0) {
        setError('No transactions found in this PDF. Make sure it\'s a CIBC statement (chequing or credit card) printed from online banking.')
        setParsing(false)
        return
      }

      setParsedData(result)

      // Build rows with duplicate detection + auto-category
      const enrichedRows = result.transactions.map((tx, idx) => {
        const dup = isDuplicate(tx, expenses, income)
        const autoCategory =
          getMerchantCategory(tx.rawDescription) ||
          getMerchantCategory(tx.description) ||
          null

        return {
          ...tx,
          _idx: idx,
          selected: !dup, // uncheck duplicates by default
          duplicate: dup,
          category: autoCategory || (tx.type === 'income' ? 'salary' : ''),
        }
      })

      setRows(enrichedRows)
      setParsing(false)
      setStep(1)
    } catch (err) {
      console.error('PDF parse error:', err)
      setError(`Failed to parse PDF: ${err.message}`)
      setParsing(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e) => e.preventDefault()

  // ── Step 1: Review ──────────────────────────────
  const toggleRow = (idx) => {
    setRows((prev) => prev.map((r) =>
      r._idx === idx ? { ...r, selected: !r.selected } : r
    ))
  }

  const toggleAll = () => {
    const allSelected = rows.every((r) => r.selected)
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })))
  }

  const updateRowCategory = (idx, categoryId) => {
    setRows((prev) => prev.map((r) =>
      r._idx === idx ? { ...r, category: categoryId } : r
    ))
  }

  const handleCreateCategory = useCallback((type) => (name) => {
    const id = `custom_${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`
    addCustomCategory({ id, name, type })
    return { value: id, label: name }
  }, [addCustomCategory])

  const selectedRows = rows.filter((r) => r.selected)
  const selectedExpenses = selectedRows.filter((r) => r.type === 'expense')
  const selectedIncome = selectedRows.filter((r) => r.type === 'income')
  const totalExpenseAmount = selectedExpenses.reduce((s, r) => s + r.amount, 0)
  const totalIncomeAmount = selectedIncome.reduce((s, r) => s + r.amount, 0)

  // ── Step 2: Import ─────────────────────────────
  const handleImport = () => {
    const expensesToAdd = selectedExpenses.map((r) => ({
      date: r.date,
      amount: r.amount,
      category: r.category || 'other',
      description: r.description,
      paymentMethod: r.paymentMethod,
      notes: `Imported from ${fileName}`,
    }))

    const incomeToAdd = selectedIncome.map((r) => ({
      date: r.date,
      amount: r.amount,
      source: r.category || 'other',
      description: r.description,
      notes: `Imported from ${fileName}`,
    }))

    if (expensesToAdd.length > 0) bulkAddExpenses(expensesToAdd)
    if (incomeToAdd.length > 0) bulkAddIncome(incomeToAdd)

    // Learn merchant→category from user selections
    const merchantPairs = selectedRows
      .filter((r) => r.category)
      .map((r) => ({ name: r.rawDescription || r.description, categoryId: r.category }))
    saveMerchantCategories(merchantPairs)

    setImportResult({
      expenses: expensesToAdd.length,
      income: incomeToAdd.length,
      total: expensesToAdd.length + incomeToAdd.length,
    })
    setStep(2)
  }

  // ── Render ─────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Bank Statement"
      size="xl"
      closeOnBackdrop={step !== 1}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`
              w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
              ${idx < step ? 'bg-success-100 text-success-700' :
                idx === step ? 'bg-primary-100 text-primary-700' :
                'bg-slate-100 text-slate-400'}
            `}>
              {idx < step ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
            </div>
            <span className={`text-sm ${idx === step ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
              {label}
            </span>
            {idx < STEPS.length - 1 && (
              <div className="w-8 h-px bg-slate-200 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Upload ── */}
      {step === 0 && (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
              transition-colors hover:border-primary-400 hover:bg-primary-50/50
              ${parsing ? 'border-primary-300 bg-primary-50/30' : 'border-slate-200'}
            `}
          >
            {parsing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-sm text-slate-600">Parsing <span className="font-medium">{fileName}</span>...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-slate-300" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Drop your CIBC statement PDF here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    or click to browse — supports chequing &amp; credit card statements
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-danger-50 text-danger-700 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Supports CIBC Chequing, Visa, and Mastercard statements. Log into CIBC Online Banking, 
            go to Account Details, and use your browser's Print &rarr; Save as PDF.
          </p>
        </div>
      )}

      {/* ── Step 1: Review ── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="default">
              {parsedData?.accountInfo || 'CIBC Statement'}
            </Badge>
            {parsedData?.dateRange && (
              <span className="text-slate-500">{parsedData.dateRange}</span>
            )}
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">
              {rows.length} transactions found
            </span>
            {rows.some((r) => r.duplicate) && (
              <Badge variant="warning">
                {rows.filter((r) => r.duplicate).length} possible duplicates
              </Badge>
            )}
          </div>

          {/* Selection summary */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
            <span>{selectedRows.length} of {rows.length} selected</span>
            <span className="text-danger-600 font-medium">
              Expenses: {selectedExpenses.length} ({formatCurrency(totalExpenseAmount, currency)})
            </span>
            <span className="text-success-600 font-medium">
              Income: {selectedIncome.length} ({formatCurrency(totalIncomeAmount, currency)})
            </span>
          </div>

          {/* Table */}
          <div className="max-h-[400px] overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left w-8">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every((r) => r.selected)}
                      onChange={toggleAll}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-44">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr
                    key={row._idx}
                    className={`
                      ${!row.selected ? 'opacity-50 bg-slate-50' : ''}
                      ${row.duplicate ? 'bg-amber-50/50' : ''}
                      hover:bg-slate-50/80
                    `}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => toggleRow(row._idx)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-600 font-number whitespace-nowrap text-xs">
                      {row.date}
                    </td>
                    <td className="px-3 py-2 text-slate-900 max-w-[250px]">
                      <div className="truncate" title={row.rawDescription}>
                        {row.description}
                      </div>
                      {row.duplicate && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-0.5">
                          <Copy className="w-3 h-3" /> Possible duplicate
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`
                        text-xs font-medium px-2 py-0.5 rounded-full
                        ${row.type === 'income'
                          ? 'bg-success-50 text-success-700'
                          : 'bg-danger-50 text-danger-700'}
                      `}>
                        {row.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-right font-number font-medium whitespace-nowrap
                      ${row.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}>
                      {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount, currency)}
                    </td>
                    <td className="px-3 py-2">
                      <SearchSelect
                        compact
                        value={row.category}
                        onChange={(e) => updateRowCategory(row._idx, e.target.value)}
                        options={row.type === 'income' ? incomeSourceOptions : expenseCategoryOptions}
                        placeholder="Select..."
                        searchPlaceholder="Search categories..."
                        onCreateOption={handleCreateCategory(row.type === 'income' ? 'income' : 'expense')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => { reset(); }}>
              Start Over
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ArrowDownToLine}
              onClick={handleImport}
              disabled={selectedRows.length === 0}
            >
              Import {selectedRows.length} Transaction{selectedRows.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Done ── */}
      {step === 2 && importResult && (
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Import Complete</h3>
            <p className="text-sm text-slate-500 mt-1">
              Successfully imported {importResult.total} transaction{importResult.total !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            {importResult.expenses > 0 && (
              <span className="text-danger-600 font-medium">
                {importResult.expenses} expense{importResult.expenses !== 1 ? 's' : ''}
              </span>
            )}
            {importResult.income > 0 && (
              <span className="text-success-600 font-medium">
                {importResult.income} income entr{importResult.income !== 1 ? 'ies' : 'y'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 max-w-sm">
            Category assignments have been saved. Future imports with the same merchants
            will auto-suggest these categories.
          </p>
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  )
}
