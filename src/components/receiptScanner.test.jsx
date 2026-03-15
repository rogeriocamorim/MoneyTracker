import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock framer-motion
vi.mock('framer-motion', () => {
  const React = require('react')
  return {
    motion: new Proxy({}, {
      get: (_, tag) => React.forwardRef((props, ref) => {
        const { initial, animate, exit, variants, transition, whileHover, whileTap, layout, ...rest } = props
        return React.createElement(tag, { ...rest, ref })
      }),
    }),
    AnimatePresence: ({ children }) => React.createElement(require('react').Fragment, null, children),
  }
})

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: () => null,
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

// Mock URL.createObjectURL for jsdom
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:fake-url')
}

// Mock tesseract.js — the recognize function
const mockRecognize = vi.fn()
vi.mock('tesseract.js', () => ({
  default: {
    recognize: (...args) => mockRecognize(...args),
  },
}))

// ─── ReceiptScanner parseReceiptText (via component) ─────────────────────────

describe('ReceiptScanner parseReceiptText', () => {
  let ReceiptScanner

  beforeEach(async () => {
    ReceiptScanner = (await import('./ReceiptScanner')).default
    mockRecognize.mockReset()
    localStorage.clear()
  })

  // Helper: render scanner, upload fake image, click "Scan Receipt", then "Use This Data"
  async function testParseReceipt(ocrText, expectedFields) {
    const onExtracted = vi.fn()
    const onClose = vi.fn()

    mockRecognize.mockResolvedValue({
      data: { text: ocrText },
    })

    render(<ReceiptScanner onExtracted={onExtracted} onClose={onClose} />)

    // Simulate file upload to set the image state
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]:not([capture])')
    const file = new File(['fake-image'], 'receipt.jpg', { type: 'image/jpeg' })
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)

    // After upload, image preview should show and "Scan Receipt" button appears (in the action area)
    // The component has two "Scan Receipt" texts — one in the header, one as the action button
    // Wait for the action button to appear
    await waitFor(() => {
      // The action area has "Choose Another" and "Scan Receipt" buttons
      expect(screen.getByText('Choose Another')).toBeInTheDocument()
    })

    // Click the "Scan Receipt" button in the action area (it's the one with Camera icon)
    const scanButtons = screen.getAllByText(/Scan Receipt/i)
    // The action button is the one inside the btn-primary class
    const actionBtn = scanButtons.find(el => el.closest('button')?.classList.contains('btn-primary'))
    await userEvent.click(actionBtn || scanButtons[scanButtons.length - 1])

    // Wait for processing to complete — "Use This Data" button should appear
    await waitFor(() => {
      expect(screen.getByText('Use This Data')).toBeInTheDocument()
    })

    // Click "Use This Data" to trigger onExtracted
    await userEvent.click(screen.getByText('Use This Data'))

    expect(onExtracted).toHaveBeenCalled()
    const result = onExtracted.mock.calls[0][0]

    // Check expected fields
    for (const [key, value] of Object.entries(expectedFields)) {
      expect(result[key]).toBe(value)
    }

    return result
  }

  it('Strategy 1: extracts total from amount before dashed line', async () => {
    const ocrText = `COSTCO WHOLESALE
Item 1    5.99
Item 2    12.50
20.89
----
VISA     20.89`

    await testParseReceipt(ocrText, { total: 20.89 })
  })

  it('Strategy 2: extracts total from AMOUNT pattern', async () => {
    const ocrText = `Store Name
AMOUNT: $45.67
Thank you`

    await testParseReceipt(ocrText, { total: 45.67 })
  })

  it('Strategy 3: extracts total from *TOTAL pattern', async () => {
    const ocrText = `Store Name
Item 1    5.99
***TOTAL: 35.50
Thank you`

    await testParseReceipt(ocrText, { total: 35.50 })
  })

  it('Strategy 4: extracts total from card payment line', async () => {
    const ocrText = `Store Name
Items purchased
Mastercard: 78.25
Thank you`

    await testParseReceipt(ocrText, { total: 78.25, paymentMethod: 'mastercard' })
  })

  it('Strategy 5: extracts total from APPROVED line', async () => {
    const ocrText = `Store Name
Some items
APPROVED 92.15
Thank you`

    await testParseReceipt(ocrText, { total: 92.15 })
  })

  it('Strategy 6: falls back to largest reasonable amount', async () => {
    const ocrText = `Store Name
Item 1    5.99
Item 2    8.50
Item 3    15.00
25.49
Tax 3.31`

    await testParseReceipt(ocrText, { total: 25.49 })
  })

  it('extracts date in YYYY/MM/DD format', async () => {
    const ocrText = `Store Name
2025/06/15
TOTAL 50.00`

    await testParseReceipt(ocrText, { date: '2025-06-15', total: 50.00 })
  })

  it('detects visa payment method', async () => {
    const ocrText = `Store Name
TOTAL 50.00
Visa ending 5678`

    await testParseReceipt(ocrText, { paymentMethod: 'visa' })
  })

  it('detects store name from first 5 lines', async () => {
    const ocrText = `COSTCO WHOLESALE #123
Some address line
2025/06/15
TOTAL 50.00`

    await testParseReceipt(ocrText, { description: 'COSTCO WHOLESALE #123' })
  })
})

// ─── MobileScannerPage ───────────────────────────────────────────────────────

describe('MobileScannerPage', () => {
  let MobileScannerPage

  beforeEach(async () => {
    MobileScannerPage = (await import('./MobileScannerPage')).default
    localStorage.clear()
  })

  it('saves receipt for desktop and shows success', async () => {
    const user = userEvent.setup()
    render(<MobileScannerPage />)

    // Simulate file upload — MobileScannerPage uses FileReader to convert to base64
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]:not([capture])')
    const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' })
    const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' })

    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)

    // Wait for image preview to appear (FileReader is async)
    await waitFor(() => {
      expect(screen.getByText('Send to Desktop')).toBeInTheDocument()
    })

    // Click "Send to Desktop"
    await user.click(screen.getByText('Send to Desktop'))

    // Should show "Photo Saved!" after saving
    await waitFor(() => {
      expect(screen.getByText('Photo Saved!')).toBeInTheDocument()
    })

    // Check localStorage was set
    const stored = JSON.parse(localStorage.getItem('moneytracker_pending_receipt'))
    expect(stored).toBeTruthy()
    expect(stored.source).toBe('phone')
    expect(stored.timestamp).toBeTruthy()
  })

  it('resets state when "Take Another Photo" is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileScannerPage />)

    // Upload a file first
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]:not([capture])')
    const file = new File([new Blob(['fake'])], 'receipt.jpg', { type: 'image/jpeg' })
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText('Take Another Photo')).toBeInTheDocument()
    })

    // Click "Take Another Photo"
    await user.click(screen.getByText('Take Another Photo'))

    // Should go back to initial state with "Take Photo" button
    await waitFor(() => {
      expect(screen.getByText('Take Photo')).toBeInTheDocument()
    })
  })
})
