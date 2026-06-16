import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function resetDb() {
  console.log("Starting database reset...");
  try {
    // Truncate all tables with CASCADE to handle foreign key constraints
    await client`
      TRUNCATE TABLE 
        users, 
        branches, 
        services, 
        transactions, 
        transaction_items, 
        attendance, 
        kasbon, 
        expenses, 
        points, 
        receipt_templates, 
        profiles, 
        customers 
      CASCADE;
    `;
    console.log("✅ All tables have been successfully truncated (cleared)!");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
  } finally {
    await client.end();
  }
}

resetDb();
