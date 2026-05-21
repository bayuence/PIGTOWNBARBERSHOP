# Refactoring Plan - Supabase Module

## 📊 Analisis File supabase-old.ts

**Total:** 2462 baris, 52 fungsi exported

## 🎯 Struktur Baru (Lengkap)

```
lib/supabase/
├── client.ts (51 baris) ✅ SUDAH ADA
├── types.ts (285 baris) ✅ SUDAH ADA
├── realtime.ts (176 baris) ✅ SUDAH ADA
├── utils.ts (252 baris) ✅ SUDAH ADA
├── branches.ts (~150 baris) ⏳ BARU
├── transactions.ts (~300 baris) ⏳ BARU
├── attendance.ts (~400 baris) ⏳ BARU
├── employees.ts (~500 baris) ⏳ BARU
├── kasbon.ts (~300 baris) ⏳ BARU
├── expenses.ts (~400 baris) ⏳ BARU
├── points.ts (~200 baris) ⏳ BARU
├── services.ts (~150 baris) ⏳ BARU
├── stock.ts (~100 baris) ⏳ BARU
└── index.ts (~150 baris) ⏳ UPDATE
```

**Total Baris Baru:** ~2900 baris (lebih lengkap dengan dokumentasi)

## 📝 Pembagian Fungsi per File

### 1. branches.ts (~150 baris)
- `getBranches()`
- `getBranchShifts()`
- `createBranchShift()`
- `updateBranchShift()`
- `deleteBranchShift()`

### 2. transactions.ts (~300 baris)
- `createTransaction()`
- `createTransactionItems()`
- `getTransactions()`
- `getTransactionById()`
- `updateTransaction()`
- `deleteTransaction()`
- `generateTransactionNumber()`
- `getReceiptTemplate()`
- `getActiveReceiptTemplate()`

### 3. attendance.ts (~400 baris)
- `createAttendanceRecord()`
- `updateAttendanceRecord()`
- `getAttendanceByDate()`
- `getAllAttendanceRecords()`
- `uploadPhotoToSupabase()`
- `getEmployeeAttendance()`
- `getEmployeePhotos()`
- `getEmployeeAttendanceWithPhotos()`
- `getAbsentEmployeesToday()`
- `getAttendanceStatistics()`

### 4. employees.ts (~500 baris)
- `getEmployees()`
- `addEmployee()`
- `updateEmployee()`
- `deleteEmployee()`
- `getEmployeeStats()`
- `getEmployeeCommissions()`
- `getEmployeeAbsenceInfo()`
- `updateMaxAbsentDays()`
- `getCurrentUser()`
- `updateUserPin()`

### 5. kasbon.ts (~300 baris)
- `getKasbonRequests()`
- `getKasbonStatistics()`
- `getUsersWithKasbon()`
- `createKasbonRequest()`
- `updateKasbonStatus()`
- `getKasbonHistory()`

### 6. expenses.ts (~400 baris)
- `getExpenses()`
- `getExpenseStatistics()`
- `getExpenseStatisticsByBranch()`
- `createExpenseRequest()`
- `updateExpenseRequest()`
- `updateExpenseStatus()`
- `deleteExpenseRequest()`
- `getAllExpensesWithDetails()`
- `getExpensesByStatus()`
- `getApprovedExpenses()`

### 7. points.ts (~200 baris)
- `getUsersWithPoints()`
- `getPointsStatistics()`
- `getPointTransactions()`
- `addPointTransaction()`
- `getUserPoints()`
- `updateUserPoints()`

### 8. services.ts (~150 baris)
- `getServicesWithCategories()`
- `getServiceCategories()`
- `getServiceById()`
- `createService()`
- `updateService()`
- `deleteService()`

### 9. stock.ts (~100 baris)
- `checkServiceStock()`
- `reduceServiceStock()`
- `updateServiceStock()`
- `getOutletStock()`
- `updateOutletStock()`
- `getLowStockAlerts()`

## ✅ Keuntungan Struktur Baru

1. **Modular** - Setiap file fokus pada satu domain
2. **Mudah Dicari** - Fungsi terorganisir berdasarkan kategori
3. **Mudah Di-Test** - Setiap modul bisa di-test terpisah
4. **Mudah Di-Maintain** - Perubahan lebih terisolasi
5. **Tidak Ada File "Old"** - Semua file baru dan rapi

## 🚀 Langkah Eksekusi

1. ✅ Buat file branches.ts
2. ✅ Buat file transactions.ts
3. ✅ Buat file attendance.ts
4. ✅ Buat file employees.ts
5. ✅ Buat file kasbon.ts
6. ✅ Buat file expenses.ts
7. ✅ Buat file points.ts
8. ✅ Buat file services.ts
9. ✅ Buat file stock.ts
10. ✅ Update index.ts untuk export semua
11. ✅ Update lib/supabase.ts
12. ✅ Hapus supabase-old.ts
13. ✅ Test build
14. ✅ Push ke GitHub

## ⏱️ Estimasi Waktu

- Pembuatan file: ~30 menit
- Testing: ~10 menit
- **Total: ~40 menit**

---

**Status:** Ready to execute
**Date:** May 20, 2026
