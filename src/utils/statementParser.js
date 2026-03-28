/**
 * CIBC Checking Statement PDF Parser
 *
 * Parses print-to-PDF statements from CIBC Online Banking.
 * Uses pdfjs-dist to extract text with x/y positions, then groups items into
 * rows and uses column x-positions to distinguish DATE, DESCRIPTION, DEBIT,
 * CREDIT, and RUNNING BALANCE.
 *
 * Three-pass approach:
 *   Pass 0: Auto-detect column x-positions from header rows ("DATE", "DEBIT",
 *           "CREDIT", "RUNNING BALANCE", "TRANSACTIONS") to derive thresholds.
 *   Pass 1: Classify all rows into columns, filter noise, collect into
 *           transaction blocks (delimited by date-column entries).
 *   Pass 2: Parse each block to extract date, description, amounts, and type.
 *
 * Column positions are auto-detected from the PDF header. Fallback defaults
 * are used if detection fails:
 *   DATE:            x ≈ 54-62
 *   DESCRIPTION:     x ≈ 105-129
 *   DEBIT:           x ≈ 268-346
 *   CREDIT:          x ≈ 335-436
 *   RUNNING BALANCE: x ≈ 370-536
 */

import * as pdfjsLib from 'pdfjs-dist'

// Configure worker — use bundled worker via URL import for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

// --- Fallback column boundary thresholds (x-positions) ---
const DEFAULT_DESC_MIN = 115
const DEFAULT_DEBIT_MIN = 300
const DEFAULT_CREDIT_MIN = 400
const DEFAULT_BALANCE_MIN = 490

// Month abbreviation map
const MONTHS = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

const MONTH_NAMES = new Set(Object.keys(MONTHS))

/**
 * Parse a CIBC date string like "Mar 16, 2026" into "2026-03-16".
 */
function parseCIBCDate(dateStr) {
  if (!dateStr) return null
  const m = dateStr
    .trim()
    .match(
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s*(\d{4})$/
    )
  if (!m) return null
  const month = MONTHS[m[1]]
  const day = m[2].padStart(2, '0')
  return `${m[3]}-${month}-${day}`
}

/**
 * Parse a dollar amount string like "$5,404.23" into a float.
 */
function parseAmount(str) {
  if (!str) return 0
  const cleaned = str.replace(/[$,\s]/g, '')
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : val
}

const AMT_RE = /\$[\d,]+\.\d{2}/

/**
 * Extract positioned text items from all pages of a PDF.
 */
async function extractPositionedRows(file) {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const allItems = []
  let rawFirstPage = ''

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()

    if (p === 1) {
      let lastY = null
      for (const item of content.items) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 3) {
          rawFirstPage += '\n'
        }
        rawFirstPage += item.str
        lastY = item.transform[5]
      }
    }

    for (const item of content.items) {
      if (!item.str || item.str.trim() === '') continue
      allItems.push({
        str: item.str,
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        page: p,
      })
    }
  }

  // Sort: page ASC, y DESC (top-to-bottom on page), x ASC
  allItems.sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x)

  // Group items into rows by y-position (within 4px tolerance)
  const rows = []
  let currentRow = []
  let currentY = null
  let currentPage = null

  for (const item of allItems) {
    if (
      currentY === null ||
      currentPage !== item.page ||
      Math.abs(item.y - currentY) > 4
    ) {
      if (currentRow.length > 0) rows.push({ items: currentRow })
      currentRow = [item]
      currentY = item.y
      currentPage = item.page
    } else {
      currentRow.push(item)
    }
  }
  if (currentRow.length > 0) rows.push({ items: currentRow })

  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x)
  }

  return { rows, rawFirstPage, allItems }
}

/**
 * Auto-detect column x-positions from header rows in the PDF.
 *
 * Scans all text items for the keywords "DATE", "TRANSACTIONS", "DEBIT",
 * "CREDIT", and "RUNNING BALANCE". These appear as column headers in the
 * CIBC statement and their x-positions define the column layout.
 *
 * Returns thresholds: { descMin, debitMin, creditMin, balanceMin }
 * Each threshold is the midpoint between the detected header x-positions
 * of adjacent columns.
 */
function detectColumnThresholds(allItems) {
  // Collect candidate x-positions for each header keyword.
  // Headers repeat on each page, so take the first occurrence.
  let dateX = null
  let descX = null
  let debitX = null
  let creditX = null
  let balanceX = null

  for (const item of allItems) {
    const s = item.str.trim().toUpperCase()
    if (s === 'DATE' && dateX === null) dateX = item.x
    if (s === 'TRANSACTIONS' && descX === null) descX = item.x
    if (s === 'DEBIT' && debitX === null) debitX = item.x
    if (s === 'CREDIT' && creditX === null) creditX = item.x
    if (s === 'RUNNING BALANCE' && balanceX === null) balanceX = item.x
  }

  // Need at least DATE + DEBIT to derive useful thresholds
  if (dateX === null || debitX === null) {
    return {
      descMin: DEFAULT_DESC_MIN,
      debitMin: DEFAULT_DEBIT_MIN,
      creditMin: DEFAULT_CREDIT_MIN,
      balanceMin: DEFAULT_BALANCE_MIN,
    }
  }

  // Derive midpoint thresholds between adjacent column headers.
  // If a column header wasn't found, fall back to default.
  const effectiveDescX = descX ?? dateX + 50
  const effectiveCreditX = creditX ?? debitX + 60
  const effectiveBalanceX = balanceX ?? effectiveCreditX + 40

  return {
    descMin: Math.round((dateX + effectiveDescX) / 2),
    debitMin: Math.round((effectiveDescX + debitX) / 2),
    creditMin: Math.round((debitX + effectiveCreditX) / 2),
    balanceMin: Math.round((effectiveCreditX + effectiveBalanceX) / 2),
  }
}

/**
 * Classify row items into columns based on x-position thresholds.
 */
function classifyRow(items, thresholds) {
  const { descMin, debitMin, creditMin, balanceMin } = thresholds
  let dateText = ''
  let descText = ''
  let debitText = ''
  let creditText = ''
  let balanceText = ''

  for (const item of items) {
    const s = item.str.trim()
    if (!s) continue

    if (item.x < descMin) {
      dateText += (dateText ? ' ' : '') + s
    } else if (item.x < debitMin) {
      descText += (descText ? ' ' : '') + s
    } else if (item.x < creditMin) {
      debitText += (debitText ? ' ' : '') + s
    } else if (item.x < balanceMin) {
      creditText += (creditText ? ' ' : '') + s
    } else {
      balanceText += (balanceText ? ' ' : '') + s
    }
  }

  return { dateText, descText, debitText, creditText, balanceText }
}

/**
 * Check if a string starts with a month abbreviation.
 */
function startsWithMonth(str) {
  if (!str) return false
  const firstWord = str.trim().split(/\s/)[0]
  return MONTH_NAMES.has(firstWord)
}

/**
 * Clean up a CIBC transaction description.
 */
function cleanDescription(raw) {
  if (!raw) return ''
  let d = raw

  // Strip leading transaction-type prefixes
  const prefixes = [
    'Electronic Funds Transfer',
    'Internet Banking',
    'Branch Transaction',
  ]
  for (const p of prefixes) {
    if (d.startsWith(p)) {
      d = d.slice(p.length).trim()
    }
  }

  const subPrefixes = [
    'PREAUTHORIZED DEBIT',
    'PREAUTHORIZED CREDIT',
    'INTERNET TRANSFER',
    'INTERNET BILL PAY',
    'E-TRANSFER',
    'DEPOSIT',
    'PAY',
  ]
  for (const sp of subPrefixes) {
    if (d.toUpperCase().startsWith(sp)) {
      d = d.slice(sp.length).trim()
    }
  }

  // Strip reference numbers
  d = d.replace(/\b\d{6,}\b/g, '').trim()
  d = d.replace(/\b[A-Z]?\d{9,}\b/g, '').trim()

  // Strip CIBC-specific noise tokens
  d = d.replace(/\bSeCPT\b/gi, '').trim()

  // Strip trailing noise phrases (continuation lines from PDF)
  // Run multiple passes since stripping one may reveal another
  const trailingNoise = [
    'Electronic Funds Transfer PAY',
    'Electronic Funds Transfer',
    'Internet Banking INTERNET',
    'Internet Banking E-TRANSFER',
    'Internet Banking',
    'TRANSACTIONS',
    'PREAUTHORIZED DEBIT',
    'PREAUTHORIZED CREDIT',
  ]
  let changed = true
  while (changed) {
    changed = false
    for (const tn of trailingNoise) {
      const upper = d.toUpperCase()
      const tnUpper = tn.toUpperCase()
      // Strip if entire string equals the noise
      if (upper === tnUpper) {
        // Don't strip everything — keep raw fallback
        break
      }
      if (upper.endsWith(tnUpper)) {
        const before = d.slice(0, d.length - tn.length).trim()
        if (before) {
          d = before
          changed = true
        }
      }
    }
  }

  d = d.replace(/^[-–—\s]+|[-–—\s]+$/g, '').trim()
  d = d.replace(/\s*-\s*\d+\s*DIGIT$/i, '').trim()
  d = d.replace(/\s{2,}/g, ' ').trim()

  // If cleaned desc is itself a noise phrase, generate a label from raw
  const allNoise = [
    ...trailingNoise,
    'PAY',
    'DEPOSIT',
    'E-TRANSFER',
    'INTERNET TRANSFER',
    'INTERNET BILL PAY',
    'TRANSFER',
    'BILL PAY',
  ]
  if (!d || allNoise.some((n) => d.toUpperCase() === n.toUpperCase())) {
    // Derive a useful label from raw
    const upper = raw.toUpperCase()
    if (upper.includes('INTERNET TRANSFER') || upper.includes('INTERNET BANKING')) return 'Internet Transfer'
    if (upper.includes('E-TRANSFER')) return 'E-Transfer'
    if (upper.includes('BILL PAY')) return 'Bill Payment'
    if (upper.includes('DEPOSIT')) return 'Deposit'
    if (upper.includes('TRANSFER')) return 'Internet Transfer'
    return raw.trim()
  }

  return d
}

/**
 * Infer payment method from CIBC description.
 */
function inferPaymentMethod(rawDescription) {
  const upper = rawDescription.toUpperCase()
  if (upper.includes('E-TRANSFER')) return 'etransfer'
  if (upper.includes('INTERNET TRANSFER')) return 'etransfer'
  if (upper.includes('BILL PAY')) return 'debit'
  return 'debit'
}

/**
 * Check if a row is a table header row.
 * Looks for "DATE" as a standalone item near the left edge (x < 80)
 * and "DEBIT" somewhere in the same row.
 */
function isHeaderRow(row) {
  const hasDate = row.items.some(
    (i) => i.str.trim().toUpperCase() === 'DATE' && i.x < 80
  )
  const hasDebit = row.items.some(
    (i) => i.str.trim().toUpperCase() === 'DEBIT'
  )
  return hasDate && hasDebit
}

/**
 * Check if a row is noise (non-transaction content).
 */
function isNoiseRow(row) {
  const combined = row.items.map((i) => i.str.trim()).join(' ')
  const upper = combined.toUpperCase()
  return (
    upper.includes('DEPOSIT ACCOUNT DETAILS') ||
    upper.includes('CIBC ONLINE BANKING') ||
    upper.includes('TRANSACTION GLOSSARY') ||
    upper.includes('QUESTIONS ABOUT') ||
    upper.includes('FREE TRANSACTION') ||
    upper.includes('PAST TRANSACTIONS') ||
    upper.includes('CUSTOM SEARCH') ||
    upper.includes('LAST 4 WEEKS') ||
    upper.includes('BILL PAYMENTS') ||
    upper.includes('VIEW YOUR CIBC') ||
    upper.includes('REVIEW AND CANCEL') ||
    upper.includes('HTTPS://') ||
    upper.includes('PERSONAL ACCOUNT SERVICE') ||
    upper.includes('FOREIGN CURRENCY') ||
    upper.includes('CONVERSION RATE') ||
    upper.includes('APPLICABLE TO THE') ||
    upper.includes('NOTE:') ||
    upper.includes('TRANSACTIONS FROM TODAY') ||
    upper.includes('RECENTLY ISSUED') ||
    upper.includes('FOR QUESTIONS ABOUT') ||
    upper.includes('SERVICE CHARGES AND ACCOUNT') ||
    upper.includes('A CIBC BANKING CENTRE') ||
    upper.includes('FOR A DESCRIPTION') ||
    upper.includes('ADDITIONAL FILTERING') ||
    upper.includes('FILTER BY DATE') ||
    upper.includes('TRANSACTION TYPE') ||
    upper.includes('FROM LOWER LIMIT') ||
    upper.includes('TO UPPER LIMIT') ||
    upper.includes('MANAGE MY ACCOUNT') ||
    upper.includes('CHANGE ACCOUNT TYPE') ||
    upper.includes('PRODUCT NAME') ||
    upper.includes('TRANSIT NUMBER') ||
    upper.includes('INSTITUTION NUMBER') ||
    upper.includes('STATEMENT OPTION') ||
    upper.includes('FUNDS ON HOLD') ||
    upper.includes('OVERDRAFT LIMIT') ||
    upper.includes('AVAILABLE FUNDS') ||
    upper.includes('DAILY ATM WITHDRAWAL') ||
    upper.includes('DAILY DEBIT PURCHASE') ||
    upper.includes('ACCESS TO DEPOSITED') ||
    upper.includes('SMART ACCOUNT TIER') ||
    upper.includes('WIRE TRANSFER BANK') ||
    upper.includes('RECEIVE NOTIFICATIONS') ||
    upper.includes('HOLD PERIOD') ||
    upper.includes('LEARN MORE ABOUT') ||
    upper.includes('POINT OF SALE') ||
    combined.match(/^\d+\/\d+\/\d+/)
  )
}

/**
 * Parse a single transaction block (array of classified rows) into a transaction.
 * A block contains all rows from one date entry to the next.
 * Within the block, we look for:
 *   - Date parts in dateText (partial "Mar 16," + year "2026", or full "Mar 6, 2026")
 *   - Description parts in descText
 *   - Amounts in debitText/creditText/balanceText
 */
function parseBlock(blockRows) {
  // Collect all date fragments, desc fragments, and find amounts
  const dateFragments = []
  const descFragments = []
  let debitAmt = 0
  let creditAmt = 0
  let balanceAmt = 0

  for (const cl of blockRows) {
    if (cl.dateText.trim()) {
      dateFragments.push(cl.dateText.trim())
    }
    if (cl.descText.trim()) {
      descFragments.push(cl.descText.trim())
    }
    // Take the first row that has amounts
    if (!debitAmt && AMT_RE.test(cl.debitText)) {
      debitAmt = parseAmount(cl.debitText)
    }
    if (!creditAmt && AMT_RE.test(cl.creditText)) {
      creditAmt = parseAmount(cl.creditText)
    }
    if (!balanceAmt && AMT_RE.test(cl.balanceText)) {
      balanceAmt = parseAmount(cl.balanceText)
    }
  }

  // Reconstruct the date from fragments
  // Fragments might be ["Mar 16,", "2026"] or ["Mar 6, 2026"]
  const dateStr = dateFragments.join(' ')
  const date = parseCIBCDate(dateStr)

  if (!date) return null
  if (!debitAmt && !creditAmt) return null

  const rawDesc = descFragments.join(' ').trim()
  if (!rawDesc) return null

  const amount = debitAmt || creditAmt
  const type = creditAmt > 0 ? 'income' : 'expense'

  return {
    date,
    amount,
    type,
    description: cleanDescription(rawDesc),
    rawDescription: rawDesc,
    paymentMethod: inferPaymentMethod(rawDesc),
    category: null,
    runningBalance: balanceAmt,
  }
}

/**
 * Main parser: takes a PDF File and returns parsed transactions.
 *
 * @param {File} file
 * @returns {Promise<{ transactions: ParsedTransaction[], dateRange: string, accountInfo: string }>}
 */
export async function parseCIBCStatement(file) {
  const { rows, rawFirstPage, allItems } = await extractPositionedRows(file)

  // --- Pass 0: Auto-detect column thresholds from header keywords ---
  const thresholds = detectColumnThresholds(allItems)

  // Extract account info from first page raw text
  let accountInfo = ''
  const acctMatch = rawFirstPage.match(/(Chequing|Savings)\s*\([^)]+\)/)
  if (acctMatch) accountInfo = acctMatch[0]

  // Extract date range
  let dateRange = ''
  const allText = rows.map((r) => r.items.map((i) => i.str).join(' ')).join(' ')
  const rangeMatch = allText.match(
    /(?:February|January|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}\s+to\s+(?:February|January|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}/
  )
  if (rangeMatch) dateRange = rangeMatch[0]

  // --- Pass 1: Filter noise/headers and classify transaction rows ---
  const classifiedRows = []
  let inTransactionArea = false

  for (const row of rows) {
    if (isNoiseRow(row)) continue
    if (isHeaderRow(row)) {
      inTransactionArea = true
      continue
    }
    if (!inTransactionArea) continue

    const cl = classifyRow(row.items, thresholds)
    classifiedRows.push(cl)
  }

  // --- Pass 2: Split classified rows into transaction blocks ---
  // A new block starts when we see a date column entry that starts with a
  // month name (e.g., "Mar 16," or "Mar 6, 2026"). A standalone year "2026"
  // does NOT start a new block — it belongs to the current block.
  const blocks = []
  let currentBlock = []

  for (const cl of classifiedRows) {
    const dateCol = cl.dateText.trim()

    if (dateCol && startsWithMonth(dateCol)) {
      // Start a new block
      if (currentBlock.length > 0) {
        blocks.push(currentBlock)
      }
      currentBlock = [cl]
    } else {
      currentBlock.push(cl)
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock)
  }

  // --- Pass 3: Parse each block into a transaction ---
  const transactions = []
  for (const block of blocks) {
    const tx = parseBlock(block)
    if (tx) transactions.push(tx)
  }

  return {
    transactions,
    dateRange,
    accountInfo,
  }
}

/**
 * Quick detection: is this likely a CIBC statement PDF?
 * Reads just the first page.
 */
export async function isCIBCStatement(file) {
  try {
    const { rawFirstPage } = await extractPositionedRows(file)
    return (
      rawFirstPage.includes('CIBC') &&
      (rawFirstPage.includes('Deposit Account Details') ||
        rawFirstPage.includes('Chequing') ||
        rawFirstPage.includes('PAST TRANSACTIONS'))
    )
  } catch {
    return false
  }
}
