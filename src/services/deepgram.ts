// Deepgram Speech-to-Text Service
// API Documentation: https://developers.deepgram.com/docs/getting-started-with-pre-recorded-audio

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen'

interface DeepgramResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string
        confidence: number
        words: Array<{
          word: string
          start: number
          end: number
          confidence: number
        }>
      }>
    }>
  }
  metadata: {
    request_id: string
    created: string
    duration: number
    channels: number
  }
}

interface TranscribeOptions {
  language?: string
  model?: string
  punctuate?: boolean
  profanity_filter?: boolean
}

/**
 * Transcribe audio blob to text using Deepgram API
 * @param audioBlob - Audio blob (webm, wav, mp3, etc.)
 * @param apiKey - Deepgram API key
 * @param options - Transcription options
 */
export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string,
  options: TranscribeOptions = {}
): Promise<{ transcript: string; confidence: number; duration: number }> {
  const {
    language = 'id', // Indonesian
    model = 'nova-2', // Best quality model
    punctuate = true,
    profanity_filter = false,
  } = options
  
  // Build query params
  const params = new URLSearchParams({
    model,
    language,
    punctuate: String(punctuate),
    profanity_filter: String(profanity_filter),
    smart_format: 'true',
  })
  
  try {
    const response = await fetch(`${DEEPGRAM_API_URL}?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': audioBlob.type || 'audio/webm',
      },
      body: audioBlob,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`)
    }
    
    const data: DeepgramResponse = await response.json()
    
    // Extract results
    const channel = data.results.channels[0]
    const alternative = channel?.alternatives[0]
    
    if (!alternative) {
      throw new Error('No transcription result found')
    }
    
    return {
      transcript: alternative.transcript,
      confidence: alternative.confidence,
      duration: data.metadata.duration,
    }
  } catch (error) {
    console.error('Deepgram transcription failed:', error)
    throw error
  }
}

/**
 * Check if Deepgram API key is valid
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

// Alias for backward compatibility
export const validateDeepgramKey = validateApiKey

/**
 * Convert audio blob to different format if needed
 * Deepgram supports: wav, mp3, webm, ogg, flac, m4a
 */
export function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ]
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  
  return 'audio/webm' // Default fallback
}
