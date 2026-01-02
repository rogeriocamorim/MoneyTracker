import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, Loader2, Check, AlertCircle, Receipt, Circle, Smartphone, Copy, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Tesseract from 'tesseract.js'
import toast from 'react-hot-toast'

const PENDING_RECEIPT_KEY = 'moneytracker_pending_receipt'

export default function ReceiptScanner({ onExtracted, onClose }) {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedData, setExtractedData] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [hasPendingReceipt, setHasPendingReceipt] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  // Generate URL for mobile scanning
  const mobileUrl = `${window.location.origin}${window.location.pathname}#/scan-receipt`
  
  // Check for pending receipt from phone
  useEffect(() => {
    const checkPendingReceipt = () => {
      const pending = localStorage.getItem(PENDING_RECEIPT_KEY)
      setHasPendingReceipt(!!pending)
    }
    checkPendingReceipt()
    
    // Listen for storage changes (in case phone tab is open)
    window.addEventListener('storage', checkPendingReceipt)
    return () => window.removeEventListener('storage', checkPendingReceipt)
  }, [])
  
  // Load pending receipt from phone
  const loadPendingReceipt = () => {
    try {
      const pending = localStorage.getItem(PENDING_RECEIPT_KEY)
      if (pending) {
        const { image: base64Image, timestamp } = JSON.parse(pending)
        
        // Convert base64 to blob
        fetch(base64Image)
          .then(res => res.blob())
          .then(blob => {
            setImage(blob)
            setImagePreview(base64Image)
            setExtractedData(null)
            
            // Clear the pending receipt
            localStorage.removeItem(PENDING_RECEIPT_KEY)
            setHasPendingReceipt(false)
            
            toast.success('Photo loaded from phone!')
          })
      }
    } catch (error) {
      console.error('Error loading pending receipt:', error)
      toast.error('Failed to load photo')
    }
  }

  // Detect mobile device
  useEffect(() => {
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setIsMobile(checkMobile)
  }, [])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  // Start camera for desktop
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      setCameraStream(stream)
      setShowCamera(true)
      
      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (err) {
      console.error('Camera error:', err)
      toast.error('Could not access camera. Please upload a file instead.')
    }
  }

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      if (blob) {
        setImage(blob)
        setImagePreview(URL.createObjectURL(blob))
        setExtractedData(null)
        
        // Stop camera
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop())
          setCameraStream(null)
        }
        setShowCamera(false)
        toast.success('Photo captured!')
      }
    }, 'image/jpeg', 0.9)
  }, [cameraStream])

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  // Handle "Take Photo" button click
  const handleTakePhoto = () => {
    if (isMobile) {
      // On mobile, use the native camera input
      cameraInputRef.current?.click()
    } else {
      // On desktop, start webcam
      startCamera()
    }
  }

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
    const fullText = text.replace(/\n/g, ' ')
    
    // Find total amount - multiple strategies
    let total = null
    
    // Strategy 1: Look for explicit AMOUNT: $XXX.XX pattern (most reliable)
    const amountMatch = fullText.match(/AMOUNT[:\s]*\$?\s*([\d,]+\.\d{2})/i)
    if (amountMatch) {
      total = parseFloat(amountMatch[1].replace(',', ''))
    }
    
    // Strategy 2: Look for **** TOTAL pattern (Costco style)
    if (!total) {
      const starTotalMatch = fullText.match(/\*+\s*TOTAL[:\s]*\$?\s*([\d,]+\.\d{2})/i)
      if (starTotalMatch) {
        total = parseFloat(starTotalMatch[1].replace(',', ''))
      }
    }
    
    // Strategy 3: Look for MasterCard/Visa followed by amount
    if (!total) {
      const cardMatch = fullText.match(/(?:mastercard|visa|debit)[:\s]*([\d,]+\.\d{2})/i)
      if (cardMatch) {
        total = parseFloat(cardMatch[1].replace(',', ''))
      }
    }
    
    // Strategy 4: Standard TOTAL patterns
    if (!total) {
      const totalPatterns = [
        /TOTAL[:\s]+\$?\s*([\d,]+\.\d{2})/i,
        /GRAND\s*TOTAL[:\s]*\$?\s*([\d,]+\.\d{2})/i,
        /BALANCE\s*DUE[:\s]*\$?\s*([\d,]+\.\d{2})/i,
      ]
      
      for (const pattern of totalPatterns) {
        const match = fullText.match(pattern)
        if (match) {
          const value = parseFloat(match[1].replace(',', ''))
          if (value && value > 0) {
            total = value
            break
          }
        }
      }
    }
    
    // Strategy 5: Find largest dollar amount as fallback
    if (!total) {
      const allAmounts = fullText.match(/\$?\s*([\d,]+\.\d{2})/g) || []
      const values = allAmounts
        .map(a => parseFloat(a.replace(/[$,\s]/g, '')))
        .filter(v => v > 0 && v < 10000) // Reasonable receipt range
      if (values.length > 0) {
        total = Math.max(...values)
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

          {/* Camera View (Desktop) */}
          {showCamera && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-80 object-contain"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={stopCamera}
                    className="btn btn-secondary"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-[var(--color-accent)] flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <Circle className="w-12 h-12 text-[var(--color-danger)] fill-current" />
                  </button>
                </div>
              </div>
              <p className="text-center text-[13px] text-[var(--color-text-muted)]">
                Position your receipt in the frame and click the capture button
              </p>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Upload Area */}
          {!imagePreview && !showCamera ? (
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

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                >
                  <Upload className="w-4 h-4" /> Upload File
                </button>
                <button
                  onClick={handleTakePhoto}
                  className="btn btn-primary"
                >
                  <Camera className="w-4 h-4" /> Take Photo
                </button>
              </div>

              {/* Get Photo from Phone - show prominently if available */}
              {hasPendingReceipt && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/30 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[var(--color-text-primary)] font-medium">Photo from Phone Ready!</p>
                      <p className="text-[12px] text-[var(--color-text-muted)]">A receipt photo is waiting</p>
                    </div>
                  </div>
                  <button
                    onClick={loadPendingReceipt}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Load Photo & Process
                  </button>
                </motion.div>
              )}

              {/* Scan with Phone option */}
              <div className="pt-4 border-t border-[var(--color-border)]">
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-[var(--color-text-primary)] font-medium flex items-center justify-center gap-2 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                >
                  <Smartphone className="w-5 h-5 text-purple-400" />
                  {showQRCode ? 'Hide QR Code' : '📱 Scan with Phone Instead'}
                </button>
                
                {showQRCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 text-center"
                  >
                    <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                      <QRCodeSVG 
                        value={mobileUrl} 
                        size={180}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-[13px] text-[var(--color-text-muted)] mt-3">
                      1. Scan QR code with your phone
                    </p>
                    <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                      2. Take photo → Click "Send to Desktop"
                    </p>
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      3. Come back here and click "Load Photo"
                    </p>
                    
                    <div className="flex gap-2 justify-center mt-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(mobileUrl)
                          toast.success('Link copied to clipboard!')
                        }}
                        className="btn btn-ghost text-[13px]"
                      >
                        <Copy className="w-3 h-3" /> Copy Link
                      </button>
                      <button
                        onClick={loadPendingReceipt}
                        className="btn btn-primary text-[13px]"
                        disabled={!hasPendingReceipt}
                      >
                        <Download className="w-3 h-3" /> Load Photo
                      </button>
                    </div>
                  </motion.div>
                )}
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
          ) : !showCamera && (
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

          {/* Tips - hide when camera is active */}
          {!showCamera && (
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
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

