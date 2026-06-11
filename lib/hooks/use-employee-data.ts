/**
 * Employee Data Management Hook
 * 
 * Custom hook for fetching and managing employee data with real-time updates.
 * Handles all data operations for the Employee Management system.
 */

import { useState, useEffect, useCallback } from "react"
import {
  supabase,
  getEmployees,
  addEmployee as addEmployeeAPI,
  updateEmployee as updateEmployeeAPI,
  deleteEmployee as deleteEmployeeAPI,
  getEmployeeStats,
  getEmployeeCommissions,
  getEmployeeAttendance,
  getAbsentEmployeesToday,
  setupEmployeeRealtime,
  type Employee,
  type EmployeeStats as SupabaseEmployeeStats
} from "@/lib/supabase"
import type {
  Employee as EmployeeType,
  EmployeeStats,
  EmployeeAttendance,
  EmployeeFormData,
  DEFAULT_EMPLOYEE_STATS
} from "@/components/employees/types"

/**
 * Employee data hook return type
 */
export interface UseEmployeeDataReturn {
  // Data
  employees: EmployeeType[]
  employeeStats: Record<string, EmployeeStats>
  employeeCommissions: Record<string, any[]>
  employeeAttendance: Record<string, EmployeeAttendance>
  absentEmployees: EmployeeType[]
  
  // Loading states
  loading: boolean
  statsLoading: boolean
  operationLoading: boolean
  
  // Error state
  error: string | null
  
  // Actions
  refetch: () => Promise<void>
  loadEmployeeStats: (employeeList: EmployeeType[]) => Promise<void>
  loadAbsentEmployees: () => Promise<void>
  
  // CRUD operations
  addEmployee: (data: EmployeeFormData) => Promise<{ success: boolean; error?: string }>
  updateEmployee: (id: string, data: Partial<EmployeeFormData>) => Promise<{ success: boolean; error?: string }>
  deleteEmployee: (id: string) => Promise<{ success: boolean; error?: string }>
  
  // Operation state setters
  setOperationLoading: (loading: boolean) => void
}

/**
 * Custom hook for employee data management
 * 
 * @returns Employee data and operations
 * 
 * @example
 * const {
 *   employees,
 *   loading,
 *   addEmployee,
 *   updateEmployee,
 *   deleteEmployee
 * } = useEmployeeData()
 */
export function useEmployeeData(): UseEmployeeDataReturn {
  // Data state
  const [employees, setEmployees] = useState<EmployeeType[]>([])
  const [employeeStats, setEmployeeStats] = useState<Record<string, EmployeeStats>>({})
  const [employeeCommissions, setEmployeeCommissions] = useState<Record<string, any[]>>({})
  const [employeeAttendance, setEmployeeAttendance] = useState<Record<string, EmployeeAttendance>>({})
  const [absentEmployees, setAbsentEmployees] = useState<EmployeeType[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [operationLoading, setOperationLoading] = useState(false)
  
  // Error state
  const [error, setError] = useState<string | null>(null)
  
  /**
   * Load absent employees for today
   */
  const loadAbsentEmployees = useCallback(async () => {
    try {
      const absent = await getAbsentEmployeesToday()
      setAbsentEmployees(absent)
    } catch (err) {
      console.error("Error loading absent employees:", err)
    }
  }, [])
  
  /**
   * Load employee statistics
   */
  const loadEmployeeStats = useCallback(async (employeeList: EmployeeType[]) => {
    setStatsLoading(true)
    try {
      const statsPromises = employeeList.map(async (employee) => {
        const [stats, commissions, attendance] = await Promise.all([
          getEmployeeStats(employee.id),
          getEmployeeCommissions(employee.id),
          getEmployeeAttendance(employee.id),
        ])
        
        return {
          id: employee.id,
          stats: stats || {
            totalTransactions: 0,
            totalRevenue: 0,
            totalCommission: 0,
            averageTransaction: 0,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalBonus: 0,
            totalPenalty: 0
          },
          commissions: commissions.data || [],
          attendance: attendance.data || [],
          attendanceRate: attendance.attendanceRate || 0,
          presentDays: attendance.presentDays || 0,
          lateDays: attendance.lateDays || 0,
          overtimeHours: attendance.overtimeHours || 0,
        }
      })
      
      const results = await Promise.all(statsPromises)
      
      const newStats: Record<string, EmployeeStats> = {}
      const newCommissions: Record<string, any[]> = {}
      const newAttendance: Record<string, EmployeeAttendance> = {}
      
      results.forEach((result) => {
        newStats[result.id] = result.stats
        newCommissions[result.id] = result.commissions
        newAttendance[result.id] = {
          data: result.attendance,
          attendanceRate: result.attendanceRate,
          presentDays: result.presentDays,
          lateDays: result.lateDays,
          overtimeHours: result.overtimeHours,
        }
      })
      
      setEmployeeStats(newStats)
      setEmployeeCommissions(newCommissions)
      setEmployeeAttendance(newAttendance)
    } catch (err) {
      console.error("Error loading employee stats:", err)
      setError("Gagal memuat statistik karyawan")
    } finally {
      setStatsLoading(false)
    }
  }, [])
  
  /**
   * Load all employees
   */
  const loadEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await getEmployees()
      
      if (fetchError) {
        console.error("Error loading employees:", fetchError)
        setError("Gagal memuat data karyawan")
        return
      }
      
      console.log("Loaded employees from database:", data?.length || 0)
      setEmployees(data || [])
      
      if (data && data.length > 0) {
        await loadEmployeeStats(data)
      }
    } catch (err) {
      console.error("Error loading employees:", err)
      setError("Terjadi kesalahan saat memuat data karyawan")
    } finally {
      setLoading(false)
    }
  }, [loadEmployeeStats])
  
  /**
   * Refetch all data
   */
  const refetch = useCallback(async () => {
    await loadEmployees()
    await loadAbsentEmployees()
  }, [loadEmployees, loadAbsentEmployees])
  
  /**
   * Add new employee
   */
  const addEmployee = useCallback(async (data: EmployeeFormData) => {
    try {
      const { data: newEmployee, error: addError } = await addEmployeeAPI({
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        pin: data.pin,
        status: data.status,
      })
      
      if (addError) {
        console.error("Error adding employee:", addError)
        return {
          success: false,
          error: addError.message || "Gagal menambahkan karyawan"
        }
      }
      
      console.log("Employee added successfully:", newEmployee)
      await refetch()
      
      return { success: true }
    } catch (err: any) {
      console.error("Error in addEmployee:", err)
      return {
        success: false,
        error: err.message || "Terjadi kesalahan saat menambahkan karyawan"
      }
    }
  }, [refetch])
  
  /**
   * Update existing employee
   */
  const updateEmployee = useCallback(async (id: string, data: Partial<EmployeeFormData>) => {
    try {
      const { data: updatedEmployee, error: updateError } = await updateEmployeeAPI(id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        pin: data.pin,
        status: data.status,
        position: data.position,
      })
      
      if (updateError) {
        console.error("Error updating employee:", updateError)
        return {
          success: false,
          error: updateError.message || "Gagal mengupdate karyawan"
        }
      }
      
      console.log("Employee updated successfully:", updatedEmployee)
      await refetch()
      
      return { success: true }
    } catch (err: any) {
      console.error("Error in updateEmployee:", err)
      return {
        success: false,
        error: err.message || "Terjadi kesalahan saat mengupdate karyawan"
      }
    }
  }, [refetch])
  
  /**
   * Delete employee
   */
  const deleteEmployee = useCallback(async (id: string) => {
    try {
      const { data: deletedEmployee, error: deleteError } = await deleteEmployeeAPI(id)
      
      if (deleteError) {
        console.error("Error deleting employee:", deleteError)
        return {
          success: false,
          error: deleteError.message || "Gagal menghapus karyawan"
        }
      }
      
      console.log("Employee deleted successfully:", deletedEmployee)
      await refetch()
      
      return { success: true }
    } catch (err: any) {
      console.error("Error in deleteEmployee:", err)
      return {
        success: false,
        error: err.message || "Terjadi kesalahan saat menghapus karyawan"
      }
    }
  }, [refetch])
  
  /**
   * Initial data load
   */
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'instant' })
    
    loadEmployees()
    loadAbsentEmployees()
  }, [loadEmployees, loadAbsentEmployees])
  
  /**
   * Setup real-time subscriptions
   */
  useEffect(() => {
    console.log("Setting up real-time subscription for employees")
    
    const channel = setupEmployeeRealtime(async () => {
      console.log("Real-time update received, refreshing stats only...")
      // Only refresh stats, not full employees reload
      if (employees.length > 0) {
        await loadEmployeeStats(employees)
      }
      // Refresh absent employees
      await loadAbsentEmployees()
    })
    
    return () => {
      console.log("Cleaning up real-time subscription")
      supabase.removeChannel(channel)
    }
  }, [employees, loadEmployeeStats, loadAbsentEmployees])
  
  return {
    // Data
    employees,
    employeeStats,
    employeeCommissions,
    employeeAttendance,
    absentEmployees,
    
    // Loading states
    loading,
    statsLoading,
    operationLoading,
    
    // Error state
    error,
    
    // Actions
    refetch,
    loadEmployeeStats,
    loadAbsentEmployees,
    
    // CRUD operations
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Operation state setters
    setOperationLoading,
  }
}
