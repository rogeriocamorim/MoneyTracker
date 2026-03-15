import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock the googleDrive module
vi.mock('../utils/googleDrive', () => ({
  saveToGoogleDrive: vi.fn(),
  isSignedIn: vi.fn(() => false),
}))

import { useGoogleDriveSync } from './useGoogleDriveSync'
import { saveToGoogleDrive, isSignedIn } from '../utils/googleDrive'

describe('useGoogleDriveSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounced sync waits 2 seconds before calling saveToGoogleDrive', async () => {
    isSignedIn.mockReturnValue(true)
    saveToGoogleDrive.mockResolvedValue({})

    const { result } = renderHook(() => useGoogleDriveSync())
    const data = { expenses: [], income: [] }

    // Call debounced sync
    act(() => {
      result.current.syncToGoogleDrive(data)
    })

    // Should NOT have called save yet
    expect(saveToGoogleDrive).not.toHaveBeenCalled()

    // Advance 2 seconds
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    // Now it should have been called
    expect(saveToGoogleDrive).toHaveBeenCalledWith(data)
  })

  it('debounced sync resets timer on multiple rapid calls', async () => {
    isSignedIn.mockReturnValue(true)
    saveToGoogleDrive.mockResolvedValue({})

    const { result } = renderHook(() => useGoogleDriveSync())
    const data1 = { expenses: [1] }
    const data2 = { expenses: [2] }
    const data3 = { expenses: [3] }

    // Call sync 3 times rapidly
    act(() => {
      result.current.syncToGoogleDrive(data1)
    })
    act(() => {
      vi.advanceTimersByTime(500)
      result.current.syncToGoogleDrive(data2)
    })
    act(() => {
      vi.advanceTimersByTime(500)
      result.current.syncToGoogleDrive(data3)
    })

    // Not called yet (timer keeps resetting)
    expect(saveToGoogleDrive).not.toHaveBeenCalled()

    // Advance full 2 seconds from last call
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    // Should have only been called once with the latest data
    expect(saveToGoogleDrive).toHaveBeenCalledTimes(1)
    expect(saveToGoogleDrive).toHaveBeenCalledWith(data3)
  })

  it('syncNow calls saveToGoogleDrive immediately', async () => {
    isSignedIn.mockReturnValue(true)
    saveToGoogleDrive.mockResolvedValue({})

    const { result } = renderHook(() => useGoogleDriveSync())
    const data = { expenses: [], income: [] }

    await act(async () => {
      await result.current.syncNow(data)
    })

    expect(saveToGoogleDrive).toHaveBeenCalledWith(data)
  })

  it('syncNow cancels pending debounced sync', async () => {
    isSignedIn.mockReturnValue(true)
    saveToGoogleDrive.mockResolvedValue({})

    const { result } = renderHook(() => useGoogleDriveSync())
    const debouncedData = { expenses: [1] }
    const immediateData = { expenses: [2] }

    // Start a debounced sync
    act(() => {
      result.current.syncToGoogleDrive(debouncedData)
    })

    // Immediately sync with different data (should cancel debounced)
    await act(async () => {
      await result.current.syncNow(immediateData)
    })

    // Only the immediate data should have been synced
    expect(saveToGoogleDrive).toHaveBeenCalledTimes(1)
    expect(saveToGoogleDrive).toHaveBeenCalledWith(immediateData)

    // Advance past debounce timer — should NOT trigger another sync
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(saveToGoogleDrive).toHaveBeenCalledTimes(1)
  })

  it('does not sync when not signed in', async () => {
    isSignedIn.mockReturnValue(false)

    const { result } = renderHook(() => useGoogleDriveSync())
    const data = { expenses: [] }

    await act(async () => {
      const success = await result.current.syncNow(data)
      expect(success).toBe(false)
    })

    expect(saveToGoogleDrive).not.toHaveBeenCalled()
  })

  it('updates lastSyncTime after successful sync', async () => {
    isSignedIn.mockReturnValue(true)
    saveToGoogleDrive.mockResolvedValue({})

    const { result } = renderHook(() => useGoogleDriveSync())

    expect(result.current.lastSyncTime).toBeNull()

    await act(async () => {
      await result.current.syncNow({ expenses: [] })
    })

    expect(result.current.lastSyncTime).not.toBeNull()
  })

  it('sets syncError on failure', async () => {
    isSignedIn.mockReturnValue(true)
    saveToGoogleDrive.mockRejectedValue(new Error('Network failure'))

    const { result } = renderHook(() => useGoogleDriveSync())

    await act(async () => {
      await result.current.syncNow({ expenses: [] })
    })

    expect(result.current.syncError).toBe('Network failure')
  })
})
