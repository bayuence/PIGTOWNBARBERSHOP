# 🚀 LANGKAH SELANJUTNYA - PIGTOWN BARBERSHOP

## ✅ Yang Sudah Selesai:

1. ✅ Setup Drizzle ORM
2. ✅ Database schema lengkap (10 tabel)
3. ✅ Helper functions untuk query
4. ✅ Push ke GitHub

---

## 📝 LANGKAH BERIKUTNYA:

### **Step 1: Dapatkan Database Password** 🔑

Anda perlu password database Supabase untuk melanjutkan.

**Cara mendapatkan password:**

1. Buka **Supabase Dashboard**: https://supabase.com/dashboard
2. Pilih project: **leoriloxnohuwzyapcou**
3. Klik **Settings** → **Database**
4. Scroll ke **Connection String**
5. Pilih tab **URI**
6. Copy connection string, akan terlihat seperti ini:

```
postgresql://postgres.leoriloxnohuwzyapcou:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

7. Copy bagian `[YOUR-PASSWORD]` saja

**Jika lupa password:**
- Klik **Reset Database Password** di halaman yang sama
- Copy password baru yang muncul
- **SIMPAN PASSWORD INI!**

---

### **Step 2: Update File `.env`** 📄

Buka file `.env` dan ganti `[YOUR-PASSWORD]` dengan password yang sudah Anda dapatkan:

**SEBELUM:**
```env
DATABASE_URL=postgresql://postgres.leoriloxnohuwzyapcou:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**SESUDAH:**
```env
DATABASE_URL=postgresql://postgres.leoriloxnohuwzyapcou:password_asli_anda@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

⚠️ **PENTING:** Jangan ada spasi sebelum/sesudah password!

---

### **Step 3: Push Schema ke Database** 🗄️

Setelah `DATABASE_URL` sudah benar, jalankan:

```bash
npm run db:push
```

**Apa yang terjadi:**
- ✅ Drizzle akan membaca schema dari `lib/db/schema.ts`
- ✅ Membuat 10 tabel di Supabase:
  - users
  - branches
  - services
  - transactions
  - transaction_items
  - attendance
  - kasbon
  - expenses
  - points
  - receipt_templates
- ✅ Membuat semua enum types
- ✅ Membuat foreign key relations

**Output yang diharapkan:**
```
✓ Pulling schema from database...
✓ Changes detected!
✓ Applying changes...
✓ Done!
```

---

### **Step 4: Verifikasi Database** ✅

**Opsi 1: Drizzle Studio (Recommended)**

```bash
npm run db:studio
```

Akan membuka browser di `https://local.drizzle.studio`

**Opsi 2: Supabase Dashboard**

1. Buka Supabase Dashboard
2. Klik **Table Editor**
3. Anda akan melihat 10 tabel baru!

---

### **Step 5: Seed Data Awal** 🌱

Setelah tabel berhasil dibuat, kita perlu menambahkan data awal:

1. **Owner Account** - Akun utama untuk login
2. **Branches** - Minimal 1 cabang
3. **Services** - Daftar layanan (haircut, styling, dll)
4. **Products** - Daftar produk (pomade, shampoo, dll)

**Saya akan buatkan seed script untuk ini!**

---

### **Step 6: Update Vercel Environment Variables** 🌐

Tambahkan `DATABASE_URL` ke Vercel:

1. Buka **Vercel Dashboard**
2. Pilih project **pigtownbarbershop**
3. Klik **Settings** → **Environment Variables**
4. Klik **Add New**
5. Tambahkan:
   - **Key:** `DATABASE_URL`
   - **Value:** (paste connection string lengkap)
   - **Environment:** Centang semua (Production, Preview, Development)
6. Klik **Save**
7. Redeploy project

---

## 🎯 Kenapa Pakai Drizzle ORM?

### **Keuntungan:**

1. **Type-Safety** ✅
   ```typescript
   // Autocomplete & type checking!
   const user = await db.query.users.findFirst({
     where: eq(users.email, 'test@example.com'),
     with: {
       branch: true, // Autocomplete!
     },
   });
   ```

2. **Relational Queries** ✅
   ```typescript
   // Get transaction with all items & barber info
   const transaction = await db.query.transactions.findFirst({
     where: eq(transactions.id, transactionId),
     with: {
       items: {
         with: {
           service: true,
           barber: true,
         },
       },
       cashier: true,
       branch: true,
     },
   });
   ```

3. **Migration Management** ✅
   - Track semua perubahan database
   - Rollback jika ada masalah
   - Version control untuk schema

4. **Better Performance** ✅
   - Query optimization
   - Connection pooling
   - Prepared statements

5. **Developer Experience** ✅
   - Drizzle Studio untuk visual editing
   - Clear error messages
   - Easy debugging

---

## 📊 Contoh Penggunaan:

### **Login User:**
```typescript
import { getUserByEmail } from '@/lib/db/queries';

const user = await getUserByEmail('admin@pigtown.com');
if (user && user.password === hashedPassword) {
  // Login success!
}
```

### **Create Transaction:**
```typescript
import { db } from '@/lib/db';
import { transactions, transactionItems } from '@/lib/db/schema';

const newTransaction = await db.insert(transactions).values({
  transactionNumber: 'TRX-001',
  branchId: 'branch-uuid',
  cashierId: 'cashier-uuid',
  subtotal: '100000',
  total: '100000',
  paymentMethod: 'cash',
  paymentAmount: '100000',
  cashierName: 'John Doe',
  branchName: 'Pigtown Sudirman',
}).returning();

await db.insert(transactionItems).values({
  transactionId: newTransaction[0].id,
  serviceId: 'service-uuid',
  barberId: 'barber-uuid',
  quantity: 1,
  price: '100000',
  subtotal: '100000',
  serviceName: 'Haircut Premium',
  serviceType: 'service',
  serviceCategory: 'haircut',
  barberName: 'Barber A',
});
```

### **Get Today's Revenue:**
```typescript
import { getDashboardStats } from '@/lib/db/queries';

const stats = await getDashboardStats('branch-uuid', new Date());
console.log(stats.revenue); // Total revenue hari ini
console.log(stats.transactionCount); // Jumlah transaksi
console.log(stats.employeesPresent); // Karyawan hadir
```

---

## 🆘 Troubleshooting:

### **Error: "Connection refused"**
- ✅ Cek `DATABASE_URL` di `.env`
- ✅ Pastikan password benar
- ✅ Pastikan tidak ada spasi di connection string

### **Error: "relation already exists"**
- ✅ Tabel sudah ada, tidak masalah
- ✅ Drizzle akan skip tabel yang sudah ada

### **Error: "password authentication failed"**
- ✅ Password salah
- ✅ Reset password di Supabase Dashboard

---

## 📞 Next Action:

**Setelah Step 1-4 selesai, beritahu saya dan saya akan:**
1. ✅ Buatkan seed script untuk data awal
2. ✅ Update komponen untuk pakai Drizzle ORM
3. ✅ Setup authentication dengan Drizzle
4. ✅ Test semua fitur

---

## 📚 Resources:

- **Drizzle Docs:** https://orm.drizzle.team/docs/overview
- **Supabase Docs:** https://supabase.com/docs
- **Database Setup Guide:** Lihat file `DATABASE_SETUP.md`

---

**🎉 Selamat! Anda sudah setup Drizzle ORM dengan benar!**

Tinggal jalankan `npm run db:push` dan database siap digunakan! 🚀
