"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Clock, CheckCircle, XCircle, Calendar, Eye, MapPin, Camera,
  Timer, Settings, Trash2, Download, Users, TrendingUp, RefreshCw,
  Activity, Shield, ChevronRight, Filter, Grid3X3, LayoutList,
  Star, Zap, AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { toast } from "@/hooks/use-toast"
import { supabase, getEmployeeAttendanceWithPhotos, getEmployeePhotos } from "@/lib/supabase"
import type { User, Attendance } from "@/lib/supabase"

// Alias untuk konsistensi kode lama — ditambah field avatar
type Employee = User & { avatar?: string }

// Extended Attendance dengan relasi branches
interface AttendanceWithDetails extends Attendance {
  branches?: { id?: string; name: string; shifts?: any } | null
  shift_type: string
  status: string
}

interface KontrolPresensiProps {
  employees: Employee[]
}

interface PhotoItem {
  id: string
  attendanceId: string
  photoUrl: string
  photoType: 'check_in' | 'check_out'
  date: string
  time: string
  branchName: string
  shiftType: string
}

// ─── Status helpers ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; ring: string }> = {
  checked_in:  { label: "Sedang Bekerja", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",  dot: "bg-emerald-500 animate-pulse", ring: "ring-emerald-400/40" },
  checked_out: { label: "Selesai Kerja",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",        dot: "bg-blue-500",                  ring: "ring-blue-400/40"    },
  on_break:    { label: "Istirahat",      color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",      dot: "bg-amber-500",                 ring: "ring-amber-400/40"   },
  absent:      { label: "Tidak Hadir",   color: "text-red-700",     bg: "bg-red-50 border-red-200",          dot: "bg-red-500",                   ring: "ring-red-400/40"     },
}

const SHIFT_LABELS: Record<string, { label: string; time: string }> = {
  pagi:  { label: "Shift Pagi",  time: "08:00 – 16:00" },
  siang: { label: "Shift Siang", time: "12:00 – 20:00" },
  malam: { label: "Shift Malam", time: "20:00 – 04:00" },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "text-gray-700", bg: "bg-gray-50 border-gray-200", dot: "bg-gray-400", ring: "" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function ShiftBadge({ shift }: { shift: string }) {
  const s = SHIFT_LABELS[shift]
  if (!s) return <span className="text-xs text-gray-400">Shift tidak diset</span>
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
      <Clock className="w-3 h-3" />
      {s.label} · {s.time}
    </span>
  )
}

function formatTime(t?: string | null) {
  if (!t) return "—"
  return t.substring(0, 5)
}

function AttendanceRing({ rate }: { rate: number }) {
  const radius = 20
  const circ = 2 * Math.PI * radius
  const offset = circ - (rate / 100) * circ
  const color = rate >= 85 ? "#10b981" : rate >= 60 ? "#f59e0b" : "#ef4444"
  return (
    <svg width="56" height="56" className="rotate-[-90deg]">
      <circle cx="28" cy="28" r={radius} strokeWidth="5" className="stroke-gray-200 fill-none" />
      <circle
        cx="28" cy="28" r={radius} strokeWidth="5" fill="none"
        stroke={color} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="28" y="32" textAnchor="middle" className="fill-gray-800" style={{ fontSize: 11, fontWeight: 700, transform: "rotate(90deg)", transformOrigin: "28px 28px" }}>
        {rate}%
      </text>
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function KontrolPresensi({ employees }: KontrolPresensiProps) {
  const [attendanceData, setAttendanceData]       = useState<Record<string, any>>({})
  const [loading, setLoading]                     = useState(true)
  const [refreshing, setRefreshing]               = useState(false)

  // Photo viewer
  const [viewEmployee, setViewEmployee]           = useState<Employee | null>(null)
  const [employeePhotos, setEmployeePhotos]       = useState<AttendanceWithDetails[]>([])
  const [photosLoading, setPhotosLoading]         = useState(false)
  const [isViewOpen, setIsViewOpen]               = useState(false)

  // Photo manager
  const [managerOpen, setManagerOpen]             = useState(false)
  const [managerEmployeeId, setManagerEmployeeId] = useState<string | null>(null)
  const [managerEmployeeName, setManagerEmployeeName] = useState("")
  const [photos, setPhotos]                       = useState<PhotoItem[]>([])
  const [selectedPhotos, setSelectedPhotos]       = useState<Set<string>>(new Set())
  const [deleting, setDeleting]                   = useState(false)
  const [previewPhoto, setPreviewPhoto]           = useState<PhotoItem | null>(null)
  const [viewMode, setViewMode]                   = useState<'grid' | 'list'>('grid')

  // ── Load attendance data ────────────────────────────────────────────────────
  const loadAttendanceData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)

    const map: Record<string, any> = {}
    await Promise.all(
      employees.map(async (emp) => {
        try {
          map[emp.id] = await getEmployeeAttendanceWithPhotos(emp.id, 30)
        } catch {
          map[emp.id] = { data: [], attendanceRate: 0, presentDays: 0, lateDays: 0, totalWorkDays: 0, overtimeHours: 0 }
        }
      })
    )
    setAttendanceData(map)
    setLoading(false)
    setRefreshing(false)
  }, [employees])

  const loadEmployeePhotos = async (emp: Employee) => {
    setViewEmployee(emp)
    setIsViewOpen(true)
    setPhotosLoading(true)
    try {
      const result = await getEmployeeAttendanceWithPhotos(emp.id, 20)
      setEmployeePhotos(result.data.filter((r: AttendanceWithDetails) => r.check_in_photo || r.check_out_photo))
    } catch {
      toast({ title: "Error", description: "Gagal memuat foto presensi", variant: "destructive" })
    } finally {
      setPhotosLoading(false)
    }
  }

  // ── Photo Manager ───────────────────────────────────────────────────────────
  const loadPhotoManager = async (userId: string) => {
    try {
      const { data, error } = await getEmployeePhotos(userId)
      if (!error && data) {
        const items: PhotoItem[] = []
        data.forEach((att: AttendanceWithDetails) => {
          if (att.check_in_photo)
            items.push({ id: `${att.id}_ci`, attendanceId: att.id, photoUrl: att.check_in_photo, photoType: 'check_in',  date: att.date, time: att.check_in_time  || '', branchName: att.branches?.name || 'Cabang Tidak Diketahui', shiftType: att.shift_type })
          if (att.check_out_photo)
            items.push({ id: `${att.id}_co`, attendanceId: att.id, photoUrl: att.check_out_photo, photoType: 'check_out', date: att.date, time: att.check_out_time || '', branchName: att.branches?.name || 'Cabang Tidak Diketahui', shiftType: att.shift_type })
        })
        setPhotos(items)
      }
    } catch {
      toast({ title: "Error", description: "Gagal memuat foto", variant: "destructive" })
    }
  }

  const openManager = (id: string, name: string) => {
    setManagerEmployeeId(id)
    setManagerEmployeeName(name)
    setManagerOpen(true)
    loadPhotoManager(id)
  }

  const closeManager = () => {
    setManagerOpen(false)
    setManagerEmployeeId(null)
    setManagerEmployeeName("")
    setPhotos([])
    setSelectedPhotos(new Set())
    setPreviewPhoto(null)
  }

  const togglePhoto = (pid: string) => {
    const s = new Set(selectedPhotos)
    s.has(pid) ? s.delete(pid) : s.add(pid)
    setSelectedPhotos(s)
  }

  const toggleAll = () =>
    selectedPhotos.size === photos.length ? setSelectedPhotos(new Set()) : setSelectedPhotos(new Set(photos.map(p => p.id)))

  const deleteSelected = async () => {
    if (!selectedPhotos.size) return
    setDeleting(true)
    try {
      const toDelete = photos.filter(p => selectedPhotos.has(p.id))
      for (const ph of toDelete) {
        const field = ph.photoType === 'check_in' ? { check_in_photo: null } : { check_out_photo: null }
        await supabase.from('attendance').update(field).eq('id', ph.attendanceId)
      }
      if (managerEmployeeId) await loadPhotoManager(managerEmployeeId)
      setSelectedPhotos(new Set())
      loadAttendanceData(true)
      toast({ title: "Berhasil", description: `${toDelete.length} foto berhasil dihapus` })
    } catch {
      toast({ title: "Error", description: "Gagal menghapus foto", variant: "destructive" })
    } finally { setDeleting(false) }
  }

  const deleteSingle = async (ph: PhotoItem) => {
    setDeleting(true)
    try {
      const field = ph.photoType === 'check_in' ? { check_in_photo: null } : { check_out_photo: null }
      const { error } = await supabase.from('attendance').update(field).eq('id', ph.attendanceId)
      if (error) throw error
      if (managerEmployeeId) await loadPhotoManager(managerEmployeeId)
      loadAttendanceData(true)
      toast({ title: "Berhasil", description: "Foto berhasil dihapus" })
    } catch {
      toast({ title: "Error", description: "Gagal menghapus foto", variant: "destructive" })
    } finally { setDeleting(false) }
  }

  const downloadPhoto = async (url: string, name: string) => {
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.target = '_blank'
      a.click()
      toast({ title: "Berhasil", description: "Foto berhasil diunduh" })
    } catch {
      toast({ title: "Error", description: "Gagal mengunduh foto", variant: "destructive" })
    }
  }

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    loadAttendanceData()
    const sub = supabase
      .channel("attendance-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => loadAttendanceData(true))
      .subscribe()
    return () => { sub.unsubscribe() }
  }, [employees])

  // ── Loading Screen ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-500/30">
            <Clock className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-orange-500 animate-ping opacity-20" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-bold text-gray-800">Memuat Data Presensi</p>
          <p className="text-sm text-gray-500">Mohon tunggu sebentar...</p>
        </div>
        <div className="flex gap-2">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Summary Stats ────────────────────────────────────────────────────────────
  const allData = Object.values(attendanceData)
  const avgRate = allData.length ? Math.round(allData.reduce((s, d) => s + (d.attendanceRate || 0), 0) / allData.length) : 0
  const activeNow = allData.filter(d => d.data?.[0]?.status === 'checked_in').length

  // ── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
        .fade-slide-up { animation: fadeSlideUp .4s ease both; }
        .scale-in { animation: scaleIn .3s ease both; }
        .photo-card:hover .photo-overlay { opacity:1 !important; }
        .photo-card:hover img { transform:scale(1.06); }
        .stat-card { transition: box-shadow .2s, transform .2s; }
        .stat-card:hover { box-shadow: 0 8px 32px -8px rgba(0,0,0,.12); transform: translateY(-2px); }
        .emp-card { transition: box-shadow .25s, transform .25s; }
        .emp-card:hover { box-shadow: 0 12px 40px -10px rgba(0,0,0,.13); transform: translateY(-1px); }
      `}</style>

      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-orange-600 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-red-500/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Kontrol Presensi</h1>
              <p className="text-red-100 text-sm mt-0.5">Monitor real-time kehadiran & foto karyawan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
              <Activity className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-bold">{activeNow} Aktif</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
              <Users className="w-4 h-4 text-blue-200" />
              <span className="text-sm font-bold">{employees.length} Karyawan</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => loadAttendanceData(true)}
              disabled={refreshing}
              className="bg-white/15 border border-white/20 text-white hover:bg-white/25 rounded-xl w-10 h-10 p-0 flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: TrendingUp, label: "Rata-rata Kehadiran", value: `${avgRate}%`, color: "from-white/10 to-white/5" },
            { icon: Users,      label: "Total Karyawan",      value: employees.length, color: "from-white/10 to-white/5" },
            { icon: CheckCircle, label: "Aktif Hari Ini",     value: activeNow,        color: "from-white/10 to-white/5" },
            { icon: Zap,        label: "Data Diperbarui",     value: "Live",           color: "from-white/10 to-white/5" },
          ].map((k, i) => (
            <div key={i} className={`bg-gradient-to-br ${k.color} backdrop-blur-sm border border-white/15 rounded-xl p-3 md:p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <k.icon className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70 font-medium">{k.label}</span>
              </div>
              <div className="text-xl md:text-2xl font-black text-white">{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Employee Cards ── */}
      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-700 mb-2">Belum ada karyawan</p>
          <p className="text-gray-500 max-w-sm">Tambahkan data karyawan ke database untuk mulai menggunakan fitur ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {employees.map((emp, idx) => {
            const att = attendanceData[emp.id] || { attendanceRate: 0, presentDays: 0, lateDays: 0, totalWorkDays: 0, overtimeHours: 0, data: [] }
            const latest: AttendanceWithDetails | undefined = att.data?.[0]
            const rate: number = att.attendanceRate ?? 0
            const rateColor = rate >= 85 ? "text-emerald-600" : rate >= 60 ? "text-amber-600" : "text-red-600"

            return (
              <div key={emp.id} className="emp-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden fade-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                {/* Card top accent */}
                <div className="h-1 bg-gradient-to-r from-red-500 via-orange-400 to-amber-400" />

                <div className="p-5 md:p-6">
                  {/* Employee header row */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-14 h-14 ring-2 ring-gray-100 shadow-md">
                          <AvatarImage src={emp.avatar || "/images/pigtown-logo.png"} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold text-lg">
                            {emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0,2)}
                          </AvatarFallback>
                        </Avatar>
                        {latest?.status === 'checked_in' && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 text-base md:text-lg leading-tight truncate">{emp.name}</p>
                        <p className="text-sm text-gray-500 truncate">{emp.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {latest && <StatusPill status={latest.status} />}
                          {latest?.branches && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                              <MapPin className="w-3 h-3" />
                              {latest.branches.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Attendance ring */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <AttendanceRing rate={rate} />
                      <span className={`text-xs font-bold mt-1 ${rateColor}`}>Kehadiran</span>
                    </div>
                  </div>

                  {/* Shift info */}
                  {latest && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <ShiftBadge shift={latest.shift_type} />
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(latest.date), "EEEE, d MMM yyyy", { locale: id })}
                      </span>
                    </div>
                  )}

                  {/* Check-in / Check-out times */}
                  {latest && (
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Masuk</p>
                        <p className="text-sm font-black text-emerald-700">{formatTime(latest.check_in_time)}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">Keluar</p>
                        <p className="text-sm font-black text-blue-700">{formatTime(latest.check_out_time)}</p>
                      </div>
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide mb-1">Durasi</p>
                        <p className="text-sm font-black text-orange-700">
                          {latest.total_hours ? `${(latest.total_hours as number).toFixed(1)}j` : "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {[
                      { icon: CheckCircle, val: att.presentDays,   label: "Hadir",       c: "text-emerald-600 bg-emerald-50" },
                      { icon: XCircle,     val: att.lateDays,      label: "Terlambat",   c: "text-red-600 bg-red-50"         },
                      { icon: Timer,       val: att.overtimeHours, label: "Lembur (j)",  c: "text-blue-600 bg-blue-50"       },
                      { icon: Calendar,    val: att.totalWorkDays, label: "Total Hari",  c: "text-orange-600 bg-orange-50"   },
                    ].map((s, i) => (
                      <div key={i} className={`stat-card rounded-xl p-2.5 border border-gray-100 text-center ${s.c.split(' ')[1]}`}>
                        <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.c.split(' ')[0]}`} />
                        <p className={`text-lg font-black ${s.c.split(' ')[0]}`}>{s.val}</p>
                        <p className="text-[10px] text-gray-500 font-medium leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent photos thumbnail strip */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-red-500" />
                        Foto Presensi Terbaru
                      </p>
                      <span className="text-xs text-gray-400">30 hari terakhir</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {(att.data?.slice(0, 4) ?? []).map((rec: AttendanceWithDetails, i: number) => (
                        <div key={rec.id || i} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => loadEmployeePhotos(emp)}>
                          {rec.check_in_photo || rec.check_out_photo ? (
                            <>
                              <img
                                src={rec.check_in_photo || rec.check_out_photo!}
                                alt={`Presensi ${rec.date}`}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1 py-1">
                                <p className="text-[9px] font-bold text-white text-center">
                                  {format(new Date(rec.date), "dd/MM")}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                              <Camera className="w-5 h-5 text-gray-300" />
                              <span className="text-[9px] text-gray-400 mt-0.5">
                                {format(new Date(rec.date), "dd/MM")}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {(att.data?.length ?? 0) === 0 && (
                        <div className="col-span-4 py-6 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <Camera className="w-7 h-7 text-gray-300 mb-1" />
                          <p className="text-xs text-gray-400">Belum ada foto</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 text-sm border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors rounded-xl h-9"
                      onClick={() => loadEmployeePhotos(emp)}
                    >
                      <Eye className="w-4 h-4" />
                      Lihat Semua Foto
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-2 text-sm bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white rounded-xl h-9 shadow-sm shadow-red-500/20"
                      onClick={() => openManager(emp.id, emp.name)}
                    >
                      <Settings className="w-4 h-4" />
                      Kelola Foto
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          PHOTO VIEWER DIALOG
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isViewOpen} onOpenChange={(o) => { if (!o) { setIsViewOpen(false); setViewEmployee(null); setEmployeePhotos([]) } }}>
        <DialogContent className="w-[96vw] max-w-5xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5 text-white">
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <Camera className="w-6 h-6" />
              Foto Presensi — {viewEmployee?.name}
            </DialogTitle>
            <DialogDescription className="text-red-100 text-sm mt-0.5">
              Riwayat foto check-in dan check-out karyawan (30 hari terakhir)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-gray-50">
            {photosLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Memuat foto...</p>
              </div>
            ) : employeePhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-lg font-bold text-gray-600">Belum ada foto presensi</p>
                <p className="text-sm text-gray-400">Foto akan muncul setelah karyawan melakukan check-in</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {employeePhotos.map((rec) => (
                  <div key={rec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scale-in hover:shadow-md transition-shadow">
                    {/* Photos pair */}
                    <div className="grid grid-cols-2 h-40">
                      <div className="relative bg-gray-100 overflow-hidden">
                        {rec.check_in_photo
                          ? <img src={rec.check_in_photo} alt="Check-in" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center bg-gray-50"><Camera className="w-8 h-8 text-gray-300" /></div>}
                        <div className="absolute bottom-0 inset-x-0 bg-emerald-600/85 text-white text-[10px] font-bold text-center py-1 tracking-wider">MASUK</div>
                      </div>
                      <div className="relative bg-gray-100 overflow-hidden border-l border-gray-100">
                        {rec.check_out_photo
                          ? <img src={rec.check_out_photo} alt="Check-out" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center bg-gray-50"><Camera className="w-8 h-8 text-gray-300" /></div>}
                        <div className="absolute bottom-0 inset-x-0 bg-blue-600/85 text-white text-[10px] font-bold text-center py-1 tracking-wider">KELUAR</div>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <p className="font-bold text-sm text-gray-800">
                        {format(new Date(rec.date), "EEEE, dd MMM yyyy", { locale: id })}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span className="truncate">{rec.branches?.name || '—'}</span>
                      </div>
                      <ShiftBadge shift={rec.shift_type} />
                      <div className="flex items-center justify-between pt-1">
                        <StatusPill status={rec.status} />
                        <div className="flex gap-2 text-xs font-bold">
                          <span className="text-emerald-600">{formatTime(rec.check_in_time)}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-blue-600">{formatTime(rec.check_out_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════
          PHOTO MANAGER DIALOG
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={managerOpen} onOpenChange={(o) => { if (!o) closeManager() }}>
        <DialogContent className="w-[96vw] max-w-6xl h-[92vh] max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-2xl border-0 shadow-2xl">
          {/* Header */}
          <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-xl font-black flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  Manajemen Foto — {managerEmployeeName}
                </DialogTitle>
                <DialogDescription className="text-red-100 text-sm mt-1">
                  Kelola foto presensi · hapus individual atau massal
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="bg-white/15 text-white hover:bg-white/25 border border-white/20 rounded-xl h-9 px-3"
                >
                  {viewMode === 'grid' ? <LayoutList className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Toolbar */}
          <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={photos.length > 0 && selectedPhotos.size === photos.length}
                    onCheckedChange={toggleAll}
                    className="w-4.5 h-4.5"
                  />
                  <label htmlFor="select-all" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                    Pilih Semua
                  </label>
                </div>
                {selectedPhotos.size > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 font-bold px-2.5 py-1 text-xs animate-bounce">
                    {selectedPhotos.size} dipilih
                  </Badge>
                )}
                <span className="text-xs text-gray-400 font-medium">{photos.length} total foto</span>
              </div>
              {selectedPhotos.size > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl h-9 px-4 text-sm shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Menghapus..." : `Hapus ${selectedPhotos.size} Foto`}
                </Button>
              )}
            </div>
          </div>

          {/* Photo Grid / List */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-gray-50">
            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-lg font-bold text-gray-600">Belum ada foto presensi</p>
                <p className="text-sm text-gray-400">Belum ada foto yang tersedia untuk karyawan ini</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {photos.map((ph, i) => (
                  <div
                    key={ph.id}
                    className="photo-card group relative rounded-2xl overflow-visible scale-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-2 left-2 z-20">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-0.5 shadow-md">
                        <Checkbox
                          checked={selectedPhotos.has(ph.id)}
                          onCheckedChange={() => togglePhoto(ph.id)}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>

                    {/* Type badge */}
                    <div className="absolute top-2 right-2 z-20">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${ph.photoType === 'check_in' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                        {ph.photoType === 'check_in' ? 'MASUK' : 'KELUAR'}
                      </span>
                    </div>

                    {/* Photo */}
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm cursor-pointer" onClick={() => setPreviewPhoto(ph)}>
                      <img
                        src={ph.photoUrl}
                        alt={`${ph.photoType} ${ph.date}`}
                        className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
                      />
                    </div>

                    {/* Overlay actions */}
                    <div className="photo-overlay absolute inset-0 rounded-2xl bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 transition-opacity duration-300 flex items-end justify-center pb-3 gap-2 pointer-events-none group-hover:pointer-events-auto">
                      <button onClick={() => setPreviewPhoto(ph)} className="w-8 h-8 bg-white/90 rounded-xl flex items-center justify-center hover:bg-white shadow-lg transition-transform hover:scale-110">
                        <Eye className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                      <button onClick={() => downloadPhoto(ph.photoUrl, `${managerEmployeeName}_${ph.photoType}_${ph.date}.jpg`)} className="w-8 h-8 bg-white/90 rounded-xl flex items-center justify-center hover:bg-white shadow-lg transition-transform hover:scale-110">
                        <Download className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                      <button onClick={() => deleteSingle(ph)} disabled={deleting} className="w-8 h-8 bg-red-500/90 rounded-xl flex items-center justify-center hover:bg-red-500 shadow-lg transition-transform hover:scale-110 disabled:opacity-50">
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>

                    {/* Info below */}
                    <div className="mt-2 px-0.5">
                      <p className="text-xs font-bold text-gray-700 truncate">{format(new Date(ph.date), "dd MMM yyyy", { locale: id })}</p>
                      <p className="text-[11px] text-gray-500">{formatTime(ph.time)} · {ph.branchName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {photos.map((ph, i) => (
                  <div key={ph.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:shadow-sm transition-shadow fade-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                    <Checkbox checked={selectedPhotos.has(ph.id)} onCheckedChange={() => togglePhoto(ph.id)} className="flex-shrink-0" />
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setPreviewPhoto(ph)}>
                      <img src={ph.photoUrl} alt={ph.photoType} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${ph.photoType === 'check_in' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                          {ph.photoType === 'check_in' ? 'MASUK' : 'KELUAR'}
                        </span>
                        <p className="text-sm font-bold text-gray-800">{format(new Date(ph.date), "dd MMM yyyy", { locale: id })}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{formatTime(ph.time)} · {ph.branchName} · {SHIFT_LABELS[ph.shiftType]?.label || ph.shiftType}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setPreviewPhoto(ph)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <Eye className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button onClick={() => downloadPhoto(ph.photoUrl, `${managerEmployeeName}_${ph.photoType}_${ph.date}.jpg`)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <Download className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button onClick={() => deleteSingle(ph)} disabled={deleting} className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════
          PHOTO PREVIEW DIALOG
      ════════════════════════════════════════════════════════════════════════ */}
      {previewPhoto && (
        <Dialog open={!!previewPhoto} onOpenChange={(o) => { if (!o) setPreviewPhoto(null) }}>
          <DialogContent className="w-[92vw] max-w-3xl h-auto max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-red-600 to-orange-600 px-5 py-4 text-white">
              <DialogTitle className="text-lg font-black">
                Preview Foto — {format(new Date(previewPhoto.date), "dd MMM yyyy", { locale: id })}
              </DialogTitle>
              <DialogDescription className="text-red-100 text-sm mt-0.5">
                {previewPhoto.photoType === 'check_in' ? 'Foto Check-in' : 'Foto Check-out'} · {formatTime(previewPhoto.time)}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto bg-gray-50">
              <div className="p-5 space-y-4">
                <div className="flex justify-center bg-white rounded-2xl p-3 border border-gray-100 shadow-inner">
                  <img
                    src={previewPhoto.photoUrl}
                    alt="Preview"
                    className="max-w-full max-h-[52vh] object-contain rounded-xl shadow-lg"
                  />
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="font-medium">{previewPhoto.branchName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="font-medium">{format(new Date(previewPhoto.date), "dd MMM yyyy", { locale: id })} · {formatTime(previewPhoto.time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <ShiftBadge shift={previewPhoto.shiftType} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Activity className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${previewPhoto.photoType === 'check_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {previewPhoto.photoType === 'check_in' ? 'Foto Masuk' : 'Foto Keluar'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 rounded-xl h-10 text-sm border-gray-200 hover:border-gray-300"
                      onClick={() => downloadPhoto(previewPhoto.photoUrl, `${managerEmployeeName}_${previewPhoto.photoType}_${previewPhoto.date}.jpg`)}
                    >
                      <Download className="w-4 h-4" />
                      Unduh Foto
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2 rounded-xl h-10 text-sm bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-sm"
                      onClick={() => { deleteSingle(previewPhoto); setPreviewPhoto(null) }}
                      disabled={deleting}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting ? "Menghapus..." : "Hapus Foto"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
