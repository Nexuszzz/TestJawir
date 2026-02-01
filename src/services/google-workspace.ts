// Google Workspace Service - REAL API Implementation
// Integrates Gmail, Drive, Calendar, and Classroom
// Uses google-auth.ts for OAuth token management

import { apiRequest, isAuthenticated, getValidAccessToken } from './google-auth'

// ============== TYPES ==============

export interface GmailMessage {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  snippet: string
  body?: string
  date: Date
  isRead: boolean
  labels: string[]
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: number
  createdTime: Date
  modifiedTime: Date
  webViewLink?: string
  iconLink?: string
  parents?: string[]
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: Date
  end: Date
  location?: string
  attendees?: string[]
  htmlLink?: string
}

export interface ClassroomCourse {
  id: string
  name: string
  section?: string
  teacherName?: string
  enrollmentCode?: string
  courseState: string
}

// ============== GMAIL ==============

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

/**
 * Get list of emails from inbox
 */
export async function getEmails(
  maxResults: number = 20,
  query?: string
): Promise<GmailMessage[]> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated with Google')
  }
  
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    labelIds: 'INBOX',
  })
  
  if (query) {
    params.append('q', query)
  }
  
  // Get message list
  const listResponse = await apiRequest<{
    messages?: { id: string; threadId: string }[]
    resultSizeEstimate: number
  }>(`${GMAIL_API}/messages?${params}`)
  
  if (!listResponse.messages || listResponse.messages.length === 0) {
    return []
  }
  
  // Get message details in parallel
  const batch = listResponse.messages.slice(0, Math.min(maxResults, 20))
  
  const detailPromises = batch.map(async (msg) => {
    try {
      const detail = await apiRequest<{
        id: string
        threadId: string
        labelIds: string[]
        snippet: string
        payload: {
          headers: { name: string; value: string }[]
          body?: { data?: string }
          parts?: { body?: { data?: string } }[]
        }
        internalDate: string
      }>(`${GMAIL_API}/messages/${msg.id}?format=full`)
      
      const headers = detail.payload.headers
      const getHeader = (name: string) => 
        headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
      
      return {
        id: detail.id,
        threadId: detail.threadId,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        snippet: detail.snippet,
        date: new Date(parseInt(detail.internalDate)),
        isRead: !detail.labelIds.includes('UNREAD'),
        labels: detail.labelIds,
      }
    } catch (error) {
      console.error(`Failed to get message ${msg.id}:`, error)
      return null
    }
  })
  
  const results = await Promise.all(detailPromises)
  return results.filter((m): m is GmailMessage => m !== null)
}

/**
 * Get single email by ID with full body
 */
export async function getEmailById(messageId: string): Promise<GmailMessage | null> {
  if (!isAuthenticated()) return null
  
  try {
    const detail = await apiRequest<{
      id: string
      threadId: string
      labelIds: string[]
      snippet: string
      payload: {
        headers: { name: string; value: string }[]
        body?: { data?: string }
        parts?: { mimeType: string; body?: { data?: string } }[]
      }
      internalDate: string
    }>(`${GMAIL_API}/messages/${messageId}?format=full`)
    
    const headers = detail.payload.headers
    const getHeader = (name: string) => 
      headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
    
    // Decode body
    let body = ''
    if (detail.payload.body?.data) {
      body = atob(detail.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
    } else if (detail.payload.parts) {
      const textPart = detail.payload.parts.find(p => p.mimeType === 'text/plain')
      if (textPart?.body?.data) {
        body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      }
    }
    
    return {
      id: detail.id,
      threadId: detail.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      snippet: detail.snippet,
      body,
      date: new Date(parseInt(detail.internalDate)),
      isRead: !detail.labelIds.includes('UNREAD'),
      labels: detail.labelIds,
    }
  } catch (error) {
    console.error('Failed to get email:', error)
    return null
  }
}

/**
 * Send an email
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Not authenticated' }
  }
  
  try {
    // Create RFC 2822 formatted email
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n')
    
    // Base64 encode
    const encodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    const response = await apiRequest<{ id: string }>(`${GMAIL_API}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encodedEmail }),
    })
    
    return { success: true, messageId: response.id }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}

// ============== GOOGLE DRIVE ==============

const DRIVE_API = 'https://www.googleapis.com/drive/v3'

/**
 * List files from Drive
 */
export async function listDriveFiles(
  maxResults: number = 20,
  query?: string,
  folderId?: string
): Promise<DriveFile[]> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated with Google')
  }
  
  const params = new URLSearchParams({
    pageSize: maxResults.toString(),
    fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,iconLink,parents)',
    orderBy: 'modifiedTime desc',
  })
  
  // Build query
  const queries: string[] = ["trashed = false"]
  if (query) {
    queries.push(`name contains '${query}'`)
  }
  if (folderId) {
    queries.push(`'${folderId}' in parents`)
  }
  params.append('q', queries.join(' and '))
  
  const response = await apiRequest<{
    files: {
      id: string
      name: string
      mimeType: string
      size?: string
      createdTime: string
      modifiedTime: string
      webViewLink?: string
      iconLink?: string
      parents?: string[]
    }[]
  }>(`${DRIVE_API}/files?${params}`)
  
  return response.files.map(f => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size ? parseInt(f.size) : undefined,
    createdTime: new Date(f.createdTime),
    modifiedTime: new Date(f.modifiedTime),
    webViewLink: f.webViewLink,
    iconLink: f.iconLink,
    parents: f.parents,
  }))
}

/**
 * Upload a file to Drive
 */
export async function uploadToDrive(
  name: string,
  content: string,
  mimeType: string = 'text/plain',
  folderId?: string
): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Not authenticated' }
  }
  
  try {
    const token = await getValidAccessToken()
    
    // Create metadata
    const metadata: { name: string; mimeType: string; parents?: string[] } = {
      name,
      mimeType,
    }
    if (folderId) {
      metadata.parents = [folderId]
    }
    
    // Create multipart body
    const boundary = '-------314159265358979323846'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`
    
    const body = 
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter
    
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    )
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`)
    }
    
    const result = await response.json()
    return { success: true, fileId: result.id, webViewLink: result.webViewLink }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

/**
 * Create a Google Doc
 */
export async function createGoogleDoc(
  title: string,
  content: string
): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> {
  return uploadToDrive(
    title,
    content,
    'application/vnd.google-apps.document'
  )
}

// ============== GOOGLE CALENDAR ==============

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

/**
 * Get calendar events
 */
export async function getCalendarEvents(
  maxResults: number = 20,
  calendarId: string = 'primary'
): Promise<CalendarEvent[]> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated with Google')
  }
  
  const now = new Date()
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    orderBy: 'startTime',
    singleEvents: 'true',
    timeMin: now.toISOString(),
  })
  
  const response = await apiRequest<{
    items: {
      id: string
      summary: string
      description?: string
      start: { dateTime?: string; date?: string }
      end: { dateTime?: string; date?: string }
      location?: string
      attendees?: { email: string }[]
      htmlLink: string
    }[]
  }>(`${CALENDAR_API}/calendars/${calendarId}/events?${params}`)
  
  return response.items.map(e => ({
    id: e.id,
    summary: e.summary,
    description: e.description,
    start: new Date(e.start.dateTime || e.start.date || ''),
    end: new Date(e.end.dateTime || e.end.date || ''),
    location: e.location,
    attendees: e.attendees?.map(a => a.email),
    htmlLink: e.htmlLink,
  }))
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  summary: string,
  start: Date,
  end: Date,
  options?: {
    description?: string
    location?: string
    attendees?: string[]
  }
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Not authenticated' }
  }
  
  try {
    const event = {
      summary,
      description: options?.description,
      location: options?.location,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: options?.attendees?.map(email => ({ email })),
    }
    
    const response = await apiRequest<{ id: string; htmlLink: string }>(
      `${CALENDAR_API}/calendars/primary/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }
    )
    
    return { success: true, eventId: response.id, htmlLink: response.htmlLink }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create event' 
    }
  }
}

// ============== GOOGLE CLASSROOM ==============

const CLASSROOM_API = 'https://classroom.googleapis.com/v1'

/**
 * Get list of courses
 */
export async function getClassroomCourses(): Promise<ClassroomCourse[]> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated with Google')
  }
  
  const response = await apiRequest<{
    courses?: {
      id: string
      name: string
      section?: string
      ownerId: string
      enrollmentCode?: string
      courseState: string
    }[]
  }>(`${CLASSROOM_API}/courses`)
  
  if (!response.courses) {
    return []
  }
  
  return response.courses.map(c => ({
    id: c.id,
    name: c.name,
    section: c.section,
    enrollmentCode: c.enrollmentCode,
    courseState: c.courseState,
  }))
}

// ============== CONVENIENCE EXPORTS ==============

export { isAuthenticated, getValidAccessToken } from './google-auth'
export { 
  initiateOAuthFlow, 
  logout, 
  getUserInfo,
  isConfigured,
} from './google-auth'
export type { GoogleUserInfo, GoogleTokens } from './google-auth'
