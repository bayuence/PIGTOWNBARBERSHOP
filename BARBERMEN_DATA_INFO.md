# DATA BARBERMEN - PIGTOWN BARBERSHOP

## 📋 OVERVIEW

Total: **12 Barbermen** tersebar di 4 cabang

Setiap cabang punya:
- 1 Senior Barber
- 1 Barber (Regular)
- 1 Junior Barber

---

## 👥 DAFTAR BARBERMEN PER CABANG

### 🏢 CABANG SUDIRMAN

| No | Nama | Email | PIN | Position | Salary | Komisi | Phone |
|----|------|-------|-----|----------|--------|--------|-------|
| 1 | Ahmad Rizki | ahmad.rizki@pigtownbarbershop.com | 111111 | Senior Barber | Rp 5.000.000 | 15% | 081234567801 |
| 2 | Fajar Nugroho | fajar.nugroho@pigtownbarbershop.com | 111112 | Barber | Rp 4.000.000 | 12% | 081234567802 |
| 3 | Rudi Hartono | rudi.hartono@pigtownbarbershop.com | 111113 | Junior Barber | Rp 3.500.000 | 10% | 081234567803 |

### 🏢 CABANG KEMANG

| No | Nama | Email | PIN | Position | Salary | Komisi | Phone |
|----|------|-------|-----|----------|--------|--------|-------|
| 4 | Budi Santoso | budi.santoso@pigtownbarbershop.com | 222221 | Senior Barber | Rp 5.000.000 | 15% | 081234567804 |
| 5 | Agus Setiawan | agus.setiawan@pigtownbarbershop.com | 222222 | Barber | Rp 4.000.000 | 12% | 081234567805 |
| 6 | Doni Prasetyo | doni.prasetyo@pigtownbarbershop.com | 222223 | Junior Barber | Rp 3.500.000 | 10% | 081234567806 |

### 🏢 CABANG SENAYAN

| No | Nama | Email | PIN | Position | Salary | Komisi | Phone |
|----|------|-------|-----|----------|--------|--------|-------|
| 7 | Dedi Kurniawan | dedi.kurniawan@pigtownbarbershop.com | 333331 | Senior Barber | Rp 5.000.000 | 15% | 081234567807 |
| 8 | Hendra Wijaya | hendra.wijaya@pigtownbarbershop.com | 333332 | Barber | Rp 4.000.000 | 12% | 081234567808 |
| 9 | Irfan Maulana | irfan.maulana@pigtownbarbershop.com | 333333 | Junior Barber | Rp 3.500.000 | 10% | 081234567809 |

### 🏢 CABANG KELAPA GADING

| No | Nama | Email | PIN | Position | Salary | Komisi | Phone |
|----|------|-------|-----|----------|--------|--------|-------|
| 10 | Eko Prasetyo | eko.prasetyo@pigtownbarbershop.com | 444441 | Senior Barber | Rp 5.000.000 | 15% | 081234567810 |
| 11 | Joko Susilo | joko.susilo@pigtownbarbershop.com | 444442 | Barber | Rp 4.000.000 | 12% | 081234567811 |
| 12 | Kevin Ananda | kevin.ananda@pigtownbarbershop.com | 444443 | Junior Barber | Rp 3.500.000 | 10% | 081234567812 |

---

## 🔐 LOGIN CREDENTIALS

### Password (Semua Barber):
```
barber123
```

### PIN Pattern:
- **Sudirman**: 111111, 111112, 111113
- **Kemang**: 222221, 222222, 222223
- **Senayan**: 333331, 333332, 333333
- **Kelapa Gading**: 444441, 444442, 444443

---

## 💰 SALARY STRUCTURE

| Position | Gaji Pokok | Komisi | Total (estimasi) |
|----------|------------|--------|------------------|
| Senior Barber | Rp 5.000.000 | 15% | Rp 6.500.000+ |
| Barber | Rp 4.000.000 | 12% | Rp 5.200.000+ |
| Junior Barber | Rp 3.500.000 | 10% | Rp 4.500.000+ |

*Total estimasi termasuk komisi dari transaksi

---

## 📊 STATISTICS

- **Total Barbermen**: 12 orang
- **Total Cabang**: 4 cabang
- **Barber per Cabang**: 3 orang
- **Total Gaji Pokok**: Rp 51.000.000/bulan
- **Average Salary**: Rp 4.250.000/orang

---

## 🎯 CARA MENGGUNAKAN

### 1. Insert Data ke Database
Jalankan file SQL di Supabase SQL Editor:
```sql
-- File: INSERT_BARBERMEN_DATA.sql
```

### 2. Verifikasi Data
Jalankan query ini:
```sql
SELECT 
  id, name, email, pin, position, branch_id, salary, commission_rate
FROM users 
WHERE role = 'barber'
ORDER BY branch_id, position DESC, name;
```

### 3. Test Login
Pilih salah satu barber dan login:
- **Email**: `ahmad.rizki@pigtownbarbershop.com`
- **Password**: `barber123`

### 4. Test di POS
Di POS System, pilih barber dengan PIN:
- Input PIN: `111111` (Ahmad Rizki)
- Pilih service
- Checkout

---

## 🔧 TROUBLESHOOTING

### Error: "duplicate key value violates unique constraint"
**Solusi**: Email sudah ada di database. Hapus data lama atau ubah email.

```sql
-- Hapus data barber lama (HATI-HATI!)
DELETE FROM users WHERE role = 'barber';
```

### Error: "branch_id not found"
**Solusi**: Pastikan data branches sudah ada.

```sql
-- Cek branches
SELECT id, name FROM branches;
```

### Error: "password hash invalid"
**Solusi**: Password hash sudah benar. Pastikan bcrypt library terinstall.

---

## 📝 NOTES

1. **Password Hash**: Menggunakan bcrypt dengan salt rounds 10
2. **PIN**: 6 digit angka untuk transaksi di POS
3. **Status**: Semua barber status 'active'
4. **Role**: Semua role 'barber' (bukan 'owner' atau 'manager')
5. **Branch Assignment**: Setiap barber assigned ke 1 cabang

---

## 🚀 NEXT STEPS

Setelah insert data:

1. ✅ Test login dengan salah satu barber
2. ✅ Test attendance system (check-in/check-out)
3. ✅ Test POS system (pilih barber dengan PIN)
4. ✅ Test commission calculation
5. ✅ Test salary report

---

Silakan jalankan SQL file dan test! 🎯
