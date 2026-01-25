import { useState, useCallback, useRef, useEffect } from 'react'
import { saveToGoogleDrive, isSignedIn } from '../utils/googleDrive'

const DEBOUNCE_MS = 2000 // 2 seconds debounce

export function useGoogleDriveSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [syncError, setSyncError] = useState(null)
  const debounceTimerRef = useRef(null)
  const pendingDataRef = useRef(null)

  // Check if connected to Google Drive
  const checkConnection = useCallback(() => {
    try {
      return isSignedIn()
    } catch {
      return false
    }
  }, [])

  // Perform the actual sync
  const performSync = useCallback(async (data) => {
    if (!checkConnection()) {
      return false
    }

    setIsSyncing(true)
    setSyncError(null)

    try {
      await saveToGoogleDrive(data)
      setLastSyncTime(Date.now())
      return true
    } catch (error) {
      console.error('Google Drive sync failed:', error)
      setSyncError(error.message)
      return false
    } finally {
      setIsSyncing(false)
    }
  }, [checkConnection])

  // Debounced sync function
  const syncToGoogleDrive = useCallback((data) => {
    // Store the latest data to sync
    pendingDataRef.current = data

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        performSync(pendingDataRef.current)
        pendingDataRef.current = null
      }
    }, DEBOUNCE_MS)
  }, [performSync])

  // Immediate sync (no debounce)
  const syncNow = useCallback(async (data) => {
    // Clear any pending debounced sync
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    pendingDataRef.current = null

    return performSync(data)
  }, [performSync])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    syncToGoogleDrive,  // Debounced sync
    syncNow,            // Immediate sync
    isSyncing,
    lastSyncTime,
    syncError,
    isConnected: checkConnection,
  }
}
