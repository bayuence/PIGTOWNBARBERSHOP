const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'components/transaction-history.tsx',
  'components/overviewdananalytic.tsx',
  'components/comprehensive-reports.tsx',
  'components/branch-management.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace t.total with t.total_amount (in reduce functions)
  content = content.replace(/t\.total\s*\|\|/g, 't.total_amount ||');
  content = content.replace(/\(t\.total\s*\|\|/g, '(t.total_amount ||');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed: ${file}`);
});

console.log('\n✅ All files fixed!');
