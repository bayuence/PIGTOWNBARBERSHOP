/**
 * TypeScript Interfaces & Types
 * Semua tipe data untuk aplikasi
 */

// =============================
// USER & BRANCH TYPES
// =============================

export interface User {
  id: string
  email?: string
  name: string
  position?: string
  branch_id?: string
  phone?: string
  address?: string
  status?: string
  created_at: string
}

export interface Branch {
  id: string
  name: string
  address?: string
  phone?: string
  status?: string
  manager_id?: string
  manager_name?: string
  operating_hours?: {
    open: string
    close: string
  }
  created_at: string
  shifts?: BranchShift[]
}

export interface BranchShift {
  id: string
  branch_id: string
  shift_name: string
  start_time: string
  end_time: string
  days: string[]
  max_employees: number
  current_employees: number
  status: string
}

// =============================
// SERVICE TYPES
// =============================

export interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration?: number
  aktif: boolean
  category_id?: string
  commission_rate?: number
  type: string
  stock?: number
  status: string
  created_at: string
}

// =============================
// TRANSACTION TYPES
// =============================

export interface Transaction {
  id: string
  transaction_number: string
  customer_name: string
  subtotal: number
  discount: number
  total: number
  payment_method: string
  payment_status: string
  notes?: string
  created_at: string
  cashier_id?: string
  branch_id?: string
  cashier?: {
    name: string
  }
  branch?: {
    name: string
  }
  server_id?: string
  server?: {
    name: string
  }
  transaction_items?: {
    quantity: number
    unit_price: number
    total_price: number
    service_id: string
    service?: {
      name: string
    }
  }[]
}

export interface TransactionWithItems extends Transaction {
  receipt_number?: string
  transaction_items?: TransactionItemWithService[]
}

export interface TransactionItem {
  id: string
  transaction_id: string
  service_id: string
  barber_id?: string
  quantity: number
  price: number
  subtotal: number
  commission_rate?: number
  commission_amount?: number
  commission_status?: string
  service_name: string
  service_type: string
  service_category?: string
  barber_name?: string
  created_at: string
}

export interface TransactionItemWithService extends TransactionItem {
  service?: Service
  barber?: User
}

// =============================
// ATTENDANCE TYPES
// =============================

export interface Attendance {
  id: string
  user_id: string
  branch_id: string
  date: string
  shift_type: string
  check_in_time: string
  check_out_time?: string
  check_in_photo?: string
  check_out_photo?: string
  break_start_time?: string
  break_end_time?: string
  break_duration?: number
  total_hours?: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  user?: User
  branch?: Branch
}

// =============================
// KASBON TYPES
// =============================

export interface Kasbon {
  id: string
  user_id: string
  amount: number
  remaining_amount: number
  reason: string
  status: string
  request_date: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  installment_amount?: number
  notes?: string
  created_at: string
  updated_at: string
  user?: User
  approver?: User
}

// =============================
// EXPENSE TYPES
// =============================

export interface Expense {
  id: string
  branch_id: string
  category: string
  amount: number
  description: string
  receipt_url?: string
  requested_by: string
  status: string
  approved_by?: string
  approved_at?: string
  rejection_notes?: string
  expense_date: string
  created_at: string
  updated_at: string
  branch?: Branch
  requester?: User
  approver?: User
}

// =============================
// COMMISSION TYPES
// =============================

export interface Commission {
  id: string
  user_id: string
  transaction_id: string
  transaction_item_id: string
  amount: number
  status: string
  paid_at?: string
  notes?: string
  created_at: string
  user?: User
  transaction?: Transaction
}

export interface CommissionRule {
  id: string
  user_id: string
  service_id: string
  commission_type: 'percentage' | 'fixed'
  commission_value: number
  created_at: string
  updated_at: string
}

// =============================
// POINTS TYPES
// =============================

export interface Point {
  id: string
  user_id: string
  type: string
  points: number
  reason: string
  given_by: string
  created_at: string
  user?: User
  giver?: User
}

// =============================
// CUSTOMER TYPES
// =============================

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  total_visits?: number
  total_spent?: number
  loyalty_points?: number
  notes?: string
  created_at: string
  updated_at: string
}

// =============================
// STATS & ANALYTICS TYPES
// =============================

export interface EmployeeStats {
  totalTransactions: number
  totalRevenue: number
  totalCommission: number
  pendingCommission: number
  attendanceDays: number
  averageRating: number
}

export interface BranchStats {
  totalRevenue: number
  totalTransactions: number
  totalEmployees: number
  activeEmployees: number
  todayRevenue: number
  todayTransactions: number
}

export interface DashboardStats {
  totalRevenue: number
  totalTransactions: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  activeBranches: number
  activeEmployees: number
  todayRevenue: number
  todayTransactions: number
}

// =============================
// UTILITY TYPES
// =============================

export type PaymentMethod = 'cash' | 'qris' | 'debit' | 'credit' | 'transfer'
export type PaymentStatus = 'completed' | 'pending' | 'refunded' | 'cancelled'
export type UserRole = 'owner' | 'admin' | 'manager' | 'cashier' | 'barber' | 'employee'
export type UserStatus = 'active' | 'inactive' | 'suspended'
export type AttendanceStatus = 'checked_in' | 'on_break' | 'checked_out' | 'absent'
export type KasbonStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'partially_paid'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected'
export type CommissionStatus = 'pending' | 'credited' | 'paid'
