/**
 * Unit tests for lib/utils/branch-helpers.ts
 *
 * Relevan dengan BUG-010 (Inkonsistensi Data Karyawan dan Cabang) dan modul
 * Manajemen Cabang pada Bagian 4.
 */
import {
  formatRupiah,
  formatBranchStatus,
  formatRating,
  formatTime,
  formatPhone as formatBranchPhone,
  calculateTotalRevenue,
  calculateTotalCustomers,
  calculateAverageRating,
  calculateTargetProgress,
  calculateShiftDuration,
  calculateServiceTotal,
  validateBranchForm,
  validateServiceForm,
  validateShiftForm,
  validateTargetForm,
  validatePhone,
  filterBranches,
  searchBranches,
  sortBranches,
  getStatusColor,
  isBranchActive,
  isBranchInactive,
  isBranchMaintenance,
  getTargetStatusColor,
  formatTargetType,
  formatTargetPeriod,
  calculateBranchSummary,
  getTopBranches,
  getActiveServicesCount,
  getServicesByCategory,
  getActiveShiftsCount,
  hasAvailableSlots,
  formatShiftDays,
} from '@/lib/utils/branch-helpers'
import type { Branch, BranchService, Shift } from '@/components/branches/types'

function makeBranch(overrides: Partial<Branch> = {}): Branch {
  return {
    id: '1',
    name: 'Cabang Utama',
    address: 'Jl. Merdeka No. 1',
    phone: '081234567890',
    manager: 'Budi',
    employees: 5,
    status: 'active',
    revenue: '1000000',
    customers: 20,
    rating: 4.5,
    openTime: '08:00',
    closeTime: '20:00',
    services: [],
    shifts: [],
    branchEmployees: [],
    ...overrides,
  } as Branch
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
describe('formatRupiah / formatBranchStatus / formatRating', () => {
  it('formatRupiah menerima angka maupun string', () => {
    expect(formatRupiah(3000000)).toContain('3.000.000')
    expect(formatRupiah('3000000')).toContain('3.000.000')
  })
  it('formatBranchStatus menerjemahkan status cabang', () => {
    expect(formatBranchStatus('active')).toBe('Aktif')
    expect(formatBranchStatus('inactive')).toBe('Tidak Aktif')
    expect(formatBranchStatus('maintenance')).toBe('Maintenance')
  })
  it('formatRating membulatkan ke 1 angka desimal', () => {
    expect(formatRating(4.567)).toBe('4.6')
  })
  it('formatTime mengembalikan string apa adanya', () => {
    expect(formatTime('08:00')).toBe('08:00')
  })
  it('formatPhone mengembalikan string apa adanya', () => {
    expect(formatBranchPhone('081234567890')).toBe('081234567890')
  })
  it('formatBranchStatus mengembalikan kode aslinya untuk status yang tidak dikenal', () => {
    expect(formatBranchStatus('unknown' as any)).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// Calculation — dasar BUG-010 (konsistensi data cabang)
// ---------------------------------------------------------------------------
describe('calculateTotalRevenue / calculateTotalCustomers / calculateAverageRating', () => {
  const branches: Branch[] = [
    makeBranch({ revenue: '1000000', customers: 10, rating: 4 }),
    makeBranch({ revenue: '2000000', customers: 20, rating: 5 }),
  ]

  it('calculateTotalRevenue menjumlahkan revenue seluruh cabang (revenue disimpan sebagai string)', () => {
    expect(calculateTotalRevenue(branches)).toBe(3000000)
  })
  it('calculateTotalRevenue menerima revenue bertipe number dan revenue falsy (fallback ke 0)', () => {
    const mixed: Branch[] = [
      makeBranch({ revenue: 1500000 as any }),
      makeBranch({ revenue: undefined as any }),
    ]
    expect(calculateTotalRevenue(mixed)).toBe(1500000)
  })
  it('calculateTotalCustomers menjumlahkan jumlah customer seluruh cabang', () => {
    expect(calculateTotalCustomers(branches)).toBe(30)
  })
  it('calculateTotalCustomers menangani customers yang falsy (fallback ke 0)', () => {
    expect(calculateTotalCustomers([makeBranch({ customers: undefined as any })])).toBe(0)
  })
  it('calculateAverageRating menghitung rata-rata rating', () => {
    expect(calculateAverageRating(branches)).toBe(4.5)
  })
  it('calculateAverageRating mengembalikan 0 untuk array kosong', () => {
    expect(calculateAverageRating([])).toBe(0)
  })
  it('calculateAverageRating menangani rating yang falsy (fallback ke 0)', () => {
    expect(calculateAverageRating([makeBranch({ rating: undefined as any })])).toBe(0)
  })
})

describe('calculateTargetProgress / calculateShiftDuration / calculateServiceTotal', () => {
  it('calculateTargetProgress menghitung persentase capaian target', () => {
    expect(calculateTargetProgress(50, 100)).toBe(50)
  })
  it('calculateTargetProgress dibatasi maksimal 100%', () => {
    expect(calculateTargetProgress(150, 100)).toBe(100)
  })
  it('calculateTargetProgress mengembalikan 0 jika target 0', () => {
    expect(calculateTargetProgress(50, 0)).toBe(0)
  })
  it('calculateShiftDuration menghitung durasi shift dalam jam', () => {
    expect(calculateShiftDuration('08:00', '16:00')).toBe(8)
  })
  it('calculateServiceTotal menjumlahkan harga seluruh layanan', () => {
    const services: BranchService[] = [
      { id: '1', name: 'A', price: 50000, duration: 30, aktif: true, category: 'hair' },
      { id: '2', name: 'B', price: 30000, duration: 20, aktif: true, category: 'hair' },
    ]
    expect(calculateServiceTotal(services)).toBe(80000)
  })
})

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
describe('validateBranchForm', () => {
  const validForm = { name: 'Cabang A', address: 'Jl. A', phone: '081234567890', manager: 'Budi', openTime: '08:00', closeTime: '20:00' }

  it('meloloskan data cabang yang valid', () => {
    expect(validateBranchForm(validForm).valid).toBe(true)
  })
  it('menolak nama cabang kosong', () => {
    const result = validateBranchForm({ ...validForm, name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBe('Nama cabang harus diisi')
  })
  it('menolak jika jam tutup tidak setelah jam buka', () => {
    const result = validateBranchForm({ ...validForm, openTime: '20:00', closeTime: '08:00' })
    expect(result.valid).toBe(false)
    expect(result.errors.closeTime).toBe('Jam tutup harus setelah jam buka')
  })
  it('menolak alamat kosong', () => {
    const result = validateBranchForm({ ...validForm, address: '' })
    expect(result.errors.address).toBe('Alamat harus diisi')
  })
  it('menolak nomor telepon kosong', () => {
    const result = validateBranchForm({ ...validForm, phone: '' })
    expect(result.errors.phone).toBe('Nomor telepon harus diisi')
  })
  it('menolak manager kosong', () => {
    const result = validateBranchForm({ ...validForm, manager: '' })
    expect(result.errors.manager).toBe('Manager harus diisi')
  })
  it('menolak jam buka kosong', () => {
    const result = validateBranchForm({ ...validForm, openTime: '' })
    expect(result.errors.openTime).toBe('Jam buka harus diisi')
  })
  it('menolak jam tutup kosong', () => {
    const result = validateBranchForm({ ...validForm, closeTime: '' })
    expect(result.errors.closeTime).toBe('Jam tutup harus diisi')
  })
})

describe('validateServiceForm', () => {
  const validService = { name: 'Haircut', price: 50000, duration: 30, aktif: true, category: 'hair' }

  it('menolak harga <= 0', () => {
    const result = validateServiceForm({ ...validService, price: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors.price).toBe('Harga harus lebih dari 0')
  })
  it('menolak nama layanan kosong', () => {
    const result = validateServiceForm({ ...validService, name: '' })
    expect(result.errors.name).toBe('Nama layanan harus diisi')
  })
  it('menolak durasi <= 0', () => {
    const result = validateServiceForm({ ...validService, duration: 0 })
    expect(result.errors.duration).toBe('Durasi harus lebih dari 0')
  })
  it('menolak kategori kosong', () => {
    const result = validateServiceForm({ ...validService, category: '' })
    expect(result.errors.category).toBe('Kategori harus diisi')
  })
  it('meloloskan data layanan yang valid', () => {
    const result = validateServiceForm(validService)
    expect(result.valid).toBe(true)
  })
})

describe('validateShiftForm', () => {
  const validShift = { name: 'Pagi', startTime: '08:00', endTime: '16:00', days: ['Senin'], hasBreakTime: false, breakTimes: [] }

  it('menolak jika tidak ada hari dipilih', () => {
    const result = validateShiftForm({ ...validShift, days: [] })
    expect(result.valid).toBe(false)
    expect(result.errors.days).toBe('Minimal pilih 1 hari')
  })
  it('menolak jika jam selesai tidak setelah jam mulai', () => {
    const result = validateShiftForm({ ...validShift, startTime: '16:00', endTime: '08:00' })
    expect(result.valid).toBe(false)
  })
  it('menolak nama shift kosong', () => {
    const result = validateShiftForm({ ...validShift, name: '' })
    expect(result.errors.name).toBe('Nama shift harus diisi')
  })
  it('menolak jam mulai kosong', () => {
    const result = validateShiftForm({ ...validShift, startTime: '' })
    expect(result.errors.startTime).toBe('Jam mulai harus diisi')
  })
  it('menolak jam selesai kosong', () => {
    const result = validateShiftForm({ ...validShift, endTime: '' })
    expect(result.errors.endTime).toBe('Jam selesai harus diisi')
  })
  it('meloloskan data shift yang valid', () => {
    expect(validateShiftForm(validShift).valid).toBe(true)
  })
})

describe('validateTargetForm', () => {
  it('menolak target <= 0', () => {
    const result = validateTargetForm({ type: 'revenue', target: 0, period: 'monthly', status: 'active' })
    expect(result.valid).toBe(false)
  })
  it('meloloskan target > 0', () => {
    const result = validateTargetForm({ type: 'revenue', target: 5000000, period: 'monthly', status: 'active' })
    expect(result.valid).toBe(true)
  })
})

describe('validatePhone', () => {
  it('menerima format nomor Indonesia yang valid', () => {
    expect(validatePhone('081234567890')).toBe(true)
  })
  it('menolak nomor yang mengandung huruf', () => {
    expect(validatePhone('0812ABCD')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Filtering / searching / sorting
// ---------------------------------------------------------------------------
describe('filterBranches / searchBranches / sortBranches', () => {
  const branches: Branch[] = [
    makeBranch({ id: '1', name: 'Cabang Barat', status: 'active' }),
    makeBranch({ id: '2', name: 'Cabang Timur', status: 'inactive' }),
  ]

  it('searchBranches menemukan berdasarkan nama', () => {
    expect(searchBranches(branches, 'barat')).toHaveLength(1)
  })
  it('searchBranches mengembalikan semua data jika term kosong', () => {
    expect(searchBranches(branches, '')).toHaveLength(2)
  })
  it('filterBranches menyaring berdasarkan status', () => {
    const result = filterBranches(branches, { searchTerm: '', status: 'active' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Cabang Barat')
  })
  it('filterBranches menerapkan searchTerm melalui searchBranches', () => {
    const result = filterBranches(branches, { searchTerm: 'timur', status: 'all' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Cabang Timur')
  })
  it('sortBranches mengurutkan nama ascending', () => {
    const sorted = sortBranches(branches, 'name', 'asc')
    expect(sorted[0].name).toBe('Cabang Barat')
  })
  it('sortBranches mengurutkan field numerik (employees) ascending/descending', () => {
    const withEmployees = [
      makeBranch({ id: '1', name: 'A', employees: 10 }),
      makeBranch({ id: '2', name: 'B', employees: 3 }),
    ]
    expect(sortBranches(withEmployees, 'employees', 'asc')[0].name).toBe('B')
    expect(sortBranches(withEmployees, 'employees', 'desc')[0].name).toBe('A')
  })
  it('sortBranches mengurutkan nama descending', () => {
    const sorted = sortBranches(branches, 'name', 'desc')
    expect(sorted[0].name).toBe('Cabang Timur')
  })
  it('sortBranches memperlakukan nilai null sebagai string kosong (baik posisi a maupun b)', () => {
    const withNull = [
      makeBranch({ id: '1', name: 'A', manager: 'Zeta' }),
      makeBranch({ id: '2', name: 'B', manager: null as any }),
      makeBranch({ id: '3', name: 'C', manager: 'Andi' }),
      makeBranch({ id: '4', name: 'D', manager: null as any }),
    ]
    const sorted = sortBranches(withNull, 'manager', 'asc')
    // Nilai null diperlakukan sebagai '' sehingga berada paling awal setelah diurutkan asc.
    expect(sorted[0].manager).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
describe('getStatusColor / isBranchActive / isBranchInactive / isBranchMaintenance', () => {
  it('mengidentifikasi status cabang dengan benar', () => {
    expect(isBranchActive(makeBranch({ status: 'active' }))).toBe(true)
    expect(isBranchInactive(makeBranch({ status: 'inactive' }))).toBe(true)
    expect(isBranchMaintenance(makeBranch({ status: 'maintenance' }))).toBe(true)
  })
  it('getStatusColor mengembalikan warna sesuai status', () => {
    expect(getStatusColor('active')).toContain('green')
    expect(getStatusColor('maintenance')).toContain('yellow')
  })
  it('getStatusColor mengembalikan warna default (active) untuk status tidak dikenal', () => {
    expect(getStatusColor('unknown' as any)).toContain('green')
  })
})

// ---------------------------------------------------------------------------
// Target helpers
// ---------------------------------------------------------------------------
describe('getTargetStatusColor / formatTargetType / formatTargetPeriod', () => {
  it('getTargetStatusColor mengembalikan warna sesuai progress', () => {
    expect(getTargetStatusColor(100, 100)).toContain('green')
    expect(getTargetStatusColor(80, 100)).toContain('blue')
    expect(getTargetStatusColor(60, 100)).toContain('yellow')
    expect(getTargetStatusColor(20, 100)).toContain('red')
  })
  it('formatTargetType menerjemahkan tipe target', () => {
    expect(formatTargetType('revenue')).toBe('Revenue')
    expect(formatTargetType('customers')).toBe('Pelanggan')
    expect(formatTargetType('services')).toBe('Layanan')
  })
  it('formatTargetType mengembalikan kode aslinya untuk tipe tidak dikenal', () => {
    expect(formatTargetType('unknown')).toBe('unknown')
  })
  it('formatTargetPeriod menerjemahkan periode target', () => {
    expect(formatTargetPeriod('monthly')).toBe('Bulanan')
    expect(formatTargetPeriod('daily')).toBe('Harian')
    expect(formatTargetPeriod('weekly')).toBe('Mingguan')
  })
  it('formatTargetPeriod mengembalikan kode aslinya untuk periode tidak dikenal', () => {
    expect(formatTargetPeriod('unknown')).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// Summary / top performers
// ---------------------------------------------------------------------------
describe('calculateBranchSummary / getTopBranches', () => {
  const branches: Branch[] = [
    makeBranch({ id: '1', status: 'active', revenue: '3000000' }),
    makeBranch({ id: '2', status: 'inactive', revenue: '1000000' }),
    makeBranch({ id: '3', status: 'maintenance', revenue: '2000000' }),
  ]

  it('calculateBranchSummary menghitung ringkasan seluruh cabang', () => {
    const summary = calculateBranchSummary(branches)
    expect(summary.totalBranches).toBe(3)
    expect(summary.activeBranches).toBe(1)
    expect(summary.inactiveBranches).toBe(1)
    expect(summary.maintenanceBranches).toBe(1)
  })
  it('getTopBranches hanya mengambil cabang aktif diurutkan berdasarkan revenue', () => {
    const top = getTopBranches(branches, 5)
    expect(top).toHaveLength(1)
    expect(top[0].id).toBe('1')
  })
  it('getTopBranches mengurutkan >1 cabang aktif dari revenue tertinggi (revenue string maupun number)', () => {
    const activeBranches: Branch[] = [
      makeBranch({ id: '1', name: 'Kecil', status: 'active', revenue: '1000000' }),
      makeBranch({ id: '2', name: 'Besar', status: 'active', revenue: 5000000 as any }),
    ]
    const top = getTopBranches(activeBranches, 5)
    expect(top[0].name).toBe('Besar')
    expect(top[1].name).toBe('Kecil')
  })
  it('getTopBranches menggunakan limit default (5) jika parameter limit tidak diberikan', () => {
    const activeBranches: Branch[] = [makeBranch({ id: '1', status: 'active', revenue: '1000000' })]
    expect(getTopBranches(activeBranches)).toHaveLength(1)
  })
  it('getTopBranches menangani kombinasi revenue number-vs-number dan string-vs-string', () => {
    const numOnly: Branch[] = [
      makeBranch({ id: '1', name: 'X', status: 'active', revenue: 1000000 as any }),
      makeBranch({ id: '2', name: 'Y', status: 'active', revenue: 2000000 as any }),
    ]
    expect(getTopBranches(numOnly, 5)[0].name).toBe('Y')
    const strOnly: Branch[] = [
      makeBranch({ id: '1', name: 'X', status: 'active', revenue: '1000000' }),
      makeBranch({ id: '2', name: 'Y', status: 'active', revenue: '2000000' }),
    ]
    expect(getTopBranches(strOnly, 5)[0].name).toBe('Y')
  })
})

// ---------------------------------------------------------------------------
// Service / shift helpers
// ---------------------------------------------------------------------------
describe('getActiveServicesCount / getServicesByCategory / getActiveShiftsCount / hasAvailableSlots / formatShiftDays', () => {
  const services: BranchService[] = [
    { id: '1', name: 'A', price: 1, duration: 1, aktif: true, category: 'hair' },
    { id: '2', name: 'B', price: 1, duration: 1, aktif: false, category: 'nail' },
  ]
  const shifts: Shift[] = [
    { id: '1', name: 'Pagi', startTime: '08:00', endTime: '16:00', days: ['Senin'], maxEmployees: 5, currentEmployees: 3, status: 'active', minStaff: 1 },
  ]

  it('getActiveServicesCount menghitung layanan aktif saja', () => {
    expect(getActiveServicesCount(services)).toBe(1)
  })
  it('getServicesByCategory menyaring berdasarkan kategori', () => {
    expect(getServicesByCategory(services, 'nail')).toHaveLength(1)
  })
  it('getActiveShiftsCount menghitung shift berstatus active', () => {
    expect(getActiveShiftsCount(shifts)).toBe(1)
  })
  it('hasAvailableSlots true jika currentEmployees < maxEmployees', () => {
    expect(hasAvailableSlots(shifts[0])).toBe(true)
  })
  it('formatShiftDays menampilkan "Setiap Hari" untuk 7 hari', () => {
    expect(formatShiftDays(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'])).toBe('Setiap Hari')
  })
  it('formatShiftDays menampilkan "-" untuk array kosong', () => {
    expect(formatShiftDays([])).toBe('-')
  })
  it('formatShiftDays menggabungkan hari dengan koma untuk sebagian hari', () => {
    expect(formatShiftDays(['Senin', 'Rabu'])).toBe('Senin, Rabu')
  })
})
