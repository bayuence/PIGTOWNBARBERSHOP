import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function seedOwner() {
  console.log("Seeding owner account...");
  try {
    const hashedPassword = await bcrypt.hash("pemilik123", 10);
    
    // Using raw SQL because we don't have the schema imported here to avoid issues
    await client`
      INSERT INTO users (email, password, role, name, status, pin)
      VALUES ('owner@pigtownbarbershop.com', ${hashedPassword}, 'owner', 'Owner', 'active', '123456')
      ON CONFLICT (email) DO UPDATE 
      SET password = ${hashedPassword}, role = 'owner', status = 'active', pin = '123456';
    `;
    
    console.log("✅ Owner account has been successfully created!");
  } catch (error) {
    console.error("❌ Error seeding owner:", error);
  } finally {
    await client.end();
  }
}

seedOwner();
