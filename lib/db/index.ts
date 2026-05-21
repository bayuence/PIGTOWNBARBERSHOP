/**
 * DRIZZLE DATABASE CONNECTION
 * Server-side only - DO NOT import in client components
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema-generated'

// Only create connection on server side
let db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (typeof window !== 'undefined') {
    throw new Error('Database connection can only be used on the server side')
  }
  
  if (!db) {
    const connectionString = process.env.DATABASE_URL!
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined')
    }
    
    // Disable prefetch as it's not supported for "Transaction" pool mode
    const client = postgres(connectionString, { prepare: false })
    db = drizzle(client, { schema })
  }
  
  return db
}

// Export schema for use in queries
export * from './schema-generated'
export { schema }
