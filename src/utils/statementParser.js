/**
 * CIBC Checking Statement PDF Parser
 *
 * Parses print-to-PDF statements from CIBC Online Banking.
 * Uses pdfjs-dist to extract text with x/y positions, then groups items into
 * rows and uses column x-positions to distinguish DATE, DESCRIPTION, DEBIT,
 * CREDIT, and RUNNING BALANCE.
 *
 * Two-pass approach:
 *   Pass 1: Classify all rows into columns, filter noise, collect into
 *           transaction blocks (delimited by date-column entries).
 *   Pass 2: Parse each block to extract date, description, amounts, and type.
 *
 * Column x-positions (from real CIBC PDF analysis):
 *   DATE:            x ≈ 62
 *   DESCRIPTION:     x ≈ 129
 *   DEBIT:           x ≈ 326-346
 *   CREDIT:          x ≈ 422-436
 *   RUNNING BALANCE: x ≈ 531-536
 */

import * as pdfjsLib from 'pdfjs-dist'

// Configure worker — use bundled worker via URL import for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

// --- Column boundary thresholds (x-positions) ---
const DESC_MIN = 115
const DEBIT_MIN = 300
const CREDIT_MIN = 400
const BALANCE_MIN = 490

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

  return { rows, rawFirstPage }
}

/**
 * Classify row items into columns based on x-position.
 */
function classifyRow(items) {
  let dateText = ''
  let descText = ''
  let debitText = ''
  let creditText = ''
  let balanceText = ''

  for (const item of items) {
    const s = item.str.trim()
    if (!s) continue

    if (item.x < DESC_MIN) {
      dateText += (dateText ? ' ' : '') + s
    } else if (item.x < DEBIT_MIN) {
      descText += (descText ? ' ' : '') + s
    } else if (item.x < CREDIT_MIN) {
      debitText += (debitText ? ' ' : '') + s
    } else if (item.x < BALANCE_MIN) {
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
 */
function isHeaderRow(cl) {
  const combined = (
    cl.dateText + ' ' + cl.descText + ' ' + cl.debitText +
    ' ' + cl.creditText + ' ' + cl.balanceText
  ).toUpperCase()
  return combined.includes('DATE') && combined.includes('DEBIT')
}

/**
 * Check if a row is noise.
 */
function isNoiseRow(cl) {
  const combined = (
    cl.dateText + ' ' + cl.descText + ' ' + cl.debitText +
    ' ' + cl.creditText + ' ' + cl.balanceText
  )
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
  const { rows, rawFirstPage } = await extractPositionedRows(file)

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

  // --- Pass 1: Classify rows and collect into transaction blocks ---
  const classifiedRows = []
  let inTransactionArea = false

  for (const row of rows) {
    const cl = classifyRow(row.items)

    if (isNoiseRow(cl)) continue
    if (isHeaderRow(cl)) {
      inTransactionArea = true
      continue
    }
    if (!inTransactionArea) continue

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
