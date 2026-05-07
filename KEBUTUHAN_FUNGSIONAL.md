# KEBUTUHAN FUNGSIONAL (FUNCTIONAL REQUIREMENTS)
## SISTEM MANAJEMEN BARBERSHOP - PIGTOWN BARBERHOP

---

## INFORMASI DOKUMEN
- **Nama Proyek:** PIGTOWNBARBERHOP Management System
- **Platform:** Web Application (Next.js, React, Supabase)
- **Versi Dokumen:** 1.0
- **Tanggal:** November 2025
- **Penyusun:** Berdasarkan Analisis Komponen Sistem

---

## DAFTAR KEBUTUHAN FUNGSIONAL

### **KF-001: Manajemen Autentikasi & Keamanan**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-001.1** | Sistem harus menyediakan form login dengan email dan password | Analisis Komponen | **Tinggi** |
| **KF-001.2** | Sistem harus dapat memvalidasi kredensial pengguna terhadap database Supabase | Analisis Komponen | **Tinggi** |
| **KF-001.3** | Dashboard owner harus dilengkapi autentikasi PIN 6 digit untuk keamanan berlapis | Analisis owner-dashboard.tsx | **Tinggi** |
| **KF-001.4** | Sistem harus dapat menyimpan dan mengupdate PIN keamanan pengguna | Analisis owner-dashboard.tsx | **Tinggi** |
| **KF-001.5** | Sistem harus mendukung update password dan email pengguna | Analisis owner-dashboard.tsx | **Sedang** |

---

### **KF-002: Sistem Point of Sale (POS)**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-002.1** | Kasir harus dapat memilih multi-layanan dalam satu transaksi | Analisis pos-system.tsx | **Tinggi** |
| **KF-002.2** | Sistem harus dapat menampilkan layanan (service) dan produk (product) terpisah | Analisis pos-system.tsx | **Tinggi** |
| **KF-002.3** | Sistem harus dapat mengatur diskon (persentase atau nominal tetap) dengan alasan opsional | Analisis pos-system.tsx | **Tinggi** |
| **KF-002.4** | Sistem harus mendukung metode pembayaran: Tunai, Debit, QRIS | Analisis pos-system.tsx | **Tinggi** |
| **KF-002.5** | Sistem harus otomatis menghitung kembalian untuk pembayaran tunai | Analisis pos-system.tsx | **Tinggi** |
| **KF-002.6** | Transaksi harus tersimpan ke database secara real-time | Analisis pos-system.tsx | **Tinggi** |
| **KF-002.7** | Sistem harus dapat mencetak struk transaksi via browser atau Bluetooth thermal printer | Analisis pos-system.tsx | **Tinggi** |
| **KF-002.8** | Sistem harus mencatat barberman yang melayani setiap transaksi untuk perhitungan komisi | Analisis pos-system.tsx | **Tinggi** |
| **KF-002.9** | Sistem harus otomatis mengurangi stok produk setelah transaksi berhasil | Analisis pos-system.tsx | **Tinggi** |
| **KF-002.10** | Sistem harus dapat memilih cabang tempat transaksi dilakukan | Analisis pos-system.tsx | **Tinggi** |
| **KF-002.11** | Sistem harus dapat menampilkan template struk yang dapat dikustomisasi (logo, header, footer) | Analisis pos-system.tsx | **Sedang** |
| **KF-002.12** | Sistem harus mendukung filter layanan berdasarkan kategori dan tipe | Analisis pos-system.tsx | **Sedang** |
| **KF-002.13** | Sistem harus otomatis menghitung komisi untuk setiap transaksi layanan | Analisis pos-system.tsx | **Tinggi** |

---

### **KF-003: Manajemen Karyawan**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-003.1** | Sistem harus dapat menyimpan data karyawan lengkap: nama, email, telepon, posisi, PIN keamanan, status | Analisis employee-management.tsx | **Tinggi** |
| **KF-003.2** | Manager/Admin harus dapat menambah, mengubah, dan menghapus data karyawan | Analisis employee-management.tsx | **Tinggi** |
| **KF-003.3** | Sistem harus dapat mengatur status karyawan: Aktif, Tidak Aktif, Cuti | Analisis employee-management.tsx | **Tinggi** |
| **KF-003.4** | Sistem harus dapat menampilkan statistik performa karyawan (total transaksi, revenue, komisi) | Analisis employee-management.tsx | **Sedang** |
| **KF-003.5** | Sistem harus dapat menampilkan detail kehadiran karyawan (tingkat kehadiran, jam kerja, lembur) | Analisis employee-management.tsx | **Sedang** |
| **KF-003.6** | Sistem harus dapat menyimpan dan mengelola gaji pokok karyawan | Analisis employee-management.tsx | **Tinggi** |
| **KF-003.7** | Sistem harus dapat mengelola hari libur karyawan dengan batas maksimal per bulan | Analisis employee-management.tsx | **Sedang** |
| **KF-003.8** | Sistem harus dapat menampilkan informasi karyawan yang tidak hadir hari ini | Analisis employee-management.tsx | **Sedang** |
| **KF-003.9** | Sistem harus dapat filter karyawan berdasarkan status dan pencarian nama/email/posisi | Analisis employee-management.tsx | **Sedang** |
| **KF-003.10** | Sistem harus menampilkan total gaji (gaji pokok + komisi) per karyawan | Analisis employee-management.tsx | **Tinggi** |

---

### **KF-004: Sistem Presensi (Attendance)**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-004.1** | Sistem harus menyediakan fitur check-in dengan foto selfie sebagai bukti kehadiran | Analisis attendance-system.tsx | **Tinggi** |
| **KF-004.2** | Sistem harus menyediakan fitur check-out dengan foto selfie | Analisis attendance-system.tsx | **Tinggi** |
| **KF-004.3** | Karyawan harus dapat memilih cabang dan shift saat check-in | Analisis attendance-system.tsx | **Tinggi** |
| **KF-004.4** | Sistem harus dapat mengelola shift kerja berdasarkan cabang (pagi, siang, malam) | Analisis attendance-system.tsx | **Tinggi** |
| **KF-004.5** | Sistem harus dapat mencatat waktu istirahat (break start/end) karyawan | Analisis attendance-system.tsx | **Sedang** |
| **KF-004.6** | Sistem harus menghitung total jam kerja secara otomatis (waktu kerja - waktu istirahat) | Analisis attendance-system.tsx | **Tinggi** |
| **KF-004.7** | Sistem harus menghasilkan laporan kehadiran harian dengan ringkasan | Analisis attendance-system.tsx | **Tinggi** |
| **KF-004.8** | Sistem harus dapat menampilkan status karyawan: Hadir, Tidak Hadir, Istirahat, Sudah Pulang | Analisis attendance-system.tsx | **Tinggi** |
| **KF-004.9** | Sistem harus dapat mengakses kamera perangkat untuk foto presensi | Analisis attendance-system.tsx | **Tinggi** |
| **KF-004.10** | Sistem harus dapat menyimpan foto check-in dan check-out karyawan | Analisis attendance-system.tsx | **Tinggi** |
| **KF-004.11** | Sistem harus dapat filter presensi berdasarkan tanggal dan cabang | Analisis attendance-system.tsx | **Sedang** |

---

### **KF-005: Manajemen Kasbon**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-005.1** | Karyawan/Admin dapat mengajukan kasbon dengan jumlah dan alasan | Analisis kasbon-management.tsx | **Tinggi** |
| **KF-005.2** | Owner/Manager dapat menyetujui atau menolak pengajuan kasbon dengan alasan | Analisis kasbon-management.tsx | **Tinggi** |
| **KF-005.3** | Sistem harus dapat melacak status kasbon: Pending, Approved, Rejected, Paid | Analisis kasbon-management.tsx | **Tinggi** |
| **KF-005.4** | Sistem harus dapat menyimpan riwayat kasbon setiap karyawan | Analisis kasbon-management.tsx | **Tinggi** |
| **KF-005.5** | Sistem harus dapat menampilkan tanggal jatuh tempo pembayaran kasbon | Analisis kasbon-management.tsx | **Tinggi** |
| **KF-005.6** | Sistem harus dapat mencatat pembayaran kasbon (lunas atau cicilan) | Analisis kasbon-management.tsx | **Tinggi** |
| **KF-005.7** | Sistem harus dapat menghitung sisa kasbon yang belum dibayar | Analisis kasbon-management.tsx | **Tinggi** |
| **KF-005.8** | Sistem harus dapat memperpanjang tanggal jatuh tempo kasbon | Analisis kasbon-management.tsx | **Sedang** |
| **KF-005.9** | Sistem harus menampilkan warning untuk kasbon yang terlambat | Analisis kasbon-management.tsx | **Sedang** |
| **KF-005.10** | Sistem harus dapat menampilkan progress bar pembayaran kasbon | Analisis kasbon-management.tsx | **Sedang** |

---

### **KF-006: Manajemen Layanan & Produk**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-006.1** | Admin dapat menambah, mengubah, dan menghapus layanan (service) dengan nama, harga, durasi, kategori | Analisis pos-system.tsx | **Tinggi** |
| **KF-006.2** | Admin dapat menambah, mengubah, dan menghapus produk (product) dengan stok per outlet | Analisis pos-system.tsx | **Tinggi** |
| **KF-006.3** | Sistem harus dapat mengatur kategori layanan (Potong Rambut, Cukur, Perawatan Rambut, Styling) | Analisis pos-system.tsx | **Sedang** |
| **KF-006.4** | Sistem harus dapat mengatur status layanan/produk: Aktif atau Tidak Aktif | Analisis pos-system.tsx | **Sedang** |
| **KF-006.5** | Sistem harus dapat menampilkan daftar layanan aktif di POS | Analisis pos-system.tsx | **Tinggi** |
| **KF-006.6** | Sistem harus dapat melacak stok produk per outlet/cabang | Analisis pos-system.tsx | **Tinggi** |
| **KF-006.7** | Sistem harus dapat menampilkan peringatan ketika stok produk mencapai minimum | Analisis pos-system.tsx | **Sedang** |

---

### **KF-007: Manajemen Pengeluaran Operasional**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-007.1** | Admin harus dapat mencatat pengeluaran setiap cabang | Analisis kelolapengeluarancabang.tsx | **Tinggi** |
| **KF-007.2** | Sistem harus menyediakan kategorisasi pengeluaran (Gaji, Utilitas, Supplies, Sewa, Peralatan, Lainnya) | Analisis kelolapengeluarancabang.tsx | **Tinggi** |
| **KF-007.3** | Sistem harus dapat menyimpan bukti pengeluaran (foto/dokumen) | Analisis kelolapengeluarancabang.tsx | **Sedang** |
| **KF-007.4** | Sistem harus dapat menghasilkan laporan pengeluaran terperinci per cabang | Analisis kelolapengeluarancabang.tsx | **Tinggi** |
| **KF-007.5** | Sistem harus dapat filter pengeluaran berdasarkan tanggal, cabang, dan kategori | Analisis kelolapengeluarancabang.tsx | **Sedang** |
| **KF-007.6** | Sistem harus dapat menghitung total pengeluaran per kategori | Analisis kelolapengeluarancabang.tsx | **Tinggi** |

---

### **KF-008: Sistem Bonus dan Penalty**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-008.1** | Manager dapat memberikan bonus kepada karyawan berdasarkan performa | Analisis points-management.tsx | **Sedang** |
| **KF-008.2** | Manager dapat memberikan penalty untuk pelanggaran karyawan | Analisis points-management.tsx | **Sedang** |
| **KF-008.3** | Sistem harus dapat mencatat kategori bonus/penalty dengan deskripsi | Analisis points-management.tsx | **Sedang** |
| **KF-008.4** | Bonus dan penalty harus berpengaruh langsung terhadap perhitungan gaji | Analisis points-management.tsx | **Tinggi** |
| **KF-008.5** | Sistem harus menyimpan riwayat transaksi bonus dan penalty | Analisis points-management.tsx | **Sedang** |
| **KF-008.6** | Sistem harus dapat menampilkan total bonus dan total penalty per karyawan | Analisis points-management.tsx | **Sedang** |
| **KF-008.7** | Sistem harus dapat menampilkan net amount (bonus - penalty) per karyawan | Analisis points-management.tsx | **Sedang** |

---

### **KF-009: Manajemen Komisi Karyawan**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-009.1** | Sistem harus dapat mengatur aturan komisi per layanan per karyawan | Analisis kontrol-komisi.tsx | **Tinggi** |
| **KF-009.2** | Sistem harus mendukung tipe komisi: Persentase atau Nominal Tetap | Analisis kontrol-komisi.tsx | **Tinggi** |
| **KF-009.3** | Sistem harus otomatis menghitung komisi dari transaksi layanan | Analisis pos-system.tsx | **Tinggi** |
| **KF-009.4** | Sistem harus dapat menampilkan status komisi: Credited, Pending, No Commission | Analisis pos-system.tsx | **Tinggi** |
| **KF-009.5** | Sistem harus dapat menampilkan total komisi yang didapat karyawan | Analisis kontrol-komisi.tsx | **Tinggi** |
| **KF-009.6** | Sistem harus dapat menampilkan rincian komisi per transaksi | Analisis kontrol-komisi.tsx | **Sedang** |

---

### **KF-010: Manajemen Penggajian**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-010.1** | Sistem harus dapat menghitung gaji karyawan berdasarkan: gaji pokok + komisi + bonus - penalty - kasbon | Analisis kontrol-gaji.tsx | **Tinggi** |
| **KF-010.2** | Sistem harus dapat menampilkan rincian perhitungan gaji setiap karyawan | Analisis kontrol-gaji.tsx | **Tinggi** |
| **KF-010.3** | Admin dapat melihat slip gaji detail setiap karyawan | Analisis kontrol-gaji.tsx | **Tinggi** |
| **KF-010.4** | Sistem harus dapat menghasilkan laporan penggajian bulanan | Analisis kontrol-gaji.tsx | **Tinggi** |
| **KF-010.5** | Sistem harus dapat export slip gaji ke format PDF | Analisis kontrol-gaji.tsx | **Sedang** |

---

### **KF-011: Dashboard Owner**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-011.1** | Dashboard harus menampilkan overview bisnis real-time | Analisis owner-dashboard.tsx | **Tinggi** |
| **KF-011.2** | Dashboard harus menampilkan ringkasan pendapatan dan pengeluaran seluruh cabang | Analisis owner-dashboard.tsx | **Tinggi** |
| **KF-011.3** | Dashboard harus menampilkan performa karyawan di semua cabang | Analisis owner-dashboard.tsx | **Sedang** |
| **KF-011.4** | Dashboard harus menampilkan perbandingan performa antar cabang | Analisis owner-dashboard.tsx | **Sedang** |
| **KF-011.5** | Dashboard harus menampilkan grafik dan visualisasi data interaktif | Analisis owner-dashboard.tsx | **Sedang** |
| **KF-011.6** | Dashboard harus menampilkan status koneksi database real-time | Analisis owner-dashboard.tsx | **Sedang** |
| **KF-011.7** | Owner harus dapat mengatur pengaturan akun (email, password, PIN) | Analisis owner-dashboard.tsx | **Tinggi** |

---

### **KF-012: Manajemen Cabang**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-012.1** | Admin dapat menambah, mengubah, dan menghapus data cabang | Analisis branch-management.tsx | **Tinggi** |
| **KF-012.2** | Sistem harus dapat menyimpan informasi cabang: nama, alamat, telepon, manager, jam operasional | Analisis branch-management.tsx | **Tinggi** |
| **KF-012.3** | Sistem harus dapat mengatur status cabang: Aktif, Tidak Aktif, Maintenance | Analisis branch-management.tsx | **Tinggi** |
| **KF-012.4** | Sistem harus dapat mengelola shift kerja per cabang | Analisis branch-management.tsx | **Tinggi** |
| **KF-012.5** | Sistem harus dapat menampilkan statistik cabang (revenue, jumlah customer, rating) | Analisis branch-management.tsx | **Sedang** |
| **KF-012.6** | Sistem harus dapat mengatur target cabang (revenue, customers, services) | Analisis branch-management.tsx | **Sedang** |
| **KF-012.7** | Sistem harus dapat menampilkan karyawan yang bekerja di setiap cabang | Analisis branch-management.tsx | **Sedang** |

---

### **KF-013: Laporan & Analytics**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-013.1** | Sistem harus dapat menghasilkan laporan transaksi harian, bulanan, dan custom periode | Analisis comprehensive-reports.tsx | **Tinggi** |
| **KF-013.2** | Sistem harus dapat menghasilkan laporan pendapatan dan pengeluaran | Analisis comprehensive-reports.tsx | **Tinggi** |
| **KF-013.3** | Sistem harus dapat menghasilkan laporan performa karyawan | Analisis comprehensive-reports.tsx | **Sedang** |
| **KF-013.4** | Sistem harus dapat menghasilkan laporan kehadiran/presensi | Analisis comprehensive-reports.tsx | **Tinggi** |
| **KF-013.5** | Sistem harus dapat menghasilkan laporan financial (revenue, expenses, profit margin) | Analisis financial-reports.tsx | **Tinggi** |
| **KF-013.6** | Sistem harus mendukung ekspor semua laporan ke format PDF | Analisis comprehensive-reports.tsx | **Sedang** |
| **KF-013.7** | Sistem harus menyediakan filter laporan berdasarkan rentang tanggal dan cabang | Analisis comprehensive-reports.tsx | **Sedang** |
| **KF-013.8** | Sistem harus dapat menampilkan grafik perbandingan performa antar cabang | Analisis financial-reports.tsx | **Sedang** |
| **KF-013.9** | Sistem harus dapat menampilkan breakdown pengeluaran per kategori | Analisis financial-reports.tsx | **Sedang** |
| **KF-013.10** | Sistem harus dapat menampilkan ranking cabang berdasarkan profit | Analisis financial-reports.tsx | **Sedang** |

---

### **KF-014: Riwayat Transaksi**

| ID | Deskripsi Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| **KF-014.1** | Sistem harus dapat menampilkan riwayat transaksi lengkap dengan detail | Analisis transaction-history.tsx | **Tinggi** |
| **KF-014.2** | Sistem harus dapat filter transaksi berdasarkan tanggal, cabang, metode pembayaran | Analisis transaction-history.tsx | **Tinggi** |
| **KF-014.3** | Sistem harus dapat menampilkan detail item transaksi (layanan/produk, quantity, harga) | Analisis transaction-history.tsx | **Tinggi** |
| **KF-014.4** | Sistem harus dapat menampilkan informasi diskon dan pembayaran | Analisis transaction-history.tsx | **Tinggi** |
| **KF-014.5** | Sistem harus dapat mencetak ulang struk transaksi | Analisis transaction-history.tsx | **Sedang** |

---

## CATATAN IMPLEMENTASI

### Teknologi yang Digunakan:
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL + Real-time)
- **UI Components:** shadcn/ui
- **State Management:** React Hooks
- **Charts:** Recharts
- **Printing:** Browser Print API, Bluetooth Web API (untuk thermal printer)

### Fitur Real-time:
Sistem menggunakan Supabase Realtime untuk sinkronisasi data otomatis di:
- Transaksi POS
- Presensi karyawan
- Update stok produk
- Status kasbon

### Keamanan:
- Autentikasi Supabase (JWT)
- PIN 6 digit untuk Owner Dashboard
- Row Level Security (RLS) di Supabase
- Validasi di client dan server side

---

## PRIORITAS IMPLEMENTASI

### **High Priority (Must Have):**
- Autentikasi & Keamanan
- POS System dengan multi-service & payment
- Manajemen Karyawan dasar
- Presensi dengan foto
- Kasbon Management
- Komisi & Penggajian

### **Medium Priority (Should Have):**
- Dashboard Owner dengan analytics
- Laporan lengkap
- Manajemen Cabang detail
- Bonus & Penalty System
- Manajemen Stok Produk

### **Low Priority (Nice to Have):**
- Export PDF advanced
- Custom receipt template
- Bluetooth printer integration
- Target & KPI tracking

---

**Dokumen ini disusun berdasarkan analisis mendalam terhadap komponen sistem yang sudah diimplementasikan di PIGTOWNBARBERHOP.**

**Tanggal Pembuatan:** November 2025  
**Status:** ✅ Sesuai dengan Implementasi Aktual
