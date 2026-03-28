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

// =====================================================================
// CIBC CREDIT CARD PARSER
// =====================================================================
//
// Parses print-to-PDF credit card statements from CIBC Online Banking
// (Visa and Mastercard). Layout has 3 columns:
//   TRANSACTION DATE (x ≈ 41)  |  DETAILS (x ≈ 148)  |  AMOUNT (x ≈ 413-426)
//
// Each transaction spans 2+ rows:
//   Row 1: date + merchant description
//   Row 2: card number fragment (e.g. "5223********9150") — skip
//   Optional: "Credit" label after negative amounts
//   Optional: foreign currency line "USD @ 1.424553"
//
// Negative amounts (with − prefix) are payments/credits → type: 'income'
// Positive amounts are purchases → type: 'expense'

// Credit card column x-position thresholds
const CC_DATE_MAX = 100    // date items are at x ≈ 41
const CC_AMOUNT_MIN = 400  // amount items are at x ≈ 413+

/**
 * Detect if this is a credit card statement.
 * Looks for "CIBC VISA", "CIBC MasterCard", or "CREDIT CARD DETAILS".
 */
function isCreditCardStatement(rawFirstPage) {
  return (
    rawFirstPage.includes('CREDIT CARD DETAILS') ||
    /CIBC\s*(VISA|Visa|MasterCard|Mastercard)/i.test(rawFirstPage)
  )
}

/**
 * Extract credit card account info (card type + number).
 */
function extractCCAccountInfo(rawFirstPage) {
  const m = rawFirstPage.match(/CIBC\s+((?:VISA|Visa|MasterCard|Mastercard)[^)]*\([^)]+\))/)
  if (m) return `CIBC ${m[1]}`
  const m2 = rawFirstPage.match(/CIBC\s+((?:VISA|Visa|MasterCard|Mastercard)\s*®?)/)
  if (m2) return `CIBC ${m2[1]}`
  return 'CIBC Credit Card'
}

/**
 * Check if a row is a credit card transaction header.
 * Looks for "TRANSACTION DATE" and "AMOUNT" or "DETAILS".
 */
function isCCHeaderRow(row) {
  const combined = row.items.map((i) => i.str.trim().toUpperCase()).join(' ')
  return combined.includes('TRANSACTION DATE') && (combined.includes('AMOUNT') || combined.includes('DETAILS'))
}

/**
 * Check if a row is noise in the credit card statement.
 */
function isCCNoiseRow(row) {
  const combined = row.items.map((i) => i.str.trim()).join(' ')
  const upper = combined.toUpperCase()
  return (
    upper.includes('CREDIT CARD DETAILS') ||
    upper.includes('CIBC ONLINE BANKING') ||
    upper.includes('TRANSACTION GLOSSARY') ||
    upper.includes('QUESTIONS ABOUT') ||
    upper.includes('PAST TRANSACTIONS') ||
    upper.includes('CUSTOM SEARCH') ||
    upper.includes('LAST 4 WEEKS') ||
    upper.includes('LAST 3 MONTHS') ||
    upper.includes('LAST 6 MONTHS') ||
    upper.includes('LAST 12 MONTHS') ||
    upper.includes('HTTPS://') ||
    upper.includes('ADDITIONAL FILTERING') ||
    upper.includes('FILTER BY DATE') ||
    upper.includes('FILTER BY MONTH') ||
    upper.includes('TRANSACTION TYPE') ||
    upper.includes('TRANSACTION LOCATION') ||
    upper.includes('FROM LOWER LIMIT') ||
    upper.includes('TO UPPER LIMIT') ||
    upper.includes('CATEGORY:') ||
    upper.includes('GET DETAILS') ||
    upper.includes('CREDIT DETAILS') ||
    upper.includes('STATEMENT DETAILS') ||
    upper.includes('PAYMENT DETAILS') ||
    upper.includes('CREDIT LIMIT:') ||
    upper.includes('CREDIT AVAILABLE:') ||
    upper.includes('CURRENT BALANCE') ||
    upper.includes('AMOUNT DUE') ||
    upper.includes('MINIMUM PAYMENT') ||
    upper.includes('DUE DATE:') ||
    upper.includes('STATEMENT DATE:') ||
    upper.includes('LAST PAYMENT') ||
    upper.includes('STATEMENT OPTION') ||
    upper.includes('MANAGE MY CARD') ||
    upper.includes('SPEND REPORT') ||
    upper.includes('PERSONAL SPEND MANAGER') ||
    upper.includes('CASH BACK BALANCE') ||
    upper.includes('GIFT CERTIFICATE') ||
    upper.includes('LOCK MY CARD') ||
    upper.includes('LEARN MORE') ||
    upper.includes('CHECK STATUS') ||
    upper.includes('ACCOUNT NICKNAME') ||
    upper.includes('VIEW ESTATEMENTS') ||
    upper.includes('VIEW AND EDIT') ||
    upper.includes('PAY CARD') ||
    upper.includes('VIEW:') ||
    upper.includes('SET UP A') ||
    upper.includes('APPLY FOR') ||
    upper.includes('SHARE YOUR') ||
    upper.includes('ADD A CARDHOLDER') ||
    upper.includes('PROTECT YOUR CREDIT') ||
    upper.includes('SPEND CATEGORIES') ||
    upper.includes('THE ICONS INDICATE') ||
    upper.includes('TO VIEW THE TRANSACTION') ||
    upper.includes('CREDIT CARD ESTATEMENT') ||
    upper.includes('PERSONAL & HOUSEHOLD') ||
    upper.includes('RETAIL AND GROCERY') ||
    upper.includes('HOTELS, ENTERTAINMENT') ||
    upper.includes('HOME & OFFICE') ||
    upper.includes('CASH ADVANCES') ||
    upper.includes('FOREIGN CURRENCY TRANSACTIONS') ||
    upper.includes('OTHER TRANSACTIONS') ||
    upper.includes('PROFESSIONAL AND FINANCIAL') ||
    upper.includes('TRANSPORTATION') ||
    upper.includes('RESTAURANTS') ||
    upper.includes('HEALTH & EDUCATION') ||
    upper.includes('PENDING:') ||
    upper.includes('COSTCO WORLD') ||
    upper.includes('YOUR CASH BACK') ||
    upper.includes('CALENDAR YEAR') ||
    upper.includes('FEEDBACK') ||
    upper.includes('SEARCH') ||
    upper.includes('FROM:') ||
    upper.includes('MONTH:') ||
    upper.includes('YEAR:') ||
    upper.includes('GOODS OR SERVICES') ||
    upper.includes('TERMS AND CONDITIONS') ||
    combined.match(/^\d+\/\d+\/\d+/)
  )
}

/**
 * Check if a string is a card number fragment like "5223********9150".
 */
function isCardNumberFragment(str) {
  return /^\d{4}\*{4,}\d{4}$/.test(str.trim())
}

/**
 * Classify a credit card row into date, description, and amount.
 */
function classifyCCRow(items) {
  let dateText = ''
  let descText = ''
  let amountText = ''

  for (const item of items) {
    const s = item.str.trim()
    if (!s) continue

    if (item.x < CC_DATE_MAX) {
      dateText += (dateText ? ' ' : '') + s
    } else if (item.x >= CC_AMOUNT_MIN) {
      amountText += (amountText ? ' ' : '') + s
    } else {
      descText += (descText ? ' ' : '') + s
    }
  }

  return { dateText, descText, amountText }
}

/**
 * Parse credit card transactions from positioned rows.
 */
function parseCreditCardTransactions(rows) {
  const transactions = []
  let inTransactionArea = false

  // Group rows into transaction blocks
  // A new transaction starts when we see a date (month name) in the date column
  // and a description (not a card number) in the desc column
  const classifiedRows = []

  for (const row of rows) {
    if (isCCNoiseRow(row)) continue
    if (isCCHeaderRow(row)) {
      inTransactionArea = true
      continue
    }
    if (!inTransactionArea) continue

    const cl = classifyCCRow(row.items)

    // Skip empty rows
    if (!cl.dateText && !cl.descText && !cl.amountText) continue

    // Skip "Credit" label rows (standalone "Credit" in amount column)
    if (!cl.dateText && !cl.descText && cl.amountText.toLowerCase() === 'credit') {
      continue
    }

    // Skip card number fragment rows (with or without "Credit" label)
    if (!cl.dateText && cl.descText && isCardNumberFragment(cl.descText)) {
      continue
    }

    classifiedRows.push(cl)
  }

  // Now group classified rows into transaction blocks
  // A block starts when dateText has a month name
  const blocks = []
  let currentBlock = []

  for (const cl of classifiedRows) {
    if (cl.dateText && startsWithMonth(cl.dateText)) {
      if (currentBlock.length > 0) blocks.push(currentBlock)
      currentBlock = [cl]
    } else {
      currentBlock.push(cl)
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock)

  // Parse each block
  for (const block of blocks) {
    const tx = parseCCBlock(block)
    if (tx) transactions.push(tx)
  }

  return transactions
}

/**
 * Parse a single credit card transaction block.
 */
function parseCCBlock(blockRows) {
  const dateFragments = []
  const descFragments = []
  let amountStr = ''

  for (const cl of blockRows) {
    if (cl.dateText.trim()) {
      dateFragments.push(cl.dateText.trim())
    }
    if (cl.descText.trim()) {
      const desc = cl.descText.trim()
      // Skip card number fragments that weren't caught earlier
      if (isCardNumberFragment(desc)) continue
      // Skip foreign currency conversion lines (e.g. "USD @ 1.424553")
      if (/^[A-Z]{3}\s+@\s+\d+\.\d+/.test(desc)) continue
      descFragments.push(desc)
    }
    // Take first non-empty amount
    if (!amountStr && cl.amountText.trim()) {
      const amt = cl.amountText.trim()
      // Skip "Credit" label
      if (amt.toLowerCase() !== 'credit') {
        amountStr = amt
      }
    }
  }

  // Reconstruct date
  const dateStr = dateFragments.join(' ')
  const date = parseCIBCDate(dateStr)
  if (!date) return null

  // Parse amount — handle negative (credit/payment) amounts
  if (!amountStr) return null

  // The amount string may contain the merchant description if they're on the
  // same line and the description was very long. Handle amounts that are
  // embedded in the description: "OPENAI *CHATGPT SUBSCR SAN FRANCISCO, CA 22.40"
  // In this case the amount won't have $ prefix — it's in the description.
  // But typically the amount column has "$" prefix.

  const isNegative = amountStr.includes('−') || amountStr.includes('-')
  const cleanedAmt = amountStr.replace(/[−\-$,\s]/g, '')
  const amount = parseFloat(cleanedAmt)
  if (isNaN(amount) || amount === 0) return null

  const rawDesc = descFragments.join(' ').trim()
  if (!rawDesc) return null

  // Clean the description — strip embedded amount from long descriptions
  // e.g. "OPENAI *CHATGPT SUBSCR SAN FRANCISCO, CA 22.40" → strip trailing amount
  let cleanDesc = rawDesc
    .replace(/\s+\d+\.\d{2}\s*$/, '') // strip trailing bare amount
    .trim()

  // Determine if description contains payment-like keywords
  const descUpper = rawDesc.toUpperCase()
  const isPayment = descUpper.includes('PAYMENT THANK YOU') ||
    descUpper.includes('PAIEMENT MERCI')

  // type: negative amounts or payments → income (credit to card)
  // positive amounts → expense (purchase)
  const type = isNegative || isPayment ? 'income' : 'expense'

  return {
    date,
    amount,
    type,
    description: cleanCCDescription(cleanDesc),
    rawDescription: rawDesc,
    paymentMethod: 'credit',
    category: null,
  }
}

/**
 * Clean up a credit card transaction description.
 */
function cleanCCDescription(raw) {
  if (!raw) return ''
  let d = raw

  // Strip payment phrases
  if (/PAYMENT THANK YOU/i.test(d)) return 'Credit Card Payment'
  if (/PAIEMENT MERCI/i.test(d)) return 'Credit Card Payment'

  // Strip trailing location (CITY, PROVINCE) — keep merchant name
  // e.g. "WAL-MART # 3119 WINNIPEG, MB" → "WAL-MART # 3119"
  // But be careful — some merchants include city in their name
  // Only strip if there's enough content before the location
  const locMatch = d.match(/^(.{10,}?)\s+[A-Z][A-Za-z\s]+,\s*[A-Z]{2,3}\s*$/)
  if (locMatch) {
    d = locMatch[1].trim()
  }

  // Strip "PURCHASE INTEREST" → keep as-is, it's a fee
  // Strip store numbers for cleaner display
  d = d.replace(/\s*#\s*\d+\s*/g, ' ').trim()

  // Clean up extra whitespace
  d = d.replace(/\s{2,}/g, ' ').trim()

  return d || raw
}

/**
 * Main parser: takes a PDF File and returns parsed transactions.
 * Auto-detects whether it's a chequing/deposit statement or credit card statement.
 *
 * @param {File} file
 * @returns {Promise<{ transactions: ParsedTransaction[], dateRange: string, accountInfo: string }>}
 */
export async function parseCIBCStatement(file) {
  const { rows, rawFirstPage, allItems } = await extractPositionedRows(file)

  // --- Auto-detect statement type ---
  if (isCreditCardStatement(rawFirstPage)) {
    return parseCIBCCreditCard(rows, rawFirstPage)
  }

  return parseCIBCDeposit(rows, rawFirstPage, allItems)
}

/**
 * Parse a CIBC Credit Card statement (Visa or Mastercard).
 */
function parseCIBCCreditCard(rows, rawFirstPage) {
  const accountInfo = extractCCAccountInfo(rawFirstPage)

  // Extract date range
  let dateRange = ''
  const allText = rows.map((r) => r.items.map((i) => i.str).join(' ')).join(' ')
  const rangeMatch = allText.match(
    /(?:February|January|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}\s+to\s+(?:February|January|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}/
  )
  if (rangeMatch) dateRange = rangeMatch[0]

  const transactions = parseCreditCardTransactions(rows)

  return {
    transactions,
    dateRange,
    accountInfo,
  }
}

/**
 * Parse a CIBC Deposit/Chequing account statement.
 */
function parseCIBCDeposit(rows, rawFirstPage, allItems) {
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
  const blocks = []
  let currentBlock = []

  for (const cl of classifiedRows) {
    const dateCol = cl.dateText.trim()

    if (dateCol && startsWithMonth(dateCol)) {
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
        rawFirstPage.includes('PAST TRANSACTIONS') ||
        rawFirstPage.includes('CREDIT CARD DETAILS') ||
        /CIBC\s*(VISA|Visa|MasterCard|Mastercard)/i.test(rawFirstPage))
    )
  } catch {
    return false
  }
}
