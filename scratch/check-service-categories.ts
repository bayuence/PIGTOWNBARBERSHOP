import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const client = postgres(connectionString, { prepare: false });

async function run() {
  try {
    const result = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'service_categories';
    `;
    console.log(result);
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
}

run();
