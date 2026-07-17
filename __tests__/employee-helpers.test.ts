/**
 * Unit tests for lib/utils/employee-helpers.ts
 *
 * These tests directly exercise the validation logic referenced in
 * Bagian 3 (BUG-01, BUG-002, BUG-003, BUG-004, BUG-005, BUG-006) of
 * Laporan_UAS_Converted.md, so the coverage numbers produced here trace
 * back to those specific bug fixes.
 */
import {
  validateEmail,
  validatePhone,
  validatePIN,
  validateEmployeeForm,
  validatePayrollForm,
  formatRupiah,
  formatRupiahDecimal,
  formatEmployeeStatus,
  formatPosition,
  getInitials,
  formatPhone,
  calculateTotalSalary,
  calculateMonthlyEarnings,
  calculateAttendanceRate,
  calculateOvertimePay,
  calculateBonusPenalty,
  calculateAveragePerformance,
  filterEmployees,
  searchEmployees,
  sortEmployees,
  getStatusColor,
  isEmployeeActive,
  isEmployeeOnLeave,
  isEmployeeInactive,
  getTopPerformers,
  getEmployeeRank,
  calculateEmployeeSummary,
} from '@/lib/utils/employee-helpers'
import type { Employee, EmployeeStats } from '@/components/employees/types'

// ---------------------------------------------------------------------------
// validateEmail — BUG-003 (format email tidak valid diterima sistem)
// ---------------------------------------------------------------------------
describe('validateEmail (BUG-003)', () => {
  it('menerima email dengan format valid', () => {
    expect(validateEmail('latifah@gmail.com')).toBe(true)
  })
  it('menolak email tanpa simbol @ (kasus asli tester: latifahgmail.com)', () => {
    expect(validateEmail('latifahgmail.com')).toBe(false)
  })
  it('menolak email tanpa domain', () => {
    expect(validateEmail('owner@')).toBe(false)
  })
  it('menolak string kosong', () => {
    expect(validateEmail('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validatePhone — BUG-005 (nomor telepon menerima karakter huruf)
// ---------------------------------------------------------------------------
describe('validatePhone (BUG-005)', () => {
  it('menerima nomor format 08xxxxxxxxxx', () => {
    expect(validatePhone('081234567890')).toBe(true)
  })
  it('menerima nomor format 62xxxxxxxxxx', () => {
    expect(validatePhone('6281234567890')).toBe(true)
  })
  it('menerima nomor format +62xxxxxxxxxx', () => {
    expect(validatePhone('+6281234567890')).toBe(true)
  })
  it('menolak nomor yang mengandung huruf (kasus asli tester: 08579ABCD)', () => {
    expect(validatePhone('08579ABCD')).toBe(false)
  })
  it('menolak nomor yang terlalu pendek', () => {
    expect(validatePhone('12345')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validatePIN — BUG-004 & BUG-006 (PIN non-numerik / panjang tidak divalidasi)
// ---------------------------------------------------------------------------
describe('validatePIN (BUG-004 & BUG-006)', () => {
  it('menerima PIN tepat 6 digit angka', () => {
    expect(validatePIN('123456')).toBe(true)
  })
  it('menolak PIN kurang dari 6 digit (BVA-TK01: 5 digit)', () => {
    expect(validatePIN('12345')).toBe(false)
  })
  it('menolak PIN lebih dari 6 digit (BVA-TK03: 7 digit)', () => {
    expect(validatePIN('1234567')).toBe(false)
  })
  it('menolak PIN yang mengandung huruf (kasus asli tester: 12AB56)', () => {
    expect(validatePIN('12AB56')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateEmployeeForm — BUG-01 & BUG-002 (field wajib tidak divalidasi)
// ---------------------------------------------------------------------------
describe('validateEmployeeForm (BUG-01 & BUG-002)', () => {
  const validForm = {
    name: 'Latifah',
    email: 'latifah@gmail.com',
    phone: '6281234567890',
    position: 'Barber',
    pin: '123456',
    status: 'active' as const,
  }

  it('meloloskan data lengkap dan valid', () => {
    const result = validateEmployeeForm(validForm)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('menolak saat nama kosong', () => {
    const result = validateEmployeeForm({ ...validForm, name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBe('Nama harus diisi')
  })

  it('menolak saat email kosong', () => {
    const result = validateEmployeeForm({ ...validForm, email: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBe('Email harus diisi')
  })

  it('menolak saat posisi kosong', () => {
    const result = validateEmployeeForm({ ...validForm, position: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.position).toBe('Posisi harus diisi')
  })

  it('menolak saat PIN tidak valid', () => {
    const result = validateEmployeeForm({ ...validForm, pin: '12AB56' })
    expect(result.valid).toBe(false)
    expect(result.errors.pin).toBe('PIN harus 6 digit angka')
  })

  it('nomor telepon bersifat opsional (boleh kosong)', () => {
    const result = validateEmployeeForm({ ...validForm, phone: '' })
    expect(result.valid).toBe(true)
  })

  it('menolak nama kurang dari 3 karakter', () => {
    const result = validateEmployeeForm({ ...validForm, name: 'Al' })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBe('Nama minimal 3 karakter')
  })

  it('menolak format email tidak valid (terisi tapi salah format)', () => {
    const result = validateEmployeeForm({ ...validForm, email: 'latifahgmail.com' })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBe('Format email tidak valid')
  })

  it('menolak format nomor telepon tidak valid (terisi tapi salah format)', () => {
    const result = validateEmployeeForm({ ...validForm, phone: '08579ABCD' })
    expect(result.valid).toBe(false)
    expect(result.errors.phone).toBe('Format nomor telepon tidak valid')
  })
})

// ---------------------------------------------------------------------------
// validatePayrollForm
// ---------------------------------------------------------------------------
describe('validatePayrollForm', () => {
  it('meloloskan data payroll yang valid', () => {
    const result = validatePayrollForm({ baseSalary: 3000000, commissionRate: 10, overtimeRate: 20000, bonusPoints: 0 })
    expect(result.valid).toBe(true)
  })
  it('menolak gaji pokok negatif', () => {
    const result = validatePayrollForm({ baseSalary: -1, commissionRate: 10, overtimeRate: 20000, bonusPoints: 0 })
    expect(result.valid).toBe(false)
  })
  it('menolak commission rate di luar 0-100', () => {
    const result = validatePayrollForm({ baseSalary: 3000000, commissionRate: 150, overtimeRate: 20000, bonusPoints: 0 })
    expect(result.valid).toBe(false)
  })
  it('menolak overtime rate negatif', () => {
    const result = validatePayrollForm({ baseSalary: 3000000, commissionRate: 10, overtimeRate: -1, bonusPoints: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors.overtimeRate).toBe('Rate lembur tidak boleh negatif')
  })
})

// ---------------------------------------------------------------------------
// Formatting functions
// ---------------------------------------------------------------------------
describe('formatting functions', () => {
  it('formatRupiah memformat angka ke IDR', () => {
    expect(formatRupiah(3000000)).toContain('3.000.000')
  })
  it('formatRupiahDecimal menyertakan desimal', () => {
    expect(formatRupiahDecimal(3000000.5)).toContain(',50')
  })
  it('formatEmployeeStatus menerjemahkan status', () => {
    expect(formatEmployeeStatus('active')).toBe('Aktif')
    expect(formatEmployeeStatus('inactive')).toBe('Tidak Aktif')
    expect(formatEmployeeStatus('on-leave')).toBe('Cuti')
  })
  it('formatEmployeeStatus mengembalikan kode aslinya untuk status tidak dikenal', () => {
    expect(formatEmployeeStatus('unknown' as any)).toBe('unknown')
  })
  it('formatPosition mengkapitalisasi huruf pertama', () => {
    expect(formatPosition('barber')).toBe('Barber')
  })
  it('getInitials mengembalikan inisial dari nama', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Ahmad')).toBe('A')
  })
  it('formatPhone mengembalikan "-" jika null', () => {
    expect(formatPhone(null)).toBe('-')
    expect(formatPhone('08123')).toBe('08123')
  })
})

// ---------------------------------------------------------------------------
// Calculation functions
// ---------------------------------------------------------------------------
describe('calculation functions', () => {
  const stats: EmployeeStats = {
    totalTransactions: 50,
    totalRevenue: 5000000,
    totalCommission: 500000,
    averageTransaction: 100000,
    bonusPoints: 5,
    penaltyPoints: 1,
    totalBonus: 50000,
    totalPenalty: 10000,
  }
  const employee: Employee = {
    id: '1',
    name: 'Latifah',
    email: 'latifah@gmail.com',
    phone: '6281234567890',
    position: 'barber',
    pin: '123456',
    status: 'active',
    salary: 3000000,
    commission_rate: 10,
    overtime_rate: 20000,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  }

  it('calculateTotalSalary menjumlahkan gaji pokok + komisi', () => {
    expect(calculateTotalSalary(employee, stats)).toBe(3500000)
  })
  it('calculateTotalSalary memakai default 3.000.000 jika salary falsy, dan default 0 jika totalCommission falsy', () => {
    const noSalary = { ...employee, salary: 0 }
    const noCommission = { ...stats, totalCommission: 0 }
    expect(calculateTotalSalary(noSalary, noCommission)).toBe(3000000)
  })
  it('calculateMonthlyEarnings menjumlahkan gaji + komisi + lembur', () => {
    expect(calculateMonthlyEarnings(3000000, 500000, 200000)).toBe(3700000)
  })
  it('calculateAttendanceRate menghitung persentase kehadiran', () => {
    expect(calculateAttendanceRate(20, 22)).toBeCloseTo(90.91, 1)
  })
  it('calculateAttendanceRate mengembalikan 0 jika totalDays 0', () => {
    expect(calculateAttendanceRate(0, 0)).toBe(0)
  })
  it('calculateOvertimePay mengalikan jam dengan rate', () => {
    expect(calculateOvertimePay(10, 50000)).toBe(500000)
  })
  it('calculateBonusPenalty menghitung selisih poin dikali nilai poin', () => {
    expect(calculateBonusPenalty(10, 3, 10000)).toBe(70000)
  })
  it('calculateAveragePerformance mengembalikan skor 0-100', () => {
    const score = calculateAveragePerformance(stats)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ---------------------------------------------------------------------------
// Filtering / searching / sorting
// ---------------------------------------------------------------------------
describe('filtering, searching, sorting', () => {
  const employees: Employee[] = [
    { id: '1', name: 'Budi', email: 'budi@mail.com', phone: '0812', position: 'barber', pin: '111111', status: 'active', salary: 3000000, commission_rate: 10, overtime_rate: 0, created_at: '', updated_at: '' },
    { id: '2', name: 'Ani', email: 'ani@mail.com', phone: '0813', position: 'cashier', pin: '222222', status: 'inactive', salary: 2500000, commission_rate: 5, overtime_rate: 0, created_at: '', updated_at: '' },
  ]

  it('searchEmployees menemukan berdasarkan nama', () => {
    expect(searchEmployees(employees, 'budi')).toHaveLength(1)
  })
  it('searchEmployees mengembalikan semua data jika term kosong', () => {
    expect(searchEmployees(employees, '')).toHaveLength(2)
  })
  it('searchEmployees tidak error saat phone karyawan null (term tidak cocok nama/email agar evaluasi mencapai pengecekan phone)', () => {
    const withNullPhone = [{ ...employees[0], phone: null }]
    // term "zzz" sengaja tidak cocok dengan name/email supaya evaluasi `||` berlanjut
    // sampai ke pengecekan phone dan menguji fallback `employee.phone?.toLowerCase() || ''`.
    expect(searchEmployees(withNullPhone, 'zzz')).toHaveLength(0)
  })
  it('filterEmployees memfilter berdasarkan status', () => {
    const result = filterEmployees(employees, { searchTerm: '', status: 'active' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Budi')
  })
  it('filterEmployees menerapkan searchTerm melalui searchEmployees', () => {
    const result = filterEmployees(employees, { searchTerm: 'ani', status: 'all' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Ani')
  })
  it('sortEmployees mengurutkan nama secara ascending', () => {
    const sorted = sortEmployees(employees, 'name', 'asc')
    expect(sorted[0].name).toBe('Ani')
  })
  it('sortEmployees mengurutkan nama secara descending', () => {
    const sorted = sortEmployees(employees, 'name', 'desc')
    expect(sorted[0].name).toBe('Budi')
  })
  it('sortEmployees mengurutkan field numerik (salary) secara ascending', () => {
    const sorted = sortEmployees(employees, 'salary', 'asc')
    expect(sorted[0].name).toBe('Ani')
  })
  it('sortEmployees mengurutkan field numerik (salary) secara descending', () => {
    const sorted = sortEmployees(employees, 'salary', 'desc')
    expect(sorted[0].name).toBe('Budi')
  })
  it('sortEmployees memperlakukan nilai null sebagai string kosong (baik posisi a maupun b)', () => {
    const withNull: Employee[] = [
      { id: '1', name: 'Zeta', email: '', phone: null, position: '', pin: '', status: 'active', salary: 0, commission_rate: 0, overtime_rate: 0, created_at: '', updated_at: '' },
      { id: '2', name: 'Bravo', email: null as any, phone: null, position: '', pin: '', status: 'active', salary: 0, commission_rate: 0, overtime_rate: 0, created_at: '', updated_at: '' },
      { id: '3', name: 'Andi', email: '', phone: null, position: '', pin: '', status: 'active', salary: 0, commission_rate: 0, overtime_rate: 0, created_at: '', updated_at: '' },
      { id: '4', name: 'Charlie', email: null as any, phone: null, position: '', pin: '', status: 'active', salary: 0, commission_rate: 0, overtime_rate: 0, created_at: '', updated_at: '' },
    ]
    const sorted = sortEmployees(withNull, 'email', 'asc')
    expect(sorted).toHaveLength(4)
  })
})

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
describe('status helper functions', () => {
  const active: Employee = { id: '1', name: 'A', email: 'a@mail.com', phone: null, position: 'barber', pin: '123456', status: 'active', salary: 0, commission_rate: 0, overtime_rate: 0, created_at: '', updated_at: '' }
  const onLeave: Employee = { ...active, status: 'on-leave' }
  const inactive: Employee = { ...active, status: 'inactive' }

  it('getStatusColor mengembalikan warna sesuai status', () => {
    expect(getStatusColor('active')).toContain('green')
    expect(getStatusColor('inactive')).toContain('red')
    expect(getStatusColor('on-leave')).toContain('yellow')
  })
  it('getStatusColor mengembalikan warna default (active) untuk status tidak dikenal', () => {
    expect(getStatusColor('unknown' as any)).toContain('green')
  })
  it('isEmployeeActive/OnLeave/Inactive mengidentifikasi status dengan benar', () => {
    expect(isEmployeeActive(active)).toBe(true)
    expect(isEmployeeOnLeave(onLeave)).toBe(true)
    expect(isEmployeeInactive(inactive)).toBe(true)
    expect(isEmployeeActive(onLeave)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Statistics helpers
// ---------------------------------------------------------------------------
describe('statistics helper functions', () => {
  const employees: Employee[] = [
    { id: '1', name: 'Budi', email: 'budi@mail.com', phone: '0812', position: 'barber', pin: '111111', status: 'active', salary: 3000000, commission_rate: 10, overtime_rate: 0, created_at: '', updated_at: '' },
    { id: '2', name: 'Ani', email: 'ani@mail.com', phone: '0813', position: 'cashier', pin: '222222', status: 'active', salary: 2500000, commission_rate: 5, overtime_rate: 0, created_at: '', updated_at: '' },
  ]
  const stats: Record<string, EmployeeStats> = {
    '1': { totalTransactions: 10, totalRevenue: 1000000, totalCommission: 100000, averageTransaction: 100000, bonusPoints: 0, penaltyPoints: 0, totalBonus: 0, totalPenalty: 0 },
    '2': { totalTransactions: 20, totalRevenue: 3000000, totalCommission: 300000, averageTransaction: 150000, bonusPoints: 0, penaltyPoints: 0, totalBonus: 0, totalPenalty: 0 },
  }

  it('getTopPerformers mengurutkan karyawan berdasarkan revenue', () => {
    const top = getTopPerformers(employees, stats, 2)
    expect(top[0].name).toBe('Ani')
  })
  it('getTopPerformers menggunakan limit default (5) jika parameter limit tidak diberikan', () => {
    expect(getTopPerformers(employees, stats)).toHaveLength(2)
  })
  it('getTopPerformers mengembalikan urutan apa adanya jika salah satu karyawan tidak punya data stats', () => {
    const withMissingStats = { '1': stats['1'] } // karyawan '2' sengaja tidak ada di stats
    const top = getTopPerformers(employees, withMissingStats)
    expect(top).toHaveLength(2)
  })
  it('getEmployeeRank mengembalikan peringkat 1-based', () => {
    expect(getEmployeeRank(employees[1], employees, stats)).toBe(1)
    expect(getEmployeeRank(employees[0], employees, stats)).toBe(2)
  })
  it('calculateEmployeeSummary menghitung ringkasan karyawan', () => {
    const summary = calculateEmployeeSummary(employees, stats, [])
    expect(summary.totalEmployees).toBe(2)
    expect(summary.activeEmployees).toBe(2)
    expect(summary.absentToday).toBe(0)
  })
  it('calculateEmployeeSummary memakai stats default jika salah satu karyawan tidak punya data stats', () => {
    const partialStats = { '1': stats['1'] } // karyawan '2' tidak ada di stats
    const summary = calculateEmployeeSummary(employees, partialStats, [])
    expect(summary.totalEmployees).toBe(2)
    expect(summary.totalSalary).toBeGreaterThan(0)
  })
})
