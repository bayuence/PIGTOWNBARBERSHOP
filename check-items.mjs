import postgres from 'postgres';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env','utf-8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const[k,...v]=l.split('=');return[k.trim(),v.join('=').trim().replace(/^["']|["']$/g,'')]}));
const sql = postgres(env.DATABASE_URL,{ssl:'require'});

const items = await sql`
  SELECT ti.service_name, ti.service_type, ti.unit_price, ti.cost_price, ti.quantity, 
         ti.commission_amount, ti.commission_status, ti.barber_id, ti.service_id,
         t.server_id, t.cashier_id, t.cashier_name, t.server_name
  FROM transaction_items ti
  JOIN transactions t ON t.id = ti.transaction_id
  ORDER BY ti.created_at DESC LIMIT 5`;
console.log('Latest items with transaction info:');
items.forEach(i=>console.log(JSON.stringify(i)));

const rules = await sql`SELECT user_id, service_id, commission_type, commission_value FROM commission_rules LIMIT 10`;
console.log('\nCommission rules:');
rules.forEach(r=>console.log(JSON.stringify(r)));

await sql.end();
