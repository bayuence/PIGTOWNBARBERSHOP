import { db } from './index';
import { 
  users, 
  branches, 
  services, 
  transactions, 
  transactionItems,
  attendance,
  kasbon,
  expenses,
  points 
} from './schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

// =====================================================
// USER QUERIES
// =====================================================

export async function getUserByEmail(email: string) {
  return await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      branch: true,
    },
  });
}

export async function getUserById(id: string) {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      branch: true,
    },
  });
}

export async function getUsersByBranch(branchId: number) {
  return await db.query.users.findMany({
    where: and(
      eq(users.branchId, branchId),
      eq(users.status, 'active')
    ),
    with: {
      branch: true,
    },
  });
}

export async function getBarbersByBranch(branchId: number) {
  return await db.query.users.findMany({
    where: and(
      eq(users.branchId, branchId),
      eq(users.role, 'barber'),
      eq(users.status, 'active')
    ),
  });
}

// =====================================================
// BRANCH QUERIES
// =====================================================

export async function getAllBranches() {
  return await db.query.branches.findMany({
    where: eq(branches.status, 'active'), // ✅ Fixed: branches use 'status' column
  });
}

export async function getBranchById(id: string) {
  return await db.query.branches.findFirst({
    where: eq(branches.id, id),
  });
}

// =====================================================
// SERVICE QUERIES
// =====================================================

export async function getAllServices() {
  return await db.query.services.findMany({
    where: eq(services.aktif, true), // ✅ Fixed: services use 'aktif' column (boolean)
    orderBy: [services.name],
  });
}

export async function getServicesByType(type: 'service' | 'product') {
  return await db.query.services.findMany({
    where: and(
      eq(services.type, type),
      eq(services.aktif, true) // ✅ Fixed: services use 'aktif' column
    ),
  });
}

export async function getLowStockProducts() {
  return await db.select()
    .from(services)
    .where(
      and(
        eq(services.type, 'product'),
        eq(services.aktif, true), // ✅ Fixed: services use 'aktif' column
        sql`${services.stock} <= ${services.minStock}`
      )
    );
}

// =====================================================
// TRANSACTION QUERIES
// =====================================================

export async function getTransactionsByBranch(
  branchId: string,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [eq(transactions.branchId, branchId)];
  
  if (startDate) {
    conditions.push(gte(transactions.createdAt, startDate));
  }
  
  if (endDate) {
    conditions.push(lte(transactions.createdAt, endDate));
  }

  return await db.query.transactions.findMany({
    where: and(...conditions),
    with: {
      items: {
        with: {
          service: true,
          barber: true,
        },
      },
      cashier: true,
      branch: true,
    },
    orderBy: [desc(transactions.createdAt)],
  });
}

export async function getTransactionById(id: string) {
  return await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
    with: {
      items: {
        with: {
          service: true,
          barber: true,
        },
      },
      cashier: true,
      branch: true,
    },
  });
}

export async function getTodayTransactionsByBranch(branchId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return await db.query.transactions.findMany({
    where: and(
      eq(transactions.branchId, branchId),
      gte(transactions.createdAt, today)
    ),
    with: {
      items: true,
    },
    orderBy: [desc(transactions.createdAt)],
  });
}

// =====================================================
// ATTENDANCE QUERIES
// =====================================================

export async function getTodayAttendanceByBranch(branchId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return await db.query.attendance.findMany({
    where: and(
      eq(attendance.branchId, branchId),
      gte(attendance.date, today)
    ),
    with: {
      user: true,
    },
    orderBy: [desc(attendance.checkInTime)],
  });
}

export async function getAttendanceByUser(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return await db.query.attendance.findMany({
    where: and(
      eq(attendance.userId, userId),
      gte(attendance.date, startDate),
      lte(attendance.date, endDate)
    ),
    with: {
      branch: true,
    },
    orderBy: [desc(attendance.date)],
  });
}

export async function getActiveAttendance(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return await db.query.attendance.findFirst({
    where: and(
      eq(attendance.userId, userId),
      gte(attendance.date, today),
      eq(attendance.status, 'checked_in')
    ),
  });
}

// =====================================================
// KASBON QUERIES
// =====================================================

export async function getPendingKasbon() {
  return await db.query.kasbon.findMany({
    where: eq(kasbon.status, 'pending'),
    with: {
      user: true,
    },
    orderBy: [desc(kasbon.requestDate)],
  });
}

export async function getKasbonByUser(userId: string) {
  return await db.query.kasbon.findMany({
    where: eq(kasbon.userId, userId),
    orderBy: [desc(kasbon.requestDate)],
  });
}

export async function getActiveKasbonByUser(userId: string) {
  return await db.query.kasbon.findMany({
    where: and(
      eq(kasbon.userId, userId),
      eq(kasbon.status, 'approved'),
      sql`${kasbon.remainingAmount} > 0`
    ),
  });
}

// =====================================================
// EXPENSE QUERIES
// =====================================================

export async function getPendingExpensesByBranch(branchId: string) {
  return await db.query.expenses.findMany({
    where: and(
      eq(expenses.branchId, branchId),
      eq(expenses.status, 'pending')
    ),
    with: {
      requester: true,
      branch: true,
    },
    orderBy: [desc(expenses.createdAt)],
  });
}

export async function getExpensesByBranch(
  branchId: string,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [eq(expenses.branchId, branchId)];
  
  if (startDate) {
    conditions.push(gte(expenses.expenseDate, startDate));
  }
  
  if (endDate) {
    conditions.push(lte(expenses.expenseDate, endDate));
  }

  return await db.query.expenses.findMany({
    where: and(...conditions),
    with: {
      requester: true,
      approver: true,
      branch: true,
    },
    orderBy: [desc(expenses.expenseDate)],
  });
}

// =====================================================
// POINTS QUERIES
// =====================================================

export async function getPointsByUser(userId: string) {
  return await db.query.points.findMany({
    where: eq(points.userId, userId),
    with: {
      giver: true,
    },
    orderBy: [desc(points.createdAt)],
  });
}

export async function getTotalPointsByUser(userId: string) {
  const result = await db
    .select({
      total: sql<number>`SUM(${points.points})`,
    })
    .from(points)
    .where(eq(points.userId, userId));
  
  return result[0]?.total || 0;
}

// =====================================================
// DASHBOARD/ANALYTICS QUERIES
// =====================================================

export async function getDashboardStats(branchId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Total revenue today
  const revenueResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${transactions.total}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.branchId, branchId),
        gte(transactions.createdAt, startOfDay),
        lte(transactions.createdAt, endOfDay)
      )
    );

  // Employees checked in today
  const attendanceResult = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.branchId, branchId),
        gte(attendance.date, startOfDay)
      )
    );

  // Pending kasbon
  const kasbonResult = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(kasbon)
    .where(eq(kasbon.status, 'pending'));

  // Pending expenses
  const expenseResult = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.branchId, branchId),
        eq(expenses.status, 'pending')
      )
    );

  return {
    revenue: revenueResult[0]?.total || 0,
    transactionCount: revenueResult[0]?.count || 0,
    employeesPresent: attendanceResult[0]?.count || 0,
    pendingKasbon: kasbonResult[0]?.count || 0,
    pendingExpenses: expenseResult[0]?.count || 0,
  };
}

export async function getTopBarbers(branchId: string, startDate: Date, endDate: Date) {
  return await db
    .select({
      barberId: transactionItems.barberId,
      barberName: transactionItems.barberName,
      totalRevenue: sql<number>`SUM(${transactionItems.subtotal})`,
      totalCommission: sql<number>`SUM(${transactionItems.commissionAmount})`,
      customerCount: sql<number>`COUNT(DISTINCT ${transactionItems.transactionId})`,
    })
    .from(transactionItems)
    .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
    .where(
      and(
        eq(transactions.branchId, branchId),
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate)
      )
    )
    .groupBy(transactionItems.barberId, transactionItems.barberName)
    .orderBy(desc(sql`SUM(${transactionItems.subtotal})`))
    .limit(10);
}
