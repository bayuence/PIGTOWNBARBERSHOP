/**
 * Unit tests for lib/utils/transaction-helpers.ts
 *
 * Fungsi-fungsi ini dipakai pada Riwayat Transaksi & Laporan Keuangan, yang
 * pada Bagian 4 (REG-004) diverifikasi tidak rusak akibat perbaikan BUG-011/012
 * (auto-apply & sinkronisasi komisi).
 */
import {
  getStatusColor,
  getPaymentMethodColor,
  formatPaymentMethod,
  formatStatus,
  formatTime,
  formatDate,
  formatCurrency,
  calculateTotalRevenue,
  calculateTotalTransactions,
  calculateCompletedTransactions,
  calculateAverageTransaction,
  getDateRange,
  getDateFilterLabel,
  matchesSearch,
  filterTransactions,
} from '@/lib/utils/transaction-helpers'
import type { Transaction } from '@/lib/supabase'

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '1',
    transaction_number: 'TRX/PIGTOWN/202607/0001',
    subtotal: 100000,
    discount_amount: 0,
    total_amount: 100000,
    payment_method: 'cash',
    payment_status: 'completed',
    created_at: '2026-07-17T10:00:00.000Z',
    branch_id: 'branch-1',
    ...overrides,
  } as Transaction
}

// ---------------------------------------------------------------------------
// Badge color / formatting
// ---------------------------------------------------------------------------
describe('getStatusColor / getPaymentMethodColor', () => {
  it('memetakan status ke warna badge yang sesuai', () => {
    expect(getStatusColor('completed')).toContain('green')
    expect(getStatusColor('refunded')).toContain('red')
    expect(getStatusColor('pending')).toContain('yellow')
    expect(getStatusColor('unknown')).toContain('gray')
  })
  it('memetakan metode pembayaran ke warna badge yang sesuai', () => {
    expect(getPaymentMethodColor('cash')).toContain('blue')
    expect(getPaymentMethodColor('qris')).toContain('red')
    expect(getPaymentMethodColor('debit')).toContain('orange')
    expect(getPaymentMethodColor('credit')).toContain('indigo')
  })
  it('mengembalikan warna default untuk metode pembayaran yang tidak dikenal', () => {
    expect(getPaymentMethodColor('unknown')).toContain('gray')
  })
})

describe('formatPaymentMethod / formatStatus', () => {
  it('menerjemahkan metode pembayaran ke Bahasa Indonesia', () => {
    expect(formatPaymentMethod('cash')).toBe('Tunai')
    expect(formatPaymentMethod('qris')).toBe('QRIS')
    expect(formatPaymentMethod('debit')).toBe('Kartu Debit')
    expect(formatPaymentMethod('credit')).toBe('Kartu Kredit')
  })
  it('mengembalikan kode aslinya untuk metode pembayaran yang tidak dikenal', () => {
    expect(formatPaymentMethod('unknown')).toBe('unknown')
  })
  it('menerjemahkan status pembayaran ke Bahasa Indonesia', () => {
    expect(formatStatus('completed')).toBe('Selesai')
    expect(formatStatus('refunded')).toBe('Refund')
    expect(formatStatus('pending')).toBe('Pending')
  })
  it('mengembalikan kode aslinya untuk status yang tidak dikenal', () => {
    expect(formatStatus('unknown')).toBe('unknown')
  })
})

describe('formatTime / formatDate / formatCurrency', () => {
  it('formatTime menghasilkan format jam:menit', () => {
    expect(formatTime('2026-07-17T10:30:00.000Z')).toMatch(/\d{2}[.:]\d{2}/)
  })
  it('formatDate menghasilkan format tanggal DD/MM/YYYY', () => {
    expect(formatDate('2026-07-17T10:30:00.000Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })
  it('formatCurrency memformat ke Rupiah', () => {
    expect(formatCurrency(100000)).toContain('100.000')
  })
})

// ---------------------------------------------------------------------------
// Revenue / stats calculation — dasar Section 5 & Owner Dashboard
// ---------------------------------------------------------------------------
describe('calculateTotalRevenue / calculateTotalTransactions / calculateCompletedTransactions / calculateAverageTransaction', () => {
  const transactions: Transaction[] = [
    makeTransaction({ id: '1', total_amount: 100000, payment_status: 'completed' }),
    makeTransaction({ id: '2', total_amount: 50000, payment_status: 'pending' }),
    makeTransaction({ id: '3', total_amount: 200000, payment_status: 'completed' }),
  ]

  it('calculateTotalRevenue hanya menjumlahkan transaksi completed secara default', () => {
    expect(calculateTotalRevenue(transactions)).toBe(300000)
  })
  it('calculateTotalRevenue menangani total_amount yang falsy (fallback ke 0)', () => {
    const withFalsyAmount = [makeTransaction({ total_amount: undefined as any, payment_status: 'completed' })]
    expect(calculateTotalRevenue(withFalsyAmount)).toBe(0)
  })
  it('calculateTotalRevenue menjumlahkan semua transaksi jika filterCompleted=false', () => {
    expect(calculateTotalRevenue(transactions, false)).toBe(350000)
  })
  it('calculateTotalTransactions menghitung total seluruh transaksi', () => {
    expect(calculateTotalTransactions(transactions)).toBe(3)
  })
  it('calculateCompletedTransactions menghitung hanya yang completed', () => {
    expect(calculateCompletedTransactions(transactions)).toBe(2)
  })
  it('calculateAverageTransaction menghitung rata-rata transaksi completed', () => {
    expect(calculateAverageTransaction(transactions)).toBe(150000)
  })
  it('calculateAverageTransaction mengembalikan 0 jika tidak ada transaksi completed', () => {
    expect(calculateAverageTransaction([makeTransaction({ payment_status: 'pending' })])).toBe(0)
  })
  it('calculateAverageTransaction menangani total_amount yang falsy (fallback ke 0)', () => {
    const withFalsyAmount = [makeTransaction({ total_amount: undefined as any, payment_status: 'completed' })]
    expect(calculateAverageTransaction(withFalsyAmount)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Date range / filter label
// ---------------------------------------------------------------------------
describe('getDateRange / getDateFilterLabel', () => {
  it('getDateRange "today" mengembalikan startDate = endDate', () => {
    const range = getDateRange('today')
    expect(range.startDate).toBe(range.endDate)
  })
  it('getDateRange "custom" menggunakan tanggal kustom yang diberikan', () => {
    const range = getDateRange('custom', '2026-01-01', '2026-01-31')
    expect(range).toEqual({ startDate: '2026-01-01', endDate: '2026-01-31' })
  })
  it('getDateRange "custom" tanpa tanggal kustom jatuh kembali ke tanggal hari ini', () => {
    const range = getDateRange('custom')
    expect(range.startDate).toBe(range.endDate)
  })
  it('getDateRange "this_month" mengembalikan tanggal 1 sampai akhir bulan', () => {
    const range = getDateRange('this_month')
    expect(range.startDate.endsWith('-01')).toBe(true)
  })
  it('getDateRange "this_week" mengembalikan rentang Senin-Minggu', () => {
    const range = getDateRange('this_week')
    const start = new Date(range.startDate)
    const end = new Date(range.endDate)
    expect(start.getDay()).toBe(1) // Senin
    expect((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)).toBe(6)
  })
  it('getDateRange "this_week" tetap mengembalikan Senin sebagai awal minggu walau hari ini Minggu', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-19T10:00:00.000Z')) // Minggu
    try {
      const range = getDateRange('this_week')
      const start = new Date(range.startDate)
      expect(start.getDay()).toBe(1) // tetap Senin, bukan mundur 6 hari dari Minggu berikutnya
    } finally {
      jest.useRealTimers()
    }
  })
  it('getDateFilterLabel menerjemahkan filter ke label Indonesia', () => {
    expect(getDateFilterLabel('today')).toBe('Hari Ini')
    expect(getDateFilterLabel('this_week')).toBe('Minggu Ini')
    expect(getDateFilterLabel('this_month')).toBe('Bulan Ini')
    expect(getDateFilterLabel('custom')).toBe('Rentang Custom')
  })
  it('getDateFilterLabel mengembalikan default "Hari Ini" untuk filter tidak dikenal', () => {
    expect(getDateFilterLabel('unknown')).toBe('Hari Ini')
  })
})

// ---------------------------------------------------------------------------
// Search & filter — dipakai TransactionFilters/TransactionTable
// ---------------------------------------------------------------------------
describe('matchesSearch / filterTransactions', () => {
  const transactions: Transaction[] = [
    makeTransaction({ id: '1', transaction_number: 'TRX-001', customer_name: 'Budi', branch_id: 'b1', payment_status: 'completed' }),
    makeTransaction({ id: '2', transaction_number: 'TRX-002', customer_name: 'Ani', branch_id: 'b2', payment_status: 'pending' }),
  ]

  it('matchesSearch mencocokkan nomor transaksi', () => {
    expect(matchesSearch(transactions[0], 'trx-001')).toBe(true)
  })
  it('matchesSearch mencocokkan nama customer', () => {
    expect(matchesSearch(transactions[0], 'budi')).toBe(true)
  })
  it('matchesSearch mengembalikan true jika searchTerm kosong', () => {
    expect(matchesSearch(transactions[0], '')).toBe(true)
  })
  it('matchesSearch mengembalikan false jika tidak ada yang cocok', () => {
    expect(matchesSearch(transactions[0], 'tidak-ada')).toBe(false)
  })
  it('filterTransactions menyaring berdasarkan cabang', () => {
    const result = filterTransactions(transactions, { branchId: 'b1' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
  it('filterTransactions menyaring berdasarkan status pembayaran', () => {
    const result = filterTransactions(transactions, { status: 'pending' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })
  it('filterTransactions "all" tidak menyaring apa pun', () => {
    const result = filterTransactions(transactions, { branchId: 'all', status: 'all' })
    expect(result).toHaveLength(2)
  })
  it('filterTransactions menggabungkan search term dan filter lain', () => {
    const result = filterTransactions(transactions, { searchTerm: 'ani', status: 'pending' })
    expect(result).toHaveLength(1)
    expect(result[0].customer_name).toBe('Ani')
  })
})
