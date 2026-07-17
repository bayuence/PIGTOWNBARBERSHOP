/**
 * Unit tests for lib/utils/pos-helpers.ts
 *
 * These functions drive the POS checkout flow (cart -> discount -> payment ->
 * transaction), directly relevant to BUG-016 (kategori produk) di Bagian 3
 * dan modul Kasir/POS pada Bagian 4 (REG-006).
 */
import {
  formatRupiah,
  parseNominal,
  formatCurrency,
  formatTransactionNumber,
  formatPaymentMethod,
  calculateSubtotal,
  calculateDiscount,
  calculateTotal,
  calculateChange,
  calculatePrices,
  validateCart,
  validatePayment,
  validateDiscount,
  validateCustomerName,
  validateBranch,
  checkStockAvailability,
  calculateRemainingStock,
  validateCartStock,
  findCartItemIndex,
  isServiceInCart,
  getCartItemsCount,
  getQuickAmounts,
} from '@/lib/utils/pos-helpers'
import type { CartItem } from '@/components/pos/types'
import type { OutletStock } from '@/lib/supabase'

function makeCartItem(overrides: Partial<CartItem['service']> = {}, quantity = 1): CartItem {
  return {
    service: {
      id: 'svc-1',
      name: 'Haircut',
      price: 50000,
      created_at: '',
      type: 'service',
      ...overrides,
    } as any,
    quantity,
  }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
describe('formatRupiah / parseNominal / formatCurrency', () => {
  it('formatRupiah memformat angka ke ribuan Indonesia', () => {
    expect(formatRupiah(50000)).toBe('50.000')
  })
  it('formatRupiah menerima string berisi angka', () => {
    expect(formatRupiah('50000')).toBe('50.000')
  })
  it('formatRupiah mengembalikan string kosong untuk input kosong', () => {
    expect(formatRupiah('')).toBe('')
  })
  it('formatRupiah mengembalikan string kosong jika hasil strip karakter non-digit kosong (mis. huruf saja)', () => {
    expect(formatRupiah('abc')).toBe('')
  })
  it('parseNominal mem-parsing string terformat menjadi angka', () => {
    expect(parseNominal('50.000')).toBe(50000)
  })
  it('parseNominal mem-parsing string dengan prefix Rp', () => {
    expect(parseNominal('Rp 50.000')).toBe(50000)
  })
  it('parseNominal mengembalikan 0 untuk input kosong', () => {
    expect(parseNominal('')).toBe(0)
  })
  it('formatCurrency menambahkan prefix Rp', () => {
    expect(formatCurrency(50000)).toBe('Rp 50.000')
  })
  it('formatCurrency menangani nilai 0', () => {
    expect(formatCurrency(0)).toBe('Rp 0')
  })
  it('formatCurrency mengembalikan "Rp 0" untuk nilai falsy selain 0 (mis. NaN/undefined)', () => {
    expect(formatCurrency(undefined as any)).toBe('Rp 0')
  })
  it('formatTransactionNumber menambahkan tanda pagar', () => {
    expect(formatTransactionNumber('TRX-001')).toBe('#TRX-001')
  })
  it('formatPaymentMethod menerjemahkan metode pembayaran', () => {
    expect(formatPaymentMethod('cash')).toBe('Tunai')
    expect(formatPaymentMethod('qris')).toBe('QRIS')
    expect(formatPaymentMethod('transfer')).toBe('Transfer')
    expect(formatPaymentMethod('debit')).toBe('Debit')
  })
  it('formatPaymentMethod mengembalikan kode aslinya untuk metode tidak dikenal', () => {
    expect(formatPaymentMethod('unknown' as any)).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// Cart price calculation (checkout flow)
// ---------------------------------------------------------------------------
describe('calculateSubtotal / calculateDiscount / calculateTotal / calculateChange', () => {
  const cart: CartItem[] = [makeCartItem({ price: 50000 }, 2), makeCartItem({ price: 30000 }, 1)]

  it('calculateSubtotal menjumlahkan harga x kuantitas seluruh item', () => {
    expect(calculateSubtotal(cart)).toBe(130000)
  })
  it('calculateDiscount menghitung diskon persentase', () => {
    expect(calculateDiscount(100000, { type: 'percentage', value: '10', reason: '' })).toBe(10000)
  })
  it('calculateDiscount menghitung diskon nominal tetap', () => {
    expect(calculateDiscount(100000, { type: 'fixed', value: '5000', reason: '' })).toBe(5000)
  })
  it('calculateTotal mengurangi subtotal dengan diskon', () => {
    expect(calculateTotal(100000, 10000)).toBe(90000)
  })
  it('calculateTotal tidak pernah menghasilkan nilai negatif', () => {
    expect(calculateTotal(50000, 100000)).toBe(0)
  })
  it('calculateChange menghitung kembalian pembayaran tunai', () => {
    expect(calculateChange(90000, 100000)).toBe(10000)
  })
  it('calculateChange mengembalikan 0 jika pembayaran kurang', () => {
    expect(calculateChange(90000, 50000)).toBe(0)
  })
  it('calculatePrices menghitung subtotal, diskon, dan total sekaligus', () => {
    const result = calculatePrices(cart, { type: 'percentage', value: '10', reason: '' })
    expect(result).toEqual({ subtotal: 130000, discountAmount: 13000, total: 117000 })
  })
})

// ---------------------------------------------------------------------------
// Validation — checkout guard rails
// ---------------------------------------------------------------------------
describe('validateCart / validatePayment / validateDiscount / validateCustomerName / validateBranch', () => {
  it('validateCart menolak keranjang kosong', () => {
    expect(validateCart([])).toBe(false)
  })
  it('validateCart menerima keranjang berisi item', () => {
    expect(validateCart([makeCartItem()])).toBe(true)
  })
  it('validatePayment menolak pembayaran tunai yang kurang', () => {
    expect(validatePayment(90000, 50000, 'cash')).toBe(false)
  })
  it('validatePayment menerima pembayaran tunai yang cukup', () => {
    expect(validatePayment(90000, 100000, 'cash')).toBe(true)
  })
  it('validatePayment tidak memvalidasi nominal untuk metode non-tunai', () => {
    expect(validatePayment(90000, 0, 'qris')).toBe(true)
  })
  it('validateDiscount menolak persentase di atas 100', () => {
    expect(validateDiscount({ type: 'percentage', value: '150', reason: '' }, 100000)).toBe(false)
  })
  it('validateDiscount menolak diskon nominal melebihi subtotal', () => {
    expect(validateDiscount({ type: 'fixed', value: '150000', reason: '' }, 100000)).toBe(false)
  })
  it('validateDiscount menerima diskon 0 (tidak ada diskon)', () => {
    expect(validateDiscount({ type: 'percentage', value: '0', reason: '' }, 100000)).toBe(true)
  })
  it('validateCustomerName menolak nama kosong / hanya spasi', () => {
    expect(validateCustomerName('')).toBe(false)
    expect(validateCustomerName('   ')).toBe(false)
  })
  it('validateCustomerName menerima nama yang valid', () => {
    expect(validateCustomerName('Budi')).toBe(true)
  })
  it('validateBranch menolak branchId kosong', () => {
    expect(validateBranch('')).toBe(false)
  })
  it('validateBranch menerima branchId yang terisi', () => {
    expect(validateBranch('branch-1')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Stock check — DIDOKUMENTASIKAN APA ADANYA (lihat catatan di bawah)
// ---------------------------------------------------------------------------
describe('checkStockAvailability / calculateRemainingStock / validateCartStock', () => {
  it('layanan (type "service") selalu dianggap tersedia tanpa cek stok', () => {
    const item = makeCartItem({ type: 'service' }, 2)
    const result = checkStockAvailability(item, [])
    expect(result.available).toBe(true)
    expect(result.currentStock).toBe(Infinity)
  })

  /**
   * TEMUAN: checkStockAvailability() mencari `stock.find(s => s.product_id === item.service.id)`
   * dan membaca `productStock.quantity`, padahal tipe OutletStock yang sesungguhnya
   * (lib/supabase.ts, dikonsumsi oleh getOutletStock()) memakai field `service_id` dan
   * `stock_quantity` — bukan `product_id`/`quantity`. Akibatnya, untuk item bertipe
   * "product", fungsi ini SELALU melaporkan "Stok tidak ditemukan" walau data stok
   * dengan service_id yang cocok benar-benar ada. Test berikut mendokumentasikan
   * PERILAKU SAAT INI (termasuk bug-nya) sesuai keputusan tim, bukan perilaku ideal.
   */
  it('produk dengan stok cukup (field asli service_id/stock_quantity) tetap dilaporkan "tidak ditemukan" — bug termodokumentasi', () => {
    const item = makeCartItem({ id: 'prod-1', type: 'product' }, 2)
    const stock: OutletStock[] = [
      {
        id: 'stock-1',
        service_id: 'prod-1',
        outlet_id: 'branch-1',
        stock_quantity: 10,
        min_stock_threshold: 5,
      } as OutletStock,
    ]
    const result = checkStockAvailability(item, stock)
    expect(result.available).toBe(false)
    expect(result.message).toBe('Stok tidak ditemukan')
  })

  it('produk tanpa data stok sama sekali dilaporkan "tidak ditemukan"', () => {
    const item = makeCartItem({ id: 'prod-2', type: 'product' }, 1)
    const result = checkStockAvailability(item, [])
    expect(result.available).toBe(false)
    expect(result.message).toBe('Stok tidak ditemukan')
  })

  it('calculateRemainingStock menghasilkan NaN jika field "quantity" tidak ada pada OutletStock asli — bug termodokumentasi', () => {
    const item = makeCartItem({ type: 'product' }, 3)
    // OutletStock asli tidak punya field `quantity` (field aslinya `stock_quantity`),
    // sehingga `stock.quantity` bernilai undefined dan hasil perhitungan menjadi NaN.
    const stock = { stock_quantity: 10 } as any
    expect(calculateRemainingStock(item, stock)).toBeNaN()
  })

  it('validateCartStock mengembalikan false untuk keranjang berisi produk (karena stock check selalu gagal untuk produk)', () => {
    const cart = [makeCartItem({ type: 'product' }, 1)]
    expect(validateCartStock(cart, [])).toBe(false)
  })

  /**
   * Cabang kode `productStock` ditemukan (baris available/currentStock/message pada
   * checkStockAvailability) tidak pernah tercapai dengan tipe OutletStock ASLI karena
   * bug field-name di atas. Test berikut sengaja memakai bentuk data non-standar
   * (field `product_id`/`quantity`, sesuai yang benar-benar dibaca kode) semata-mata
   * untuk menutup cabang kode tersebut dan mendokumentasikan perilakunya bila field
   * itu suatu saat memang cocok — BUKAN klaim bahwa bentuk data ini valid di aplikasi.
   */
  it('[cabang kode] jika field product_id/quantity kebetulan cocok, stok cukup dilaporkan tersedia', () => {
    const item = makeCartItem({ id: 'prod-1', type: 'product' }, 2)
    const stock = [{ product_id: 'prod-1', quantity: 10 }] as any
    const result = checkStockAvailability(item, stock)
    expect(result.available).toBe(true)
    expect(result.currentStock).toBe(10)
    expect(result.message).toBeUndefined()
  })

  it('[cabang kode] jika field product_id/quantity cocok tapi stok kurang, dilaporkan tidak mencukupi', () => {
    const item = makeCartItem({ id: 'prod-1', type: 'product' }, 5)
    const stock = [{ product_id: 'prod-1', quantity: 2 }] as any
    const result = checkStockAvailability(item, stock)
    expect(result.available).toBe(false)
    expect(result.message).toBe('Stok tidak mencukupi')
  })

  it('validateCartStock mengembalikan true untuk keranjang berisi layanan saja', () => {
    const cart = [makeCartItem({ type: 'service' }, 1)]
    expect(validateCartStock(cart, [])).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Cart helpers
// ---------------------------------------------------------------------------
describe('findCartItemIndex / isServiceInCart / getCartItemsCount', () => {
  const cart: CartItem[] = [makeCartItem({ id: 'a' }, 2), makeCartItem({ id: 'b' }, 3)]

  it('findCartItemIndex menemukan index item berdasarkan serviceId', () => {
    expect(findCartItemIndex(cart, 'b')).toBe(1)
  })
  it('findCartItemIndex mengembalikan -1 jika tidak ditemukan', () => {
    expect(findCartItemIndex(cart, 'z')).toBe(-1)
  })
  it('isServiceInCart mendeteksi item yang sudah ada di keranjang', () => {
    expect(isServiceInCart(cart, 'a')).toBe(true)
    expect(isServiceInCart(cart, 'z')).toBe(false)
  })
  it('getCartItemsCount menjumlahkan seluruh kuantitas item', () => {
    expect(getCartItemsCount(cart)).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Quick cash amounts
// ---------------------------------------------------------------------------
describe('getQuickAmounts', () => {
  it('mengembalikan 3 nominal mulai dari yang >= total', () => {
    expect(getQuickAmounts(45000)).toEqual([50000, 100000, 200000])
  })
  it('mengembalikan kelipatan total jika total sangat besar', () => {
    expect(getQuickAmounts(2000000)).toEqual([2000000, 4000000, 10000000])
  })
})
