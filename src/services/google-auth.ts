// Google Auth Service
// Handles OAuth 2.0 flow for Google APIs in Electron
// Uses googleapis library with proper token management

export interface GoogleTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  scope: string
}

export interface GoogleUserInfo {
  email: string
  name: string
  picture?: string
}

// OAuth configuration from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || ''
const REDIRECT_URI = 'http://localhost:8085/callback'

// Required scopes for Jawir
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ')

// Token storage key
const TOKEN_STORAGE_KEY = 'jawir-google-tokens'

// Current tokens (in-memory cache)
let currentTokens: GoogleTokens | null = null
let currentUser: GoogleUserInfo | null = null

/**
 * Check if Google credentials are configured
 */
export function isConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)
}

/**
 * Get current tokens from storage
 */
export function getStoredTokens(): GoogleTokens | null {
  if (currentTokens) return currentTokens
  
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (stored) {
      currentTokens = JSON.parse(stored)
      return currentTokens
    }
  } catch (error) {
    console.error('Failed to parse stored tokens:', error)
  }
  return null
}

/**
 * Store tokens securely
 */
export function storeTokens(tokens: GoogleTokens): void {
  currentTokens = tokens
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens))
}

/**
 * Clear stored tokens (logout)
 */
export function clearTokens(): void {
  currentTokens = null
  currentUser = null
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

/**
 * Check if tokens are valid (not expired)
 */
export function isTokenValid(): boolean {
  const tokens = getStoredTokens()
  if (!tokens) return false
  
  // Check if token expires in less than 5 minutes
  const bufferMs = 5 * 60 * 1000
  return tokens.expiresAt > (Date.now() + bufferMs)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return isTokenValid()
}

/**
 * Get authorization URL for OAuth flow
 */
export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }
  
  const data = await response.json()
  
  const tokens: GoogleTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
    scope: data.scope,
  }
  
  storeTokens(tokens)
  return tokens
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<GoogleTokens | null> {
  const tokens = getStoredTokens()
  if (!tokens?.refreshToken) {
    console.error('No refresh token available')
    return null
  }
  
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokens.refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    
    if (!response.ok) {
      throw new Error('Token refresh failed')
    }
    
    const data = await response.json()
    
    const newTokens: GoogleTokens = {
      accessToken: data.access_token,
      refreshToken: tokens.refreshToken, // Keep original refresh token
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope || tokens.scope,
    }
    
    storeTokens(newTokens)
    return newTokens
  } catch (error) {
    console.error('Failed to refresh token:', error)
    clearTokens()
    return null
  }
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (isTokenValid()) {
    return getStoredTokens()?.accessToken || null
  }
  
  // Try to refresh
  const newTokens = await refreshAccessToken()
  return newTokens?.accessToken || null
}

/**
 * Get current user info
 */
export async function getUserInfo(): Promise<GoogleUserInfo | null> {
  if (currentUser) return currentUser
  
  const token = await getValidAccessToken()
  if (!token) return null
  
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to get user info')
    }
    
    const data = await response.json()
    currentUser = {
      email: data.email,
      name: data.name,
      picture: data.picture,
    }
    
    return currentUser
  } catch (error) {
    console.error('Failed to get user info:', error)
    return null
  }
}

/**
 * Initiate OAuth flow - opens auth window via Electron IPC
 */
export async function initiateOAuthFlow(): Promise<boolean> {
  if (!isConfigured()) {
    console.error('Google OAuth not configured. Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET in .env')
    return false
  }
  
  try {
    // Use Electron IPC to open OAuth window
    if (window.electronAPI?.openURL) {
      const authUrl = getAuthUrl()
      
      // Start local callback server via IPC
      const result = await window.electronAPI.openURL(authUrl)
      return result?.success || false
    } else {
      // Fallback: open in browser
      window.open(getAuthUrl(), '_blank')
      return true
    }
  } catch (error) {
    console.error('OAuth flow failed:', error)
    return false
  }
}

/**
 * Handle OAuth callback (called from Electron main process)
 */
export async function handleOAuthCallback(code: string): Promise<boolean> {
  try {
    await exchangeCodeForTokens(code)
    await getUserInfo()
    return true
  } catch (error) {
    console.error('OAuth callback failed:', error)
    return false
  }
}

/**
 * Logout - clear all tokens and user info
 */
export function logout(): void {
  clearTokens()
  console.log('Logged out from Google')
}

/**
 * Make authenticated API request
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getValidAccessToken()
  if (!token) {
    throw new Error('Not authenticated')
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token invalid, try refresh
      const newToken = await refreshAccessToken()
      if (newToken) {
        // Retry request with new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken.accessToken}`,
          },
        })
        if (retryResponse.ok) {
          return retryResponse.json()
        }
      }
      // Refresh failed, clear tokens
      clearTokens()
    }
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}
