/**
 * Unit tests for lib/utils/receipt-helpers.ts.
 *
 * Fungsi generateReceiptHTML/generateReceiptText adalah logika murni. Fungsi
 * printReceipt/printViaBluetooth/requestBluetoothDevice/connectBluetoothDevice/
 * disconnectBluetoothDevice menyentuh DOM & Web Bluetooth API sebagai side
 * effect — di bawah ini diuji dengan MOCK jsdom document/navigator.bluetooth
 * (bukan printer/browser sungguhan). Cetak struk end-to-end dengan hardware
 * asli tetap diverifikasi lewat regresi manual, lihat Bagian 4 REG-006.
 */
import {
  generateReceiptHTML,
  generateReceiptText,
  isBluetoothSupported,
  printReceipt,
  printViaBluetooth,
  requestBluetoothDevice,
  connectBluetoothDevice,
  disconnectBluetoothDevice,
} from '@/lib/utils/receipt-helpers'
import type { ReceiptData, BluetoothDevice } from '@/components/pos/types'

function makeReceiptData(overrides: Partial<ReceiptData> = {}): ReceiptData {
  return {
    transaction: {
      id: '1',
      transaction_number: 'TRX/PIGTOWN/202607/0001',
      customer_name: 'Budi',
      payment_method: 'cash',
      payment_status: 'completed',
      total_amount: 95000,
      discount_amount: 5000,
      notes: null,
      created_at: '2026-07-17T10:00:00.000Z',
      branch_id: 'b1',
      cashier_id: 'c1',
      server_id: 's1',
      cashier: { name: 'Kasir A' },
      server: { name: 'Barber A' },
    },
    items: [
      { service: { id: 'svc-1', name: 'Haircut', price: 50000, created_at: '' } as any, quantity: 2 },
    ],
    template: null,
    branch: null,
    subtotal: 100000,
    discount: 5000,
    total: 95000,
    ...overrides,
  } as ReceiptData
}

describe('generateReceiptHTML', () => {
  const data = makeReceiptData()
  const html = generateReceiptHTML(data)

  it('menyertakan nomor transaksi', () => {
    expect(html).toContain('TRX/PIGTOWN/202607/0001')
  })
  it('menyertakan nama toko default jika tidak ada template/branch', () => {
    expect(html).toContain('Pigtown Barbershop')
  })
  it('menyertakan nama customer', () => {
    expect(html).toContain('Budi')
  })
  it('menyertakan nama item dan subtotal per item', () => {
    expect(html).toContain('Haircut')
    expect(html).toContain('2 x')
  })
  it('menampilkan baris diskon hanya jika diskon > 0', () => {
    expect(html).toContain('Diskon')
    const noDiscountHtml = generateReceiptHTML(makeReceiptData({ discount: 0 }))
    expect(noDiscountHtml).not.toContain('Diskon')
  })
  it('menampilkan grand total', () => {
    expect(html).toMatch(/TOTAL/)
  })
  it('menampilkan metode pembayaran dalam huruf kapital', () => {
    expect(html).toContain('CASH')
  })
  it('menampilkan alamat & telepon toko jika template menyediakannya', () => {
    const withTemplate = generateReceiptHTML(
      makeReceiptData({ template: { store_address: 'Jl. Merdeka No. 1', store_phone: '0311234567' } as any })
    )
    expect(withTemplate).toContain('Jl. Merdeka No. 1')
    expect(withTemplate).toContain('Telp: 0311234567')
  })
  it('tidak menampilkan customer/server/kasir jika datanya kosong', () => {
    const minimal = generateReceiptHTML(
      makeReceiptData({
        transaction: {
          ...makeReceiptData().transaction,
          customer_name: '',
          server: null as any,
          cashier: null as any,
        },
      })
    )
    expect(minimal).not.toContain('Customer:')
    expect(minimal).not.toContain('Server:')
    expect(minimal).not.toContain('Kasir:')
  })
})

describe('generateReceiptText', () => {
  const data = makeReceiptData()
  const text = generateReceiptText(data)

  it('menyertakan nomor transaksi', () => {
    expect(text).toContain('TRX/PIGTOWN/202607/0001')
  })
  it('menyertakan nama item', () => {
    expect(text).toContain('Haircut')
  })
  it('menampilkan baris TOTAL', () => {
    expect(text).toContain('TOTAL:')
  })
  it('tidak menampilkan baris diskon jika discount = 0', () => {
    const noDiscountText = generateReceiptText(makeReceiptData({ discount: 0 }))
    expect(noDiscountText).not.toContain('Diskon:')
  })
  it('menampilkan alamat & telepon toko jika template menyediakannya', () => {
    const withTemplate = generateReceiptText(
      makeReceiptData({ template: { store_address: 'Jl. Merdeka No. 1', store_phone: '0311234567' } as any })
    )
    expect(withTemplate).toContain('Jl. Merdeka No. 1')
    expect(withTemplate).toContain('Telp: 0311234567')
  })
  it('tidak menampilkan customer/server/kasir jika datanya kosong', () => {
    const minimal = generateReceiptText(
      makeReceiptData({
        transaction: {
          ...makeReceiptData().transaction,
          customer_name: '',
          server: null as any,
          cashier: null as any,
        },
      })
    )
    expect(minimal).not.toContain('Customer:')
    expect(minimal).not.toContain('Server:')
    expect(minimal).not.toContain('Kasir:')
  })
  it('menggunakan pesan footer default jika template null', () => {
    expect(text).toContain('Terima kasih!')
  })
  it('menggunakan footer_text dari template jika tersedia', () => {
    const withTemplate = generateReceiptText(
      makeReceiptData({ template: { footer_text: 'Sampai jumpa lagi!' } as any })
    )
    expect(withTemplate).toContain('Sampai jumpa lagi!')
  })
})

describe('isBluetoothSupported', () => {
  it('mengembalikan false pada environment tanpa Web Bluetooth API (jsdom)', () => {
    expect(isBluetoothSupported()).toBe(false)
  })
  it('mengembalikan true jika navigator.bluetooth tersedia (browser Chrome/Edge)', () => {
    ;(navigator as any).bluetooth = {}
    expect(isBluetoothSupported()).toBe(true)
    delete (navigator as any).bluetooth
  })
})

// ---------------------------------------------------------------------------
// printReceipt — mock DOM (iframe tersembunyi + window.print)
// ---------------------------------------------------------------------------
describe('printReceipt', () => {
  afterEach(() => {
    jest.useRealTimers()
    document.body.innerHTML = ''
  })

  it('membuat iframe tersembunyi berisi struk lalu menghapusnya setelah proses print selesai', () => {
    jest.useFakeTimers()
    printReceipt(makeReceiptData())

    // Iframe langsung ditambahkan ke body secara tersembunyi.
    const iframe = document.body.querySelector('iframe') as HTMLIFrameElement
    expect(iframe).not.toBeNull()
    expect(iframe.style.display).toBe('none')
    expect(iframe.contentWindow?.document.body.innerHTML).toContain('TRX/PIGTOWN/202607/0001')

    // t=250ms: window.print() dipanggil pada iframe.
    jest.advanceTimersByTime(250)
    // t=250+1000ms: iframe dihapus dari DOM setelah print selesai.
    jest.advanceTimersByTime(1000)
    expect(document.body.querySelector('iframe')).toBeNull()
  })

  it('tidak error jika iframe.contentWindow tidak tersedia (mis. dibatasi kebijakan browser)', () => {
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'iframe') {
        Object.defineProperty(el, 'contentWindow', { value: null, configurable: true })
      }
      return el
    })

    expect(() => printReceipt(makeReceiptData())).not.toThrow()

    createElementSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// printViaBluetooth / requestBluetoothDevice / connectBluetoothDevice /
// disconnectBluetoothDevice — mock Web Bluetooth API
// ---------------------------------------------------------------------------
function makeMockCharacteristic(writable = true): BluetoothDevice {
  return {
    properties: { write: writable, writeWithoutResponse: false },
    writeValue: jest.fn().mockResolvedValue(undefined),
  }
}

function makeMockService(characteristics: any[]): BluetoothDevice {
  return { getCharacteristics: jest.fn().mockResolvedValue(characteristics) }
}

function makeMockDevice(options: { connected?: boolean; services?: any[] } = {}): BluetoothDevice {
  const { connected = true, services = [] } = options
  return {
    gatt: {
      connected,
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      getPrimaryServices: jest.fn().mockResolvedValue(services),
    },
  }
}

describe('printViaBluetooth', () => {
  it('melempar error jika printer tidak terhubung', async () => {
    const device = makeMockDevice({ connected: false })
    await expect(printViaBluetooth(makeReceiptData(), device)).rejects.toThrow(
      'Printer Bluetooth tidak terhubung'
    )
  })

  it('melempar error jika device null/undefined', async () => {
    await expect(printViaBluetooth(makeReceiptData(), null)).rejects.toThrow(
      'Printer Bluetooth tidak terhubung'
    )
  })

  it('melempar error jika tidak ditemukan characteristic yang writable', async () => {
    const char = makeMockCharacteristic(false)
    const service = makeMockService([char])
    const device = makeMockDevice({ services: [service] })
    await expect(printViaBluetooth(makeReceiptData(), device)).rejects.toThrow(
      'Tidak dapat menemukan characteristic yang dapat ditulis pada printer'
    )
  })

  it('mengirim data struk ke printer melalui characteristic yang writable', async () => {
    jest.useFakeTimers()
    const char = makeMockCharacteristic(true)
    const service = makeMockService([char])
    const device = makeMockDevice({ services: [service] })

    const printPromise = printViaBluetooth(makeReceiptData(), device)
    await jest.advanceTimersByTimeAsync(200)
    await printPromise

    expect(char.writeValue).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('meneruskan (re-throw) error yang terjadi saat mengambil primary services', async () => {
    const device = makeMockDevice()
    device.gatt.getPrimaryServices = jest.fn().mockRejectedValue(new Error('GATT error'))
    await expect(printViaBluetooth(makeReceiptData(), device)).rejects.toThrow('GATT error')
  })
})

describe('requestBluetoothDevice', () => {
  afterEach(() => {
    delete (navigator as any).bluetooth
  })

  it('melempar error jika browser tidak mendukung Bluetooth', async () => {
    await expect(requestBluetoothDevice()).rejects.toThrow(
      'Browser Anda tidak mendukung Bluetooth. Gunakan Chrome atau Edge.'
    )
  })

  it('mengembalikan device yang dipilih pengguna', async () => {
    const fakeDevice = { name: 'Thermal Printer' }
    ;(navigator as any).bluetooth = { requestDevice: jest.fn().mockResolvedValue(fakeDevice) }
    const device = await requestBluetoothDevice()
    expect(device).toBe(fakeDevice)
  })

  it('melempar pesan error Indonesia jika pengguna membatalkan pemilihan device', async () => {
    ;(navigator as any).bluetooth = {
      requestDevice: jest.fn().mockRejectedValue(new Error('User cancelled')),
    }
    await expect(requestBluetoothDevice()).rejects.toThrow(
      'Gagal memilih printer. Pastikan Bluetooth aktif.'
    )
  })
})

describe('connectBluetoothDevice / disconnectBluetoothDevice', () => {
  it('connectBluetoothDevice memanggil device.gatt.connect()', async () => {
    const device = makeMockDevice()
    await connectBluetoothDevice(device)
    expect(device.gatt.connect).toHaveBeenCalled()
  })

  it('connectBluetoothDevice melempar pesan error Indonesia jika koneksi gagal', async () => {
    const device = makeMockDevice()
    device.gatt.connect = jest.fn().mockRejectedValue(new Error('connect failed'))
    await expect(connectBluetoothDevice(device)).rejects.toThrow(
      'Gagal terhubung ke printer. Pastikan printer dalam jangkauan.'
    )
  })

  it('disconnectBluetoothDevice memanggil device.gatt.disconnect() jika sedang terhubung', () => {
    const device = makeMockDevice({ connected: true })
    disconnectBluetoothDevice(device)
    expect(device.gatt.disconnect).toHaveBeenCalled()
  })

  it('disconnectBluetoothDevice tidak melakukan apa pun jika device tidak terhubung', () => {
    const device = makeMockDevice({ connected: false })
    disconnectBluetoothDevice(device)
    expect(device.gatt.disconnect).not.toHaveBeenCalled()
  })

  it('disconnectBluetoothDevice tidak error jika device null', () => {
    expect(() => disconnectBluetoothDevice(null)).not.toThrow()
  })
})
