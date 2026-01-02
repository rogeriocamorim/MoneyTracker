import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, Loader2, Check, AlertCircle, Receipt } from 'lucide-react'
import Tesseract from 'tesseract.js'
import toast from 'react-hot-toast'

export default function ReceiptScanner({ onExtracted, onClose }) {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedData, setExtractedData] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
      setExtractedData(null)
    }
  }

  const parseReceiptText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    
    // Find total amount - look for patterns like "TOTAL $121.03" or "**** TOTAL 121.03"
    let total = null
    const totalPatterns = [
      /(?:total|amount)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
      /\*+\s*total[:\s]*\$?\s*([\d,]+\.?\d*)/i,
      /amount[:\s]*\$?\s*([\d,]+\.?\d*)/i,
      /\$\s*([\d,]+\.\d{2})\s*$/m, // Dollar amount at end of line
    ]
    
    for (const line of lines) {
      for (const pattern of totalPatterns) {
        const match = line.match(pattern)
        if (match) {
          const value = parseFloat(match[1].replace(',', ''))
          // Take the largest "total" found (usually the grand total)
          if (value && (!total || value > total)) {
            total = value
          }
        }
      }
    }

    // Find date - various formats
    let date = null
    const datePatterns = [
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // 2025/12/29 or 2025-12-29
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // 12/29/2025 or 12-29-2025
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/, // 12/29/25
    ]
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern)
        if (match) {
          // Try to parse the date
          let year, month, day
          if (match[1].length === 4) {
            // YYYY/MM/DD format
            year = parseInt(match[1])
            month = parseInt(match[2])
            day = parseInt(match[3])
          } else if (match[3].length === 4) {
            // MM/DD/YYYY format
            month = parseInt(match[1])
            day = parseInt(match[2])
            year = parseInt(match[3])
          } else {
            // MM/DD/YY format
            month = parseInt(match[1])
            day = parseInt(match[2])
            year = 2000 + parseInt(match[3])
          }
          
          if (year >= 2020 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            break
          }
        }
      }
      if (date) break
    }

    // Find payment method
    let paymentMethod = 'bank' // default
    const textLower = text.toLowerCase()
    if (textLower.includes('mastercard') || textLower.includes('master card') || textLower.includes('mc ')) {
      paymentMethod = 'mastercard'
    } else if (textLower.includes('visa')) {
      paymentMethod = 'visa'
    } else if (textLower.includes('debit') || textLower.includes('interac')) {
      paymentMethod = 'bank'
    }

    // Try to find store name (usually at top)
    let description = ''
    const storePatterns = [
      /costco/i, /walmart/i, /superstore/i, /safeway/i, /sobeys/i, 
      /amazon/i, /best buy/i, /home depot/i, /canadian tire/i,
      /shoppers/i, /loblaws/i, /metro/i, /no frills/i, /save-on/i
    ]
    
    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      for (const pattern of storePatterns) {
        if (pattern.test(line)) {
          description = line.split(/\s+/).slice(0, 3).join(' ')
          break
        }
      }
      if (description) break
    }

    return { total, date, paymentMethod, description }
  }

  const processReceipt = async () => {
    if (!image) return

    setIsProcessing(true)
    setProgress(0)

    try {
      const result = await Tesseract.recognize(image, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })

      const text = result.data.text
      console.log('OCR Result:', text)
      
      const extracted = parseReceiptText(text)
      setExtractedData(extracted)

      if (!extracted.total) {
        toast.error('Could not find total amount. Please enter manually.')
      } else {
        toast.success(`Found total: $${extracted.total.toFixed(2)}`)
      }
    } catch (error) {
      console.error('OCR Error:', error)
      toast.error('Failed to process receipt')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUseData = () => {
    if (extractedData) {
      onExtracted(extractedData)
      onClose()
    }
  }

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
          className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Scan Receipt
                </h2>
                <p className="text-[13px] text-[var(--color-text-muted)]">
                  Upload a photo to extract details
                </p>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Upload Area */}
          {!imagePreview ? (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:border-[var(--color-accent)] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                <p className="text-[var(--color-text-primary)] font-medium">
                  Click to upload receipt image
                </p>
                <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                  or drag and drop
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary flex-1"
                >
                  <Upload className="w-4 h-4" /> Choose File
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="btn btn-primary flex-1"
                >
                  <Camera className="w-4 h-4" /> Take Photo
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-xl overflow-hidden bg-[var(--color-bg-muted)]">
                <img
                  src={imagePreview}
                  alt="Receipt"
                  className="w-full max-h-64 object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                    <p className="text-white font-medium">Processing... {progress}%</p>
                    <div className="w-48 h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Data */}
              {extractedData && (
                <div className="bg-[var(--color-bg-muted)] rounded-xl p-4 space-y-3">
                  <h3 className="font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" /> Extracted Data
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <span className="text-[var(--color-text-muted)]">Total:</span>
                      <span className="ml-2 font-mono font-bold text-[var(--color-danger)]">
                        {extractedData.total ? `$${extractedData.total.toFixed(2)}` : 'Not found'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Date:</span>
                      <span className="ml-2 font-mono">
                        {extractedData.date || 'Not found'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Payment:</span>
                      <span className="ml-2 capitalize">
                        {extractedData.paymentMethod}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Store:</span>
                      <span className="ml-2">
                        {extractedData.description || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {!extractedData.total && (
                    <div className="flex items-center gap-2 text-[13px] text-amber-500">
                      <AlertCircle className="w-4 h-4" />
                      Could not detect total. You can still use other data.
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setImage(null)
                    setImagePreview(null)
                    setExtractedData(null)
                  }}
                  className="btn btn-secondary flex-1"
                  disabled={isProcessing}
                >
                  Choose Another
                </button>
                
                {!extractedData ? (
                  <button
                    onClick={processReceipt}
                    className="btn btn-primary flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" /> Scan Receipt
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleUseData}
                    className="btn btn-primary flex-1"
                  >
                    <Check className="w-4 h-4" /> Use This Data
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mt-6 p-4 bg-[var(--color-bg-muted)] rounded-xl">
            <h4 className="text-[13px] font-medium text-[var(--color-text-primary)] mb-2">
              📸 Tips for best results:
            </h4>
            <ul className="text-[12px] text-[var(--color-text-muted)] space-y-1">
              <li>• Good lighting, avoid shadows</li>
              <li>• Keep receipt flat, avoid wrinkles</li>
              <li>• Include the total amount in frame</li>
              <li>• Works best with printed receipts</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

