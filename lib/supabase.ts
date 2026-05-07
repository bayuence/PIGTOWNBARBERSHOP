import { createClient } from "@supabase/supabase-js"
import { getBusinessDaysCount } from './date-utils';

// =============================
// Konfigurasi Supabase
// =============================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkrrjvcgviwnliinovik.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcnJqdmNndml3bmxpaW5vdmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDE4MjQsImV4cCI6MjA3MDY3NzgyNH0.uf7R06Gd6Mgf_3Zv3Q184HWPqzo6kbrfhQ1BkkdM9iM"

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.")
}
if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-application-name': 'pigtown-barbershop',
    },
  },
});

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("points").select('*, users!inner(name, branch_id, branches:branch_id(name))')
    if (error) {
      console.error("Supabase connection test failed:", error)
      return false
    }
    console.log("Supabase connection successful")
    return true
  } catch (error) {
    console.error("Supabase connection error:", error)
    return false
  }
}
// =============================
// 🔥 FUNGSI BARU: Hitung Hari Kerja
// =============================
function getBusinessDaysCount(startDate: Date, endDate: Date): number {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    
    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        // 0 = Minggu, 6 = Sabtu (tidak dihitung sebagai hari kerja)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    
    return count;
}


// =============================
// Interfaces
// =============================

// --- User & Branch ---
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

export interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration?: number
  category?: string
  status?: string
  stock?: number
  type?: "service" | "product"
  created_at: string
}

export interface ServiceCategory {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ServiceWithCategory extends Service {
  category_id?: string
  is_active?: boolean
  commission_rate?: number
  service_categories?: ServiceCategory
}

// --- Transaction ---
export interface Transaction {
  id: string
  transaction_number: string
  customer_name: string
  total_amount: number
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
  final_amount?: number
  subtotal?: number
  discount_amount?: number
  transaction_items?: TransactionItemWithService[]
}

export interface TransactionItem {
  id: string
  transaction_id: string
  service_id: string
  quantity: number
  unit_price: number
  total_price: number
  service?: { name: string; description?: string }
}

export interface TransactionItemWithService extends TransactionItem {
  service?: ServiceWithCategory
}

// --- Attendance ---
export interface Attendance {
  id: string
  user_id: string
  branch_id?: string
  shift_type: "pagi" | "siang" | "malam"
  check_in_time?: string
  check_out_time?: string
  break_start_time?: string
  break_end_time?: string
  total_hours?: number
  break_duration?: number
  status: "checked_in" | "on_break" | "checked_out" | "absent"
  check_in_photo?: string
  check_out_photo?: string
  date: string
  created_at: string
  updated_at?: string
}

export interface AttendanceWithDetails extends Attendance {
  users?: Employee
  branches?: Branch
}

// --- Menu ---
export interface MenuCategory {
  id: string
  name: string
  description?: string
  icon: string
  status: "active" | "inactive"
  sort_order: number
  created_at: string
}

export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  duration?: number
  status: "active" | "inactive"
  created_at: string
}

export interface ReceiptTemplate {
  id: string
  name: string
  header_text?: string
  footer_text?: string
  logo_url?: string
  is_active?: boolean
  show_logo?: boolean
  show_address?: boolean
  show_phone?: boolean
  show_date?: boolean
  show_barber?: boolean
  created_at?: string
}

export interface ReceiptTemplateWithBranch extends ReceiptTemplate {
  branch_id?: string
  template_name?: string
  paper_width?: number
}

// --- Points System ---
export interface Point {
  id: string
  user_id: string
  points_earned: number
  description: string
  points_type: string
  created_at: string
  updated_at?: string
}

export interface UserWithPoints extends User {
  total_points?: number
  monthly_points?: number
  rank?: number
  points?: Point[]
  branches: {
    name: string
  } | null
}

// =============================
// Kasbon Interfaces
// =============================
export interface Kasbon {
  id: string
  user_id: string
  amount: number
  reason: string
  status: "pending" | "approved" | "rejected" | "paid"
  request_date: string
  due_date?: string
  notes?: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at?: string
}

export interface KasbonWithUser extends Kasbon {
  user?: User
  approver?: {
    id: string
    name: string
  }
}

export interface UserWithKasbon extends User {
  total_kasbon?: number
  active_kasbon?: number
  kasbon_history?: Kasbon[]
}

// =============================
// Expense Management Interfaces
// =============================
export interface Expense {
  id: string
  branch_id?: string
  category: string
  description: string
  amount: number
  status: "pending" | "approved" | "rejected" | "paid"
  request_date: string
  due_date?: string
  receipt_url?: string
  notes?: string
  requested_by: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at?: string
}

export interface ExpenseWithUser extends Expense {
  users?: User
  branches?: Branch
}

// =============================
// Branch Shift Management
// =============================
export interface BranchShift {
  id: string
  branch_id: string
  shift_name: string
  shift_type: "pagi" | "siang" | "malam"
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export async function getBranchShifts(branchId: string) {
  console.log("[v0] getBranchShifts called with branchId:", branchId)

  const { data, error } = await supabase
    .from("branch_shifts")
    .select("*")
    .eq("branch_id", branchId)
    .eq("is_active", true)
    .order("start_time")

  console.log("[v0] Branch shifts result:", { data, error })

  if (error || !data || data.length === 0) {
    console.log("[v0] No shifts found, returning default shifts")
    return {
      data: [
        {
          id: `default-pagi-${branchId}`,
          branch_id: branchId,
          shift_name: "Shift Pagi",
          shift_type: "pagi" as const,
          start_time: "08:00",
          end_time: "16:00",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: `default-siang-${branchId}`,
          branch_id: branchId,
          shift_name: "Shift Siang",
          shift_type: "siang" as const,
          start_time: "12:00",
          end_time: "20:00",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: `default-malam-${branchId}`,
          branch_id: branchId,
          shift_name: "Shift Malam",
          shift_type: "malam" as const,
          start_time: "20:00",
          end_time: "04:00",
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    }
  }

  return { data, error: null }
}

export async function createBranchShift(shiftData: Omit<BranchShift, "id" | "created_at">) {
  console.log("[v0] createBranchShift called with:", shiftData)

  const shiftToInsert = {
    ...shiftData,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from("branch_shifts").insert([shiftToInsert]).select().single()

  console.log("[v0] Create branch shift result:", { data, error })
  return error ? { data: null, error } : { data, error: null }
}

// =============================
// Fungsi helper Attendance
// =============================
export async function uploadPhotoToSupabase(base64: string, filename: string): Promise<string | null> {
  try {
    function base64ToBlob(base64Data: string, contentType = "image/jpeg") {
      const byteCharacters = atob(base64Data.split(",")[1])
      const byteArrays = []
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512)
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i)
        byteArrays.push(new Uint8Array(byteNumbers))
      }
      return new Blob(byteArrays, { type: contentType })
    }

    const blob = base64ToBlob(base64)
    const { error } = await supabase.storage.from("attendance-photos").upload(filename, blob, {
      cacheControl: "3600",
      upsert: true,
      contentType: "image/jpeg",
    })
    if (error) throw error

    const { data: publicUrlData } = supabase.storage.from("attendance-photos").getPublicUrl(filename)
    return publicUrlData?.publicUrl || null
  } catch (error) {
    console.error("Photo upload failed:", error)
    return null
  }
}

export async function createAttendanceRecord(attendanceData: Partial<Attendance>) {
  const { data, error } = await supabase.from("attendance").insert([attendanceData]).select().single()
  return error ? { data: null, error } : { data, error: null }
}

export async function updateAttendanceRecord(id: string, updates: Partial<Attendance>) {
  const { data, error } = await supabase
    .from("attendance")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  return error ? { data: null, error } : { data, error: null }
}

export async function getAttendanceByDate(userId: string, date: string) {
  const { data, error } = await supabase.from("attendance").select("*").eq("user_id", userId).eq("date", date).single()
  return error && error.code !== "PGRST116" ? { data: null, error } : { data, error: null }
}

export async function getAllAttendanceRecords(branchId?: string) {
  let query = supabase
    .from("attendance")
    .select(`*,
      users:user_id ( id, name, email ),
      branches:branch_id ( id, name )
    `)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
  if (branchId) query = query.eq("branch_id", branchId)
  const { data, error } = await query
  return error ? { data: [], error } : { data: data || [], error: null }
}

// =============================
// Fungsi helper POS
// =============================
export async function getServicesWithCategories() {
  const { data, error } = await supabase
    .from("services")
    .select(`*,
    service_categories ( id, name, description )
  `)
    .order("name")
  return error ? { data: [], error } : { data: data || [], error: null }
}

export async function getServiceCategories() {
  const { data, error } = await supabase.from("service_categories").select("*").order("name")
  return error ? { data: [], error } : { data: data || [], error: null }
}

export async function createTransaction(transactionData: Partial<TransactionWithItems>) {
  const transactionNumber = await generateTransactionNumber()
  let { cashier_id, branch_id, server_id } = transactionData

  // Get cashier, branch, server data untuk snapshot
  let cashierName = 'Unknown'
  let branchName = 'Unknown'
  let serverName: string | undefined

  if (!cashier_id) {
    const { data: users } = await supabase.from("users").select("id, name").limit(1).single()
    cashier_id = users?.id
    cashierName = users?.name || 'Unknown'
  } else {
    const { data: cashier } = await supabase.from("users").select("name").eq("id", cashier_id).single()
    cashierName = cashier?.name || 'Unknown'
  }

  if (!branch_id) {
    const { data: branches } = await supabase.from("branches").select("id, name").limit(1).single()
    branch_id = branches?.id
    branchName = branches?.name || 'Unknown'
  } else {
    const { data: branch } = await supabase.from("branches").select("name").eq("id", branch_id).single()
    branchName = branch?.name || 'Unknown'
  }

  if (server_id) {
    const { data: server } = await supabase.from("users").select("name").eq("id", server_id).single()
    serverName = server?.name
  }

  const transactionToInsert = {
    ...transactionData,
    transaction_number: transactionNumber,
    receipt_number: transactionNumber,
    cashier_id,
    cashier_name: cashierName,
    branch_id,
    branch_name: branchName,
    server_id,
    server_name: serverName,
    subtotal: transactionData.subtotal || transactionData.total_amount || 0,
    payment_status: transactionData.payment_status || "completed",
    payment_method: transactionData.payment_method || "cash",
    total_amount: transactionData.total_amount || 0,
    discount_amount: transactionData.discount_amount || 0,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from("transactions").insert([transactionToInsert]).select().single()
  return error ? { data: null, error } : { data, error: null }
}

export async function createTransactionItems(items: Partial<TransactionItem>[]) {
  // Enrich items dengan snapshot data dari services
  const enrichedItems = await Promise.all(items.map(async (item) => {
    if (item.service_id) {
      const { data: service } = await supabase
        .from("services")
        .select("name, type, service_categories(name)")
        .eq("id", item.service_id)
        .single()
      
      return {
        ...item,
        service_name: service?.name || 'Unknown Service',
        service_type: service?.type,
        service_category: service?.service_categories?.name
      }
    }
    return item
  }))

  const { data, error } = await supabase.from("transaction_items").insert(enrichedItems).select()
  return error ? { data: [], error } : { data: data || [], error: null }
}

export async function getReceiptTemplate(branchId?: string) {
  let query = supabase.from("receipt_templates").select("*")
  if (branchId) query = query.eq("branch_id", branchId)
  const { data, error } = await query.single()
  return error && error.code !== "PGRST116" ? { data: null, error } : { data, error: null }
}

export async function getActiveReceiptTemplate(branchId?: string) {
  // Priority 1: Try to get active template (is_active = true)
  let query = supabase.from("receipt_templates").select("*").eq("is_active", true)
  if (branchId) query = query.eq("branch_id", branchId)
  const { data: activeData, error: activeError } = await query.single()
  
  if (activeData && !activeError) {
    return { data: activeData, error: null }
  }
  
  // Priority 2: If no active template, get default template (is_default = true)
  let defaultQuery = supabase.from("receipt_templates").select("*").eq("is_default", true)
  if (branchId) defaultQuery = defaultQuery.eq("branch_id", branchId)
  const { data: defaultData, error: defaultError } = await defaultQuery.single()
  
  if (defaultData && !defaultError) {
    return { data: defaultData, error: null }
  }
  
  // Priority 3: Fallback to any template
  return await getReceiptTemplate(branchId)
}

export async function getBranches() {
  const { data, error } = await supabase.from("branches").select("*").order("name")
  return error ? { data: [], error } : { data: data || [], error: null }
}

export async function generateTransactionNumber(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("generate_receipt_number")
    if (!error && data) return data

    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
    const { data: transactions } = await supabase
      .from("transactions")
      .select("transaction_number")
      .gte("created_at", `${today.toISOString().slice(0, 10)}T00:00:00.000Z`)
      .lt("created_at", `${today.toISOString().slice(0, 10)}T23:59:59.999Z`)
    const counter = (transactions?.length || 0) + 1
    return `${dateStr}${counter.toString().padStart(3, "0")}`
  } catch {
    return `${Date.now()}`
  }
}

// =============================
// Fungsi helper Stock Management
// =============================
export async function checkServiceStock(serviceId: string): Promise<number> {
  const { data, error } = await supabase.from("services").select("stock").eq("id", serviceId).single()
  return error ? 0 : data?.stock || 0
}

export async function reduceServiceStock(serviceId: string, quantity: number) {
  const { data: currentService, error: fetchError } = await supabase
    .from("services")
    .select("stock")
    .eq("id", serviceId)
    .single()
  if (fetchError) return { data: null, error: fetchError }

  const currentStock = currentService.stock || 0
  const newStock = Math.max(0, currentStock - quantity)

  const { data, error } = await supabase
    .from("services")
    .update({ stock: newStock })
    .eq("id", serviceId)
    .select("stock")
    .single()
  return error ? { data: null, error } : { data, error: null }
}

export async function updateServiceStock(serviceId: string, newStock: number) {
  const { data, error } = await supabase
    .from("services")
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq("id", serviceId)
    .select()
    .single()
  return error ? { data: null, error } : { data, error: null }
}

// =============================
// Fungsi helper Points System
// =============================
export async function getUsersWithPoints(branchId?: string) {
  console.log("[v1] getUsersWithPoints called with branchId:", branchId);

  let usersQuery = supabase.from("users").select("*, branches:branch_id(name)").order("name");
  if (branchId && branchId !== "all") {
    usersQuery = usersQuery.eq("branch_id", branchId);
  }

  const { data: users, error: usersError } = await usersQuery;
  if (usersError) return { data: [], error: usersError };
  if (!users) return { data: [], error: null };

  const { data: allPoints, error: pointsError } = await supabase
    .from("points")
    .select("user_id, points_earned, created_at");
  if (pointsError) return { data: [], error: pointsError };

  const usersWithCalculatedPoints = users.map((user: any) => {
    const userPoints = allPoints?.filter((point) => point.user_id === user.id) || [];
    const totalPoints = userPoints.reduce((sum, point) => sum + (point.points_earned || 0), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyPoints = userPoints.reduce((sum, point) => {
      const pointDate = new Date(point.created_at);
      if (pointDate.getMonth() === currentMonth && pointDate.getFullYear() === currentYear) {
        return sum + (point.points_earned || 0);
      }
      return sum;
    }, 0);

    return {
      ...user,
      total_points: totalPoints,
      monthly_points: monthlyPoints,
    };
  });

  const sortedUsers = usersWithCalculatedPoints
    .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
    .map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

  console.log("[v1] Final sorted users:", sortedUsers);
  return { data: sortedUsers, error: null };
}

export async function getPointsStatistics(branchId?: string) {
  const { data: users, error } = await getUsersWithPoints(branchId)

  if (error) return { data: null, error }

  const totalEmployees = users.length
  const topPerformer = users[0] || null
  const totalPoints = users.reduce((sum, user) => sum + (user.total_points || 0), 0)
  const averagePoints = totalEmployees > 0 ? Math.round(totalPoints / totalEmployees) : 0

  return {
    data: {
      totalEmployees,
      topPerformer,
      averagePoints,
      totalPoints,
    },
    error: null,
  }
}

export async function getPointTransactions(branchId?: string, limit = 50) {
  console.log("[v3 Final] getPointTransactions called with branchId:", branchId);

  try {
    // First, get point transactions
    let query = supabase
      .from("points")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (branchId && branchId !== "all") {
      // Filter by user's branch_id
      const { data: usersInBranch, error: usersError } = await supabase
        .from("users")
        .select("id")
        .eq("branch_id", branchId);
      
      if (usersError) {
        console.error("Error fetching users in branch:", usersError);
        return { data: [], error: usersError };
      }
      
      if (usersInBranch && usersInBranch.length > 0) {
        const userIds = usersInBranch.map(u => u.id);
        query = query.in("user_id", userIds);
      } else {
        // No users in this branch, return empty
        console.log("No users found in branch:", branchId);
        return { data: [], error: null };
      }
    }

    const { data: pointsData, error } = await query;

    if (error) {
      console.error("Error fetching point transactions:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      return { data: [], error };
    }

    if (!pointsData || pointsData.length === 0) {
      console.log("No point transactions found");
      return { data: [], error: null };
    }

    // Get user details for all points
    const userIds = [...new Set(pointsData.map(p => p.user_id).filter(Boolean))];
    let usersMap: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, name, branch_id")
        .in("id", userIds);
      
      if (users) {
        usersMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
      }
    }

    // Get all unique branch_ids
    const branchIds = [...new Set(Object.values(usersMap).map((u: any) => u.branch_id).filter(Boolean))];
    
    // Fetch branch details
    let branchesMap: Record<string, any> = {};
    if (branchIds.length > 0) {
      const { data: branches } = await supabase
        .from("branches")
        .select("id, name")
        .in("id", branchIds);
      
      if (branches) {
        branchesMap = branches.reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
      }
    }

    // Merge user and branch info into points
    const enrichedData = pointsData?.map(point => ({
      ...point,
      users: point.user_id ? {
        ...usersMap[point.user_id],
        branches: usersMap[point.user_id]?.branch_id ? branchesMap[usersMap[point.user_id].branch_id] : null
      } : null
    }));

    console.log("Point transactions fetched successfully:", enrichedData?.length || 0, "records");
    return { data: enrichedData || [], error: null };
  } catch (error) {
    console.error("Unexpected error in getPointTransactions:", error);
    return { data: [], error: error as any };
  }
}

export async function addPointTransaction(pointData: {
  user_id: string
  points: number
  description: string
  type: "earned" | "deducted" | "bonus" | "penalty"
}) {
  const { data, error } = await supabase
    .from("points")
    .insert([
      {
        ...pointData,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  return error ? { data: null, error } : { data, error: null }
}

export async function getUserPoints(userId: string) {
  const { data, error } = await supabase
    .from("points")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return error ? { data: [], error } : { data: data || [], error: null }
}

// =============================
// Kasbon Functions
// =============================
export async function getKasbonRequests(branchId?: string, statusFilter?: string) {
  console.log("[v0] getKasbonRequests called with:", { branchId, statusFilter })

  try {
    // First, get kasbon requests
    let query = supabase
      .from("kasbon")
      .select("*")
      .order("created_at", { ascending: false })

    if (branchId && branchId !== "all") {
      // Filter by user's branch_id
      const { data: usersInBranch, error: usersError } = await supabase
        .from("users")
        .select("id")
        .eq("branch_id", branchId);
      
      if (usersError) {
        console.error("Error fetching users in branch:", usersError);
        return { data: [], error: usersError };
      }
      
      if (usersInBranch && usersInBranch.length > 0) {
        const userIds = usersInBranch.map(u => u.id);
        query = query.in("user_id", userIds);
      } else {
        console.log("No users found in branch:", branchId);
        return { data: [], error: null };
      }
    }

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    const { data: kasbonData, error } = await query

    if (error) {
      console.error("[v0] Kasbon requests error:", error)
      return { data: [], error }
    }

    if (!kasbonData || kasbonData.length === 0) {
      console.log("[v0] No kasbon requests found")
      return { data: [], error: null }
    }

    // Get user details
    const userIds = [...new Set(kasbonData.map(k => k.user_id).filter(Boolean))];
    let usersMap: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email, position, branch_id")
        .in("id", userIds);
      
      if (users) {
        usersMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
      }
    }

    // Get approver details
    const approverIds = [...new Set(kasbonData.map(k => k.approved_by).filter(Boolean))];
    let approversMap: Record<string, any> = {};
    
    if (approverIds.length > 0) {
      const { data: approvers } = await supabase
        .from("users")
        .select("id, name")
        .in("id", approverIds);
      
      if (approvers) {
        approversMap = approvers.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
      }
    }

    // Merge user and approver info
    const enrichedData = kasbonData.map(kasbon => ({
      ...kasbon,
      user: kasbon.user_id ? usersMap[kasbon.user_id] : null,
      approver: kasbon.approved_by ? approversMap[kasbon.approved_by] : null
    }));

    console.log("[v0] Kasbon requests result:", enrichedData?.length || 0, "records")
    return { data: enrichedData || [], error: null }
  } catch (error) {
    console.error("[v0] Unexpected error in getKasbonRequests:", error);
    return { data: [], error: error as any };
  }
}

export async function getKasbonStatistics(branchId?: string) {
  console.log("[v0] getKasbonStatistics called with branchId:", branchId)

  try {
    let query = supabase.from("kasbon").select("amount, status, user_id")

    if (branchId && branchId !== "all") {
      // Filter by user's branch_id
      const { data: usersInBranch, error: usersError } = await supabase
        .from("users")
        .select("id")
        .eq("branch_id", branchId);
      
      if (usersError) {
        console.error("Error fetching users in branch:", usersError);
        return {
          data: {
            pendingAmount: 0,
            approvedAmount: 0,
            totalPaid: 0,
            activeEmployees: 0,
          },
          error: usersError,
        }
      }
      
      if (usersInBranch && usersInBranch.length > 0) {
        const userIds = usersInBranch.map(u => u.id);
        query = query.in("user_id", userIds);
      } else {
        return {
          data: {
            pendingAmount: 0,
            approvedAmount: 0,
            totalPaid: 0,
            activeEmployees: 0,
          },
          error: null,
        }
      }
    }

    const { data, error } = await query

    if (error) {
      console.log("[v0] Error fetching kasbon statistics:", error)
      return {
        data: {
          pendingAmount: 0,
          approvedAmount: 0,
          totalPaid: 0,
          activeEmployees: 0,
        },
        error,
      }
    }

    const pendingAmount = data?.filter((k) => k.status === "pending").reduce((sum, k) => sum + (k.amount || 0), 0) || 0
    const approvedAmount = data?.filter((k) => k.status === "approved").reduce((sum, k) => sum + (k.amount || 0), 0) || 0
    const totalPaid = data?.filter((k) => k.status === "paid").reduce((sum, k) => sum + (k.amount || 0), 0) || 0

    const { data: usersData } = await supabase.from("users").select("id").eq("status", "active")
    const activeEmployees = usersData?.length || 0

    const statistics = {
      pendingAmount,
      approvedAmount,
      totalPaid,
      activeEmployees,
    }

    console.log("[v0] Kasbon statistics result:", statistics)
    return { data: statistics, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error in getKasbonStatistics:", error);
    return {
      data: {
        pendingAmount: 0,
        approvedAmount: 0,
        totalPaid: 0,
        activeEmployees: 0,
      },
      error: error as any,
    }
  }
}

export async function getUsersWithKasbon(branchId?: string) {
  console.log("[v0] getUsersWithKasbon called with branchId:", branchId)

  let query = supabase.from("users").select("*").order("name")

  if (branchId && branchId !== "all") {
    query = query.eq("branch_id", branchId)
  }

  const { data: users, error: usersError } = await query

  if (usersError) return { data: [], error: usersError }

  const { data: allKasbon, error: kasbonError } = await supabase
    .from("kasbon")
    .select("*")
    .order("created_at", { ascending: false })

  if (kasbonError) {
    console.log("[v0] Kasbon error, returning users without kasbon data:", kasbonError)
    const usersWithoutKasbon =
      users?.map((user: any) => ({
        ...user,
        total_kasbon: 0,
        active_kasbon: 0,
        kasbon_history: [],
      })) || []
    return { data: usersWithoutKasbon, error: null }
  }

  const usersWithKasbonData =
    users?.map((user: any) => {
      const userKasbon = allKasbon?.filter((kasbon: any) => kasbon.user_id === user.id) || []
      const totalKasbon = userKasbon.reduce((sum: number, kasbon: any) => sum + (kasbon.amount || 0), 0)
      const activeKasbon = userKasbon
        .filter((kasbon: any) => kasbon.status === "approved" || kasbon.status === "pending")
        .reduce((sum: number, kasbon: any) => sum + (kasbon.amount || 0), 0)

      return {
        ...user,
        total_kasbon: totalKasbon,
        active_kasbon: activeKasbon,
        kasbon_history: userKasbon,
      }
    }) || []

  console.log("[v0] Users with kasbon data:", usersWithKasbonData)
  return { data: usersWithKasbonData, error: null }
}

export async function createKasbonRequest(kasbonData: {
  user_id: string
  amount: number
  reason: string
  due_date?: string
  notes?: string
}) {
  console.log("[v0] createKasbonRequest called with:", kasbonData)

  const kasbonToInsert = {
    ...kasbonData,
    status: "pending" as const,
    request_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from("kasbon").insert([kasbonToInsert]).select().single()

  console.log("[v0] Create kasbon result:", { data, error })
  return error ? { data: null, error } : { data, error: null }
}

export async function updateKasbonStatus(
  kasbonId: string,
  status: "approved" | "rejected" | "paid",
  approvedBy: string,
) {
  console.log("[v0] updateKasbonStatus called with:", { kasbonId, status, approvedBy })

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === "approved") {
    updateData.approved_by = approvedBy
    updateData.approved_at = new Date().toISOString()
  }

  const { data, error } = await supabase.from("kasbon").update(updateData).eq("id", kasbonId).select().single()

  console.log("[v0] Update kasbon status result:", { data, error })
  return error ? { data: null, error } : { data, error: null }
}

// =============================
// Employee Management Interfaces
// =============================
export interface Employee {
  totalBonus: number
  totalPenalty: number
  id: string
  name: string
  email: string
  phone?: string
  position?: string
  status?: string
  avatar?: string
  rating?: number
  baseSalary?: number
  attendanceRate?: number
  currentMonthCustomers?: number
  totalCustomers?: number
  presentDays?: number
  totalWorkDays?: number
  lateDays?: number
  overtimeHours?: number
  overtimeRate?: number
  bonusPoints?: number
  penaltyPoints?: number
  commissionRate?: number
  joinDate?: string
  kasbonBalance?: number
  kasbonLimit?: number
  monthlyRevenue?: string
  pin?: string
  max_absent_days?: number
  current_absent_days?: number
}

// =============================
// FUNGSI SEDERHANA: HITUNG HARI TIDAK HADIR
// =============================
export async function getEmployeeAbsenceInfo(employeeId: string) {
  console.log("[SIMPLE] getEmployeeAbsenceInfo called for:", employeeId);

  try {
    // 1. Get employee data termasuk settingan libur
    const { data: employee, error: empError } = await supabase
      .from("users")
      .select("max_absent_days")
      .eq("id", employeeId)
      .single();

    if (empError || !employee) {
      console.error("Error getting employee:", empError);
      return { 
        maxAbsentDays: 4, 
        currentAbsentDays: 0, 
        remainingDays: 4,
        excessDays: 0 
      };
    }

    // 2. Hitung hari tidak hadir bulan ini
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance")
      .select("status, date")
      .eq("user_id", employeeId)
      .gte("date", firstDayOfMonth.toISOString().split('T')[0])
      .lte("date", lastDayOfMonth.toISOString().split('T')[0]);

    if (attendanceError) {
      console.error("Error getting attendance data:", attendanceError);
      return { 
        maxAbsentDays: employee.max_absent_days || 4, 
        currentAbsentDays: 0, 
        remainingDays: employee.max_absent_days || 4,
        excessDays: 0 
      };
    }

    // Hitung hari tidak hadir (status absent atau tidak ada data attendance)
    const currentAbsentDays = attendanceData?.filter(record => 
      record.status === "absent" || record.status === null
    ).length || 0;

    const maxAbsentDays = employee.max_absent_days || 4;
    const remainingDays = Math.max(0, maxAbsentDays - currentAbsentDays);
    const excessDays = Math.max(0, currentAbsentDays - maxAbsentDays);

    console.log("[SIMPLE] Absence info:", { 
      maxAbsentDays, 
      currentAbsentDays, 
      remainingDays, 
      excessDays 
    });

    return { 
      maxAbsentDays, 
      currentAbsentDays, 
      remainingDays, 
      excessDays 
    };

  } catch (error) {
    console.error("Error in getEmployeeAbsenceInfo:", error);
    return { 
      maxAbsentDays: 4, 
      currentAbsentDays: 0, 
      remainingDays: 4,
      excessDays: 0 
    };
  }
}

// =============================
// FUNGSI UPDATE JUMLAH HARI LIBUR
// =============================
export async function updateMaxAbsentDays(employeeId: string, maxDays: number) {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ max_absent_days: maxDays })
      .eq("id", employeeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating max absent days:", error);
      return { error };
    }

    console.log("Max absent days updated:", data);
    return { data };
  } catch (error) {
    console.error("Exception updating max absent days:", error);
    return { error };
  }
}

export interface EmployeeStats {
  totalTransactions: number
  totalRevenue: number
  totalCommission: number
  averageTransaction: number
  bonusPoints?: number
  penaltyPoints?: number
  totalBonus?: number
  totalPenalty?: number
}

// =============================
// Employee Management Functions
// =============================

export async function getEmployees() {
  console.log("[MODERN] getEmployees called - fetching all employees including inactive");

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(`
      id,
      name,
      email,
      phone,
      position,
      status,
      created_at,
      salary,
      commission_rate,
      max_absent_days,
      pin,
      rating,
      attendanceRate,
      currentMonthCustomers,
      totalCustomers,
      presentDays,
      totalWorkDays,
      lateDays,
      overtimeHours,
      overtimeRate,
      bonusPoints,
      penaltyPoints,
      kasbonBalance,
      kasbonLimit,
      monthlyRevenue
    `)
    .order("name");  // Tampilkan SEMUA karyawan (aktif dan tidak aktif)

  console.log("[MODERN] Result:", { 
    usersCount: users?.length, 
    hasError: !!usersError,
    firstUser: users?.[0]
  });

  // PENTING: Hanya return error jika benar-benar ada error DAN tidak ada data
  if (usersError && !users) {
    console.error("[MODERN] Error fetching employees:", usersError);
    return { data: [], error: usersError };
  }

  // Transformasi data - gunakan data dari database
  const employees = (users || []).map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    position: user.position || '',
    status: user.status || 'active',
    salary: user.salary || 3000000, // Tambahkan salary untuk ditampilkan di kartu
    baseSalary: user.salary || 3000000,
    commissionRate: user.commission_rate || 0,
    pin: user.pin || '',
    max_absent_days: user.max_absent_days || 4,
    created_at: user.created_at,
    totalBonus: 0,
    totalPenalty: 0,
    rating: user.rating || 0,
    attendanceRate: user.attendanceRate || 0,
    currentMonthCustomers: user.currentMonthCustomers || 0,
    totalCustomers: user.totalCustomers || 0,
    presentDays: user.presentDays || 0,
    totalWorkDays: user.totalWorkDays || 0,
    lateDays: user.lateDays || 0,
    overtimeHours: user.overtimeHours || 0,
    overtimeRate: user.overtimeRate || 0,
    bonusPoints: user.bonusPoints || 0,
    penaltyPoints: user.penaltyPoints || 0,
    kasbonBalance: user.kasbonBalance || 0,
    kasbonLimit: user.kasbonLimit || 0,
    monthlyRevenue: String(user.monthlyRevenue || '0')
  }));

  console.log("[MODERN] Final employees:", employees.length);
  return { data: employees, error: null };
}

export async function addEmployee(employee: Partial<Employee>) {
  console.log("[v11] addEmployee called with:", employee)

  // Just create user profile in users table
  // Admin will manually create auth user in Supabase Dashboard if needed
  const userData = {
    name: employee.name,
    email: employee.email,
    phone: employee.phone || null,
    status: employee.status || "active",
    pin: employee.pin,
    position: employee.position,
    salary: employee.salary || employee.baseSalary || 0,
    commission_rate: employee.commissionRate || 0,
  }

  const { data, error } = await supabase.from("users").insert([userData]).select().single()

  console.log("[v11] addEmployee result:", { data, error })
  return { data, error }
}

export async function updateEmployee(id: string, employee: Partial<Employee>) {
  console.log("[v11] updateEmployee called with:", id)

  const userData = {
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    status: employee.status,
    pin: employee.pin,
    position: employee.position,
    salary: employee.baseSalary,
    commission_rate: employee.commissionRate,
  }

  const { data, error } = await supabase.from("users").update(userData).eq("id", id).select().single()

  console.log("[v11] updateEmployee result:", { data, error })
  return { data, error }
}

export async function deleteEmployee(id: string) {
  console.log("[deleteEmployee] Starting deletion for id:", id)

  try {
    // Cek apakah user ada
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single()

    if (checkError) {
      console.error("[deleteEmployee] Error checking user:", checkError)
      return { data: null, error: checkError }
    }

    if (!existingUser) {
      console.error("[deleteEmployee] User not found")
      return { data: null, error: { message: "Karyawan tidak ditemukan" } as any }
    }

    console.log("[deleteEmployee] User exists:", existingUser)

    // SOFT DELETE - ubah status jadi 'inactive' agar data tetap ada untuk transaksi
    const { data, error } = await supabase
      .from("users")
      .update({ status: 'inactive' })
      .eq("id", id)
      .select()
      .single()

    console.log("[deleteEmployee] Soft delete response:", { data, error })

    if (error) {
      console.error("[deleteEmployee] Soft delete error:", error)
      return { data: null, error }
    }

    console.log("[deleteEmployee] Soft delete successful - status changed to inactive")
    return { data, error: null }
    
  } catch (e) {
    console.error("[deleteEmployee] Exception:", e)
    return { data: null, error: { message: String(e) } as any }
  }
}

// =============================
// PERBAIKAN FUNGSI GET EMPLOYEE STATS
// =============================
export async function getEmployeeStats(employeeId: string): Promise<EmployeeStats> {
  console.log("[v13-FIXED] getEmployeeStats called for:", employeeId);

  try {
    // 1. Hitung transaksi dan revenue - gunakan server_id (yang melayani), bukan cashier_id
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("total_amount, created_at")
      .eq("server_id", employeeId)
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    if (transactionsError) {
      console.error("[v13-FIXED] Error fetching transactions:", transactionsError);
    }

    const totalTransactions = transactions?.length || 0;
    const totalRevenue = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // 2. Hitung komisi dari commission_amount yang sudah tersimpan di transaction_items
    let totalCommission = 0;
    try {
      console.log("[getEmployeeStats] Calculating commission for employee:", employeeId);
      
      const { data: commissionData, error: commissionError } = await supabase
        .from("transaction_items")
        .select("commission_amount, commission_status")
        .eq("barber_id", employeeId)
        .eq("commission_status", "credited")
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (!commissionError && commissionData) {
        totalCommission = commissionData.reduce((sum, item) => {
          return sum + (item.commission_amount || 0);
        }, 0);
        
        console.log("[getEmployeeStats] Commission items found:", commissionData.length, "Total:", totalCommission);
      } else if (commissionError) {
        console.error("[v13-FIXED] Error calculating commission:", commissionError);
      }
    } catch (commissionError) {
      console.error("[v13-FIXED] Unexpected error calculating commission:", commissionError);
      totalCommission = 0;
    }

    // 3. Hitung points untuk bonus/penalty
    const { data: pointsData, error: pointsError } = await supabase
      .from("points")
      .select("points_earned, points_type")
      .eq("user_id", employeeId)
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    let bonusPoints = 0;
    let penaltyPoints = 0;
    
    if (!pointsError && pointsData) {
      pointsData.forEach(point => {
        if (point.points_earned > 0) {
          bonusPoints += point.points_earned;
        } else {
          penaltyPoints += Math.abs(point.points_earned);
        }
      });
    }

    const stats: EmployeeStats = {
      totalTransactions,
      totalRevenue,
      totalCommission,
      averageTransaction,
      bonusPoints,
      penaltyPoints,
      totalBonus: bonusPoints,
      totalPenalty: penaltyPoints
    };

    console.log("[v13-FIXED] Employee stats:", stats);
    return stats;
  } catch (error) {
    console.error("[v13-FIXED] Unexpected error in getEmployeeStats:", error);
    
    // Return default stats jika terjadi error
    return {
      totalTransactions: 0,
      totalRevenue: 0,
      totalCommission: 0,
      averageTransaction: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      totalBonus: 0,
      totalPenalty: 0
    };
  }
}

export async function getEmployeeCommissions(employeeId: string) {
  console.log("[v12-FIXED] getEmployeeCommissions (now rules) called for:", employeeId)

  const { data, error } = await supabase
    .from("commission_rules")
    .select(`*, services (name, price)`)
    .eq("user_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[v12-FIXED] Error fetching commission rules:", error);
  }

  console.log("[v12-FIXED] Employee commission rules result:", { data, error })
  return error ? { data: [], error } : { data: data || [], error: null }
}

// =============================
// PERBAIKAN FUNGSI GET EMPLOYEE ATTENDANCE
// =============================
export async function getEmployeeAttendance(employeeId: string) {
  console.log("[v13-FIXED] getEmployeeAttendance called for:", employeeId);

  try {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", employeeId)
      .gte("date", firstDayOfMonth.toISOString().split('T')[0])
      .lte("date", lastDayOfMonth.toISOString().split('T')[0])
      .order("date", { ascending: true });

    if (error) {
      console.error("[v13-FIXED] Error fetching attendance:", error);
      return {
        data: [],
        error,
        attendanceRate: 0,
        presentDays: 0,
        lateDays: 0,
        overtimeHours: 0,
        totalWorkDays: 0
      };
    }

    const totalWorkDays = getBusinessDaysCount(firstDayOfMonth, lastDayOfMonth);
    const presentDays = data.filter(record => 
      record.status === "checked_out" || record.status === "checked_in"
    ).length;

    const lateDays = data.filter(record => {
      if (!record.check_in_time) return false;
      const checkInTime = record.check_in_time;
      return checkInTime > "08:30:00";
    }).length;

    const totalHours = data.reduce((sum, record) => sum + (record.total_hours || 0), 0);
    const regularHours = presentDays * 8;
    const overtimeHours = Math.max(0, totalHours - regularHours);
    const attendanceRate = totalWorkDays > 0 ? Math.round((presentDays / totalWorkDays) * 100) : 0;

    console.log("[v13-FIXED] Employee attendance result:", { 
      totalWorkDays, 
      presentDays, 
      lateDays, 
      overtimeHours: Math.max(0, overtimeHours),
      attendanceRate 
    });

    return {
      data: data || [],
      error: null,
      attendanceRate,
      presentDays,
      lateDays,
      overtimeHours: Math.max(0, overtimeHours),
      totalWorkDays
    };
  } catch (error) {
    console.error("[v13-FIXED] Unexpected error in getEmployeeAttendance:", error);
    return {
      data: [],
      error: error as any,
      attendanceRate: 0,
      presentDays: 0,
      lateDays: 0,
      overtimeHours: 0,
      totalWorkDays: 0
    };
  }
}

// =============================
// 🔥 FUNGSI BARU YANG DITAMBAHKAN - getEmployeePhotos
// =============================
export async function getEmployeePhotos(userId: string) {
  console.log("[getEmployeePhotos] Called with userId:", userId)

  try {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        users:user_id ( id, name, email, position, branch_id ),
        branches:branch_id ( id, name, address )
      `)
      .eq("user_id", userId)
      .or("check_in_photo.not.is.null,check_out_photo.not.is.null")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50)

    console.log("[getEmployeePhotos] Query result:", { data, error })

    if (error) {
      console.error("[getEmployeePhotos] Error:", error)
      return { data: null, error }
    }

    const attendanceWithDetails: AttendanceWithDetails[] = (data || []).map((record: any) => ({
      id: record.id,
      user_id: record.user_id,
      branch_id: record.branch_id,
      shift_type: record.shift_type,
      check_in_time: record.check_in_time,
      check_out_time: record.check_out_time,
      break_start_time: record.break_start_time,
      break_end_time: record.break_end_time,
      total_hours: record.total_hours,
      break_duration: record.break_duration,
      status: record.status,
      check_in_photo: record.check_in_photo,
      check_out_photo: record.check_out_photo,
      date: record.date,
      created_at: record.created_at,
      updated_at: record.updated_at,
      users: record.users ? {
        id: record.users.id,
        name: record.users.name,
        email: record.users.email,
        position: record.users.position,
        branch_id: record.users.branch_id,
        created_at: record.users.created_at || new Date().toISOString()
      } : undefined,
      branches: record.branches ? {
        id: record.branches.id,
        name: record.branches.name,
        address: record.branches.address,
        created_at: record.branches.created_at || new Date().toISOString()
      } : undefined
    }))

    console.log("[getEmployeePhotos] Returning:", attendanceWithDetails.length, "records")
    return { data: attendanceWithDetails, error: null }

  } catch (error) {
    console.error("[getEmployeePhotos] Exception:", error)
    return { data: null, error }
  }
}

// =============================
// 🔥 FUNGSI BARU YANG DITAMBAHKAN - getEmployeeAttendanceWithPhotos
// =============================
export async function getEmployeeAttendanceWithPhotos(userId: string, days: number = 30) {
  console.log("[getEmployeeAttendanceWithPhotos] Called with userId:", userId, "days:", days)

  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    console.log("[getEmployeeAttendanceWithPhotos] Date range:", startDateStr, "to", endDateStr)

    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        users:user_id ( id, name, email, position, branch_id ),
        branches:branch_id ( id, name, address )
      `)
      .eq("user_id", userId)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })

    console.log("[getEmployeeAttendanceWithPhotos] Query result:", { dataLength: data?.length, error })

    // Ignore empty error objects
    if (error?.message) {
      console.error("[getEmployeeAttendanceWithPhotos] Error:", error)
      return {
        data: [],
        error,
        attendanceRate: 0,
        presentDays: 0,
        lateDays: 0,
        totalWorkDays: days,
        overtimeHours: 0,
      }
    }

    const attendanceRecords: AttendanceWithDetails[] = (data || []).map((record: any) => ({
      id: record.id,
      user_id: record.user_id,
      branch_id: record.branch_id,
      shift_type: record.shift_type,
      check_in_time: record.check_in_time,
      check_out_time: record.check_out_time,
      break_start_time: record.break_start_time,
      break_end_time: record.break_end_time,
      total_hours: record.total_hours,
      break_duration: record.break_duration,
      status: record.status,
      check_in_photo: record.check_in_photo,
      check_out_photo: record.check_out_photo,
      date: record.date,
      created_at: record.created_at,
      updated_at: record.updated_at,
      users: record.users ? {
        id: record.users.id,
        name: record.users.name,
        email: record.users.email,
        position: record.users.position,
        branch_id: record.users.branch_id,
        created_at: record.users.created_at || new Date().toISOString()
      } : undefined,
      branches: record.branches ? {
        id: record.branches.id,
        name: record.branches.name,
        address: record.branches.address,
        created_at: record.branches.created_at || new Date().toISOString()
      } : undefined
    }))

    const presentDays = attendanceRecords.filter(r =>
      r.status !== 'absent' && (r.check_in_time || r.check_out_time)
    ).length

    const lateDays = attendanceRecords.filter(r => {
      if (!r.check_in_time) return false
      const checkInTime = r.check_in_time
      return checkInTime > "08:30"
    }).length

    const totalHours = attendanceRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0)
    const regularHours = presentDays * 8
    const overtimeHours = Math.max(0, totalHours - regularHours)
    const attendanceRate = days > 0 ? Math.round((presentDays / days) * 100) : 0

    console.log("[getEmployeeAttendanceWithPhotos] Statistics:", {
      attendanceRate,
      presentDays,
      lateDays,
      totalWorkDays: days,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
    })

    return {
      data: attendanceRecords,
      error: null,
      attendanceRate,
      presentDays,
      lateDays,
      totalWorkDays: days,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
    }

  } catch (error) {
    console.error("[getEmployeeAttendanceWithPhotos] Exception:", error)
    return {
      data: [],
      error: error as any,
      attendanceRate: 0,
      presentDays: 0,
      lateDays: 0,
      totalWorkDays: days,
      overtimeHours: 0,
    }
  }
}

// =============================
// Auth Helper Functions
// =============================
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log("[getCurrentUser] Auth user:", user);
    console.log("[getCurrentUser] Auth error:", error);
    
    if (error) {
      console.error("[getCurrentUser] Error getting current user:", error);
      return null;
    }

    return user;
  } catch (error) {
    console.error("[getCurrentUser] Unexpected error:", error);
    return null;
  }
}


// Fungsi untuk get profile dari auth data saja
async function getAuthUserProfile(userId: string) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    
    if (authData.user && authData.user.id === userId) {
      return {
        id: authData.user.id,
        email: authData.user.email || "",
        name: authData.user.email?.split('@')[0] || "User",
        pin: "",
        position: "employee",
        status: "active",
        created_at: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error("[getAuthUserProfile] Error:", error);
    return null;
  }
}

// Fungsi untuk create user profile dari auth data
async function createUserProfileFromAuth(userId: string) {
  try {
    // Get auth user data
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authData.user) {
      console.error("[createUserProfile] Cannot get auth user:", authError);
      return getAuthUserProfile(userId);
    }

    // Create user profile
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.email?.split('@')[0] || 'User',
        position: 'employee',
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("[createUserProfile] Insert failed, using auth data:", insertError);
      return getAuthUserProfile(userId);
    }

    console.log("[createUserProfile] New user profile created");
    return newUser;
  } catch (error) {
    console.error("[createUserProfile] Error:", error);
    return getAuthUserProfile(userId);
  }
}


// =============================
// Pengeluaran Cabang
// =============================
export async function updateExpenseRequest(expenseId: string, expenseData: Partial<Expense>) {
  console.log("[v0] updateExpenseRequest called with:", { expenseId, expenseData })

  const { data, error } = await supabase
    .from("expenses")
    .update({ 
      ...expenseData,
      updated_at: new Date().toISOString()
    })
    .eq("id", expenseId)
    .select()
    .single()

  console.log("[v0] Update expense result:", { data, error })
  return error ? { data: null, error } : { data, error: null }
}

export async function deleteExpenseRequest(expenseId: string) {
  console.log("[v0] deleteExpenseRequest called with id:", expenseId)

  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)

  console.log("[v0] Delete expense result:", { data, error })
  return { data, error }
}

// =============================
// Pengeluaran Cabang - GET
// =============================
export async function getExpenses(branchId?: string) {
  console.log("[v0] getExpenses called with branchId:", branchId)

  let query = supabase
    .from("expenses")
    .select(`
      *,
      branches!inner (
        id,
        name
      )
    `)
    .order("expense_date", { ascending: false })

  if (branchId) {
    query = query.eq("branch_id", branchId)
  }

  const { data, error } = await query

  console.log("[v0] Expenses result:", { data, error })
  return error ? { data: [], error } : { data: data || [], error: null }
}

// =============================
// Pengeluaran Cabang - STATISTICS
// =============================
export async function getExpenseStatistics(branchId?: string) {
  console.log("[v0] getExpenseStatistics called with branchId:", branchId)

  let query = supabase.from("expenses").select("amount")

  if (branchId) {
    query = query.eq("branch_id", branchId)
  }

  const { data, error } = await query

  if (error) {
    console.log("[v0] Error fetching expense statistics:", error)
    return {
      data: {
        totalExpenses: 0,
        averagePerTransaction: 0,
      },
      error,
    }
  }

  const totalExpenses = data?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0
  const transactionCount = data?.length || 0
  const averagePerTransaction = transactionCount > 0 ? Math.round(totalExpenses / transactionCount) : 0

  const statistics = {
    totalExpenses,
    averagePerTransaction,
  }

  console.log("[v0] Expense statistics result:", statistics)
  return { data: statistics, error: null }
}

// =============================
// Pengeluaran Cabang - CREATE
// =============================
export async function createExpenseRequest(expenseData: {
  branch_id?: string
  category: string
  description: string
  amount: number
  notes?: string
}) {
  console.log("[v0] createExpenseRequest called with:", expenseData)

  const expenseToInsert = {
    branch_id: expenseData.branch_id || null,
    category: expenseData.category,
    description: expenseData.description,
    amount: expenseData.amount,
    notes: expenseData.notes || null,
    expense_date: new Date().toISOString().split("T")[0],
    status: "pending",
    created_at: new Date().toISOString(),
  }

  console.log("Data yang akan diinsert:", expenseToInsert)

  const { data, error } = await supabase
    .from("expenses")
    .insert(expenseToInsert)
    .select()
    .single()

  console.log("[v0] Create expense result:", { data, error })
  
  if (error) {
    console.error("Detail error:", error)
  }
  
  return error ? { data: null, error } : { data, error: null }
}

// =============================
// Kelola Pengeluaran Functions
// =============================

export interface ExpenseWithDetails extends Expense {
  branches?: { id: string; name: string };
  
}

export async function getAllExpensesWithDetails() {
  try {
    console.log("🔍 Fetching expenses without users relationship...");
    
    // PASTIKAN hanya select branches saja, tanpa users
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        branches:branch_id (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching expenses:', error);
      return { data: null, error };
    }

    console.log("✅ Successfully fetched expenses:", data?.length);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { data: null, error };
  }
}

export async function updateExpenseStatus(
  expenseId: string, 
  status: "approved" | "rejected" | "paid",
  rejectionReason?: string
) {
  try {
    console.log("🔄 Updating expense status:", { expenseId, status, rejectionReason });
    
    // Update status dan rejection_reason jika ada
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Tambahkan rejection_reason jika status rejected
    if (status === "rejected" && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    // Clear rejection_reason jika status approved/paid
    if (status === "approved" || status === "paid") {
      updateData.rejection_reason = null;
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error updating expense status:', error);
      return { data: null, error };
    }

    console.log("✅ Expense status updated successfully");
    return { data, error: null };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { data: null, error };
  }
}

export async function getExpenseStatisticsByBranch(branchId?: string) {
  try {
    let query = supabase
      .from('expenses')
      .select('status, amount');

    if (branchId && branchId !== 'all') {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching expense statistics:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        paid: 0,
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        rejectedAmount: 0,
        paidAmount: 0
      };
    }

    const stats = {
      total: data?.length || 0,
      pending: data?.filter(e => e.status === 'pending').length || 0,
      approved: data?.filter(e => e.status === 'approved').length || 0,
      rejected: data?.filter(e => e.status === 'rejected').length || 0,
      paid: data?.filter(e => e.status === 'paid').length || 0,
      totalAmount: data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
      pendingAmount: data?.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
      approvedAmount: data?.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
      rejectedAmount: data?.filter(e => e.status === 'rejected').reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
      paidAmount: data?.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    };

    return stats;
  } catch (error) {
    console.error('Unexpected error in getExpenseStatisticsByBranch:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
      totalAmount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,
      paidAmount: 0
    };
  }
}

export async function getExpensesByStatus(status: string, branchId?: string) {
  try {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        branches:branch_id (*),
        users:requested_by (*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (branchId && branchId !== 'all') {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${status} expenses:`, error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { data: [], error };
  }
}

// =============================
// Additional Functions
// =============================

export async function getAbsentEmployeesToday(): Promise<Employee[]> {
  console.log("[v0] getAbsentEmployeesToday called")

  const today = new Date().toISOString().split("T")[0]

  try {
    const { data: activeEmployees, error: employeesError } = await supabase
      .from("users")
      .select("*")
      .eq("status", "active")
      .order("name")

    if (employeesError) {
      console.error("[v0] Error fetching active employees:", employeesError)
      return []
    }

    const { data: todayAttendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("user_id")
      .eq("date", today)

    if (attendanceError) {
      console.error("[v0] Error fetching today's attendance:", attendanceError)
      return []
    }

    const presentEmployeeIds = new Set(todayAttendance?.map((a) => a.user_id) || [])
    const absentEmployees = activeEmployees?.filter((employee) => !presentEmployeeIds.has(employee.id)) || []

    const transformedAbsentEmployees: Employee[] = absentEmployees.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email || "",
      phone: user.phone || "",
      position: user.position || "employee",
      status: user.status || "active",
      avatar: `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(user.name)}`,
      rating: 4.5,
      baseSalary: 5000000,
      attendanceRate: 95,
      currentMonthCustomers: 0,
      totalCustomers: 0,
      presentDays: 0,
      totalWorkDays: 0,
      lateDays: 0,
      overtimeHours: 0,
      overtimeRate: 25000,
      bonusPoints: 0,
      penaltyPoints: 0,
      commissionRate: 0.05,
      joinDate: user.created_at,
      kasbonBalance: 0,
      kasbonLimit: 2000000,
      monthlyRevenue: "0",
      pin: user.pin || "",
    }))

    console.log("[v0] Found absent employees:", transformedAbsentEmployees.length)
    return transformedAbsentEmployees
  } catch (error) {
    console.error("[v0] Error in getAbsentEmployeesToday:", error)
    return []
  }
}

// =============================
// Attendance Management Functions
// =============================
export async function getDetailedAttendanceRecords(date?: string) {
  let query = supabase
    .from("attendance")
    .select(`*,
      users:user_id (
        id,
        name,
        email,
        position,
        branch_id
      ),
      branches:branch_id (
        id,
        name,
        address,
        shifts
      )
    `)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  if (date) {
    query = query.eq("date", date)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching detailed attendance:", error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

// =============================
// OUTLET STOCK MANAGEMENT
// =============================

export interface OutletStock {
  id: string;
  outlet_id: string;
  service_id: string;
  stock_quantity: number;
  min_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  service?: ServiceWithCategory;
  branch?: Branch;
}

// 🔥 GET stock per outlet
export const getOutletStock = async (outletId: string): Promise<{ data: OutletStock[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('outlet_stock')
      .select('*')
      .eq('outlet_id', outletId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outlet stock:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in getOutletStock:', error);
    return { data: null, error };
  }
};

// 🔥 UPDATE stock per outlet (with UPSERT)
export const updateOutletStock = async (
  outletId: string, 
  serviceId: string, 
  newStock: number
): Promise<{ data: OutletStock | null; error: any }> => {
  try {
    // Use upsert to create if not exists, update if exists
    const { data, error } = await supabase
      .from('outlet_stock')
      .upsert({ 
        outlet_id: outletId,
        service_id: serviceId,
        stock_quantity: newStock,
        is_active: true,
        min_stock_threshold: 5, // default value
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'outlet_id,service_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating outlet stock:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in updateOutletStock:', error);
    return { data: null, error };
  }
};

// 🔥 GET low stock alerts (FIXED VERSION)
export const getLowStockAlerts = async (): Promise<{ data: OutletStock[] | null; error: any }> => {
  try {
    // Get all outlet stock (no joins needed)
    const { data: allStock, error: fetchError } = await supabase
      .from('outlet_stock')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching outlet stock:', fetchError);
      return { data: null, error: fetchError };
    }

    // Filter manually for low stock
    const lowStock = (allStock || []).filter(item => 
      item.stock_quantity <= item.min_stock_threshold
    );

    return { data: lowStock, error: null };
  } catch (error) {
    console.error('Unexpected error in getLowStockAlerts:', error);
    return { data: null, error };
  }
};

// 🔥 REDUCE stock ketika terjadi transaksi
// 🔥 REDUCE stock ketika terjadi transaksi (FIXED)
export const reduceOutletStock = async (
  outletId: string,
  serviceId: string,
  quantity: number
): Promise<{ data: OutletStock | null; error: any }> => {
  try {
    // Get current stock
    const { data: currentStock, error: fetchError } = await supabase
      .from('outlet_stock')
      .select('stock_quantity')
      .eq('outlet_id', outletId)
      .eq('service_id', serviceId)
      .single();

    if (fetchError) {
      console.error('Error fetching current stock:', fetchError);
      return { data: null, error: fetchError };
    }

    const newStock = Math.max(0, (currentStock?.stock_quantity || 0) - quantity);

    // Update stock
    const { data, error } = await supabase
      .from('outlet_stock')
      .update({ 
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('outlet_id', outletId)
      .eq('service_id', serviceId)
      .select(`
        *,
        service:services(*, service_categories(*)),
        branch:outlet_id(*)
      `)
      .single();

    if (error) {
      console.error('Error reducing outlet stock:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in reduceOutletStock:', error);
    return { data: null, error };
  }
};

// =============================
// POS Helper Functions
// =============================

export const loadBranchesData = async (supabase: any, setBranches: any, setSelectedBranch: any) => {
  const { data, error } = await supabase.from("branches").select("*")
  if (error) {
    console.error("Error loading branches:", error)
    return
  }
  setBranches(data)
  if (data.length > 0) {
    setSelectedBranch(data[0].name)
  }
}

export const loadBranchData = async (supabase: any, setReceiptTemplate: any, setBranchInfo: any) => {
  console.log("[v0] Loading branch and template data...")
  try {
    const { data: templateData, error: templateError } = await supabase
      .from("receipt_templates")
      .select("*")
      .eq("is_active", true)
      .single()

    if (templateError) {
      console.error("Error loading receipt template:", templateError)
    } else {
      console.log("[v0] Loaded active template:", templateData)
      setReceiptTemplate(templateData)
    }

    console.log("[v0] Branch data loading completed without overriding selectedBranch")
  } catch (error) {
    console.error("Error loading branch and template data:", error)
  }
}

export const processTransaction = async (
  supabase: any,
  branches: any[],
  selectedBranch: string,
  cart: any[],
  currentUser: any,
  paymentMethod: string,
  customerName: string,
  discountReason: string,
  getTotalPrice: () => number,
  getDiscountAmount: () => number,
  getFinalTotal: () => number,
) => {
  const selectedBranchData = branches.find((b) => b.name === selectedBranch)

  if (!selectedBranchData?.id) {
    throw new Error("Data cabang tidak ditemukan")
  }

  const receiptNumber = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`

  const transactionData = {
    receipt_number: receiptNumber,
    branch_id: selectedBranchData.id,
    total_amount: getTotalPrice(),
    discount_amount: getDiscountAmount(),
    final_amount: getFinalTotal(),
    payment_method: paymentMethod,
    customer_name: customerName || null,
    notes: discountReason || null,
  }

  console.log("[v0] Creating transaction with correct branch_id:", transactionData)
  return transactionData
}

// =============================
// 🔥 FUNGSI BARU: Setup Realtime Subscription untuk Transaksi
// =============================
export const setupTransactionsRealtime = (callback: () => void) => {
  const channel = supabase
    .channel('transactions-global')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'transactions' 
      }, 
      (payload) => {
        console.log('Transaction change detected:', payload);
        callback();
      }
    )
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transaction_items'
      },
      (payload) => {
        console.log('Transaction item change detected:', payload);
        callback();
      }
    )
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });

  return channel;
};

// 🔥 FUNGSI BARU: Setup Realtime untuk Komisi
export const setupKomisiRealtime = (callback: () => void) => {
  const channel = supabase
    .channel('komisi-global')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'commission_rules'
      },
      (payload) => {
        console.log('Commission rule change detected:', payload);
        callback();
      }
    )
    .subscribe((status) => {
      console.log('Komisi subscription status:', status);
    });

  return channel;
};

// 🔥 FUNGSI BARU: Broadcast Event untuk Sinkronisasi Global
export const broadcastTransactionEvent = async (eventType: string, payload: any) => {
  try {
    await supabase.channel('global-events').send({
      type: 'broadcast',
      event: eventType,
      payload: payload
    });
    console.log(`Broadcast event '${eventType}' sent successfully`);
  } catch (error) {
    console.error('Error broadcasting event:', error);
  }
};

// 🔥 FUNGSI BARU: Listen untuk Global Events
export const setupGlobalEventsListener = (callback: (event: string, payload: any) => void) => {
  const channel = supabase.channel('global-events-listener')
    .on('broadcast', { event: '*' }, (payload) => {
      console.log('Global event received:', payload);
      callback(payload.event, payload.payload);
    })
    .subscribe();

  return channel;
};

// 🔥 FUNGSI BARU: Subscribe to Events
export const subscribeToEvents = (callback: (event: string, payload: any) => void) => {
  const channel = supabase.channel('global-events-listener')
    .on('broadcast', { event: '*' }, (payload) => {
      console.log('Global event received:', payload);
      callback(payload.event, payload.payload);
    })
    .subscribe();

  return channel;
};

// =============================
// 🔥 FUNGSI BARU: Setup Realtime Subscription untuk Employee
// =============================
export const setupEmployeeRealtime = (callback: () => void) => {
  console.log("Setting up employee realtime subscription");

  const channel = supabase
    .channel('employees-global')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'users' 
      }, 
      (payload) => {
        console.log('Employee change detected:', payload);
        callback();
      }
    )
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'points'
      },
      (payload) => {
        console.log('Points change detected (affects employee stats):', payload);
        callback();
      }
    )
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'attendance'
      },
      (payload) => {
        console.log('Attendance change detected:', payload);
        callback();
      }
    )
    .subscribe((status) => {
      console.log('Employee realtime subscription status:', status);
    });

  return channel;
};

export async function getApprovedExpenses() {
  try {
    console.log("🔍 Fetching approved expenses...");
    
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        branches:branch_id (*)
      `)
      .in('status', ['approved', 'paid'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching approved expenses:', error);
      return { data: [], error };
    }

    console.log("✅ Successfully fetched approved expenses:", data?.length);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { data: [], error };
  }
}
// 🔥 TAMBAHKAN fungsi ini di supabase.ts
export const getOwnerPin = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('pin')
      .eq('position', 'owner')
      .single();

    if (error || !data) {
      console.error('Error fetching owner PIN:', error);
      return ''; // Return empty string if not found
    }

    return data.pin || '';
  } catch (error) {
    console.error('Unexpected error in getOwnerPin:', error);
    return '';
  }
};
// 🔥 TAMBAHKAN fungsi ini di supabase.ts
export const updateUserPin = async (userId: string, newPin: string): Promise<boolean> => {
  try {
    // Validasi PIN 6 digit
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      console.error('Invalid PIN format');
      return false;
    }

    const { error } = await supabase
      .from('users')
      .update({ pin: newPin })
      .eq('id', userId);

    if (error) {
      console.error('Error updating PIN:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in updateUserPin:', error);
    return false;
  }
};