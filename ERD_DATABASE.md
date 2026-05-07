
@startuml

!define Table(name,desc) class name as "desc" << (T,#FFAAAA) >>
!define primary_key(x) <b>x</b>
!define foreign_key(x) <i>x</i>
!define column(x) x

hide methods
hide stereotypes

entity users {
  primary_key(id : UUID)
  --
  email : VARCHAR
  name : VARCHAR
  phone : VARCHAR
  position : VARCHAR
  status : VARCHAR
  foreign_key(branch_id : UUID)
  salary : DECIMAL
  commission_rate : DECIMAL
  max_absent_days : INT
  pin : VARCHAR
  created_at : TIMESTAMP
}

entity branches {
  primary_key(id : UUID)
  --
  name : VARCHAR
  address : VARCHAR
  phone : VARCHAR
  status : VARCHAR
  manager_id : UUID
  operating_hours : JSONB
  created_at : TIMESTAMP
}

entity branch_shifts {
  primary_key(id : UUID)
  --
  foreign_key(branch_id : UUID)
  shift_name : VARCHAR
  shift_type : VARCHAR
  start_time : TIME
  end_time : TIME
  is_active : BOOLEAN
  created_at : TIMESTAMP
}

entity services {
  primary_key(id : UUID)
  --
  foreign_key(category_id : UUID)
  name : VARCHAR
  description : TEXT
  price : DECIMAL
  duration : INT
  type : VARCHAR
  status : VARCHAR
  stock : INT
  commission_rate : DECIMAL
  created_at : TIMESTAMP
}

entity service_categories {
  primary_key(id : UUID)
  --
  name : VARCHAR
  description : TEXT
  is_active : BOOLEAN
  created_at : TIMESTAMP
}

entity transactions {
  primary_key(id : UUID)
  --
  transaction_number : VARCHAR
  receipt_number : VARCHAR
  foreign_key(cashier_id : UUID)
  foreign_key(server_id : UUID)
  foreign_key(branch_id : UUID)
  cashier_name : VARCHAR
  server_name : VARCHAR
  branch_name : VARCHAR
  customer_name : VARCHAR
  subtotal : DECIMAL
  discount_amount : DECIMAL
  total_amount : DECIMAL
  payment_method : VARCHAR
  payment_status : VARCHAR
  notes : TEXT
  created_at : TIMESTAMP
}

entity transaction_items {
  primary_key(id : UUID)
  --
  foreign_key(transaction_id : UUID)
  foreign_key(service_id : UUID)
  foreign_key(barber_id : UUID)
  service_name : VARCHAR
  service_type : VARCHAR
  service_category : VARCHAR
  quantity : INT
  unit_price : DECIMAL
  total_price : DECIMAL
  commission_amount : DECIMAL
  commission_status : VARCHAR
  created_at : TIMESTAMP
}

entity attendance {
  primary_key(id : UUID)
  --
  foreign_key(user_id : UUID)
  foreign_key(branch_id : UUID)
  date : DATE
  shift_type : VARCHAR
  check_in_time : TIME
  check_out_time : TIME
  break_start_time : TIME
  break_end_time : TIME
  total_hours : DECIMAL
  break_duration : DECIMAL
  status : VARCHAR
  check_in_photo : TEXT
  check_out_photo : TEXT
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity kasbon {
  primary_key(id : UUID)
  --
  foreign_key(user_id : UUID)
  amount : DECIMAL
  reason : TEXT
  status : VARCHAR
  request_date : DATE
  due_date : DATE
  notes : TEXT
  foreign_key(approved_by : UUID)
  approved_at : TIMESTAMP
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity expenses {
  primary_key(id : UUID)
  --
  foreign_key(branch_id : UUID)
  foreign_key(requested_by : UUID)
  foreign_key(approved_by : UUID)
  category : VARCHAR
  description : TEXT
  amount : DECIMAL
  status : VARCHAR
  expense_date : DATE
  due_date : DATE
  receipt_url : TEXT
  notes : TEXT
  approved_at : TIMESTAMP
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity points {
  primary_key(id : UUID)
  --
  foreign_key(user_id : UUID)
  points_earned : INT
  points_type : VARCHAR
  description : TEXT
  created_at : TIMESTAMP
}

entity commission_rules {
  primary_key(id : UUID)
  --
  foreign_key(user_id : UUID)
  foreign_key(service_id : UUID)
  commission_rate : DECIMAL
  commission_type : VARCHAR
  is_active : BOOLEAN
  created_at : TIMESTAMP
}

entity receipt_templates {
  primary_key(id : UUID)
  --
  foreign_key(branch_id : UUID)
  name : VARCHAR
  template_name : VARCHAR
  header_text : TEXT
  footer_text : TEXT
  logo_url : TEXT
  paper_width : INT
  is_active : BOOLEAN
  is_default : BOOLEAN
  show_logo : BOOLEAN
  show_address : BOOLEAN
  show_phone : BOOLEAN
  created_at : TIMESTAMP
}

users ||--|{ attendance
users ||--|{ kasbon
users ||--|{ expenses
users ||--|{ points
users ||--|{ commission_rules
users ||--|{ transactions
users ||--|{ transaction_items
users }|--|| branches

branches ||--|{ branch_shifts
branches ||--|{ transactions
branches ||--|{ attendance
branches ||--|{ expenses
branches ||--|{ receipt_templates

service_categories ||--|{ services
services ||--|{ transaction_items
services ||--|{ commission_rules

transactions ||--|{ transaction_items

@enduml
```

---

## Cara Import ERD ke Draw.io:

### **PILIHAN 1: Dari PlantUML Text (RECOMMENDED)**

Dari screenshot Anda, pilih: **"Dari Teks..." → "PlantUML..."**

1. Buka Draw.io: https://app.diagrams.net/
2. Klik menu **Arrange** → **Insert** → **Advanced** → **PlantUML...**
3. **Copy SEMUA code PlantUML** dari blok ```plantuml di atas (mulai dari `@startuml` sampai `@enduml`)
4. **Paste** ke dialog PlantUML
5. Klik **Insert PlantUML**
6. Diagram ERD akan muncul otomatis!

### **PILIHAN 2: Via PlantUML Server**

1. Buka: https://www.plantuml.com/plantuml/uml/
2. Paste code PlantUML
3. Klik **Submit**
4. Download sebagai PNG/SVG
5. Import gambar ke Draw.io

---

## Penjelasan Struktur Database:

### **13 Tabel Utama:**

1. **users** - Karyawan (Owner, Admin, Kasir, Barber)
2. **branches** - Cabang barbershop
3. **branch_shifts** - Shift kerja per cabang
4. **services** - Layanan & produk
5. **service_categories** - Kategori layanan
6. **transactions** - Transaksi POS
7. **transaction_items** - Detail transaksi
8. **attendance** - Presensi karyawan
9. **kasbon** - Kasbon karyawan
10. **expenses** - Pengeluaran cabang
11. **points** - Sistem poin karyawan
12. **commission_rules** - Aturan komisi
13. **receipt_templates** - Template struk

### **Notasi Relasi:**

```
||--o{ : One-to-Many
}o--|| : Many-to-One
||--|| : One-to-One
}o--o{ : Many-to-Many
```

**Contoh:**
- `users }o--|| branches` : Banyak users bekerja di 1 branch
- `transactions ||--o{ transaction_items` : 1 transaction punya banyak items

---

## Legend:

- **Bold** = Primary Key (PK)
- *Italic* = Foreign Key (FK)
- `<<PK>>` = Primary Key marker
- `<<FK>>` = Foreign Key marker

---

## Tips untuk Proposal:

1. **Insert ERD** di BAB 3.6: Perancangan Database
2. **Tambahkan penjelasan** untuk setiap tabel (1-2 paragraf)
3. **Jelaskan relasi** antar tabel
4. **Sebutkan constraint**: Primary Key, Foreign Key, Unique
5. **Tambahkan normalisasi**: Database sudah dalam bentuk 3NF

---

## Database Statistics:

| Tabel | Estimasi Records/Bulan | Growth Rate |
|-------|------------------------|-------------|
| transactions | 1,000 - 5,000 | High |
| transaction_items | 3,000 - 15,000 | High |
| attendance | 600 - 1,200 | Medium |
| users | 20 - 50 | Low |
| services | 30 - 100 | Low |
| kasbon | 10 - 50 | Low |
| expenses | 50 - 200 | Medium |
| points | 100 - 500 | Medium |

---

## Tech Stack:

- **Database:** PostgreSQL 15 (Supabase)
- **ORM:** Supabase Client SDK
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage
- **Region:** Asia Southeast (Singapore)

---

## Kontak Tim:
- Ari Setia Hinanda
- Bayu Nurcahyo
- M. Ari Affandi
- M. Risky Ardiansyah

**Sistem:** PIGTOWNBARBERHOP Management System
