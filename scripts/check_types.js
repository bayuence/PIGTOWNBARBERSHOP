const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.leoriloxnohuwzyapcou:%4015Mei2004saja@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();
    const r1 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cash_deposits'");
    const r2 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'branches'");
    console.log('DEPOSITS:', r1.rows);
    console.log('BRANCHES:', r2.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
