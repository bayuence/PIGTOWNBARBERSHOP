"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Clock, CheckCircle, XCircle, Camera, Timer, Settings,
  Trash2, Download, Eye, MapPin, Calendar, RefreshCw,
  Activity, TrendingUp, LayoutGrid, LayoutList, Users,
  ChevronLeft, ChevronRight, CalendarDays, List
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { toast } from "@/hooks/use-toast"
import { supabase, getEmployeeAttendanceWithPhotos, getEmployeePhotos } from "@/lib/supabase"
import type { User, Attendance } from "@/lib/supabase"
import { BranchShift, calculateLateSeconds, formatLateDuration, getLiveShiftTimes, formatDetailedTime, formatSeconds, formatBreakTime, resolveEffectiveStatus } from "@/lib/attendance-utils"

type Employee = User & { avatar?: string }

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

// ── helpers ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  checked_in:  { label: "Sedang Bekerja", dot: "bg-emerald-500 animate-pulse", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  checked_out: { label: "Selesai Kerja",  dot: "bg-blue-500",                  text: "text-blue-700",    bg: "bg-blue-50 border-blue-200"     },
  on_break:    { label: "Istirahat",      dot: "bg-amber-500",                 text: "text-amber-700",   bg: "bg-amber-50 border-amber-200"   },
  absent:      { label: "Tidak Hadir",   dot: "bg-red-500",                   text: "text-red-700",     bg: "bg-red-50 border-red-200"       },
}

const SHIFT_MAP: Record<string, string> = {
  pagi:  "Pagi  08:00–16:00",
  siang: "Siang 12:00–20:00",
  malam: "Malam 20:00–04:00",
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, dot: "bg-gray-400", text: "text-gray-700", bg: "bg-gray-50 border-gray-200" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  )
}

function fmt(t?: string | null) {
  return t ? t.substring(0, 5) : "—"
}

type Tab = "overview" | "photos" | "history"

// ═══════════════════════════════════════════════════════════════════════════
//  Main component — designed as a MODAL-NATIVE widget
// ═══════════════════════════════════════════════════════════════════════════
export function KontrolPresensi({ employees }: KontrolPresensiProps) {
  const employee = employees[0]            // always single employee in modal context
  const [tab, setTab]               = useState<Tab>("overview")
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [attData, setAttData]       = useState<any>(null)

  // Photo viewer state
  const [photos, setPhotos]               = useState<PhotoItem[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [deleting, setDeleting]           = useState(false)
  const [previewPhoto, setPreviewPhoto]   = useState<PhotoItem | null>(null)
  const [viewMode, setViewMode]           = useState<'grid' | 'list'>('grid')

  // Calendar / history state
  const [historyViewMode, setHistoryViewMode] = useState<'calendar' | 'list'>('calendar')
  
  const [allBranchShifts, setAllBranchShifts] = useState<BranchShift[]>([])
  const [timeTrigger, setTimeTrigger] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTimeTrigger(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    supabase.from('branch_shifts').select('*').eq('is_active', true).then(({ data }) => {
      if (data) {
        // Map raw DB columns to BranchShift interface (sama dengan attendance-system.tsx)
        const mapped = data.map((shift: any) => ({
          id: shift.id,
          name: shift.shift_name || shift.name,
          start_time: shift.start_time,
          end_time: shift.end_time,
          type: shift.shift_type,          // mapping kolom shift_type → type
          startTime: shift.start_time,
          endTime: shift.end_time,
          branch_id: shift.branch_id,
          break_times: shift.break_times || [],
        }))
        setAllBranchShifts(mapped)
      }
    })
  }, [])
  const [calendarMonth, setCalendarMonth]     = useState<Date>(new Date())
  const [calendarData, setCalendarData]       = useState<AttendanceWithDetails[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [selectedDay, setSelectedDay]         = useState<AttendanceWithDetails | null>(null)

  // ── load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async (quiet = false) => {
    if (!employee) return
    quiet ? setRefreshing(true) : setLoading(true)
    try {
      const result = await getEmployeeAttendanceWithPhotos(employee.id, 30)
      setAttData(result)
    } catch {
      toast({ title: "Error", description: "Gagal memuat data presensi", variant: "destructive" })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [employee?.id])

  const fetchMonthAttendance = useCallback(async (monthDate: Date) => {
    if (!employee) return
    setCalendarLoading(true)
    try {
      const year  = monthDate.getFullYear()
      const month = monthDate.getMonth()
      const from  = new Date(year, month, 1).toISOString()
      const to    = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      const { data, error } = await supabase
        .from('attendance')
        .select(`*, branches:branch_id (id, name)`)
        .eq('user_id', employee.id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true })
      if (error) throw error
      setCalendarData(data || [])
      setSelectedDay(null)
    } catch {
      toast({ title: "Error", description: "Gagal memuat riwayat bulan ini", variant: "destructive" })
    } finally {
      setCalendarLoading(false)
    }
  }, [employee?.id])

  const loadPhotos = useCallback(async () => {
    if (!employee) return
    try {
      const { data, error } = await getEmployeePhotos(employee.id)
      if (!error && data) {
        const items: PhotoItem[] = []
        data.forEach((att: AttendanceWithDetails) => {
          if (att.check_in_photo)
            items.push({ id: `${att.id}_ci`, attendanceId: att.id, photoUrl: att.check_in_photo!, photoType: 'check_in',  date: att.date, time: att.check_in_time  || '', branchName: att.branches?.name || '—', shiftType: att.shift_type })
          if (att.check_out_photo)
            items.push({ id: `${att.id}_co`, attendanceId: att.id, photoUrl: att.check_out_photo!, photoType: 'check_out', date: att.date, time: att.check_out_time || '', branchName: att.branches?.name || '—', shiftType: att.shift_type })
        })
        setPhotos(items)
      }
    } catch {
      toast({ title: "Error", description: "Gagal memuat foto", variant: "destructive" })
    }
  }, [employee?.id])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (tab === "photos") loadPhotos() }, [tab])
  useEffect(() => { if (tab === "history") fetchMonthAttendance(calendarMonth) }, [tab, calendarMonth, fetchMonthAttendance])

  // ── real-time ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = supabase
      .channel(`att-${employee?.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => load(true))
      .subscribe()
    return () => { sub.unsubscribe() }
  }, [employee?.id])

  // ── photo actions ──────────────────────────────────────────────────────────
  const togglePhoto = (pid: string) => {
    const s = new Set(selectedPhotos)
    s.has(pid) ? s.delete(pid) : s.add(pid)
    setSelectedPhotos(s)
  }
  const toggleAll = () =>
    selectedPhotos.size === photos.length ? setSelectedPhotos(new Set()) : setSelectedPhotos(new Set(photos.map(p => p.id)))

  const deleteSingle = async (ph: PhotoItem) => {
    setDeleting(true)
    try {
      const field = ph.photoType === 'check_in' ? { check_in_photo: null } : { check_out_photo: null }
      await supabase.from('attendance').update(field).eq('id', ph.attendanceId)
      await loadPhotos()
      await load(true)
      toast({ title: "Berhasil", description: "Foto dihapus" })
    } catch { toast({ title: "Error", description: "Gagal menghapus foto", variant: "destructive" }) }
    finally { setDeleting(false) }
  }

  const deleteSelected = async () => {
    setDeleting(true)
    try {
      for (const ph of photos.filter(p => selectedPhotos.has(p.id))) {
        const field = ph.photoType === 'check_in' ? { check_in_photo: null } : { check_out_photo: null }
        await supabase.from('attendance').update(field).eq('id', ph.attendanceId)
      }
      setSelectedPhotos(new Set())
      await loadPhotos()
      await load(true)
      toast({ title: "Berhasil", description: `${selectedPhotos.size} foto dihapus` })
    } catch { toast({ title: "Error", description: "Gagal menghapus foto", variant: "destructive" }) }
    finally { setDeleting(false) }
  }

  const downloadPhoto = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url; a.download = name; a.target = '_blank'; a.click()
    toast({ title: "Berhasil", description: "Foto diunduh" })
  }

  // ── derived ────────────────────────────────────────────────────────────────
  const latest: AttendanceWithDetails | undefined = attData?.data?.[0]
  const rate    = attData?.attendanceRate ?? 0
  const present = attData?.presentDays    ?? 0
  const late    = attData?.lateDays       ?? 0
  const ot      = attData?.overtimeHours  ?? 0
  const total   = attData?.totalWorkDays  ?? 0

  if (!employee) return null

  // ── TABS ───────────────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Ringkasan",    icon: <Activity className="w-3.5 h-3.5" /> },
    { id: "photos",   label: "Foto Presensi", icon: <Camera className="w-3.5 h-3.5"   /> },
    { id: "history",  label: "Riwayat",       icon: <Calendar className="w-3.5 h-3.5" /> },
  ]

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{`
        .kp-tab { transition: all .2s; }
        .kp-tab:hover { background: rgba(239,68,68,.08); }
        .kp-tab.active { background: #dc2626; color: #fff; }
        .kp-photo:hover .kp-overlay { opacity:1 !important; }
        .kp-photo:hover img { transform: scale(1.07); }
      `}</style>

      {/* ── TOP HEADER (compact) ── */}
      <div className="flex-shrink-0 bg-gradient-to-r from-red-600 to-orange-500 px-5 py-4 flex items-center justify-between gap-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <Avatar className="w-12 h-12 ring-2 ring-white/40 shadow-lg">
              <AvatarImage src={employee.avatar || "/images/pigtown-logo.png"} className="object-cover" />
              <AvatarFallback className="bg-white/20 text-white font-bold text-base">
                {employee.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {latest?.status === 'checked_in' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-base leading-tight truncate">{employee.name}</p>
            <p className="text-red-100 text-xs truncate">{employee.email}</p>
            {latest && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <StatusPill status={latest.status} />
                {latest.branches && (
                  <span className="text-[10px] text-red-100 bg-white/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />{latest.branches.name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rate ring + refresh */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/20">
            <span className="text-2xl font-black text-white leading-none">{rate}%</span>
            <span className="text-[10px] text-red-100 mt-0.5">Kehadiran</span>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="w-9 h-9 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl flex items-center justify-center transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── QUICK STATS ROW ── */}
      <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-white">
        {[
          { icon: CheckCircle, val: present, label: "Hadir",     color: "text-emerald-600" },
          { icon: XCircle,     val: late,    label: "Terlambat", color: "text-red-500"     },
          { icon: Timer,       val: ot,      label: "Lembur (j)",color: "text-blue-500"    },
          { icon: Calendar,    val: total,   label: "Total Hari", color: "text-orange-500"  },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center justify-center py-3 px-2 hover:bg-gray-50 transition-colors">
            <s.icon className={`w-4 h-4 mb-1 ${s.color}`} />
            <span className={`text-xl font-black leading-none ${s.color}`}>{s.val}</span>
            <span className="text-[10px] text-gray-400 mt-0.5 text-center leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-white">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`kp-tab flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold ${tab === t.id ? 'active' : 'text-gray-600'}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">

        {/* ── LOADING ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Memuat data...</p>
          </div>
        )}

        {/* ════ TAB: OVERVIEW ════ */}
        {!loading && tab === "overview" && (
          <div className="p-4 md:p-5 space-y-4">
            {/* Today info */}
            {latest ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700">Kehadiran Hari Ini / Terbaru</p>
                  <span className="text-xs text-gray-400">{format(new Date(latest.date), "EEEE, d MMM yyyy", { locale: id })}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const latestDateStr = new Date(latest.date).toISOString().split('T')[0];
                      const live = getLiveShiftTimes(latest, latestDateStr, null, allBranchShifts);
                      const latestShiftData = allBranchShifts.find((s: any) =>
                        String(s.branch_id) === String(latest.branches?.id || latest.branch_id) &&
                        (s.type === latest.shift_type || s.id === latest.shift_type)
                      ) || allBranchShifts.find((s: any) => s.type === latest.shift_type || s.id === latest.shift_type);
                      const effectiveStatus = resolveEffectiveStatus(latest.status, latestDateStr, live.isShiftEnded, latestShiftData?.end_time);
                      return <StatusPill status={effectiveStatus} />;
                    })()}
                    {latest.branches && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        <MapPin className="w-3 h-3" />{latest.branches.name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3" />{SHIFT_MAP[latest.shift_type] || latest.shift_type}
                    </span>
                    {(() => {
                      const shiftData = allBranchShifts.find((s: any) => 
                        String(s.branch_id) === String(latest.branches?.id || latest.branch_id) && 
                        (s.type === latest.shift_type || s.id === latest.shift_type)
                      ) || allBranchShifts.find((s: any) => 
                        (s.type === latest.shift_type || s.id === latest.shift_type)
                      );
                      const lateSecs = calculateLateSeconds(latest.check_in_time ?? null, shiftData?.start_time);
                      return lateSecs > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-md font-semibold">
                          ⏰ Telat {formatLateDuration(lateSecs)}
                          {shiftData?.start_time && ` dari ${shiftData.start_time}`}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Masuk</p>
                      <p className="text-lg font-black text-emerald-700 mt-0.5">{fmt(latest.check_in_time)}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">Keluar</p>
                      <p className="text-lg font-black text-blue-700 mt-0.5">{fmt(latest.check_out_time)}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">Durasi</p>
                      {(() => {
                        const live = getLiveShiftTimes(latest, new Date(latest.date).toISOString().split('T')[0], null, allBranchShifts);
                        return (
                          <div className="mt-0.5">
                            {latest.status === 'on-break' || latest.status === 'on_break' ? (
                                <div className="animate-pulse text-amber-600 font-bold text-sm">
                                  Sedang Istirahat
                                </div>
                            ) : (
                                <p className="text-lg font-black text-orange-700">
                                  {formatDetailedTime(live.workingHours)}
                                </p>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                  {/* Foto preview */}
                  {(latest.check_in_photo || latest.check_out_photo) && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {[
                        { url: latest.check_in_photo,  label: "MASUK",  col: "border-emerald-200 bg-emerald-50" },
                        { url: latest.check_out_photo, label: "KELUAR", col: "border-blue-200 bg-blue-50"       },
                      ].map((ph, i) => (
                        <div key={i} className={`relative aspect-video rounded-xl overflow-hidden border ${ph.col}`}>
                          {ph.url
                            ? <img src={ph.url} alt={ph.label} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Camera className="w-6 h-6 text-gray-300" /></div>}
                          <div className={`absolute bottom-0 inset-x-0 py-1 text-[10px] font-bold text-white text-center tracking-widest ${i === 0 ? 'bg-emerald-600/80' : 'bg-blue-600/80'}`}>{ph.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center gap-2 text-center">
                <Clock className="w-10 h-10 text-gray-200" />
                <p className="font-bold text-gray-500">Belum ada data presensi</p>
                <p className="text-xs text-gray-400">Karyawan belum melakukan check-in</p>
              </div>
            )}

            {/* Photo thumbnail strip */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-red-500" />Foto Terbaru
                </p>
                <button onClick={() => setTab("photos")} className="text-xs text-red-500 hover:text-red-600 font-medium">Lihat semua</button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {(attData?.data ?? []).slice(0, 8).map((rec: AttendanceWithDetails, i: number) => (
                    <div key={rec.id || i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer hover:ring-2 hover:ring-red-400 transition-all" onClick={() => setTab("photos")}>
                      {rec.check_in_photo || rec.check_out_photo ? (
                        <>
                          <img src={rec.check_in_photo || rec.check_out_photo!} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/50 text-[9px] font-bold text-white text-center py-0.5">{format(new Date(rec.date), "dd/MM")}</div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                          <Camera className="w-4 h-4 text-gray-300" />
                          <span className="text-[9px] text-gray-300">{format(new Date(rec.date), "dd/MM")}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {(attData?.data?.length ?? 0) === 0 && (
                    <div className="col-span-4 sm:col-span-6 md:col-span-8 py-6 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400">Belum ada foto presensi</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB: PHOTOS ════ */}
        {!loading && tab === "photos" && (
          <div className="flex flex-col h-full">
            {/* Photos toolbar */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Checkbox id="sel-all" checked={photos.length > 0 && selectedPhotos.size === photos.length} onCheckedChange={toggleAll} className="w-4 h-4" />
                  <label htmlFor="sel-all" className="text-xs font-semibold text-gray-600 cursor-pointer select-none">Pilih Semua</label>
                </div>
                {selectedPhotos.size > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{selectedPhotos.size} dipilih</span>
                )}
                <span className="text-xs text-gray-400">{photos.length} foto</span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedPhotos.size > 0 && (
                  <Button size="sm" variant="destructive" onClick={deleteSelected} disabled={deleting}
                    className="gap-1.5 rounded-xl h-8 px-3 text-xs bg-red-500 hover:bg-red-600">
                    <Trash2 className="w-3.5 h-3.5" />{deleting ? "Menghapus..." : `Hapus ${selectedPhotos.size}`}
                  </Button>
                )}
                <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
                  className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 text-gray-500">
                  {viewMode === 'grid' ? <LayoutList className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Photos content */}
            <div className="flex-1 overflow-y-auto p-4">
              {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-bold text-gray-500">Belum ada foto presensi</p>
                  <p className="text-xs text-gray-400">Foto akan muncul setelah karyawan check-in</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {photos.map((ph, i) => (
                    <div key={ph.id} className="kp-photo group relative">
                      {/* checkbox */}
                      <div className="absolute top-1.5 left-1.5 z-20 bg-white/90 rounded-lg p-0.5 shadow">
                        <Checkbox checked={selectedPhotos.has(ph.id)} onCheckedChange={() => togglePhoto(ph.id)} className="w-3.5 h-3.5" />
                      </div>
                      {/* type badge */}
                      <div className="absolute top-1.5 right-1.5 z-20">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${ph.photoType === 'check_in' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                          {ph.photoType === 'check_in' ? 'IN' : 'OUT'}
                        </span>
                      </div>
                      {/* photo */}
                      <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer shadow-sm" onClick={() => setPreviewPhoto(ph)}>
                        <img src={ph.photoUrl} alt="" className="w-full h-full object-cover transition-transform duration-300" />
                      </div>
                      {/* overlay */}
                      <div className="kp-overlay absolute inset-0 rounded-xl bg-black/60 opacity-0 transition-opacity duration-200 flex items-center justify-center gap-1.5 pointer-events-none group-hover:pointer-events-auto">
                        <button onClick={() => setPreviewPhoto(ph)} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white shadow transition-transform hover:scale-110">
                          <Eye className="w-3 h-3 text-gray-700" />
                        </button>
                        <button onClick={() => downloadPhoto(ph.photoUrl, `${employee.name}_${ph.photoType}_${ph.date}.jpg`)} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white shadow transition-transform hover:scale-110">
                          <Download className="w-3 h-3 text-gray-700" />
                        </button>
                        <button onClick={() => deleteSingle(ph)} disabled={deleting} className="w-7 h-7 bg-red-500/90 rounded-lg flex items-center justify-center hover:bg-red-500 shadow transition-transform hover:scale-110 disabled:opacity-50">
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      {/* info */}
                      <p className="text-[10px] text-gray-500 mt-1 truncate text-center">{format(new Date(ph.date), "dd MMM", { locale: id })} · {fmt(ph.time)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {photos.map(ph => (
                    <div key={ph.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-2.5 hover:shadow-sm transition-shadow">
                      <Checkbox checked={selectedPhotos.has(ph.id)} onCheckedChange={() => togglePhoto(ph.id)} className="flex-shrink-0" />
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-gray-200" onClick={() => setPreviewPhoto(ph)}>
                        <img src={ph.photoUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${ph.photoType === 'check_in' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                            {ph.photoType === 'check_in' ? 'MASUK' : 'KELUAR'}
                          </span>
                          <p className="text-xs font-bold text-gray-700">{format(new Date(ph.date), "dd MMM yyyy", { locale: id })}</p>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{fmt(ph.time)} · {ph.branchName}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setPreviewPhoto(ph)} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <Eye className="w-3 h-3 text-gray-500" />
                        </button>
                        <button onClick={() => downloadPhoto(ph.photoUrl, `${employee.name}_${ph.photoType}_${ph.date}.jpg`)} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <Download className="w-3 h-3 text-gray-500" />
                        </button>
                        <button onClick={() => deleteSingle(ph)} disabled={deleting} className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50">
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ TAB: HISTORY ════ */}
        {!loading && tab === "history" && (() => {
          // ── derived calendar data ──
          const year  = calendarMonth.getFullYear()
          const month = calendarMonth.getMonth()
          const firstDay = new Date(year, month, 1)
          const daysInMonth = new Date(year, month + 1, 0).getDate()
          // Mon=0 … Sun=6
          let startOffset = firstDay.getDay() - 1
          if (startOffset < 0) startOffset = 6

          // Map date-string → attendance record
          const attMap: Record<string, AttendanceWithDetails> = {}
          calendarData.forEach(r => {
            const key = new Date(r.date).toISOString().slice(0, 10)
            attMap[key] = r
          })

          const todayStr = new Date().toISOString().slice(0, 10)

          // Status colour helper
          const dayColor = (rec?: AttendanceWithDetails, dateStr?: string) => {
            if (!rec) return null
            const recDate = (dateStr || rec.date || '').slice(0, 10);
            const eff = resolveEffectiveStatus(rec.status, recDate, false);
            // normalkan ke checked_out (DB style) agar switch case cocok
            const norm = (eff === 'checked-out') ? 'checked_out' : eff;
            switch (norm) {
              case 'checked_out': return { bg: 'bg-emerald-500', ring: 'ring-emerald-400', text: 'text-white', dot: 'bg-emerald-300' }
              case 'checked_in':  return { bg: 'bg-blue-500',    ring: 'ring-blue-400',    text: 'text-white', dot: 'bg-blue-300 animate-pulse' }
              case 'on_break':    return { bg: 'bg-amber-400',   ring: 'ring-amber-400',   text: 'text-white', dot: 'bg-amber-200' }
              case 'absent':      return { bg: 'bg-red-400',     ring: 'ring-red-400',     text: 'text-white', dot: 'bg-red-200' }
              default:            return { bg: 'bg-gray-300',    ring: 'ring-gray-300',    text: 'text-white', dot: 'bg-gray-200' }
            }
          }

          // Monthly stats from calendarData
          const monthPresent = calendarData.filter(r => r.status !== 'absent').length
          const monthTotalHours = calendarData.reduce((s, r) => s + (Number(r.total_hours) || 0), 0)
          const avgHours = monthPresent > 0 ? monthTotalHours / monthPresent : 0
          const monthLate = calendarData.filter((r: any) => r.is_late === true).length

          const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth()

          return (
            <div className="p-3 md:p-4 space-y-3">
              {/* ── toolbar ── */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setHistoryViewMode('calendar')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      historyViewMode === 'calendar'
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" /> Kalender
                  </button>
                  <button
                    onClick={() => setHistoryViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      historyViewMode === 'list'
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> List
                  </button>
                </div>

                {/* Month navigator */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() - 1); setCalendarMonth(d) }}
                    className="w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm min-w-[110px] text-center">
                    <span className="text-xs font-bold text-gray-700">
                      {format(calendarMonth, "MMMM yyyy", { locale: id })}
                    </span>
                  </div>
                  <button
                    onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() + 1); setCalendarMonth(d) }}
                    disabled={isCurrentMonth}
                    className="w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                  {!isCurrentMonth && (
                    <button
                      onClick={() => setCalendarMonth(new Date())}
                      className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors"
                    >
                      Hari Ini
                    </button>
                  )}
                </div>
              </div>

              {calendarLoading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <div className="w-6 h-6 border-3 border-red-200 border-t-red-500 rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Memuat data bulan ini...</span>
                </div>
              ) : historyViewMode === 'calendar' ? (
                <>
                  {/* ── Calendar grid ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-gray-100">
                      {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d, i) => (
                        <div key={d} className={`py-2 text-center text-[10px] font-bold uppercase tracking-wide ${
                          i >= 5 ? 'text-red-400' : 'text-gray-400'
                        }`}>{d}</div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-0">
                      {/* offset blanks */}
                      {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`blank-${i}`} className="aspect-square p-1" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                        const rec = attMap[dateStr]
                        const col = dayColor(rec, dateStr)
                        const isToday = dateStr === todayStr
                        const isSelected = selectedDay?.id === rec?.id && !!rec
                        const dayOfWeek = (startOffset + i) % 7  // 0=Mon…6=Sun
                        const isWeekend = dayOfWeek >= 5

                        return (
                          <div key={day} className="aspect-square p-1">
                            <button
                              onClick={() => rec && setSelectedDay(isSelected ? null : rec)}
                              className={`w-full h-full rounded-xl flex flex-col items-center justify-center transition-all text-[11px] font-bold relative
                                ${col ? `${col.bg} ${col.text} shadow-sm hover:opacity-90 cursor-pointer ${
                                  isSelected ? `ring-2 ${col.ring} ring-offset-1 scale-105` : ''
                                }` : `${
                                  isWeekend ? 'text-red-300' : 'text-gray-400'
                                } hover:bg-gray-50 ${rec ? 'cursor-pointer' : 'cursor-default'}`}
                                ${isToday && !col ? 'ring-2 ring-red-400 ring-offset-1 bg-red-50 text-red-600' : ''}
                              `}
                            >
                              <span className="leading-none">{day}</span>
                              {col && <span className={`w-1 h-1 rounded-full mt-0.5 ${col.dot}`} />}
                              {isToday && !col && <span className="w-1 h-1 rounded-full mt-0.5 bg-red-400" />}
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 border-t border-gray-50 bg-gray-50/50">
                      {[
                        { color: 'bg-emerald-500', label: 'Selesai Kerja' },
                        { color: 'bg-blue-500',    label: 'Sedang Kerja'  },
                        { color: 'bg-amber-400',   label: 'Istirahat'     },
                        { color: 'bg-red-400',     label: 'Absen'         },
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                          <span className="text-[10px] text-gray-500">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Day detail panel ── */}
                  {selectedDay && (() => {
                    const r = selectedDay
                    return (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-slate-50 to-gray-50">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-bold text-gray-700">
                              {format(new Date(r.date), "EEEE, d MMMM yyyy", { locale: id })}
                            </span>
                          </div>
                          <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const recDateStr = new Date(r.date).toISOString().split('T')[0];
                              const live = getLiveShiftTimes(r, recDateStr, null, allBranchShifts);
                              const rShiftData = allBranchShifts.find((s: any) =>
                                String(s.branch_id) === String(r.branches?.id || r.branch_id) &&
                                (s.type === r.shift_type || s.id === r.shift_type)
                              ) || allBranchShifts.find((s: any) => s.type === r.shift_type || s.id === r.shift_type);
                              const effectiveStatus = resolveEffectiveStatus(r.status, recDateStr, live.isShiftEnded, rShiftData?.end_time);
                              return <StatusPill status={effectiveStatus} />;
                            })()}
                            {r.branches && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                <MapPin className="w-3 h-3" />{r.branches.name}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3" />{SHIFT_MAP[r.shift_type] || r.shift_type}
                            </span>
                            {(() => {
                              const shiftData = allBranchShifts.find((s: any) => 
                                String(s.branch_id) === String(r.branches?.id || r.branch_id) && 
                                (s.type === r.shift_type || s.shift_type === r.shift_type || s.id === r.shift_type)
                              ) || allBranchShifts.find((s: any) => 
                                (s.type === r.shift_type || s.shift_type === r.shift_type || s.id === r.shift_type)
                              );
                              const lateSecs = calculateLateSeconds(r.check_in_time ?? null, shiftData?.start_time);
                              return lateSecs > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-md font-semibold">
                                  ⏰ Telat {formatLateDuration(lateSecs)}
                                  {shiftData?.start_time && ` dari ${shiftData.start_time}`}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                              <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Masuk</p>
                              <p className="text-xl font-black text-emerald-700 mt-0.5">{fmt(r.check_in_time)}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">Keluar</p>
                              <p className="text-xl font-black text-blue-700 mt-0.5">{fmt(r.check_out_time)}</p>
                            </div>
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                              <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">Durasi</p>
                              {(() => {
                                const todayStr = format(new Date(), 'yyyy-MM-dd');
                                const recDateStr = new Date(r.date).toISOString().split('T')[0];
                                const isToday = recDateStr === todayStr;
                                const isBreak = r.status === 'on-break' || r.status === 'on_break';
                                
                                if (isToday && !r.check_out_time) {
                                  const live = getLiveShiftTimes(r, recDateStr, null, allBranchShifts);
                                  return (
                                    <div className="mt-0.5">
                                      {isBreak ? (
                                        <span className="text-amber-500 animate-pulse font-bold text-sm">Istirahat</span>
                                      ) : (
                                        <span className="text-xl font-black text-orange-700">{formatDetailedTime(live.workingHours)}</span>
                                      )}
                                    </div>
                                  );
                                }
                                
                                const h = Number(r.total_hours || 0);
                                return <p className="text-xl font-black text-orange-700 mt-0.5">{h > 0 ? formatDetailedTime(h) : '—'}</p>;
                              })()}
                            </div>
                          </div>
                          {(r.check_in_photo || r.check_out_photo) && (
                            <div className="grid grid-cols-2 gap-2">
                              {[{ url: r.check_in_photo, label: 'MASUK', cls: 'border-emerald-200 bg-emerald-50', bar: 'bg-emerald-600/80' },
                                { url: r.check_out_photo, label: 'KELUAR', cls: 'border-blue-200 bg-blue-50', bar: 'bg-blue-600/80' }
                              ].map((ph, i) => (
                                <div key={i} className={`relative aspect-video rounded-xl overflow-hidden border ${ph.cls}`}>
                                  {ph.url
                                    ? <img src={ph.url} alt={ph.label} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><Camera className="w-6 h-6 text-gray-200" /></div>}
                                  <div className={`absolute bottom-0 inset-x-0 py-1 text-[10px] font-bold text-white text-center tracking-widest ${ph.bar}`}>{ph.label}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* ── Monthly stats ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-bold text-gray-700">Ringkasan {format(calendarMonth, "MMMM yyyy", { locale: id })}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-gray-100">
                      {[
                        { label: 'Hari Hadir',       value: `${monthPresent} hari`,                  color: 'text-emerald-600', icon: CheckCircle },
                        { label: 'Total Jam Kerja',   value: `${monthTotalHours.toFixed(1)} jam`,    color: 'text-blue-600',    icon: Clock       },
                        { label: 'Rata-rata/Hari',    value: `${avgHours.toFixed(1)} jam`,           color: 'text-orange-600',  icon: Timer       },
                        { label: 'Hari Terlambat',    value: `${monthLate} hari`,                   color: 'text-red-500',     icon: XCircle     },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                          <s.icon className={`w-5 h-5 ${s.color} flex-shrink-0`} />
                          <div>
                            <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                            <p className={`text-base font-black ${s.color} leading-tight`}>{s.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                // ── LIST VIEW ──
                <div className="space-y-2">
                  {calendarData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Calendar className="w-10 h-10 text-gray-200" />
                      <p className="font-bold text-gray-500">Tidak ada data untuk bulan ini</p>
                      <p className="text-xs text-gray-400">Coba navigasi ke bulan yang berbeda</p>
                    </div>
                  ) : (
                    [...calendarData].reverse().map((rec: AttendanceWithDetails) => {
                      const recDateStr = new Date(rec.date).toISOString().split('T')[0];
                      const todayStr = format(new Date(), 'yyyy-MM-dd');
                      const isToday = recDateStr === todayStr;
                      const isBreak = rec.status === 'on-break' || rec.status === 'on_break';
                      const live = getLiveShiftTimes(rec, recDateStr, null, allBranchShifts);

                      // Cari data shift berdasarkan branch + shift_type
                      const recShiftData = allBranchShifts.find((s: any) =>
                        String(s.branch_id) === String(rec.branch_id) &&
                        (s.type === rec.shift_type || s.shift_type === rec.shift_type)
                      ) || allBranchShifts.find((s: any) =>
                        (s.type === rec.shift_type || s.shift_type === rec.shift_type)
                      );

                      // ATURAN KERAS: berdasarkan data shift nyata (end_time), bukan asumsi jam
                      const effectiveStatus = resolveEffectiveStatus(rec.status, recDateStr, live.isShiftEnded, recShiftData?.end_time);

                      const lateSecs = calculateLateSeconds(rec.check_in_time ?? null, recShiftData?.start_time);

                      let durasiDisplay: React.ReactNode;
                      if (isToday && !rec.check_out_time) {
                        durasiDisplay = isBreak
                          ? <span className="text-amber-500 animate-pulse font-bold text-xs">Istirahat</span>
                          : <span className="font-black text-blue-600">{formatDetailedTime(live.workingHours)}</span>;
                      } else {
                        const h = Number(rec.total_hours || 0);
                        durasiDisplay = <span className="font-black text-gray-800">{h > 0 ? formatDetailedTime(h) : '—'}</span>;
                      }

                      const statusColors: Record<string, string> = {
                        present: 'bg-emerald-500',
                        'on-break': 'bg-amber-400',
                        on_break: 'bg-amber-400',
                        'checked-out': 'bg-blue-500',
                        checked_out: 'bg-blue-500',
                        absent: 'bg-red-400',
                      };
                      const statusDot = statusColors[effectiveStatus] ?? 'bg-gray-300';

                      return (
                        <div key={rec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                          {/* ── Header Row ── */}
                          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-50">
                            <div className="flex items-center gap-2.5">
                              {/* Date badge */}
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 border border-red-100 flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-red-400 uppercase leading-none tracking-wider">
                                  {format(new Date(rec.date), "MMM", { locale: id })}
                                </span>
                                <span className="text-sm font-black text-red-600 leading-tight">
                                  {format(new Date(rec.date), "dd")}
                                </span>
                              </div>
                              {/* Status & Branch */}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
                                  <StatusPill status={effectiveStatus} />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {rec.branches?.name && <span className="font-medium">{rec.branches.name}</span>}
                                  {rec.branches?.name && ' · '}
                                  {SHIFT_MAP[rec.shift_type] || rec.shift_type}
                                </p>
                              </div>
                            </div>
                            {/* Late badge */}
                            {lateSecs > 0 && (
                              <div className="flex-shrink-0 inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 rounded-lg px-2 py-1">
                                <span className="text-xs">⏰</span>
                                <div className="text-right">
                                  <p className="text-[9px] text-red-400 font-semibold uppercase leading-none">Telat</p>
                                  <p className="text-xs font-black text-red-600 leading-tight">{formatLateDuration(lateSecs)}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ── Time Grid ── */}
                          <div className="grid grid-cols-3 divide-x divide-gray-50">
                            <div className="px-4 py-2.5 text-center">
                              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Masuk</p>
                              <p className="text-sm font-black text-emerald-600">{fmt(rec.check_in_time)}</p>
                            </div>
                            <div className="px-4 py-2.5 text-center">
                              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Keluar</p>
                              <p className="text-sm font-black text-blue-600">{fmt(rec.check_out_time)}</p>
                            </div>
                            <div className="px-4 py-2.5 text-center">
                              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Durasi</p>
                              <p className="text-sm">{durasiDisplay}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* ── PHOTO PREVIEW DIALOG ── */}
      {previewPhoto && (
        <Dialog open={!!previewPhoto} onOpenChange={o => { if (!o) setPreviewPhoto(null) }}>
          <DialogContent className="w-[90vw] max-w-xl h-auto max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl border-0 shadow-2xl" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3.5">
              <DialogTitle className="text-base font-black text-white">
                Preview — {format(new Date(previewPhoto.date), "dd MMM yyyy", { locale: id })}
              </DialogTitle>
              <DialogDescription className="text-red-100 text-xs">
                {previewPhoto.photoType === 'check_in' ? 'Foto Masuk' : 'Foto Keluar'} · {fmt(previewPhoto.time)}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto bg-gray-50">
              <div className="p-4 space-y-3">
                <div className="flex justify-center bg-white rounded-xl p-3 border border-gray-100">
                  <img src={previewPhoto.photoUrl} alt="Preview" className="max-w-full max-h-[48vh] object-contain rounded-lg shadow-md" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2 rounded-xl h-9 text-sm" onClick={() => downloadPhoto(previewPhoto.photoUrl, `${employee.name}_${previewPhoto.photoType}_${previewPhoto.date}.jpg`)}>
                    <Download className="w-4 h-4" /> Unduh
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-2 rounded-xl h-9 text-sm bg-red-500 hover:bg-red-600" onClick={() => { deleteSingle(previewPhoto); setPreviewPhoto(null) }} disabled={deleting}>
                    <Trash2 className="w-4 h-4" />{deleting ? "Menghapus..." : "Hapus"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
