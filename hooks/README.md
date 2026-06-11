# Custom Hooks Documentation

## 📚 Overview

Folder ini berisi custom React hooks yang mengabstraksi logic data fetching dan state management dari komponen UI. Ini adalah bagian dari refactoring menuju clean code architecture.

## 🎯 Manfaat

- ✅ **Reusable Logic** - Logic bisa dipakai di banyak komponen
- ✅ **Easier Testing** - Hooks bisa di-test secara terpisah
- ✅ **Cleaner Components** - Komponen fokus ke UI, bukan data fetching
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Consistent API** - Semua hooks punya pattern yang sama

## 📦 Available Hooks

### Data Fetching Hooks

| Hook | Purpose | File |
|------|---------|------|
| `useTransactions` | Fetch & manage transactions | `use-transactions.ts` |
| `useServices` | Fetch & manage services/products | `use-services.ts` |
| `useEmployees` | Fetch & manage employees | `use-employees.ts` |
| `useBranches` | Fetch & manage branches | `use-branches.ts` |
| `useAttendance` | Fetch & manage attendance | `use-attendance.ts` |
| `useExpenses` | Fetch & manage expenses | `use-expenses.ts` |
| `useKasbon` | Fetch & manage kasbon | `use-kasbon.ts` |

### Utility Hooks

| Hook | Purpose | File |
|------|---------|------|
| `useAuth` | Authentication state & operations | `use-auth.ts` |
| `useRealtimeSubscription` | Supabase realtime subscriptions | `use-realtime-subscription.ts` |

## 🚀 Usage Examples

### 1. useTransactions

```tsx
import { useTransactions } from '@/hooks'

function TransactionList() {
  const { transactions, loading, error, refetch } = useTransactions({
    branchId: 'branch-123',
    limit: 100
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {transactions.map(tx => (
        <div key={tx.id}>{tx.transaction_number}</div>
      ))}
    </div>
  )
}
```

### 2. useServices

```tsx
import { useServices } from '@/hooks'

function ServiceSelector() {
  const { services, loading, error } = useServices({
    activeOnly: true  // Only fetch active services
  })

  return (
    <select>
      {services.map(service => (
        <option key={service.id} value={service.id}>
          {service.name} - Rp {service.price}
        </option>
      ))}
    </select>
  )
}
```

### 3. useAuth

```tsx
import { useAuth } from '@/hooks'

function LoginForm() {
  const { login, loading, error } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login({
      email: 'user@example.com',
      password: 'password123'
    })
    
    if (success) {
      router.push('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {error && <div className="error">{error}</div>}
      <button disabled={loading}>Login</button>
    </form>
  )
}
```

### 4. useRealtimeSubscription

```tsx
import { useRealtimeSubscription } from '@/hooks'
import { useState } from 'react'

function LiveTransactions() {
  const [transactions, setTransactions] = useState([])

  useRealtimeSubscription({
    table: 'transactions',
    event: 'INSERT',
    callback: (payload) => {
      setTransactions(prev => [payload.new, ...prev])
    }
  })

  return (
    <div>
      <h2>Live Transactions</h2>
      {transactions.map(tx => (
        <div key={tx.id}>{tx.transaction_number}</div>
      ))}
    </div>
  )
}
```

### 5. useEmployees with Filter

```tsx
import { useEmployees } from '@/hooks'

function BarberList() {
  const { employees, loading, refetch } = useEmployees({
    branchId: 'branch-123',
    role: 'barber'  // Only fetch barbers
  })

  return (
    <div>
      <h2>Available Barbers</h2>
      {employees.map(barber => (
        <div key={barber.id}>{barber.name}</div>
      ))}
    </div>
  )
}
```

## 🔧 Hook Options

### Common Options (All Data Fetching Hooks)

```typescript
interface CommonOptions {
  autoLoad?: boolean  // Auto-fetch on mount (default: true)
}
```

### Hook-Specific Options

#### useTransactions
```typescript
{
  branchId?: string
  limit?: number      // Default: 50
  autoLoad?: boolean
}
```

#### useServices
```typescript
{
  activeOnly?: boolean  // Default: true
  autoLoad?: boolean
}
```

#### useEmployees
```typescript
{
  branchId?: string
  role?: string        // Filter by role
  autoLoad?: boolean
}
```

#### useAttendance
```typescript
{
  branchId?: string
  date?: string        // Format: YYYY-MM-DD
  autoLoad?: boolean
}
```

#### useExpenses
```typescript
{
  branchId?: string
  startDate?: string
  endDate?: string
  autoLoad?: boolean
}
```

## 📊 Return Values

All data fetching hooks return the same structure:

```typescript
{
  data: T[]           // Array of data
  loading: boolean    // Loading state
  error: Error | null // Error object if any
  refetch: () => Promise<void>  // Manual refetch function
}
```

## 🎨 Best Practices

### 1. Use Hooks at Component Top Level
```tsx
// ✅ GOOD
function MyComponent() {
  const { transactions, loading } = useTransactions()
  
  return <div>...</div>
}

// ❌ BAD - Don't use hooks conditionally
function MyComponent() {
  if (someCondition) {
    const { transactions } = useTransactions()  // ❌ Error!
  }
}
```

### 2. Disable Auto-Load When Needed
```tsx
// Load data manually based on user action
const { transactions, loading, refetch } = useTransactions({
  autoLoad: false  // Don't load on mount
})

const handleSearch = () => {
  refetch()  // Load manually
}
```

### 3. Handle Loading & Error States
```tsx
const { data, loading, error } = useTransactions()

if (loading) return <Spinner />
if (error) return <ErrorMessage error={error} />
if (data.length === 0) return <EmptyState />

return <DataTable data={data} />
```

### 4. Combine Multiple Hooks
```tsx
function POSSystem() {
  const { services, loading: servicesLoading } = useServices()
  const { employees, loading: employeesLoading } = useEmployees()
  const { branches, loading: branchesLoading } = useBranches()
  
  const loading = servicesLoading || employeesLoading || branchesLoading
  
  if (loading) return <Spinner />
  
  return <POSInterface services={services} employees={employees} branches={branches} />
}
```

## 🔄 Migration Guide

### Before (Without Hooks)
```tsx
function TransactionList() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const { data, error } = await getTransactions()
        if (error) throw error
        setTransactions(data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // ... rest of component
}
```

### After (With Hooks)
```tsx
function TransactionList() {
  const { transactions, loading, error } = useTransactions()
  
  // ... rest of component (much cleaner!)
}
```

## 📝 Type Exports

All hooks export their types for better TypeScript support:

```typescript
import type { 
  UseTransactionsOptions, 
  UseTransactionsReturn 
} from '@/hooks'

// Use in your own custom hooks or utilities
function useFilteredTransactions(
  options: UseTransactionsOptions
): UseTransactionsReturn {
  // ...
}
```

## 🚧 Future Improvements

- [ ] Add pagination support
- [ ] Add caching with SWR or React Query
- [ ] Add optimistic updates
- [ ] Add mutation hooks (useCreateTransaction, useUpdateService, etc.)
- [ ] Add infinite scroll support
- [ ] Add debounced search hooks

## 📞 Support

Jika ada pertanyaan atau issue dengan hooks ini, silakan buat issue atau hubungi tim development.
