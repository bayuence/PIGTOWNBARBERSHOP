const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/branch-management.tsx');

console.log('🔧 Fixing branch-management.tsx column names...\n');

let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// Fix .select("total_amount") to .select("total")
const selectMatches = content.match(/\.select\("total_amount"\)/g);
if (selectMatches) {
  content = content.replace(/\.select\("total_amount"\)/g, '.select("total")');
  console.log(`✓ Fixed ${selectMatches.length} .select("total_amount") → .select("total")`);
  changes += selectMatches.length;
}

// Fix t.total_amount to t.total
const accessMatches = content.match(/t\.total_amount/g);
if (accessMatches) {
  content = content.replace(/t\.total_amount/g, 't.total');
  console.log(`✓ Fixed ${accessMatches.length} t.total_amount → t.total`);
  changes += accessMatches.length;
}

fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Fixed branch-management.tsx: ${changes} changes`);
console.log('   All transaction queries now use correct "total" column');
