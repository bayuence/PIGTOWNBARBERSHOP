"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  supabase,
  getServicesWithCategories,
  getServiceCategories,
  createTransaction,
  createTransactionItems,
  getActiveReceiptTemplate,
  getBranches,
  type ServiceWithCategory,
  type Branch,
  type ReceiptTemplate,
  broadcastTransactionEvent,
  subscribeToEvents,
  reduceOutletStock,
  getOutletStock,
  type OutletStock
} from "@/lib/supabase"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Clock,
  UserIcon,
  Scissors,
  Sparkles,
  Droplets,
  Zap,
  Receipt,
  Printer,
  Bluetooth,
  MapPin,
  QrCode,
  Package,
  X,
  Percent,
  DollarSign,
  Loader2,
  AlertTriangle
} from "lucide-react"

type BluetoothDevice = any
type BluetoothRemoteGATTCharacteristic = any

interface CartItem {
  service: ServiceWithCategory
  quantity: number
}

// Helper functions untuk format Rupiah
const formatRupiah = (value: string | number): string => {
  if (!value && value !== 0) return "";
  const stringValue = String(value).replace(/[^0-9]/g, '');
  if (stringValue === "") return "";
  return new Intl.NumberFormat('id-ID').format(parseInt(stringValue, 10));
};

const parseNominal = (value: string): number => {
  if (!value) return 0;
  return parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
};

export function POSSystem() {
  const [selectedCategory, setSelectedCategory] = useState("semua")
  const [selectedType, setSelectedType] = useState<"all" | "service" | "product">("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("")
  const [servingEmployee, setServingEmployee] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [cashAmount, setCashAmount] = useState("")
  const [changeAmount, setChangeAmount] = useState(0)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState<any | null>(null)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [services, setServices] = useState<ServiceWithCategory[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [receiptTemplate, setReceiptTemplate] = useState<ReceiptTemplate | null>(null)
  const [branchInfo, setBranchInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isBluetoothOpen, setIsBluetoothOpen] = useState(false)
  const [bluetoothConnected, setBluetoothConnected] = useState(false)
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null)
  const [bluetoothCharacteristic, setBluetoothCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null)
  const [bluetoothError, setBluetoothError] = useState<string | null>(null)
  const [outletStock, setOutletStock] = useState<OutletStock[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  // Ref untuk menyimpan device agar bisa auto-reconnect tanpa kehilangan referensi
  const bluetoothDeviceRef = useRef<BluetoothDevice | null>(null)
  // Ref untuk mencegah listener gattserverdisconnected duplikat
  const gattListenerAttached = useRef(false)
  // Ref untuk menandai apakah user sengaja disconnect (bukan karena printer idle)
  const intentionalDisconnect = useRef(false)

  const categoryIcons = {
    "Potong Rambut": Scissors,
    Cukur: Zap,
    "Perawatan Rambut": Droplets,
    Styling: Sparkles,
  }

  // Load data functions dengan useCallback untuk optimasi
  const loadServicesData = useCallback(async () => {
    const { data, error } = await getServicesWithCategories()
    if (error) console.error("Error loading services:", error)
    else setServices(data)
  }, [])

  const loadCategoriesData = useCallback(async () => {
    const { data, error } = await getServiceCategories()
    if (error) console.error("Error loading categories:", error)
    else setCategories(data)
  }, [])

  const loadBranchesData = useCallback(async () => {
    const { data, error } = await getBranches()
    if (error) {
      console.error("Error loading branches:", error)
      return
    }
    setBranches(data)
    if (data.length > 0 && !selectedBranch) {
      setSelectedBranch(data[0].name)
    }
  }, [selectedBranch])

  const loadOutletStock = useCallback(async (branchId: string) => {
    if (!branchId) return;

    setStockLoading(true);
    try {
      const { data, error } = await getOutletStock(branchId);
      if (error) {
        console.error("Error fetching outlet stock:", error);
        return;
      }
      setOutletStock(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setStockLoading(false);
    }
  }, [])

  const loadBranchAndTemplateData = useCallback(async (branchId?: string) => {
    const { data: templateData, error: templateError } = await getActiveReceiptTemplate(branchId)
    if (templateError) console.error("Error loading receipt template:", templateError)
    else setReceiptTemplate(templateData)

    const { data: branchData, error: branchError } = await supabase.from("branches").select("*").limit(1).maybeSingle()
    if (branchError) console.error("Error loading branch data:", branchError)
    else if (branchData) setBranchInfo(branchData)
  }, [])

  const loadEmployeesData = useCallback(async () => {
    const { data, error } = await supabase.from("users").select("*").eq("status", "active")
    if (error) {
      console.error("Users error:", error)
    } else if (data && data.length > 0) {
      setEmployees(data)
      // Set current user ke user pertama yang ada
      if (!currentUser) setCurrentUser(data[0])
    }
  }, [currentUser])

  const loadInitialData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadServicesData(),
        loadCategoriesData(),
        loadBranchesData(),
        loadBranchAndTemplateData(),
        loadEmployeesData()
      ])
    } catch (error) {
      console.error("Error loading initial data:", error)
      toast.error("Error Memuat Data", {
        description: "Gagal memuat data dari database.",
      })
    } finally {
      setLoading(false)
    }
  }, [loadServicesData, loadCategoriesData, loadBranchesData, loadBranchAndTemplateData, loadEmployeesData])

  useEffect(() => {
    loadInitialData()

    const servicesSubscription = supabase
      .channel("services_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, loadServicesData)
      .subscribe()

    const categoriesSubscription = supabase
      .channel("categories_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_categories" }, loadCategoriesData)
      .subscribe()

    // Subscribe to global events untuk sinkronisasi dengan komponen lain
    const eventsChannel = subscribeToEvents((event: string, payload: any) => {
      console.log('POS received event:', event, payload);
      if (event === 'transaction_created' || event === 'transaction_deleted') {
        loadServicesData(); // Refresh stok produk
      }
    })

    return () => {
      servicesSubscription.unsubscribe()
      categoriesSubscription.unsubscribe()
      supabase.removeChannel(eventsChannel)
    }
  }, [loadInitialData, loadServicesData, loadCategoriesData])

  // Auto refresh stok setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      loadServicesData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadServicesData]);

  // Load outlet stock when branch changes
  useEffect(() => {
    if (selectedBranch) {
      const branch = branches.find(b => b.name === selectedBranch);
      if (branch?.id) {
        loadOutletStock(branch.id);
        // Reload receipt template for this specific branch
        loadBranchAndTemplateData(branch.id);
      }
    }
  }, [selectedBranch, branches, loadOutletStock, loadBranchAndTemplateData])

  // Keyboard shortcuts untuk UX yang better
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            if (cart.length > 0) setIsCartOpen(true);
            break;
          case 'p':
            e.preventDefault();
            if (cart.length > 0) setIsCheckoutOpen(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length]);

  const handleForgetCurrentPrinter = () => {
    if (bluetoothDevice) {
      const configKey = `printerConfig-${bluetoothDevice.id}`
      localStorage.removeItem(configKey)
      toast.success("Konfigurasi Printer Dihapus", {
        description: "Silakan hubungkan kembali untuk 'belajar' ulang.",
      })
      handleDisconnectBluetooth()
    }
  }

  const handleDisconnectBluetooth = () => {
    intentionalDisconnect.current = true
    if (bluetoothDeviceRef.current && bluetoothDeviceRef.current.gatt?.connected) {
      bluetoothDeviceRef.current.gatt.disconnect()
    }
    setBluetoothConnected(false)
    setBluetoothDevice(null)
    setBluetoothCharacteristic(null)
    bluetoothDeviceRef.current = null
    gattListenerAttached.current = false
  }

  // Auto-reconnect ke printer yang sama setelah koneksi terputus (misal setelah print)
  const handleAutoReconnect = useCallback(async (device: BluetoothDevice, retries = 3) => {
    if (intentionalDisconnect.current) return
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Auto-reconnect attempt ${attempt}/${retries} ke ${device.name}...`)
        await new Promise(resolve => setTimeout(resolve, 800 * attempt)) // backoff
        if (intentionalDisconnect.current) return
        await device.gatt?.connect()
        setBluetoothConnected(true)
        setBluetoothDevice(device)
        console.log(`✅ Auto-reconnect berhasil ke ${device.name}`)
        toast.success("Printer Tersambung Kembali 🖨️", {
          description: `Koneksi ke ${device.name} dipulihkan otomatis`,
          duration: 3000,
        })
        return
      } catch (err) {
        console.warn(`Auto-reconnect attempt ${attempt} gagal:`, err)
      }
    }
    // Semua retry gagal
    setBluetoothConnected(false)
    toast.warning("Printer Terputus", {
      description: "Koneksi Bluetooth terputus. Hubungkan kembali secara manual jika diperlukan.",
      duration: 5000,
    })
  }, [])

  const handleScanAndConnect = async () => {
    setBluetoothError(null)

    // Cek compatibility
    if (!navigator.bluetooth) {
      setBluetoothError("Browser Anda tidak mendukung Bluetooth. Gunakan Chrome atau Edge.");
      return;
    }

    try {
      // UUID service umum printer thermal Bluetooth (ESC/POS)
      const PRINTER_SERVICE_UUIDS = [
        '000018f0-0000-1000-8000-00805f9b34fb', // Xprinter, HPRT, Generic
        '0000ff00-0000-1000-8000-00805f9b34fb', // Common thermal
        '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC41 BLE module
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Xprinter series
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC BLE UART
        '0000fff0-0000-1000-8000-00805f9b34fb', // BLE Serial
        'generic_access',
        'generic_attribute',
      ]
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS
      })

      setBluetoothError(null)
      intentionalDisconnect.current = false

      // Simpan ke ref agar listener bisa akses tanpa closure stale
      bluetoothDeviceRef.current = device
      setBluetoothDevice(device)

      await device.gatt?.connect()
      setBluetoothConnected(true)

      // Pasang listener hanya SATU KALI per device
      if (!gattListenerAttached.current) {
        gattListenerAttached.current = true
        device.addEventListener("gattserverdisconnected", () => {
          if (intentionalDisconnect.current) return
          // Tandai belum connect dulu, lalu coba reconnect
          setBluetoothConnected(false)
          handleAutoReconnect(device)
        })
      }

      setIsBluetoothOpen(false)
      toast.success("Berhasil Terhubung! 📱", {
        description: `Terhubung ke printer ${device.name}`,
      })
    } catch (error) {
      console.error("Kesalahan Bluetooth:", error)
      setBluetoothError("Gagal terhubung. Pastikan Bluetooth aktif dan printer dalam jangkauan.")
      setBluetoothConnected(false)
      setBluetoothDevice(null)
      setBluetoothCharacteristic(null)
    }
  }

  // Handle print with debounce to prevent double printing
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = useCallback(async () => {
    if (isPrinting) return
    setIsPrinting(true)

    try {
      // Derive paper width: use paper_width field directly, or parse paper_size string
      const paperWidth = receiptTemplate?.paper_width
        || (receiptTemplate?.paper_size === '58mm' ? 58 : 80)
      const fontSize = receiptTemplate?.paper_width === 58 ? '8px' : '10px'

      // Helper: wrap long text for thermal printer (word-wrap by max chars)
      const wrapText = (text: string, maxChars: number): string => {
        const words = text.split(' ')
        const lines: string[] = []
        let current = ''
        for (const word of words) {
          if ((current + (current ? ' ' : '') + word).length <= maxChars) {
            current += (current ? ' ' : '') + word
          } else {
            if (current) lines.push(current)
            current = word
          }
        }
        if (current) lines.push(current)
        return lines.join('\n')
      }

      const buildReceiptHTML = (resolvedLogoSrc?: string | null) => {
        if (!currentTransaction) return '<div>Tidak ada data transaksi</div>'

        // Default values when no template
        // Treat show_logo as true if logo_url exists (fallback for misconfigured templates)
        const showLogo = (receiptTemplate?.show_logo ?? false) || !!(receiptTemplate?.logo_url)
        const showAddress = receiptTemplate?.show_address ?? true
        const showPhone = receiptTemplate?.show_phone ?? true
        const showDate = receiptTemplate?.show_date ?? true
        const showBarber = receiptTemplate?.show_barber ?? true
        const showCustomer = receiptTemplate?.show_customer ?? true
        const maxCharsPerLine = paperWidth === 58 ? 32 : 42

        const addressWrapped = branchInfo?.address
          ? wrapText(branchInfo.address, maxCharsPerLine).replace(/\n/g, '<br/>')
          : ''

        // Use resolved base64 if available, otherwise fall back to direct URL
        const logoSrc = resolvedLogoSrc || receiptTemplate?.logo_url || null
        const headerHTML = `
          <div style="text-align:center; margin-bottom:2mm;">
            ${showLogo && logoSrc ? `<img src="${logoSrc}" alt="Logo" style="height:${receiptTemplate?.logo_height || 40}px; width:auto; margin:0 auto 2mm; display:block;" />` : ''}
            ${receiptTemplate?.header_text
            ? `<div style="white-space:pre-line; font-weight:700; font-size:${paperWidth === 58 ? '9px' : '11px'};">${receiptTemplate.header_text}</div>`
            : `<div style="font-weight:700; font-size:${paperWidth === 58 ? '10px' : '12px'};">PIGTOWN BARBERSHOP</div>`}
            ${showAddress && branchInfo?.address ? `<div style="font-size:${paperWidth === 58 ? '7px' : '9px'}; margin-top:1mm;">${addressWrapped}</div>` : ''}
            ${showPhone && branchInfo?.phone ? `<div style="font-size:${paperWidth === 58 ? '7px' : '9px'};">Telp: ${branchInfo.phone}</div>` : ''}
          </div>`

        const infoHTML = `
          <div style="border-top:1px dashed #000; margin:2mm 0"></div>
          <div style="font-size:${paperWidth === 58 ? '8px' : '9px'};">
            ${showDate ? `<div>Tanggal: ${currentTransaction.timestamp}</div>` : ''}
            <div>No: ${currentTransaction.receipt_number}</div>
            ${showBarber && currentTransaction.barberName ? `<div>Kasir/Capster: ${currentTransaction.barberName}</div>` : ''}
            ${showCustomer && currentTransaction.customer_name ? `<div>Customer: ${currentTransaction.customer_name}</div>` : ''}
          </div>
          <div style="border-top:1px dashed #000; margin:2mm 0"></div>`

        const itemsHTML = currentTransaction.items.map((item: any) => {
          const left = `${item.quantity} x Rp ${formatRupiah(item.service.price.toString())}`
          const right = `Rp ${formatRupiah((item.service.price * item.quantity).toString())}`
          return `
            <div style="font-size:${paperWidth === 58 ? '8px' : '9px'}; margin-bottom:1mm;">
              <div style="font-weight:600">${item.service.name}</div>
              <div style="display:flex; justify-content:space-between;">
                <span>${left}</span>
                <span>${right}</span>
              </div>
            </div>`
        }).join('')

        const totalsHTML = `
          <div style="border-top:1px dashed #000; margin:2mm 0"></div>
          <div style="font-size:${paperWidth === 58 ? '8px' : '9px'};">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5mm;">
              <span>Subtotal:</span>
              <span>Rp ${formatRupiah(currentTransaction.subtotal)}</span>
            </div>
            ${currentTransaction.discount_amount > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:0.5mm;"><span>Diskon:</span><span>-Rp ${formatRupiah(currentTransaction.discount_amount)}</span></div>` : ''}
            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:${paperWidth === 58 ? '10px' : '11px'}; margin-top:1mm; padding-top:1mm; border-top:1px solid #ddd;">
              <span>TOTAL:</span>
              <span>Rp ${formatRupiah(currentTransaction.total_amount.toString())}</span>
            </div>
            <div style="margin-top:1mm;">Pembayaran: ${currentTransaction.payment_method}</div>
            ${currentTransaction.payment_method === 'cash' && currentTransaction.cash_amount ? `
              <div style="display:flex; justify-content:space-between; margin-top:0.5mm;">
                <span>Uang Diterima:</span>
                <span>Rp ${formatRupiah(currentTransaction.cash_amount.toString())}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:0.5mm;">
                <span>Kembalian:</span>
                <span>Rp ${formatRupiah((currentTransaction.change_amount || 0).toString())}</span>
              </div>
            ` : ''}
          </div>
          <div style="border-top:1px dashed #000; margin:2mm 0"></div>`

        // Wrap footer text to fit paper width
        const footerRaw = receiptTemplate?.footer_text || 'Terima kasih & sampai jumpa!'
        const footerWrapped = wrapText(footerRaw, maxCharsPerLine).replace(/\n/g, '<br/>')
        const footerHTML = `
          <div style="text-align:center; font-size:${paperWidth === 58 ? '8px' : '9px'};">
            <div>${footerWrapped}</div>
          </div>`

        return headerHTML + infoHTML + itemsHTML + totalsHTML + footerHTML
      }

      // Preload logo as base64 so it renders reliably in the popup window
      // (Fallback: treat show_logo=true whenever logo_url exists)
      let logoBase64: string | null = null
      const hasLogoUrl = !!(receiptTemplate?.logo_url)
      const showLogoFlag = (receiptTemplate?.show_logo ?? false) || hasLogoUrl
      if (showLogoFlag && receiptTemplate?.logo_url) {
        try {
          const resp = await fetch(receiptTemplate.logo_url)
          if (resp.ok) {
            const blob = await resp.blob()
            logoBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })
          } else {
            // HTTP error - fall back to direct URL
            logoBase64 = receiptTemplate.logo_url
          }
        } catch {
          // Network error - fall back to direct URL
          logoBase64 = receiptTemplate.logo_url
        }
      }

      const styles = `
        @page { size: ${paperWidth}mm auto; margin: 0; }
        html, body { width: ${paperWidth}mm; margin: 0; padding: 0; }
        body { background: #fff; color: #000; font-family: 'Courier New', monospace; font-size: ${fontSize}; line-height: 1.3; }
        #root { width: ${paperWidth}mm; margin: 0; padding: ${paperWidth === 58 ? '2mm' : '3mm'}; }
        img { max-width: 100%; }
        .divider { border-top: 1px dashed #000; margin: 2mm 0; }
      `

      // Pass logoBase64 directly — no fragile regex needed
      const receiptHTML = buildReceiptHTML(logoBase64)

      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Struk Pembayaran</title><style>${styles}</style></head><body><div id="root">${receiptHTML}</div></body></html>`

      const win = window.open('', 'PRINT', 'height=600,width=420')
      if (!win) {
        toast.error("Popup diblokir", { description: "Izinkan popup untuk mencetak struk" })
        setIsPrinting(false)
        return
      }

      win.document.open()
      win.document.write(html)
      win.document.close()
      win.focus()

      // Delay to ensure images render before printing
      setTimeout(() => {
        win.print()
        win.close()
        toast.success("Print via Browser 🖨️", { description: "Struk berhasil dicetak menggunakan printer browser", duration: 4000 })
        setIsPrinting(false)
      }, 600)
    } catch (error) {
      console.error('Print error', error)
      toast.error("Gagal membuka print", { description: error instanceof Error ? error.message : String(error) })
      setIsPrinting(false)
    }
  }, [isPrinting, currentTransaction, receiptTemplate])

  const handlePrintViaBluetooth = async () => {
    // Gunakan ref sebagai fallback jika state device sudah null tapi ref masih ada
    const device = bluetoothDevice || bluetoothDeviceRef.current
    if (!device || !currentTransaction) {
      toast.error("Printer Tidak Siap", {
        description: "Printer Bluetooth tidak terhubung atau data transaksi tidak tersedia",
      })
      return
    }
    // Reconnect otomatis jika GATT terputus sebelum print
    if (!device.gatt?.connected) {
      try {
        toast.loading("Menyambung ulang ke printer...", { id: "bt-reconnect" })
        await device.gatt?.connect()
        setBluetoothConnected(true)
        setBluetoothDevice(device)
        toast.dismiss("bt-reconnect")
      } catch {
        toast.dismiss("bt-reconnect")
        toast.error("Printer Tidak Terhubung", {
          description: "Gagal menyambung ulang ke printer. Silakan hubungkan kembali.",
        })
        return
      }
    }
    if (isPrinting) return
    setIsPrinting(true)

    toast.loading("Mencetak via Bluetooth...", {
      id: "bluetooth-print",
    })

    try {
      const device = bluetoothDevice || bluetoothDeviceRef.current
      if (!device) throw new Error("Perangkat printer tidak ditemukan")
      const server = device.gatt

      // UUID service printer thermal yang umum — coba satu per satu
      const KNOWN_SERVICE_UUIDS = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000fff0-0000-1000-8000-00805f9b34fb',
      ]

      // Cari writable characteristic dari service yang dikenal
      let writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
      for (const serviceUuid of KNOWN_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(serviceUuid)
          const characteristics = await service.getCharacteristics()
          for (const char of characteristics) {
            if (char.properties.writeWithoutResponse || char.properties.write) {
              writeCharacteristic = char
              console.log('✅ Printer service found:', serviceUuid, 'char:', char.uuid)
              break
            }
          }
          if (writeCharacteristic) break
        } catch {
          // Service ini tidak ada di printer ini, lanjut ke berikutnya
          continue
        }
      }

      // Fallback: coba getPrimaryServices() jika tidak ada yang cocok
      if (!writeCharacteristic) {
        try {
          const services = await server.getPrimaryServices()
          for (const service of services) {
            try {
              const chars = await service.getCharacteristics()
              for (const char of chars) {
                if (char.properties.writeWithoutResponse || char.properties.write) {
                  writeCharacteristic = char
                  break
                }
              }
              if (writeCharacteristic) break
            } catch { continue }
          }
        } catch { /* ignore */ }
      }

      if (!writeCharacteristic) {
        throw new Error("Printer tidak mendukung write. Pastikan printer thermal ESC/POS dan sudah terpasang dengan benar.")
      }

      // Build receipt text for thermal printer
      const encoder = new TextEncoder()
      const ESC = "\x1B"
      const INIT = ESC + "@" // Initialize printer
      const ALIGN_CENTER = ESC + "a1"
      const ALIGN_LEFT = ESC + "a0"
      const BOLD_ON = ESC + "E1"
      const BOLD_OFF = ESC + "E0"
      const CUT = ESC + "i" // Cut paper
      const LINE = "--------------------------------\n"
      const BT_WIDTH = 32 // Max chars per line for thermal

      // Helper: word-wrap text to fit BT_WIDTH
      const wrapBT = (text: string): string => {
        const words = text.split(' ')
        const lines: string[] = []
        let current = ''
        for (const word of words) {
          if ((current + (current ? ' ' : '') + word).length <= BT_WIDTH) {
            current += (current ? ' ' : '') + word
          } else {
            if (current) lines.push(current)
            current = word
          }
        }
        if (current) lines.push(current)
        return lines.join('\n')
      }

      // Helper: pad left/right (right-align value)
      const padLR = (left: string, right: string): string => {
        const spaces = Math.max(1, BT_WIDTH - left.length - right.length)
        return left + ' '.repeat(spaces) + right
      }

      // Default values when no template
      const showAddress = receiptTemplate?.show_address ?? true
      const showPhone = receiptTemplate?.show_phone ?? true
      const showDate = receiptTemplate?.show_date ?? true
      const showBarber = receiptTemplate?.show_barber ?? true
      const showCustomer = receiptTemplate?.show_customer ?? true

      let receiptText = INIT

      // Header
      receiptText += ALIGN_CENTER + BOLD_ON
      if (receiptTemplate?.header_text) {
        receiptText += receiptTemplate.header_text + "\n"
      } else {
        receiptText += "PIGTOWN BARBERSHOP\n"
      }
      receiptText += BOLD_OFF

      if (showAddress && branchInfo?.address) {
        receiptText += wrapBT(branchInfo.address) + "\n"
      }
      if (showPhone && branchInfo?.phone) {
        receiptText += "Telp: " + branchInfo.phone + "\n"
      }

      receiptText += LINE

      // Transaction info
      receiptText += ALIGN_LEFT
      if (showDate) {
        receiptText += "Tanggal: " + currentTransaction.timestamp + "\n"
      }
      receiptText += "No: " + currentTransaction.receipt_number + "\n"
      if (showBarber && currentTransaction.barberName) {
        receiptText += "Kasir/Capster: " + currentTransaction.barberName + "\n"
      }
      if (showCustomer && currentTransaction.customer_name) {
        receiptText += "Customer: " + currentTransaction.customer_name + "\n"
      }

      receiptText += LINE

      // Items
      for (const item of currentTransaction.items) {
        receiptText += item.service.name + "\n"
        const qtyLabel = `${item.quantity} x Rp ${formatRupiah(item.service.price.toString())}`
        const totalLabel = `Rp ${formatRupiah((item.service.price * item.quantity).toString())}`
        receiptText += padLR(qtyLabel, totalLabel) + "\n"
      }

      receiptText += LINE

      // Total
      const subtotalLabel = `Rp ${formatRupiah(currentTransaction.subtotal)}`
      receiptText += padLR('Subtotal:', subtotalLabel) + "\n"

      if (currentTransaction.discount_amount > 0) {
        const diskonLabel = `-Rp ${formatRupiah(currentTransaction.discount_amount)}`
        receiptText += padLR('Diskon:', diskonLabel) + "\n"
      }

      receiptText += BOLD_ON
      const totalLabel2 = `Rp ${formatRupiah(currentTransaction.total_amount.toString())}`
      receiptText += padLR('TOTAL:', totalLabel2) + "\n"
      receiptText += BOLD_OFF

      receiptText += `Pembayaran: ${currentTransaction.payment_method}\n`

      // Cash details for cash payment
      if (currentTransaction.payment_method === 'cash' && currentTransaction.cash_amount) {
        receiptText += padLR('Uang Diterima:', `Rp ${formatRupiah(currentTransaction.cash_amount.toString())}`) + "\n"
        receiptText += padLR('Kembalian:', `Rp ${formatRupiah((currentTransaction.change_amount || 0).toString())}`) + "\n"
      }

      receiptText += LINE

      // Footer — wrap to fit 32 chars
      receiptText += ALIGN_CENTER
      const footerRaw = receiptTemplate?.footer_text || 'Terima kasih & sampai jumpa!'
      receiptText += wrapBT(footerRaw) + "\n"

      receiptText += "\n\n\n" // Add spacing before cut
      receiptText += CUT // Cut paper

      // Send to printer in chunks (BLE max per-packet is typically 20 bytes)
      const data = encoder.encode(receiptText)
      const CHUNK_SIZE = 20
      const sendChunked = async (characteristic: BluetoothRemoteGATTCharacteristic, buffer: Uint8Array) => {
        for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
          const chunk = buffer.slice(offset, offset + CHUNK_SIZE)
          if (characteristic.properties.writeWithoutResponse) {
            await characteristic.writeValueWithoutResponse(chunk)
          } else {
            await characteristic.writeValue(chunk)
          }
          // Small delay between chunks to avoid overflowing printer buffer
          await new Promise(resolve => setTimeout(resolve, 30))
        }
      }
      await sendChunked(writeCharacteristic, data)

      toast.dismiss("bluetooth-print")
      const deviceName = (bluetoothDevice || bluetoothDeviceRef.current)?.name || "Printer"
      toast.success("Print via Bluetooth Berhasil! 🖨️", {
        description: `Struk berhasil dicetak ke printer thermal ${deviceName}`,
        duration: 5000,
      })
    } catch (error) {
      console.error("Gagal mencetak via Bluetooth:", error)
      toast.dismiss("bluetooth-print")
      toast.error("Gagal Print via Bluetooth", {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setTimeout(() => setIsPrinting(false), 1000)
    }
  }

  // Filter services: active status, type, and category
  const filteredServices = services.filter(service => {
    // Must be active (aktif field, or fallback check)
    if (service.aktif === false) return false;

    // Filter by type
    if (selectedType !== "all" && service.type !== selectedType) return false;

    // Filter by category
    if (selectedCategory !== "semua" && service.service_categories?.name !== selectedCategory) return false;

    return true;
  })

  const formatPrice = (price: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price)

  const addToCart = (service: ServiceWithCategory) => {
    // Check stock for products
    if (service.type === "product") {
      const branch = branches.find(b => b.name === selectedBranch);
      if (branch) {
        const stockItem = outletStock.find(os => os.service_id === service.id && os.outlet_id === branch.id);
        const inCart = cart.find(item => item.service.id === service.id)?.quantity || 0;
        const availableStock = stockItem?.stock_quantity || 0;

        if (inCart >= availableStock) {
          toast.error("Stok Tidak Cukup", {
            description: `Stok ${service.name} tidak mencukupi`,
          })
          return;
        }
      }
    }

    setCart(prev => {
      const existing = prev.find(item => item.service.id === service.id)
      if (existing) {
        return prev.map(item => item.service.id === service.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { service, quantity: 1 }]
    })
    setIsCartOpen(true)
    toast.success("Berhasil Ditambahkan", {
      description: `${service.name} telah ditambahkan ke keranjang`,
    })
  }

  const updateQuantity = (serviceId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(serviceId)
      return
    }

    const service = services.find(s => s.id === serviceId)
    if (service?.type === 'product') {
      const branch = branches.find(b => b.name === selectedBranch);
      if (branch) {
        const stockItem = outletStock.find(os => os.service_id === serviceId && os.outlet_id === branch.id);
        const availableStock = stockItem?.stock_quantity || 0;

        if (newQuantity > availableStock) {
          toast.error('Stok Tidak Cukup', {
            description: `Stok tersedia hanya ${availableStock} item`,
          })
          return
        }
      }
    }

    setCart(prev => prev.map(item => item.service.id === serviceId ? { ...item, quantity: newQuantity } : item))
    toast.success('Jumlah Diperbarui', {
      description: `Jumlah ${service?.name || 'item'} berhasil diubah`,
    })
  }

  const removeFromCart = (serviceId: string) => {
    const item = cart.find(i => i.service.id === serviceId)
    setCart(prev => prev.filter(item => item.service.id !== serviceId))
    toast.success("Item Dihapus", {
      description: `${item?.service.name || 'Item'} telah dihapus dari keranjang`,
    })
  }

  const getTotalPrice = () => cart.reduce((total, item) => total + item.service.price * item.quantity, 0)
  const getTotalDuration = () => cart.reduce((total, item) => total + (item.service.duration || 0) * item.quantity, 0)

  const getDiscountAmount = () => {
    const subtotal = getTotalPrice()
    if (!discountValue) return 0

    const discount = discountType === "percentage"
      ? (subtotal * parseFloat(discountValue)) / 100
      : parseNominal(discountValue)

    return Math.min(discount, subtotal)
  }

  const getFinalTotal = () => Math.max(0, getTotalPrice() - getDiscountAmount())

  const formatRupiah = (value: string | number) => {
    const stringValue = typeof value === 'number' ? value.toString() : value
    const number = stringValue.replace(/\D/g, "")
    return number ? parseInt(number).toLocaleString("id-ID") : ""
  }

  const parseRupiah = (value: string) => {
    return parseInt(value.replace(/\D/g, "") || "0")
  }

  const handleCashAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCashAmount(formatRupiah(value))
    const numericValue = parseRupiah(value)
    const finalTotal = getFinalTotal()
    // Allow negative to show warning, not capped at 0
    setChangeAmount(numericValue - finalTotal)
  }

  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedBranch || !currentUser?.id || !servingEmployee) {
      toast.error("Data Tidak Lengkap", {
        description: "Pastikan keranjang tidak kosong dan karyawan yang melayani sudah dipilih.",
      })
      return
    }

    // Validate stock for ALL products before checkout
    const selectedBranchData = branches.find(b => b.name === selectedBranch);
    if (selectedBranchData) {
      for (const item of cart) {
        if (item.service.type === "product") {
          const stockItem = outletStock.find(os => os.service_id === item.service.id && os.outlet_id === selectedBranchData.id);
          const availableStock = stockItem?.stock_quantity || 0;

          if (item.quantity > availableStock) {
            toast.error("Stok Tidak Cukup!", {
              description: `${item.service.name} - Stok tersedia: ${availableStock}, Diminta: ${item.quantity}. Silakan kurangi jumlah atau hapus dari keranjang.`,
              duration: 6000,
            });
            return;
          }

          if (availableStock <= 0) {
            toast.error("Produk Habis!", {
              description: `${item.service.name} sudah habis. Silakan hapus dari keranjang.`,
              duration: 6000,
            });
            return;
          }
        }
      }
    }

    // Validate cash payment - cash amount is REQUIRED for cash payment
    if (paymentMethod === "cash") {
      if (!cashAmount || cashAmount.trim() === "") {
        toast.error("Input Uang Tunai Wajib!", {
          description: "Silakan input jumlah uang yang diterima dari pelanggan.",
          duration: 5000,
        })
        return
      }

      const numericCashAmount = parseRupiah(cashAmount)
      const finalTotal = getFinalTotal()

      if (numericCashAmount < finalTotal) {
        toast.error("Uang Tidak Cukup!", {
          description: `Uang yang diterima kurang Rp ${(finalTotal - numericCashAmount).toLocaleString("id-ID")}. Silakan input ulang nominal yang sesuai.`,
          duration: 5000,
        })
        return
      }
    }

    toast.loading("Memproses Transaksi...", {
      description: "Mohon tunggu sebentar",
      id: "checkout-loading",
    })

    setIsProcessing(true)
    try {
      const selectedBranchData = branches.find(b => b.name === selectedBranch)
      if (!selectedBranchData?.id) throw new Error("Data cabang tidak ditemukan")

      // Transaction number will be auto-generated by database
      const selectedEmployee = employees.find(e => String(e.id) === String(servingEmployee))
      const transactionData = {
        branch_id: selectedBranchData.id,
        branch_name: selectedBranchData.name,
        // Yg melayani (server) diset sekalian sebagai kasir (cashier)
        cashier_id: servingEmployee ? parseInt(servingEmployee) : currentUser.id,
        cashier_name: selectedEmployee?.name || currentUser.name || currentUser.email || 'Admin',
        server_id: servingEmployee ? parseInt(servingEmployee) : undefined,
        server_name: selectedEmployee?.name || undefined,
        subtotal: getTotalPrice(),
        discount_amount: getDiscountAmount(),
        total_amount: getFinalTotal(),
        payment_method: paymentMethod,
        customer_name: customerName || undefined,
        notes: discountReason || undefined,
      }

      const { data: savedTransaction, error: transactionError } = await createTransaction(transactionData)
      if (transactionError || !savedTransaction) throw new Error(`Gagal menyimpan transaksi: ${transactionError?.message}`)

      const transactionItemsWithCommission = await Promise.all(
        cart.map(async (item) => {
          let commissionData: {
            commission_status: string
            commission_type: string | undefined
            commission_value: number | undefined
            commission_amount: number
          } = {
            commission_status: 'no_commission',
            commission_type: undefined,
            commission_value: undefined,
            commission_amount: 0,
          }

          if (item.service.type === 'service' || item.service.type === 'product') {
            console.log('🔍 Checking commission for:', {
              service_id: item.service.id,
              service_name: item.service.name,
              user_id: servingEmployee,
              employee_name: employees.find(e => e.id === servingEmployee)?.name
            });

            const { data: rule, error: ruleError } = await supabase
              .from('commission_rules')
              .select('commission_type, commission_value')
              .eq('service_id', item.service.id)
              .eq('user_id', servingEmployee)
              .limit(1)
              .maybeSingle()

            console.log('📋 Commission rule result:', { rule, ruleError });

            if (rule) {
              const price = item.service.price
              const commissionAmount = rule.commission_type === 'percentage'
                ? price * (Number(rule.commission_value) / 100)
                : Number(rule.commission_value)

              commissionData = {
                commission_status: 'credited',
                commission_type: rule.commission_type ?? undefined,
                commission_value: Number(rule.commission_value),
                commission_amount: commissionAmount * item.quantity,
              }

              console.log('✅ Commission applied:', commissionData);
            } else {
              commissionData.commission_status = item.service.type === 'service' ? 'pending_rule' : 'no_commission'
              console.log('⚠️ No commission rule found - status set to', commissionData.commission_status);
            }
          }

          return {
            transaction_id: savedTransaction.id,
            service_id: parseInt(item.service.id), // Convert to INTEGER
            service_name: item.service.name,
            service_type: item.service.type,
            service_category: (item.service as any).category || undefined,
            quantity: item.quantity,
            unit_price: item.service.price,
            cost_price: item.service.type === 'product' ? Number(item.service.cost_price || 0) : 0,
            total_price: item.service.price * item.quantity,
            // Convert barber_id to INTEGER if exists
            barber_id: servingEmployee ? parseInt(servingEmployee) : undefined,
            ...commissionData,
          }
        })
      )

      await createTransactionItems(transactionItemsWithCommission)

      // Reduce stock for products
      for (const item of cart) {
        if (item.service.type === "product") {
          await reduceOutletStock(selectedBranchData.id, item.service.id, item.quantity)
        }
      }

      setCurrentTransaction({
        ...savedTransaction,
        items: cart,
        employeeName: employees.find(e => String(e.id) === String(servingEmployee))?.name || currentUser?.name || "Unknown",
        barberName: employees.find(e => String(e.id) === String(servingEmployee))?.name || null,
        timestamp: new Date().toLocaleString("id-ID"),
        discount_amount: getDiscountAmount(),
        discount_reason: discountReason,
        discount_type: discountType,
        // Cash info for receipt display only (not saved to database)
        cash_amount: paymentMethod === "cash" && cashAmount ? parseRupiah(cashAmount) : null,
        change_amount: paymentMethod === "cash" && cashAmount ? changeAmount : null
      })

      // 🔥 BROADCAST EVENT KE SEMUA KOMPONEN
      await broadcastTransactionEvent('transaction_created', {
        transaction_id: savedTransaction.id,
        branch_id: selectedBranchData.id,
        subtotal: savedTransaction.subtotal
      })

      setIsCheckoutOpen(false)
      setIsReceiptOpen(true)
      setCart([])
      setCustomerName("")
      setServingEmployee("")
      setDiscountValue("")
      setDiscountReason("")
      setDiscountType("percentage")
      setIsCartOpen(false)
      setCashAmount("")
      setChangeAmount(0)

      toast.dismiss("checkout-loading")
      toast.success("Transaksi Berhasil! 🎉", {
        description: `Transaksi #${savedTransaction.receipt_number} berhasil diproses`,
        duration: 5000,
      })
      loadServicesData()
      loadOutletStock(selectedBranchData.id)

    } catch (error) {
      console.error("Checkout error:", error)
      toast.dismiss("checkout-loading")
      toast.error("Gagal Memproses Transaksi", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg">Memuat data sistem...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Header POS - STICKY di desktop, SCROLL di mobile */}
      <div className="bg-white border-b p-2 md:p-4 lg:sticky lg:top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="hidden md:block">
              <h1 className="text-xl md:text-2xl font-bold">Point of Sale</h1>
              <p className="text-muted-foreground text-sm md:text-base">Pigtown Barbershop</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-32 md:w-48 text-xs md:text-sm">
                  <SelectValue placeholder="Pilih Cabang" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.name} className="text-xs md:text-sm">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className={`gap-1 md:gap-2 text-xs md:text-sm ${bluetoothConnected ? "text-blue-600 border-blue-600" : ""}`}
                onClick={() => {
                  setIsBluetoothOpen(true)
                  setBluetoothError(null)
                }}
              >
                <Bluetooth className="h-3 w-3 md:h-4 md:w-4" />
                {bluetoothConnected ? "Terhubung" : "Printer"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Services Grid */}
        <div className="flex-1 overflow-auto p-3 md:p-4">
          <div className="max-w-7xl mx-auto w-full">
            {/* Filter Tipe */}
            <div className="mb-3 flex gap-2">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                className={`flex-1 ${selectedType === "all" ? "" : "bg-transparent"}`}
                onClick={() => {
                  setSelectedType("all")
                  setSelectedCategory("semua")
                }}
              >
                Semua Menu
              </Button>
              <Button
                variant={selectedType === "service" ? "default" : "outline"}
                className={`flex-1 gap-2 ${selectedType === "service" ? "" : "bg-transparent"}`}
                onClick={() => {
                  setSelectedType("service")
                  setSelectedCategory("semua")
                }}
              >
                <Scissors className="h-4 w-4" />
                Layanan
              </Button>
              <Button
                variant={selectedType === "product" ? "default" : "outline"}
                className={`flex-1 gap-2 ${selectedType === "product" ? "" : "bg-transparent"}`}
                onClick={() => {
                  setSelectedType("product")
                  setSelectedCategory("semua")
                }}
              >
                <Package className="h-4 w-4" />
                Produk
              </Button>
            </div>

            {/* Filter Kategori */}
            <div className="flex gap-2 overflow-x-auto pb-3 md:pb-4 scrollbar-hide">
              <Button
                variant={selectedCategory === "semua" ? "default" : "outline"}
                className={`flex items-center gap-1.5 md:gap-2 whitespace-nowrap text-xs md:text-sm h-9 md:h-10 px-3 md:px-4 ${selectedCategory === "semua" ? "" : "bg-transparent"}`}
                onClick={() => setSelectedCategory("semua")}
              >
                <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Semua Kategori
              </Button>
              {/* Filter categories based on selected type */}
              {categories
                .filter((category, index, self) => {
                  // Remove duplicates
                  const isDuplicate = index !== self.findIndex((c) => c.name === category.name);
                  if (isDuplicate) return false;

                  // Filter by type
                  if (selectedType !== "all" && category.type !== selectedType) return false;

                  return true;
                })
                .map((category) => {
                  const IconComponent = categoryIcons[category.name as keyof typeof categoryIcons] || Scissors
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.name ? "default" : "outline"}
                      className={`flex items-center gap-1.5 md:gap-2 whitespace-nowrap text-xs md:text-sm h-9 md:h-10 px-3 md:px-4 ${selectedCategory === category.name ? "" : "bg-transparent"}`}
                      onClick={() => setSelectedCategory(category.name)}
                    >
                      <IconComponent className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {category.name}
                    </Button>
                  )
                })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3 md:mt-4">
              {filteredServices.map((service) => {
                const categoryName = service.service_categories?.name || "Lainnya"
                const IconComponent = categoryIcons[categoryName as keyof typeof categoryIcons] || Scissors
                const branch = branches.find(b => b.name === selectedBranch);
                const stockItem = branch ? outletStock.find(os => os.service_id === service.id && os.outlet_id === branch.id) : null;
                const availableStock = stockItem?.stock_quantity ?? (service.type === "product" ? (service.stock ?? 0) : 999);
                const minStock = stockItem?.min_stock_threshold || 5;
                const isOutOfStock = service.type === "product" && availableStock <= 0;

                return (
                  <div
                    key={service.id}
                    className={`group relative flex flex-col rounded-xl overflow-hidden border bg-white shadow-sm transition-all duration-200
                      ${isOutOfStock
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-red-300"
                      }`}
                    onClick={() => { if (!isOutOfStock) addToCart(service) }}
                  >
                    {/* ── Image ── */}
                    <div className="relative w-full bg-gray-100 overflow-hidden" style={{ paddingBottom: '75%' }}>
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                          <IconComponent className="h-10 w-10 text-gray-300" />
                        </div>
                      )}

                      {/* Category badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide
                          ${service.type === "product" ? "bg-orange-500 text-white" : "bg-blue-500 text-white"}`}>
                          {service.type === "product" ? "Produk" : "Layanan"}
                        </span>
                      </div>

                      {/* Stock badge */}
                      {service.type === "product" && (
                        <div className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full
                          ${isOutOfStock ? "bg-red-500 text-white" : availableStock <= minStock ? "bg-orange-400 text-white" : "bg-green-500 text-white"}`}>
                          {isOutOfStock ? "Habis" : `Stok ${availableStock}`}
                        </div>
                      )}

                      {/* Overlay gradient bottom */}
                      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>

                    {/* ── Info ── */}
                    <div className="flex flex-col p-2.5 gap-1 flex-1">
                      <h3 className="text-xs font-bold text-gray-800 leading-tight line-clamp-2 uppercase tracking-wide">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-[10px] text-gray-400 line-clamp-1">{service.description}</p>
                      )}

                      <div className="mt-auto pt-1.5 flex items-center justify-between gap-1">
                        <span className="text-sm font-extrabold text-red-600 leading-none">
                          {formatPrice(service.price)}
                        </span>
                        {service.duration ? (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />{service.duration}m
                          </span>
                        ) : null}
                      </div>

                      <button
                        disabled={isOutOfStock}
                        onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) addToCart(service) }}
                        className={`mt-1 w-full h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors
                          ${isOutOfStock
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white"}`}
                      >
                        {isOutOfStock ? (
                          <span>Habis</span>
                        ) : (
                          <><Plus className="h-3.5 w-3.5" /><span>Tambah</span></>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6">
          <Button
            onClick={() => setIsCartOpen(true)}
            className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg relative"
            size="icon"
          >
            <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center text-xs">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md md:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Keranjang
            </DialogTitle>
            <DialogDescription>
              {cart.length} item{cart.length !== 1 ? "s" : ""} • {getTotalDuration()} menit
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Customer Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Nama Pelanggan (Opsional)</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer"
                    placeholder="Masukkan nama pelanggan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serving-employee">Karyawan yang Melayani</Label>
                <Select value={servingEmployee} onValueChange={setServingEmployee}>
                  <SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Discount Section */}
            <div className="space-y-3">
              <Label>Diskon</Label>
              <div className="flex gap-2">
                <Select value={discountType} onValueChange={(value: "percentage" | "fixed") => setDiscountType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" /> %
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Rp
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder={discountType === "percentage" ? "0-100%" : "Nominal diskon"}
                  value={discountValue}
                  onChange={(e) => {
                    if (discountType === "percentage") {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
                        setDiscountValue(value)
                      }
                    } else {
                      setDiscountValue(formatRupiah(e.target.value))
                    }
                  }}
                />
              </div>

              {discountValue && (
                <Input
                  placeholder="Alasan diskon (opsional)"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                />
              )}
            </div>

            <Separator />

            {/* Cart Items */}
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mb-2" />
                  <p>Keranjang masih kosong</p>
                </div>
              ) : (
                cart.map((item) => {
                  const branch = branches.find(b => b.name === selectedBranch);
                  const stockItem = branch ? outletStock.find(os => os.service_id === item.service.id && os.outlet_id === branch.id) : null;
                  const availableStock = stockItem?.stock_quantity || 0;
                  const isOutOfStock = item.service.type === "product" && availableStock <= 0;
                  const isOverStock = item.service.type === "product" && item.quantity > availableStock;

                  return (
                    <div key={item.service.id} className={`flex items-center justify-between p-2 border rounded-lg ${isOutOfStock || isOverStock ? 'border-red-500 bg-red-50' : ''}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{item.service.name}</p>
                          {item.service.type === "product" && (
                            <span className="text-xs text-gray-500">Stok: {availableStock}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatPrice(item.service.price)} x {item.quantity}</p>
                        {isOutOfStock && (
                          <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3" /> Stok habis!
                          </p>
                        )}
                        {isOverStock && !isOutOfStock && (
                          <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3" /> Stok tidak cukup! (Maks: {availableStock})
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.service.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                            disabled={item.service.type === "product" && item.quantity >= availableStock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => removeFromCart(item.service.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Summary */}
            {cart.length > 0 && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>

                {getDiscountAmount() > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Diskon:</span>
                    <span>-{formatPrice(getDiscountAmount())}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-bold">
                  <span>Total Bayar:</span>
                  <span className="text-primary">{formatPrice(getFinalTotal())}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCartOpen(false)} className="flex-1">
              Tutup
            </Button>
            <Button
              onClick={() => {
                // Check stock issues before opening checkout
                const branch = branches.find(b => b.name === selectedBranch);
                if (branch) {
                  const hasStockIssue = cart.some(item => {
                    if (item.service.type === "product") {
                      const stockItem = outletStock.find(os => os.service_id === item.service.id && os.outlet_id === branch.id);
                      const availableStock = stockItem?.stock_quantity || 0;
                      return item.quantity > availableStock || availableStock <= 0;
                    }
                    return false;
                  });

                  if (hasStockIssue) {
                    toast.error("Periksa Stok!", {
                      description: "Ada produk dengan stok tidak mencukupi. Silakan sesuaikan jumlah atau hapus dari keranjang.",
                      duration: 5000,
                    });
                    return;
                  }
                }

                setIsCartOpen(false)
                setIsCheckoutOpen(true)
              }}
              disabled={cart.length === 0 || !servingEmployee}
              className="flex-1 gap-2"
            >
              <CreditCard className="h-4 w-4" /> Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Pembayaran
            </DialogTitle>
            <DialogDescription>Pilih metode pembayaran dan selesaikan transaksi.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2"><Banknote className="h-4 w-4" />Tunai</div>
                  </SelectItem>
                  <SelectItem value="debit">
                    <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Kartu Debit</div>
                  </SelectItem>
                  <SelectItem value="qris">
                    <div className="flex items-center gap-2"><QrCode className="h-4 w-4" />QRIS</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cash Input for Cash Payment */}
            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Uang Diterima</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const exactAmount = getFinalTotal()
                      setCashAmount(formatRupiah(exactAmount.toString()))
                      setChangeAmount(0)
                    }}
                    className="text-xs h-7 px-2 font-bold text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    PASS BROO!!!
                  </Button>
                </div>
                <Input
                  type="text"
                  placeholder="Rp 0"
                  value={cashAmount}
                  onChange={handleCashAmountChange}
                  className="text-right font-mono"
                />
                {changeAmount > 0 && (
                  <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-center">
                      <span>Kembalian:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {formatPrice(changeAmount)}
                      </span>
                    </div>
                  </div>
                )}
                {changeAmount < 0 && cashAmount && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Uang yang diterima kurang dari total pembayaran
                  </div>
                )}
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>

              {getDiscountAmount() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Diskon:</span>
                  <span>-{formatPrice(getDiscountAmount())}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-bold">
                <span>Total Bayar:</span>
                <span className="text-primary">{formatPrice(getFinalTotal())}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCheckout} disabled={isProcessing} className="flex-1 gap-2">
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isProcessing ? "Memproses..." : "Bayar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md">
          {/* Print CSS */}
          <style>{`
            @media print {
              @page {
                size: ${receiptTemplate?.paper_width || 80}mm auto;
                margin: 0;
              }
              
              /* Reset body and html */
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: ${receiptTemplate?.paper_width || 80}mm !important;
                height: auto !important;
              }
              
              /* Hide everything except our receipt */
              body > *:not([data-print-root]) {
                display: none !important;
              }
              
              /* Make sure receipt container is visible */
              [data-print-root] {
                display: block !important;
                position: relative !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              /* Style the receipt */
              #receipt-print {
                display: block !important;
                width: ${receiptTemplate?.paper_width || 80}mm !important;
                max-width: ${receiptTemplate?.paper_width || 80}mm !important;
                margin: 0 !important;
                padding: ${receiptTemplate?.paper_width === 58 ? '2mm' : '3mm'} !important;
                background: white !important;
                color: black !important;
                font-family: 'Courier New', monospace !important;
                font-size: ${receiptTemplate?.paper_width === 58 ? '8px' : '9px'} !important;
                line-height: 1.3 !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }
              
              /* Hide print button and dialog chrome */
              .print\\:hidden,
              button,
              [role="dialog"] > div:first-child,
              h2, 
              p:has(+ [data-print-root]) {
                display: none !important;
              }
            }
          `}</style>

          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Struk Pembayaran
            </DialogTitle>
            <DialogDescription>Transaksi berhasil diproses.</DialogDescription>
          </DialogHeader>

          {currentTransaction && (
            <div className="space-y-4">
              {/* Container for print */}
              <div data-print-root>
                {/* Receipt - visible on both screen and print */}
                <div
                  className="bg-white p-3 border rounded-lg text-black print:p-0 print:border-0 print:rounded-none"
                  id="receipt-print"
                >
                  {/* Header */}
                  <div className="text-center mb-2">
                    {/* Tampilkan logo jika show_logo aktif ATAU jika logo_url tersedia */}
                    {((receiptTemplate?.show_logo ?? false) || !!(receiptTemplate?.logo_url)) && receiptTemplate?.logo_url && (
                      <img src={receiptTemplate.logo_url} alt="Logo" className="h-10 w-auto mx-auto mb-2" />
                    )}
                    {receiptTemplate?.header_text ? (
                      <div className="whitespace-pre-line font-bold text-xs">{receiptTemplate.header_text}</div>
                    ) : (
                      <div className="font-bold text-sm">PIGTOWN BARBERSHOP</div>
                    )}
                    {(receiptTemplate?.show_address ?? true) && branchInfo?.address && (
                      <div className="text-[10px] mt-1">{branchInfo.address}</div>
                    )}
                    {(receiptTemplate?.show_phone ?? true) && branchInfo?.phone && (
                      <div className="text-[10px]">Telp: {branchInfo.phone}</div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Info */}
                  <div className="text-[10px] space-y-0.5">
                    {(receiptTemplate?.show_date ?? true) && (
                      <div>Tanggal: {currentTransaction.timestamp}</div>
                    )}
                    <div>No: {currentTransaction.receipt_number}</div>
                    {(receiptTemplate?.show_barber ?? true) && currentTransaction.barberName && (
                      <div>Kasir/Capster: {currentTransaction.barberName}</div>
                    )}
                    {(receiptTemplate?.show_customer ?? true) && currentTransaction.customer_name && (
                      <div>Customer: {currentTransaction.customer_name}</div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Items */}
                  <div className="space-y-1">
                    {currentTransaction.items.map((item: any, index: number) => (
                      <div key={index} className="text-[10px]">
                        <div className="font-medium">{item.service.name}</div>
                        <div className="flex justify-between">
                          <span>{item.quantity} x Rp {formatRupiah(item.service.price.toString())}</span>
                          <span>Rp {formatRupiah((item.service.price * item.quantity).toString())}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Total */}
                  <div className="text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rp {formatRupiah(currentTransaction.subtotal)}</span>
                    </div>
                    {currentTransaction.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Diskon:</span>
                        <span>-Rp {formatRupiah(currentTransaction.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs pt-1 mt-1 border-t border-gray-300">
                      <span>TOTAL:</span>
                      <span>Rp {formatRupiah(currentTransaction.total_amount)}</span>
                    </div>
                    <div className="mt-1">Pembayaran: {currentTransaction.payment_method}</div>
                    {currentTransaction.payment_method === 'cash' && currentTransaction.cash_amount && (
                      <>
                        <div className="flex justify-between mt-0.5">
                          <span>Uang Diterima:</span>
                          <span>Rp {formatRupiah(currentTransaction.cash_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kembalian:</span>
                          <span>Rp {formatRupiah(currentTransaction.change_amount || 0)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Footer */}
                  <div className="text-center text-[10px]">
                    {receiptTemplate?.footer_text ? (
                      <div className="whitespace-pre-line">{receiptTemplate.footer_text}</div>
                    ) : (
                      <div>Terima kasih atas kunjungan Anda!</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 print:hidden">
                <Button variant="outline" onClick={() => setIsReceiptOpen(false)} className="flex-1">
                  Tutup
                </Button>
                <Button
                  onClick={bluetoothConnected ? handlePrintViaBluetooth : handlePrint}
                  disabled={isPrinting}
                  className="flex-1 gap-2"
                >
                  <Printer className="h-4 w-4" />
                  {isPrinting ? "Mencetak..." : (bluetoothConnected ? "Print via Bluetooth" : "Print Struk")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bluetooth Dialog */}
      <Dialog open={isBluetoothOpen} onOpenChange={setIsBluetoothOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bluetooth className="h-5 w-5" /> Hubungkan Printer Bluetooth
            </DialogTitle>
            <DialogDescription>Pindai dan hubungkan ke printer struk termal Anda.</DialogDescription>
          </DialogHeader>

          {bluetoothError && (
            <div className="p-3 my-2 bg-red-100 text-red-800 text-sm rounded-lg text-center" role="alert">
              {bluetoothError}
            </div>
          )}

          <div className="space-y-4 text-center">
            {bluetoothConnected && bluetoothDevice ? (
              <div className="p-4 bg-green-100 rounded-lg text-green-800">
                <p className="font-semibold">Terhubung ke:</p>
                <p>{bluetoothDevice.name}</p>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 rounded-lg text-gray-600">
                <p>Belum ada printer yang terhubung.</p>
              </div>
            )}

            <Button onClick={handleScanAndConnect} disabled={bluetoothConnected} className="w-full gap-2">
              Cari & Hubungkan Printer
            </Button>

            <Button onClick={handleDisconnectBluetooth} disabled={!bluetoothConnected} variant="outline" className="w-full">
              Putuskan Koneksi
            </Button>

            <Button onClick={handleForgetCurrentPrinter} disabled={!bluetoothConnected} variant="destructive" className="w-full">
              Lupakan Printer Ini & Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}