# Design Document: Transaction History Component Refactoring

**Feature:** Split Monolithic Transaction History Component  
**Status:** 🎨 Design Phase  
**Created:** May 26, 2026  
**Phase:** FASE 2 - Split Monolithic Components

---

## 📋 Overview

Memecah komponen `transaction-history.tsx` (1749 lines) menjadi komponen-komponen yang lebih kecil, reusable, dan mudah di-maintain dengan mengikuti prinsip Clean Architecture.

### 🎯 Goals

1. ✅ **Reduce Component Size** - Dari 1749 lines menjadi <200 lines per component
2. ✅ **Improve Maintainability** - Setiap komponen punya tanggung jawab yang jelas
3. ✅ **Increase Reusability** - Komponen bisa dipakai di tempat lain
4. ✅ **Better Testability** - Mudah test setiap komponen secara terpisah
5. ✅ **Preserve Functionality** - Semua fitur existing tetap berfungsi

### 📊 Current State Analysis

**Current Component Structure:**
```
transaction-history.tsx (1749 lines)
├── State Management (50+ useState)
├── Data Fetching (5 useEffect)
├── Filters & Search
├── Statistics Cards
├── Transaction Table
├── Detail Modal
├── Edit Modal
├── Export Modal
├── Delete Confirmation
└── Commission Dialog
```

**Problems:**
- ❌ Too many responsibilities in one component
- ❌ Hard to understand and navigate
- ❌ Difficult to test
- ❌ High re-render cost
- ❌ Hard to reuse parts

---

## 🏗️ Proposed Architecture

### New Folder Structure

```
components/
├── transactions/
│   ├── transaction-history.tsx              (150 lines) - Main orchestrator
│   ├── transaction-stats-cards.tsx          (100 lines) - Statistics display
│   ├── transaction-filters.tsx              (150 lines) - Search & filters
│   ├── transaction-table.tsx                (200 lines) - Table display
│   ├── transaction-detail-modal.tsx         (150 lines) - Detail view
│   ├── transaction-edit-modal.tsx           (250 lines) - Edit functionality
│   ├── transaction-export-modal.tsx         (100 lines) - Export dialog
│   ├── transaction-delete-dialog.tsx        (80 lines)  - Delete confirmation
│   ├── transaction-commission-dialog.tsx    (150 lines) - Commission management
│   └── types.ts                             (50 lines)  - Shared types
│
└── hooks/
    └── use-transactions.ts                  (Already exists ✅)
```

### Component Breakdown

#### 1. **transaction-history.tsx** (Main Orchestrator)
**Responsibility:** Koordinasi antar komponen, state management utama

**Props:** None (root component)

**State:**
- `selectedTransaction` - Currently selected transaction
- `showDetailModal` - Detail modal visibility
- `showEditModal` - Edit modal visibility
- `showExportModal` - Export modal visibility
- `showDeleteDialog` - Delete dialog visibility
- `showCommissionDialog` - Commission dialog visibility

**Hooks Used:**
- `useTransactions()` - Data fetching
- `useBranches()` - Branch data
- `useEmployees()` - Employee data
- `useServices()` - Service data

**Children:**
```tsx
<TransactionStatsCards />
<TransactionFilters />
<TransactionTable />
<TransactionDetailModal />
<TransactionEditModal />
<TransactionExportModal />
<TransactionDeleteDialog />
<TransactionCommissionDialog />
```

**Size:** ~150 lines

---

#### 2. **transaction-stats-cards.tsx**
**Responsibility:** Display statistics (total revenue, transactions, etc)

**Props:**
```typescript
interface TransactionStatsCardsProps {
  transactions: Transaction[]
  loading: boolean
}
```

**Features:**
- Total revenue calculation
- Total transactions count
- Completed transactions count
- Average transaction value
- Responsive grid layout

**Size:** ~100 lines

---

#### 3. **transaction-filters.tsx**
**Responsibility:** Search, filter, and date range selection

**Props:**
```typescript
interface TransactionFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  
  filterBranch: string
  onBranchChange: (value: string) => void
  branches: Branch[]
  
  filterStatus: string
  onStatusChange: (value: string) => void
  statuses: string[]
  
  dateFilter: string
  onDateFilterChange: (value: string) => void
  
  customStartDate: string
  customEndDate: string
  onCustomDateChange: (start: string, end: string) => void
  
  onRefresh: () => void
  onExport: () => void
  loading: boolean
}
```

**Features:**
- Search input
- Branch filter dropdown
- Status filter dropdown
- Date range selector (today, this week, this month, custom)
- Refresh button
- Export button

**Size:** ~150 lines

---

#### 4. **transaction-table.tsx**
**Responsibility:** Display transactions in table format

**Props:**
```typescript
interface TransactionTableProps {
  transactions: Transaction[]
  loading: boolean
  onViewDetail: (transaction: Transaction) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}
```

**Features:**
- Responsive table
- Transaction number, date, time
- Customer info
- Server/cashier info
- Branch info
- Payment method & status badges
- Total amount
- Action buttons (view, edit, delete)
- Loading skeleton
- Empty state

**Size:** ~200 lines

---

#### 5. **transaction-detail-modal.tsx**
**Responsibility:** Show detailed transaction information

**Props:**
```typescript
interface TransactionDetailModalProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Features:**
- Transaction header (number, date, time)
- Customer information
- Branch & server info
- Items list with commission info
- Payment details
- Subtotal, discount, total
- Notes section
- Print button (future)

**Size:** ~150 lines

---

#### 6. **transaction-edit-modal.tsx**
**Responsibility:** Edit transaction details

**Props:**
```typescript
interface TransactionEditModalProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: EditTransactionData) => Promise<void>
  services: Service[]
  employees: Employee[]
}
```

**Features:**
- Edit customer name
- Edit payment method
- Edit payment status
- Edit notes
- Edit discount
- Edit items (quantity, price)
- Add/remove items
- Service selection
- Barber assignment
- Commission management per item
- Save/cancel buttons
- Loading state

**Size:** ~250 lines

---

#### 7. **transaction-export-modal.tsx**
**Responsibility:** Export transactions to PDF/Excel

**Props:**
```typescript
interface TransactionExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (options: ExportOptions) => Promise<void>
  branches: Branch[]
}
```

**Features:**
- Date range selection
- Branch filter
- Format selection (PDF/Excel)
- Export button
- Loading state

**Size:** ~100 lines

---

#### 8. **transaction-delete-dialog.tsx**
**Responsibility:** Confirm transaction deletion

**Props:**
```typescript
interface TransactionDeleteDialogProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Features:**
- Warning message
- Transaction info display
- Confirm/cancel buttons
- Loading state

**Size:** ~80 lines

---

#### 9. **transaction-commission-dialog.tsx**
**Responsibility:** Manage commission for transaction items

**Props:**
```typescript
interface TransactionCommissionDialogProps {
  item: TransactionItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (type: 'percentage' | 'fixed', value: number) => Promise<void>
  employees: Employee[]
}
```

**Features:**
- Commission type selector (percentage/fixed)
- Commission value input
- Barber selector
- Preview calculation
- Save/cancel buttons
- Loading state

**Size:** ~150 lines

---

#### 10. **types.ts**
**Responsibility:** Shared TypeScript types

**Exports:**
```typescript
export interface Transaction { ... }
export interface TransactionItem { ... }
export interface EditTransactionData { ... }
export interface ExportOptions { ... }
export interface TransactionFilters { ... }
```

**Size:** ~50 lines

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ transaction-history.tsx (Main Orchestrator)             │
│                                                          │
│ - useTransactions() hook                                │
│ - useBranches() hook                                    │
│ - useEmployees() hook                                   │
│ - useServices() hook                                    │
│ - Modal state management                                │
└────────────┬────────────────────────────────────────────┘
             │
             ├─► TransactionStatsCards
             │   └─ Props: { transactions, loading }
             │
             ├─► TransactionFilters
             │   └─ Props: { filters, onChange handlers }
             │
             ├─► TransactionTable
             │   └─ Props: { transactions, action handlers }
             │       └─ Emits: onViewDetail, onEdit, onDelete
             │
             ├─► TransactionDetailModal
             │   └─ Props: { transaction, open, onOpenChange }
             │
             ├─► TransactionEditModal
             │   └─ Props: { transaction, open, onSave }
             │       └─ Emits: onSave(editData)
             │
             ├─► TransactionExportModal
             │   └─ Props: { open, onExport }
             │       └─ Emits: onExport(options)
             │
             ├─► TransactionDeleteDialog
             │   └─ Props: { transaction, open, onConfirm }
             │       └─ Emits: onConfirm()
             │
             └─► TransactionCommissionDialog
                 └─ Props: { item, open, onSave }
                     └─ Emits: onSave(type, value)
```

---

## 🎨 Component Interaction Patterns

### Pattern 1: Modal Management
```typescript
// Main component manages modal state
const [showDetailModal, setShowDetailModal] = useState(false)
const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

// Pass to child components
<TransactionTable 
  onViewDetail={(tx) => {
    setSelectedTransaction(tx)
    setShowDetailModal(true)
  }}
/>

<TransactionDetailModal
  transaction={selectedTransaction}
  open={showDetailModal}
  onOpenChange={setShowDetailModal}
/>
```

### Pattern 2: Filter State Management
```typescript
// Main component manages filter state
const [filters, setFilters] = useState<TransactionFilters>({
  searchTerm: "",
  branch: "all",
  status: "all",
  dateFilter: "this_month"
})

// Pass to filter component
<TransactionFilters
  {...filters}
  onSearchChange={(value) => setFilters(prev => ({ ...prev, searchTerm: value }))}
  onBranchChange={(value) => setFilters(prev => ({ ...prev, branch: value }))}
  // ... other handlers
/>

// Use in data fetching
const { transactions } = useTransactions({
  branchId: filters.branch !== "all" ? filters.branch : undefined,
  // ... other filter options
})
```

### Pattern 3: Action Handlers
```typescript
// Main component defines action handlers
const handleDelete = async (transaction: Transaction) => {
  setTransactionToDelete(transaction)
  setShowDeleteDialog(true)
}

const handleConfirmDelete = async () => {
  if (!transactionToDelete) return
  
  try {
    await deleteTransaction(transactionToDelete.id)
    toast({ title: "Success", description: "Transaction deleted" })
    refetch()
  } catch (error) {
    toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
  } finally {
    setShowDeleteDialog(false)
    setTransactionToDelete(null)
  }
}

// Pass to child components
<TransactionTable onDelete={handleDelete} />
<TransactionDeleteDialog onConfirm={handleConfirmDelete} />
```

---

## 📦 Shared Utilities

### Helper Functions (to be extracted)
```typescript
// utils/transaction-helpers.ts

export const getStatusColor = (status: string): string => {
  // ... implementation
}

export const getPaymentMethodColor = (method: string): string => {
  // ... implementation
}

export const formatPaymentMethod = (method: string): string => {
  // ... implementation
}

export const formatStatus = (status: string): string => {
  // ... implementation
}

export const formatTime = (dateString: string): string => {
  // ... implementation
}

export const calculateTotalRevenue = (transactions: Transaction[]): number => {
  // ... implementation
}

export const getDateRange = (filter: string, customStart?: string, customEnd?: string) => {
  // ... implementation
}
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Each component gets its own test file
transaction-stats-cards.test.tsx
transaction-filters.test.tsx
transaction-table.test.tsx
transaction-detail-modal.test.tsx
// ... etc
```

### Integration Tests
```typescript
// Test main orchestrator with mocked children
transaction-history.integration.test.tsx
```

### Test Coverage Goals
- Unit tests: 80%+ coverage
- Integration tests: Key user flows
- E2E tests: Critical paths (view, edit, delete)

---

## 🚀 Migration Strategy

### Phase 1: Extract Types & Utilities
1. Create `types.ts` with all interfaces
2. Create `transaction-helpers.ts` with utility functions
3. Update main component to use extracted utilities

### Phase 2: Extract Simple Components
1. Create `transaction-stats-cards.tsx`
2. Create `transaction-delete-dialog.tsx`
3. Create `transaction-export-modal.tsx`
4. Test each component individually

### Phase 3: Extract Complex Components
1. Create `transaction-filters.tsx`
2. Create `transaction-table.tsx`
3. Create `transaction-detail-modal.tsx`
4. Test integration

### Phase 4: Extract Edit & Commission
1. Create `transaction-edit-modal.tsx`
2. Create `transaction-commission-dialog.tsx`
3. Test complex interactions

### Phase 5: Refactor Main Component
1. Update `transaction-history.tsx` to use all new components
2. Remove old code
3. Test full integration
4. Verify all features work

### Phase 6: Documentation & Cleanup
1. Update component documentation
2. Add usage examples
3. Clean up unused code
4. Update tests

---

## ✅ Success Criteria

### Code Quality
- ✅ No component exceeds 250 lines
- ✅ Each component has single responsibility
- ✅ All components are properly typed
- ✅ No duplicate code

### Functionality
- ✅ All existing features work
- ✅ No regressions
- ✅ Performance maintained or improved
- ✅ Real-time updates still work

### Developer Experience
- ✅ Easy to understand component structure
- ✅ Easy to find and modify code
- ✅ Easy to add new features
- ✅ Well documented

### Testing
- ✅ 80%+ test coverage
- ✅ All critical paths tested
- ✅ No breaking changes

---

## 📊 Expected Impact

### Before Refactoring
```
transaction-history.tsx
├── 1749 lines
├── 50+ useState
├── 5 useEffect
├── 10+ responsibilities
└── Hard to maintain
```

### After Refactoring
```
components/transactions/
├── 10 focused components
├── Average 130 lines per component
├── Single responsibility each
├── Easy to test
├── Easy to maintain
└── Reusable parts
```

### Metrics
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines per component | 1749 | ~130 avg | **92% reduction** |
| Responsibilities | 10+ | 1 each | **Clear separation** |
| Testability | Hard | Easy | **Significant** |
| Maintainability | Low | High | **Significant** |
| Reusability | None | High | **New capability** |

---

## 🔗 Dependencies

### Existing Dependencies (Keep)
- Custom hooks from `hooks/` ✅
- UI components from `components/ui/` ✅
- Supabase client from `lib/supabase.ts` ✅
- Toast notifications ✅

### New Dependencies (None)
- No new external libraries needed
- Pure refactoring of existing code

---

## 📝 Notes

### Design Decisions

1. **Why separate modals?**
   - Each modal has distinct functionality
   - Easier to test in isolation
   - Can be reused in other features

2. **Why keep main component as orchestrator?**
   - Centralized state management
   - Clear data flow
   - Easy to understand component hierarchy

3. **Why extract utilities?**
   - Reusable across components
   - Easy to test
   - Consistent formatting

4. **Why not use state management library yet?**
   - Current scope is manageable with props
   - Will add Zustand in FASE 4 if needed
   - Keep changes incremental

### Future Enhancements

1. **FASE 3:** Add API routes for server-side operations
2. **FASE 4:** Add Zustand for global state if needed
3. **FASE 5:** Add Zod validation schemas
4. **FASE 6:** Add comprehensive tests

---

## 🎯 Next Steps

1. ✅ Review and approve this design
2. 📝 Create implementation tasks
3. 🔨 Start implementation (Phase 1)
4. 🧪 Test each component
5. 🚀 Deploy and monitor

---

**Status:** 🎨 Design Complete - Ready for Task Creation  
**Estimated Effort:** 2-3 days  
**Risk Level:** Low (pure refactoring, no new features)
