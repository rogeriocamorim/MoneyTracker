import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Loader2, Check, AlertCircle, Receipt, ArrowLeft, Copy, Save } from 'lucide-react'
import Tesseract from 'tesseract.js'
import toast, { Toaster } from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { format } from 'date-fns'

export default function MobileScannerPage() {
  const { state, addExpense } = useMoney()
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedData, setExtractedData] = useState(null)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
      setExtractedData(null)
      setSaved(false)
    }
  }

  const parseReceiptText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    
    // Find total amount
    let total = null
    const totalPatterns = [
      /(?:total|amount)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
      /\*+\s*total[:\s]*\$?\s*([\d,]+\.?\d*)/i,
      /amount[:\s]*\$?\s*([\d,]+\.?\d*)/i,
      /\$\s*([\d,]+\.\d{2})\s*$/m,
    ]
    
    for (const line of lines) {
      for (const pattern of totalPatterns) {
        const match = line.match(pattern)
        if (match) {
          const value = parseFloat(match[1].replace(',', ''))
          if (value && (!total || value > total)) {
            total = value
          }
        }
      }
    }

    // Find date
    let date = null
    const datePatterns = [
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,
    ]
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern)
        if (match) {
          let year, month, day
          if (match[1].length === 4) {
            year = parseInt(match[1])
            month = parseInt(match[2])
            day = parseInt(match[3])
          } else if (match[3].length === 4) {
            month = parseInt(match[1])
            day = parseInt(match[2])
            year = parseInt(match[3])
          } else {
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
    let paymentMethod = 'bank'
    const textLower = text.toLowerCase()
    if (textLower.includes('mastercard') || textLower.includes('master card')) {
      paymentMethod = 'mastercard'
    } else if (textLower.includes('visa')) {
      paymentMethod = 'visa'
    }

    // Find store name
    let description = ''
    const storePatterns = [
      /costco/i, /walmart/i, /superstore/i, /safeway/i, /sobeys/i, 
      /amazon/i, /best buy/i, /home depot/i, /canadian tire/i,
      /shoppers/i, /loblaws/i, /metro/i, /no frills/i, /save-on/i
    ]
    
    for (const line of lines.slice(0, 5)) {
      for (const pattern of storePatterns) {
        if (pattern.test(line)) {
          description = line.split(/\s+/).slice(0, 3).join(' ')
          break
        }
      }
      if (description) break
    }

    return { total, date: date || format(new Date(), 'yyyy-MM-dd'), paymentMethod, description }
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

      const extracted = parseReceiptText(result.data.text)
      setExtractedData(extracted)

      if (!extracted.total) {
        toast.error('Could not find total amount')
      } else {
        toast.success(`Found: $${extracted.total.toFixed(2)}`)
      }
    } catch (error) {
      console.error('OCR Error:', error)
      toast.error('Failed to process receipt')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveExpense = () => {
    if (!extractedData || !extractedData.total) {
      toast.error('No amount to save')
      return
    }

    addExpense({
      date: extractedData.date,
      amount: extractedData.total,
      category: 'uncategorized',
      description: extractedData.description || 'Scanned receipt',
      paymentMethod: extractedData.paymentMethod,
    })

    setSaved(true)
    toast.success('Expense saved! Sync via Google Drive on desktop.')
  }

  const copyToClipboard = () => {
    if (!extractedData) return
    
    const text = `Amount: $${extractedData.total?.toFixed(2) || 'N/A'}
Date: ${extractedData.date || 'N/A'}
Payment: ${extractedData.paymentMethod}
Store: ${extractedData.description || 'Unknown'}`
    
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Toaster position="top-center" />
      
      <motion.div 
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Receipt Scanner</h1>
            <p className="text-sm text-purple-200/70">Take a photo to scan</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          {!imagePreview ? (
            <div className="space-y-4">
              {/* Camera Button (Primary) */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-8 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-medium flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
              >
                <Camera className="w-12 h-12" />
                <span className="text-lg">Take Photo</span>
              </button>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Upload className="w-5 h-5" />
                Upload from Gallery
              </button>

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
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Receipt"
                  className="w-full max-h-64 object-contain bg-black/50"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
                    <p className="text-white font-medium">Scanning... {progress}%</p>
                    <div className="w-48 h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Data */}
              {extractedData && (
                <motion.div 
                  className="bg-white/10 rounded-2xl p-4 space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Data Extracted</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-black/20 rounded-xl p-3">
                      <div className="text-purple-200/70 text-xs mb-1">Total</div>
                      <div className="text-white font-bold text-lg">
                        ${extractedData.total?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                      <div className="text-purple-200/70 text-xs mb-1">Date</div>
                      <div className="text-white font-medium">
                        {extractedData.date}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                      <div className="text-purple-200/70 text-xs mb-1">Payment</div>
                      <div className="text-white font-medium capitalize">
                        {extractedData.paymentMethod}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                      <div className="text-purple-200/70 text-xs mb-1">Store</div>
                      <div className="text-white font-medium">
                        {extractedData.description || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  {!extractedData.total && (
                    <div className="flex items-center gap-2 text-sm text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      Could not detect total amount
                    </div>
                  )}
                </motion.div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {!extractedData ? (
                  <button
                    onClick={processReceipt}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    {isProcessing ? 'Processing...' : 'Scan Receipt'}
                  </button>
                ) : saved ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-green-400 font-medium">
                      <Check className="w-5 h-5" />
                      Saved! Sync via Google Drive
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleSaveExpense}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center justify-center gap-2"
                      disabled={!extractedData.total}
                    >
                      <Save className="w-5 h-5" />
                      Save as Expense
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="w-full py-3 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setImage(null)
                    setImagePreview(null)
                    setExtractedData(null)
                    setSaved(false)
                  }}
                  className="w-full py-3 rounded-xl bg-white/5 text-white/70 font-medium"
                >
                  Scan Another Receipt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        {!imagePreview && (
          <div className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-2">📸 Tips</h3>
            <ul className="text-xs text-purple-200/70 space-y-1">
              <li>• Good lighting, avoid shadows</li>
              <li>• Keep receipt flat</li>
              <li>• Include total amount</li>
            </ul>
          </div>
        )}

        {/* Back Link */}
        <a 
          href="#/"
          className="flex items-center justify-center gap-2 mt-6 text-purple-200/70 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </a>
      </motion.div>
    </div>
  )
}

