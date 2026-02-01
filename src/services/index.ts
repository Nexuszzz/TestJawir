// Services exports
export * from './deepgram'
export * from './gemini'
export * from './tts'
export * from './mqtt'

// WhatsApp - explicit exports to avoid conflicts
export { 
  sendTextMessage, 
  sendToContact, 
  findContact, 
  formatPhoneNumber,
  logout as whatsappLogout 
} from './whatsapp'

export * from './kicad-mcp'

// Playwright MCP - explicit exports to avoid conflicts  
export {
  webSearch,
  researchTopic,
  navigateTo,
  takeScreenshot as playwrightScreenshot
} from './playwright-mcp'

// Google Workspace - explicit exports to avoid conflicts
export {
  getEmails,
  getEmailById,
  sendEmail,
  listDriveFiles,
  uploadToDrive,
  createGoogleDoc,
  getCalendarEvents,
  createCalendarEvent,
  getClassroomCourses,
  isAuthenticated as isGoogleAuthenticated,
  initiateOAuthFlow,
  logout as googleLogout,
  getUserInfo as getGoogleUserInfo,
  isConfigured as isGoogleConfigured,
} from './google-workspace'

// Computer Control - all exports (takeScreenshot handled above)
export {
  openApplication,
  executeCommand,
  setVolume,
  toggleMute,
  minimizeAllWindows,
  showDesktop,
  lockScreen,
  shutdownComputer,
  cancelShutdown,
  sleepComputer,
  getRunningProcesses,
  killProcess,
  takeScreenshot,
  openFile,
  openFolder,
  openURL,
  showNotification,
  getSystemInfo
} from './computer-control'

// Mode Router - dual mode execution
export {
  routeAction,
  executeAction,
  getRouteDescription
} from './mode-router'
export type { Action, ActionCategory, RiskLevel, RouteResult } from './mode-router'

// Open Interpreter
export {
  executePrompt as executeOIPrompt,
  getOIStatus,
  confirmAction as confirmOIAction,
  cancelAction as cancelOIAction
} from './open-interpreter'
