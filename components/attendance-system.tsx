"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import {
  Camera,
  Clock,
  CheckCircle,
  XCircle,
  Coffee,
  Play,
  Calendar,
  MapPin,
  LogOut,
  Users,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"

interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  branch: string
  branchId: string
  date: string
  shift: "pagi" | "siang" | "malam"
  checkIn?: string
  checkOut?: string
  breakStart?: string
  breakEnd?: string
  totalBreakTime: number
  totalWorkingHours: number
  status: "present" | "absent" | "late" | "on-break" | "checked-out"
  photo?: string
  location: string
  shiftDisplayName?: string
  manualBreakDuration?: number
  // Keterlambatan
  lateSeconds: number        // jumlah detik keterlambatan (0 = on-time)
  isLate: boolean            // apakah terlambat
  shiftStartTime?: string    // jam mulai shift seharusnya (HH:mm:ss)
  shiftEndTime?: string      // jam akhir shift
}

interface DailyAttendanceSummary {
  employeeId: string
  employeeName: string
  date: string
  shifts: AttendanceRecord[]
  totalDailyHours: number
  totalDailyBreaks: number
  currentStatus: "present" | "absent" | "late" | "on-break" | "checked-out"
  canCheckIn: boolean
}

interface Employee {
  id: string
  name: string
  position: string
  branch: string
  branchId: string
  avatar?: string
  selectedBranch?: string
}

interface Branch {
  id: string
  name: string
}

interface BranchShift {
  id: string
  name: string
  start_time: string
  end_time: string
  type: string
  startTime?: string
  endTime?: string
  branch_id?: string
  break_times?: Array<{ start: string; end: string }>
}

async function getBranchShifts(branchId?: string): Promise<{ data: BranchShift[] | null; error: any }> {
  try {
    let query = supabase
      .from("branch_shifts")
      .select("*")
      .eq("is_active", true)
      .order("start_time")

    if (branchId) {
      query = query.eq("branch_id", branchId)
    }

    const { data: shiftsData, error } = await query

    if (error) {
      console.error("Error fetching branch shifts:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      return { 
        data: [], 
        error: null 
      }
    }

    // Map database shifts to BranchShift interface
    const shifts: BranchShift[] = shiftsData?.map((shift: any) => ({
      id: shift.id,
      name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      type: shift.shift_type,
      startTime: shift.start_time, // Add alias for compatibility
      endTime: shift.end_time, // Add alias for compatibility
      branch_id: shift.branch_id,
      break_times: shift.break_times || [],
    })) || []

    // If no shifts found, return default
    if (shifts.length === 0) {
      return { 
        data: [
          {
            id: "1",
            name: "Shift Reguler",
            start_time: "09:00",
            end_time: "21:00",
            type: "reguler",
          },
        ], 
        error: null 
      }
    }

    return { data: shifts, error: null }
  } catch (error) {
    console.error("Error in getBranchShifts:", error)
    // Return default shift on error
    return { 
      data: [
        {
          id: "1",
          name: "Shift Reguler",
          start_time: "09:00",
          end_time: "21:00",
          type: "reguler",
        },
      ], 
      error: null 
    }
  }
}

// Hitung keterlambatan dalam detik (0 = on-time)
const calculateLateSeconds = (checkInTime: string | null, shiftStartTime: string | undefined): number => {
  if (!checkInTime || !shiftStartTime) return 0;
  // Normalkan ke HH:mm:ss
  const ciParts = checkInTime.split(":").map(Number);
  const ssParts = shiftStartTime.split(":").map(Number);
  const ciSec = (ciParts[0] || 0) * 3600 + (ciParts[1] || 0) * 60 + (ciParts[2] || 0);
  const ssSec = (ssParts[0] || 0) * 3600 + (ssParts[1] || 0) * 60 + (ssParts[2] || 0);
  return Math.max(0, ciSec - ssSec);
};

// Format detik menjadi HH:MM:SS
const formatLateDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "00:00:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

// replacementCheckInTime: jam check-in rekan tertua di cabang yang sama (string HH:mm:ss atau null)
const calculateShiftTimes = (
  shiftData: BranchShift | undefined,
  checkInTime: string | null,
  checkOutTime: string | null,
  breakStart: string | null,
  manualBreakDuration: number,
  dateStr: string,
  activeBreakStart: string | null,
  replacementCheckInTime: string | null = null
) => {
  if (!checkInTime) return { workingHours: 0, breakTime: 0, isAutoBreak: false, currentBreakSeconds: 0, isShiftEnded: false };

  const checkIn = new Date(`${dateStr}T${checkInTime}`);
  let effectiveEnd = new Date();
  
  if (checkOutTime) {
    effectiveEnd = new Date(`${dateStr}T${checkOutTime}`);
  }

  let shiftEnd = new Date();
  let hasShiftEnd = false;
  if (shiftData?.end_time) {
     const endParts = shiftData.end_time.split(":");
     shiftEnd = new Date(checkIn);
     shiftEnd.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
     if (shiftEnd < checkIn) {
         shiftEnd.setDate(shiftEnd.getDate() + 1);
     }
     hasShiftEnd = true;
  }

  const now = new Date();
  let isShiftEnded = false;
  if (hasShiftEnd && now > shiftEnd) {
      isShiftEnded = true;
  }

  // BATAS WAKTU: Karyawan tidak dihitung lembur. 
  // Jika waktu sekarang (atau waktu checkOut) melebihi jam selesai shift, 
  // maka jam kerja stop tepat di jam selesai shift.
  if (hasShiftEnd && effectiveEnd > shiftEnd) {
    effectiveEnd = shiftEnd;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PERBAIKAN UTAMA: Ketika karyawan sedang istirahat (activeBreakStart ada),
  // FREEZE effectiveEnd di waktu break dimulai — jam kerja BERHENTI naik.
  // Timer istirahat dihitung secara terpisah di bawah.
  // ─────────────────────────────────────────────────────────────────────────
  let currentBreakSeconds = 0; // durasi istirahat saat ini (live, dalam detik)

  if (activeBreakStart && !checkOutTime) {
    const bStart = new Date(`${dateStr}T${activeBreakStart}`);
    if (bStart > checkIn) {
      // Freeze jam kerja di saat break dimulai
      effectiveEnd = bStart;
    }
    // Hitung durasi istirahat sekarang (live counter)
    const now = new Date();
    const bEnd = (hasShiftEnd && now > shiftEnd) ? shiftEnd : now;
    currentBreakSeconds = Math.max(0, Math.floor((bEnd.getTime() - bStart.getTime()) / 1000));
  }

  let workMinutes = (effectiveEnd.getTime() - checkIn.getTime()) / (1000 * 60);
  if (workMinutes < 0) workMinutes = 0;

  // Break dari manual (yang sudah selesai sebelum break aktif saat ini)
  let totalBreakMinutes = manualBreakDuration || 0;

  // Break terjadwal dari break_times:
  // Wajib dilaksanakan, tapi efektif mulai dari max(break_start, replacementCheckInTime)
  // karena karyawan baru bisa istirahat setelah ada yang standy.
  let isAutoBreak = false;
  if (shiftData?.break_times && shiftData.break_times.length > 0) {
      const now = new Date();
      shiftData.break_times.forEach(bt => {
          if (!bt.start || !bt.end) return;
          const s = bt.start.split(":");
          const e = bt.end.split(":");

          const scheduledBreakStart = new Date(checkIn);
          scheduledBreakStart.setHours(parseInt(s[0]), parseInt(s[1]), 0, 0);
          const scheduledBreakEnd = new Date(checkIn);
          scheduledBreakEnd.setHours(parseInt(e[0]), parseInt(e[1]), 0, 0);
          if (scheduledBreakEnd < scheduledBreakStart) scheduledBreakEnd.setDate(scheduledBreakEnd.getDate() + 1);

          // Jam efektif mulai istirahat = max(jadwal_mulai, jam_teman_checkin)
          let effectiveBreakStart = scheduledBreakStart;
          if (replacementCheckInTime) {
              const repTime = new Date(`${dateStr}T${replacementCheckInTime}`);
              if (repTime > effectiveBreakStart) {
                  effectiveBreakStart = repTime;
              }
          }

          // Batas akhir break = min(jadwal_selesai, effectiveEnd)
          const effectiveBreakEnd = new Date(Math.min(scheduledBreakEnd.getTime(), effectiveEnd.getTime()));

          // Hitung durasi break efektif (hanya jika masih ada sisa)
          if (effectiveBreakEnd > effectiveBreakStart) {
              const breakMinutes = (effectiveBreakEnd.getTime() - effectiveBreakStart.getTime()) / (1000 * 60);
              totalBreakMinutes += breakMinutes;
          }

          // Deteksi apakah sekarang dalam window break terjadwal
          if (!checkOutTime && now >= scheduledBreakStart && now <= scheduledBreakEnd) {
              isAutoBreak = true;
          }
      });
  }

  if (totalBreakMinutes > workMinutes) totalBreakMinutes = workMinutes;

  return {
      workingHours: (workMinutes - totalBreakMinutes) / 60,
      breakTime: totalBreakMinutes,
      isAutoBreak,
      currentBreakSeconds, // durasi istirahat saat ini dalam detik (0 jika tidak istirahat)
      isShiftEnded
  }
}


export function AttendanceSystem() {
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedShift, setSelectedShift] = useState<"pagi" | "siang" | "malam">("pagi")
  const [selectedCheckInBranch, setSelectedCheckInBranch] = useState("")
  const [attendanceAction, setAttendanceAction] = useState<"check-in" | "check-out" | "break-start" | "break-end">("check-in")
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cameraStoppedRef = useRef(false)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [dailySummaries, setDailySummaries] = useState<DailyAttendanceSummary[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchShifts, setBranchShifts] = useState<BranchShift[]>([])
  const [allBranchShifts, setAllBranchShifts] = useState<BranchShift[]>([])
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [branchIdMap, setBranchIdMap] = useState<Map<string, string>>(new Map())
  const [isBranchWarningOpen, setIsBranchWarningOpen] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | "checking">("checking")
  const [showCameraPermissionDialog, setShowCameraPermissionDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("quick-action")
  const [timeTrigger, setTimeTrigger] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTrigger(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadEmployeesAndBranches = useCallback(async () => {
    try {
      const { data: allShifts } = await getBranchShifts()
      if (allShifts) {
        setAllBranchShifts(allShifts)
      }

      const { data: usersData, error: usersError } = await supabase.from("users").select("*").eq("status", "active")

      if (usersError) {
        console.error("Error loading users:", usersError)
        const fallbackBranchIdMap = new Map([
          ["Cabang Sudirman", "branch-1"],
          ["Cabang Kemang", "branch-2"],
          ["Cabang Senayan", "branch-3"],
          ["Cabang Kelapa Gading", "branch-4"],
        ])
        setBranchIdMap(fallbackBranchIdMap)

        setEmployees([
          { id: "1", name: "Ahmad Rizki", position: "Manager", branch: "Cabang Sudirman", branchId: "branch-1" },
          { id: "2", name: "Budi Santoso", position: "Senior Barber", branch: "Cabang Kemang", branchId: "branch-2" },
          { id: "3", name: "Dedi Kurniawan", position: "Barber", branch: "Cabang Senayan", branchId: "branch-3" },
          {
            id: "4",
            name: "Eko Prasetyo",
            position: "Junior Barber",
            branch: "Cabang Kelapa Gading",
            branchId: "branch-4",
          },
          { id: "5", name: "Fajar Nugroho", position: "Barber", branch: "Cabang Sudirman", branchId: "branch-1" },
        ])
        setBranches([
          { id: "branch-1", name: "Cabang Sudirman" },
          { id: "branch-2", name: "Cabang Kemang" },
          { id: "branch-3", name: "Cabang Senayan" },
          { id: "branch-4", name: "Cabang Kelapa Gading" },
        ])
        return
      }

      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select("*")
        .eq("status", "active")

      const branchNameMap = new Map()
      const branchIdMap = new Map()
      if (!branchesError && branchesData && branchesData.length > 0) {
        branchesData.forEach((branch: any) => {
          branchNameMap.set(String(branch.id), branch.name)
          branchIdMap.set(branch.name, String(branch.id))
        })
        const branchList = branchesData.map((b: any) => ({ id: String(b.id), name: b.name }))
        setBranches(branchList)
        setBranchIdMap(branchIdMap)
      } else {
        const fallbackBranchIdMap = new Map([
          ["Cabang Sudirman", "branch-1"],
          ["Cabang Kemang", "branch-2"],
          ["Cabang Senayan", "branch-3"],
          ["Cabang Kelapa Gading", "branch-4"],
        ])
        setBranchIdMap(fallbackBranchIdMap)
        setBranches([
          { id: "branch-1", name: "Cabang Sudirman" },
          { id: "branch-2", name: "Cabang Kemang" },
          { id: "branch-3", name: "Cabang Senayan" },
          { id: "branch-4", name: "Cabang Kelapa Gading" },
        ])
      }

      if (usersData && usersData.length > 0) {
        const employeeList = usersData.map((user: any) => ({
          id: String(user.id), // Convert to string for consistency
          name: user.name,
          position: user.position || "Karyawan",
          branch: branchNameMap.get(String(user.branch_id)) || "Unknown Branch",
          branchId: user.branch_id ? String(user.branch_id) : "",
          avatar: user.avatar,
        }))
        console.log('[loadEmployeesAndBranches] Loaded employees:', employeeList.map(e => ({ id: e.id, name: e.name, idType: typeof e.id })))
        setEmployees(employeeList)
      } else {
        setEmployees([
          { id: "1", name: "Ahmad Rizki", position: "Manager", branch: "Cabang Sudirman", branchId: "branch-1" },
          { id: "2", name: "Budi Santoso", position: "Senior Barber", branch: "Cabang Kemang", branchId: "branch-2" },
          { id: "3", name: "Dedi Kurniawan", position: "Barber", branch: "Cabang Senayan", branchId: "branch-3" },
          {
            id: "4",
            name: "Eko Prasetyo",
            position: "Junior Barber",
            branch: "Cabang Kelapa Gading",
            branchId: "branch-4",
          },
          { id: "5", name: "Fajar Nugroho", position: "Barber", branch: "Cabang Sudirman", branchId: "branch-1" },
        ])
      }
    } catch (error) {
      console.error("Error loading employees and branches:", error)
      const fallbackBranchIdMap = new Map([
        ["Cabang Sudirman", "branch-1"],
        ["Cabang Kemang", "branch-2"],
        ["Cabang Senayan", "branch-3"],
        ["Cabang Kelapa Gading", "branch-4"],
      ])
      setBranchIdMap(fallbackBranchIdMap)

      setEmployees([
        { id: "1", name: "Ahmad Rizki", position: "Manager", branch: "Cabang Sudirman", branchId: "branch-1" },
        { id: "2", name: "Budi Santoso", position: "Senior Barber", branch: "Cabang Kemang", branchId: "branch-2" },
        { id: "3", name: "Dedi Kurniawan", position: "Barber", branch: "Cabang Senayan", branchId: "branch-3" },
        {
          id: "4",
          name: "Eko Prasetyo",
          position: "Junior Barber",
          branch: "Cabang Kelapa Gading",
          branchId: "branch-4",
        },
        { id: "5", name: "Fajar Nugroho", position: "Barber", branch: "Cabang Sudirman", branchId: "branch-1" },
      ])
      setBranches([
        { id: "branch-1", name: "Cabang Sudirman" },
        { id: "branch-2", name: "Cabang Kemang" },
        { id: "branch-3", name: "Cabang Senayan" },
        { id: "branch-4", name: "Cabang Kelapa Gading" },
      ])
    }
  }, [])

  const fetchAttendanceRecords = useCallback(async () => {
    try {
      console.log('[fetchAttendanceRecords] Fetching for date:', selectedDate)
      
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", selectedDate)

      if (error) {
        console.error("[fetchAttendanceRecords] Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
        
        toast({
          title: "Error Memuat Presensi",
          description: `${error.message || 'Terjadi kesalahan saat memuat data presensi'}`,
          variant: "destructive",
        })
        return
      }
      
      console.log('[fetchAttendanceRecords] Data loaded:', data?.length || 0, 'records')
      console.log('[fetchAttendanceRecords] Raw data:', data)

      setAttendanceRecords(data || [])

      // --- [NEW LOGIC] AUTO CHECKOUT OVERDUE SHIFTS ---
      let hasUpdates = false;
      const { data: allShifts } = await supabase.from('branch_shifts').select('*');
      
      if (data && allShifts) {
        for (const record of data) {
          if (!record.check_out_time && (record.status === 'present' || record.status === 'on-break' || record.status === 'on_break')) {
            const shiftName = record.shift_type || "Unknown";
            const shiftData = allShifts.find(s => 
              String(s.branch_id) === String(record.branch_id) && 
              (s.type === shiftName || s.shift_type === shiftName || s.id === shiftName)
            ) || allShifts.find(s => s.type === shiftName || s.shift_type === shiftName || s.id === shiftName);

            if (shiftData && shiftData.end_time) {
              const shiftEnd = new Date(record.date);
              const [endH, endM] = shiftData.end_time.split(':').map(Number);
              shiftEnd.setHours(endH, endM, 0, 0);
              
              if (new Date() >= shiftEnd) {
                // Shift has ended, but employee hasn't checked out -> AUTO CHECKOUT
                const calc = calculateShiftTimes(
                  shiftData,
                  record.check_in_time,
                  shiftData.end_time,
                  record.break_start_time,
                  record.break_duration || 0,
                  record.date,
                  null
                );
                
                await supabase.from("attendance").update({
                  check_out_time: shiftData.end_time,
                  status: "checked_out",
                  total_hours: calc.workingHours
                }).eq("id", record.id);
                
                // Mutate local data so it shows up correctly immediately
                record.check_out_time = shiftData.end_time;
                record.status = 'checked_out';
                record.total_hours = calc.workingHours;
                hasUpdates = true;
              }
            }
          }
        }
      }
      // --- END AUTO CHECKOUT ---

      const employeeAttendanceMap = new Map()

      data?.forEach((record: any) => {
        const empId = String(record.user_id) // Convert INTEGER to string for comparison
        console.log('[fetchAttendanceRecords] Processing record:', {
          user_id: record.user_id,
          empId: empId,
          status: record.status,
          check_out_time: record.check_out_time
        })
        if (!employeeAttendanceMap.has(empId)) {
          employeeAttendanceMap.set(empId, [])
        }
        employeeAttendanceMap.get(empId).push(record)
      })

      console.log('[fetchAttendanceRecords] Employee map keys:', Array.from(employeeAttendanceMap.keys()))
      console.log('[fetchAttendanceRecords] Employees IDs:', employees.map(e => e.id))

      const summaries = employees.map((emp) => {
        const employeeAttendance = employeeAttendanceMap.get(String(emp.id)) || []
        console.log(`[fetchAttendanceRecords] Employee ${emp.name} (ID: ${emp.id}, type: ${typeof emp.id}):`, {
          attendanceCount: employeeAttendance.length,
          attendance: employeeAttendance,
          mapHasKey: employeeAttendanceMap.has(String(emp.id))
        })

        const shifts: AttendanceRecord[] = employeeAttendance.map((attendanceData: any) => {
          let status: "present" | "absent" | "late" | "on-break" | "checked-out" = "absent"

          if (attendanceData.status === "checked_in" && !attendanceData.check_out_time) {
            status = "present"
          } else if (attendanceData.status === "on_break") {
            status = "on-break"
          } else if (attendanceData.check_out_time) {
            status = "checked-out"
          } else {
            status = "absent"
          }

          let shiftName = attendanceData.shift_type || "Unknown"
          const shiftData = allBranchShifts.find(s => String(s.branch_id) === String(attendanceData.branch_id) && (s.type === shiftName || s.id === shiftName));
          
          // Hitung keterlambatan berdasarkan check_in_time vs shift start_time
          const lateSeconds = calculateLateSeconds(attendanceData.check_in_time, shiftData?.start_time);
          const isLate = lateSeconds > 0;

          const calc = calculateShiftTimes(
              shiftData,
              attendanceData.check_in_time,
              attendanceData.check_out_time,
              attendanceData.break_start_time,
              attendanceData.break_duration || 0,
              selectedDate,
              attendanceData.status === "on_break" ? attendanceData.break_start_time : null
          );

          const totalWorkingHours = calc.workingHours;
          const totalBreakMinutes = calc.breakTime;

          const recordBranchId = attendanceData.branch_id ? String(attendanceData.branch_id) : ""
          const branchObj = branches.find((b) => String(b.id) === recordBranchId)
          const branchName = branchObj ? branchObj.name : (emp.branch || "Unknown Branch")

          return {
            id: attendanceData.id,
            employeeId: emp.id,
            employeeName: emp.name,
            branch: branchName,
            branchId: attendanceData.branch_id,
            date: selectedDate,
            shift: shiftName,
            shiftDisplayName: shiftData ? shiftData.name : shiftName,
            checkIn: attendanceData.check_in_time,
            checkOut: attendanceData.check_out_time,
            breakStart: attendanceData.break_start_time,
            breakEnd: attendanceData.break_end_time,
            totalBreakTime: totalBreakMinutes,
            manualBreakDuration: attendanceData.break_duration || 0,
            totalWorkingHours: totalWorkingHours,
            status,
            photo: attendanceData.check_in_photo || attendanceData.check_out_photo,
            location: branchName,
            // Keterlambatan
            lateSeconds,
            isLate,
            shiftStartTime: shiftData?.start_time,
            shiftEndTime: shiftData?.end_time,
          }
        })

        const totalDailyHours = shifts.reduce((sum, shift) => sum + shift.totalWorkingHours, 0)
        const totalDailyBreaks = shifts.reduce((sum, shift) => sum + shift.totalBreakTime, 0)

        const activeShifts = shifts.filter((s) => s.status === "present" || s.status === "on-break")
        const mostRecentActiveShift = activeShifts.sort(
          (a, b) => new Date(b.checkIn || "").getTime() - new Date(a.checkIn || "").getTime(),
        )[0]

        const currentStatus = mostRecentActiveShift?.status || (shifts.length > 0 ? "checked-out" : "absent")

        let hasAvailableShifts = false;
        const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
        if (isToday) {
           hasAvailableShifts = allBranchShifts.some(shift => {
               if (!shift.end_time) return true;
               const endParts = shift.end_time.split(":");
               const shiftEnd = new Date();
               shiftEnd.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
               return shiftEnd > new Date();
           });
        }
        
        // Karyawan bisa Check In jika:
        // 1. Tidak punya shift yang sedang berjalan (present/on-break)
        // 2. Masih ada shift yang tersedia (belum melewati batas waktu selesai shift) hari ini
        const canCheckIn = !mostRecentActiveShift && hasAvailableShifts;

        console.log(`[fetchAttendanceRecords] Employee ${emp.name} summary:`, {
          shiftsCount: shifts.length,
          activeShiftsCount: activeShifts.length,
          mostRecentActiveShift: mostRecentActiveShift ? {
            id: mostRecentActiveShift.id,
            status: mostRecentActiveShift.status,
            checkIn: mostRecentActiveShift.checkIn,
            checkOut: mostRecentActiveShift.checkOut
          } : null,
          currentStatus,
          canCheckIn
        })

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          date: selectedDate,
          shifts,
          totalDailyHours,
          totalDailyBreaks,
          currentStatus,
          canCheckIn,
        }
      })

      setDailySummaries(summaries)
    } catch (error: any) {
      console.error("[fetchAttendanceRecords] Caught error:", {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        stack: error?.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      })
      
      toast({
        title: "Error",
        description: `Gagal memuat data presensi: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }, [selectedDate, employees])

  const getAvailableShifts = useMemo(() => {
    if (!selectedCheckInBranch || branchShifts.length === 0) {
      return [{ value: "default", label: "Pilih cabang terlebih dahulu", time: "00:00 - 00:00" }]
    }

    return branchShifts.map((shift, index) => ({
      value: shift.type || shift.id || `shift_${index}`,
      label: `${shift.name} (${shift.startTime || shift.start_time} - ${shift.endTime || shift.end_time})`,
      time: `${shift.startTime || shift.start_time} - ${shift.endTime || shift.end_time}`,
    }))
  }, [selectedCheckInBranch, branchShifts])

  const loadBranchShifts = useCallback(async (branchId: string) => {
    if (!branchId) {
      setBranchShifts([])
      return
    }

    const { data: shifts, error } = await getBranchShifts(branchId)

    if (error) {
      console.error("Error loading branch shifts:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data shift cabang dari database",
        variant: "destructive",
      })
      return
    }

    setBranchShifts(shifts || [])
    if (shifts && shifts.length > 0) {
      setSelectedShift((shifts[0].type || shifts[0].id || "pagi") as "pagi" | "siang" | "malam")
    }
  }, [])

  const checkCameraPermission = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Kamera Tidak Didukung",
          description: "Browser Anda tidak mendukung akses kamera. Gunakan browser yang lebih baru.",
          variant: "destructive",
        })
        setCameraPermission("denied")
        return false
      }

      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: "camera" as PermissionName })
        if (permission.state === "denied") {
          setCameraPermission("denied")
          setShowCameraPermissionDialog(true)
          return false
        } else if (permission.state === "granted") {
          setCameraPermission("granted")
          return true
        }
      }

      setCameraPermission("prompt")
      return true
    } catch (error) {
      console.error("Error checking camera permission:", error)
      setCameraPermission("prompt")
      return true
    }
  }, [])

  const startCamera = useCallback(async () => {
    cameraStoppedRef.current = false
    setIsCameraReady(false)

    const hasPermission = await checkCameraPermission()
    if (!hasPermission) {
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      setCameraPermission("granted")

      if (videoRef.current && !cameraStoppedRef.current) {
        videoRef.current.srcObject = stream

        videoRef.current.onloadedmetadata = async () => {
          if (videoRef.current && !cameraStoppedRef.current) {
            try {
              await videoRef.current.play()
              setIsCameraReady(true)
            } catch (playError) {
              console.error("Error playing video:", playError)
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error)
      setCameraPermission("denied")
      setIsCameraReady(false)

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setShowCameraPermissionDialog(true)
        toast({
          title: "Izin Kamera Ditolak",
          description: "Anda perlu mengizinkan akses kamera untuk menggunakan fitur presensi.",
          variant: "destructive",
        })
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        toast({
          title: "Kamera Tidak Ditemukan",
          description: "Tidak ada kamera yang terdeteksi pada perangkat Anda.",
          variant: "destructive",
        })
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        toast({
          title: "Kamera Sedang Digunakan",
          description: "Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain dan coba lagi.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error Kamera",
          description:
            "Tidak dapat mengakses kamera. Pastikan browser memiliki izin kamera dan kamera tidak digunakan aplikasi lain.",
          variant: "destructive",
        })
      }
    }
  }, [checkCameraPermission])

  const stopCamera = useCallback(() => {
    if (cameraStoppedRef.current) return
    cameraStoppedRef.current = true
    setIsCameraReady(false)

    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => {
          if (track.readyState === "live") {
            track.stop()
          }
        })
        videoRef.current.srcObject = null
      }
    } catch (e) {
      console.log("Error stopping camera:", e)
    }
  }, [])

  useEffect(() => {
    if (!isCameraOpen) {
      stopCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isCameraOpen, stopCamera])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    let quality = 0.7
    let photoData = canvas.toDataURL("image/jpeg", quality)

    let fileSizeKB = (photoData.length * 0.75) / 1024
    while (fileSizeKB > 50 && quality > 0.1) {
      quality -= 0.1
      photoData = canvas.toDataURL("image/jpeg", quality)
      fileSizeKB = (photoData.length * 0.75) / 1024
    }

    handleAttendanceAction(photoData)
    setIsCameraOpen(false)
    stopCamera()
  }, [selectedEmployee, stopCamera])

  const handleAttendanceAction = async (photoUrl: string) => {
    if (!selectedEmployee) return

    try {
      setIsProcessing(true)

      if (attendanceAction === "check-in") {
        const branchToUse = selectedCheckInBranch || selectedEmployee.selectedBranch || ""

        if (!branchToUse) {
          throw new Error("Branch ID not found for selected branch: " + branchToUse + ". Please select a valid branch.")
        }

        let branchId = branchToUse

        const isValidBranchId = branches.some((branch) => branch.id === branchToUse)

        if (!isValidBranchId) {
          branchId = branchIdMap.get(branchToUse) || ""
        }

        if (!branchId) {
          throw new Error("Branch ID not found for selected branch: " + branchToUse + ". Please select a valid branch.")
        }

        const now = new Date()
        const currentTime = format(now, "HH:mm:ss") // Format as time only
        const currentDate = format(now, "yyyy-MM-dd") // Format as date only

        console.log('[handleAttendanceAction] Check-in data:', {
          user_id: parseInt(selectedEmployee.id),
          branch_id: branchId,
          date: currentDate,
          check_in_time: currentTime,
          shift_type: selectedShift
        })

        const { data, error } = await supabase.from("attendance").insert({
          user_id: parseInt(selectedEmployee.id),
          branch_id: branchId,
          date: currentDate,
          check_in_time: currentTime,
          shift_type: selectedShift,
          status: "checked_in",
          check_in_photo: photoUrl,
          total_hours: 0,
          break_duration: 0,
        }).select()

        if (error) {
          console.error('[handleAttendanceAction] Insert error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }

        console.log('[handleAttendanceAction] Check-in success:', data)

        toast({
          title: "Check-in Berhasil",
          description: `${selectedEmployee.name} berhasil check-in di ${branchToUse}`,
        })
      } else if (attendanceAction === "check-out") {
        // Cari dari cache terlebih dahulu
        let activeRecords = attendanceRecords.filter(
          (record) => record.employeeId === selectedEmployee.id && record.date === selectedDate && !record.checkOut,
        )

        // Jika tidak ketemu di cache, ambil langsung dari database (lebih andal)
        let existingRecord = activeRecords
          .sort((a, b) => new Date(b.checkIn || "").getTime() - new Date(a.checkIn || "").getTime())[0]

        if (!existingRecord) {
          const { data: dbRecords, error: fetchErr } = await supabase
            .from("attendance")
            .select("*")
            .eq("user_id", parseInt(selectedEmployee.id)) // Convert to INTEGER
            .eq("date", selectedDate)
            .is("check_out_time", null)
            .order("check_in_time", { ascending: false })
            .limit(1)

          if (fetchErr) {
            throw fetchErr
          }

          if (dbRecords && dbRecords.length > 0) {
            const r = dbRecords[0] as any
            // Cari shift data untuk hitung keterlambatan
            const shiftNameForLate = r.shift_type || ""
            const shiftDataForLate = allBranchShifts.find(
              s => String(s.branch_id) === String(r.branch_id) && (s.type === shiftNameForLate || s.id === shiftNameForLate)
            )
            const lateSecondsForRecord = calculateLateSeconds(r.check_in_time, shiftDataForLate?.start_time)
            existingRecord = {
              id: r.id,
              employeeId: selectedEmployee.id,
              employeeName: selectedEmployee.name,
              branch: "",
              branchId: r.branch_id,
              date: r.date,
              shift: r.shift_type || "",
              checkIn: r.check_in_time,
              checkOut: r.check_out_time,
              breakStart: r.break_start_time,
              breakEnd: r.break_end_time,
              totalBreakTime: r.total_break_minutes || r.break_duration || 0,
              totalWorkingHours: 0,
              status: r.status === "on_break" ? "on-break" : "present",
              photo: r.check_in_photo,
              location: "",
              lateSeconds: lateSecondsForRecord,
              isLate: lateSecondsForRecord > 0,
              shiftStartTime: shiftDataForLate?.start_time,
              shiftEndTime: shiftDataForLate?.end_time,
            }
          }
        }

        if (!existingRecord?.id) {
          // Sebelum menyerah, coba refresh daftar presensi agar UI sinkron
          await fetchAttendanceRecords()
          throw new Error("Tidak ada record check-in aktif untuk hari ini. Silakan check-in terlebih dahulu.")
        }

        const now = new Date()
        const checkOutTime = format(now, "HH:mm:ss") // Format as time only
        
        const shiftName = existingRecord.shift || "Unknown"
        const shiftData = allBranchShifts.find(s => String(s.branch_id) === String(existingRecord.branchId) && (s.type === shiftName || s.id === shiftName));
        
        const calc = calculateShiftTimes(
            shiftData,
            existingRecord.checkIn || null,
            checkOutTime,
            existingRecord.breakStart || null,
            existingRecord.totalBreakTime || 0,
            selectedDate,
            existingRecord.status === "on-break" ? (existingRecord.breakStart || null) : null
        );

        const totalHours = calc.workingHours;

        const { error } = await supabase
          .from("attendance")
          .update({
            check_out_time: checkOutTime,
            check_out_photo: photoUrl,
            status: "checked_out",
            total_hours: totalHours,
          })
          .eq("user_id", parseInt(selectedEmployee.id)) // Convert to INTEGER
          .eq("date", selectedDate)
          .is("check_out_time", null)

        if (error) throw error

        toast({
          title: "Check-out Berhasil",
          description: `${selectedEmployee.name} berhasil check-out. Total kerja: ${formatDetailedTime(totalHours)}`,
        })
      }

      await fetchAttendanceRecords()

      setSelectedEmployee(null)
      setSelectedCheckInBranch("")
      setAttendanceAction("check-in")
    } catch (error) {
      console.error("Attendance action error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses presensi",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      stopCamera()
      setIsCameraOpen(false)
      setIsCheckInDialogOpen(false)
    }
  }

  const handleBreakAction = async (action: "break-start" | "break-end", employeeToUse: Employee) => {
    if (!employeeToUse || isProcessing) return

    setIsProcessing(true)

    try {
      const summary = dailySummaries.find((s) => s.employeeId === employeeToUse.id)
      const activeShift = summary?.shifts.find((s) => s.status === "present" || s.status === "on-break")

      if (!activeShift?.id) {
        throw new Error("Karyawan belum check-in di shift manapun")
      }

      const now = new Date()
      const currentTimeString = format(now, "HH:mm:ss")
      const updates: any = { updated_at: now.toISOString() }

      if (action === "break-start") {
        updates.break_start_time = currentTimeString
        updates.status = "on_break"
      } else {
        updates.break_end_time = currentTimeString
        updates.status = "checked_in"

        if (activeShift.breakStart) {
          const breakStart = new Date(`${selectedDate}T${activeShift.breakStart}`)
          const breakDuration = (now.getTime() - breakStart.getTime()) / (1000 * 60) // Do not round, keep fractions for seconds precision
          updates.break_duration = (activeShift.manualBreakDuration || 0) + breakDuration
        }
      }

      const { error } = await supabase.from("attendance").update(updates).eq("id", activeShift.id)

      if (error) throw error

      toast({
        title: action === "break-start" ? "Istirahat Dimulai" : "Istirahat Selesai",
        description: `${employeeToUse.name} ${action === "break-start" ? "mulai istirahat" : "lanjut bekerja"}`,
      })

      await fetchAttendanceRecords()
    } catch (error) {
      console.error("Break action error:", error)
      toast({
        title: "Gagal menyimpan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setSelectedEmployee(null)
    }
  }

  const checkBranchSelection = () => {
    if (selectedBranch === "all") {
      setIsBranchWarningOpen(true)
      return false
    }
    return true
  }

  const openCheckInDialog = async (employee: Employee) => {
    if (isProcessing) return

    // Refresh data presensi untuk memastikan data terbaru
    await fetchAttendanceRecords()

    // Cek langsung ke database untuk memastikan tidak ada shift aktif
    const { data: activeShifts, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", parseInt(employee.id))
      .eq("date", selectedDate)
      .is("check_out_time", null)

    if (error) {
      console.error("Error checking active shifts:", error)
      toast({
        title: "Error",
        description: "Gagal memeriksa status presensi",
        variant: "destructive",
      })
      return
    }

    if (activeShifts && activeShifts.length > 0) {
      toast({
        title: "Tidak Bisa Check-in",
        description: `${employee.name} masih memiliki ${activeShifts.length} shift aktif yang belum check-out. Silakan check-out terlebih dahulu.`,
        variant: "destructive",
      })
      return
    }

    setSelectedEmployee(employee)
    setSelectedCheckInBranch("")
    setIsCheckInDialogOpen(true)
  }

  const confirmCheckIn = () => {
    if (!selectedCheckInBranch) {
      toast({
        title: "Pilih Cabang",
        description: "Silakan pilih cabang terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    // Validasi waktu check-in sesuai dengan jam shift
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    // Cari shift yang dipilih dari branchShifts
    const selectedShiftData = branchShifts.find(
      (shift) => shift.type === selectedShift || shift.id === selectedShift
    )

    if (selectedShiftData) {
      // Parse start_time dan end_time (format: "HH:mm:ss" atau "HH:mm")
      const parseTime = (timeStr: string): number => {
        const parts = timeStr.split(":")
        const hours = parseInt(parts[0], 10)
        const minutes = parseInt(parts[1], 10)
        return hours * 60 + minutes
      }

      const shiftStartMinutes = parseTime(selectedShiftData.start_time)
      const shiftEndMinutes = parseTime(selectedShiftData.end_time)

      // Toleransi 15 menit sebelum shift dimulai
      const toleranceMinutes = 15
      const allowedStartMinutes = shiftStartMinutes - toleranceMinutes

      // Cek apakah waktu sekarang dalam range shift (dengan toleransi)
      let isWithinShiftTime = false

      if (shiftEndMinutes > shiftStartMinutes) {
        // Shift normal (tidak melewati tengah malam)
        isWithinShiftTime =
          currentTimeInMinutes >= allowedStartMinutes && currentTimeInMinutes < shiftEndMinutes
      } else {
        // Shift melewati tengah malam
        isWithinShiftTime =
          currentTimeInMinutes >= allowedStartMinutes || currentTimeInMinutes < shiftEndMinutes
      }

      if (!isWithinShiftTime) {
        const formatTime = (minutes: number): string => {
          const h = Math.floor(Math.abs(minutes) / 60) % 24
          const m = Math.abs(minutes) % 60
          return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
        }

        toast({
          title: "Waktu Check-in Tidak Sesuai",
          description: `Shift ${selectedShiftData.name} bisa check-in mulai jam ${formatTime(allowedStartMinutes)} (15 menit sebelum shift) sampai jam ${selectedShiftData.end_time}. Waktu sekarang: ${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`,
          variant: "destructive",
        })
        return
      }
    }

    if (selectedEmployee) {
      setSelectedEmployee({
        ...selectedEmployee,
        selectedBranch: selectedCheckInBranch,
      })
    }

    setAttendanceAction("check-in")
    setIsCheckInDialogOpen(false)
    setIsCameraOpen(true)
    setTimeout(startCamera, 100)
  }

  const handleBreakStart = (employee: Employee) => {
    if (isProcessing) return
    setSelectedEmployee(employee)
    handleBreakAction("break-start", employee)
  }

  const handleBreakEnd = (employee: Employee) => {
    if (isProcessing) return
    setSelectedEmployee(employee)
    handleBreakAction("break-end", employee)
  }

  const openCheckOutCamera = async (employee: Employee) => {
    if (isProcessing) return
    // Segarkan data presensi agar checkout menggunakan data terbaru
    await fetchAttendanceRecords()
    setSelectedEmployee(employee)
    setAttendanceAction("check-out")
    setIsCameraOpen(true)
    setTimeout(startCamera, 100)
  }

  useEffect(() => {
    if (selectedCheckInBranch) {
      loadBranchShifts(selectedCheckInBranch)
    }
  }, [selectedCheckInBranch, loadBranchShifts])

  useEffect(() => {
    loadEmployeesAndBranches()
  }, [loadEmployeesAndBranches])

  useEffect(() => {
    if (employees.length > 0) {
      fetchAttendanceRecords()
    }
  }, [fetchAttendanceRecords, employees])

  useEffect(() => {
    if (isCameraOpen && !isCameraReady) {
      startCamera()
    }
  }, [isCameraOpen, isCameraReady, startCamera])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "absent":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "late":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "on-break":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "checked-out":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  // replacementCheckInTime: jam check-in pertama karyawan lain yang hadir di cabang yang sama
  const getLiveShiftTimes = (shift: any, dateStr: string, replacementCheckInTime: string | null = null) => {
    let totalWorkingHours = shift.totalWorkingHours;
    let totalBreakTime = shift.totalBreakTime;
    let isAutoBreak = false;
    let currentBreakSeconds = 0;
    let isShiftEnded = false;

    if (shift.status === "present" || shift.status === "on-break" || shift.status === "checked-out") {
      const shiftData = allBranchShifts.find(s => String(s.branch_id) === String(shift.branchId) && (s.type === shift.shift || s.id === shift.shift));
      const calc = calculateShiftTimes(
        shiftData,
        shift.checkIn,
        shift.checkOut,
        shift.breakStart,
        shift.manualBreakDuration || 0,
        dateStr,
        shift.status === "on-break" ? shift.breakStart : null,
        replacementCheckInTime
      );
      totalWorkingHours = calc.workingHours;
      totalBreakTime = calc.breakTime;
      isAutoBreak = calc.isAutoBreak;
      currentBreakSeconds = calc.currentBreakSeconds;
      isShiftEnded = calc.isShiftEnded;
    }

    return {
      workingHours: totalWorkingHours,
      breakTime: totalBreakTime,
      isAutoBreak,
      currentBreakSeconds,
      isShiftEnded
    }
  }

  // Cari jam check-in pertama karyawan LAIN di cabang yang sama
  const getReplacementCheckIn = (myEmployeeId: string, branchId: string): string | null => {
    let earliest: string | null = null;
    dailySummaries.forEach(s => {
      if (s.employeeId === myEmployeeId) return;
      s.shifts.forEach(sh => {
        if (String(sh.branchId) !== String(branchId)) return;
        if (!sh.checkIn) return;
        if (!earliest || sh.checkIn < earliest) {
          earliest = sh.checkIn;
        }
      });
    });
    return earliest;
  }

  const getLiveSummaryTimes = (summary: DailyAttendanceSummary) => {
    let totalDailyHours = 0;
    let totalDailyBreaks = 0;
    let isAutoBreak = false;
    let currentBreakSeconds = 0;
    let isShiftEnded = false;

    summary.shifts.forEach((shift) => {
      // Cari jam check-in pengganti (rekan kerja di cabang yang sama)
      const replacementCheckIn = getReplacementCheckIn(summary.employeeId, String(shift.branchId));
      const liveTimes = getLiveShiftTimes(shift, summary.date, replacementCheckIn);
      totalDailyHours += liveTimes.workingHours;
      totalDailyBreaks += liveTimes.breakTime;
      if (liveTimes.isAutoBreak) isAutoBreak = true;
      if (liveTimes.currentBreakSeconds > 0) currentBreakSeconds = liveTimes.currentBreakSeconds;
      if (liveTimes.isShiftEnded) isShiftEnded = true;
    });

    return {
      totalDailyHours,
      totalDailyBreaks,
      isAutoBreak,
      currentBreakSeconds,
      isShiftEnded
    };
  }

  const formatDetailedTime = (hours: number): string => {
    if (hours <= 0) return "00:00:00"

    const totalSeconds = Math.floor(hours * 3600)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const formatBreakTime = (minutes: number): string => {
    if (minutes <= 0) return "00:00:00"

    const roundedMinutes = Math.round(minutes * 100) / 100
    const totalSeconds = Math.floor(roundedMinutes * 60)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  // Format detik mentah menjadi HH:MM:SS (untuk live break timer)
  const formatSeconds = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return "00:00:00"
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }


  const allShifts = dailySummaries.flatMap((summary) => summary.shifts)
  const filteredShifts =
    selectedBranch === "all" ? allShifts : allShifts.filter((shift) => shift.branchId === selectedBranch)

  let presentCount = 0;
  let onBreakCount = 0;
  let checkedOutCount = 0;
  
  filteredShifts.forEach(shift => {
    let effectiveStatus = shift.status;
    if (shift.status === "present" || shift.status === "on-break") {
       const shiftData = allBranchShifts.find(s => String(s.branch_id) === String(shift.branchId) && (s.type === shift.shift || s.id === shift.shift));
       if (shiftData?.end_time && shift.checkIn) {
           const checkIn = new Date(`${selectedDate}T${shift.checkIn}`);
           let shiftEnd = new Date(checkIn);
           const endParts = shiftData.end_time.split(":");
           shiftEnd.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
           if (shiftEnd < checkIn) shiftEnd.setDate(shiftEnd.getDate() + 1);
           if (new Date() > shiftEnd) {
               effectiveStatus = "checked-out";
           }
       }
    }
    
    if (effectiveStatus === "present") presentCount++;
    else if (effectiveStatus === "on-break") onBreakCount++;
    else if (effectiveStatus === "checked-out") checkedOutCount++;
  });
  
  const absentCount = Math.max(0, employees.length - dailySummaries.length);

  const filteredSummaries = dailySummaries.filter((summary) => {
    if (selectedBranch === "all") return true
    return summary.shifts.some((shift) => shift.branchId === selectedBranch)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
      {/* Header dengan Controls - Responsif untuk mobile */}
      <div className="flex flex-col gap-3 sm:gap-4 items-start sm:items-center justify-between mb-4">
        <div className="w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sistem Presensi Karyawan</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Kelola presensi karyawan dengan foto dan tracking waktu</p>
          {/* Info banner aturan check-in */}
          <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <span className="text-blue-500 text-sm">ℹ️</span>
            <span className="text-xs text-blue-700 font-medium">
              Check-in dapat dilakukan mulai <strong>15 menit sebelum</strong> jam shift dimulai
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full sm:w-48 text-sm">
              <SelectValue placeholder="Filter cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border rounded-md text-sm"
          />
        </div>
      </div>

      {/* Statistics Cards - Responsif untuk mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="sm:h-28">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{presentCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Hadir</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:h-28">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{absentCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Tidak Hadir</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:h-28">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{onBreakCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Istirahat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:h-28">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-600">{checkedOutCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Sudah Pulang</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="quick-action" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="quick-action" className="flex-1 text-xs sm:text-sm">Aksi Cepat</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs sm:text-sm">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-action" className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-4">
            {filteredSummaries.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-muted-foreground">
                      {selectedBranch === "all"
                        ? "Belum Ada Data Presensi"
                        : `Belum Ada yang Bekerja di ${branches.find(b => b.id === selectedBranch)?.name || selectedBranch}`}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {selectedBranch === "all"
                        ? "Belum ada karyawan yang melakukan presensi hari ini"
                        : `Belum ada karyawan yang bekerja di cabang ini hari ini`}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              filteredSummaries.map((summary) => {
                const employee = employees.find((e) => e.id === summary.employeeId)
                if (!employee) return null
                const liveTimes = getLiveSummaryTimes(summary)

                return (
                  <Card key={summary.employeeId} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-base sm:text-lg">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1">
                            <h3 className="font-semibold text-base sm:text-lg">{summary.employeeName}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">{employee.position}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs sm:text-sm text-gray-600">
                            {summary.currentStatus === "on-break" ? "Jam Kerja (Berhenti)" : "Total Hari Ini"}
                          </div>
                          <div className={`font-semibold text-base sm:text-lg ${summary.currentStatus === "on-break" ? "text-gray-400" : "text-blue-600"}`}>
                            {formatDetailedTime(liveTimes.totalDailyHours)}
                          </div>
                          {summary.currentStatus === "on-break" && liveTimes.currentBreakSeconds > 0 && (
                            <div className="mt-1">
                              <div className="text-xs text-amber-600 font-medium">⏸ Sedang Istirahat</div>
                              <div className="font-bold text-base sm:text-lg text-amber-500 animate-pulse">
                                {formatSeconds(liveTimes.currentBreakSeconds)}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {summary.shifts.length} shift
                            {liveTimes.totalDailyBreaks > 0 && (
                              <span> • {formatBreakTime(liveTimes.totalDailyBreaks)} total istirahat</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {summary.shifts.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700">Shift Hari Ini:</h4>
                          {summary.shifts
                            .sort((a, b) => new Date(a.checkIn || "").getTime() - new Date(b.checkIn || "").getTime())
                            .map((shift, index) => {
                              const liveShift = getLiveShiftTimes(shift, summary.date, getReplacementCheckIn(summary.employeeId, String(shift.branchId)))
                              return (
                                <div key={shift.id} className="bg-gray-50 rounded-lg p-3 text-xs sm:text-sm">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="flex-1">
                                      <span className="font-medium">
                                        {shift.shiftDisplayName || `Shift ${index + 1}`} - {shift.branch}
                                      </span>
                                      <div className="text-gray-600 mt-1">
                                        {shift.checkIn && `Masuk: ${shift.checkIn}`}
                                        {shift.shiftStartTime && ` (Jadwal: ${shift.shiftStartTime})`}
                                        {shift.checkOut && ` • Pulang: ${shift.checkOut}`}
                                      </div>
                                      {/* Badge keterlambatan */}
                                      {shift.isLate && shift.lateSeconds > 0 && (
                                        <div className="mt-1.5 inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-200 rounded-md px-2 py-1">
                                          <span className="text-xs">⏰</span>
                                          <span className="text-xs font-semibold">
                                            Telat {formatLateDuration(shift.lateSeconds)}
                                            {shift.shiftStartTime && ` dari jam ${shift.shiftStartTime}`}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      {shift.status === "on-break" ? (
                                        <>
                                          {/* Jam kerja FREEZE saat istirahat */}
                                          <div className="font-medium text-gray-400 text-sm sm:text-base">
                                            {formatDetailedTime(liveShift.workingHours)}
                                          </div>
                                          <div className="text-xs text-gray-400">jam kerja (berhenti)</div>
                                          {/* Timer istirahat LIVE */}
                                          {liveShift.currentBreakSeconds > 0 && (
                                            <div className="mt-1">
                                              <div className="font-bold text-amber-500 text-sm sm:text-base animate-pulse">
                                                {formatSeconds(liveShift.currentBreakSeconds)}
                                              </div>
                                              <div className="text-xs text-amber-500">istirahat</div>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="font-medium text-blue-600 text-sm sm:text-base">
                                          {formatDetailedTime(liveShift.workingHours)}
                                        </div>
                                      )}
                                      {(() => {
                                        const effectiveStatus = (shift.status === "present" || shift.status === "on-break") && liveShift.isShiftEnded 
                                            ? "checked-out" 
                                            : shift.status;
                                        return (
                                          <Badge className={`text-xs ${getStatusColor(effectiveStatus)}`}>
                                            {effectiveStatus === "present" && "Sedang Bekerja"}
                                            {effectiveStatus === "on-break" && "Istirahat"}
                                            {effectiveStatus === "checked-out" && "Sudah Pulang"}
                                            {effectiveStatus === "absent" && "Belum Masuk"}
                                          </Badge>
                                        )
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {summary.canCheckIn && (
                          <Button
                            onClick={() => openCheckInDialog(employee)}
                            disabled={isProcessing}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-3 py-2 text-xs sm:text-sm rounded-lg"
                            size="sm"
                          >
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Check In
                          </Button>
                        )}

                        {summary.currentStatus === "present" && !liveTimes.isAutoBreak && (() => {
                          // Cek cover: ada karyawan lain present di cabang yang sama
                          const myBranchId = summary.shifts[summary.shifts.length - 1]?.branchId
                          const hasCover = dailySummaries.some(
                            s => s.employeeId !== summary.employeeId &&
                              (s.currentStatus === 'present') &&
                              s.shifts.some(sh => sh.branchId === myBranchId)
                          )
                          return (
                            <>
                              {!liveTimes.isShiftEnded && (
                                <>
                                  <Button
                                    onClick={() => handleBreakStart(employee)}
                                    disabled={isProcessing || !hasCover}
                                    title={!hasCover ? "Tidak ada teman yang standby di cabang ini" : ""}
                                    variant="outline"
                                    className="border-orange-300 text-orange-700 hover:bg-orange-50 font-medium px-3 py-2 text-xs sm:text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    size="sm"
                                  >
                                    <Coffee className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    Istirahat
                                  </Button>
                                  {!hasCover && (
                                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                      ⚠️ Belum ada yang standby
                                    </span>
                                  )}
                                </>
                              )}
                              <Button
                                onClick={() => openCheckOutCamera(employee)}
                                disabled={isProcessing || liveTimes.isShiftEnded}
                                className={
                                  liveTimes.isShiftEnded
                                    ? "bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed font-medium px-3 py-2 text-xs sm:text-sm rounded-lg"
                                    : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-medium px-3 py-2 text-xs sm:text-sm rounded-lg"
                                }
                                size="sm"
                              >
                                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                {liveTimes.isShiftEnded ? "Sudah Pulang" : "Check Out"}
                              </Button>
                            </>
                          )
                        })()}

                        {summary.currentStatus === "present" && liveTimes.isAutoBreak && (() => {
                          // Dalam window break terjadwal — cek apakah ada cover
                          const myBranchId = summary.shifts[summary.shifts.length - 1]?.branchId
                          const hasCover = dailySummaries.some(
                            s => s.employeeId !== summary.employeeId &&
                              (s.currentStatus === 'present') &&
                              s.shifts.some(sh => sh.branchId === myBranchId)
                          )
                          return (
                            <>
                              {!liveTimes.isShiftEnded && (
                                <>
                                  {hasCover ? (
                                    <div className="bg-orange-50 text-orange-600 font-medium px-3 py-2 text-xs sm:text-sm rounded-lg flex items-center border border-orange-200">
                                      <Coffee className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                      Waktunya Istirahat ✅
                                    </div>
                                  ) : (
                                    <div className="bg-yellow-50 text-yellow-700 font-medium px-3 py-2 text-xs sm:text-sm rounded-lg flex items-center border border-yellow-200">
                                      <Coffee className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                      ⚠️ Waktunya Istirahat — Belum ada yang standby
                                    </div>
                                  )}
                                </>
                              )}
                              <Button
                                onClick={() => openCheckOutCamera(employee)}
                                disabled={isProcessing || liveTimes.isShiftEnded}
                                className={
                                  liveTimes.isShiftEnded
                                    ? "bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed font-medium px-3 py-2 text-xs sm:text-sm rounded-lg"
                                    : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-medium px-3 py-2 text-xs sm:text-sm rounded-lg"
                                }
                                size="sm"
                              >
                                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                {liveTimes.isShiftEnded ? "Sudah Pulang" : "Check Out"}
                              </Button>
                            </>
                          )
                        })()}

                        {summary.currentStatus === "on-break" && (
                          <Button
                            onClick={() => handleBreakEnd(employee)}
                            disabled={isProcessing}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium px-3 py-2 text-xs sm:text-sm rounded-lg"
                            size="sm"
                          >
                            <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Lanjut Kerja
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Riwayat Presensi
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Riwayat presensi karyawan dengan detail jam kerja, keterlambatan, dan shift
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {dailySummaries.map((summary) => {
                  const liveTimes = getLiveSummaryTimes(summary)
                  const employee = employees.find((e) => e.id === summary.employeeId)
                  const anyLate = summary.shifts.some(s => s.isLate && s.lateSeconds > 0)
                  const totalLateSeconds = summary.shifts.reduce((acc, s) => acc + (s.isLate ? s.lateSeconds : 0), 0)

                  const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
                    present:       { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500", label: "Sedang Bekerja" },
                    "on-break":    { bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500",   label: "Istirahat" },
                    "checked-out": { bg: "bg-blue-100",    text: "text-blue-800",    dot: "bg-blue-500",    label: "Sudah Pulang" },
                    absent:        { bg: "bg-red-100",     text: "text-red-800",     dot: "bg-red-500",     label: "Tidak Hadir" },
                    late:          { bg: "bg-orange-100",  text: "text-orange-800",  dot: "bg-orange-500",  label: "Terlambat" },
                  }
                  const sc = statusConfig[summary.currentStatus] ?? statusConfig.absent

                  return (
                    <div key={`${summary.employeeId}-${summary.date}`}
                      className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">

                      {/* Header karyawan */}
                      <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {summary.employeeName?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{summary.employeeName}</p>
                            {employee?.position && (
                              <p className="text-xs text-gray-400">{employee.position}</p>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>

                      {/* Badge telat global */}
                      {anyLate && (
                        <div className="mx-4 mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <span className="text-base">&#9200;</span>
                          <div>
                            <p className="text-xs font-semibold text-red-700">
                              Terlambat {formatLateDuration(totalLateSeconds)}
                            </p>
                            <p className="text-xs text-red-500">dari jam shift yang ditentukan</p>
                          </div>
                        </div>
                      )}

                      {/* Tanggal + jumlah shift */}
                      <div className="mx-4 mb-3 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {summary.date}
                        </span>
                        <span>{summary.shifts.length} shift</span>
                      </div>

                      {/* Per-shift detail */}
                      {summary.shifts.length > 0 && (
                        <div className="mx-4 mb-3 space-y-2">
                          {summary.shifts
                            .sort((a, b) => new Date(a.checkIn || "").getTime() - new Date(b.checkIn || "").getTime())
                            .map((shift, idx) => {
                              const liveShift = getLiveShiftTimes(shift, summary.date, getReplacementCheckIn(summary.employeeId, String(shift.branchId)))
                              return (
                                <div key={shift.id} className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-700">
                                      {shift.shiftDisplayName || `Shift ${idx + 1}`}
                                    </span>
                                    <span className="text-xs text-gray-400">{shift.branch}</span>
                                  </div>

                                  {(shift.shiftStartTime || shift.shiftEndTime) && (
                                    <div className="text-xs text-gray-400">
                                      Jadwal: {shift.shiftStartTime ?? "--:--"} &#8594; {shift.shiftEndTime ?? "--:--"}
                                    </div>
                                  )}

                                  {shift.isLate && shift.lateSeconds > 0 && (
                                    <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-200 rounded-md px-2 py-0.5">
                                      <span className="text-xs">&#9200;</span>
                                      <span className="text-xs font-semibold">
                                        Telat {formatLateDuration(shift.lateSeconds)} dari jam {shift.shiftStartTime}
                                      </span>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                                      <p className="text-xs text-emerald-600 font-medium">Check In</p>
                                      <p className="text-xs font-bold text-emerald-800 mt-0.5">
                                        {shift.checkIn ?? "--:--:--"}
                                      </p>
                                    </div>
                                    <div className="bg-rose-50 rounded-lg p-2 text-center">
                                      <p className="text-xs text-rose-600 font-medium">Check Out</p>
                                      <p className="text-xs font-bold text-rose-800 mt-0.5">
                                        {shift.checkOut ?? "--:--:--"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                    <span className="text-xs text-gray-500">Durasi kerja</span>
                                    <span className="text-xs font-bold text-blue-700">
                                      {formatDetailedTime(liveShift.workingHours)}
                                    </span>
                                  </div>

                                  {liveShift.breakTime > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">Istirahat</span>
                                      <span className="text-xs font-semibold text-amber-600">
                                        {formatBreakTime(liveShift.breakTime)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                        </div>
                      )}

                      {/* Ringkasan total harian */}
                      <div className="border-t border-gray-100 px-4 py-3 grid grid-cols-2 gap-3 bg-gray-50/50">
                        <div className="text-center">
                          <p className="text-xs text-blue-500 font-medium mb-0.5">Total Kerja</p>
                          <p className="text-sm font-bold text-blue-800">
                            {liveTimes.totalDailyHours > 0 ? formatDetailedTime(liveTimes.totalDailyHours) : "00:00:00"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-amber-500 font-medium mb-0.5">Total Istirahat</p>
                          <p className="text-sm font-bold text-amber-800">
                            {formatBreakTime(liveTimes.totalDailyBreaks)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {dailySummaries.length === 0 && (

                <div className="text-center py-6 sm:py-8">
                  <Calendar className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-sm sm:text-base">Belum ada data presensi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Check-in Dialog */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Check-in Karyawan
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Selamat datang, {selectedEmployee?.name}!
              <br />
              Pilih cabang dan shift kerja untuk memulai hari kerja Anda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                Cabang Kerja
              </Label>
              <Select value={selectedCheckInBranch} onValueChange={setSelectedCheckInBranch}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="🏢 Pilih cabang tempat kerja" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="text-sm">
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Shift Kerja
              </Label>
              <Select
                value={selectedShift}
                onValueChange={(value) => setSelectedShift(value as "pagi" | "siang" | "malam")}
                disabled={!selectedCheckInBranch || branchShifts.length === 0}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pilih shift kerja" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableShifts.map((shift) => (
                    <SelectItem key={shift.value} value={shift.value} disabled={shift.value === "default"} className="text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        <div>
                          <div className="font-medium">{shift.label.split(" (")[0]}</div>
                          <div className="text-xs text-muted-foreground">{shift.time}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedCheckInBranch && (
                <p className="text-xs text-muted-foreground">
                  Pilih cabang terlebih dahulu untuk melihat shift yang tersedia
                </p>
              )}
              {selectedCheckInBranch && branchShifts.length === 0 && (
                <p className="text-xs text-orange-600">
                  Tidak ada data shift untuk cabang ini. Hubungi admin untuk mengatur shift.
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Camera className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Langkah Selanjutnya</p>
                  <p className="text-blue-700 text-xs">
                    Setelah memilih cabang dan shift, Anda akan diminta mengambil foto sebagai bukti kehadiran. Pastikan
                    kamera berfungsi dengan baik dan pencahayaan cukup.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckInDialogOpen(false)} className="text-sm">
              Batal
            </Button>
            <Button onClick={confirmCheckIn} disabled={!selectedCheckInBranch || !selectedShift} className="gap-2 text-sm">
              <Camera className="h-4 w-4" />
              Lanjut Ambil Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCameraPermissionDialog} onOpenChange={setShowCameraPermissionDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              Izin Kamera Diperlukan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-3 text-sm">
                Aplikasi presensi memerlukan akses kamera untuk mengambil foto sebagai bukti kehadiran.
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-900 mb-2 text-sm">Cara mengizinkan akses kamera:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800 text-xs">
                  <li>Klik ikon kamera di address bar browser</li>
                  <li>Pilih "Allow" atau "Izinkan"</li>
                  <li>Refresh halaman jika diperlukan</li>
                  <li>Coba buka kamera lagi</li>
                </ol>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowCameraPermissionDialog(false)
                  startCamera()
                }}
                className="flex-1 text-sm"
              >
                Coba Lagi
              </Button>
              <Button variant="outline" onClick={() => setShowCameraPermissionDialog(false)} className="text-sm">
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              Ambil Foto Presensi
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedEmployee && (
                <>
                  {attendanceAction === "check-in" && `Check-in untuk ${selectedEmployee.name}`}
                  {attendanceAction === "check-out" && `Check-out untuk ${selectedEmployee.name}`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {cameraPermission === "denied" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Izin kamera ditolak</span>
                </div>
                <p className="text-xs text-red-600 mt-1">Silakan izinkan akses kamera di pengaturan browser Anda.</p>
              </div>
            )}

            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
                onLoadedMetadata={async () => {
                  if (videoRef.current && !cameraStoppedRef.current) {
                    try {
                      await videoRef.current.play()
                    } catch (error) {
                      console.error("Video play failed:", error)
                    }
                  }
                }}
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute top-2 right-2">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    isCameraReady && cameraPermission === "granted"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCameraReady && cameraPermission === "granted" ? "bg-white" : "bg-white animate-pulse"
                    }`}
                  />
                  {cameraPermission === "denied" ? "Izin Ditolak" : isCameraReady ? "Siap" : "Loading..."}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={capturePhoto}
                className="flex-1 gap-2 text-sm"
                disabled={isProcessing || !isCameraReady || cameraPermission !== "granted"}
              >
                <Camera className="h-4 w-4" />
                {isProcessing
                  ? "Memproses..."
                  : cameraPermission !== "granted"
                    ? "Izin Kamera Diperlukan"
                    : !isCameraReady
                      ? "Tunggu Kamera..."
                      : "Ambil Foto"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  stopCamera()
                  setIsCameraOpen(false)
                }}
                className="bg-transparent text-sm"
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branch Warning Dialog */}
      <Dialog open={isBranchWarningOpen} onOpenChange={setIsBranchWarningOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Peringatan</DialogTitle>
            <DialogDescription className="text-sm">
              Anda memilih untuk melihat semua cabang. Ini akan menampilkan semua data presensi dari semua cabang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsBranchWarningOpen(false)} className="text-sm">OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AttendanceSystem