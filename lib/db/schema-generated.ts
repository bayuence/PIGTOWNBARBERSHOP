// Generated from database on 2026-05-20T10:13:55.143Z
import { pgTable, serial, text, varchar, timestamp, integer, decimal, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  pin: varchar('pin', { length: 6 }),
  role: text('role').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  status: text('status').notNull().default('active'),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  position: text('position'),
  branchId: integer('branch_id'),
  name: text('name').notNull(),
});

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  status: text('status').notNull().default('active'),
  managerId: integer('manager_id'),
  operatingHours: jsonb('operating_hours'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  duration: integer('duration'),
  aktif: boolean('aktif').notNull().default(true),
  categoryId: integer('category_id'),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  type: text('type').notNull().default('service'),
  stock: integer('stock').default(0),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

