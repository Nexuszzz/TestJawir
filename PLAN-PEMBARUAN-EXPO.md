# 🔥 PLAN PEMBARUAN JAWIR OS - EXPO READY

> **Tanggal:** 1 Februari 2026  
> **Tujuan:** Semua fitur REAL, bukan mock. Expo harus bisa demo langsung.

---

## 📊 STATUS SAAT INI (FAKTA)

| Fitur | Status | Masalah |
|-------|--------|---------|
| Google Workspace | ❌ MOCK | Return dummy data, OAuth tidak jalan |
| Open Interpreter | ❌ TIDAK ADA | Pakai native Electron IPC saja |
| WhatsApp | ⚠️ Partial | Service ada, belum connect ke gateway |
| KiCad MCP | ⚠️ Partial | Belum terintegrasi penuh |
| IoT MQTT | ✅ Ready | Sudah configurable |
| Voice/STT | ✅ Ready | Deepgram + Wake Word |

---

## 🎯 TARGET PEMBARUAN

### PRIORITAS 1: Google Workspace (REAL OAuth)
**Deadline: 2 Hari**

#### 1.1 Setup Google Cloud Project
- [ ] Buat project di Google Cloud Console
- [ ] Enable APIs: Gmail, Drive, Calendar, Classroom
- [ ] Buat OAuth 2.0 credentials (Desktop App)
- [ ] Download `credentials.json`

#### 1.2 Implementasi OAuth Flow di Electron
- [ ] Buat `src/services/google-auth.ts` - handle OAuth popup
- [ ] Simpan token di secure storage (electron-store encrypted)
- [ ] Auto refresh token sebelum expired
- [ ] Handle logout/revoke

#### 1.3 Real API Calls
- [ ] Gmail: `getEmails()`, `sendEmail()` - real fetch
- [ ] Drive: `listFiles()`, `uploadFile()`, `createDoc()` - real
- [ ] Calendar: `getEvents()`, `createEvent()` - real
- [ ] Classroom: `getCourses()`, `getAssignments()` - real

#### 1.4 UI Integration
- [ ] GoogleTab.tsx - show real data
- [ ] Login button di Settings
- [ ] Status connected/disconnected

#### Files yang perlu diubah:
```
src/services/google-workspace.ts  → REWRITE (real API)
src/services/google-auth.ts       → CREATE NEW
electron/main.ts                  → Add OAuth IPC handlers
.env                              → Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
```

---

### PRIORITAS 2: Open Interpreter Integration
**Deadline: 3 Hari**

#### 2.1 Setup Open Interpreter Server
- [ ] Install: `pip install open-interpreter`
- [ ] Buat server wrapper dengan FastAPI
- [ ] Endpoint: `/execute` - terima prompt, return hasil
- [ ] Endpoint: `/confirm` - untuk konfirmasi aksi berbahaya
- [ ] Run as background service

#### 2.2 Electron Integration
- [ ] Buat `src/services/open-interpreter.ts`
- [ ] Connect ke OI server via HTTP/WebSocket
- [ ] Stream output real-time ke UI
- [ ] Handle confirmation modal

#### 2.3 Safety Layer (WAJIB untuk Expo)
- [ ] Whitelist commands yang aman
- [ ] Modal konfirmasi untuk file operations
- [ ] Modal konfirmasi untuk system commands
- [ ] Log semua eksekusi
- [ ] Sandbox mode untuk demo

#### 2.4 Tools Integration
- [ ] `search_files` - cari file di komputer
- [ ] `open_application` - buka app via OI
- [ ] `run_script` - jalankan script
- [ ] `organize_files` - rapihin folder
- [ ] `read_document` - baca & ringkas dokumen

#### Files yang perlu dibuat:
```
src/services/open-interpreter.ts      → CREATE (client)
src/components/modals/ConfirmActionModal.tsx → CREATE
python/oi-server/main.py             → CREATE (FastAPI server)
python/oi-server/requirements.txt    → CREATE
```

#### Struktur OI Server:
```python
# python/oi-server/main.py
from fastapi import FastAPI
from interpreter import interpreter
import asyncio

app = FastAPI()
interpreter.auto_run = False  # SAFETY: selalu minta konfirmasi

@app.post("/execute")
async def execute(prompt: str):
    # Stream response
    pass

@app.post("/confirm")
async def confirm(action_id: str, approved: bool):
    # User approve/reject
    pass
```

---

### PRIORITAS 3: WhatsApp Gateway Setup
**Deadline: 1 Hari**

#### 3.1 Setup go-whatsapp-web-multidevice
- [ ] Clone repo
- [ ] Build & run: `go run main.go`
- [ ] Scan QR dari HP
- [ ] Test endpoint `/send/message`

#### 3.2 Integration
- [ ] Connect service ke gateway
- [ ] Test send message
- [ ] Test receive message (webhook)

---

### PRIORITAS 4: KiCad MCP Full Integration
**Deadline: 2 Hari**

#### 4.1 Setup KiCad MCP Server
- [ ] Clone & install dependencies
- [ ] Configure untuk KiCad path lokal
- [ ] Test standalone

#### 4.2 Integration dengan Gemini
- [ ] Register KiCad tools di gemini-tools.ts
- [ ] Handler di router.ts
- [ ] Test: "Buat skematik LED 5V"

---

## 📁 STRUKTUR FILE BARU

```
jawir-os/
├── src/
│   ├── services/
│   │   ├── google-auth.ts          # NEW: OAuth handler
│   │   ├── google-workspace.ts     # REWRITE: Real API
│   │   ├── open-interpreter.ts     # NEW: OI client
│   │   └── kicad-mcp.ts           # NEW: KiCad client
│   │
│   ├── components/
│   │   └── modals/
│   │       └── ConfirmActionModal.tsx  # NEW: Safety confirmation
│   │
│   └── tools/
│       ├── google-tools.ts         # NEW: Google tool handlers
│       ├── oi-tools.ts             # NEW: OI tool handlers
│       └── kicad-tools.ts          # NEW: KiCad tool handlers
│
├── python/
│   └── oi-server/
│       ├── main.py                 # FastAPI server
│       ├── requirements.txt
│       └── config.py
│
└── .env
    ├── VITE_GOOGLE_CLIENT_ID
    ├── VITE_GOOGLE_CLIENT_SECRET
    ├── VITE_OI_SERVER_URL=http://localhost:8765
    └── VITE_KICAD_MCP_URL=http://localhost:3001
```

---

## 🔒 KEAMANAN EXPO

### Wajib Ada:
1. **ConfirmActionModal** - untuk semua aksi sensitif:
   - Kirim email/WhatsApp
   - Hapus/pindah file
   - Execute command
   - System operations

2. **Whitelist Mode** - hanya command tertentu yang boleh:
   ```typescript
   const SAFE_COMMANDS = [
     'open_app',
     'search_files', 
     'read_document',
     'create_folder',
     // NO: delete, shutdown, format, dll
   ]
   ```

3. **Demo Account** - pakai akun khusus expo:
   - Google account baru (bukan pribadi)
   - WhatsApp nomor khusus
   - Folder demo terpisah

---

## 📅 TIMELINE

| Hari | Task |
|------|------|
| **Hari 1** | Google OAuth setup + basic flow |
| **Hari 2** | Google APIs real implementation |
| **Hari 3** | Open Interpreter server setup |
| **Hari 4** | OI integration + safety modal |
| **Hari 5** | WhatsApp + KiCad integration |
| **Hari 6** | Testing + bug fix |
| **Hari 7** | Polish UI + demo script |

---

## 🎪 DEMO SCRIPT EXPO

### Demo 1: Google Workspace (30 detik)
```
User: "Jawir, tampilkan email terbaru"
→ Fetch real Gmail → Tampil di workspace

User: "Buat event meeting besok jam 10"
→ Modal konfirmasi → Create real Calendar event
```

### Demo 2: Open Interpreter (45 detik)
```
User: "Cari file proposal di folder Documents"
→ OI search → List files tampil

User: "Buka file proposal yang terbaru"
→ Modal konfirmasi → File terbuka

User: "Ringkas isi dokumen ini jadi 5 poin"
→ OI read + summarize → Ringkasan tampil
```

### Demo 3: KiCad (45 detik)
```
User: "Buat skematik LED dengan resistor 220 ohm"
→ KiCad MCP → Skematik generated → Preview tampil
```

### Demo 4: WhatsApp (30 detik)
```
User: "Kirim pesan ke Budi: Demo Jawir sukses!"
→ Modal konfirmasi → Pesan terkirim → Status tampil
```

### Demo 5: IoT (20 detik)
```
User: "Nyalakan lampu demo"
→ MQTT publish → Device ON → Status tampil
```

---

## ✅ CHECKLIST SEBELUM EXPO

- [ ] Semua API keys sudah diset
- [ ] Google OAuth tested dengan akun demo
- [ ] WhatsApp gateway running + paired
- [ ] Open Interpreter server running
- [ ] KiCad MCP server running
- [ ] Safety modals working
- [ ] Demo script practiced 3x
- [ ] Backup plan kalau ada yang gagal
- [ ] Laptop charged + charger ready
- [ ] Internet backup (hotspot HP)

---

## 🚨 BACKUP PLAN

Kalau ada yang gagal saat demo:

| Gagal | Backup |
|-------|--------|
| Google OAuth | Show cached data + "sedang sync" |
| Open Interpreter | Fallback ke native computer-control |
| WhatsApp | Show draft message "ready to send" |
| KiCad | Show pre-made schematic |
| Internet | Semua fitur offline-capable |

---

**MULAI DARI: Google Workspace OAuth (Prioritas 1)**
