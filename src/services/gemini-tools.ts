// Gemini Function Calling Tools Definition
// These are the tools that Gemini can call to perform actions

import { SchemaType } from '@google/generative-ai'

// Recursive property type for nested schemas
interface PropertyDefinition {
  type: SchemaType
  description: string
  enum?: string[]
  items?: {
    type: SchemaType
    properties?: Record<string, PropertyDefinition>
    required?: string[]
  }
  properties?: Record<string, PropertyDefinition>
  required?: string[]
}

interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: SchemaType
    properties: Record<string, PropertyDefinition>
    required: string[]
  }
}

export const GEMINI_TOOLS: Record<string, ToolDefinition> = {
  // ============================================
  // KICAD TOOLS
  // ============================================

  /**
   * SCHEMATIC DESIGN dengan format JSON sederhana
   * AI hanya perlu specify komponen dan koneksi semantik
   * Converter yang handle koordinat pin dan wire routing
   */
  design_schematic: {
    name: 'design_schematic',
    description: `Desain skematik elektronika dengan format JSON sederhana.

FORMAT OUTPUT YANG HARUS KAMU IKUTI:
- components: Array komponen dengan type, reference, value, position
- wires: Array koneksi SEMANTIK (component + pin), BUKAN koordinat!
- labels: Array label power (opsional)

KOMPONEN TERSEDIA:

PASSIVE:
- resistor (R) - pin 1=atas, 2=bawah
- capacitor (C) - pin 1=atas, 2=bawah
- capacitor_polarized (C) - pin 1=+, 2=-
- inductor (L) - pin 1=atas, 2=bawah
- potentiometer (RV) - pin 1=bawah, 2=wiper, 3=atas

SEMICONDUCTORS:
- led (D) - pin 1=K, 2=A
- diode (D) - pin 1=K, 2=A
- zener (D) - pin 1=K, 2=A
- npn (Q) BC547 - pin 1=B, 2=C, 3=E
- pnp (Q) BC557 - pin 1=B, 2=C, 3=E

ICs:
- opamp (U) LM358 - pin 1=OUT, 2=IN-, 3=IN+, 4=VEE, 8=VCC
- ne555 (U) Timer - pin 1=GND, 2=TR, 3=Q, 4=R, 5=CV, 6=THR, 7=DIS, 8=VCC
- lm7805 (U) 5V reg - pin 1=VI, 2=GND, 3=VO
- lm7812 (U) 12V reg - pin 1=VI, 2=GND, 3=VO
- ams1117 (U) 3.3V LDO - pin 1=GND, 2=VOUT, 3=VIN
- lm317 (U) Adj reg - pin 1=ADJ, 2=VOUT, 3=VIN

SENSORS:
- dht11 (U) - pin 1=VCC, 2=DATA, 3=NC, 4=GND
- ldr (R) - pin 1=atas, 2=bawah
- pir (U) HC-SR501 - pin 1=VCC, 2=OUT, 3=GND

MICROCONTROLLERS:
- esp32 (U) ESP32-WROOM-32 38-pin module (1=GND, 2=3V3, 3=EN, 25=IO0, 34=RXD0, 35=TXD0)
- esp8266 (U) ESP-12 - pin 1=RST, 8=VCC, 9=GND
- arduino_nano (A) - pin 4=GND, 16=VIN, 19=5V
- attiny85 (U) 8-pin - pin 1=RST, 4=GND, 8=VCC

CONNECTORS:
- conn_2pin (J) - pin 1, 2
- conn_3pin (J) - pin 1, 2, 3
- battery (BT) - pin 1=+, 2=-
- switch (SW) - pin 1=left, 2=right

ATURAN POSISI (mm): Center=(127,100), spacing=25-30mm
MCU butuh ruang besar (~40mm)

⚠️ WIRING WAJIB - SETIAP PIN HARUS TERHUBUNG:
- LED: pin 1 (cathode) → GND, pin 2 (anode) → resistor
- Capacitor: pin 1 → power rail, pin 2 → GND
- IC Regulator: VIN, VOUT, GND semua HARUS di-wire!

CONTOH LENGKAP - LED dengan wiring ke GND:
components: [
  { type: "resistor", reference: "R1", value: "330", position: {x: 127, y: 80} },
  { type: "led", reference: "D1", position: {x: 127, y: 100} }
]
wires: [
  { from: {component: "R1", pin: 2}, to: {component: "D1", pin: 2} },
  { from: {component: "D1", pin: 1}, to: {component: "GND", pin: 1} }
]
☝️ LED cathode (pin 1) WAJIB ke GND!`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        project: {
          type: SchemaType.STRING,
          description: 'Nama project/rangkaian (untuk nama file)',
        },
        description: {
          type: SchemaType.STRING,
          description: 'Deskripsi rangkaian',
        },
        components: {
          type: SchemaType.ARRAY,
          description: 'Array komponen: type, reference, value, position',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              type: { type: SchemaType.STRING, description: 'Tipe: resistor, capacitor, led, diode, dll' },
              reference: { type: SchemaType.STRING, description: 'Reference: R1, C1, D1, dll' },
              value: { type: SchemaType.STRING, description: 'Nilai: 10k, 100uF, Red, dll' },
              position: {
                type: SchemaType.OBJECT,
                description: 'Posisi {x, y} dalam mm',
                properties: {
                  x: { type: SchemaType.NUMBER, description: 'Posisi X' },
                  y: { type: SchemaType.NUMBER, description: 'Posisi Y' },
                },
                required: ['x', 'y'],
              },
              rotation: { type: SchemaType.NUMBER, description: 'Rotasi opsional (0/90/180/270)' },
            },
            required: ['type', 'reference', 'position'],
          },
        },
        wires: {
          type: SchemaType.ARRAY,
          description: 'Koneksi wire SEMANTIK: from {component, pin} to {component, pin}',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              from: {
                type: SchemaType.OBJECT,
                description: 'Sumber koneksi',
                properties: {
                  component: { type: SchemaType.STRING, description: 'Reference komponen (R1, D1, dll)' },
                  pin: { type: SchemaType.NUMBER, description: 'Nomor pin (1 atau 2)' },
                },
                required: ['component', 'pin'],
              },
              to: {
                type: SchemaType.OBJECT,
                description: 'Tujuan koneksi',
                properties: {
                  component: { type: SchemaType.STRING, description: 'Reference komponen tujuan' },
                  pin: { type: SchemaType.NUMBER, description: 'Nomor pin tujuan' },
                },
                required: ['component', 'pin'],
              },
            },
            required: ['from', 'to'],
          },
        },
        labels: {
          type: SchemaType.ARRAY,
          description: 'Label power (VCC, GND, dll)',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: 'Nama label' },
              x: { type: SchemaType.NUMBER, description: 'Posisi X' },
              y: { type: SchemaType.NUMBER, description: 'Posisi Y' },
            },
            required: ['name', 'x', 'y'],
          },
        },
        open_kicad: {
          type: SchemaType.STRING,
          description: 'Buka KiCad setelah selesai?',
          enum: ['yes', 'no'],
        },
      },
      required: ['project', 'components', 'wires'],
    },
  },

  /**
   * TEMPLATE-BASED SCHEMATIC - Untuk rangkaian standar
   */
  create_schematic: {
    name: 'create_schematic',
    description: `Membuat skematik dari TEMPLATE yang sudah ada.
Gunakan ini untuk rangkaian standar. Untuk rangkaian custom, gunakan design_schematic.

TEMPLATE TERSEDIA:
- powerbank: Modul charging Li-Ion dengan TP4056
- led_indicator: LED dengan resistor current limiting
- amplifier: Audio amplifier PAM8403 5V stereo  
- fire_detection: ESP32 dengan sensor DHT11, MQ2, flame`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        template: {
          type: SchemaType.STRING,
          description: 'Template skematik',
          enum: ['powerbank', 'amplifier', 'led_indicator', 'fire_detection'],
        },
        project_name: {
          type: SchemaType.STRING,
          description: 'Nama project (opsional)',
        },
        open_kicad: {
          type: SchemaType.STRING,
          description: 'Buka KiCad setelah selesai?',
          enum: ['yes', 'no'],
        },
      },
      required: ['template'],
    },
  },

  open_kicad_project: {
    name: 'open_kicad_project',
    description: 'Membuka project KiCad yang sudah ada di aplikasi KiCad',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        project_path: {
          type: SchemaType.STRING,
          description: 'Path lengkap ke file project KiCad (.kicad_sch atau .kicad_pro)',
        },
      },
      required: ['project_path'],
    },
  },

  launch_kicad: {
    name: 'launch_kicad',
    description: 'Membuka aplikasi KiCad. Bisa tanpa project (kosong) atau dengan project tertentu.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        project_path: {
          type: SchemaType.STRING,
          description: 'Path ke project KiCad (opsional, jika kosong akan buka KiCad kosong)',
        },
      },
      required: [],
    },
  },

  // ============================================
  // IOT TOOLS
  // ============================================
  get_iot_status: {
    name: 'get_iot_status',
    description: 'Mendapatkan status perangkat IoT (fire detection atau dimmer kipas)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        device: {
          type: SchemaType.STRING,
          description: 'Perangkat yang ingin dicek statusnya',
          enum: ['fire_detection', 'fan_dimmer', 'all'],
        },
      },
      required: ['device'],
    },
  },

  control_buzzer: {
    name: 'control_buzzer',
    description: 'Mengontrol buzzer/alarm pada sensor fire detection',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        action: {
          type: SchemaType.STRING,
          description: 'Aksi yang dilakukan pada buzzer',
          enum: ['on', 'off'],
        },
      },
      required: ['action'],
    },
  },

  set_fan_speed: {
    name: 'set_fan_speed',
    description: 'Mengatur kecepatan kipas pada dimmer fan',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        speed: {
          type: SchemaType.NUMBER,
          description: 'Kecepatan kipas dalam persen (0-100). 0 = mati, 100 = maksimal',
        },
      },
      required: ['speed'],
    },
  },

  // ============================================
  // WHATSAPP TOOLS
  // ============================================
  send_whatsapp: {
    name: 'send_whatsapp',
    description: 'Mengirim pesan WhatsApp ke kontak. Memerlukan konfirmasi sebelum mengirim.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        contact_name: {
          type: SchemaType.STRING,
          description: 'Nama kontak penerima pesan',
        },
        message: {
          type: SchemaType.STRING,
          description: 'Isi pesan yang akan dikirim',
        },
      },
      required: ['contact_name', 'message'],
    },
  },

  // ============================================
  // COMPUTER CONTROL TOOLS
  // ============================================
  open_application: {
    name: 'open_application',
    description: 'Membuka aplikasi di komputer',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        app_name: {
          type: SchemaType.STRING,
          description: 'Nama aplikasi yang akan dibuka',
          enum: ['kicad', 'browser', 'chrome', 'vscode', 'explorer', 'notepad', 'terminal'],
        },
      },
      required: ['app_name'],
    },
  },

  open_folder: {
    name: 'open_folder',
    description: 'Membuka folder di File Explorer',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        folder_path: {
          type: SchemaType.STRING,
          description: 'Path folder yang akan dibuka (bisa relatif seperti "project" atau absolut)',
        },
      },
      required: ['folder_path'],
    },
  },

  find_file: {
    name: 'find_file',
    description: 'Mencari file di komputer berdasarkan nama atau keyword',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Kata kunci pencarian file (nama file atau sebagian nama)',
        },
        location: {
          type: SchemaType.STRING,
          description: 'Lokasi pencarian (opsional, default: D:\\expo)',
        },
        file_type: {
          type: SchemaType.STRING,
          description: 'Filter jenis file (opsional)',
          enum: ['all', 'documents', 'images', 'code', 'kicad'],
        },
      },
      required: ['query'],
    },
  },

  open_url: {
    name: 'open_url',
    description: 'Membuka URL di browser default',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        url: {
          type: SchemaType.STRING,
          description: 'URL yang akan dibuka',
        },
      },
      required: ['url'],
    },
  },

  set_volume: {
    name: 'set_volume',
    description: 'Mengatur volume suara komputer',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        level: {
          type: SchemaType.NUMBER,
          description: 'Level volume 0-100 (0 = mute, 100 = maksimal)',
        },
      },
      required: ['level'],
    },
  },

  toggle_mute: {
    name: 'toggle_mute',
    description: 'Toggle mute/unmute suara komputer',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },

  show_desktop: {
    name: 'show_desktop',
    description: 'Menampilkan desktop (minimize semua jendela)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },

  minimize_all: {
    name: 'minimize_all',
    description: 'Minimize semua jendela yang terbuka',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },

  lock_screen: {
    name: 'lock_screen',
    description: 'Mengunci layar komputer',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },

  take_screenshot: {
    name: 'take_screenshot',
    description: 'Mengambil screenshot layar dan menyimpan ke folder Pictures',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },

  system_power: {
    name: 'system_power',
    description: 'Mengontrol power sistem (shutdown, restart, sleep). Shutdown/restart memiliki delay 60 detik untuk pembatalan.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        action: {
          type: SchemaType.STRING,
          description: 'Aksi yang dilakukan',
          enum: ['shutdown', 'restart', 'sleep', 'cancel'],
        },
      },
      required: ['action'],
    },
  },

  // ============================================
  // WEB RESEARCH TOOLS
  // ============================================
  web_search: {
    name: 'web_search',
    description: 'Melakukan pencarian web dan mengambil informasi dari internet',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Query pencarian',
        },
        num_results: {
          type: SchemaType.NUMBER,
          description: 'Jumlah hasil yang diinginkan (default: 5)',
        },
      },
      required: ['query'],
    },
  },

  browse_url: {
    name: 'browse_url',
    description: 'Mengunjungi URL dan mengekstrak konten utama dari halaman web',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        url: {
          type: SchemaType.STRING,
          description: 'URL halaman yang akan dikunjungi',
        },
        extract_type: {
          type: SchemaType.STRING,
          description: 'Jenis konten yang diekstrak',
          enum: ['text', 'summary', 'full'],
        },
      },
      required: ['url'],
    },
  },

  // ============================================
  // GOOGLE WORKSPACE TOOLS
  // ============================================
  gmail_read: {
    name: 'gmail_read',
    description: 'Membaca email dari Gmail',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        filter: {
          type: SchemaType.STRING,
          description: 'Filter email',
          enum: ['unread', 'recent', 'important', 'all'],
        },
        count: {
          type: SchemaType.NUMBER,
          description: 'Jumlah email yang ditampilkan (default: 5)',
        },
      },
      required: ['filter'],
    },
  },

  drive_list: {
    name: 'drive_list',
    description: 'Menampilkan file dari Google Drive',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        folder: {
          type: SchemaType.STRING,
          description: 'Nama folder atau path (default: root)',
        },
        file_type: {
          type: SchemaType.STRING,
          description: 'Filter jenis file',
          enum: ['all', 'documents', 'spreadsheets', 'presentations', 'images'],
        },
      },
      required: [],
    },
  },

  calendar_events: {
    name: 'calendar_events',
    description: 'Mendapatkan jadwal dari Google Calendar',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        range: {
          type: SchemaType.STRING,
          description: 'Rentang waktu',
          enum: ['today', 'tomorrow', 'this_week', 'next_week'],
        },
      },
      required: ['range'],
    },
  },

  // ============================================
  // OPEN INTERPRETER TOOLS (Mode Bebas Only)
  // ============================================
  oi_execute: {
    name: 'oi_execute',
    description: 'Menjalankan kode atau perintah melalui Open Interpreter. HANYA tersedia di Mode Bebas. Gunakan untuk: menulis/menjalankan kode Python, membuat file/folder kompleks, menginstal package, mengotomasi tugas yang membutuhkan scripting, analisis data lanjutan.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        message: {
          type: SchemaType.STRING,
          description: 'Instruksi atau perintah untuk dieksekusi oleh Open Interpreter dalam bahasa natural',
        },
        language: {
          type: SchemaType.STRING,
          description: 'Bahasa pemrograman yang digunakan (default: auto)',
          enum: ['auto', 'python', 'javascript', 'shell', 'powershell', 'applescript'],
        },
        auto_run: {
          type: SchemaType.BOOLEAN,
          description: 'Jalankan kode otomatis tanpa konfirmasi (default: false untuk keamanan)',
        },
      },
      required: ['message'],
    },
  },

  oi_search_content: {
    name: 'oi_search_content',
    description: 'Mencari konten di dalam file menggunakan Open Interpreter. HANYA tersedia di Mode Bebas. Gunakan untuk: mencari teks dalam banyak file, regex search, mencari pattern di codebase.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Teks atau pattern regex yang dicari',
        },
        directory: {
          type: SchemaType.STRING,
          description: 'Direktori untuk pencarian (default: current directory)',
        },
        file_pattern: {
          type: SchemaType.STRING,
          description: 'Pattern file yang dicari (contoh: *.py, *.txt)',
        },
        use_regex: {
          type: SchemaType.BOOLEAN,
          description: 'Gunakan regex untuk pencarian (default: false)',
        },
      },
      required: ['query'],
    },
  },

  oi_batch_process: {
    name: 'oi_batch_process',
    description: 'Memproses banyak file sekaligus menggunakan Open Interpreter. HANYA tersedia di Mode Bebas. Gunakan untuk: rename batch, convert format, resize images, extract data dari banyak file.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        operation: {
          type: SchemaType.STRING,
          description: 'Jenis operasi batch yang dilakukan',
          enum: ['rename', 'convert', 'resize', 'extract', 'compress', 'custom'],
        },
        source_pattern: {
          type: SchemaType.STRING,
          description: 'Pattern file sumber (contoh: *.jpg, document_*.pdf)',
        },
        destination: {
          type: SchemaType.STRING,
          description: 'Folder tujuan atau pattern output',
        },
        custom_command: {
          type: SchemaType.STRING,
          description: 'Perintah kustom untuk operasi "custom"',
        },
      },
      required: ['operation', 'source_pattern'],
    },
  },

  oi_analyze_code: {
    name: 'oi_analyze_code',
    description: 'Menganalisis dan memodifikasi kode menggunakan Open Interpreter. HANYA tersedia di Mode Bebas. Gunakan untuk: refactoring, menambah fitur, memperbaiki bug di file yang ada.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        file_path: {
          type: SchemaType.STRING,
          description: 'Path ke file yang akan dianalisis/modifikasi',
        },
        action: {
          type: SchemaType.STRING,
          description: 'Aksi yang dilakukan pada kode',
          enum: ['analyze', 'refactor', 'add_feature', 'fix_bugs', 'optimize', 'document'],
        },
        instructions: {
          type: SchemaType.STRING,
          description: 'Instruksi spesifik untuk modifikasi (wajib untuk action selain analyze)',
        },
      },
      required: ['file_path', 'action'],
    },
  },
}
