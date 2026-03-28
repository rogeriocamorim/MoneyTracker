// Google Drive API Integration
// Handles OAuth2 authentication and file operations

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
const FILE_NAME = 'moneytracker-backup.json'
const APP_FOLDER = 'MoneyTracker Backups'

let tokenClient = null
let gapiInitialized = false
let gisInitialized = false

function getClientId() {
  return (
    localStorage.getItem('googleDriveClientId') ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    ''
  )
}

export async function initGoogleApi() {
  const clientId = getClientId()
  if (!clientId) {
    throw new Error('Google Client ID not configured')
  }

  return new Promise((resolve, reject) => {
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
    await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] })
    gapiInitialized = true

    if (!window.google?.accounts?.oauth2) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => initGis(resolve, reject, clientId)
      script.onerror = () =>
        reject(new Error('Failed to load Google Identity Services'))
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
      callback: '',
    })
    gisInitialized = true
    resolve(true)
  } catch (err) {
    reject(err)
  }
}

export function isSignedIn() {
  return (
    gapiInitialized &&
    gisInitialized &&
    window.gapi?.client?.getToken() !== null
  )
}

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
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

export function signOut() {
  const token = window.gapi?.client?.getToken()
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token)
    window.gapi.client.setToken(null)
  }
}

async function getOrCreateFolder() {
  const response = await window.gapi.client.drive.files.list({
    q: `name='${APP_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  if (response.result.files?.length > 0) {
    return response.result.files[0].id
  }

  const createResponse = await window.gapi.client.drive.files.create({
    resource: {
      name: APP_FOLDER,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  })

  return createResponse.result.id
}

async function findBackupFile(folderId) {
  const response = await window.gapi.client.drive.files.list({
    q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, modifiedTime)',
    spaces: 'drive',
  })
  return response.result.files?.[0] || null
}

export async function saveToGoogleDrive(data) {
  if (!isSignedIn()) throw new Error('Not signed in to Google')

  const folderId = await getOrCreateFolder()
  const existingFile = await findBackupFile(folderId)

  const fileContent = JSON.stringify(data, null, 2)
  const file = new Blob([fileContent], { type: 'application/json' })
  const metadata = { name: FILE_NAME, mimeType: 'application/json' }

  const token = window.gapi.client.getToken().access_token

  if (existingFile) {
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)

    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`,
      { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: form }
    )
    if (!response.ok) throw new Error('Failed to update file')
    return await response.json()
  } else {
    metadata.parents = [folderId]
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
    )
    if (!response.ok) throw new Error('Failed to create file')
    return await response.json()
  }
}

export async function loadFromGoogleDrive() {
  if (!isSignedIn()) throw new Error('Not signed in to Google')

  const folderId = await getOrCreateFolder()
  const existingFile = await findBackupFile(folderId)
  if (!existingFile) return null

  const token = window.gapi.client.getToken().access_token
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!response.ok) throw new Error('Failed to download file')

  const data = await response.json()
  return { data, modifiedTime: existingFile.modifiedTime }
}

export function setClientId(clientId) {
  localStorage.setItem('googleDriveClientId', clientId)
}

export function getStoredClientId() {
  return getClientId()
}
