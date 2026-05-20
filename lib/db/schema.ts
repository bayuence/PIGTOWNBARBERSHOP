import { pgTable, uuid, text, timestamp, integer, decimal, boolean, pgEnum, jsonb, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =====================================================
// ENUMS
// =====================================================

export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'cashier', 'barber', 'employee']);
export const shiftTypeEnum = pgEnum('shift_type', ['pagi', 'siang', 'malam']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['checked_in', 'on_break', 'checked_out', 'absent']);
export const kasbonStatusEnum = pgEnum('kasbon_status', ['pending', 'approved', 'rejected', 'paid']);
export const expenseCategoryEnum = pgEnum('expense_category', ['operasional', 'gaji', 'bonus', 'kasbon', 'lainnya']);
export const expenseStatusEnum = pgEnum('expense_status', ['pending', 'approved', 'rejected']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'debit', 'qris']);
export const serviceTypeEnum = pgEnum('service_type', ['service', 'product']);
export const serviceCategoryEnum = pgEnum('service_category', ['haircut', 'styling', 'treatment', 'product']);
export const commissionStatusEnum = pgEnum('commission_status', ['pending', 'credited', 'paid']);
export const pointTypeEnum = pgEnum('point_type', ['bonus', 'penalty', 'adjustment']);

// =====================================================
// USERS TABLE
// =====================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  pin: varchar('pin', { length: 6 }),
  fullName: text('full_name').notNull(),
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum('role').notNull().default('employee'),
  branchId: uuid('branch_id').references(() => branches.id),
  isActive: boolean('is_active').notNull().default(true),
  profilePhoto: text('profile_photo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// BRANCHES TABLE
// =====================================================

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// SERVICES TABLE (Products & Services)
// =====================================================

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: serviceTypeEnum('type').notNull().default('service'),
  category: serviceCategoryEnum('category').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  stock: integer('stock').default(0),
  minStock: integer('min_stock').default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// TRANSACTIONS TABLE
// =====================================================

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionNumber: varchar('transaction_number', { length: 50 }).notNull().unique(),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  cashierId: uuid('cashier_id').notNull().references(() => users.id),
  customerName: text('customer_name'),
  customerPhone: varchar('customer_phone', { length: 20 }),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 12, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  paymentAmount: decimal('payment_amount', { precision: 12, scale: 2 }).notNull(),
  changeAmount: decimal('change_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  // Snapshot fields for historical accuracy
  cashierName: text('cashier_name').notNull(),
  branchName: text('branch_name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =====================================================
// TRANSACTION ITEMS TABLE
// =====================================================

export const transactionItems = pgTable('transaction_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  barberId: uuid('barber_id').references(() => users.id),
  quantity: integer('quantity').notNull().default(1),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  commissionStatus: commissionStatusEnum('commission_status').notNull().default('credited'),
  // Snapshot fields
  serviceName: text('service_name').notNull(),
  serviceType: text('service_type').notNull(),
  serviceCategory: text('service_category').notNull(),
  barberName: text('barber_name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =====================================================
// ATTENDANCE TABLE
// =====================================================

export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  date: timestamp('date').notNull(),
  shiftType: shiftTypeEnum('shift_type').notNull(),
  checkInTime: timestamp('check_in_time').notNull(),
  checkOutTime: timestamp('check_out_time'),
  checkInPhoto: text('check_in_photo'),
  checkOutPhoto: text('check_out_photo'),
  breakStartTime: timestamp('break_start_time'),
  breakEndTime: timestamp('break_end_time'),
  breakDuration: integer('break_duration').default(0), // in minutes
  totalHours: decimal('total_hours', { precision: 5, scale: 2 }).default('0'),
  status: attendanceStatusEnum('status').notNull().default('checked_in'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// KASBON TABLE
// =====================================================

export const kasbon = pgTable('kasbon', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  remainingAmount: decimal('remaining_amount', { precision: 12, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  status: kasbonStatusEnum('status').notNull().default('pending'),
  requestDate: timestamp('request_date').notNull().defaultNow(),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  installmentAmount: decimal('installment_amount', { precision: 12, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// EXPENSES TABLE
// =====================================================

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  category: expenseCategoryEnum('category').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  receiptUrl: text('receipt_url'),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  status: expenseStatusEnum('status').notNull().default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectionNotes: text('rejection_notes'),
  expenseDate: timestamp('expense_date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// POINTS TABLE (Bonus/Penalty System)
// =====================================================

export const points = pgTable('points', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: pointTypeEnum('type').notNull(),
  points: integer('points').notNull(),
  reason: text('reason').notNull(),
  givenBy: uuid('given_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =====================================================
// RECEIPT TEMPLATES TABLE
// =====================================================

export const receiptTemplates = pgTable('receipt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  branchId: uuid('branch_id').references(() => branches.id),
  name: text('name').notNull(),
  template: jsonb('template').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// RELATIONS
// =====================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  transactions: many(transactions),
  transactionItems: many(transactionItems),
  attendance: many(attendance),
  kasbon: many(kasbon),
  expenses: many(expenses),
  points: many(points),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  users: many(users),
  transactions: many(transactions),
  attendance: many(attendance),
  expenses: many(expenses),
  receiptTemplates: many(receiptTemplates),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  transactionItems: many(transactionItems),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  branch: one(branches, {
    fields: [transactions.branchId],
    references: [branches.id],
  }),
  cashier: one(users, {
    fields: [transactions.cashierId],
    references: [users.id],
  }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  service: one(services, {
    fields: [transactionItems.serviceId],
    references: [services.id],
  }),
  barber: one(users, {
    fields: [transactionItems.barberId],
    references: [users.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [attendance.branchId],
    references: [branches.id],
  }),
}));

export const kasbonRelations = relations(kasbon, ({ one }) => ({
  user: one(users, {
    fields: [kasbon.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [kasbon.approvedBy],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  branch: one(branches, {
    fields: [expenses.branchId],
    references: [branches.id],
  }),
  requester: one(users, {
    fields: [expenses.requestedBy],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [expenses.approvedBy],
    references: [users.id],
  }),
}));

export const pointsRelations = relations(points, ({ one }) => ({
  user: one(users, {
    fields: [points.userId],
    references: [users.id],
  }),
  giver: one(users, {
    fields: [points.givenBy],
    references: [users.id],
  }),
}));

export const receiptTemplatesRelations = relations(receiptTemplates, ({ one }) => ({
  branch: one(branches, {
    fields: [receiptTemplates.branchId],
    references: [branches.id],
  }),
}));
