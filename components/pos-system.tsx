"use client"

import { useState, useEffect, useCallback } from "react"
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
  type ReceiptTemplateWithBranch,
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
  const [cart, setCart] = useState < CartItem[] > ([])
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
  const [currentTransaction, setCurrentTransaction] = useState < any | null > (null)
  const [discountType, setDiscountType] = useState < "percentage" | "fixed" > ("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [services, setServices] = useState < ServiceWithCategory[] > ([])
  const [categories, setCategories] = useState < any[] > ([])
  const [branches, setBranches] = useState < Branch[] > ([])
  const [employees, setEmployees] = useState < any[] > ([])
  const [currentUser, setCurrentUser] = useState < any | null > (null)
  const [receiptTemplate, setReceiptTemplate] = useState < ReceiptTemplateWithBranch | null > (null)
  const [branchInfo, setBranchInfo] = useState < any > (null)
  const [loading, setLoading] = useState(true)
  const [isBluetoothOpen, setIsBluetoothOpen] = useState(false)
  const [bluetoothConnected, setBluetoothConnected] = useState(false)
  const [bluetoothDevice, setBluetoothDevice] = useState < BluetoothDevice | null > (null)
  const [bluetoothCharacteristic, setBluetoothCharacteristic] = useState < BluetoothRemoteGATTCharacteristic | null > (null)
  const [bluetoothError, setBluetoothError] = useState < string | null > (null)
  const [outletStock, setOutletStock] = useState < OutletStock[] > ([])
  const [stockLoading, setStockLoading] = useState(false)

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

  const loadBranchAndTemplateData = useCallback(async () => {
    const { data: templateData, error: templateError } = await getActiveReceiptTemplate()
    if (templateError) console.error("Error loading receipt template:", templateError)
    else setReceiptTemplate(templateData)

    const { data: branchData, error: branchError } = await supabase.from("branches").select("*").limit(1).single()
    if (branchError) console.error("Error loading branch data:", branchError)
    else setBranchInfo(branchData)
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
    const eventsChannel = subscribeToEvents((event, payload) => {
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
      }
    }
  }, [selectedBranch, branches, loadOutletStock])

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
    if (bluetoothDevice && bluetoothDevice.gatt?.connected) {
      bluetoothDevice.gatt.disconnect()
    }
    setBluetoothConnected(false)
    setBluetoothDevice(null)
    setBluetoothCharacteristic(null)
  }

  const handleScanAndConnect = async () => {
    setBluetoothError(null)

    // Cek compatibility
    if (!navigator.bluetooth) {
      setBluetoothError("Browser Anda tidak mendukung Bluetooth. Gunakan Chrome atau Edge.");
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'generic_attribute']
      })

      setBluetoothError(null)
      setBluetoothDevice(device)

      const server = await device.gatt?.connect()
      setBluetoothConnected(true)

      setIsBluetoothOpen(false)
      toast.success("Berhasil Terhubung! 📱", {
        description: `Terhubung ke printer ${device.name}`,
      })

      device.addEventListener("gattserverdisconnected", () => {
        setBluetoothConnected(false)
        setBluetoothDevice(null)
        setBluetoothCharacteristic(null)
        toast.warning("Printer Terputus", {
          description: "Koneksi Bluetooth terputus",
        })
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
  
  const handlePrint = useCallback(() => {
    if (isPrinting) return
    setIsPrinting(true)

    try {
      const paperWidth = receiptTemplate?.paper_width || 80
      const fontSize = receiptTemplate?.paper_width === 58 ? '8px' : '10px'

      const buildReceiptHTML = () => {
        if (!currentTransaction) return '<div>Tidak ada data transaksi</div>'

        // Default values when no template
        const showLogo = receiptTemplate?.show_logo ?? false
        const showAddress = receiptTemplate?.show_address ?? true
        const showPhone = receiptTemplate?.show_phone ?? true
        const showDate = receiptTemplate?.show_date ?? true
        const showBarber = receiptTemplate?.show_barber ?? true
        const showCustomer = receiptTemplate?.show_customer ?? true

        const headerHTML = `
          <div style="text-align:center; margin-bottom:2mm;">
            ${showLogo && receiptTemplate?.logo_url ? `<img src="${receiptTemplate.logo_url}" alt="Logo" style="height:${receiptTemplate?.logo_height || 40}px; width:auto; margin:0 auto 2mm; display:block;" />` : ''}
            ${receiptTemplate?.header_text
              ? `<div style="white-space:pre-line; font-weight:700; font-size:${paperWidth===58?'9px':'11px'};">${receiptTemplate.header_text}</div>`
              : `<div style="font-weight:700; font-size:${paperWidth===58?'10px':'12px'};">PIGTOWN BARBERSHOP</div>`}
            ${showAddress && branchInfo?.address ? `<div style="font-size:${paperWidth===58?'7px':'9px'}; margin-top:1mm;">${branchInfo.address}</div>` : ''}
            ${showPhone && branchInfo?.phone ? `<div style="font-size:${paperWidth===58?'7px':'9px'};">Telp: ${branchInfo.phone}</div>` : ''}
          </div>`

        const infoHTML = `
          <div style="border-top:1px dashed #000; margin:2mm 0"></div>
          <div style="font-size:${paperWidth===58?'8px':'9px'};">
            ${showDate ? `<div>Tanggal: ${currentTransaction.timestamp}</div>` : ''}
            <div>No: ${currentTransaction.receipt_number}</div>
            ${showBarber ? `<div>Kasir: ${currentTransaction.employeeName}</div>` : ''}
            ${showCustomer && currentTransaction.customer_name ? `<div>Customer: ${currentTransaction.customer_name}</div>` : ''}
          </div>
          <div style="border-top:1px dashed #000; margin:2mm 0"></div>`

        const itemsHTML = currentTransaction.items.map((item:any) => {
          const left = `${item.quantity} x Rp ${formatRupiah(item.service.price.toString())}`
          const right = `Rp ${formatRupiah((item.service.price * item.quantity).toString())}`
          return `
            <div style="font-size:${paperWidth===58?'8px':'9px'}; margin-bottom:1mm;">
              <div style="font-weight:600">${item.service.name}</div>
              <div style="display:flex; justify-content:space-between;">
                <span>${left}</span>
                <span>${right}</span>
              </div>
            </div>`
        }).join('')

        const totalsHTML = `
          <div style="border-top:1px dashed #000; margin:2mm 0"></div>
          <div style="font-size:${paperWidth===58?'8px':'9px'};">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5mm;">
              <span>Subtotal:</span>
              <span>Rp ${formatRupiah(currentTransaction.total_amount)}</span>
            </div>
            ${currentTransaction.discount_amount>0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:0.5mm;"><span>Diskon:</span><span>-Rp ${formatRupiah(currentTransaction.discount_amount)}</span></div>` : ''}
            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:${paperWidth===58?'10px':'11px'}; margin-top:1mm; padding-top:1mm; border-top:1px solid #ddd;">
              <span>TOTAL:</span>
              <span>Rp ${formatRupiah(currentTransaction.final_amount.toString())}</span>
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

        const footerHTML = `
          <div style="text-align:center; font-size:${paperWidth===58?'8px':'9px'};">
            ${receiptTemplate?.footer_text ? `<div style="white-space:pre-line">${receiptTemplate.footer_text}</div>` : '<div>Terima kasih atas kunjungan Anda!</div>'}
          </div>`

        return headerHTML + infoHTML + itemsHTML + totalsHTML + footerHTML
      }

      const styles = `
        @page { size: ${paperWidth}mm auto; margin: 0; }
        html, body { width: ${paperWidth}mm; margin: 0; padding: 0; }
        body { background: #fff; color: #000; font-family: 'Courier New', monospace; font-size: ${fontSize}; line-height: 1.3; }
        #root { width: ${paperWidth}mm; margin: 0; padding: ${paperWidth===58?'2mm':'3mm'}; }
        img { max-width: 100%; }
        .divider { border-top: 1px dashed #000; margin: 2mm 0; }
      `

      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Struk Pembayaran</title><style>${styles}</style></head><body><div id="root">${buildReceiptHTML()}</div></body></html>`

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

      setTimeout(() => {
        win.print()
        win.close()
        toast.success("Print via Browser 🖨️", { description: "Struk berhasil dicetak menggunakan printer browser", duration: 4000 })
        setIsPrinting(false)
      }, 250)
    } catch (error) {
      console.error('Print error', error)
      toast.error("Gagal membuka print", { description: error instanceof Error ? error.message : String(error) })
      setIsPrinting(false)
    }
  }, [isPrinting, currentTransaction, receiptTemplate])

  const handlePrintViaBluetooth = async () => {
    if (!bluetoothDevice || !bluetoothDevice.gatt?.connected || !currentTransaction) {
      toast.error("Printer Tidak Siap", {
        description: "Printer Bluetooth tidak terhubung atau data transaksi tidak tersedia",
      })
      return
    }
    if (isPrinting) return
    setIsPrinting(true)
    
    toast.loading("Mencetak via Bluetooth...", {
      id: "bluetooth-print",
    })
    
    try {
      // Get GATT server and service
      const server = bluetoothDevice.gatt
      const services = await server.getPrimaryServices()
      
      // Try to find a writable characteristic
      let writeCharacteristic = null
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics()
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeCharacteristic = char
              break
            }
          }
          if (writeCharacteristic) break
        } catch (e) {
          continue
        }
      }
      
      if (!writeCharacteristic) {
        throw new Error("Tidak dapat menemukan characteristic untuk menulis data")
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
        receiptText += branchInfo.address + "\n"
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
      if (showBarber) {
        receiptText += "Kasir: " + currentTransaction.employeeName + "\n"
      }
      if (showCustomer && currentTransaction.customer_name) {
        receiptText += "Customer: " + currentTransaction.customer_name + "\n"
      }
      
      receiptText += LINE
      
      // Items
      for (const item of currentTransaction.items) {
        receiptText += item.service.name + "\n"
        receiptText += `${item.quantity} x Rp ${formatRupiah(item.service.price.toString())}`
        receiptText += " ".repeat(Math.max(0, 32 - (`${item.quantity} x Rp ${formatRupiah(item.service.price.toString())}`.length + `Rp ${formatRupiah((item.service.price * item.quantity).toString())}`.length)))
        receiptText += `Rp ${formatRupiah((item.service.price * item.quantity).toString())}\n`
      }
      
      receiptText += LINE
      
      // Total
      receiptText += `Subtotal:` + " ".repeat(Math.max(0, 32 - (`Subtotal:`.length + `Rp ${formatRupiah(currentTransaction.total_amount)}`.length)))
      receiptText += `Rp ${formatRupiah(currentTransaction.total_amount)}\n`
      
      if (currentTransaction.discount_amount > 0) {
        receiptText += `Diskon:` + " ".repeat(Math.max(0, 32 - (`Diskon:`.length + `-Rp ${formatRupiah(currentTransaction.discount_amount)}`.length)))
        receiptText += `-Rp ${formatRupiah(currentTransaction.discount_amount)}\n`
      }
      
      receiptText += BOLD_ON
      receiptText += `TOTAL:` + " ".repeat(Math.max(0, 32 - (`TOTAL:`.length + `Rp ${formatRupiah(currentTransaction.final_amount.toString())}`.length)))
      receiptText += `Rp ${formatRupiah(currentTransaction.final_amount.toString())}\n`
      receiptText += BOLD_OFF
      
      receiptText += `Pembayaran: ${currentTransaction.payment_method}\n`
      
      // Cash details for cash payment
      if (currentTransaction.payment_method === 'cash' && currentTransaction.cash_amount) {
        receiptText += `Uang Diterima: Rp ${formatRupiah(currentTransaction.cash_amount.toString())}\n`
        receiptText += `Kembalian: Rp ${formatRupiah((currentTransaction.change_amount || 0).toString())}\n`
      }
      
      receiptText += LINE
      
      // Footer
      receiptText += ALIGN_CENTER
      if (receiptTemplate?.footer_text) {
        receiptText += receiptTemplate.footer_text + "\n"
      } else {
        receiptText += "Terima kasih atas kunjungan Anda!\n"
      }
      
      receiptText += "\n\n\n" // Add spacing before cut
      receiptText += CUT // Cut paper
      
      // Send to printer
      const data = encoder.encode(receiptText)
      if (writeCharacteristic.properties.writeWithoutResponse) {
        await writeCharacteristic.writeValueWithoutResponse(data)
      } else {
        await writeCharacteristic.writeValue(data)
      }
      
      toast.dismiss("bluetooth-print")
      toast.success("Print via Bluetooth Berhasil! ��🖨️", {
        description: `Struk berhasil dicetak ke printer thermal ${bluetoothDevice.name}`,
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
    // Must be active
    if (service.status !== "active") return false;
    
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

      const transactionData = {
        receipt_number: `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
        branch_id: selectedBranchData.id,
        branch_name: selectedBranchData.name,
        cashier_id: currentUser.id,
        server_id: servingEmployee, // Karyawan yang melayani pelanggan
        total_amount: getTotalPrice(),
        discount_amount: getDiscountAmount(),
        final_amount: getFinalTotal(),
        payment_method: paymentMethod,
        customer_name: customerName || undefined,
        notes: discountReason || undefined,
      }

      const { data: savedTransaction, error: transactionError } = await createTransaction(transactionData)
      if (transactionError || !savedTransaction) throw new Error(`Gagal menyimpan transaksi: ${transactionError?.message}`)

      const transactionItemsWithCommission = await Promise.all(
        cart.map(async (item) => {
          let commissionData = {
            commission_status: 'no_commission',
            commission_type: null,
            commission_value: null,
            commission_amount: 0,
          }

          if (item.service.type === 'service') {
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
              .single()

            console.log('📋 Commission rule result:', { rule, ruleError });

            if (rule) {
              const price = item.service.price
              const commissionAmount = rule.commission_type === 'percentage'
                ? price * (Number(rule.commission_value) / 100)
                : Number(rule.commission_value)

              commissionData = {
                commission_status: 'credited',
                commission_type: rule.commission_type as any,
                commission_value: Number(rule.commission_value),
                commission_amount: commissionAmount * item.quantity,
              }
              
              console.log('✅ Commission applied:', commissionData);
            } else {
              commissionData.commission_status = 'pending_rule'
              console.log('⚠️ No commission rule found - status set to pending_rule');
            }
          }

          return {
            transaction_id: savedTransaction.id,
            service_id: item.service.id,
            quantity: item.quantity,
            unit_price: item.service.price,
            total_price: item.service.price * item.quantity,
            barber_id: item.service.type === 'service' ? servingEmployee : null,
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
        employeeName: currentUser?.name || "Unknown",
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
        total_amount: savedTransaction.total_amount
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
                className={`flex-1 ${selectedType === "service" ? "" : "bg-transparent"}`}
                onClick={() => {
                  setSelectedType("service")
                  setSelectedCategory("semua")
                }}
              >
                💈 Layanan
              </Button>
              <Button
                variant={selectedType === "product" ? "default" : "outline"}
                className={`flex-1 ${selectedType === "product" ? "" : "bg-transparent"}`}
                onClick={() => {
                  setSelectedType("product")
                  setSelectedCategory("semua")
                }}
              >
                📦 Produk
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mt-3 md:mt-4">
              {filteredServices.map((service) => {
                const categoryName = service.service_categories?.name || "Lainnya"
                const IconComponent = categoryIcons[categoryName as keyof typeof categoryIcons] || Scissors
                const branch = branches.find(b => b.name === selectedBranch);
                const stockItem = branch ? outletStock.find(os => os.service_id === service.id && os.outlet_id === branch.id) : null;
                const availableStock = stockItem?.stock_quantity || 0;
                const minStock = stockItem?.min_stock_threshold || 5;

                return (
                  <Card
                    key={service.id}
                    className={`min-h-[140px] md:min-h-[180px] flex flex-col hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20 ${service.type === "product" && availableStock <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => {
                      if (service.type === "product" && availableStock <= 0) return
                      addToCart(service)
                    }}
                  >
                    <CardHeader className="p-3 md:p-4 pb-2">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xs md:text-base font-semibold truncate">{service.name}</CardTitle>
                          <CardDescription className="text-[10px] md:text-xs line-clamp-1">{service.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0 mt-auto">
                      <div className="space-y-2">
                        <p className="text-base md:text-xl font-bold text-primary truncate">{formatPrice(service.price)}</p>
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
                          {service.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">{service.duration}m</span>
                            </div>
                          )}
                          {service.type === "product" && (
                            <div className={`flex items-center gap-1 ${availableStock <= 0 ? "text-red-500" : availableStock <= minStock ? "text-orange-500" : "text-green-600"}`}>
                              <Package className="h-3 w-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">{availableStock <= 0 ? "Habis" : `${availableStock}`}</span>
                              {availableStock <= minStock && availableStock > 0 && (
                                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="w-full gap-1 text-xs h-8"
                          disabled={service.type === "product" && availableStock <= 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (service.type === "product" && availableStock <= 0) return
                            addToCart(service)
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="truncate">{service.type === "product" && availableStock <= 0 ? "Habis" : "Tambah"}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
                        <p className="text-xs text-muted-foreground">{formatPrice(item.service.price)} × {item.quantity}</p>
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
                  {(receiptTemplate?.show_logo ?? false) && receiptTemplate?.logo_url && (
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
                  {(receiptTemplate?.show_barber ?? true) && (
                    <div>Kasir: {currentTransaction.employeeName}</div>
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
                    <span>Rp {formatRupiah(currentTransaction.total_amount)}</span>
                  </div>
                  {currentTransaction.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Diskon:</span>
                      <span>-Rp {formatRupiah(currentTransaction.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 mt-1 border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span>Rp {formatRupiah(currentTransaction.final_amount)}</span>
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