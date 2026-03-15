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
    <div className="min-h-screen min-h-dvh p-4" style={{ backgroundColor: 'var(--color-bg-base, #f8f7f4)' }}>
      <Toaster position="top-center" />
      
      <motion.div 
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent, #6366f1)' }}>
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary, #1a1a1a)' }}>Receipt Scanner</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted, #94918b)' }}>Take photo for desktop</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl p-6 border" style={{ backgroundColor: 'var(--color-bg-elevated, #ffffff)', borderColor: 'var(--color-border, #e5e2dc)', boxShadow: 'var(--shadow-card)' }}>
          {!imagePreview ? (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-muted, rgba(99, 102, 241, 0.1))' }}>
                  <Camera className="w-10 h-10" style={{ color: 'var(--color-accent, #6366f1)' }} />
                </div>
                <p className="font-medium" style={{ color: 'var(--color-text-primary, #1a1a1a)' }}>Take a photo of your receipt</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted, #94918b)' }}>
                  It will be sent to your desktop for processing
                </p>
              </div>

              {/* Camera Button (Primary) */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-6 rounded-2xl text-white font-medium flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                style={{ backgroundColor: 'var(--color-accent, #6366f1)', boxShadow: '0 4px 14px -3px rgba(99, 102, 241, 0.4)' }}
              >
                <Camera className="w-10 h-10" />
                <span className="text-lg">Take Photo</span>
              </button>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform border"
                style={{ backgroundColor: 'var(--color-bg-muted, #f1f0ec)', color: 'var(--color-text-primary, #1a1a1a)', borderColor: 'var(--color-border, #e5e2dc)' }}
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
              <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-muted, #f1f0ec)' }}>
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
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-success-muted, rgba(22, 163, 74, 0.08))' }}>
                    <Check className="w-8 h-8" style={{ color: 'var(--color-success, #16a34a)' }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text-primary, #1a1a1a)' }}>Photo Saved!</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted, #94918b)' }}>
                    Open the app on your desktop.<br />
                    Click "Scan Receipt" &rarr; "Get Photo from Phone"
                  </p>
                  
                  <div className="mt-6 p-4 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-muted, #f1f0ec)', borderColor: 'var(--color-border, #e5e2dc)' }}>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary, #525252)' }}>
                      <Cloud className="w-4 h-4" />
                      <span>Same browser/device sync via localStorage</span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted, #94918b)' }}>
                      For cross-device sync, use Google Drive in Settings
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={saveForDesktop}
                    className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-success, #16a34a)', boxShadow: '0 4px 14px -3px rgba(22, 163, 74, 0.4)' }}
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
                    className="w-full py-3 rounded-xl font-medium border"
                    style={{ backgroundColor: 'var(--color-bg-muted, #f1f0ec)', color: 'var(--color-text-secondary, #525252)', borderColor: 'var(--color-border, #e5e2dc)' }}
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
          <div className="mt-6 rounded-2xl p-4 border" style={{ backgroundColor: 'var(--color-bg-elevated, #ffffff)', borderColor: 'var(--color-border, #e5e2dc)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary, #1a1a1a)' }}>For best results</h3>
            <ul className="text-xs space-y-1" style={{ color: 'var(--color-text-muted, #94918b)' }}>
              <li>Good lighting, no shadows</li>
              <li>Keep receipt flat and straight</li>
              <li>Make sure total amount is visible</li>
              <li>Include the full receipt if possible</li>
            </ul>
          </div>
        )}

        {/* Back Link */}
        <a 
          href="#/"
          className="flex items-center justify-center gap-2 mt-6 text-sm"
          style={{ color: 'var(--color-text-muted, #94918b)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </a>
      </motion.div>
    </div>
  )
}
