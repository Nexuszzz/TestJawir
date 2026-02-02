# Project Standards & AI Knowledge Base

> **Tujuan:** Dokumen ini adalah "memori jangka panjang" untuk AI.  
> Setiap kali menemukan bug/fix baru, tambahkan di sini.

---

## 🚨 Lessons Learned (Error Yang Pernah Terjadi)

### 1. Invalid S-Expression Comments
| ❌ Salah | ✅ Benar |
|----------|----------|
| `(lib_symbols ;; PASSIVES ...)` | `(lib_symbols ...)` |

**Problem:** Format KiCAD S-expression **TIDAK** support komentar `;;`.  
**Impact:** File corrupt, tidak bisa dibuka.  
**Solution:** Hapus semua komentar dari file `.kicad_sch`.

---

### 2. Version Number Outdated
| ❌ Salah | ✅ Benar (KiCAD 9) |
|----------|---------------------|
| `(version 20230121)` | `(version 20231120)` |

**Problem:** Version lama menyebabkan warning "older version".

---

### 3. Symbol Tidak Terlihat (Offscreen Templates)
| ❌ Salah | ✅ Benar |
|----------|----------|
| `(at -100 -100 0)` | `(at 127 76.2 0)` |
| `(in_bom no)` | `(in_bom yes)` |
| `(dnp yes)` | `(dnp no)` |

**Problem:** Komponen ada tapi tidak terlihat karena:
- Koordinat negatif (offscreen)
- Marked sebagai "Do Not Populate"

**Solution:** Letakkan komponen di area positif (100-200mm) dengan `(in_bom yes) (dnp no)`.

---

### 4. Missing Instance Section
| ❌ Salah | ✅ Benar |
|----------|----------|
| Symbol tanpa `instances` | Wajib ada `(instances ...)` |

**Problem:** KiCAD 9 WAJIB punya section instance agar reference (R1, C1) muncul.

```lisp
(instances
  (project "ProjectName"
    (path "/UUID-root-schematic"
      (reference "R1")
      (unit 1)
    )
  )
)
```

---

### 5. Wiring Berantakan (Non-Orthogonal)
| ❌ Salah | ✅ Benar |
|----------|----------|
| Diagonal wires | Only horizontal + vertical |

**Solution:** Gunakan **2 segment wire** (L-shape) untuk koneksi diagonal.

---

### 6. Component Overlap / Spacing Terlalu Dekat
| Parameter | Minimum |
|-----------|---------|
| Jarak antar IC | 15mm |
| Jarak antar passive | 5-7mm |
| Grid alignment | 2.54mm (100mil) |

---

## ✅ Format Rules (KiCAD 9)

### Header Wajib
```lisp
(kicad_sch
  (version 20231120)
  (generator "kicad_sch")
  (generator_version "9.0")
  (uuid "unique-uuid-here")
  (paper "A4")
  ...
)
```

### Symbol Visibility Checklist
- [x] `(in_bom yes)`
- [x] `(on_board yes)`
- [x] `(dnp no)`
- [x] Koordinat positif (50-200mm range)
- [x] Ada `(instances ...)` section

---

## 📦 Common Components Reference

### Default Footprints
| Component | Footprint |
|-----------|-----------|
| Resistor | `Resistor_SMD:R_0603_1608Metric` |
| Capacitor | `Capacitor_SMD:C_0805_2012Metric` |
| LED | `LED_SMD:LED_0603_1608Metric` |
| Inductor | `Inductor_SMD:L_0805_2012Metric` |

---

## 🔧 MCP Server Config

```json
"kicad": {
  "command": "node",
  "args": ["D:/sijawir/KiCAD-MCP-Server/dist/index.js"],
  "env": {
    "PYTHONPATH": "D:\\el download semua\\kicad\\bin\\Lib\\site-packages",
    "PATH": "D:\\el download semua\\kicad\\bin;%PATH%",
    "KICAD_BACKEND": "swig",
    "LOG_LEVEL": "info"
  }
}
```

---

## 🔴 PCB Lessons Learned (KiCAD 9)

### 7. Missing UUID in PCB Elements
KiCAD 9 WAJIB UUID di **semua** elements:
- Footprints
- Pads
- Segments (traces)
- Zones
- gr_text, gr_rect, fp_line, etc.

### 8. gr_text Justify Format
| ❌ Salah | ✅ Benar |
|----------|----------|
| `(justify center)` | `(justify left bottom)` |

### 9. Property Syntax di Footprint
Property juga butuh UUID di KiCAD 9.

---

## ✅ PCB Format Rules (KiCAD 9)

### Header Wajib PCB
```lisp
(kicad_pcb
  (version 20240108)
  (generator "pcbnew")
  (generator_version "9.0")
  (general (thickness 1.6) (legacy_teardrops no))
  (paper "A4")
  ...
)
```

### Track Width Recommendations
| Signal Type | Width |
|-------------|-------|
| Power (VCC, GND) | 0.8mm - 1.0mm |
| Signal | 0.3mm - 0.5mm |
| High-speed | 0.25mm |
