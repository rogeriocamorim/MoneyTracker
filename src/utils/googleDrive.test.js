import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setClientId, hasClientId } from './googleDrive'

describe('googleDrive setClientId/hasClientId', () => {
  beforeEach(() => {
    localStorage.clear()
    // Clear any env variable mock
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
  })

  it('setClientId stores the client ID in localStorage', () => {
    setClientId('test-client-id-123')
    expect(localStorage.getItem('googleDriveClientId')).toBe('test-client-id-123')
  })

  it('hasClientId returns true when client ID is set in localStorage', () => {
    expect(hasClientId()).toBe(false)
    setClientId('my-client-id')
    expect(hasClientId()).toBe(true)
  })

  it('hasClientId returns false when no client ID is configured', () => {
    expect(hasClientId()).toBe(false)
  })

  it('hasClientId returns true when env variable is set', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'env-client-id')
    expect(hasClientId()).toBe(true)
  })
})
