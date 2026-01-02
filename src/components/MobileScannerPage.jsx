import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Check, Receipt, ArrowLeft, Cloud, Loader2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const STORAGE_KEY = 'moneytracker_pending_receipt'

export default function MobileScannerPage() {
  const [imagePreview, setImagePreview] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Convert to base64 for storage
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
        setSaved(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const saveForDesktop = async () => {
    if (!imagePreview) return
    
    setIsSaving(true)
    
    try {
      // Save to localStorage
      const pendingReceipt = {
        image: imagePreview,
        timestamp: new Date().toISOString(),
        source: 'phone'
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingReceipt))
      
      setSaved(true)
      toast.success('Photo saved! Open app on desktop to process.')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save. Try again.')
    } finally {
      setIsSaving(false)
    }
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
            <p className="text-sm text-purple-200/70">Take photo for desktop</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          {!imagePreview ? (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-purple-300" />
                </div>
                <p className="text-white font-medium">Take a photo of your receipt</p>
                <p className="text-sm text-purple-200/60 mt-1">
                  It will be sent to your desktop for processing
                </p>
              </div>

              {/* Camera Button (Primary) */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-medium flex flex-col items-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-purple-500/30"
              >
                <Camera className="w-10 h-10" />
                <span className="text-lg">Take Photo</span>
              </button>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Upload className="w-5 h-5" />
                Choose from Gallery
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
              <div className="relative rounded-2xl overflow-hidden bg-black/30">
                <img
                  src={imagePreview}
                  alt="Receipt"
                  className="w-full max-h-72 object-contain"
                />
              </div>

              {/* Actions */}
              {saved ? (
                <motion.div 
                  className="text-center py-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Photo Saved!</h3>
                  <p className="text-purple-200/70 text-sm">
                    Open the app on your desktop.<br />
                    Click "Scan Receipt" → "Get Photo from Phone"
                  </p>
                  
                  <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-purple-200/80 text-sm">
                      <Cloud className="w-4 h-4" />
                      <span>Same browser/device sync via localStorage</span>
                    </div>
                    <p className="text-xs text-purple-200/50 mt-2">
                      For cross-device sync, use Google Drive in Settings
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={saveForDesktop}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 disabled:opacity-50"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Cloud className="w-5 h-5" />
                    )}
                    {isSaving ? 'Saving...' : 'Send to Desktop'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setImagePreview(null)
                      setSaved(false)
                    }}
                    className="w-full py-3 rounded-xl bg-white/5 text-white/70 font-medium"
                  >
                    Take Another Photo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tips */}
        {!imagePreview && (
          <div className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-2">📸 For best results</h3>
            <ul className="text-xs text-purple-200/70 space-y-1">
              <li>• Good lighting, no shadows</li>
              <li>• Keep receipt flat and straight</li>
              <li>• Make sure total amount is visible</li>
              <li>• Include the full receipt if possible</li>
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
