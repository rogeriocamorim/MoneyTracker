// Google Drive API Integration
// Handles OAuth2 authentication and file operations

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
const FILE_NAME = 'moneytracker-backup.json'
const APP_FOLDER = 'MoneyTracker Backups'

let tokenClient = null
let gapiInitialized = false
let gisInitialized = false

// Get client ID from env or localStorage
function getClientId() {
  return localStorage.getItem('googleDriveClientId') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
}

// Initialize the Google API client
export async function initGoogleApi() {
  const clientId = getClientId()
  if (!clientId) {
    throw new Error('Google Client ID not configured')
  }

  return new Promise((resolve, reject) => {
    // Load GAPI
    if (!window.gapi) {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.async = true
      script.defer = true
      script.onload = () => loadGapi(resolve, reject, clientId)
      script.onerror = () => reject(new Error('Failed to load Google API'))
      document.body.appendChild(script)
    } else {
      loadGapi(resolve, reject, clientId)
    }
  })
}

async function loadGapi(resolve, reject, clientId) {
  try {
    await new Promise((res) => window.gapi.load('client', res))
    await window.gapi.client.init({
      discoveryDocs: [DISCOVERY_DOC],
    })
    gapiInitialized = true
    
    // Load GIS (Google Identity Services)
    if (!window.google?.accounts?.oauth2) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => initGis(resolve, reject, clientId)
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
      document.body.appendChild(script)
    } else {
      initGis(resolve, reject, clientId)
    }
  } catch (err) {
    reject(err)
  }
}

function initGis(resolve, reject, clientId) {
  try {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: '', // Will be set later
    })
    gisInitialized = true
    resolve(true)
  } catch (err) {
    reject(err)
  }
}

// Check if user is signed in
export function isSignedIn() {
  return gapiInitialized && gisInitialized && window.gapi?.client?.getToken() !== null
}

// Sign in to Google
export function signIn() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google API not initialized'))
      return
    }

    tokenClient.callback = async (resp) => {
      if (resp.error) {
        reject(resp)
        return
      }
      resolve(resp)
    }

    if (window.gapi.client.getToken() === null) {
      // First time - prompt for consent
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      // Already have token - just refresh
      tokenClient.requestAccessToken({ prompt: '' })
    }
  })
}

// Sign out
export function signOut() {
  const token = window.gapi?.client?.getToken()
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token)
    window.gapi.client.setToken(null)
  }
}

// Get or create the app folder
async function getOrCreateFolder() {
  // Check if folder exists
  const response = await window.gapi.client.drive.files.list({
    q: `name='${APP_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  if (response.result.files?.length > 0) {
    return response.result.files[0].id
  }

  // Create folder
  const folderMetadata = {
    name: APP_FOLDER,
    mimeType: 'application/vnd.google-apps.folder',
  }

  const folder = await window.gapi.client.drive.files.create({
    resource: folderMetadata,
    fields: 'id',
  })

  return folder.result.id
}

// Find existing backup file
async function findBackupFile(folderId) {
  const response = await window.gapi.client.drive.files.list({
    q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, modifiedTime)',
    spaces: 'drive',
  })

  return response.result.files?.[0] || null
}

// Save data to Google Drive
export async function saveToGoogleDrive(data) {
  if (!isSignedIn()) {
    throw new Error('Not signed in to Google')
  }

  const folderId = await getOrCreateFolder()
  const existingFile = await findBackupFile(folderId)
  
  const fileContent = JSON.stringify(data, null, 2)
  const file = new Blob([fileContent], { type: 'application/json' })
  
  const metadata = {
    name: FILE_NAME,
    mimeType: 'application/json',
  }

  if (existingFile) {
    // Update existing file
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)

    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${window.gapi.client.getToken().access_token}` },
        body: form,
      }
    )

    if (!response.ok) throw new Error('Failed to update file')
    return await response.json()
  } else {
    // Create new file
    metadata.parents = [folderId]
    
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${window.gapi.client.getToken().access_token}` },
        body: form,
      }
    )

    if (!response.ok) throw new Error('Failed to create file')
    return await response.json()
  }
}

// Load data from Google Drive
export async function loadFromGoogleDrive() {
  if (!isSignedIn()) {
    throw new Error('Not signed in to Google')
  }

  const folderId = await getOrCreateFolder()
  const existingFile = await findBackupFile(folderId)

  if (!existingFile) {
    return null // No backup found
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
    {
      headers: { Authorization: `Bearer ${window.gapi.client.getToken().access_token}` },
    }
  )

  if (!response.ok) throw new Error('Failed to download file')
  
  const data = await response.json()
  return {
    data,
    modifiedTime: existingFile.modifiedTime,
  }
}

// Get backup info without downloading
export async function getBackupInfo() {
  if (!isSignedIn()) {
    return null
  }

  try {
    const folderId = await getOrCreateFolder()
    const existingFile = await findBackupFile(folderId)
    
    if (!existingFile) return null
    
    return {
      id: existingFile.id,
      name: existingFile.name,
      modifiedTime: existingFile.modifiedTime,
    }
  } catch {
    return null
  }
}

// Set client ID (for manual configuration)
export function setClientId(clientId) {
  localStorage.setItem('googleDriveClientId', clientId)
}

// Check if client ID is configured
export function hasClientId() {
  return !!getClientId()
}


