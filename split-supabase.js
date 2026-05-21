/**
 * Script untuk memecah supabase-old.ts menjadi file-file modular
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting supabase-old.ts splitting...\n');

// Read the old file
const oldFilePath = path.join(__dirname, 'lib', 'supabase-old.ts');
const content = fs.readFileSync(oldFilePath, 'utf8');

// Split by export functions
const lines = content.split('\n');

// Categories and their patterns
const categories = {
  branches: ['getBranchShifts', 'createBranchShift', 'getBranches'],
  transactions: ['createTransaction', 'createTransactionItems', 'getReceiptTemplate', 'getActiveReceiptTemplate', 'generateTransactionNumber'],
  attendance: ['uploadPhotoToSupabase', 'createAttendanceRecord', 'updateAttendanceRecord', 'getAttendanceByDate', 'getAllAttendanceRecords', 'getEmployeeAttendance', 'getEmployeePhotos', 'getEmployeeAttendanceWithPhotos', 'getAbsentEmployeesToday'],
  employees: ['getEmployees', 'addEmployee', 'updateEmployee', 'deleteEmployee', 'getEmployeeStats', 'getEmployeeCommissions', 'getEmployeeAbsenceInfo', 'updateMaxAbsentDays', 'getCurrentUser', 'updateUserPin'],
  kasbon: ['getKasbonRequests', 'getKasbonStatistics', 'getUsersWithKasbon', 'createKasbonRequest', 'updateKasbonStatus'],
  expenses: ['getExpenses', 'getExpenseStatistics', 'getExpenseStatisticsByBranch', 'createExpenseRequest', 'updateExpenseRequest', 'updateExpenseStatus', 'deleteExpenseRequest', 'getAllExpensesWithDetails', 'getExpensesByStatus', 'getApprovedExpenses'],
  points: ['getUsersWithPoints', 'getPointsStatistics', 'getPointTransactions', 'addPointTransaction', 'getUserPoints'],
  services: ['getServicesWithCategories', 'getServiceCategories'],
  stock: ['checkServiceStock', 'reduceServiceStock', 'updateServiceStock', 'getOutletStock', 'updateOutletStock', 'getLowStockAlerts'],
};

// Extract imports and client setup
const imports = [];
const clientSetup = [];
let inImports = true;
let inClientSetup = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('import ')) {
    imports.push(line);
  } else if (line.includes('const supabaseUrl') || line.includes('const supabaseAnonKey')) {
    inImports = false;
    inClientSetup = true;
    clientSetup.push(line);
  } else if (inClientSetup && (line.includes('export const supabase') || line.includes('export const testSupabaseConnection'))) {
    clientSetup.push(line);
    // Continue until we find the closing of testSupabaseConnection
    while (i < lines.length && !lines[i].includes('// ===')) {
      clientSetup.push(lines[i]);
      i++;
    }
    break;
  } else if (inClientSetup) {
    clientSetup.push(line);
  }
}

console.log('✅ Extracted imports and client setup');
console.log(`   - Imports: ${imports.length} lines`);
console.log(`   - Client setup: ${clientSetup.length} lines\n`);

// Find all function definitions
const functions = {};
let currentFunction = null;
let functionLines = [];
let braceCount = 0;
let inFunction = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this is a function export
  if (line.match(/^export (async )?function \w+/)) {
    // Save previous function if exists
    if (currentFunction && functionLines.length > 0) {
      functions[currentFunction] = functionLines.join('\n');
    }
    
    // Start new function
    const match = line.match(/^export (async )?function (\w+)/);
    currentFunction = match[2];
    functionLines = [line];
    inFunction = true;
    braceCount = 0;
    continue;
  }
  
  if (inFunction) {
    functionLines.push(line);
    
    // Count braces to know when function ends
    for (const char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    
    // Function ended
    if (braceCount === 0 && line.includes('}')) {
      functions[currentFunction] = functionLines.join('\n');
      currentFunction = null;
      functionLines = [];
      inFunction = false;
    }
  }
}

console.log(`✅ Found ${Object.keys(functions).length} functions\n`);

// Categorize functions
const categorized = {};
for (const [category, patterns] of Object.entries(categories)) {
  categorized[category] = [];
  for (const funcName of Object.keys(functions)) {
    if (patterns.some(pattern => funcName.includes(pattern) || pattern.includes(funcName))) {
      categorized[category].push(funcName);
    }
  }
}

// Print categorization
console.log('📊 Function categorization:');
for (const [category, funcs] of Object.entries(categorized)) {
  console.log(`   ${category}: ${funcs.length} functions`);
}

console.log('\n✅ Splitting complete! Check the output above.');
console.log('\n📝 Next steps:');
console.log('   1. Review the categorization');
console.log('   2. Create individual files manually based on this analysis');
console.log('   3. Test each file');
console.log('   4. Update index.ts');
