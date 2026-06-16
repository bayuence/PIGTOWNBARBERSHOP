/**
 * DRIZZLE ORM SCHEMA - AUTO-GENERATED FROM DATABASE
 * Generated from actual Supabase database structure
 * 
 * DO NOT EDIT MANUALLY - Use drizzle-kit to regenerate
 */

import { pgTable, uuid, varchar, integer, numeric, text, timestamp, boolean, serial } from 'drizzle-orm/pg-core'

// ========================================
// TRANSACTIONS TABLE
// ========================================
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  transaction_number: varchar('transaction_number').notNull(),
  receipt_number: varchar('receipt_number'),
  cashier_id: integer('cashier_id'),
  server_id: integer('server_id'),
  branch_id: uuid('branch_id'),
  cashier_name: varchar('cashier_name'),
  server_name: varchar('server_name'),
  branch_name: varchar('branch_name'),
  customer_name: varchar('customer_name'),
  subtotal: numeric('subtotal'),
  discount_amount: numeric('discount_amount'),
  total_amount: numeric('total_amount').notNull(),
  payment_method: varchar('payment_method'),
  payment_status: varchar('payment_status'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
})

// ========================================
// TRANSACTION_ITEMS TABLE
// ========================================
export const transaction_items = pgTable('transaction_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  transaction_id: uuid('transaction_id').notNull(),
  service_id: integer('service_id'), // Fixed: Changed from uuid to integer
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price').notNull(),
  total_price: numeric('total_price').notNull(),
  commission_status: varchar('commission_status'),
  commission_type: varchar('commission_type'),
  commission_value: numeric('commission_value'),
  commission_amount: numeric('commission_amount'),
  barber_id: integer('barber_id'), // Fixed: Changed from uuid to integer
  created_at: timestamp('created_at').defaultNow(),
})

// ========================================
// SERVICES TABLE
// ========================================
export const services = pgTable('services', {
  id: integer('id').primaryKey(), // Fixed: Changed from uuid to integer
  name: varchar('name').notNull(),
  description: text('description'),
  price: numeric('price').notNull(),
  duration: integer('duration'),
  category_id: uuid('category_id'),
  type: varchar('type'),
  stock: integer('stock'),
  aktif: boolean('aktif').default(true),
  commission_rate: numeric('commission_rate'),
  image_url: text('image_url'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at'),
})

// ========================================
// SERVICE_CATEGORIES TABLE
// ========================================
export const service_categories = pgTable('service_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at'),
})

// ========================================
// USERS TABLE
// ========================================
export const users = pgTable('users', {
  id: integer('id').primaryKey(), // Fixed: Changed from uuid to integer (based on actual database)
  email: varchar('email').notNull().unique(),
  password: varchar('password'),
  name: varchar('name').notNull(),
  phone: varchar('phone'),
  address: text('address'),
  position: varchar('position'),
  role: varchar('role'),
  status: varchar('status').default('active'),
  branch_id: uuid('branch_id'),
  pin: varchar('pin'),
  salary: numeric('salary'),
  commission_rate: numeric('commission_rate'),
  max_absent_days: integer('max_absent_days'),
  current_absent_days: integer('current_absent_days'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at'),
})

// ========================================
// BRANCHES TABLE
// ========================================
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  address: text('address'),
  phone: varchar('phone'),
  status: varchar('status').default('active'),
  manager_id: uuid('manager_id'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at'),
})

// ========================================
// ATTENDANCE TABLE
// ========================================
export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: integer('user_id').notNull(), // Fixed: Changed from uuid to integer
  branch_id: uuid('branch_id'),
  shift_type: varchar('shift_type'),
  check_in_time: timestamp('check_in_time'),
  check_out_time: timestamp('check_out_time'),
  break_start_time: timestamp('break_start_time'),
  break_end_time: timestamp('break_end_time'),
  total_hours: numeric('total_hours'),
  break_duration: numeric('break_duration'),
  status: varchar('status'),
  check_in_photo: text('check_in_photo'),
  check_out_photo: text('check_out_photo'),
  date: varchar('date').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at'),
})

// ========================================
// POINTS TABLE
// ========================================
export const points = pgTable('points', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: integer('user_id').notNull(), // Fixed: Changed from uuid to integer
  points_earned: integer('points_earned').notNull(),
  points_type: varchar('points_type'),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at'),
})

// ========================================
// KASBON TABLE
// ========================================
export const kasbon = pgTable('kasbon', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: integer('user_id').notNull(), // Fixed: Changed from uuid to integer
  amount: numeric('amount').notNull(),
  reason: text('reason'),
  status: varchar('status').default('pending'),
  request_date: timestamp('request_date').defaultNow(),
  due_date: timestamp('due_date'),
  notes: text('notes'),
  approved_by: integer('approved_by'), // Fixed: Changed from uuid to integer
  approved_at: timestamp('approved_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at'),
})

// ========================================
// EXPENSES TABLE
// ========================================
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  branch_id: uuid('branch_id'),
  category: varchar('category'),
  description: text('description'),
  amount: numeric('amount').notNull(),
  status: varchar('status').default('pending'),
  request_date: timestamp('request_date').defaultNow(),
  due_date: timestamp('due_date'),
  receipt_url: text('receipt_url'),
  notes: text('notes'),
  requested_by: integer('requested_by'), // Fixed: Changed from uuid to integer
  approved_by: integer('approved_by'), // Fixed: Changed from uuid to integer
  approved_at: timestamp('approved_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at'),
})

// ========================================
// BRANCH_SHIFTS TABLE
// ========================================
export const branch_shifts = pgTable('branch_shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  branch_id: uuid('branch_id').notNull(),
  shift_name: varchar('shift_name').notNull(),
  shift_type: varchar('shift_type'),
  start_time: varchar('start_time'),
  end_time: varchar('end_time'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
})

// ========================================
// RECEIPT_TEMPLATES TABLE
// ========================================
export const receipt_templates = pgTable('receipt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  header_text: text('header_text'),
  footer_text: text('footer_text'),
  logo_url: text('logo_url'),
  is_active: boolean('is_active').default(false),
  is_default: boolean('is_default').default(false),
  branch_id: uuid('branch_id'),
  created_at: timestamp('created_at').defaultNow(),
})

// ========================================
// COMMISSION_RULES TABLE
// ========================================
export const commission_rules = pgTable('commission_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: integer('user_id'), // Fixed: Changed from uuid to integer
  service_id: integer('service_id'), // Fixed: Changed from uuid to integer
  commission_type: varchar('commission_type'),
  commission_value: numeric('commission_value'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at'),
})

// Export all tables
export const schema = {
  transactions,
  transaction_items,
  services,
  service_categories,
  users,
  branches,
  attendance,
  points,
  kasbon,
  expenses,
  branch_shifts,
  receipt_templates,
  commission_rules,
}
