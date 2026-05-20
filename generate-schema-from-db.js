// Generate schema from actual database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateSchema() {
  console.log('🔍 Generating Schema from Database...\n');

  const schema = {
    users: null,
    branches: null,
    services: null,
    transactions: null,
    transaction_items: null,
    attendance: null,
    kasbon: null,
    expenses: null,
    points: null,
    receipt_templates: null,
    profiles: null,
    customers: null,
  };

  // Get sample data from each table
  for (const tableName of Object.keys(schema)) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (!error && data && data.length > 0) {
      schema[tableName] = data[0];
      console.log(`✅ ${tableName}: ${Object.keys(data[0]).length} columns`);
    } else {
      console.log(`⚠️  ${tableName}: Empty or error`);
    }
  }

  // Save to file
  fs.writeFileSync(
    'database-real-schema.json',
    JSON.stringify(schema, null, 2)
  );

  console.log('\n✅ Schema saved to: database-real-schema.json');
  
  // Generate TypeScript schema
  console.log('\n📝 Generating TypeScript Schema...\n');
  
  let tsSchema = `// Generated from database on ${new Date().toISOString()}\n`;
  tsSchema += `import { pgTable, serial, text, varchar, timestamp, integer, decimal, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';\n\n`;
  
  // Users table
  if (schema.users) {
    const cols = Object.keys(schema.users);
    tsSchema += `export const users = pgTable('users', {\n`;
    cols.forEach(col => {
      const val = schema.users[col];
      const type = typeof val;
      
      if (col === 'id') tsSchema += `  id: serial('id').primaryKey(),\n`;
      else if (col === 'email') tsSchema += `  email: text('email').notNull().unique(),\n`;
      else if (col === 'password') tsSchema += `  password: text('password').notNull(),\n`;
      else if (col === 'pin') tsSchema += `  pin: varchar('pin', { length: 6 }),\n`;
      else if (col === 'role') tsSchema += `  role: text('role').notNull(),\n`;
      else if (col === 'name') tsSchema += `  name: text('name').notNull(),\n`;
      else if (col === 'phone') tsSchema += `  phone: varchar('phone', { length: 20 }),\n`;
      else if (col === 'address') tsSchema += `  address: text('address'),\n`;
      else if (col === 'position') tsSchema += `  position: text('position'),\n`;
      else if (col === 'branch_id') tsSchema += `  branchId: integer('branch_id'),\n`;
      else if (col === 'status') tsSchema += `  status: text('status').notNull().default('active'),\n`;
      else if (col === 'created_at') tsSchema += `  createdAt: timestamp('created_at').notNull().defaultNow(),\n`;
    });
    tsSchema += `});\n\n`;
  }
  
  // Branches table
  if (schema.branches) {
    const cols = Object.keys(schema.branches);
    tsSchema += `export const branches = pgTable('branches', {\n`;
    cols.forEach(col => {
      if (col === 'id') tsSchema += `  id: uuid('id').primaryKey().defaultRandom(),\n`;
      else if (col === 'name') tsSchema += `  name: text('name').notNull(),\n`;
      else if (col === 'address') tsSchema += `  address: text('address'),\n`;
      else if (col === 'phone') tsSchema += `  phone: varchar('phone', { length: 20 }),\n`;
      else if (col === 'status') tsSchema += `  status: text('status').notNull().default('active'),\n`;
      else if (col === 'manager_id') tsSchema += `  managerId: integer('manager_id'),\n`;
      else if (col === 'operating_hours') tsSchema += `  operatingHours: jsonb('operating_hours'),\n`;
      else if (col === 'created_at') tsSchema += `  createdAt: timestamp('created_at').notNull().defaultNow(),\n`;
      else if (col === 'updated_at') tsSchema += `  updatedAt: timestamp('updated_at').notNull().defaultNow(),\n`;
    });
    tsSchema += `});\n\n`;
  }
  
  // Services table
  if (schema.services) {
    const cols = Object.keys(schema.services);
    tsSchema += `export const services = pgTable('services', {\n`;
    cols.forEach(col => {
      if (col === 'id') tsSchema += `  id: serial('id').primaryKey(),\n`;
      else if (col === 'name') tsSchema += `  name: text('name').notNull(),\n`;
      else if (col === 'description') tsSchema += `  description: text('description'),\n`;
      else if (col === 'price') tsSchema += `  price: decimal('price', { precision: 12, scale: 2 }).notNull(),\n`;
      else if (col === 'duration') tsSchema += `  duration: integer('duration'),\n`;
      else if (col === 'aktif') tsSchema += `  aktif: boolean('aktif').notNull().default(true),\n`;
      else if (col === 'category_id') tsSchema += `  categoryId: integer('category_id'),\n`;
      else if (col === 'commission_rate') tsSchema += `  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull().default('0'),\n`;
      else if (col === 'type') tsSchema += `  type: text('type').notNull().default('service'),\n`;
      else if (col === 'stock') tsSchema += `  stock: integer('stock').default(0),\n`;
      else if (col === 'status') tsSchema += `  status: text('status').notNull().default('active'),\n`;
      else if (col === 'created_at') tsSchema += `  createdAt: timestamp('created_at').notNull().defaultNow(),\n`;
    });
    tsSchema += `});\n\n`;
  }
  
  fs.writeFileSync('lib/db/schema-generated.ts', tsSchema);
  console.log('✅ TypeScript schema saved to: lib/db/schema-generated.ts');
}

generateSchema();
