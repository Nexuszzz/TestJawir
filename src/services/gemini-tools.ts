// Gemini Function Calling Tools Definition
// These are the tools that Gemini can call to perform actions

import { SchemaType } from '@google/generative-ai'

interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: SchemaType
    properties: Record<string, {
      type: SchemaType
      description: string
      enum?: string[]
    }>
    required: string[]
  }
}

export const GEMINI_TOOLS: Record<string, ToolDefinition> = {
  // ============================================
  // KICAD TOOLS
  // ============================================
  create_schematic: {
    name: 'create_schematic',
    description: 'Membuat skematik rangkaian elektronika menggunakan KiCad. Tersedia template: powerbank (modul charging TP4056), amplifier (PAM8403 5V stereo), dan led_indicator (rangkaian LED sederhana).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        template: {
          type: SchemaType.STRING,
          description: 'Jenis template skematik yang akan dibuat',
          enum: ['powerbank', 'amplifier', 'led_indicator'],
        },
        project_name: {
          type: SchemaType.STRING,
          description: 'Nama project untuk skematik (opsional, akan di-generate otomatis jika kosong)',
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
