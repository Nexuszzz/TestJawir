// MQTT Service for IoT Communication
// Connects to MQTT broker for fire detection sensor (ESP32 DevKit)
// NOTE: Dimmer Kipas does NOT use MQTT - it's local control only

import mqtt, { MqttClient, IClientOptions } from 'mqtt'
import { useIoTStore } from '@stores/iotStore'
import { useSettingsStore } from '@stores/settingsStore'

// Helper function to add log entry with proper format
function logMqtt(message: string, topic = 'system', direction: 'in' | 'out' = 'in') {
  useIoTStore.getState().addMqttLog({
    topic,
    message,
    direction,
  })
}

// MQTT Topics - Match ESP32 Arduino code (kodearduinoideesp32devkitbaru.ino)
export const MQTT_TOPICS = {
  // Fire Detection ESP32 DevKit
  FIRE_TELEMETRY: 'nimak/deteksi-api/telemetry',  // JSON: {id, t, h, gasA, gasMv, gasD, flame, alarm, forceAlarm}
  FIRE_CMD: 'nimak/deteksi-api/cmd',              // Commands: BUZZER_ON, BUZZER_OFF, THR=xxx
  FIRE_ALERT: 'lab/zaks/alert',                   // Alert when flame detected
  FIRE_STATUS: 'lab/zaks/status',                 // {status: "online"} or {status: "offline"}
  FIRE_EVENT: 'lab/zaks/event',                   // Events from ESP32
  FIRE_LOG: 'lab/zaks/log',                       // Log messages
}

// Default credentials (from ESP32 code)
const DEFAULT_MQTT_USER = 'zaks'
const DEFAULT_MQTT_PASS = 'enggangodinginmcu'
const DEFAULT_MQTT_PORT = 1884

// Client ID
const CLIENT_ID = `jawir-os-${Math.random().toString(16).slice(2, 10)}`

let client: MqttClient | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10

/**
 * Build MQTT URL from settings
 */
function buildMqttUrl(): { url: string; options: IClientOptions } {
  const settings = useSettingsStore.getState()
  
  // Get broker URL from settings or use placeholder
  let brokerUrl = settings.mqttBrokerUrl
  
  // If no URL set, return empty (will skip connection)
  if (!brokerUrl) {
    return { url: '', options: {} as IClientOptions }
  }
  
  // Parse URL to determine protocol
  // Formats supported:
  // - mqtt://IP:PORT
  // - ws://IP:PORT/mqtt
  // - wss://IP:PORT/mqtt
  // - Just IP (will add mqtt:// and default port)
  if (!brokerUrl.includes('://')) {
    // Just IP or IP:PORT, add mqtt:// prefix
    if (!brokerUrl.includes(':')) {
      brokerUrl = `mqtt://${brokerUrl}:${DEFAULT_MQTT_PORT}`
    } else {
      brokerUrl = `mqtt://${brokerUrl}`
    }
  }
  
  const options: IClientOptions = {
    clientId: CLIENT_ID,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 5000,
    username: settings.mqttUsername || DEFAULT_MQTT_USER,
    password: settings.mqttPassword || DEFAULT_MQTT_PASS,
  }
  
  return { url: brokerUrl, options }
}

/**
 * Connect to MQTT broker
 * Uses broker URL from Settings (settingsStore.mqttBrokerUrl)
 */
export function connectMqtt(overrideUrl?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const { url: settingsUrl, options } = buildMqttUrl()
    const url = overrideUrl || settingsUrl
    
    // Skip if no URL configured
    if (!url) {
      logMqtt('⚠️ MQTT broker URL not configured. Set in Settings → Integrations')
      resolve()
      return
    }
    
    logMqtt(`Connecting to ${url}...`)
    
    try {
      client = mqtt.connect(url, options)
      
      client.on('connect', () => {
        logMqtt('✅ Connected to MQTT broker')
        reconnectAttempts = 0
        useIoTStore.getState().setMqttConnected(true)
        subscribeToTopics()
        resolve()
      })
      
      client.on('error', (error: Error) => {
        logMqtt(`❌ MQTT Error: ${error.message}`)
        reject(error)
      })
      
      client.on('reconnect', () => {
        reconnectAttempts++
        logMqtt(`🔄 Reconnecting... (attempt ${reconnectAttempts})`)
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          logMqtt('❌ Max reconnect attempts reached')
          client?.end()
        }
      })
      
      client.on('offline', () => {
        logMqtt('📴 MQTT offline')
        useIoTStore.getState().setMqttConnected(false)
        useIoTStore.getState().updateFireDetection({ isOnline: false })
        useIoTStore.getState().updateFanDimmer({ isOnline: false })
      })
      
      client.on('message', handleMessage)
      
    } catch (error) {
      logMqtt(`❌ Connection failed: ${error}`)
      reject(error)
    }
  })
}

/**
 * Subscribe to Fire Detection topics
 * NOTE: Dimmer Kipas tidak pakai MQTT - kontrol lokal via tombol
 */
function subscribeToTopics() {
  if (!client) return
  
  // Only subscribe to Fire Detection topics
  const topics = [
    MQTT_TOPICS.FIRE_TELEMETRY,
    MQTT_TOPICS.FIRE_ALERT,
    MQTT_TOPICS.FIRE_STATUS,
    MQTT_TOPICS.FIRE_EVENT,
  ]
  
  client.subscribe(topics, (error: Error | null) => {
    if (error) {
      logMqtt(`❌ Subscribe error: ${error.message}`)
    } else {
      logMqtt('📡 Subscribed to Fire Detection topics')
      logMqtt('ℹ️ Dimmer Kipas: Local control only (no MQTT)')
      useIoTStore.getState().updateFireDetection({ isOnline: true })
      // Fan dimmer is always "online" since it's local
      useIoTStore.getState().updateFanDimmer({ isOnline: true })
    }
  })
}

/**
 * Handle incoming MQTT messages from ESP32 Fire Detection
 * 
 * Telemetry format from ESP32:
 * {"id":"xxxx","t":28.5,"h":65.0,"gasA":1234,"gasMv":2500,
 *  "gasD":false,"flame":false,"alarm":false,"forceAlarm":false}
 */
function handleMessage(topic: string, message: Buffer) {
  const payload = message.toString()
  const { updateFireDetection } = useIoTStore.getState()
  
  // Log the message (truncate long messages)
  const logPayload = payload.length > 80 ? payload.slice(0, 80) + '...' : payload
  logMqtt(logPayload, topic, 'in')
  
  // Handle telemetry JSON from ESP32 DevKit
  if (topic === MQTT_TOPICS.FIRE_TELEMETRY) {
    try {
      const data = JSON.parse(payload)
      updateFireDetection({
        temperature: data.t ?? null,          // Temperature in Celsius
        humidity: data.h ?? null,             // Humidity in %
        gasLevel: data.gasA ?? 0,             // Gas analog value (0-4095)
        flameDetected: data.flame === true,   // Flame sensor triggered
        alarmActive: data.alarm === true,     // Buzzer is active
        isOnline: true,
      })
    } catch (e) {
      console.warn('[MQTT] Failed to parse telemetry:', e)
    }
    return
  }
  
  // Handle alert from ESP32 (flame detected)
  if (topic === MQTT_TOPICS.FIRE_ALERT) {
    try {
      const data = JSON.parse(payload)
      updateFireDetection({
        alarmActive: true,
        flameDetected: data.alert === 'flame' || data.src === 'esp32_flame',
        temperature: data.t ?? undefined,
        humidity: data.h ?? undefined,
        gasLevel: data.gasA ?? undefined,
      })
      
      // Show desktop notification for fire alert
      if (window.electronAPI?.showNotification) {
        window.electronAPI.showNotification({
          title: '🔥 BAHAYA - Api Terdeteksi!',
          body: `Sensor di Lab Workshop mendeteksi api. Suhu: ${data.t ?? '--'}°C`,
        })
      }
    } catch (e) {
      console.warn('[MQTT] Failed to parse alert:', e)
    }
    return
  }
  
  // Handle status (online/offline LWT)
  if (topic === MQTT_TOPICS.FIRE_STATUS) {
    try {
      const data = JSON.parse(payload)
      updateFireDetection({ isOnline: data.status === 'online' })
    } catch {
      // Plain text format
      updateFireDetection({ isOnline: payload.includes('online') })
    }
    return
  }
  
  // Handle events from ESP32
  if (topic === MQTT_TOPICS.FIRE_EVENT) {
    try {
      const data = JSON.parse(payload)
      logMqtt(`Event: ${data.event}`, topic, 'in')
      
      if (data.event === 'flame_on') {
        updateFireDetection({ flameDetected: true, alarmActive: true })
      } else if (data.event === 'yolo_alarm_auto_off') {
        updateFireDetection({ alarmActive: false })
      }
    } catch (e) {
      console.warn('[MQTT] Failed to parse event:', e)
    }
    return
  }
}

/**
 * Publish message to MQTT topic
 */
export function publishMqtt(topic: string, message: string): boolean {
  if (!client || !client.connected) {
    logMqtt('❌ Cannot publish: Not connected')
    return false
  }
  
  client.publish(topic, message, { qos: 1 }, (error?: Error) => {
    if (error) {
      logMqtt(`❌ Publish error: ${error.message}`, topic, 'out')
    } else {
      logMqtt(message, topic, 'out')
    }
  })
  
  return true
}

/**
 * Send command to buzzer (BUZZER_ON / BUZZER_OFF)
 */
export function sendBuzzerCommand(action: 'on' | 'off'): boolean {
  const command = action === 'on' ? 'BUZZER_ON' : 'BUZZER_OFF'
  return publishMqtt(MQTT_TOPICS.FIRE_CMD, command)
}

/**
 * NOTE: Kipas Dimmer tidak menggunakan MQTT
 * Dikontrol secara lokal via tombol fisik di ESP32
 * Fungsi ini hanya untuk simulasi UI
 */
export function sendFanSpeedCommand(_speed: number): boolean {
  console.log('[MQTT] Fan tidak menggunakan MQTT - kontrol via tombol fisik')
  return false // No-op - kipas dikontrol lokal
}

/**
 * Disconnect from MQTT broker
 */
export function disconnectMqtt(): void {
  if (client) {
    client.end()
    client = null
    logMqtt('🔌 Disconnected from MQTT')
    useIoTStore.getState().setMqttConnected(false)
    useIoTStore.getState().updateFireDetection({ isOnline: false })
  }
}

/**
 * Check if MQTT is connected
 */
export function isMqttConnected(): boolean {
  return client?.connected || false
}

/**
 * Get MQTT client instance (for advanced usage)
 */
export function getMqttClient(): MqttClient | null {
  return client
}
