"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Edit,
  Receipt,
  Printer,
  RefreshCw,
  Trash2,
  Package,
  X,
  Check,
  MapPin,
  Store,
  Menu,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase, getOutletStock, updateOutletStock, getLowStockAlerts, type OutletStock } from "@/lib/supabase"
import { Switch } from "@/components/ui/switch"

const formatNominal = (value: string | number): string => {
  if (!value && value !== 0) return "";
  const stringValue = String(value).replace(/[^0-9]/g, '');
  if (stringValue === "" || stringValue === "0") return "";
  return new Intl.NumberFormat('id-ID').format(parseInt(stringValue, 10));
};

const parseNominal = (value: string): number => {
  if (!value) return 0;
  return parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
};

interface MenuCategory {
  id: string
  name: string
  description?: string
  icon: string
  type: "service" | "product"
  status: "active" | "inactive"
  sort_order: number
  created_at: string
  itemCount?: number
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  category_id: string
  type: "service" | "product"
  duration?: number
  stock?: number
  status: "active" | "inactive"
  created_at: string
  image_url?: string
  category?: {
    name: string
    icon: string
  }
  totalOrders?: number
  totalRevenue?: number
}

interface Branch {
  id: string
  name: string
  address?: string
  phone?: string
}

interface ReceiptTemplate {
  id: string
  name: string
  header_text?: string
  footer_text?: string
  logo_url?: string
  logo_height?: number
  branch_id?: string
  is_active?: boolean
  is_default?: boolean
  paper_size?: string
  paper_width?: number
  font_size?: string
  show_logo?: boolean
  show_address?: boolean
  show_phone?: boolean
  show_date?: boolean
  show_cashier?: boolean
  show_barber?: boolean
  show_customer?: boolean
  created_at?: string
  updated_at?: string
}

interface OutletMenuSettings {
  id: string
  outlet_id: string
  menu_id: string
  custom_price?: number
  stock_quantity?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function CashierManagement() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [menuItemsLoading, setMenuItemsLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [receiptTemplates, setReceiptTemplates] = useState<ReceiptTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate | null>(null)
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const [isAddMenuItemDialogOpen, setIsAddMenuItemDialogOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const { toast } = useToast()
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateHeader, setTemplateHeader] = useState("")
  const [templateFooter, setTemplateFooter] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("")
  const [saving, setSaving] = useState(false)
  const [paperSize, setPaperSize] = useState("80mm")
  const [fontSize, setFontSize] = useState("medium")
  const [showLogo, setShowLogo] = useState(true)
  const [showAddress, setShowAddress] = useState(true)
  const [showPhone, setShowPhone] = useState(true)
  const [showDate, setShowDate] = useState(true)
  const [showCashier, setShowCashier] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [showBarber, setShowBarber] = useState(true)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // NEW STATE FOR OUTLET STOCK MANAGEMENT
  const [selectedOutlet, setSelectedOutlet] = useState("")
  const [outletStock, setOutletStock] = useState<OutletStock[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  const [lowStockAlerts, setLowStockAlerts] = useState<OutletStock[]>([])
  const [filterType, setFilterType] = useState<"all" | "service" | "product">("service")

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "",
    type: "service" as "service" | "product",
    sort_order: 0,
  })
  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    price: 0,
    cost_price: 0,
    category_id: "",
    duration: 0,
    stock: 0,
    type: "service" as "service" | "product",
    image_url: "",
  })
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null)
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null)

  // NEW FUNCTIONS FOR OUTLET STOCK MANAGEMENT
  const fetchOutletStock = async (outletId: string) => {
    if (!outletId) return;
    
    setStockLoading(true);
    try {
      const { data, error } = await getOutletStock();
      if (error) {
        console.error("Error fetching outlet stock:", error);
        toast({
          title: "Error",
          description: "Gagal memuat stok outlet",
          variant: "destructive",
        });
        return;
      }
      setOutletStock(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setStockLoading(false);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const { data, error } = await getLowStockAlerts();
      if (error) {
        console.error("Error fetching low stock alerts:", error);
        return;
      }
      setLowStockAlerts(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const handleUpdateStock = async (serviceId: string, newStock: number) => {
    try {
      const { data, error } = await updateOutletStock(serviceId, newStock);
      if (error) {
        throw error;
      }
      
      // Update local state
      setOutletStock(prev => prev.map(item => 
        item.service_id === serviceId 
          ? { ...item, stock_quantity: newStock }
          : item
      ));
      
      // Also update menuItems state so the UI reflects new stock
      setMenuItems(prev => prev.map(item =>
        item.id === serviceId
          ? { ...item, stock: newStock }
          : item
      ));

      // Refresh low stock alerts
      fetchLowStockAlerts();
      
      toast({
        title: "Berhasil",
        description: "Stok berhasil diupdate",
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Gagal mengupdate stok",
        variant: "destructive",
      });
    }
  };

  const resetTemplateForm = () => {
    setTemplateName("")
    setTemplateHeader("")
    setTemplateFooter("")
    setSelectedBranch("none")
    setPaperSize("80mm")
    setFontSize("medium")
    setShowLogo(true)
    setShowAddress(true)
    setShowPhone(true)
    setShowDate(true)
    setShowBarber(true)
    setLogoFile(null)
    setLogoPreview("")
    setEditingTemplateId(null)
  }

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const filePath = `receipt-logos/${fileName}`

      const { data, error } = await supabase.storage.from("attendance-photos").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("[v0] Error uploading logo:", error)
        return null
      }

      const { data: publicUrlData } = supabase.storage.from("attendance-photos").getPublicUrl(filePath)
      return publicUrlData?.publicUrl || null
    } catch (error) {
      console.error("[v0] Error uploading logo:", error)
      return null
    }
  }

  const uploadMenuImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `menu-${Date.now()}.${fileExt}`
      const filePath = `menu-images/${fileName}`

      const { data, error } = await supabase.storage.from("attendance-photos").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("[v0] Error uploading menu image:", error)
        return null
      }

      const { data: publicUrlData } = supabase.storage.from("attendance-photos").getPublicUrl(filePath)
      return publicUrlData?.publicUrl || null
    } catch (error) {
      console.error("[v0] Error uploading menu image:", error)
      return null
    }
  }

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)

      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name", { ascending: true })

      if (error) {
        console.error("[v0] Error fetching categories:", error)
        return
      }

      // Map database schema ke frontend properties
      const mappedCategories = (data || []).map((cat: any) => ({
        ...cat,
        // Support is_active atau active atau tanpa kolom sama sekali
        status: (cat.is_active === false || cat.active === false || cat.status === "inactive") ? "inactive" : "active",
        // Kalau tidak ada kolom type, anggap bisa muncul di semua tab
        type: cat.type || null,
        icon: cat.icon || "",
        sort_order: cat.sort_order || 0,
      }))
      setCategories(mappedCategories)
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      setMenuItemsLoading(true)
      console.log("[v0] Fetching menu items from Supabase...")

      let query = supabase
        .from("services")
        .select(`
          *,
          service_categories(id, name, description)
        `)
        .order("created_at", { ascending: false })
      
      // Filter by type based on filterType
      if (filterType === "service" || filterType === "product") {
        query = query.eq("type", filterType)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching menu items:", error)
        return
      }

      console.log("[v0] Fetched menu items:", data)
      // Map database schema to frontend properties (mapping aktif to status)
      const mappedMenuItems = (data || []).map((item: any) => ({
        ...item,
        status: item.aktif ? "active" : "inactive"
      }))
      setMenuItems(mappedMenuItems)
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setMenuItemsLoading(false)
    }
  }

  const fetchReceiptTemplates = async () => {
    try {
      setReceiptLoading(true)
      console.log("[v0] Fetching receipt templates from Supabase...")

      const { data, error } = await supabase
        .from("receipt_templates")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching receipt templates:", error)
        return
      }

      console.log("[v0] Fetched receipt templates:", data)
      const templatesWithDefaults = (data || []).map((template) => ({
        ...template,
        header_text: template.header_text || "",
        footer_text: template.footer_text || "",
        logo_url: template.logo_url || null,
      }))
      setReceiptTemplates(templatesWithDefaults)
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setReceiptLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from("branches").select("id, name, address, phone, created_at").order("name")
      if (error) {
        console.error("[v0] Error fetching branches:", error)
        return
      }
      setBranches(data || [])
      if (data.length > 0 && !selectedOutlet) {
        setSelectedOutlet(data[0].id)
      }
    } catch (error) {
      console.error("[v0] Error fetching branches:", error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchBranches(), 
        fetchReceiptTemplates(), 
        fetchCategories(), 
        fetchMenuItems(),
        fetchLowStockAlerts()
      ])
      if (selectedOutlet) {
        await fetchOutletStock(selectedOutlet)
      }
    } catch (error) {
      console.error("[v0] Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBranches()
    fetchReceiptTemplates()
    fetchLowStockAlerts()
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchMenuItems()
  }, [filterType])

  useEffect(() => {
    if (selectedOutlet) {
      fetchOutletStock(selectedOutlet)
    }
  }, [selectedOutlet])

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || item.category_id === filterCategory
    const matchesType = filterType === "all" || item.type === filterType
    const matchesStatus = filterStatus === "all" || item.status === filterStatus
    return matchesSearch && matchesCategory && matchesType && matchesStatus
  })

  const totalCategories = categories.length
  const activeCategories = categories.filter((c) => c.status === "active").length
  const totalMenuItems = menuItems.length
  const activeMenuItems = menuItems.filter((item) => item.status === "active").length
  console.log(
    "[v0] Active menu items:",
    menuItems.filter((item) => item.status === "active"),
  )
  const totalRevenue = menuItems
    .filter((item) => item.status === "active")
    .reduce((sum, item) => {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price || 0
      console.log("[v0] Adding price:", price, "for item:", item.name)
      return sum + price
    }, 0)
  console.log("[v0] Total revenue calculated:", totalRevenue)

  const createCategory = async () => {
    try {
      setSaving(true)
      const { data, error } = await supabase
        .from("service_categories")
        .insert([
          {
            name: categoryForm.name,
            description: categoryForm.description,
            type: categoryForm.type,
            is_active: true,
          },
        ])
        .select()

      if (error) {
        console.error("[v0] Error creating category:", error)
        toast({
          title: "Error",
          description: `Gagal membuat kategori: ${error.message || ''}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Berhasil",
        description: "Kategori berhasil dibuat",
      })

      setIsAddCategoryDialogOpen(false)
      setCategoryForm({ name: "", description: "", icon: "", type: "service", sort_order: 0 })
      fetchCategories()
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateCategory = async () => {
    if (!editingCategory) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("service_categories")
        .update({
          name: categoryForm.name,
          description: categoryForm.description,
          type: categoryForm.type,
        })
        .eq("id", editingCategory.id)

      if (error) {
        console.error("[v0] Error updating category:", error)
        toast({
          title: "Error",
          description: `Gagal mengupdate kategori: ${error.message || ''}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Berhasil",
        description: "Kategori berhasil diupdate",
      })

      setIsAddCategoryDialogOpen(false)
      setEditingCategory(null)
      setCategoryForm({ name: "", description: "", icon: "", type: "service", sort_order: 0 })
      fetchCategories()
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!confirm("Yakin ingin menghapus kategori ini?")) return

    try {
      setSaving(true)
      
      // Check if category has any menu items
      const { data: menuItems, error: checkError } = await supabase
        .from("services")
        .select("id")
        .eq("category_id", categoryId)
      
      if (checkError) {
        console.error("[v0] Error checking category usage:", checkError.message || checkError)
        toast({
          title: "Error",
          description: "Gagal memeriksa kategori",
          variant: "destructive",
        })
        return
      }
      
      if (menuItems && menuItems.length > 0) {
        toast({
          title: "Tidak Dapat Menghapus",
          description: `Kategori ini masih digunakan oleh ${menuItems.length} menu. Hapus atau pindahkan menu tersebut terlebih dahulu.`,
          variant: "destructive",
        })
        return
      }
      
      // Delete category if no menu items
      const { error } = await supabase.from("service_categories").delete().eq("id", categoryId)

      if (error) {
        console.error("[v0] Error deleting category:", error.message || error)
        toast({
          title: "Error",
          description: error.message || "Gagal menghapus kategori",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus",
      })

      fetchCategories()
      fetchMenuItems() // Refresh menu items as well
    } catch (error: any) {
      console.error("[v0] Error:", error.message || error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus kategori",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const createMenuItem = async () => {
    try {
      setSaving(true)
      
      // Validasi: pastikan category type sesuai dengan item type
      if (menuForm.category_id) {
        const selectedCategory = categories.find(c => c.id === menuForm.category_id)
        if (selectedCategory && selectedCategory.type !== menuForm.type) {
          toast({
            title: "Error",
            description: `Kategori ${selectedCategory.name} adalah kategori ${selectedCategory.type === 'service' ? 'LAYANAN' : 'PRODUK'}. Tidak bisa digunakan untuk ${menuForm.type === 'service' ? 'LAYANAN' : 'PRODUK'}.`,
            variant: "destructive",
          })
          setSaving(false)
          return
        }
      }
      
      let imageUrl = ""
      if (menuImageFile) {
        imageUrl = await uploadMenuImage(menuImageFile) || ""
      }

      const { data, error } = await supabase
        .from("services")
        .insert([
          {
            name: menuForm.name,
            description: menuForm.description,
            price: menuForm.price,
            cost_price: menuForm.type === "product" ? menuForm.cost_price : 0,
            category_id: menuForm.category_id || null,
            type: menuForm.type,
            duration: menuForm.type === "service" ? menuForm.duration : 0,
            stock: menuForm.type === "product" ? menuForm.stock : null,
            aktif: true,
            image_url: imageUrl,
          },
        ])
        .select()

      if (error) {
        console.error("[v0] Error creating menu item:", error)
        toast({
          title: "Error",
          description: `Gagal membuat menu: ${error.message || ''}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Berhasil",
        description: "Menu berhasil dibuat",
      })

      setIsAddMenuItemDialogOpen(false)
      setMenuForm({ name: "", description: "", price: 0, cost_price: 0, category_id: "", duration: 0, type: "service", stock: 0, image_url: "" })
      setMenuImageFile(null)
      setMenuImagePreview(null)
      fetchMenuItems()
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateMenuItem = async () => {
    if (!editingMenuItem) return

    try {
      setSaving(true)
      
      // Validasi: pastikan category type sesuai dengan item type
      if (menuForm.category_id) {
        const selectedCategory = categories.find(c => c.id === menuForm.category_id)
        if (selectedCategory && selectedCategory.type !== menuForm.type) {
          toast({
            title: "Error",
            description: `Kategori ${selectedCategory.name} adalah kategori ${selectedCategory.type === 'service' ? 'LAYANAN' : 'PRODUK'}. Tidak bisa digunakan untuk ${menuForm.type === 'service' ? 'LAYANAN' : 'PRODUK'}.`,
            variant: "destructive",
          })
          setSaving(false)
          return
        }
      }
      
      let imageUrl = menuForm.image_url
      if (menuImageFile) {
        imageUrl = await uploadMenuImage(menuImageFile) || menuForm.image_url
      }

      const { error } = await supabase
        .from("services")
        .update({
          name: menuForm.name,
          description: menuForm.description,
          price: menuForm.price,
          cost_price: menuForm.type === "product" ? menuForm.cost_price : 0,
          category_id: menuForm.category_id,
          type: menuForm.type,
          duration: menuForm.type === "service" ? menuForm.duration : 0,
          stock: menuForm.type === "product" ? menuForm.stock : null,
          image_url: imageUrl,
        })
        .eq("id", editingMenuItem.id)

      if (error) {
        console.error("[v0] Error updating menu item:", error)
        toast({
          title: "Error",
          description: "Gagal mengupdate menu",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Berhasil",
        description: "Menu berhasil diupdate",
      })

      setIsAddMenuItemDialogOpen(false)
      setEditingMenuItem(null)
      setMenuForm({ name: "", description: "", price: 0, cost_price: 0, category_id: "", duration: 0, type: "service", stock: 0, image_url: "" })
      setMenuImageFile(null)
      setMenuImagePreview(null)
      fetchMenuItems()
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const deleteMenuItem = async (itemId: string) => {
    try {
      setSaving(true)
      
      // Check if menu item is used in transactions
      const { data: usageCheck, error: checkError } = await supabase
        .from("transaction_items")
        .select("id")
        .eq("service_id", itemId)
        .limit(1)

      if (checkError) {
        console.error("[v0] Error checking menu item usage:", checkError)
      }

      if (usageCheck && usageCheck.length > 0) {
        // Item is used in transactions, offer to deactivate instead
        const shouldDeactivate = confirm(
          "Menu ini sudah digunakan dalam transaksi dan tidak bisa dihapus.\\n\\n" +
          "Apakah Anda ingin menonaktifkan menu ini? (Status akan diubah menjadi 'inactive')"
        )
        
        if (!shouldDeactivate) {
          setSaving(false)
          return
        }

        // Deactivate the item instead of deleting
        const { error: updateError } = await supabase
          .from("services")
          .update({ aktif: false })
          .eq("id", itemId)

        if (updateError) {
          console.error("[v0] Error deactivating menu item:", updateError)
          toast({
            title: "Error",
            description: `Gagal menonaktifkan menu: ${updateError.message || ''}`,
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Berhasil",
          description: "Menu berhasil dinonaktifkan (tidak tampil di POS)",
        })

        fetchMenuItems()
        return
      }

      // Item not used in transactions, safe to delete
      if (!confirm("Yakin ingin menghapus menu ini? Aksi ini tidak bisa dibatalkan.")) {
        setSaving(false)
        return
      }

      const { error } = await supabase.from("services").delete().eq("id", itemId)

      if (error) {
        console.error("[v0] Error deleting menu item:", error.message || error)
        toast({
          title: "Error",
          description: error.message || "Gagal menghapus menu",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Berhasil",
        description: "Menu berhasil dihapus",
      })

      fetchMenuItems()
    } catch (error: any) {
      console.error("[v0] Error:", error.message || error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus menu",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: "Error", description: "Nama template harus diisi", variant: "destructive" })
      return
    }

    try {
      setSavingTemplate(true)
      let logoUploadUrl = logoUrl

      if (logoFile) {
        logoUploadUrl = await uploadLogo(logoFile)
        if (!logoUploadUrl) {
          toast({ title: "Error", description: "Gagal mengupload logo", variant: "destructive" })
          return
        }
      }

      const paperWidth = paperSize === "58mm" ? 58 : 80

      // Base data — always supported columns
      const baseData = {
        name: templateName,
        header_text: templateHeader,
        footer_text: templateFooter,
        logo_url: logoUploadUrl,
        branch_id: selectedBranch === "none" ? null : selectedBranch || null,
        is_active: true,
      }

      // Extended display columns — added via migration-receipt-template.sql
      const extendedData = {
        paper_size: paperSize,
        paper_width: paperWidth,
        font_size: fontSize,
        show_logo: showLogo,
        show_address: showAddress,
        show_phone: showPhone,
        show_date: showDate,
        show_barber: showBarber,
        show_cashier: showCashier,
        show_customer: true,
      }

      const templateData = { ...baseData, ...extendedData }

      let result
      if (editingTemplateId) {
        result = await supabase.from("receipt_templates").update(templateData).eq("id", editingTemplateId)
      } else {
        result = await supabase.from("receipt_templates").insert([templateData])
      }

      // If extended columns don't exist yet, retry with base data only
      if (result.error) {
        const errMsg = result.error.message || ""
        const isColumnMissing = errMsg.includes("column") || result.error.code === "42703"

        if (isColumnMissing) {
          console.warn("[template] Extended columns missing — saving base data only. Run migration-receipt-template.sql in Supabase SQL Editor.")
          if (editingTemplateId) {
            result = await supabase.from("receipt_templates").update(baseData).eq("id", editingTemplateId)
          } else {
            result = await supabase.from("receipt_templates").insert([baseData])
          }
        }

        if (result.error) {
          console.error("[v0] Error saving template:", result.error)
          toast({
            title: "Error",
            description: `Gagal menyimpan template: ${result.error.message}`,
            variant: "destructive",
          })
          return
        }
      }

      toast({
        title: "Berhasil",
        description: editingTemplateId ? "Template berhasil diupdate" : "Template berhasil dibuat",
      })

      setIsTemplateDialogOpen(false)
      resetTemplateForm()
      fetchReceiptTemplates()
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setSavingTemplate(false)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    // Check if template is default
    const templateToDelete = receiptTemplates.find(t => t.id === templateId)
    
    if (templateToDelete?.is_default) {
      toast({
        title: "Tidak Dapat Menghapus",
        description: "Template default tidak bisa dihapus. Ubah template lain sebagai default terlebih dahulu.",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Yakin ingin menghapus template ini?")) return

    try {
      const { error } = await supabase.from("receipt_templates").delete().eq("id", templateId)

      if (error) {
        console.error("[v0] Error deleting template:", error)
        toast({
          title: "Error",
          description: "Gagal menghapus template",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Berhasil",
        description: "Template berhasil dihapus",
      })

      fetchReceiptTemplates()
    } catch (error) {
      console.error("[v0] Error:", error)
    }
  }

  const setActiveTemplate = async (templateId: string) => {
    try {
      // First deactivate all templates
      const { error: deactivateError } = await supabase
        .from("receipt_templates")
        .update({ is_active: false })
        .not("id", "is", null)

      if (deactivateError) {
        console.error("[v0] Error deactivating templates:", deactivateError)
        return
      }

      // Then activate the selected template
      const { error: activateError } = await supabase
        .from("receipt_templates")
        .update({ is_active: true })
        .eq("id", templateId)

      if (activateError) {
        console.error("[v0] Error activating template:", activateError)
        return
      }

      toast({
        title: "Berhasil",
        description: "Template berhasil diaktifkan",
      })

      fetchReceiptTemplates()
    } catch (error) {
      console.error("[v0] Error:", error)
    }
  }

  const deactivateTemplate = async (templateId: string) => {
    try {
      // Cek apakah ada template default
      const hasDefault = receiptTemplates.some(t => t.is_default && t.id !== templateId);
      
      if (!hasDefault) {
        toast({
          title: "Peringatan",
          description: "Harap aktifkan template default terlebih dahulu sebelum menonaktifkan template aktif ini!",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.from("receipt_templates").update({ is_active: false }).eq("id", templateId)

      if (error) {
        console.error("[v0] Error deactivating template:", error)
        return
      }

      toast({
        title: "Berhasil",
        description: "Template berhasil dinonaktifkan. Template default akan digunakan.",
      })

      fetchReceiptTemplates()
    } catch (error) {
      console.error("[v0] Error:", error)
    }
  }

  const toggleDefaultTemplate = async (templateId: string, currentDefaultStatus: boolean) => {
    try {
      if (currentDefaultStatus) {
        // Jika sudah default, cek apakah ada template aktif lain
        const hasActiveTemplate = receiptTemplates.some(t => t.is_active && t.id !== templateId);
        
        if (!hasActiveTemplate) {
          toast({
            title: "Tidak Dapat Menonaktifkan",
            description: "Tidak ada template aktif lain. Harap aktifkan template lain terlebih dahulu!",
            variant: "destructive"
          });
          return;
        }

        // Nonaktifkan default
        const { error } = await supabase
          .from("receipt_templates")
          .update({ is_default: false })
          .eq("id", templateId);

        if (error?.message) throw error;

        toast({
          title: "Berhasil",
          description: "Template default telah dinonaktifkan",
        });
      } else {
        // Cek apakah sudah ada template default lain
        const otherDefault = receiptTemplates.find(t => t.is_default && t.id !== templateId);
        
        if (otherDefault) {
          toast({
            title: "Template Default Sudah Ada",
            description: `Template "${otherDefault.name}" sudah menjadi default. Nonaktifkan terlebih dahulu.`,
            variant: "destructive"
          });
          return;
        }

        // Aktifkan sebagai default
        const { error } = await supabase
          .from("receipt_templates")
          .update({ is_default: true })
          .eq("id", templateId);

        if (error?.message) throw error;

        toast({
          title: "Berhasil",
          description: "Template berhasil diset sebagai default",
        });
      }

      fetchReceiptTemplates();
    } catch (error: any) {
      // Hanya tampilkan toast jika ada error message yang valid
      if (error?.message) {
        toast({
          title: "Error",
          description: error.message || "Gagal mengubah status default template",
          variant: "destructive"
        });
      }
      // Jangan log error kosong
    }
  }

  const handleEditTemplate = (template: ReceiptTemplate) => {
    setEditingTemplateId(template.id)
    setTemplateName(template.name)
    setTemplateHeader(template.header_text || "")
    setTemplateFooter(template.footer_text || "")
    setSelectedBranch(template.branch_id || "none")
    setPaperSize(template.paper_size || "80mm")
    setFontSize(template.font_size || "medium")
    setShowLogo(template.show_logo ?? false)
    setShowAddress(template.show_address ?? true)
    setShowPhone(template.show_phone ?? true)
    setShowDate(template.show_date ?? true)
    setShowBarber(template.show_barber ?? true)
    setShowCashier(template.show_cashier ?? true)
    setLogoUrl(template.logo_url || "")
    setLogoPreview(template.logo_url || "")
    setIsTemplateDialogOpen(true)
  }

  const handleTestPrint = (template: ReceiptTemplate) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Print - ${template.name}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 20px; }
            .receipt { width: 300px; margin: 0 auto; }
            .center { text-align: center; }
            .logo { max-height: 60px; margin-bottom: 10px; }
            .line { border-bottom: 1px dashed #000; margin: 5px 0; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${template.show_logo && template.logo_url ? `<div class="center"><img src="${template.logo_url}" class="logo" alt="Logo" /></div>` : ""}
            <div class="center">${template.header_text?.replace(/\n/g, "<br>") || ""}</div>
            <div class="line"></div>
            ${template.show_date ? `<div>Tanggal: ${new Date().toLocaleDateString("id-ID")}</div>` : ""}
            ${template.show_barber ? `<div>Capster: Ahmad Rizki</div>` : ""}
            <div class="line"></div>
            <div>1x Basic Cut ........................ 25.000</div>
            <div class="line"></div>
            <div class="total">TOTAL: 25.000</div>
            <div class="line"></div>
            <div class="center">${template.footer_text?.replace(/\n/g, "<br>") || ""}</div>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setCategoryForm({ 
      name: "", 
      description: "", 
      icon: "", 
      type: filterType as "service" | "product",
      sort_order: 0 
    })
    setIsAddCategoryDialogOpen(true)
  }

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      icon: category.icon,
      type: category.type || "service",
      sort_order: category.sort_order,
    })
    setIsAddCategoryDialogOpen(true)
  }

  const handleAddMenuItem = () => {
    setMenuForm({
      name: "",
      description: "",
      price: 0,
      cost_price: 0,
      category_id: "",
      duration: 0,
      stock: 0,
      type: filterType as "service" | "product",
      image_url: "",
    })
    setMenuImageFile(null)
    setMenuImagePreview(null)
    setEditingMenuItem(null)
    setIsAddMenuItemDialogOpen(true)
  }

  const handleEditMenuItem = (item: MenuItem) => {
    setMenuForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      cost_price: item.cost_price || 0,
      category_id: item.category_id,
      duration: item.duration || 0,
      stock: item.stock || 0,
      type: item.type,
      image_url: item.image_url || "",
    })
    setMenuImageFile(null)
    setMenuImagePreview(item.image_url || null)
    setEditingMenuItem(item)
    setIsAddMenuItemDialogOpen(true)
  }

  const handleAddTemplate = () => {
    resetTemplateForm()
    setIsTemplateDialogOpen(true)
  }

  const resetMenuForm = () => {
    setMenuForm({
      name: "",
      description: "",
      price: 0,
      cost_price: 0,
      category_id: "",
      duration: 0,
      stock: 0,
      type: filterType as "service" | "product",
      image_url: "",
    })
    setMenuImageFile(null)
    setMenuImagePreview(null)
    setEditingMenuItem(null)
  }

  const toggleMenuStatus = async (menuId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"

      const { error } = await supabase.from("services").update({ aktif: newStatus === "active" }).eq("id", menuId)

      if (error) throw error

      // Update local state
      setMenuItems((prev) => prev.map((item) => (item.id === menuId ? { ...item, status: newStatus } : item)))

      console.log(`[v0] Menu ${newStatus === "active" ? "activated" : "deactivated"} successfully`)
    } catch (error) {
      console.error("[v0] Error updating menu status:", error)
    }
  }

  const updateProductStock = async (itemId: string, newStock: number) => {
    try {
      console.log("[v0] Updating stock for item:", itemId, "to:", newStock)

      // Try to update stock, but handle gracefully if column doesn't exist
      const { error } = await supabase
        .from("services")
        .update({
          // Only include stock if it's a product, otherwise just update updated_at
          ...(newStock !== undefined && { stock: newStock }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)

      if (error) {
        console.error("[v0] Error updating stock:", error)
        // If stock column doesn't exist, just show a warning instead of error
        if (error.message.includes("stock")) {
          toast({
            title: "Info",
            description: "Fitur stok belum tersedia. Jalankan script database terlebih dahulu.",
          })
        } else {
          toast({
            title: "Error",
            description: "Gagal mengupdate stok produk",
            variant: "destructive",
          })
        }
        return
      }

      // Update local state
      setMenuItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, stock: newStock } : item)))

      toast({
        title: "Berhasil",
        description: "Stok produk berhasil diupdate",
      })
    } catch (error) {
      console.error("[v0] Error updating stock:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengupdate stok",
        variant: "destructive",
      })
    }
  }

  const updateOutletPrice = async (itemId: string, newPrice: number) => {
    try {
      // For now, update the main price - later can be extended to outlet-specific pricing
      const { error } = await supabase.from("services").update({ price: newPrice }).eq("id", itemId)

      if (error) {
        console.error("[v0] Error updating price:", error)
        toast({
          title: "Error",
          description: "Gagal mengupdate harga produk",
          variant: "destructive",
        })
        return
      }

      // Update local state
      setMenuItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, price: newPrice } : item)))

      toast({
        title: "Berhasil",
        description: "Harga produk berhasil diupdate",
      })
    } catch (error) {
      console.error("[v0] Error updating price:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengupdate harga",
        variant: "destructive",
      })
    }
  }

  const updateMenuStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("services").update({ aktif: newStatus === "active" }).eq("id", itemId)

      if (error) {
        console.error("[v0] Error updating menu status:", error)
        toast({
          title: "Error",
          description: `Gagal mengupdate status menu: ${error.message || ''}`,
          variant: "destructive",
        })
        return
      }

      // Update local state
      setMenuItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, status: newStatus as "active" | "inactive" } : item)))

      toast({
        title: "Berhasil",
        description: "Status menu berhasil diupdate",
      })
    } catch (error) {
      console.error("[v0] Error updating menu status:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengupdate status",
        variant: "destructive",
      })
    }
  }

  const activeMenuCount = menuItems.filter((item) => item.status === "active").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Kelola Menu Kasir
          </h1>
          <p className="text-gray-600 mt-2">Kelola kategori, layanan, dan produk yang ditampilkan di kasir</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 bg-white hover:bg-gray-50 border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Stok Rendah
            </CardTitle>
            <CardDescription>
              {lowStockAlerts.length} produk membutuhkan restok segera
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockAlerts.slice(0, 5).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <div>
                    <div className="font-medium">{alert.name || "-"}</div>
                    <div className="text-sm text-gray-600">
                      Stok tersisa: <span className="font-semibold text-red-600">{alert.stock ?? 0}</span> unit
                    </div>
                  </div>
                  <Badge variant="destructive">
                    Restok Segera
                  </Badge>
                </div>
              ))}
              {lowStockAlerts.length > 5 && (
                <div className="text-center text-sm text-red-600">
                  +{lowStockAlerts.length - 5} produk lainnya membutuhkan restok
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Kategori</p>
                <p className="text-2xl font-bold text-blue-900">{categories.length}</p>
                <p className="text-blue-500 text-xs mt-1">kategori tersedia</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Menu Aktif</p>
                <p className="text-2xl font-bold text-green-900">{activeMenuCount}</p>
                <p className="text-green-500 text-xs mt-1">dari {menuItems.length} total</p>
              </div>
              <div className="bg-green-500 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Total Menu</p>
                <p className="text-2xl font-bold text-red-900">{menuItems.length}</p>
                <p className="text-red-500 text-xs mt-1">layanan & produk</p>
              </div>
              <div className="bg-red-500 p-3 rounded-full">
                <Menu className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Total Nilai</p>
                <p className="text-2xl font-bold text-orange-900">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(totalRevenue)}
                </p>
                <p className="text-orange-500 text-xs mt-1">dari semua menu</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="kelola-menu" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="kelola-menu"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Package className="h-4 w-4 mr-2" />
            Kelola Menu
          </TabsTrigger>
          <TabsTrigger
            value="outlet"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Store className="h-4 w-4 mr-2" />
            Outlet
          </TabsTrigger>
          <TabsTrigger
            value="template-struk"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Template Struk
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kelola-menu" className="space-y-8">
          {/* Main Type Selection */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              onClick={() => setFilterType("service")}
              variant={filterType === "service" ? "default" : "outline"}
              size="lg"
              className={`w-48 h-16 text-lg font-bold ${filterType === "service" ? "bg-red-600 hover:bg-red-700" : ""}`}
            >
              LAYANAN
            </Button>
            <Button
              onClick={() => setFilterType("product")}
              variant={filterType === "product" ? "default" : "outline"}
              size="lg"
              className={`w-48 h-16 text-lg font-bold ${filterType === "product" ? "bg-red-600 hover:bg-red-700" : ""}`}
            >
              PRODUK
            </Button>
          </div>

          {/* Categories Section for Selected Type */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">KATEGORI {filterType === "service" ? "LAYANAN" : "PRODUK"}</h2>
                <p className="text-gray-600">Kelola kategori untuk mengelompokkan {filterType === "service" ? "layanan" : "produk"}</p>
              </div>
              <Button onClick={handleAddCategory} className="gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4" />
                TAMBAH KATEGORI
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoriesLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Memuat kategori...</p>
                </div>
              ) : categories.filter(c =>
                  // Tampilkan kategori yang type-nya sesuai, atau yang tidak punya type (tampil di semua tab)
                  c.type === filterType || !c.type
                ).length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">Belum ada kategori. Tambahkan kategori pertama Anda!</p>
                </div>
              ) : (
                categories.filter(c =>
                  c.type === filterType || !c.type
                ).map((category) => (
                  <Card key={category.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold uppercase">{category.name}</h3>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                        <Badge variant={category.status === "active" ? "default" : "secondary"}>
                          {category.status === "active" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditCategory(category)}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          EDIT
                        </Button>
                        <Button onClick={() => deleteCategory(category.id)} variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Menu Items Section */}
          <div className="space-y-6 border-t pt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">DAFTAR {filterType === "service" ? "LAYANAN" : "PRODUK"}</h2>
                <p className="text-gray-600">Kelola {filterType === "service" ? "layanan" : "produk"} yang tersedia</p>
              </div>
              <Button onClick={handleAddMenuItem} className="gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4" />
                TAMBAH {filterType === "service" ? "LAYANAN" : "PRODUK"}
              </Button>
            </div>

            {/* Filter Card */}
            <Card>
              <CardHeader>
                <CardTitle>FILTER & PENCARIAN</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cari menu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setFilterCategory("all")
                      setFilterStatus("all")
                    }}
                  >
                    RESET FILTER
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Menu Items Grid - Simplified */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {menuItemsLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Memuat menu...</p>
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">Tidak ada menu ditemukan</p>
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                    <CardContent className="p-0">
                      {/* Image Placeholder / Actual Image */}
                      {item.image_url ? (
                        <div className="w-full h-40 relative">
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="text-6xl">
                            {item.type === "service" ? "💈" : "📦"}
                          </div>
                        </div>
                      )}
                      
                      {/* Item Info */}
                      <div className="p-4 space-y-3">
                        {/* Name */}
                        <div className="text-center">
                          <h3 className="font-bold text-lg uppercase line-clamp-2">{item.name}</h3>
                          <p className="text-sm font-semibold text-green-600 mt-1">
                            Rp {item.price.toLocaleString("id-ID")}
                          </p>
                          {item.category && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.category.name}
                            </p>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditMenuItem(item)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            EDIT
                          </Button>
                          <Button 
                            onClick={() => deleteMenuItem(item.id)} 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="outlet" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Kontrol Menu per Outlet</h2>
              <p className="text-gray-600">Atur menu, stok, dan harga yang tersedia di setiap outlet</p>
            </div>
            {selectedOutlet && (
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{filteredMenuItems.filter(item => item.type === "service").length}</div>
                  <div className="text-xs text-gray-600">💈 Layanan</div>
                </div>
                <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{filteredMenuItems.filter(item => item.type === "product").length}</div>
                  <div className="text-xs text-gray-600">📦 Produk</div>
                </div>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Pilih Outlet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Pilih outlet..." />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter Tipe Menu */}
              {selectedOutlet && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant={filterType === "all" ? "default" : "outline"}
                    onClick={() => setFilterType("all")}
                    className="flex-1"
                  >
                    Semua Menu
                  </Button>
                  <Button
                    variant={filterType === "service" ? "default" : "outline"}
                    onClick={() => setFilterType("service")}
                    className="flex-1"
                  >
                    💈 Layanan
                  </Button>
                  <Button
                    variant={filterType === "product" ? "default" : "outline"}
                    onClick={() => setFilterType("product")}
                    className="flex-1"
                  >
                    📦 Produk
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedOutlet && (
            <div className="space-y-4">
              {Object.entries(
                filteredMenuItems
                  .filter(item => filterType === "all" || item.type === filterType)
                  .reduce(
                    (acc, item) => {
                      const categoryName = item.category?.name || "Lainnya"
                      if (!acc[categoryName]) acc[categoryName] = []
                      acc[categoryName].push(item)
                      return acc
                    },
                    {} as Record<string, typeof filteredMenuItems>,
                  ),
              ).map(([categoryName, items]) => (
                <Card key={categoryName} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-800">{categoryName}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {items.map((item) => {
                        const isProduct = item.type === "product"
                        const currentStock = outletStock.find(os => os.service_id === item.id)?.stock_quantity || 0
                        const minStock = outletStock.find(os => os.service_id === item.id)?.min_stock_threshold || 5

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-white border-2 rounded-lg hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              {/* Type Icon */}
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                                {isProduct ? "📦" : "💈"}
                              </div>

                              {/* Item Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900 truncate uppercase">{item.name}</h4>
                                  <Badge variant={isProduct ? "secondary" : "outline"} className="text-xs">
                                    {isProduct ? "PRODUK" : "LAYANAN"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-1 line-clamp-1">{item.description}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="font-bold text-green-600">Rp {item.price?.toLocaleString()}</span>
                                  {!isProduct && item.duration && (
                                    <span className="text-gray-500">⏱️ {item.duration} menit</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                              {/* Stock Control for Products */}
                              {isProduct && (
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-gray-600 text-center">Stok</label>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      defaultValue={item.stock ?? 0}
                                      key={`stock-${item.id}-${item.stock}`}
                                      onBlur={(e) => {
                                        const newStock = Number.parseInt(e.target.value) || 0
                                        if (newStock !== (item.stock ?? 0)) {
                                          handleUpdateStock(item.id, newStock)
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          const newStock = Number.parseInt((e.target as HTMLInputElement).value) || 0
                                          if (newStock !== (item.stock ?? 0)) {
                                            handleUpdateStock(item.id, newStock)
                                          }
                                          (e.target as HTMLInputElement).blur()
                                        }
                                      }}
                                      className="h-9 w-20 text-center font-bold"
                                    />
                                  </div>
                                  {(item.stock ?? 0) <= 5 && (
                                    <Badge variant="destructive" className="text-xs text-center">
                                      Stok Rendah
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Status Toggle */}
                              <div className="flex flex-col gap-1 items-center">
                                <label className="text-xs font-medium text-gray-600">Status</label>
                                <div className="flex flex-col items-center gap-2">
                                  <Switch
                                    checked={item.status === "active"}
                                    onCheckedChange={(checked) => {
                                      const newStatus = checked ? "active" : "inactive"
                                      updateMenuStatus(item.id, newStatus)
                                    }}
                                  />
                                  <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs">
                                    {item.status === "active" ? "ON" : "OFF"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="template-struk" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Template Struk</h2>
              <p className="text-gray-600">Kelola tampilan dan format struk pembayaran</p>
            </div>
            <Button onClick={handleAddTemplate} className="gap-2 bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4" />
              Template Baru
            </Button>
          </div>

          {/* Active Template Display */}
          {receiptTemplates.find((t) => t.is_active) && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Template Aktif</Badge>
                  <CardTitle className="text-lg">{receiptTemplates.find((t) => t.is_active)?.name}</CardTitle>
                </div>
                <CardDescription>Template ini sedang digunakan untuk semua transaksi di kasir</CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Template List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receiptLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Memuat template...</p>
              </div>
            ) : receiptTemplates.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600">Belum ada template. Buat template pertama Anda!</p>
              </div>
            ) : (
              receiptTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`hover:shadow-lg transition-shadow ${
                    template.is_active 
                      ? "ring-2 ring-green-500" 
                      : template.is_default 
                      ? "ring-2 ring-blue-400" 
                      : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        {template.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-1">
                        {template.is_active && <Badge className="bg-green-100 text-green-800 text-xs">Aktif</Badge>}
                        {template.is_default && <Badge className="bg-blue-100 text-blue-800 text-xs">Default</Badge>}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Template Preview — full accurate preview */}
                    <div
                      className="bg-white border rounded overflow-hidden"
                      style={{ fontFamily: "'Courier New', monospace", fontSize: "7.5px", lineHeight: "1.4" }}
                    >
                      {/* top perf */}
                      <div className="h-1 border-b border-dashed border-gray-300 bg-gray-50" />
                      <div className="px-3 py-2 space-y-1">
                        {/* Header */}
                        <div className="text-center">
                          {template.show_logo && template.logo_url && (
                            <img src={template.logo_url} alt="Logo" className="h-8 w-auto mx-auto mb-1 object-contain" />
                          )}
                          <div className="font-bold whitespace-pre-line break-words">
                            {template.header_text || template.name}
                          </div>
                          {template.show_address && (() => {
                            const b = branches.find(br => br.id === template.branch_id)
                            return b?.address ? <div className="text-gray-500 break-words">{b.address}</div> : null
                          })()}
                          {template.show_phone && (() => {
                            const b = branches.find(br => br.id === template.branch_id)
                            return b?.phone ? <div className="text-gray-500">Telp: {b.phone}</div> : null
                          })()}
                        </div>

                        <div className="border-t border-dashed border-gray-400" />

                        {/* Info */}
                        <div>
                          {template.show_date && <div>Tgl: 17/06/2026 13:00</div>}
                          <div>No: TRX-17062026-001</div>
                          {template.show_cashier && <div>Kasir: Admin</div>}
                          {template.show_barber && <div>Capster: Budi</div>}
                          <div>Customer: John Doe</div>
                        </div>

                        <div className="border-t border-dashed border-gray-400" />

                        {/* Items */}
                        <div>
                          <div className="font-semibold">Basic Cut</div>
                          <div className="flex justify-between gap-1">
                            <span>1 x Rp 35.000</span><span className="flex-shrink-0">Rp 35.000</span>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-gray-400" />

                        {/* Total */}
                        <div>
                          <div className="flex justify-between gap-1"><span>Subtotal:</span><span className="flex-shrink-0">Rp 35.000</span></div>
                          <div className="flex justify-between gap-1 font-bold"><span>TOTAL:</span><span className="flex-shrink-0">Rp 35.000</span></div>
                          <div>Bayar: Cash</div>
                        </div>

                        <div className="border-t border-dashed border-gray-400" />

                        {/* Footer */}
                        <div className="text-center whitespace-pre-line break-words">
                          {template.footer_text || "Terima kasih atas kunjungan Anda!"}
                        </div>
                      </div>
                      {/* bottom perf */}
                      <div className="h-1 border-t border-dashed border-gray-300 bg-gray-50" />
                    </div>

                    {/* Toggle Default - Full Width */}
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Template Default</span>
                      </div>
                      <Switch
                        checked={template.is_default || false}
                        onCheckedChange={() => toggleDefaultTemplate(template.id, template.is_default || false)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>

                    {/* Template Actions - Responsive Grid Layout */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleEditTemplate(template)}
                        size="sm"
                        variant="outline"
                        className="w-full gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        onClick={() => handleTestPrint(template)}
                        size="sm"
                        variant="outline"
                        className="w-full gap-1"
                      >
                        <Printer className="h-3 w-3" />
                        <span className="hidden sm:inline">Test Print</span>
                      </Button>
                      <Button
                        onClick={() => deleteTemplate(template.id)}
                        size="sm"
                        variant="destructive"
                        className="w-full gap-1"
                        disabled={template.is_default}
                        title={template.is_default ? "Template default tidak bisa dihapus" : "Hapus template"}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Hapus</span>
                      </Button>
                      {template.is_active ? (
                        <Button
                          onClick={() => deactivateTemplate(template.id)}
                          size="sm"
                          variant="outline"
                          className="w-full gap-1"
                        >
                          <X className="h-3 w-3" />
                          <span className="hidden sm:inline">Nonaktifkan</span>
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => setActiveTemplate(template.id)} 
                          size="sm" 
                          className="w-full gap-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3" />
                          <span className="hidden sm:inline">Aktifkan</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? `Update informasi kategori untuk ${categoryForm.type === 'service' ? 'Layanan' : 'Produk'}`
                : `Buat kategori baru untuk ${categoryForm.type === 'service' ? 'Layanan' : 'Produk'}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Kategori</label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Contoh: Potong Rambut"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipe Kategori</label>
              <Select
                value={categoryForm.type}
                onValueChange={(value: "service" | "product") =>
                  setCategoryForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Layanan</SelectItem>
                  <SelectItem value="product">Produk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Urutan</label>
              <Input
                type="number"
                value={categoryForm.sort_order}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, sort_order: Number.parseInt(e.target.value) || 0 }))
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={editingCategory ? updateCategory : createCategory} disabled={saving}>
              {saving ? "Menyimpan..." : editingCategory ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddMenuItemDialogOpen} onOpenChange={setIsAddMenuItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMenuItem ? "Edit Menu" : "Tambah Menu Baru"}</DialogTitle>
            <DialogDescription>
              {editingMenuItem ? "Update informasi menu" : "Tambahkan layanan atau produk baru"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Menu</label>
              <Input
                value={menuForm.name}
                onChange={(e) => setMenuForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Contoh: Basic Cut"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <Textarea
                value={menuForm.description}
                onChange={(e) => setMenuForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi menu..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Foto Menu (Opsional)</label>
              <div className="mt-1 flex items-center gap-4">
                {menuImagePreview ? (
                  <div className="relative w-20 h-20 rounded-lg border-2 border-red-100 overflow-hidden flex-shrink-0">
                    <img 
                      src={menuImagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuImageFile(null)
                        setMenuImagePreview(null)
                        setMenuForm(prev => ({ ...prev, image_url: "" }))
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition-colors"
                      title="Hapus foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0 text-3xl text-gray-400">
                    📷
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setMenuImageFile(file)
                      setMenuImagePreview(URL.createObjectURL(file))
                    }
                  }}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {menuForm.type === "service" ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Harga</label>
                    <Input
                      type="text"
                      value={formatNominal(menuForm.price)}
                      onChange={(e) => setMenuForm((prev) => ({ ...prev, price: parseNominal(e.target.value) }))}
                      placeholder="Rp 25.000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Durasi</label>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 flex-shrink-0 border-gray-200"
                        onClick={() => setMenuForm((prev) => ({ ...prev, duration: Math.max(0, prev.duration - 5) }))}
                      >
                        -
                      </Button>
                      <div className="relative flex-1">
                        <Input
                          type="text"
                          value={menuForm.duration === 0 ? "" : menuForm.duration}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setMenuForm((prev) => ({ ...prev, duration: val === "" ? 0 : parseInt(val, 10) }));
                          }}
                          className="text-center font-bold pr-10 h-10"
                          placeholder="0"
                        />
                        <span className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[10px] text-gray-400 font-medium">
                          menit
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 flex-shrink-0 border-gray-200"
                        onClick={() => setMenuForm((prev) => ({ ...prev, duration: prev.duration + 5 }))}
                      >
                        +
                      </Button>
                    </div>
                    
                    {/* Quick Select Buttons */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[15, 30, 45, 60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setMenuForm((prev) => ({ ...prev, duration: mins }))}
                          className={`px-1.5 py-0.5 text-[10px] rounded border transition-all ${
                            menuForm.duration === mins
                              ? "bg-red-600 border-red-600 text-white font-semibold shadow-sm"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium">Harga Modal</label>
                    <Input
                      type="text"
                      value={formatNominal(menuForm.cost_price)}
                      onChange={(e) => setMenuForm((prev) => ({ ...prev, cost_price: parseNominal(e.target.value) }))}
                      placeholder="Rp 15.000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Harga Jual</label>
                    <Input
                      type="text"
                      value={formatNominal(menuForm.price)}
                      onChange={(e) => setMenuForm((prev) => ({ ...prev, price: parseNominal(e.target.value) }))}
                      placeholder="Rp 25.000"
                    />
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <Select
                value={menuForm.category_id}
                onValueChange={(value) => setMenuForm((prev) => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(category => category.type === menuForm.type)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tipe</label>
              <Select
                value={menuForm.type}
                onValueChange={(value: "service" | "product") => setMenuForm((prev) => ({ ...prev, type: value, category_id: "" }))}
                disabled={!!editingMenuItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder={menuForm.type === "service" ? "🔧 Layanan" : "📦 Produk"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">🔧 Layanan</SelectItem>
                  <SelectItem value="product">📦 Produk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMenuItemDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={editingMenuItem ? updateMenuItem : createMenuItem} disabled={saving}>
              {saving ? "Menyimpan..." : editingMenuItem ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog with Live Preview */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="!max-w-4xl w-[90vw] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
          {/* ── Dialog Header ── */}
          <div className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">
              {editingTemplateId ? "Edit Template Struk" : "Template Struk Baru"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-0.5">
              Atur tampilan struk — preview langsung di sebelah kanan
            </DialogDescription>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-1 min-h-0">

            {/* LEFT: Form — scrollable */}
            <div className="flex-1 min-w-0 overflow-y-auto px-6 py-5 space-y-5 border-r">

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nama Template</label>
                <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Contoh: Struk Utama 80mm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Cabang</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih Cabang (Opsional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Cabang</SelectItem>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Ukuran Kertas</label>
                  <Select value={paperSize} onValueChange={setPaperSize}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="80mm">80mm (Standar)</SelectItem>
                      <SelectItem value="58mm">58mm (Mini)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Ukuran Font</label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Kecil</SelectItem>
                      <SelectItem value="medium">Sedang</SelectItem>
                      <SelectItem value="large">Besar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Header Text</label>
                <Textarea value={templateHeader} onChange={(e) => setTemplateHeader(e.target.value)} placeholder={"PIGTOWN BARBERSHOP\nJl. Contoh No. 123\nTelp: (021) 1234-5678"} className="resize-none text-sm" rows={3} />
                <p className="text-xs text-gray-400 mt-1">Gunakan Enter untuk pindah baris</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Footer Text</label>
                <Textarea value={templateFooter} onChange={(e) => setTemplateFooter(e.target.value)} placeholder={"Terima kasih atas kunjungan Anda!\nSampai jumpa kembali 😊"} className="resize-none text-sm" rows={3} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Logo (Opsional)</label>
                <Input type="file" accept="image/*" className="text-sm" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)) }
                }} />
                {logoPreview && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={logoPreview} alt="Logo" className="h-12 rounded border object-contain bg-gray-50 p-1" />
                    <button type="button" onClick={() => { setLogoPreview(null); setLogoFile(null) }} className="text-xs text-red-500 hover:underline">Hapus logo</button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-3">Tampilkan di Struk</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { label: "Logo", state: showLogo, set: setShowLogo },
                    { label: "Alamat Cabang", state: showAddress, set: setShowAddress },
                    { label: "Nomor Telepon", state: showPhone, set: setShowPhone },
                    { label: "Tanggal & Waktu", state: showDate, set: setShowDate },
                    { label: "Nama Kasir", state: showCashier, set: setShowCashier },
                    { label: "Nama Capster", state: showBarber, set: setShowBarber },
                  ] as { label: string; state: boolean; set: (v: boolean) => void }[]).map(({ label, state, set }) => (
                    <button key={label} type="button" onClick={() => set(!state)}
                      className="flex items-center gap-3 p-2.5 rounded-lg border transition-colors hover:bg-gray-50 text-left"
                    >
                      <div className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${state ? "bg-red-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${state ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                      <span className="text-sm text-gray-700">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Live Preview — fixed width, scrollable */}
            <div className="w-72 flex-shrink-0 bg-gray-100 flex flex-col">
              {/* Preview header bar */}
              <div className="px-4 py-2.5 border-b bg-white flex items-center gap-2 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Preview Langsung</span>
              </div>

              {/* Scrollable paper area */}
              <div className="flex-1 overflow-y-auto py-5 px-4 flex justify-center items-start">
                <div className={`transition-all duration-200 ${paperSize === "58mm" ? "w-40" : "w-56"}`}>
                  {/* Paper */}
                  <div
                    className="bg-white shadow-lg overflow-hidden"
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: fontSize === "small" ? "7.5px" : fontSize === "large" ? "10px" : "8.5px",
                      lineHeight: "1.5",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {/* Top perforation */}
                    <div className="h-1.5 border-b-2 border-dashed border-gray-300 bg-gray-50" />

                    <div className="px-3 py-2">
                      {/* Header section */}
                      <div className="text-center mb-1.5">
                        {showLogo && logoPreview && (
                          <img src={logoPreview} alt="Logo" className="h-8 w-auto mx-auto mb-1 object-contain" style={{ maxWidth: "80%" }} />
                        )}
                        <div className="font-bold whitespace-pre-line break-words">
                          {templateHeader || "PIGTOWN BARBERSHOP"}
                        </div>
                        {showAddress && (() => {
                          const b = branches.find(br => br.id === selectedBranch)
                          return b?.address ? <div className="text-gray-500 break-words">{b.address}</div> : null
                        })()}
                        {showPhone && (() => {
                          const b = branches.find(br => br.id === selectedBranch)
                          return b?.phone ? <div className="text-gray-500">Telp: {b.phone}</div> : null
                        })()}
                      </div>

                      <div className="border-t border-dashed border-gray-400 my-1.5" />

                      {/* Transaction info */}
                      <div>
                        {showDate && <div>Tgl: 17/06/2026 02:50</div>}
                        <div>No: TRX-17062026-001</div>
                        {showCashier && <div>Kasir: Admin</div>}
                        {showBarber && <div>Capster: Budi</div>}
                        <div>Customer: John Doe</div>
                      </div>

                      <div className="border-t border-dashed border-gray-400 my-1.5" />

                      {/* Items */}
                      <div className="space-y-1">
                        {[{ name: "Haircut", price: 35000 }, { name: "Gatsby Pomade", price: 25000 }].map((item) => (
                          <div key={item.name}>
                            <div className="font-semibold truncate">{item.name}</div>
                            <div className="flex justify-between gap-1">
                              <span>1 x Rp {item.price.toLocaleString("id-ID")}</span>
                              <span className="flex-shrink-0">Rp {item.price.toLocaleString("id-ID")}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-dashed border-gray-400 my-1.5" />

                      {/* Totals */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between gap-1"><span>Subtotal:</span><span className="flex-shrink-0">Rp 60.000</span></div>
                        <div className="flex justify-between gap-1 font-bold"><span>TOTAL:</span><span className="flex-shrink-0">Rp 60.000</span></div>
                        <div>Bayar: Cash</div>
                        <div className="flex justify-between gap-1"><span>Diterima:</span><span className="flex-shrink-0">Rp 100.000</span></div>
                        <div className="flex justify-between gap-1"><span>Kembalian:</span><span className="flex-shrink-0">Rp 40.000</span></div>
                      </div>

                      <div className="border-t border-dashed border-gray-400 my-1.5" />

                      {/* Footer */}
                      <div className="text-center whitespace-pre-line break-words">
                        {templateFooter || "Terima kasih atas kunjungan Anda!"}
                      </div>
                    </div>

                    {/* Bottom perforation */}
                    <div className="h-1.5 border-t-2 border-dashed border-gray-300 bg-gray-50" />
                  </div>

                  <p className="text-center text-[10px] text-gray-400 mt-2">
                    {paperSize} · {fontSize === "small" ? "Font Kecil" : fontSize === "large" ? "Font Besar" : "Font Sedang"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t bg-white flex justify-end gap-3 flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Batal</Button>
            <Button type="button" disabled={savingTemplate} onClick={handleSaveTemplate} className="bg-red-600 hover:bg-red-700 text-white min-w-36">
              {savingTemplate ? "Menyimpan..." : "Simpan Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CashierManagement
