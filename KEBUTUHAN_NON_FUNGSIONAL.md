# KEBUTUHAN NON-FUNGSIONAL (NON-FUNCTIONAL REQUIREMENTS)
## SISTEM MANAJEMEN BARBERSHOP - PIGTOWN BARBERSHOP

---

## INFORMASI DOKUMEN
- **Nama Proyek:** PIGTOWNBARBERHOP Management System
- **Platform:** Web Application (Next.js, React, Supabase)
- **Versi Dokumen:** 1.0
- **Tanggal:** November 2025
- **Penyusun:** Berdasarkan Analisis Sistem dan Standar Industri

---

## PENGANTAR

Kebutuhan Non-Fungsional (Non-Functional Requirements/NFR) mendefinisikan karakteristik kualitas sistem yang harus dipenuhi untuk memastikan sistem dapat beroperasi dengan baik, aman, dan sesuai dengan ekspektasi pengguna. Dokumen ini mencakup aspek-aspek kritis seperti performa, keamanan, usability, reliability, dan aspek teknis lainnya yang mendukung kesuksesan implementasi sistem PIGTOWNBARBERHOP.

---

## DAFTAR KEBUTUHAN NON-FUNGSIONAL

### **KNF-001: USABILITY (Kemudahan Penggunaan)**

| ID | Aspek | Deskripsi Kebutuhan | Kriteria Penerimaan | Prioritas |
|---|---|---|---|---|
| **KNF-001.1** | Ease of Learning | Sistem harus mudah dipelajari oleh pengguna baru dengan pelatihan minimal | - Waktu pembelajaran untuk kasir: maksimal 2 jam<br>- Waktu pembelajaran untuk admin: maksimal 4 jam<br>- Waktu pembelajaran untuk owner: maksimal 1 jam<br>- Tersedia tutorial interaktif untuk setiap modul utama | **Tinggi** |
| **KNF-001.2** | User Interface | Antarmuka pengguna harus intuitif dan konsisten di seluruh sistem | - Desain mengikuti prinsip UI/UX modern<br>- Navigasi maksimal 3 klik untuk fitur utama<br>- Konsistensi warna, font, dan layout di semua halaman<br>- Ikon dan label jelas dalam Bahasa Indonesia | **Tinggi** |
| **KNF-001.3** | Error Handling | Sistem harus menampilkan pesan error yang jelas dan membantu | - Pesan error dalam Bahasa Indonesia<br>- Menjelaskan apa yang salah dan cara memperbaikinya<br>- Tidak menampilkan technical error ke end user<br>- Validasi input real-time dengan feedback visual | **Tinggi** |
| **KNF-001.4** | Responsive Design | Sistem harus dapat diakses dengan baik dari berbagai ukuran layar | - Desktop: 1920x1080, 1366x768 optimal<br>- Tablet: 768x1024 fully functional<br>- Mobile: 375x667 minimal (view only untuk beberapa fitur)<br>- Layout auto-adjust tanpa horizontal scroll | **Tinggi** |
| **KNF-001.5** | Accessibility | Sistem harus accessible untuk pengguna dengan berbagai kemampuan | - Kontras warna minimal WCAG AA standard<br>- Font size minimal 14px untuk body text<br>- Keyboard navigation support<br>- Alt text untuk semua gambar penting | **Sedang** |
| **KNF-001.6** | Help & Documentation | Sistem harus menyediakan bantuan kontekstual | - Tooltip untuk fitur kompleks<br>- FAQ section untuk masalah umum<br>- Video tutorial untuk modul utama<br>- Contact support mudah diakses | **Sedang** |

---

### **KNF-002: PERFORMANCE (Kinerja Sistem)**

| ID | Aspek | Deskripsi Kebutuhan | Kriteria Penerimaan | Prioritas |
|---|---|---|---|---|
| **KNF-002.1** | Response Time | Sistem harus merespons dengan cepat untuk operasi umum | - Page load: maksimal 3 detik (koneksi 5 Mbps)<br>- Transaksi POS: maksimal 2 detik<br>- Login: maksimal 2 detik<br>- Search/Filter: maksimal 1 detik<br>- API response: rata-rata < 500ms | **Tinggi** |
| **KNF-002.2** | Database Performance | Query database harus efisien | - Simple query: < 100ms<br>- Complex query (join): < 500ms<br>- Report generation: < 5 detik untuk data 1 bulan<br>- Indexing optimal untuk frequent queries | **Tinggi** |
| **KNF-002.3** | Concurrent Users | Sistem harus mendukung multiple users secara bersamaan | - Minimal 30 concurrent users tanpa degradasi<br>- Maksimal 50 concurrent users dengan performa acceptable<br>- No data corruption pada concurrent transactions<br>- Proper locking mechanism untuk critical operations | **Tinggi** |
| **KNF-002.4** | File Upload | Upload foto dan dokumen harus cepat | - Foto presensi (max 2MB): < 3 detik<br>- Dokumen bukti (max 5MB): < 5 detik<br>- Compress gambar otomatis untuk optimasi<br>- Progress indicator untuk upload > 2 detik | **Sedang** |
| **KNF-002.5** | Caching | Sistem harus menggunakan caching untuk optimasi | - Static assets cached di browser<br>- Frequent queries cached di server<br>- Cache invalidation otomatis saat data berubah<br>- CDN untuk asset delivery (jika memungkinkan) | **Sedang** |
| **KNF-002.6** | Real-time Updates | Data real-time harus update dengan minimal delay | - Dashboard metrics update: setiap 10 detik<br>- Transaction updates: delay maksimal 3 detik<br>- Attendance status: real-time (< 2 detik)<br>- Notification: instant (< 2 detik) | **Tinggi** |

---

### **KNF-003: SECURITY (Keamanan Sistem)**

| ID | Aspek | Deskripsi Kebutuhan | Kriteria Penerimaan | Prioritas |
|---|---|---|---|---|
| **KNF-003.1** | Authentication | Sistem harus memiliki mekanisme autentikasi yang kuat | - Email & password authentication (Supabase Auth)<br>- Password hashing menggunakan bcrypt/Argon2<br>- Session management dengan JWT token<br>- Auto logout setelah 8 jam inactive<br>- Remember me option (30 hari) | **Tinggi** |
| **KNF-003.2** | PIN Security | Owner dashboard harus dilindungi PIN 6 digit | - PIN hashing di database<br>- Maksimal 5x percobaan gagal = lock 3 menit<br>- PIN dapat diubah oleh owner<br>- PIN tidak boleh sequential (123456) atau repetitive (111111) | **Tinggi** |
| **KNF-003.3** | Authorization | Sistem harus membatasi akses berdasarkan role | - Role-Based Access Control (RBAC): Owner, Admin, Kasir, Karyawan<br>- Row Level Security (RLS) di Supabase<br>- API authorization di setiap endpoint<br>- Minimal privilege principle | **Tinggi** |
| **KNF-003.4** | Data Encryption | Data sensitif harus dienkripsi | - HTTPS untuk semua komunikasi<br>- Password encrypted di database<br>- Sensitive data encrypted at rest<br>- SSL/TLS certificate valid | **Tinggi** |
| **KNF-003.5** | Input Validation | Semua input user harus divalidasi | - Client-side validation untuk UX<br>- Server-side validation (mandatory)<br>- SQL injection prevention<br>- XSS attack prevention<br>- CSRF token untuk form submissions | **Tinggi** |
| **KNF-003.6** | Audit Trail | Sistem harus mencatat aktivitas penting | - Log semua login attempts<br>- Log transaksi finansial<br>- Log perubahan data karyawan<br>- Log approval/rejection<br>- Timestamp dan user ID di setiap log | **Sedang** |
| **KNF-003.7** | Data Privacy | Data pribadi harus dilindungi | - Compliance dengan regulasi perlindungan data<br>- Tidak share data ke third party tanpa consent<br>- Hak pengguna untuk hapus data personal<br>- Data minimization principle | **Sedang** |
| **KNF-003.8** | Session Security | Session management harus aman | - Secure session cookies (HttpOnly, Secure flag)<br>- Session timeout setelah periode inactive<br>- Logout invalidate session di server<br>- Prevent session fixation | **Tinggi** |

---

### **KNF-004: RELIABILITY (Keandalan Sistem)**

| ID | Aspek | Deskripsi Kebutuhan | Kriteria Penerimaan | Prioritas |
|---|---|---|---|---|
| **KNF-004.1** | Availability | Sistem harus tersedia sepanjang waktu operasional | - Uptime minimal 99% (downtime < 7 jam/bulan)<br>- Scheduled maintenance di luar jam operasional<br>- Notification sebelum maintenance<br>- Backup system available saat primary down | **Tinggi** |
| **KNF-004.2** | Error Recovery | Sistem harus dapat recover dari error | - Auto recovery untuk minor errors<br>- Graceful degradation untuk major errors<br>- Error tidak menyebabkan data loss<br>- User dapat retry operation yang gagal | **Tinggi** |
| **KNF-004.3** | Data Backup | Data harus di-backup secara regular | - Automated daily backup<br>- Weekly full backup<br>- Backup retention: minimal 30 hari<br>- Backup stored di offsite location<br>- Backup restore test quarterly | **Tinggi** |
| **KNF-004.4** | Transaction Integrity | Transaksi harus ACID compliant | - Atomic: all or nothing<br>- Consistent: data valid state<br>- Isolated: no interference<br>- Durable: persisted after commit | **Tinggi** |
| **KNF-004.5** | Fault Tolerance | Sistem harus toleran terhadap kesalahan | - Handle database connection loss gracefully<br>- Retry mechanism untuk network failures<br>- Queue system untuk offline operations<br>- User-friendly error messages | **Sedang** |

---

### **KNF-005: SCALABILITY (Skalabilitas)**

| ID | Aspek | Deskripsi Kebutuhan | Kriteria Penerimaan | Prioritas |
|---|---|---|---|---|
| **KNF-005.1** | User Scalability | Sistem harus dapat menangani pertumbuhan pengguna | - Support minimal 100 users total<br>- 50 concurrent users tanpa degradasi<br>- Architecture ready untuk horizontal scaling<br>- Database connection pooling | **Sedang** |
| **KNF-005.2** | Data Scalability | Sistem harus dapat menangani pertumbuhan data | - Handle minimal 1 juta transaksi<br>- Database partitioning untuk data besar<br>- Archive strategy untuk data lama<br>- Pagination untuk large datasets | **Sedang** |
| **KNF-005.3** | Branch Scalability | Sistem harus support penambahan cabang | - Easy onboarding cabang baru<br>- Multi-tenant architecture<br>- Data isolation antar cabang<br>- Support minimal 20 cabang | **Sedang** |

---

### **KNF-006: COMPATIBILITY (Kompatibilitas)**

| ID | Aspek | Deskripsi Kebutuhan | Kriteria Penerimaan | Prioritas |
|---|---|---|---|---|
| **KNF-006.1** | Browser Compatibility | Sistem harus berjalan di berbagai browser modern | - Chrome 90+ (fully supported)<br>- Firefox 88+ (fully supported)<br>- Safari 14+ (supported)<br>- Edge 90+ (fully supported)<br>- No IE support needed | **Tinggi** |
| **KNF-006.2** | Operating System | Sistem harus berjalan di berbagai OS | - Windows 10+ (optimal)<br>- macOS 10.15+ (optimal)<br>- iOS 13+ (mobile view)<br>- Android 8.0+ (mobile view) | **Tinggi** |
| **KNF-006.3** | Device Compatibility | Sistem harus bekerja di berbagai device | - Desktop: optimal experience<br>- Laptop: optimal experience<br>- Tablet: functional (landscape preferred)<br>- Smartphone: view-only untuk beberapa fitur | **Tinggi** |
| **KNF-006.4** | Printer Compatibility | Sistem harus support berbagai printer | - Standard printer via browser print<br>- Thermal printer 80mm ESC/POS<br>- Bluetooth thermal printer support<br>- USB thermal printer support | **Sedang** |
| **KNF-006.5** | Camera Compatibility | Sistem harus akses kamera untuk presensi | - Laptop/desktop webcam<br>- Mobile front/rear camera<br>- Tablet camera<br>- Permission handling yang proper | **Tinggi** |

---

### **KNF-007: MAINTAINABILITY (Kemudahan Pemeliharaan)**

| ID | Aspek | Deskripsi Kebutuhan | Kriteria Penerimaan | Prioritas |
|---|---|---|---|---|
| **KNF-007.1** | Code Quality | Code harus mudah dipahami dan dimodifikasi | - Consistent coding standards<br>- Comprehensive comments untuk logic kompleks<br>- Modular architecture<br>- DRY principle (Don't Repeat Yourself) | **Sedang** |
| **KNF-007.2** | Documentation | Sistem harus terdokumentasi dengan baik | - Technical documentation lengkap<br>- API documentation (endpoints, parameters)<br>- Database schema documentation<br>- User manual dalam Bahasa Indonesia | **Sedang** |
| **KNF-007.3** | Version Control | Source code harus menggunakan version control | - Git repository (GitHub)<br>- Clear commit messages<br>- Branch strategy (main, develop, feature)<br>- Tag untuk setiap release version | **Tinggi** |
| **KNF-007.4** | Testing | Sistem harus testable | - Unit tests untuk business logic<br>- Integration tests untuk API<br>- Manual testing checklist<br>- Test coverage minimal 60% | **Sedang** |
| **KNF-007.5** | Monitoring | Sistem harus dapat dimonitor | - Error logging system<br>- Performance monitoring<br>- User activity tracking<br>- Alert system untuk critical issues | **Sedang** |

---

### **KNF-008: PORTABILITY (Portabilitas)**

| ID | Aspek | Deskripsi Kebutuhan | Kriteria Penerimaan | Prioritas |
|---|---|---|---|---|
| **KNF-008.1** | Platform Independence | Sistem harus platform-independent | - Web-based (tidak perlu install)<br>- Cross-platform compatible<br>- No OS-specific dependencies<br>- Cloud-based hosting | **Tinggi** |
| **KNF-008.2** | Data Portability | Data harus dapat di-export | - Export ke PDF untuk laporan<br>- Export ke Excel (CSV) untuk data<br>- Backup database dapat di-restore<br>- Standard format untuk data export | **Sedang** |
| **KNF-008.3** | Deployment Flexibility | Sistem mudah di-deploy | - Containerization ready (Docker)<br>- Easy deployment process<br>- Environment configuration external<br>- No hardcoded credentials | **Rendah** |

---

### **KNF-009: COMPLIANCE & LEGAL**

| ID | Aspek | Deskripsi Kebutuhan | Kriteria Penerimaan | Prioritas |
|---|---|---|---|---|
| **KNF-009.1** | Data Protection | Sistem harus comply dengan regulasi perlindungan data | - User consent untuk data collection<br>- Right to access personal data<br>- Right to delete personal data<br>- Data processing transparency | **Sedang** |
| **KNF-009.2** | Business Compliance | Sistem harus sesuai dengan regulasi bisnis | - Transaction records sesuai standar akuntansi<br>- Audit trail untuk tax purposes<br>- Receipt format sesuai regulasi<br>- Employment record sesuai labor law | **Sedang** |
| **KNF-009.3** | Licensing | Software dependencies harus legal | - Open source licenses compliant<br>- No pirated software<br>- Third-party licenses documented<br>- License compatibility checked | **Tinggi** |

---

### **KNF-010: REAL-TIME CAPABILITIES**

| ID | Aspek | Deskripsi Kebutuhan | Kriteria Penerimaan | Prioritas |
|---|---|---|---|---|
| **KNF-010.1** | Real-time Data Sync | Data harus tersinkronisasi secara real-time | - Supabase Realtime untuk live updates<br>- Transaction updates delay < 3 detik<br>- Attendance updates delay < 2 detik<br>- Dashboard metrics update setiap 10 detik | **Tinggi** |
| **KNF-010.2** | Live Notifications | Notifikasi harus muncul secara instant | - Approval/rejection notification < 2 detik<br>- System alerts instant<br>- Transaction confirmation instant<br>- No polling, use push notifications | **Sedang** |
| **KNF-010.3** | Concurrent Editing | Handle concurrent operations dengan baik | - Optimistic locking untuk data updates<br>- Conflict resolution strategy<br>- Last write wins untuk non-critical data<br>- Transaction isolation untuk critical operations | **Sedang** |

---

## MATRIKS PRIORITAS

### High Priority (Must Have):
- **Usability**: KNF-001.1, KNF-001.2, KNF-001.3, KNF-001.4
- **Performance**: KNF-002.1, KNF-002.2, KNF-002.3, KNF-002.6
- **Security**: KNF-003.1, KNF-003.2, KNF-003.3, KNF-003.4, KNF-003.5, KNF-003.8
- **Reliability**: KNF-004.1, KNF-004.2, KNF-004.3, KNF-004.4
- **Compatibility**: KNF-006.1, KNF-006.2, KNF-006.3, KNF-006.5
- **Real-time**: KNF-010.1

### Medium Priority (Should Have):
- **Usability**: KNF-001.5, KNF-001.6
- **Performance**: KNF-002.4, KNF-002.5
- **Security**: KNF-003.6, KNF-003.7
- **Reliability**: KNF-004.5
- **Scalability**: Semua KNF-005
- **Maintainability**: Semua KNF-007
- **Compliance**: KNF-009.1, KNF-009.2

### Low Priority (Nice to Have):
- **Portability**: KNF-008.3
- **Monitoring & Analytics**: Advanced features

---

## METRIK PENGUKURAN KUALITAS

### Performance Metrics:
- **Page Load Time**: Average < 3s, P95 < 5s
- **API Response Time**: Average < 500ms, P95 < 1s
- **Database Query Time**: Average < 100ms, P95 < 500ms
- **Transaction Processing**: < 2s end-to-end

### Availability Metrics:
- **System Uptime**: ≥ 99% monthly
- **Error Rate**: < 1% of all requests
- **Recovery Time**: < 15 minutes for critical issues

### Security Metrics:
- **Failed Login Attempts**: Monitor and alert
- **Security Incidents**: Zero tolerance for data breaches
- **Vulnerability Score**: Regular security audits

### User Experience Metrics:
- **Task Success Rate**: ≥ 90% for common operations
- **User Satisfaction**: ≥ 4.0/5.0 rating
- **Support Tickets**: < 10 per month per 100 users

---

## CATATAN TEKNIS

### Teknologi Stack yang Mendukung NFR:
- **Frontend**: Next.js 14 (Performance, SEO)
- **Backend**: Supabase (Security, Scalability, Real-time)
- **Database**: PostgreSQL (Reliability, ACID)
- **Hosting**: Vercel/Cloud (Availability, Performance)
- **CDN**: untuk static assets (Performance)
- **Monitoring**: Error tracking, Performance monitoring

### Trade-offs yang Dipertimbangkan:
1. **Performance vs Security**: Caching vs Data freshness
2. **Usability vs Security**: Convenience vs Strong authentication
3. **Feature Richness vs Simplicity**: Kompleksitas vs Ease of use
4. **Cost vs Scalability**: Current needs vs Future growth

---

**Dokumen ini menjadi panduan untuk memastikan sistem PIGTOWNBARBERHOP tidak hanya fungsional, tetapi juga berkualitas tinggi, aman, cepat, dan mudah digunakan.**

**Tanggal Pembuatan:** November 2025  
**Status:** ✅ Siap untuk Implementasi
