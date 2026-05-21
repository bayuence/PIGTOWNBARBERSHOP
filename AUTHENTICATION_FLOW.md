# AUTHENTICATION FLOW - PIGTOWN BARBERSHOP

## OVERVIEW
Sistem autentikasi menggunakan **2 layer security**:
1. **Email/Password Login** - Akses ke dashboard utama
2. **PIN Verification** - Akses khusus ke Owner Dashboard

---

## FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN PAGE                                │
│                 (Email + Password)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Verify Email  │
              │  & Password    │
              │  (bcrypt)      │
              └────────┬───────┘
                       │
                ┌──────┴──────┐
                │             │
           ❌ GAGAL      ✅ BERHASIL
                │             │
                │             ▼
                │    ┌────────────────────────────────┐
                │    │   DASHBOARD UTAMA              │
                │    │   (Semua Menu Tersedia)        │
                │    │                                │
                │    │   ✅ Cashier System            │
                │    │   ✅ Pengeluaran               │
                │    │   ✅ Presensi                  │
                │    │   ✅ Poin                      │
                │    │   ✅ Kasbon                    │
                │    │   ✅ Transaksi                 │
                │    │   ✅ Laporan                   │
                │    │   🔒 Owner Dashboard (LOCKED)  │
                │    └────────────┬───────────────────┘
                │                 │
                │                 │ User klik "Owner Dashboard"
                │                 ▼
                │        ┌─────────────────┐
                │        │  PIN DIALOG     │
                │        │  (6 digit)      │
                │        └────────┬────────┘
                │                 │
                │          ┌──────┴──────┐
                │          │             │
                │     ❌ SALAH      ✅ BENAR
                │          │             │
                │          │             ▼
                │          │    ┌────────────────────┐
                │          │    │  OWNER DASHBOARD   │
                │          │    │  (Full Access)     │
                │          │    └────────────────────┘
                │          │
                ▼          ▼
         Error Message  Error Message
```

---

## DETAIL IMPLEMENTASI

### 1. LOGIN DENGAN EMAIL/PASSWORD

**File**: `lib/auth.ts` → `loginWithEmail()`

**Proses**:
1. User input email & password di `/login`
2. Query database: `SELECT * FROM users WHERE email = ?`
3. Verify password dengan `bcrypt.compare()`
4. Check status user: `status = 'active'`
5. Simpan session ke `localStorage`
6. Redirect ke `/dashboard`

**Data yang disimpan di localStorage**:
```json
{
  "id": "1",
  "email": "owner@pigtownbarbershop.com",
  "name": "Owner",
  "role": "owner",
  "status": "active",
  "branchId": null,
  "phone": null,
  "address": null,
  "position": null,
  "pin": "123456",
  "loginTime": "2026-05-20T10:30:00.000Z"
}
```

**Akses yang didapat**:
- ✅ Semua menu di dashboard KECUALI "Owner Dashboard"
- 🔒 Owner Dashboard masih terkunci (butuh PIN)

---

### 2. PIN VERIFICATION (Owner Dashboard)

**File**: `app/(dashboard)/owner/page.tsx`

**Proses**:
1. User sudah login dengan email/password
2. User klik menu "Owner Dashboard"
3. Muncul **PIN Dialog** (6 digit)
4. Verify PIN: Compare dengan `users.pin` di database
5. Jika benar → Akses Owner Dashboard
6. Jika salah → Error message

**PIN Dialog Component**:
```tsx
<PinAuthentication
  onSuccess={() => setIsPinVerified(true)}
  onCancel={() => router.push('/dashboard')}
/>
```

---

## SIAPA YANG BISA LOGIN?

### Berdasarkan Tabel `users`:

| Role    | Email Login | PIN Login (POS) | Owner Dashboard |
|---------|-------------|-----------------|-----------------|
| Owner   | ✅ Ya       | ✅ Ya           | ✅ Ya (+ PIN)   |
| Manager | ✅ Ya       | ✅ Ya           | ❌ Tidak        |
| Cashier | ✅ Ya       | ✅ Ya           | ❌ Tidak        |
| Barber  | ❌ Tidak*   | ✅ Ya           | ❌ Tidak        |

*Barber tidak perlu email login, cukup PIN di POS untuk transaksi

---

## PERTANYAAN YANG PERLU DIJAWAB USER

### ❓ 1. Siapa saja yang bisa login dengan email/password?
- [ ] Hanya Owner?
- [ ] Owner + Manager?
- [ ] Owner + Manager + Cashier?
- [ ] Semua karyawan?

### ❓ 2. Apa fungsi PIN di POS System?
- [ ] Untuk memilih barber yang melayani customer?
- [ ] Untuk login karyawan ke sistem?
- [ ] Untuk verifikasi transaksi?

### ❓ 3. Apakah karyawan (barber) perlu email?
- [ ] Ya, untuk login ke dashboard
- [ ] Tidak, cukup PIN untuk transaksi di POS

### ❓ 4. Apakah Manager/Cashier bisa akses Owner Dashboard?
- [ ] Ya, dengan PIN mereka sendiri
- [ ] Tidak, hanya Owner yang bisa

---

## CURRENT IMPLEMENTATION STATUS

### ✅ SUDAH BERFUNGSI:
1. Login dengan email/password → Akses dashboard utama
2. PIN verification untuk Owner Dashboard
3. Session management dengan localStorage
4. Password hashing dengan bcrypt

### ⚠️ PERLU KLARIFIKASI:
1. Role-based access control (siapa bisa akses apa)
2. PIN di POS vs PIN di Owner Dashboard (apakah sama?)
3. Apakah karyawan perlu email atau cukup PIN?

### 🔧 PERLU DIPERBAIKI:
1. Attendance system error (sedang diperbaiki)
2. TypeScript warnings di `lib/supabase.ts`

---

## REKOMENDASI

### Untuk Keamanan:
1. **Pisahkan PIN POS dan PIN Owner Dashboard**
   - PIN POS: 4 digit (untuk transaksi cepat)
   - PIN Owner: 6 digit (untuk akses dashboard)

2. **Tambahkan Role-Based Access Control (RBAC)**
   ```typescript
   const canAccessOwnerDashboard = (user: User) => {
     return user.role === 'owner'
   }
   ```

3. **Tambahkan Session Timeout**
   - Auto logout setelah 8 jam tidak aktif
   - Re-verify PIN setiap 1 jam di Owner Dashboard

4. **Audit Log**
   - Log semua akses ke Owner Dashboard
   - Log perubahan data penting (gaji, komisi, dll)

---

## TESTING CREDENTIALS

### Owner Account:
- **Email**: `owner@pigtownbarbershop.com`
- **Password**: `pemilik123`
- **PIN**: `123456`

### Test Flow:
1. Login dengan email/password → ✅ Masuk dashboard
2. Klik "Owner Dashboard" → 🔒 Muncul PIN dialog
3. Input PIN `123456` → ✅ Akses Owner Dashboard

---

## NEXT STEPS

1. ✅ Perbaiki attendance system error
2. ⏳ Klarifikasi pertanyaan authentication dengan user
3. ⏳ Implementasi RBAC jika diperlukan
4. ⏳ Tambahkan audit log untuk Owner Dashboard
