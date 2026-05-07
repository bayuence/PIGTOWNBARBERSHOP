"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Building, Users, Bell, Shield, Database, Printer, Wifi, Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BusinessSettings {
  name: string
  address: string
  phone: string
  email: string
  website: string
  taxId: string
  currency: string
  timezone: string
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
  category: string
  description: string
  active: boolean
}

const mockServices: Service[] = [
  {
    id: "SRV-001",
    name: "Potong Rambut Basic",
    price: 25000,
    duration: 30,
    category: "Potong Rambut",
    description: "Potong rambut standar",
    active: true,
  },
  {
    id: "SRV-002",
    name: "Potong Rambut Premium",
    price: 45000,
    duration: 45,
    category: "Potong Rambut",
    description: "Potong rambut dengan styling",
    active: true,
  },
  {
    id: "SRV-003",
    name: "Cukur Jenggot",
    price: 15000,
    duration: 20,
    category: "Cukur",
    description: "Cukur jenggot bersih",
    active: true,
  },
]

export function SystemSettings() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    name: "Pigtown Barbershop",
    address: "Jl. Raya No. 123, Jakarta",
    phone: "021-12345678",
    email: "info@pigtownbarbershop.com",
    website: "www.pigtownbarbershop.com",
    taxId: "12.345.678.9-012.000",
    currency: "IDR",
    timezone: "Asia/Jakarta",
  })

  const [services, setServices] = useState<Service[]>(mockServices)
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlerts: true,
    appointmentReminders: true,
  })

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    maintenanceMode: false,
    debugMode: false,
    analyticsEnabled: true,
    cacheEnabled: true,
  })

  const { toast } = useToast()

  const handleSaveBusinessSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Business settings have been updated successfully",
    })
  }

  const handleSaveService = (service: Service) => {
    setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)))
    toast({
      title: "Service Updated",
      description: "Service has been updated successfully",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-gray-600">Konfigurasi dan pengaturan aplikasi barbershop</p>
        </div>
        <Button className="gap-2 bg-red-600 hover:bg-red-700">
          <Settings className="h-4 w-4" />
          Simpan Semua
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="business" className="space-y-4 md:space-y-6">
        {/* Mobile: Scrollable horizontal tabs */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex md:grid w-max md:w-full md:grid-cols-6 gap-1 bg-muted/50 p-1">
            <TabsTrigger value="business" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Bisnis</TabsTrigger>
            <TabsTrigger value="services" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Layanan</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Notifikasi</TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Keamanan</TabsTrigger>
            <TabsTrigger value="system" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Sistem</TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Integrasi</TabsTrigger>
          </TabsList>
        </div>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Building className="h-4 w-4 md:h-5 md:w-5" />
                Informasi Bisnis
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Pengaturan informasi dasar bisnis barbershop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="businessName" className="text-xs md:text-sm">Nama Bisnis</Label>
                  <Input
                    id="businessName"
                    value={businessSettings.name}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
                    className="text-sm h-9 md:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs md:text-sm">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={businessSettings.phone}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                    className="text-sm h-9 md:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs md:text-sm">Email Bisnis</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessSettings.email}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                    className="text-sm h-9 md:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="text-xs md:text-sm">Website</Label>
                  <Input
                    id="website"
                    value={businessSettings.website}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, website: e.target.value })}
                    className="text-sm h-9 md:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="taxId" className="text-xs md:text-sm">NPWP</Label>
                  <Input
                    id="taxId"
                    value={businessSettings.taxId}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, taxId: e.target.value })}
                    className="text-sm h-9 md:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="currency" className="text-xs md:text-sm">Mata Uang</Label>
                  <Select
                    value={businessSettings.currency}
                    onValueChange={(value) => setBusinessSettings({ ...businessSettings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">Indonesian Rupiah (IDR)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={businessSettings.address}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveBusinessSettings} className="bg-red-600 hover:bg-red-700">
                Simpan Pengaturan Bisnis
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Settings */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Manajemen Layanan
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4" />
                      Tambah Layanan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Layanan Baru</DialogTitle>
                      <DialogDescription>Tambahkan layanan baru ke sistem</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="serviceName">Nama Layanan</Label>
                        <Input id="serviceName" placeholder="Masukkan nama layanan" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Harga (Rp)</Label>
                          <Input id="price" type="number" placeholder="25000" />
                        </div>
                        <div>
                          <Label htmlFor="duration">Durasi (menit)</Label>
                          <Input id="duration" type="number" placeholder="30" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="category">Kategori</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Potong Rambut">Potong Rambut</SelectItem>
                            <SelectItem value="Cukur">Cukur</SelectItem>
                            <SelectItem value="Keramas">Keramas</SelectItem>
                            <SelectItem value="Styling">Styling</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea id="description" placeholder="Deskripsi layanan" />
                      </div>
                      <Button className="w-full bg-red-600 hover:bg-red-700">Simpan Layanan</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <CardDescription>Kelola layanan yang tersedia di barbershop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-600">{service.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{service.category}</Badge>
                          <span className="text-sm text-gray-600">{service.duration} menit</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-green-600">Rp {service.price.toLocaleString()}</div>
                        <Badge className={service.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {service.active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-red-600 hover:text-red-700 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Pengaturan Notifikasi
              </CardTitle>
              <CardDescription>Kelola preferensi notifikasi sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Terima notifikasi melalui email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-gray-600">Terima notifikasi melalui SMS</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Terima notifikasi push di browser</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                    <p className="text-sm text-gray-600">Peringatan stok produk menipis</p>
                  </div>
                  <Switch
                    id="lowStockAlerts"
                    checked={notifications.lowStockAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, lowStockAlerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="appointmentReminders">Appointment Reminders</Label>
                    <p className="text-sm text-gray-600">Pengingat janji temu pelanggan</p>
                  </div>
                  <Switch
                    id="appointmentReminders"
                    checked={notifications.appointmentReminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, appointmentReminders: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Pengaturan Keamanan
              </CardTitle>
              <CardDescription>Kelola keamanan dan akses sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPin">PIN Saat Ini</Label>
                <Input id="currentPin" type="password" placeholder="Masukkan PIN saat ini" />
              </div>
              <div>
                <Label htmlFor="newPin">PIN Baru</Label>
                <Input id="newPin" type="password" placeholder="Masukkan PIN baru" />
              </div>
              <div>
                <Label htmlFor="confirmPin">Konfirmasi PIN Baru</Label>
                <Input id="confirmPin" type="password" placeholder="Konfirmasi PIN baru" />
              </div>
              <Button className="bg-red-600 hover:bg-red-700">Update PIN</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Pengaturan Sistem
              </CardTitle>
              <CardDescription>Konfigurasi sistem dan performa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoBackup">Auto Backup</Label>
                    <p className="text-sm text-gray-600">Backup otomatis data harian</p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={systemSettings.autoBackup}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoBackup: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-gray-600">Mode pemeliharaan sistem</p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, maintenanceMode: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analyticsEnabled">Analytics</Label>
                    <p className="text-sm text-gray-600">Aktifkan analitik sistem</p>
                  </div>
                  <Switch
                    id="analyticsEnabled"
                    checked={systemSettings.analyticsEnabled}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, analyticsEnabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Integrasi & Koneksi
              </CardTitle>
              <CardDescription>Kelola integrasi dengan layanan eksternal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Printer Bluetooth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge className="bg-green-100 text-green-800">Terhubung</Badge>
                      <p className="text-sm text-gray-600">Canon PIXMA TS3340</p>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Kelola Printer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Cloud Backup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge className="bg-blue-100 text-blue-800">Aktif</Badge>
                      <p className="text-sm text-gray-600">Google Drive</p>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Konfigurasi
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
