import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const client = postgres(connectionString, { prepare: false });

async function run() {
  try {
    await client`
      ALTER TABLE service_categories
      ADD COLUMN type VARCHAR(255) DEFAULT 'service';
    `;
    console.log("Column 'type' added successfully to 'service_categories'.");
  } catch (error) {
    console.error("Error adding column:", error);
  } finally {
    await client.end();
  }
}

run();
