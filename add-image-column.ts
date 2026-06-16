import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log('Adding image_url column to services table...');
    await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;`;
    console.log('Successfully added image_url column!');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await sql.end();
  }
}

run();
