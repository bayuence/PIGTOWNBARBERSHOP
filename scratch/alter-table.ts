import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const client = postgres(connectionString, { prepare: false });

async function run() {
  try {
    await client`
      ALTER TABLE branch_shifts 
      ADD COLUMN IF NOT EXISTS break_times JSONB DEFAULT '[]'::jsonb;
    `;
    console.log("Successfully added break_times column");
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
}

run();
