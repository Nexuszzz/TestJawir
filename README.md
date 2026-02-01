# Jawir OS

> **Voice-Controlled AI Operating System dengan Dual Mode Architecture**

Jawir OS adalah desktop application berbasis Electron yang menggabungkan voice control, AI (Gemini), dan computer automation dalam satu ekosistem yang aman dan powerful.

## 🎯 Features Utama

### 🎤 Voice Control
- **Wake Word Detection**: Aktivasi dengan kata "Jawir" menggunakan openWakeWord
- **Real-time Speech-to-Text**: Deepgram integration untuk transcription akurat
- **Text-to-Speech**: Response audio natural dari AI

### 🤖 AI Integration
- **Google Gemini**: Function calling untuk kontrol komputer dan IoT
- **Context-Aware**: Memahami perintah kompleks dalam bahasa natural
- **Multi-modal**: Dukungan teks, suara, dan gambar

### 🖥️ Computer Control (Dual Mode)

#### Mode Aman (80% - Default)
**IPC-based control dengan latency <500ms:**
- Buka aplikasi, folder, URL
- Kontrol volume, mute/unmute
- Screenshot, lock screen
- Window management (minimize, show desktop)
- System power (shutdown, restart, sleep)
- File search

#### Mode Bebas (20% - Advanced)
**Open Interpreter integration untuk tugas kompleks:**
- Code execution (Python, JavaScript, Shell)
- Multi-step automation
- Content search dalam files (regex support)
- Batch file processing
- Code analysis dan refactoring
- **Guardrails**: Konfirmasi wajib, timeout 60s, folder restrictions

### 🏗️ IoT Control
- **MQTT Integration**: Kontrol device IoT real-time
- **Fire Detection System**: Monitor suhu, gas, alarm
- **Fan Dimmer**: Kontrol kecepatan kipas 0-100%

### ⚡ KiCad Integration
- **Template Generator**: Powerbank, amplifier, LED circuit
- **AI-Assisted PCB Design**: Via MCP (Model Context Protocol)
- **Project Management**: Open/manage KiCad projects

### 💬 WhatsApp Automation
- **Send Messages**: Via voice atau text
- **Contact Management**: Integrasi contact list
- **Confirmation Flow**: Safety untuk prevent spam

### 🌐 Web Automation
- **Browser Control**: Via Playwright MCP
- **Web Search**: Google integration
- **Content Extraction**: dari URL

## 📦 Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** (lightning-fast HMR)
- **Tailwind CSS** (utility-first styling)
- **Zustand** (state management dengan persist)

### Desktop Runtime
- **Electron** (cross-platform desktop app)
- **IPC Handlers** (secure main-renderer communication)

### AI & Voice
- **Google Gemini** (function calling AI)
- **Deepgram** (speech-to-text)
- **openWakeWord** (wake word detection)
- **Web Speech API** (text-to-speech)

### Backend Services
- **Open Interpreter** (Python FastAPI server - Mode Bebas)
- **MQTT** (IoT device communication)
- **KiCad MCP** (PCB design automation)
- **Playwright MCP** (browser automation)

## 🏗️ Project Structure

```
jawir-os/
├── electron/
│   ├── main.ts           # Electron main process
│   └── preload.ts        # IPC bridge (contextBridge)
│
├── src/
│   ├── components/
│   │   ├── chat/         # ChatBubble, ChatInput, VoiceVisualizer
│   │   ├── iot/          # IoT device cards
│   │   ├── layout/       # Header, Sidebar, ModeIndicator
│   │   ├── modals/       # Confirmation, Settings, Listening overlay
│   │   └── workspace/    # Tab system (KiCad, Browser, IoT, Computer, WhatsApp)
│   │
│   ├── services/
│   │   ├── gemini.ts           # Gemini AI integration
│   │   ├── gemini-tools.ts     # Function definitions (26 tools)
│   │   ├── deepgram.ts         # Speech-to-text
│   │   ├── tts.ts              # Text-to-speech
│   │   ├── mqtt.ts             # IoT device control
│   │   ├── computer-control.ts # IPC computer actions
│   │   ├── open-interpreter.ts # OI client
│   │   ├── mode-router.ts      # Dual mode routing logic
│   │   └── whatsapp.ts         # WhatsApp automation
│   │
│   ├── stores/
│   │   ├── modeStore.ts        # Mode Aman vs Mode Bebas
│   │   ├── voiceStore.ts       # Voice recording state
│   │   ├── chatStore.ts        # Conversation history
│   │   ├── workspaceStore.ts   # Workspace cards & tabs
│   │   ├── iotStore.ts         # IoT device states
│   │   ├── settingsStore.ts    # App settings
│   │   └── confirmationStore.ts # Global confirmation modal
│   │
│   ├── tools/
│   │   └── router.ts     # Tool handler (routes Gemini function calls)
│   │
│   └── hooks/
│       ├── useVoiceController.ts  # Voice command orchestrator
│       ├── useVoiceRecording.ts   # Mic recording
│       ├── useConfirmAction.ts    # Confirmation flow
│       └── useOIServer.ts         # OI server management
│
├── python/
│   └── oi-server/        # Open Interpreter FastAPI server
│       ├── main.py       # Server entry point
│       └── requirements.txt
│
└── external-repos/       # Reference implementations (separate branch)
    ├── cookbook          # Google Gemini examples
    ├── open-interpreter  # OI source code
    ├── KiCAD-MCP-Server  # KiCad automation
    └── ... (8 repos total)
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ dan npm/pnpm
- **Python** 3.10+ (untuk OI server)
- **Git**
- API Keys:
  - `VITE_GEMINI_API_KEY` (Google AI Studio)
  - `VITE_DEEPGRAM_API_KEY` (Deepgram)

### Installation

1. **Clone repository**
```bash
git clone https://github.com/Nexuszzz/TestJawir.git
cd TestJawir
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env dengan API keys Anda
```

4. **Setup Python OI Server** (optional - hanya untuk Mode Bebas)
```bash
cd python/oi-server
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### Run Development

```bash
npm run dev
```

Ini akan menjalankan:
- Vite dev server (frontend)
- Electron app
- Hot reload enabled

### Build Production

```bash
npm run build
```

Output: `dist-electron/` dan executable di `release/`

## 🎮 Usage

### Voice Commands

1. **Aktivasi**: Ucapkan "**Jawir**" untuk wake
2. **Berikan perintah**, contoh:
   - "Buka folder Downloads"
   - "Screenshot layar"
   - "Cari file proposal"
   - "Buat schematic powerbank"
   - "Kirim pesan WhatsApp ke Budi"
   - "Nyalakan buzzer alarm"
   - "Atur kecepatan kipas 75%"

### Mode Switching

- **Klik badge** di Header: `Mode Aman` ↔ `Mode Bebas`
- Atau: **Settings** → **Mode Settings** → Toggle

### Tabs & Workspace

- **KiCad**: Schematic templates, project management
- **Browser**: Web search results, URL content
- **WhatsApp**: Message queue, contact list
- **Google**: Gmail, Drive, Calendar (coming soon)
- **IoT**: Fire detection, fan dimmer control
- **Computer**: File search results, OI execution logs

## 🔒 Safety & Security

### Mode Aman (Default)
- ✅ IPC-only commands (no arbitrary code execution)
- ✅ Latency <500ms
- ✅ Safe untuk daily usage
- ✅ Whitelisted actions

### Mode Bebas (Advanced)
- ⚠️ Requires manual activation
- ⚠️ Confirmation modal untuk setiap action
- ⚠️ Risk levels: Low/Medium/High/Critical
- ⚠️ Countdown timer untuk critical actions (10s)
- ⚠️ Timeout 60 detik
- ⚠️ Folder restrictions
- ⚠️ Banned commands (rm -rf, format, registry edit)

### Confirmation Flow
- **WhatsApp send**: Selalu konfirmasi
- **File delete/Process kill**: Selalu konfirmasi
- **Shutdown/Restart**: Konfirmasi + 60s delay
- **OI actions**: Konfirmasi + risk-based countdown

## 📊 Architecture

### Dual Mode Routing

```
User Voice Input
    ↓
Gemini LLM → function_call
    ↓
Mode Router (mode-router.ts)
    ↓
    ├─→ IPC Handler (Mode Aman) → <500ms
    │   └─→ electron/main.ts → OS API
    │
    └─→ Open Interpreter (Mode Bebas) → 3-10s
        └─→ python/oi-server → Code execution
```

### Function Call Flow

```typescript
// Gemini generates:
{
  name: "open_application",
  args: { app_name: "chrome" }
}

// Router handles:
router.ts → handleOpenApplication() → computerControl.openApplication()
          → IPC: 'computer:openApp' → main.ts → exec('start chrome')
```

## 📚 Documentation

- **External References**: Switch ke branch `external-references` untuk source code reference repositories
- **Implementation Plan**: Lihat `repo-analysis/14-DUAL-MODE-IMPLEMENTATION-PLAN.md`
- **API Docs**: Coming soon di `/docs`

## 🛠️ Development

### Scripts
- `npm run dev` - Development mode
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run typecheck` - TypeScript validation
- `npm run lint` - ESLint check

### Branches
- `main` - Production codebase (Jawir OS app)
- `external-references` - Reference repositories (987 files, 159 MB)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

MIT License - feel free to use for personal or commercial projects

## 🙏 Credits

Powered by:
- [Google Gemini](https://ai.google.dev/)
- [Deepgram](https://deepgram.com/)
- [Open Interpreter](https://github.com/OpenInterpreter/open-interpreter)
- [openWakeWord](https://github.com/dscripka/openWakeWord)
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)

## 📞 Contact

- **GitHub**: [@Nexuszzz](https://github.com/Nexuszzz)
- **Repository**: [TestJawir](https://github.com/Nexuszzz/TestJawir)

---

**Built with ❤️ by Nexuszzz**

*Transforming voice into action, safely and powerfully.*
