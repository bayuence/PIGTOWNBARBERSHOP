// Fix POS system column names to match database schema
const fs = require('fs');

const filePath = 'components/pos-system.tsx';

console.log('🔧 Fixing POS system column names...\n');

let content = fs.readFileSync(filePath, 'utf8');

// Count occurrences
const totalAmountCount = (content.match(/total_amount/g) || []).length;
const discountAmountCount = (content.match(/discount_amount/g) || []).length;
const finalAmountCount = (content.match(/final_amount/g) || []).length;

console.log(`Found:`);
console.log(`  - total_amount: ${totalAmountCount} occurrences`);
console.log(`  - discount_amount: ${discountAmountCount} occurrences`);
console.log(`  - final_amount: ${finalAmountCount} occurrences\n`);

// Replace column names to match schema
// total_amount → subtotal
// discount_amount → discount  
// final_amount → total

content = content.replace(/total_amount/g, 'subtotal');
content = content.replace(/discount_amount/g, 'discount');
content = content.replace(/final_amount/g, 'total');

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all column names!');
console.log('\nChanges made:');
console.log('  - total_amount → subtotal');
console.log('  - discount_amount → discount');
console.log('  - final_amount → total');
console.log('\n✅ File updated successfully!');
