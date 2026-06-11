# Employee Management Components

Komponen-komponen untuk sistem manajemen karyawan yang telah di-refactor mengikuti prinsip Clean Architecture.

## 📁 Struktur Folder

```
components/employees/
├── types.ts                          # Type definitions
├── employee-stats-cards.tsx          # Summary statistics
├── employee-card.tsx                 # Individual employee card
├── employee-list.tsx                 # Employee grid
├── employee-filters.tsx              # Search & filter controls
├── employee-add-dialog.tsx           # Add employee modal
├── employee-edit-dialog.tsx          # Edit employee modal
├── employee-delete-dialog.tsx        # Delete confirmation
├── employee-detail-dialog.tsx        # Employee details view
├── employee-absence-dialog.tsx       # Absence management
├── employee-payroll-dialog.tsx       # Payroll settings
├── index.ts                          # Barrel export
└── README.md                         # This file

lib/utils/
└── employee-helpers.ts               # Utility functions

lib/hooks/
└── use-employee-data.ts              # Custom data hook
```

## 🎯 Arsitektur

### Prinsip Clean Architecture
Komponen ini mengikuti prinsip:
- **Separation of Concerns:** Setiap komponen punya tanggung jawab tunggal
- **Single Responsibility:** Satu komponen = satu fungsi
- **Reusability:** Komponen dapat digunakan ulang
- **Type Safety:** Full TypeScript dengan proper types

### Component Hierarchy
```
EmployeeManagement (Orchestrator)
├── EmployeeStatsCards (Display)
├── EmployeeFilters (Input)
├── Tabs
│   ├── EmployeeList (Display)
│   │   └── EmployeeCard (multiple)
│   ├── KontrolKomisi (Existing)
│   ├── KontrolPresensi (Existing)
│   └── KontrolGaji (Existing)
├── EmployeeAddDialog (Input + Actions)
├── EmployeeEditDialog (Input + Actions)
├── EmployeeDeleteDialog (Confirmation)
├── EmployeeDetailDialog (Display)
├── EmployeeAbsenceDialog (Input + Actions)
└── EmployeePayrollDialog (Input + Actions)
```

## 📦 Komponen

### 1. EmployeeStatsCards
**File:** `employee-stats-cards.tsx` (150 lines)

**Fungsi:** Menampilkan ringkasan statistik karyawan

**Props:**
```typescript
{
  totalEmployees: number
  activeEmployees: number
  totalSalary: number
  absentToday: number
  absentEmployees: Employee[]
  onLeaveCount: number
  loading?: boolean
}
```

**Features:**
- 4 summary cards
- Total karyawan & aktif
- Total gaji per bulan
- Tidak hadir hari ini
- Karyawan cuti
- Loading skeleton state
- Responsive grid (2-4 columns)

**Usage:**
```tsx
import { EmployeeStatsCards } from '@/components/employees'

<EmployeeStatsCards
  totalEmployees={50}
  activeEmployees={45}
  totalSalary={150000000}
  absentToday={2}
  absentEmployees={absentList}
  onLeaveCount={3}
  loading={false}
/>
```

---

### 2. EmployeeCard
**File:** `employee-card.tsx` (180 lines)

**Fungsi:** Menampilkan kartu individual karyawan

**Props:**
```typescript
{
  employee: Employee
  stats: EmployeeStats
  onViewDetail: () => void
  onEdit: () => void
  onDelete: () => void
  onManageAbsence: () => void
  onManagePayroll: () => void
}
```

**Features:**
- Avatar dengan inisial
- Nama, posisi, status badge
- Statistik kunci (transaksi, revenue, komisi, gaji)
- 5 action buttons (Detail, Edit, Cuti, Gaji, Hapus)
- Hover effect
- Responsive layout

---

### 3. EmployeeList
**File:** `employee-list.tsx` (200 lines)

**Fungsi:** Menampilkan grid karyawan

**Props:**
```typescript
{
  employees: Employee[]
  employeeStats: Record<string, EmployeeStats>
  onViewDetail: (employee: Employee) => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onManageAbsence: (employee: Employee) => void
  onManagePayroll: (employee: Employee) => void
  loading?: boolean
}
```

**Features:**
- Responsive grid (1-3 columns)
- Loading skeleton (6 cards)
- Empty state dengan icon
- Passes handlers ke EmployeeCard

---

### 4. EmployeeFilters
**File:** `employee-filters.tsx` (120 lines)

**Fungsi:** Kontrol pencarian dan filter

**Props:**
```typescript
{
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onStatusChange: (value: string) => void
  onAddEmployee: () => void
  onClearFilters?: () => void
}
```

**Features:**
- Search input dengan icon
- Clear search button
- Status filter dropdown (All, Aktif, Tidak Aktif, Cuti)
- Clear filters button
- Add employee button
- Responsive layout

---

### 5. EmployeeAddDialog
**File:** `employee-add-dialog.tsx` (250 lines)

**Fungsi:** Modal untuk menambah karyawan baru

**Props:**
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EmployeeFormData) => Promise<void>
  loading?: boolean
}
```

**Features:**
- Form fields: name, email, phone, position, PIN, status
- Client-side validation
- PIN visibility toggle
- Error messages per field
- Loading state
- Responsive grid (1-2 columns)

---

### 6. EmployeeEditDialog
**File:** `employee-edit-dialog.tsx` (250 lines)

**Fungsi:** Modal untuk edit karyawan existing

**Props:**
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onSubmit: (id: string, data: Partial<EmployeeFormData>) => Promise<void>
  loading?: boolean
}
```

**Features:**
- Pre-filled form dengan data existing
- Same fields as add dialog
- Validation
- PIN visibility toggle
- Update/Cancel buttons

---

### 7. EmployeeDeleteDialog
**File:** `employee-delete-dialog.tsx` (100 lines)

**Fungsi:** Konfirmasi hapus karyawan

**Props:**
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onConfirm: (id: string) => Promise<void>
  loading?: boolean
}
```

**Features:**
- Warning icon
- Employee name display
- Warning message
- Destructive action button
- Loading state

---

### 8. EmployeeDetailDialog
**File:** `employee-detail-dialog.tsx` (300 lines)

**Fungsi:** Menampilkan detail lengkap karyawan

**Props:**
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  stats: EmployeeStats | null
  attendance: EmployeeAttendance | null
  commissions: any[]
}
```

**Features:**
- 3 tabs: Overview, Statistik, Presensi
- Overview: info kontak, gaji
- Statistik: transaksi, revenue, komisi, bonus/penalty
- Presensi: attendance rate, present days, late days, overtime
- Responsive layout

---

### 9. EmployeeAbsenceDialog
**File:** `employee-absence-dialog.tsx` (200 lines)

**Fungsi:** Kelola hari libur karyawan

**Props:**
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  absenceInfo: AbsenceInfo
  onUpdateMaxDays: (employeeId: string, maxDays: number) => Promise<void>
  loading?: boolean
}
```

**Features:**
- Current absence days display
- Remaining days display
- Excess days warning (jika melebihi)
- Max days input
- Info message
- Update button

---

### 10. EmployeePayrollDialog
**File:** `employee-payroll-dialog.tsx` (200 lines)

**Fungsi:** Kelola pengaturan gaji

**Props:**
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onSubmit: (id: string, data: PayrollFormData) => Promise<void>
  loading?: boolean
}
```

**Features:**
- Base salary input dengan preview
- Commission rate input (%)
- Overtime rate input dengan preview
- Bonus points (read-only)
- Validation
- Save/Cancel buttons

---

## 📝 Types

### Core Types
Semua types didefinisikan di `types.ts`:

```typescript
// Employee
interface Employee {
  id: string
  name: string
  email: string
  phone: string | null
  position: string
  pin: string
  status: EmployeeStatus
  salary: number | null
  commission_rate: number | null
  overtime_rate: number | null
  created_at: string
  updated_at: string
}

type EmployeeStatus = 'active' | 'inactive' | 'on-leave'

// Statistics
interface EmployeeStats {
  totalTransactions: number
  totalRevenue: number
  totalCommission: number
  averageTransaction: number
  bonusPoints: number
  penaltyPoints: number
  totalBonus: number
  totalPenalty: number
}

// Attendance
interface EmployeeAttendance {
  data: AttendanceRecord[]
  attendanceRate: number
  presentDays: number
  lateDays: number
  overtimeHours: number
}

// Absence
interface AbsenceInfo {
  maxAbsentDays: number
  currentAbsentDays: number
  remainingDays: number
  excessDays: number
}

// Forms
interface EmployeeFormData {
  name: string
  email: string
  phone: string
  position: string
  pin: string
  status: EmployeeStatus
}

interface PayrollFormData {
  baseSalary: number
  commissionRate: number
  overtimeRate: number
  bonusPoints: number
}
```

Lihat `types.ts` untuk definisi lengkap.

---

## 🔧 Helper Functions

### Employee Helpers (`lib/utils/employee-helpers.ts`)

**Formatting Functions:**
- `formatRupiah(amount)` - Format ke IDR
- `formatRupiahDecimal(amount)` - Format dengan desimal
- `formatEmployeeStatus(status)` - Format status
- `formatPosition(position)` - Format posisi
- `getInitials(name)` - Get initials dari nama
- `formatPhone(phone)` - Format nomor telepon

**Calculation Functions:**
- `calculateTotalSalary(employee, stats)` - Hitung total gaji
- `calculateMonthlyEarnings(base, commission, overtime)` - Hitung pendapatan bulanan
- `calculateAttendanceRate(present, total)` - Hitung attendance rate
- `calculateOvertimePay(hours, rate)` - Hitung overtime pay
- `calculateBonusPenalty(bonus, penalty, rate)` - Hitung bonus/penalty
- `calculateAveragePerformance(stats)` - Hitung performa rata-rata

**Validation Functions:**
- `validateEmployeeForm(data)` - Validasi form karyawan
- `validateEmail(email)` - Validasi email
- `validatePhone(phone)` - Validasi telepon
- `validatePIN(pin)` - Validasi PIN
- `validatePayrollForm(data)` - Validasi form payroll

**Filtering Functions:**
- `filterEmployees(employees, filters)` - Filter karyawan
- `searchEmployees(employees, term)` - Search karyawan
- `sortEmployees(employees, field, order)` - Sort karyawan

**Status Helpers:**
- `getStatusColor(status)` - Get badge color
- `isEmployeeActive(employee)` - Check if active
- `isEmployeeOnLeave(employee)` - Check if on leave
- `isEmployeeInactive(employee)` - Check if inactive

**Statistics Helpers:**
- `getTopPerformers(employees, stats, limit)` - Get top performers
- `getEmployeeRank(employee, all, stats)` - Get employee rank
- `calculateEmployeeSummary(employees, stats, absent)` - Calculate summary

---

## 🪝 Custom Hook

### useEmployeeData (`lib/hooks/use-employee-data.ts`)

**Purpose:** Fetch dan manage employee data dengan real-time updates

**Returns:**
```typescript
{
  // Data
  employees: Employee[]
  employeeStats: Record<string, EmployeeStats>
  employeeCommissions: Record<string, any[]>
  employeeAttendance: Record<string, EmployeeAttendance>
  absentEmployees: Employee[]
  
  // Loading states
  loading: boolean
  statsLoading: boolean
  operationLoading: boolean
  
  // Error state
  error: string | null
  
  // Actions
  refetch: () => Promise<void>
  loadEmployeeStats: (employees: Employee[]) => Promise<void>
  loadAbsentEmployees: () => Promise<void>
  
  // CRUD operations
  addEmployee: (data: EmployeeFormData) => Promise<{ success: boolean; error?: string }>
  updateEmployee: (id: string, data: Partial<EmployeeFormData>) => Promise<{ success: boolean; error?: string }>
  deleteEmployee: (id: string) => Promise<{ success: boolean; error?: string }>
  
  // Operation state setters
  setOperationLoading: (loading: boolean) => void
}
```

**Features:**
- Fetch all employees on mount
- Load statistics for all employees
- Real-time updates via Supabase subscriptions
- Auto-refresh stats on changes
- CRUD operations with error handling
- Loading states management

**Usage:**
```tsx
import { useEmployeeData } from '@/lib/hooks/use-employee-data'

function MyComponent() {
  const {
    employees,
    employeeStats,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee
  } = useEmployeeData()
  
  // Use the data and operations...
}
```

---

## 🎨 Styling

### Responsive Design
Semua komponen responsive dengan breakpoints:
- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md)
- **Desktop:** > 1024px (lg)

### Color Scheme
- **Primary:** Blue (actions, totals)
- **Success:** Green (active status, positive metrics)
- **Warning:** Yellow (on-leave status)
- **Danger:** Red (inactive status, delete actions)
- **Neutral:** Gray (default, muted)

---

## 🔄 Data Flow

### 1. Data Fetching
```
useEmployeeData Hook
  ↓
Fetch from Supabase
  ↓
Load employee stats
  ↓
Real-time subscriptions
  ↓
Pass to components
```

### 2. CRUD Operations
```
User action (add/edit/delete)
  ↓
Validate form data
  ↓
Call API via hook
  ↓
Show toast notification
  ↓
Refetch data
  ↓
Update UI
```

### 3. Real-time Updates
```
Database change (any client)
  ↓
Supabase Realtime
  ↓
useEmployeeData hook
  ↓
Refresh stats only
  ↓
UI updates automatically
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] View employee list
- [ ] Search employees by name/email/phone/position
- [ ] Filter by status (all, active, inactive, on-leave)
- [ ] Clear filters
- [ ] Add new employee
- [ ] Edit existing employee
- [ ] Delete employee
- [ ] View employee details (all tabs)
- [ ] Manage absence days
- [ ] Manage payroll settings
- [ ] View statistics cards
- [ ] Check real-time updates
- [ ] Test responsive layout (mobile, tablet, desktop)
- [ ] Test loading states
- [ ] Test error states
- [ ] Test empty states
- [ ] Test form validation

---

## 🐛 Troubleshooting

### Issue: Employees not loading
**Solution:**
1. Check Supabase connection
2. Check RLS policies
3. Check browser console for errors
4. Verify `useEmployeeData` hook is working

### Issue: Stats not updating
**Solution:**
1. Check `loadEmployeeStats` is called
2. Verify employee_stats queries work
3. Check RLS policies allow read
4. Verify employee IDs are correct

### Issue: Real-time not working
**Solution:**
1. Check Supabase realtime is enabled
2. Verify subscription setup in hook
3. Check browser console for errors
4. Try manual refresh

### Issue: Form validation failing
**Solution:**
1. Check validation rules in helpers
2. Verify form data format
3. Check error messages display
4. Test with valid data first

---

## 📚 Related Documentation

- [Main Component](../employee-management-refactored.tsx)
- [Employee Helpers](../../lib/utils/employee-helpers.ts)
- [Custom Hook](../../lib/hooks/use-employee-data.ts)
- [Types Definition](./types.ts)
- [FASE 4 Design](../../FASE_4_EMPLOYEE_DESIGN.md)
- [Clean Architecture Guide](../../CLEAN_ARCHITECTURE.md)

---

## 🎯 Future Improvements

### Short Term
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add employee photo upload
- [ ] Add bulk operations
- [ ] Improve mobile UX

### Medium Term
- [ ] Add employee performance charts
- [ ] Add attendance calendar view
- [ ] Add commission history
- [ ] Add payroll reports
- [ ] Add export functionality

### Long Term
- [ ] Add employee self-service portal
- [ ] Add performance reviews
- [ ] Add training management
- [ ] Add document management
- [ ] Add AI-powered insights

---

**Created:** May 26, 2026  
**Last Updated:** May 26, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
