export interface BranchShift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  type: string;
  startTime?: string;
  endTime?: string;
  branch_id?: string;
  break_times?: Array<{ start: string; end: string }>;
}

export const calculateLateSeconds = (checkInTime: string | null, shiftStartTime: string | undefined): number => {
  if (!checkInTime || !shiftStartTime) return 0;
  const ciParts = checkInTime.split(":").map(Number);
  const ssParts = shiftStartTime.split(":").map(Number);
  const ciSec = (ciParts[0] || 0) * 3600 + (ciParts[1] || 0) * 60 + (ciParts[2] || 0);
  const ssSec = (ssParts[0] || 0) * 3600 + (ssParts[1] || 0) * 60 + (ssParts[2] || 0);
  return Math.max(0, ciSec - ssSec);
};

export const formatLateDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "00:00:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

/**
 * Tentukan status efektif berdasarkan aturan keras:
 * - Hari lalu → selalu "checked-out" (shift pasti sudah selesai)
 * - Hari ini → cek apakah sudah melewati end_time shift yang diikuti karyawan
 * - Tidak menggunakan asumsi jam, hanya berdasarkan data shift nyata
 */
export const resolveEffectiveStatus = (
  status: string,
  recordDateStr: string,
  isShiftEnded: boolean = false,
  shiftEndTime?: string   // "HH:MM" atau "HH:MM:SS" dari branch_shifts.end_time
): string => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = recordDateStr === todayStr;
  const isActive = status === 'present' || status === 'on-break' || status === 'on_break' || status === 'checked_in';

  if (!isActive) return status;

  // Hari lalu → pasti selesai (shift sudah berakhir kemarin)
  if (!isToday) return 'checked-out';

  // Hari ini: kalau calculateShiftTimes sudah hitung isShiftEnded = true, pakai itu
  if (isShiftEnded) return 'checked-out';

  // Hari ini: kalau ada data end_time shift, cek langsung apakah sudah melewatinya
  if (shiftEndTime) {
    const parts = shiftEndTime.split(':').map(Number);
    const shiftEnd = new Date();
    shiftEnd.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
    if (new Date() >= shiftEnd) return 'checked-out';
  }

  return status;
};

export const calculateShiftTimes = (
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

  if (hasShiftEnd && effectiveEnd > shiftEnd) {
    effectiveEnd = shiftEnd;
  }

  let currentBreakSeconds = 0;

  if (activeBreakStart && !checkOutTime) {
    const bStart = new Date(`${dateStr}T${activeBreakStart}`);
    if (bStart > checkIn) {
      effectiveEnd = bStart;
    }
    const now = new Date();
    const bEnd = (hasShiftEnd && now > shiftEnd) ? shiftEnd : now;
    currentBreakSeconds = Math.max(0, Math.floor((bEnd.getTime() - bStart.getTime()) / 1000));
  }

  let workMinutes = (effectiveEnd.getTime() - checkIn.getTime()) / (1000 * 60);
  if (workMinutes < 0) workMinutes = 0;

  let totalBreakMinutes = manualBreakDuration || 0;
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

          let effectiveBreakStart = scheduledBreakStart;
          if (replacementCheckInTime) {
              const repTime = new Date(`${dateStr}T${replacementCheckInTime}`);
              if (repTime > effectiveBreakStart) {
                  effectiveBreakStart = repTime;
              }
          }

          const effectiveBreakEnd = new Date(Math.min(scheduledBreakEnd.getTime(), effectiveEnd.getTime()));

          if (effectiveBreakEnd > effectiveBreakStart) {
              const breakMinutes = (effectiveBreakEnd.getTime() - effectiveBreakStart.getTime()) / (1000 * 60);
              totalBreakMinutes += breakMinutes;
          }

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
      currentBreakSeconds,
      isShiftEnded
  }
}

export const formatDetailedTime = (hours: number) => {
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  const s = Math.floor(((hours - h) * 60 - m) * 60)
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export const formatSeconds = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatBreakTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  const s = Math.floor((minutes % 1) * 60)
  
  if (h > 0) return `${h}j ${m}m ${s}d`
  return `${m}m ${s}d`
}

export const getLiveShiftTimes = (
  shift: any, 
  dateStr: string, 
  replacementCheckInTime: string | null = null,
  allBranchShifts: any[] = []
) => {
  const shiftTypeKey = shift.shift_type || shift.shift;
  const branchIdKey = shift.branch_id || shift.branchId || shift.branches?.id;
  
  // Cari shift yang cocok — support kolom raw DB (shift_type) maupun mapped (type)
  let shiftData = allBranchShifts.find((s: any) => 
    String(s.branch_id) === String(branchIdKey) && 
    (s.type === shiftTypeKey || s.shift_type === shiftTypeKey || s.id === shiftTypeKey)
  );

  // Fallback: abaikan branch, cari berdasarkan tipe saja
  if (!shiftData) {
    shiftData = allBranchShifts.find((s: any) => 
      (s.type === shiftTypeKey || s.shift_type === shiftTypeKey || s.id === shiftTypeKey)
    );
  }

  // Jika tidak ada end_time (contohnya terambil array yang salah form), jangan pakai data ini
  if (shiftData && !shiftData.end_time) {
    shiftData = undefined;
  }

  return calculateShiftTimes(
    shiftData,
    shift.checkIn || shift.check_in_time || null,
    shift.checkOut || shift.check_out_time || null,
    shift.breakStart || shift.break_start_time || null,
    shift.totalBreakTime || shift.break_duration || 0,
    dateStr,
    (shift.status === "on-break" || shift.status === "on_break") ? (shift.breakStart || shift.break_start_time || null) : null,
    replacementCheckInTime
  );
}
