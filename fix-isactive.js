// Script to fix isActive in branch-management.tsx
const fs = require('fs');

const filePath = 'components/branch-management.tsx';

console.log('🔧 Fixing isActive in branch-management.tsx...\n');

// Read file
let content = fs.readFileSync(filePath, 'utf8');

// Count occurrences
const isActiveCount = (content.match(/isActive/g) || []).length;
console.log(`Found ${isActiveCount} occurrences of "isActive"\n`);

// Fix Service interface - services use 'aktif' in database
content = content.replace(
  /interface Service \{[^}]*\}/s,
  `interface Service {
  id: string
  name: string
  price: number
  duration: number
  aktif: boolean  // Changed from isActive
  category: string
}`
);

// Fix Employee interface - users use 'status' in database
content = content.replace(
  /interface Employee \{[^}]*\}/s,
  `interface Employee {
  id: string
  name: string
  position: string
  phone: string
  email: string
  status: string  // Changed from isActive to status ('active' | 'inactive')
  shifts: string[]
  salary: number
  commission: number
}`
);

// Fix Shift interface - shifts use 'status' 
content = content.replace(
  /interface Shift \{[^}]*\}/s,
  `interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  days: string[]
  maxEmployees: number
  currentEmployees: number
  status: string  // Changed from isActive to status
  breakTime?: {
    start: string
    end: string
    duration: number
  }
  minStaff: number
  hasBreakTime?: boolean
  breakTimes?: Array<{
    id: string
    start: string
    end: string
    duration: number
  }>
}`
);

// Fix BranchTarget interface
content = content.replace(
  /interface BranchTarget \{[^}]*\}/s,
  `interface BranchTarget {
  id: string
  type: "revenue" | "customers" | "services"
  target: number
  current: number
  period: "daily" | "weekly" | "monthly"
  status: string  // Changed from isActive to status
}`
);

// Fix NewShift interface
content = content.replace(
  /interface NewShift \{[^}]*\}/s,
  `interface NewShift {
  name: string
  startTime: string
  endTime: string
  days: string[]
  hasBreakTime: boolean
  breakTimes: Array<{
    id: string
    start: string
    end: string
    duration: number
  }>
  status?: string  // Changed from isActive to status
}`
);

// Replace all isActive references with appropriate field names
// For services
content = content.replace(/service\.isActive/g, 'service.aktif');
content = content.replace(/newService\.isActive/g, 'newService.aktif');

// For employees
content = content.replace(/employee\.isActive/g, "employee.status === 'active'");
content = content.replace(/newEmployee\.isActive/g, "newEmployee.status");

// For shifts
content = content.replace(/shift\.isActive/g, "shift.status === 'active'");
content = content.replace(/shift\.is_active/g, "shift.status");
content = content.replace(/newShift\.isActive/g, "newShift.status");

// For targets
content = content.replace(/target\.isActive/g, "target.status === 'active'");
content = content.replace(/newTarget\.isActive/g, "newTarget.status");

// Fix default values
content = content.replace(/isActive: true/g, "status: 'active'");
content = content.replace(/aktif: true/g, "aktif: true");  // Keep aktif as boolean

// Fix Badge conditions
content = content.replace(
  /service\.isActive \? "Aktif" : "Nonaktif"/g,
  'service.aktif ? "Aktif" : "Nonaktif"'
);
content = content.replace(
  /employee\.isActive \? "Aktif" : "Nonaktif"/g,
  'employee.status === "active" ? "Aktif" : "Nonaktif"'
);
content = content.replace(
  /target\.isActive \? "Aktif" : "Nonaktif"/g,
  'target.status === "active" ? "Aktif" : "Nonaktif"'
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all isActive references!');
console.log('\nChanges made:');
console.log('- Service.isActive → Service.aktif (boolean)');
console.log('- Employee.isActive → Employee.status (string)');
console.log('- Shift.isActive → Shift.status (string)');
console.log('- BranchTarget.isActive → BranchTarget.status (string)');
console.log('\n✅ File updated successfully!');
