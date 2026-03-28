/**
 * Merchant → Category mapping engine with localStorage persistence.
 * Learns from user-assigned categories during statement imports and
 * auto-suggests on future imports via fuzzy matching.
 */

const STORAGE_KEY = 'moneytracker_merchant_map'

/**
 * Seed mappings for known CIBC statement merchants.
 * Keys are normalised (lowercase, trimmed).
 */
const SEED_MAPPINGS = {
  // Transport / auto
  'acura financial services': 'transport',
  'archive+8 acura financial services': 'transport',
  // Utilities
  'manitoba hydro': 'utilities',
  // Food & dining
  'skipthisdishes': 'food',
  'skipthedishes': 'food',
  'skip the dishes': 'food',
  'doordash': 'food',
  'uber eats': 'food',
  'mcdonalds': 'food',
  'tim hortons': 'food',
  'starbucks': 'food',
  'subway': 'food',
  'a&w': 'food',
  'walmart': 'shopping',
  'costco': 'shopping',
  'amazon': 'shopping',
  // Wife's business
  'etsy canada': 'wife_business',
  'etsy canada limited': 'wife_business',
  // Housing
  'mortgage': 'housing',
  'rent': 'housing',
  // Subscriptions
  'netflix': 'subscriptions',
  'spotify': 'subscriptions',
  'disney+': 'subscriptions',
  'apple.com': 'subscriptions',
  'google storage': 'subscriptions',
  // Insurance
  'manulife': 'insurance',
  'sun life': 'insurance',
  'great-west life': 'insurance',
  // Health
  'shoppers drug mart': 'health',
  'rexall': 'health',
  // Bank fees — treat as other
  'monthly fixed overdraft fee': 'other',
  'service charge': 'other',
  // Transfers (wise)
  'wise canada': 'other',
  'wise payments': 'other',
}

/** Normalise a merchant name for matching */
function normalise(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s&+]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Load the user's saved merchant map from localStorage */
function loadMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** Persist the merchant map */
function saveMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* storage full — silently ignore */
  }
}

/**
 * Get the best-guess category for a merchant name.
 * Priority: exact user mapping > seed mapping > fuzzy substring > null
 */
export function getMerchantCategory(rawName) {
  const key = normalise(rawName)
  if (!key) return null

  const userMap = loadMap()

  // 1. Exact match in user map
  if (userMap[key]) return userMap[key]

  // 2. Exact match in seed
  if (SEED_MAPPINGS[key]) return SEED_MAPPINGS[key]

  // 3. Substring / fuzzy: check if key contains a known merchant
  const allKeys = { ...SEED_MAPPINGS, ...userMap }
  for (const [mapKey, category] of Object.entries(allKeys)) {
    if (key.includes(mapKey) || mapKey.includes(key)) {
      return category
    }
  }

  return null
}

/**
 * Save a merchant → category mapping (user learning).
 * @param {string} rawName   — original merchant/description
 * @param {string} categoryId — the category the user assigned
 */
export function saveMerchantCategory(rawName, categoryId) {
  const key = normalise(rawName)
  if (!key || !categoryId) return
  const map = loadMap()
  map[key] = categoryId
  saveMap(map)
}

/**
 * Batch-save multiple merchant→category pairs after an import.
 * @param {Array<{name: string, categoryId: string}>} pairs
 */
export function saveMerchantCategories(pairs) {
  if (!pairs?.length) return
  const map = loadMap()
  for (const { name, categoryId } of pairs) {
    const key = normalise(name)
    if (key && categoryId) map[key] = categoryId
  }
  saveMap(map)
}

/** Return the full user-saved map (for debug / settings export) */
export function getAllMerchantMappings() {
  return loadMap()
}

/** Clear all learned merchant mappings */
export function clearMerchantMappings() {
  localStorage.removeItem(STORAGE_KEY)
}
