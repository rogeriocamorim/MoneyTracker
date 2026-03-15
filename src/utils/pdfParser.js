import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Setup pdf.js worker - use local worker file via Vite's ?url import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// ─── Statement type detection ───────────────────────────────────────────────

const STATEMENT_TYPES = {
  CIBC_CHECKING: {
    id: 'cibc_checking',
    label: 'CIBC Checking Account',
    paymentMethod: 'bank',
  },
  CIBC_VISA: {
    id: 'cibc_visa',
    label: 'CIBC Visa Credit Card',
    paymentMethod: 'visa',
  },
  COSTCO_MASTERCARD: {
    id: 'costco_mastercard',
    label: 'Costco Mastercard',
    paymentMethod: 'mastercard',
  },
  UNKNOWN: {
    id: 'unknown',
    label: 'Unknown Statement',
    paymentMethod: 'bank',
  },
}

function detectStatementType(fullText) {
  const text = fullText.toLowerCase()

  // Costco Mastercard (check first - it also contains "CIBC" sometimes)
  if (text.includes('costco') && (text.includes('mastercard') || text.includes('master card'))) {
    return STATEMENT_TYPES.COSTCO_MASTERCARD
  }

  // CIBC Visa / Aventura
  if (text.includes('cibc') && (text.includes('visa') || text.includes('aventura'))) {
    return STATEMENT_TYPES.CIBC_VISA
  }

  // CIBC Checking / Chequing
  if (text.includes('cibc') && (text.includes('cheq') || text.includes('check') || text.includes('chequing') || text.includes('checking') || text.includes('personal account') || text.includes('banking account'))) {
    return STATEMENT_TYPES.CIBC_CHECKING
  }

  // Fallback: if CIBC appears, try to guess from context
  if (text.includes('cibc')) {
    // If it has "credit" or "card" keywords, likely a credit card
    if (text.includes('credit') || text.includes('card statement')) {
      return STATEMENT_TYPES.CIBC_VISA
    }
    // Default CIBC to checking
    return STATEMENT_TYPES.CIBC_CHECKING
  }

  return STATEMENT_TYPES.UNKNOWN
}

// ─── PDF text extraction ────────────────────────────────────────────────────

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Group text items by Y position to reconstruct rows
    const items = content.items.map(item => ({
      text: item.str,
      x: Math.round(item.transform[4]),
      y: Math.round(item.transform[5]),
      width: item.width,
    }))

    pages.push(items)
  }

  return pages
}

function reconstructLines(pageItems) {
  // Group items by Y coordinate (same row), with a tolerance of 3px
  const rows = {}
  for (const item of pageItems) {
    const yKey = Math.round(item.y / 3) * 3 // bucket by 3px
    if (!rows[yKey]) rows[yKey] = []
    rows[yKey].push(item)
  }

  // Sort rows top to bottom (highest Y first in PDF coords)
  const sortedYKeys = Object.keys(rows)
    .map(Number)
    .sort((a, b) => b - a)

  const lines = []
  for (const yKey of sortedYKeys) {
    // Sort items left to right within each row
    const rowItems = rows[yKey].sort((a, b) => a.x - b.x)
    const lineText = rowItems.map(i => i.text).join(' ').trim()
    if (lineText) {
      lines.push({ text: lineText, items: rowItems })
    }
  }

  return lines
}

// ─── CIBC Checking parser ───────────────────────────────────────────────────
// Handles print-to-PDF from CIBC Online Banking "Deposit Account Details" page.
// Transactions are multi-line: date, description, amounts may span 2-4 lines.
// Uses a state machine that collects lines between date markers.
// Debit/Credit classification uses x-coordinate column positions from the PDF.

// Month abbreviations used by CIBC
const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04',
  may: '05', jun: '06', jul: '07', aug: '08',
  sep: '09', oct: '10', nov: '11', dec: '12',
}

function parseStatementYear(fullText) {
  // Try to find statement period year, e.g. "February 15, 2026 to March 20, 2026"
  const yearMatch = fullText.match(/20[2-3]\d/g)
  if (yearMatch && yearMatch.length > 0) {
    return Math.max(...yearMatch.map(Number))
  }
  return new Date().getFullYear()
}

function parseAmount(text) {
  if (!text) return null
  // Remove $ sign, commas, spaces, and handle negative with dash or parentheses
  let cleaned = text.replace(/[$,\s]/g, '')
  let negative = false
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = cleaned.slice(1, -1)
    negative = true
  }
  if (cleaned.startsWith('-')) {
    cleaned = cleaned.slice(1)
    negative = true
  }
  const num = parseFloat(cleaned)
  if (isNaN(num)) return null
  return negative ? -num : num
}

// Match date like "Mar 16," or "Mar 16, 2026" or "Mar 9, 2026"
const DATE_PATTERN = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s*(\d{4})?\b/i

// Match dollar amounts like "$4,626.26" or "$440.09"
const DOLLAR_PATTERN = /\$[\d,]+\.\d{2}/g

// Known type prefixes/suffixes in CIBC descriptions — removed from description
const TYPE_PHRASES = [
  'Electronic Funds Transfer',
  'Internet Banking',
  'Interac e-Transfer',
  'Point of Sale',
  'Miscellaneous Payment',
  'Preauthorized Debit',
  'Preauthorized Credit',
  'Branch Transaction',
  'ATM Withdrawal',
  'ATM Deposit',
  'Service Charge',
  'E-TRANSFER',
  'INTERNET',
  'PREAUTHORIZED DEBIT',
  'PREAUTHORIZED CREDIT',
  'Deposit',
  'DEPOSIT',
]

// Footer/boilerplate text patterns to filter from descriptions
const FOOTER_PATTERNS = [
  /personal account service fees/i,
  /personal banking services/i,
  /conversion fees?/i,
  /monthly plan fee/i,
  /service fees are calculated/i,
  /for more information/i,
  /cibc\.com/i,
  /effective date/i,
  /all transactions/i,
  /unlimited debit transactions/i,
  /e-transfers received/i,
  /free cheques written/i,
  /free transactions/i,
  /foreign currency conversion/i,
  /cibc banking centre/i,
  /cibc smart account/i,
  /administration fee/i,
  /non-sufficient fund/i,
  /paper statement/i,
  /following business day/i,
  /service charges and account fees/i,
  /for a description of transactions/i,
  /for questions about/i,
  /transactions from today/i,
  /●/,
]

/**
 * Detect column x-positions from the "DATE DEBIT CREDIT RUNNING BALANCE" header line.
 * Returns { debitX, creditX, balanceX } or null if header not found.
 */
function detectColumnPositions(allLines) {
  for (const line of allLines) {
    if (/^DATE\s+DEBIT/i.test(line.text)) {
      const positions = { debitX: null, creditX: null, balanceX: null }
      for (const item of line.items) {
        const text = item.text.trim().toUpperCase()
        if (text === 'DEBIT') positions.debitX = item.x
        else if (text === 'CREDIT') positions.creditX = item.x
        else if (text === 'RUNNING' || text === 'BALANCE') {
          // Use the first occurrence (RUNNING comes before BALANCE)
          if (positions.balanceX === null) positions.balanceX = item.x
        }
      }
      if (positions.debitX !== null && positions.creditX !== null) {
        return positions
      }
    }
  }
  return null
}

/**
 * Classify a dollar amount item as 'debit', 'credit', or 'balance' based on
 * its x-coordinate relative to the detected column positions.
 */
function classifyAmountByColumn(itemX, columns) {
  if (!columns) return 'unknown'

  // Calculate distances to each column
  const distDebit = Math.abs(itemX - columns.debitX)
  const distCredit = Math.abs(itemX - columns.creditX)
  const distBalance = columns.balanceX !== null ? Math.abs(itemX - columns.balanceX) : Infinity

  const minDist = Math.min(distDebit, distCredit, distBalance)

  if (minDist === distBalance) return 'balance'
  if (minDist === distDebit) return 'debit'
  return 'credit'
}

/**
 * Clean a raw transaction description:
 * - Remove leading/trailing commas and whitespace
 * - Remove type phrases (Electronic Funds Transfer, Internet Banking, etc.) from anywhere
 * - Remove footer boilerplate
 * - Remove CIBC channel codes
 * - Normalize whitespace
 */
function cleanDescription(raw) {
  let desc = raw

  // Remove leading commas (from date removal leaving ", Description")
  desc = desc.replace(/^[,\s]+/, '')

  // Remove trailing commas
  desc = desc.replace(/[,\s]+$/, '')

  // Remove known type phrases from anywhere in the description (case-insensitive)
  for (const phrase of TYPE_PHRASES) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    desc = desc.replace(re, ' ')
  }

  // Remove CIBC channel codes at word boundaries (standalone 2-3 uppercase letters at end)
  // More conservative: only remove known codes like MB, CPT, PTB
  desc = desc.replace(/\b(MB|CPT|PTB|MBP)\s*$/, '')

  // Remove "BILL PAY" prefix but keep the rest
  desc = desc.replace(/^BILL PAY\s+\d+\s+/i, '')

  // Remove reference numbers like "000000234649" (standalone 9+ digit numbers)
  desc = desc.replace(/\b\d{9,}\b/g, '')

  // Remove sentences/fragments that contain footer boilerplate
  // Split by sentence boundaries or long phrases
  const parts = desc.split(/(?:\.|\s{2,})\s*/)
  desc = parts
    .filter(s => !isFooterLine(s))
    .join(' ')

  // Remove leading/trailing punctuation and whitespace after all removals
  desc = desc.replace(/^[,\s\-–—*]+/, '').replace(/[,\s\-–—.*]+$/, '')

  // Collapse multiple spaces
  desc = desc.replace(/\s+/g, ' ').trim()

  return desc
}

/**
 * Check if a line is footer/boilerplate text that should not be part of a transaction.
 */
function isFooterLine(text) {
  if (FOOTER_PATTERNS.some(pat => pat.test(text))) return true
  // Also catch very long lines (>150 chars) that contain typical disclaimer language
  if (text.length > 150 && (/fee|charge|transaction|balance|statement|banking|currency/i.test(text))) return true
  // Lines starting with TM (trademark footnote) or * (footnote marker) or Note:
  if (/^(TM\s|Note:|If you|\*\s)/.test(text)) return true
  // Lines containing legal/disclaimer phrases
  if (/applicable to the|you are charged|converted amount|reflected in your balance|paper statement|list of service/i.test(text)) return true
  return false
}

function parseCIBCCheckingTransactions(pages, year) {
  const transactions = []

  // Work with flat list of all lines across all pages (preserving items for x-coords)
  const allLines = pages.flatMap(p => reconstructLines(p))

  // Detect column positions from the header row
  const columns = detectColumnPositions(allLines)

  // Find where TRANSACTIONS sections start (skip headers, account info)
  let inTransactionSection = false

  // Collect "transaction blocks" — groups of lines between date-starting lines
  // Each block: { month, day, year, lines[], amountItems[] }
  // amountItems: { value, x, column } — preserves x-coordinate for debit/credit classification
  const blocks = []
  let currentBlock = null

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i]
    const text = line.text

    // Detect TRANSACTIONS header to enter transaction section
    if (/^TRANSACTIONS$/i.test(text.trim())) {
      inTransactionSection = true
      continue
    }

    // Skip non-transaction sections
    if (!inTransactionSection) continue

    // Skip known header/footer/noise lines
    if (/^DATE\s+DEBIT/i.test(text)) continue
    if (/●\s+Free transaction/i.test(text)) continue
    if (/https?:\/\//i.test(text)) {
      inTransactionSection = false // Page break — reset, will re-enter on next TRANSACTIONS
      continue
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{2},\s+\d{1,2}:\d{2}\s+(AM|PM)/i.test(text)) continue // browser timestamp
    if (/^(Custom Search|Questions about|View:)/i.test(text)) continue

    // Check if this line starts with a date (new transaction)
    const dateMatch = text.match(DATE_PATTERN)
    if (dateMatch) {
      // Start a new block
      const monthStr = dateMatch[1].toLowerCase()
      const day = dateMatch[2]
      const lineYear = dateMatch[3] ? parseInt(dateMatch[3]) : null

      currentBlock = {
        month: MONTH_MAP[monthStr],
        day: day.padStart(2, '0'),
        year: lineYear || null,
        lines: [text],
        amountItems: [],
      }
      blocks.push(currentBlock)

      // Extract dollar amounts with their x-coordinates
      extractAmountsWithPositions(line.items, columns, currentBlock.amountItems)
    } else if (currentBlock) {
      // Skip footer lines that got captured in a transaction block
      if (isFooterLine(text)) continue

      // Continuation line for the current block
      currentBlock.lines.push(text)

      // Check if this line has the year (for split date like "Mar 16," ... "2026 TRANSFER...")
      if (!currentBlock.year) {
        const yearOnlyMatch = text.match(/^(\d{4})\b/)
        if (yearOnlyMatch) {
          currentBlock.year = parseInt(yearOnlyMatch[1])
        }
      }

      // Extract dollar amounts with positions
      extractAmountsWithPositions(line.items, columns, currentBlock.amountItems)
    }
  }

  // Process each block into a transaction
  for (const block of blocks) {
    const blockYear = block.year || year
    const date = `${blockYear}-${block.month}-${block.day}`

    // Separate amounts by column classification
    const debitAmounts = block.amountItems.filter(a => a.column === 'debit')
    const creditAmounts = block.amountItems.filter(a => a.column === 'credit')
    const balanceAmounts = block.amountItems.filter(a => a.column === 'balance')

    // Determine transaction amount and type
    let amount = null
    let isCredit = false

    if (debitAmounts.length > 0) {
      amount = debitAmounts[0].value
      isCredit = false
    } else if (creditAmounts.length > 0) {
      amount = creditAmounts[0].value
      isCredit = true
    } else {
      // Fallback: if column detection failed, use the old heuristic
      // (amounts list: second-to-last = transaction, last = balance)
      const allAmts = block.amountItems.map(a => a.value)
      if (allAmts.length >= 2) {
        amount = allAmts[allAmts.length - 2]
      } else if (allAmts.length === 1) {
        amount = allAmts[0]
      }
      if (amount === null) continue
      // Keyword fallback for type
      const rawDesc = block.lines.join(' ').toLowerCase()
      isCredit = rawDesc.includes('deposit') || rawDesc.includes('payroll') ||
                 rawDesc.includes('transfer in') || rawDesc.includes('e-transfer') ||
                 rawDesc.includes('credit') || rawDesc.includes('refund')
    }

    if (!amount || amount === 0) continue

    // Build description from all lines, removing dates, amounts, and noise
    let rawDescription = block.lines
      .map(l => {
        let cleaned = l
        // Remove date pattern
        cleaned = cleaned.replace(DATE_PATTERN, '')
        // Remove dollar amounts
        cleaned = cleaned.replace(DOLLAR_PATTERN, '')
        // Remove year-only at start
        cleaned = cleaned.replace(/^\d{4}\b/, '')
        return cleaned.trim()
      })
      .filter(l => l.length > 0 && !isFooterLine(l))
      .join(' ')

    const description = cleanDescription(rawDescription)

    // Skip noise entries
    if (!description) continue
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes('opening balance') || lowerDesc.includes('closing balance')) continue

    transactions.push({
      date,
      description,
      amount,
      type: isCredit ? 'credit' : 'debit',
    })
  }

  return transactions
}

/**
 * Extract dollar amounts from a line's items, classify by column position,
 * and push { value, x, column } objects into the target array.
 */
function extractAmountsWithPositions(items, columns, target) {
  for (const item of items) {
    const matches = item.text.match(DOLLAR_PATTERN)
    if (matches) {
      for (const match of matches) {
        const value = parseAmount(match)
        if (value !== null) {
          const column = classifyAmountByColumn(item.x, columns)
          target.push({ value, x: item.x, column })
        }
      }
    }
  }
}

// ─── CIBC Credit Card parser ────────────────────────────────────────────────

/**
 * Parse a CIBC date string like "Jan 02" or "Jan. 02" into "yyyy-MM-dd".
 */
function parseCIBCDate(dateStr, year) {
  const match = dateStr.match(/([A-Za-z]{3})\.?\s+(\d{1,2})/)
  if (!match) return null
  const month = MONTH_MAP[match[1].toLowerCase()]
  if (!month) return null
  const day = match[2].padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseCIBCCreditCardTransactions(pages, year) {
  const transactions = []

  for (const pageItems of pages) {
    const lines = reconstructLines(pageItems)

    for (const line of lines) {
      const text = line.text

      // CIBC Credit Card format:
      // Transaction Date / Posting Date / Description / Amount
      // Example: "Jan 02 Jan 03 AMAZON.CA 45.67"
      // or: "Jan 02 Jan 04 PAYMENT - THANK YOU -500.00"

      // Try to match line starting with a date, possibly followed by another date
      const dateMatch = text.match(/^([A-Za-z]{3})\.?\s+(\d{1,2})\s+/)
      if (!dateMatch) continue

      const date = parseCIBCDate(dateMatch[0], year)
      if (!date) continue

      let rest = text.slice(dateMatch[0].length).trim()

      // Check for a second date (posting date) - skip it
      const postingDateMatch = rest.match(/^([A-Za-z]{3})\.?\s+(\d{1,2})\s+/)
      if (postingDateMatch) {
        rest = rest.slice(postingDateMatch[0].length).trim()
      }

      // Find amount at end of line (may be negative for payments/credits)
      const amountMatch = rest.match(/-?[\d,]+\.\d{2}\s*$/)
      if (!amountMatch) continue

      const amount = parseAmount(amountMatch[0])
      if (amount === null || amount === 0) continue

      const description = rest.slice(0, amountMatch.index).trim().replace(/\s+/g, ' ')
      if (!description) continue

      // Skip headers/footers
      const lowerDesc = description.toLowerCase()
      if (lowerDesc.includes('previous balance') || lowerDesc.includes('new balance') ||
          lowerDesc.includes('total') || lowerDesc.includes('credit limit') ||
          lowerDesc.includes('minimum payment') || lowerDesc.includes('statement') ||
          lowerDesc.includes('page ')) {
        continue
      }

      // For credit cards: positive = purchase (debit), negative = payment/refund (credit)
      // Also check description for payment keywords
      const isPayment = amount < 0 || lowerDesc.includes('payment') || lowerDesc.includes('refund')

      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        type: isPayment ? 'credit' : 'debit',
      })
    }
  }

  return transactions
}

// ─── Costco Mastercard parser ───────────────────────────────────────────────

function parseCostcoMastercardTransactions(pages, year) {
  // Costco Mastercard (CIBC) statements follow a similar format to CIBC credit cards
  // Reuse the credit card parser as the base, it handles the same patterns
  return parseCIBCCreditCardTransactions(pages, year)
}

// ─── Main export ────────────────────────────────────────────────────────────

/**
 * Parse a bank statement PDF file and return structured transactions.
 *
 * @param {File} file - The PDF file to parse
 * @returns {Promise<{
 *   statementType: { id: string, label: string, paymentMethod: string },
 *   transactions: Array<{
 *     date: string,        // 'yyyy-MM-dd'
 *     description: string, // Original description from statement
 *     amount: number,      // Always positive
 *     type: 'debit'|'credit',
 *     paymentMethod: string // 'bank', 'visa', or 'mastercard'
 *   }>,
 *   rawText: string,       // Full extracted text for debugging
 *   pageCount: number,
 * }>}
 */
export async function parseBankStatement(file) {
  // Extract text from all pages
  const pages = await extractTextFromPDF(file)

  // Reconstruct full text for statement type detection and year extraction
  const allLines = pages.flatMap(p => reconstructLines(p))
  const fullText = allLines.map(l => l.text).join('\n')

  // Detect statement type
  const statementType = detectStatementType(fullText)

  // Extract statement year
  const year = parseStatementYear(fullText)

  // Parse transactions based on statement type
  let transactions = []

  switch (statementType.id) {
    case 'cibc_checking':
      transactions = parseCIBCCheckingTransactions(pages, year)
      break
    case 'cibc_visa':
      transactions = parseCIBCCreditCardTransactions(pages, year)
      break
    case 'costco_mastercard':
      transactions = parseCostcoMastercardTransactions(pages, year)
      break
    default:
      // Try checking parser as a generic fallback
      transactions = parseCIBCCheckingTransactions(pages, year)
      break
  }

  // Attach payment method to each transaction
  transactions = transactions.map(t => ({
    ...t,
    paymentMethod: statementType.paymentMethod,
  }))

  return {
    statementType,
    transactions,
    rawText: fullText,
    pageCount: pages.length,
  }
}

/**
 * Check which transactions already exist in the current data.
 * Returns a Set of indices that are duplicates.
 *
 * @param {Array} parsedTransactions - Transactions from the PDF parser
 * @param {Array} existingExpenses - Current expenses from state
 * @param {Array} existingIncome - Current income from state
 * @returns {Set<number>} - Indices of duplicate transactions
 */
export function findDuplicates(parsedTransactions, existingExpenses = [], existingIncome = []) {
  const duplicateIndices = new Set()

  // Build a lookup set from existing records: "date|amount"
  const existingKeys = new Set()

  for (const expense of existingExpenses) {
    existingKeys.add(`${expense.date}|${expense.amount}`)
  }

  for (const income of existingIncome) {
    existingKeys.add(`${income.date}|${income.amount}`)
  }

  for (let i = 0; i < parsedTransactions.length; i++) {
    const t = parsedTransactions[i]
    const key = `${t.date}|${t.amount}`
    if (existingKeys.has(key)) {
      duplicateIndices.add(i)
    }
  }

  return duplicateIndices
}

export { STATEMENT_TYPES }
