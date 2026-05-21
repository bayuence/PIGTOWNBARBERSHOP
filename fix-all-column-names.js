const fs = require('fs');
const path = require('path');

// Files to fix with their column mappings
const filesToFix = [
  {
    file: 'components/transaction-history.tsx',
    replacements: [
      { from: /\.total_amount/g, to: '.total' },
      { from: /total_amount/g, to: 'total' },
      { from: /discount_amount/g, to: 'discount' },
      { from: /final_amount/g, to: 'total' }
    ]
  },
  {
    file: 'components/overviewdananalytic.tsx',
    replacements: [
      { from: /\.total_amount/g, to: '.total' },
      { from: /total_amount/g, to: 'total' },
      { from: /final_amount/g, to: 'total' },
      { from: /discount_amount/g, to: 'discount' }
    ]
  },
  {
    file: 'components/comprehensive-reports.tsx',
    replacements: [
      { from: /\.total_amount/g, to: '.total' },
      { from: /total_amount/g, to: 'total' },
      { from: /final_amount/g, to: 'total' },
      { from: /discount_amount/g, to: 'discount' }
    ]
  }
];

console.log('🔧 Starting comprehensive column name fixes...\n');

let totalChanges = 0;

filesToFix.forEach(({ file, replacements }) => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let fileChanges = 0;

  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      const count = matches.length;
      content = content.replace(from, to);
      fileChanges += count;
      console.log(`  ✓ Replaced ${count} occurrences: ${from.source} → ${to}`);
    }
  });

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${file}: ${fileChanges} changes\n`);
    totalChanges += fileChanges;
  } else {
    console.log(`✓ ${file}: No changes needed\n`);
  }
});

console.log(`\n🎉 Complete! Total changes: ${totalChanges}`);
console.log('\n📋 Summary:');
console.log('   - transaction-history.tsx: Fixed total_amount, discount_amount, final_amount');
console.log('   - overviewdananalytic.tsx: Fixed total_amount, final_amount');
console.log('   - comprehensive-reports.tsx: Fixed total_amount, final_amount');
console.log('\n✅ All components now use correct column names:');
console.log('   - subtotal (transaction subtotal before discount)');
console.log('   - discount (discount amount)');
console.log('   - total (final amount after discount)');
