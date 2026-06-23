// Database Schema - PIGTOWN BARBERSHOP
// Generated and updated: 2026-05-20
// Matches actual Supabase database structure

import { pgTable, serial, text, varchar, timestamp, integer, decimal, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =====================================================
// USERS TABLE
// =====================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  pin: varchar('pin', { length: 6 }),
  role: text('role').notNull(), // owner, admin, cashier, barber, employee
  name: text('name').notNull(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  position: text('position'),
  branchId: integer('branch_id'),
  status: text('status').notNull().default('active'), // active, inactive
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =====================================================
// BRANCHES TABLE
// =====================================================

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  status: text('status').notNull().default('active'), // active, inactive
  managerId: integer('manager_id'),
  operatingHours: jsonb('operating_hours'), // {"open":"09:00","close":"21:00"}
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// SERVICES TABLE (Products & Services)
// =====================================================

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  duration: integer('duration'), // in minutes
  aktif: boolean('aktif').notNull().default(true),
  categoryId: integer('category_id'),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  type: text('type').notNull().default('service'), // service, product
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  stock: integer('stock').default(0),
  status: text('status').notNull().default('active'), // active, inactive
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =====================================================
// TRANSACTIONS TABLE
// =====================================================

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  transactionNumber: varchar('transaction_number', { length: 50 }).notNull().unique(),
  branchId: uuid('branch_id').notNull(),
  cashierId: integer('cashier_id').notNull(),
  customerName: text('customer_name'),
  customerPhone: varchar('customer_phone', { length: 20 }),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 12, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(), // cash, debit, qris
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
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').notNull(),
  serviceId: integer('service_id').notNull(),
  barberId: integer('barber_id'),
  quantity: integer('quantity').notNull().default(1),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  commissionStatus: text('commission_status').notNull().default('credited'), // pending, credited, paid
  // Snapshot fields
  serviceName: text('service_name').notNull(),
  serviceType: text('service_type').notNull(),
  serviceCategory: text('service_category'),
  barberName: text('barber_name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =====================================================
// ATTENDANCE TABLE
// =====================================================

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  branchId: uuid('branch_id').notNull(),
  date: timestamp('date').notNull(),
  shiftType: text('shift_type').notNull(), // pagi, siang, malam
  checkInTime: timestamp('check_in_time').notNull(),
  checkOutTime: timestamp('check_out_time'),
  checkInPhoto: text('check_in_photo'),
  checkOutPhoto: text('check_out_photo'),
  breakStartTime: timestamp('break_start_time'),
  breakEndTime: timestamp('break_end_time'),
  breakDuration: integer('break_duration').default(0), // in minutes
  totalHours: decimal('total_hours', { precision: 5, scale: 2 }).default('0'),
  status: text('status').notNull().default('checked_in'), // checked_in, on_break, checked_out, absent
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// KASBON TABLE
// =====================================================

export const kasbon = pgTable('kasbon', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  remainingAmount: decimal('remaining_amount', { precision: 12, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'), // pending, approved, rejected, paid
  requestDate: timestamp('request_date').notNull().defaultNow(),
  approvedBy: integer('approved_by'),
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
  id: serial('id').primaryKey(),
  branchId: uuid('branch_id').notNull(),
  category: text('category').notNull(), // operasional, gaji, bonus, kasbon, lainnya
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  receiptUrl: text('receipt_url'),
  requestedBy: integer('requested_by').notNull(),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  approvedBy: integer('approved_by'),
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
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: text('type').notNull(), // bonus, penalty, adjustment
  points: integer('points').notNull(),
  reason: text('reason').notNull(),
  givenBy: integer('given_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =====================================================
// RECEIPT TEMPLATES TABLE
// =====================================================

export const receiptTemplates = pgTable('receipt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  headerText: text('header_text'),
  footerText: text('footer_text'),
  logoUrl: text('logo_url'),
  logoHeight: integer('logo_height').default(40),
  branchId: uuid('branch_id'),
  paperSize: varchar('paper_size', { length: 10 }).default('80mm'),
  paperWidth: integer('paper_width').default(80),
  fontSize: varchar('font_size', { length: 10 }).default('medium'),
  showLogo: boolean('show_logo').default(false),
  showAddress: boolean('show_address').default(true),
  showPhone: boolean('show_phone').default(true),
  showDate: boolean('show_date').default(true),
  showBarber: boolean('show_barber').default(true),
  showCashier: boolean('show_cashier').default(true),
  showCustomer: boolean('show_customer').default(true),
  isActive: boolean('is_active').default(false),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// PROFILES TABLE
// =====================================================

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  avatar: text('avatar'),
  bio: text('bio'),
  dateOfBirth: timestamp('date_of_birth'),
  emergencyContact: varchar('emergency_contact', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// CUSTOMERS TABLE
// =====================================================

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 20 }).unique(),
  email: text('email'),
  address: text('address'),
  totalVisits: integer('total_visits').default(0),
  totalSpent: decimal('total_spent', { precision: 12, scale: 2 }).default('0'),
  loyaltyPoints: integer('loyalty_points').default(0),
  notes: text('notes'),
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
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  transactions: many(transactions),
  transactionItems: many(transactionItems),
  attendance: many(attendance),
  kasbon: many(kasbon),
  expenses: many(expenses),
  points: many(points),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  manager: one(users, {
    fields: [branches.managerId],
    references: [users.id],
  }),
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

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const receiptTemplatesRelations = relations(receiptTemplates, ({ one }) => ({
  branch: one(branches, {
    fields: [receiptTemplates.branchId],
    references: [branches.id],
  }),
}));
