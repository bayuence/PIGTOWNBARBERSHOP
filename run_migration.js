process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({path: '.env'});
const { Client } = require('pg');

async function migrate() {
  const poolerUrl = process.env.DATABASE_URL;
  // Just use the original URL but change port to 5432
  const directUrl = poolerUrl.replace('6543', '5432');

  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log("Connecting...");
    await client.connect();
    console.log("Connected. Running migration...");
    await client.query(`ALTER TABLE "kasbon" ALTER COLUMN "remaining_amount" SET DEFAULT '0'`);
    await client.query(`ALTER TABLE "kasbon" ADD COLUMN "paid_amount" numeric(12, 2) DEFAULT '0'`);
    console.log("Migration successful!");
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Column already exists!');
    } else {
      console.error("Migration failed:", error);
    }
  } finally {
    await client.end();
  }
}

migrate();
