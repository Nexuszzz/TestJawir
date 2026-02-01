import { create } from 'zustand'

export interface FireDetectionState {
  temperature: number | null
  humidity: number | null
  gasLevel: number
  flameDetected: boolean
  alarmActive: boolean
  isOnline: boolean
  lastUpdate: Date | null
}

export interface FanDimmerState {
  speed: number  // 0-100
  isOn: boolean
  isOnline: boolean
  lastUpdate: Date | null
}

export interface MqttLogEntry {
  id: string
  timestamp: Date
  topic: string
  message: string
  direction: 'in' | 'out'
}

interface IoTState {
  fireDetection: FireDetectionState
  fanDimmer: FanDimmerState
  mqttLogs: MqttLogEntry[]
  mqttConnected: boolean
  
  // Actions
  updateFireDetection: (data: Partial<FireDetectionState>) => void
  updateFanDimmer: (data: Partial<FanDimmerState>) => void
  addMqttLog: (log: Omit<MqttLogEntry, 'id' | 'timestamp'>) => void
  setMqttConnected: (connected: boolean) => void
  sendCommand: (device: 'fire' | 'fan' | 'buzzer', command: string, value?: number) => void
  clearLogs: () => void
}

export const useIoTStore = create<IoTState>((set, get) => ({
  fireDetection: {
    temperature: null,
    humidity: null,
    gasLevel: 0,
    flameDetected: false,
    alarmActive: false,
    isOnline: false,
    lastUpdate: null,
  },
  
  fanDimmer: {
    speed: 0,
    isOn: false,
    isOnline: false,
    lastUpdate: null,
  },
  
  mqttLogs: [],
  mqttConnected: false,
  
  updateFireDetection: (data) => set((state) => ({
    fireDetection: {
      ...state.fireDetection,
      ...data,
      lastUpdate: new Date(),
    },
  })),
  
  updateFanDimmer: (data) => set((state) => ({
    fanDimmer: {
      ...state.fanDimmer,
      ...data,
      lastUpdate: new Date(),
    },
  })),
  
  addMqttLog: (log) => set((state) => ({
    mqttLogs: [
      {
        ...log,
        id: `log-${Date.now()}`,
        timestamp: new Date(),
      },
      ...state.mqttLogs.slice(0, 99), // Keep last 100 logs
    ],
  })),
  
  setMqttConnected: (mqttConnected) => set({ mqttConnected }),
  
  sendCommand: (device, command, value) => {
    const { addMqttLog } = get()
    
    // Log the outgoing command
    const topic = device === 'fire' 
      ? 'nimak/deteksi-api/cmd'
      : 'nimak/kipas/cmd'
    
    const message = value !== undefined 
      ? `${command}:${value}`
      : command
    
    addMqttLog({
      topic,
      message,
      direction: 'out',
    })
    
    // TODO: Actually publish via MQTT client
    console.log(`[MQTT] Publishing to ${topic}: ${message}`)
  },
  
  clearLogs: () => set({ mqttLogs: [] }),
}))
