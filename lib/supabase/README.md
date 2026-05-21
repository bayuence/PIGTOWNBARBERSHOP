# Supabase Module - Refactored Structure

## 📁 Struktur Folder

```
lib/supabase/
├── client.ts       # Supabase client & configuration
├── types.ts        # All TypeScript interfaces & types
├── realtime.ts     # Real-time subscriptions & broadcasts
├── utils.ts        # Utility functions (date, number, string, etc.)
├── index.ts        # Main entry point (exports all)
└── README.md       # This file
```

## 🎯 Tujuan Refactoring

File `supabase.ts` yang lama memiliki **2462 baris** kode yang sangat panjang dan sulit di-maintain. Refactoring ini memecah file besar tersebut menjadi beberapa file kecil yang lebih terorganisir.

### Keuntungan:
- ✅ **Lebih mudah dibaca** - Setiap file fokus pada satu tanggung jawab
- ✅ **Lebih mudah di-maintain** - Perubahan lebih terisolasi
- ✅ **Lebih mudah di-test** - Setiap modul bisa di-test terpisah
- ✅ **Lebih mudah dikembangkan** - Developer baru lebih cepat paham
- ✅ **Backward compatible** - Import lama masih berfungsi

## 📦 File Descriptions

### 1. `client.ts`
**Isi:** Konfigurasi Supabase client
- Supabase client instance
- Connection configuration
- Test connection function

**Export:**
```typescript
export const supabase
export const testSupabaseConnection
```

### 2. `types.ts`
**Isi:** Semua TypeScript interfaces & types
- User, Branch, Service types
- Transaction types
- Attendance, Kasbon, Expense types
- Commission, Points types
- Stats & Analytics types
- Utility types (PaymentMethod, UserRole, etc.)

**Export:**
```typescript
export type User, Branch, Service, Transaction, ...
export type PaymentMethod, UserRole, UserStatus, ...
```

### 3. `realtime.ts`
**Isi:** Real-time subscriptions & broadcasts
- Setup functions untuk real-time updates
- Broadcast event functions
- Channel management

**Export:**
```typescript
export function setupTransactionsRealtime()
export function setupAttendanceRealtime()
export function broadcastTransactionEvent()
export function subscribeToEvents()
...
```

### 4. `utils.ts`
**Isi:** Utility functions
- Date utilities (format, calculate business days)
- Number utilities (format rupiah, calculate percentage)
- String utilities (generate transaction number, truncate)
- Validation utilities (email, phone, PIN)
- Array utilities (groupBy, sumBy, unique)
- Storage utilities (localStorage helpers)

**Export:**
```typescript
export function formatRupiah()
export function formatDateIndonesia()
export function generateTransactionNumber()
export function isValidEmail()
...
```

### 5. `index.ts`
**Isi:** Main entry point
- Export semua dari file-file di atas
- Re-export dari file lama untuk backward compatibility

## 🔄 Backward Compatibility

File lama (`supabase.ts`) sudah di-rename menjadi `supabase-old.ts` dan masih bisa diakses.

Semua import yang lama **masih berfungsi**:

```typescript
// ✅ Cara lama (masih berfungsi)
import { supabase, User, Transaction } from '@/lib/supabase'

// ✅ Cara baru (lebih spesifik)
import { supabase } from '@/lib/supabase/client'
import type { User, Transaction } from '@/lib/supabase/types'
import { formatRupiah } from '@/lib/supabase/utils'
```

## 📝 Cara Penggunaan

### Import Client
```typescript
import { supabase } from '@/lib/supabase'

// Atau lebih spesifik:
import { supabase } from '@/lib/supabase/client'
```

### Import Types
```typescript
import type { User, Transaction, Branch } from '@/lib/supabase'

// Atau:
import type { User, Transaction } from '@/lib/supabase/types'
```

### Import Real-time Functions
```typescript
import { 
  setupTransactionsRealtime,
  broadcastTransactionEvent 
} from '@/lib/supabase'

// Atau:
import { setupTransactionsRealtime } from '@/lib/supabase/realtime'
```

### Import Utilities
```typescript
import { 
  formatRupiah, 
  formatDateIndonesia,
  generateTransactionNumber 
} from '@/lib/supabase'

// Atau:
import { formatRupiah } from '@/lib/supabase/utils'
```

## 🚀 Next Steps

### Phase 1: ✅ DONE
- [x] Buat struktur folder baru
- [x] Pisahkan client, types, realtime, utils
- [x] Buat index.ts sebagai entry point
- [x] Maintain backward compatibility

### Phase 2: TODO (Optional)
- [ ] Pindahkan fungsi-fungsi dari `supabase-old.ts` ke file-file baru:
  - [ ] `transactions.ts` - Transaction CRUD functions
  - [ ] `users.ts` - User management functions
  - [ ] `branches.ts` - Branch management functions
  - [ ] `attendance.ts` - Attendance functions
  - [ ] `kasbon.ts` - Kasbon functions
  - [ ] `expenses.ts` - Expense functions
  - [ ] `commissions.ts` - Commission functions
  - [ ] `points.ts` - Points functions

### Phase 3: TODO (Optional)
- [ ] Hapus `supabase-old.ts` setelah semua fungsi dipindahkan
- [ ] Update semua import di komponen untuk menggunakan struktur baru
- [ ] Add unit tests untuk setiap modul

## 📊 Comparison

### Before (File Lama)
```
lib/supabase.ts (2462 baris)
├── Client config
├── Types
├── Real-time
├── Utilities
├── Transaction functions
├── User functions
├── Branch functions
├── Attendance functions
├── Kasbon functions
├── Expense functions
├── Commission functions
└── Points functions
```

### After (Struktur Baru)
```
lib/supabase/
├── client.ts (60 baris)
├── types.ts (300 baris)
├── realtime.ts (180 baris)
├── utils.ts (250 baris)
└── index.ts (100 baris)

lib/supabase-old.ts (2462 baris - backup)
```

## 💡 Tips

1. **Gunakan import spesifik** untuk performa lebih baik:
   ```typescript
   // ❌ Import semua (lebih lambat)
   import * as supabase from '@/lib/supabase'
   
   // ✅ Import spesifik (lebih cepat)
   import { supabase } from '@/lib/supabase/client'
   import type { User } from '@/lib/supabase/types'
   ```

2. **Gunakan type-only imports** untuk types:
   ```typescript
   // ✅ Good
   import type { User, Transaction } from '@/lib/supabase/types'
   
   // ❌ Avoid (imports runtime code)
   import { User, Transaction } from '@/lib/supabase/types'
   ```

3. **Group imports** by module:
   ```typescript
   // Client
   import { supabase } from '@/lib/supabase/client'
   
   // Types
   import type { User, Transaction } from '@/lib/supabase/types'
   
   // Utils
   import { formatRupiah, formatDateIndonesia } from '@/lib/supabase/utils'
   ```

## 🆘 Troubleshooting

### Import Error
**Problem:** `Cannot find module '@/lib/supabase'`

**Solution:** 
- Pastikan file `lib/supabase.ts` ada
- Check `tsconfig.json` untuk path alias `@`

### Type Error
**Problem:** `Type 'User' is not defined`

**Solution:**
```typescript
// Add type import
import type { User } from '@/lib/supabase/types'
```

### Real-time Not Working
**Problem:** Real-time updates tidak berfungsi

**Solution:**
- Check Supabase dashboard untuk real-time settings
- Pastikan channel di-subscribe dengan benar
- Check console untuk error messages

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Check dokumentasi ini
2. Check file `supabase-old.ts` untuk referensi
3. Check Supabase documentation: https://supabase.com/docs

---

**Last Updated:** May 20, 2026
**Status:** ✅ Refactored & Ready to Use
