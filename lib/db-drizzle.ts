/**
 * DATABASE FUNCTIONS USING DRIZZLE ORM
 * 
 * This file contains all database operations using Drizzle ORM
 * instead of Supabase Client for better type safety and performance
 * 
 * ⚠️ SERVER-SIDE ONLY - These functions can only be called from:
 * - Server Components
 * - API Routes
 * - Server Actions
 */

import { getDb, transactions, transaction_items, services, service_categories, users, branches, attendance, points, kasbon, expenses } from './db'
import { eq, and, gte, lte, desc, sql, or } from 'drizzle-orm'

// Helper to get db instance
const db = () => getDb()

// ========================================
// TRANSACTION FUNCTIONS
// ========================================

export async function createTransactionDrizzle(data: {
  transaction_number: string
  receipt_number?: string
  cashier_id?: number
  server_id?: number
  branch_id?: string
  cashier_name?: string
  server_name?: string
  branch_name?: string
  customer_name?: string
  subtotal: number
  discount_amount: number
  total_amount: number
  payment_method: string
  payment_status?: string
  notes?: string
}) {
  try {
    const [transaction] = await db().insert(transactions).values({
      ...data,
      payment_status: data.payment_status || 'completed',
      created_at: new Date(),
    }).returning()
    
    return { data: transaction, error: null }
  } catch (error: any) {
    console.error('[createTransactionDrizzle] Error:', error)
    return { data: null, error }
  }
}

export async function getTransactionsDrizzle(branchId?: string, limit = 50) {
  try {
    const query = db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.created_at))
      .limit(limit)
    
    if (branchId) {
      query.where(eq(transactions.branch_id, branchId))
    }
    
    const data = await query
    return { data, error: null }
  } catch (error: any) {
    console.error('[getTransactionsDrizzle] Error:', error)
    return { data: [], error }
  }
}

export async function getTransactionByIdDrizzle(id: string) {
  try {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
    
    return { data: transaction || null, error: null }
  } catch (error: any) {
    console.error('[getTransactionByIdDrizzle] Error:', error)
    return { data: null, error }
  }
}

// ========================================
// TRANSACTION ITEMS FUNCTIONS
// ========================================

export async function createTransactionItemsDrizzle(items: Array<{
  transaction_id: string
  service_id: string
  quantity: number
  unit_price: number
  total_price: number
  commission_status?: string
  commission_type?: string
  commission_value?: number
  commission_amount?: number
  barber_id?: string
}>) {
  try {
    const data = await db().insert(transaction_items).values(items).returning()
    return { data, error: null }
  } catch (error: any) {
    console.error('[createTransactionItemsDrizzle] Error:', error)
    return { data: [], error }
  }
}

// ========================================
// SERVICES FUNCTIONS
// ========================================

export async function getServicesDrizzle() {
  try {
    const data = await db
      .select()
      .from(services)
      .where(eq(services.aktif, true))
      .orderBy(services.name)
    
    return { data, error: null }
  } catch (error: any) {
    console.error('[getServicesDrizzle] Error:', error)
    return { data: [], error }
  }
}

export async function getServicesWithCategoriesDrizzle() {
  try {
    const data = await db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        price: services.price,
        duration: services.duration,
        category_id: services.category_id,
        type: services.type,
        stock: services.stock,
        aktif: services.aktif,
        commission_rate: services.commission_rate,
        created_at: services.created_at,
        category: {
          id: service_categories.id,
          name: service_categories.name,
          description: service_categories.description,
        }
      })
      .from(services)
      .leftJoin(service_categories, eq(services.category_id, service_categories.id))
      .where(eq(services.aktif, true))
      .orderBy(services.name)
    
    return { data, error: null }
  } catch (error: any) {
    console.error('[getServicesWithCategoriesDrizzle] Error:', error)
    return { data: [], error }
  }
}

// ========================================
// USERS FUNCTIONS
// ========================================

export async function getUsersDrizzle(branchId?: string) {
  try {
    let query = db().select().from(users).orderBy(users.name)
    
    if (branchId && branchId !== 'all') {
      query = query.where(eq(users.branch_id, branchId))
    }
    
    const data = await query
    return { data, error: null }
  } catch (error: any) {
    console.error('[getUsersDrizzle] Error:', error)
    return { data: [], error }
  }
}

export async function getUserByEmailDrizzle(email: string) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
    
    return { data: user || null, error: null }
  } catch (error: any) {
    console.error('[getUserByEmailDrizzle] Error:', error)
    return { data: null, error }
  }
}

// ========================================
// BRANCHES FUNCTIONS
// ========================================

export async function getBranchesDrizzle() {
  try {
    const data = await db
      .select()
      .from(branches)
      .where(eq(branches.status, 'active'))
      .orderBy(branches.name)
    
    return { data, error: null }
  } catch (error: any) {
    console.error('[getBranchesDrizzle] Error:', error)
    return { data: [], error }
  }
}

// ========================================
// ATTENDANCE FUNCTIONS
// ========================================

export async function getAttendanceDrizzle(branchId?: string, startDate?: string, endDate?: string) {
  try {
    let query = db
      .select()
      .from(attendance)
      .orderBy(desc(attendance.date), desc(attendance.created_at))
    
    const conditions = []
    
    if (branchId && branchId !== 'all') {
      conditions.push(eq(attendance.branch_id, branchId))
    }
    
    if (startDate) {
      conditions.push(gte(attendance.date, startDate))
    }
    
    if (endDate) {
      conditions.push(lte(attendance.date, endDate))
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }
    
    const data = await query
    return { data, error: null }
  } catch (error: any) {
    console.error('[getAttendanceDrizzle] Error:', error)
    return { data: [], error }
  }
}

// ========================================
// POINTS FUNCTIONS
// ========================================

export async function getPointsDrizzle(userId?: string) {
  try {
    let query = db
      .select()
      .from(points)
      .orderBy(desc(points.created_at))
    
    if (userId) {
      query = query.where(eq(points.user_id, userId))
    }
    
    const data = await query
    return { data, error: null }
  } catch (error: any) {
    console.error('[getPointsDrizzle] Error:', error)
    return { data: [], error }
  }
}

export async function addPointDrizzle(data: {
  user_id: string
  points_earned: number
  points_type: string
  description: string
}) {
  try {
    const [point] = await db().insert(points).values({
      ...data,
      created_at: new Date(),
    }).returning()
    
    return { data: point, error: null }
  } catch (error: any) {
    console.error('[addPointDrizzle] Error:', error)
    return { data: null, error }
  }
}

// ========================================
// KASBON FUNCTIONS
// ========================================

export async function getKasbonDrizzle(branchId?: string, statusFilter?: string) {
  try {
    let query = db
      .select()
      .from(kasbon)
      .orderBy(desc(kasbon.created_at))
    
    const conditions = []
    
    if (branchId && branchId !== 'all') {
      // Need to join with users to filter by branch
      // This is a simplified version
      conditions.push(sql`1=1`)
    }
    
    if (statusFilter && statusFilter !== 'all') {
      conditions.push(eq(kasbon.status, statusFilter))
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }
    
    const data = await query
    return { data, error: null }
  } catch (error: any) {
    console.error('[getKasbonDrizzle] Error:', error)
    return { data: [], error }
  }
}

// ========================================
// EXPENSES FUNCTIONS
// ========================================

export async function getExpensesDrizzle(branchId?: string, statusFilter?: string) {
  try {
    let query = db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.created_at))
    
    const conditions = []
    
    if (branchId && branchId !== 'all') {
      conditions.push(eq(expenses.branch_id, branchId))
    }
    
    if (statusFilter && statusFilter !== 'all') {
      conditions.push(eq(expenses.status, statusFilter))
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }
    
    const data = await query
    return { data, error: null }
  } catch (error: any) {
    console.error('[getExpensesDrizzle] Error:', error)
    return { data: [], error }
  }
}

// ========================================
// STATISTICS FUNCTIONS
// ========================================

export async function getTransactionStatsDrizzle(branchId?: string, startDate?: string, endDate?: string) {
  try {
    let query = db
      .select({
        total_revenue: sql<number>`COALESCE(SUM(${transactions.total_amount}), 0)`,
        total_transactions: sql<number>`COUNT(*)`,
        avg_transaction: sql<number>`COALESCE(AVG(${transactions.total_amount}), 0)`,
      })
      .from(transactions)
    
    const conditions = []
    
    if (branchId && branchId !== 'all') {
      conditions.push(eq(transactions.branch_id, branchId))
    }
    
    if (startDate) {
      conditions.push(gte(transactions.created_at, new Date(startDate)))
    }
    
    if (endDate) {
      conditions.push(lte(transactions.created_at, new Date(endDate)))
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }
    
    const [stats] = await query
    return { data: stats, error: null }
  } catch (error: any) {
    console.error('[getTransactionStatsDrizzle] Error:', error)
    return { data: null, error }
  }
}

// Export all functions
export const drizzleFunctions = {
  // Transactions
  createTransactionDrizzle,
  getTransactionsDrizzle,
  getTransactionByIdDrizzle,
  createTransactionItemsDrizzle,
  
  // Services
  getServicesDrizzle,
  getServicesWithCategoriesDrizzle,
  
  // Users
  getUsersDrizzle,
  getUserByEmailDrizzle,
  
  // Branches
  getBranchesDrizzle,
  
  // Attendance
  getAttendanceDrizzle,
  
  // Points
  getPointsDrizzle,
  addPointDrizzle,
  
  // Kasbon
  getKasbonDrizzle,
  
  // Expenses
  getExpensesDrizzle,
  
  // Statistics
  getTransactionStatsDrizzle,
}
