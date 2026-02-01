// WhatsApp Service
// Uses go-whatsapp-web-multidevice REST API for sending messages
// Documentation: https://github.com/aldinokemal/go-whatsapp-web-multidevice

export interface Contact {
  phone: string
  name: string
}

export interface WhatsAppMessage {
  to: string
  message: string
  type?: 'text' | 'image' | 'document'
  mediaUrl?: string
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

// Default API endpoint (local go-whatsapp-web server)
const DEFAULT_API_URL = 'http://localhost:3000'

let apiUrl = DEFAULT_API_URL

/**
 * Configure WhatsApp API URL
 */
export function configureWhatsApp(url: string): void {
  apiUrl = url
}

/**
 * Get WhatsApp API URL
 */
export function getApiUrl(): string {
  return apiUrl
}

/**
 * Check if WhatsApp is connected
 */
export async function isWhatsAppConnected(): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/user/info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get QR code for pairing
 */
export async function getQRCode(): Promise<string | null> {
  try {
    const response = await fetch(`${apiUrl}/app/login`, {
      method: 'GET',
    })
    if (response.ok) {
      const data = await response.json()
      return data.qr || null
    }
    return null
  } catch (error) {
    console.error('Failed to get QR code:', error)
    return null
  }
}

/**
 * Send text message to phone number
 */
export async function sendTextMessage(phone: string, message: string): Promise<SendMessageResult> {
  try {
    // Format phone number (remove +, spaces, dashes)
    const formattedPhone = formatPhoneNumber(phone)
    
    const response = await fetch(`${apiUrl}/send/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        message,
      }),
    })
    
    const data = await response.json()
    
    if (response.ok) {
      return {
        success: true,
        messageId: data.message_id || data.id,
      }
    }
    
    return {
      success: false,
      error: data.message || 'Failed to send message',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Send message to contact by name
 * (Looks up contact from stored contacts)
 */
export async function sendToContact(contactName: string, message: string): Promise<SendMessageResult> {
  // For now, use a simple contact lookup
  // In production, this would search the contacts list
  const contact = await findContact(contactName)
  
  if (!contact) {
    return {
      success: false,
      error: `Kontak "${contactName}" tidak ditemukan`,
    }
  }
  
  return sendTextMessage(contact.phone, message)
}

/**
 * Find contact by name (simple implementation)
 * In production, this would search the actual WhatsApp contacts
 */
export async function findContact(name: string): Promise<Contact | null> {
  // Demo contacts - in production, fetch from WhatsApp API
  const demoContacts: Contact[] = [
    { phone: '6281234567890', name: 'Pak Dosen' },
    { phone: '6281234567891', name: 'Budi' },
    { phone: '6281234567892', name: 'Siti' },
  ]
  
  const normalized = name.toLowerCase()
  return demoContacts.find(c => 
    c.name.toLowerCase().includes(normalized)
  ) || null
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle Indonesian numbers
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }
  
  return cleaned
}

/**
 * Get recent chats
 */
export async function getRecentChats(): Promise<unknown[]> {
  try {
    const response = await fetch(`${apiUrl}/user/chats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.chats || []
    }
    
    return []
  } catch {
    return []
  }
}

/**
 * Logout from WhatsApp
 */
export async function logout(): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/app/logout`, {
      method: 'POST',
    })
    return response.ok
  } catch {
    return false
  }
}
