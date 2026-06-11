# POS System Components

Komponen-komponen untuk sistem Point of Sale yang telah di-refactor mengikuti prinsip Clean Architecture.

## 📁 Struktur Folder

```
components/pos/
├── types.ts                          # Type definitions
├── pos-service-grid.tsx              # Service/product selection
├── pos-cart-item.tsx                 # Individual cart item
├── pos-cart.tsx                      # Shopping cart
├── pos-customer-input.tsx            # Customer information
├── pos-barber-selector.tsx           # Barber selection
├── pos-discount-form.tsx             # Discount management
├── pos-payment-form.tsx              # Payment input
├── pos-checkout-modal.tsx            # Checkout process
├── pos-receipt-modal.tsx             # Receipt display
├── index.ts                          # Barrel export
└── README.md                         # This file

lib/utils/
├── pos-helpers.ts                    # POS utility functions
└── receipt-helpers.ts                # Receipt generation

lib/hooks/
└── use-pos-data.ts                   # Custom data hook
```

## 🎯 Arsitektur

### Prinsip Clean Architecture
Komponen ini mengikuti prinsip:
- **Separation of Concerns:** Setiap komponen punya tanggung jawab tunggal
- **Single Responsibility:** Satu komponen = satu fungsi
- **Reusability:** Komponen dapat digunakan ulang
- **Type Safety:** Full TypeScript dengan proper types

### Component Hierarchy
```
POSSystem (Orchestrator)
├── POSServiceGrid (Display)
│   └── Service Cards
├── POSCart (Display + Actions)
│   └── POSCartItem (multiple)
├── POSCheckoutModal (Input + Actions)
│   ├── POSCustomerInput
│   ├── POSBarberSelector
│   ├── POSDiscountForm
│   └── POSPaymentForm
└── POSReceiptModal (Display + Actions)
```

## 📦 Komponen

### 1. POSServiceGrid
**File:** `pos-service-grid.tsx` (300 lines)

**Fungsi:** Menampilkan layanan dan produk dalam grid dengan filtering

**Props:**
```typescript
{
  services: ServiceWithCategory[]
  categories: ServiceCategory[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedType: ServiceType
  onTypeChange: (type: ServiceType) => void
  onAddToCart: (service: ServiceWithCategory) => void
  outletStock: OutletStock[]
  currentBranchId: string | null
  loading?: boolean
}
```

**Features:**
- Type filter (All, Services, Products)
- Category filter tabs
- Service/product cards dengan icon
- Stock indicator untuk products
- Add to cart functionality
- Loading skeleton state
- Empty state
- Responsive grid (2-4 columns)

**Usage:**
```tsx
import { POSServiceGrid } from '@/components/pos'

<POSServiceGrid
  services={services}
  categories={categories}
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
  selectedType={selectedType}
  onTypeChange={setSelectedType}
  onAddToCart={handleAddToCart}
  outletStock={outletStock}
  currentBranchId={currentBranchId}
  loading={loading}
/>
```

---

### 2. POSCart
**File:** `pos-cart.tsx` (150 lines)

**Fungsi:** Menampilkan shopping cart dengan items dan totals

**Props:**
```typescript
{
  cart: CartItem[]
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  subtotal: number
  discount: number
  total: number
  onCheckout: () => void
  isCheckoutDisabled?: boolean
}
```

**Features:**
- Cart items list
- Quantity controls per item
- Remove item button
- Clear cart button
- Subtotal/discount/total display
- Checkout button
- Empty cart state
- Item count badge

**Usage:**
```tsx
import { POSCart } from '@/components/pos'

<POSCart
  cart={cart}
  onUpdateQuantity={handleUpdateQuantity}
  onRemoveItem={handleRemoveItem}
  onClearCart={handleClearCart}
  subtotal={subtotal}
  discount={discountAmount}
  total={total}
  onCheckout={() => setIsCheckoutOpen(true)}
  isCheckoutDisabled={cart.length === 0}
/>
```

---

### 3. POSCartItem
**File:** `pos-cart-item.tsx` (80 lines)

**Fungsi:** Individual cart item display

**Props:**
```typescript
{
  item: CartItem
  index: number
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}
```

**Features:**
- Service/product name dan price
- Quantity controls (+/-)
- Remove button
- Total price calculation
- Responsive layout

---

### 4. POSCustomerInput
**File:** `pos-customer-input.tsx` (70 lines)

**Fungsi:** Input informasi customer

**Props:**
```typescript
{
  customerName: string
  onCustomerNameChange: (value: string) => void
  selectedBranch: string
  onBranchChange: (value: string) => void
  branches: Branch[]
  branchesLoading?: boolean
}
```

**Features:**
- Customer name input
- Branch selector
- Icons untuk visual clarity
- Loading state

---

### 5. POSBarberSelector
**File:** `pos-barber-selector.tsx` (80 lines)

**Fungsi:** Select barber/server untuk service

**Props:**
```typescript
{
  value: string
  onChange: (value: string) => void
  employees: Employee[]
  required?: boolean
  loading?: boolean
}
```

**Features:**
- Employee dropdown
- Filter by position (barber)
- Optional/required indicator
- Loading state

---

### 6. POSDiscountForm
**File:** `pos-discount-form.tsx` (150 lines)

**Fungsi:** Manage discount

**Props:**
```typescript
{
  discount: DiscountInfo
  onDiscountChange: (discount: DiscountInfo) => void
  subtotal: number
}
```

**Features:**
- Discount type selector (percentage/fixed)
- Discount value input
- Discount reason input
- Preview calculation
- Clear discount button
- Validation

---

### 7. POSPaymentForm
**File:** `pos-payment-form.tsx` (180 lines)

**Fungsi:** Payment method dan amount input

**Props:**
```typescript
{
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  total: number
  cashAmount: string
  onCashAmountChange: (amount: string) => void
  change: number
}
```

**Features:**
- Payment method selector (cash, QRIS, transfer, debit)
- Cash amount input (for cash payment)
- Change calculation display
- Quick amount buttons (50k, 100k, 200k)
- Validation
- Non-cash payment info

---

### 8. POSCheckoutModal
**File:** `pos-checkout-modal.tsx` (200 lines)

**Fungsi:** Checkout process orchestrator

**Props:**
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  branches: Branch[]
  employees: Employee[]
  onConfirm: (data: CheckoutData) => Promise<void>
  loading?: boolean
}
```

**Features:**
- Customer input section
- Barber selector section
- Discount form section
- Payment form section
- Summary display
- Confirm/Cancel buttons
- Loading state
- Validation

---

### 9. POSReceiptModal
**File:** `pos-receipt-modal.tsx` (180 lines)

**Fungsi:** Display receipt dengan print functionality

**Props:**
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptData: ReceiptData | null
  bluetoothDevice: BluetoothDevice | null
  bluetoothConnected: boolean
  onOpenBluetoothSettings: () => void
}
```

**Features:**
- Receipt preview
- Transaction details
- Items list
- Payment information
- Print button (browser)
- Bluetooth print button
- Success message

---

## 📝 Types

### Core Types
Semua types didefinisikan di `types.ts`:

```typescript
// Cart
interface CartItem {
  service: ServiceWithCategory
  quantity: number
}

// Payment
type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'debit'

// Discount
type DiscountType = 'percentage' | 'fixed'
interface DiscountInfo {
  type: DiscountType
  value: string
  reason: string
}

// Transaction
interface POSTransaction {
  id: string
  transaction_number: string
  customer_name: string
  payment_method: PaymentMethod
  total_amount: number
  discount_amount: number
  // ... other fields
}

// Receipt
interface ReceiptData {
  transaction: POSTransaction
  items: CartItem[]
  template: ReceiptTemplateWithBranch | null
  branch: Branch | null
  subtotal: number
  discount: number
  total: number
}
```

Lihat `types.ts` untuk definisi lengkap.

---

## 🔧 Helper Functions

### POS Helpers (`lib/utils/pos-helpers.ts`)

**Formatting Functions:**
- `formatRupiah(value)` - Format ke IDR
- `parseNominal(value)` - Parse formatted string
- `formatCurrency(amount)` - Format dengan Rp prefix
- `formatTransactionNumber(number)` - Format transaction #
- `formatPaymentMethod(method)` - Format payment method

**Calculation Functions:**
- `calculateSubtotal(cart)` - Calculate cart subtotal
- `calculateDiscount(subtotal, discount)` - Calculate discount
- `calculateTotal(subtotal, discount)` - Calculate final total
- `calculateChange(total, paid)` - Calculate change
- `calculatePrices(cart, discount)` - Calculate all at once

**Validation Functions:**
- `validateCart(cart)` - Validate cart has items
- `validatePayment(total, paid, method)` - Validate payment
- `validateDiscount(discount, subtotal)` - Validate discount
- `validateCustomerName(name)` - Validate customer name
- `validateBranch(branchId)` - Validate branch

**Stock Functions:**
- `checkStockAvailability(item, stock)` - Check product stock
- `calculateRemainingStock(item, stock)` - Calculate remaining
- `validateCartStock(cart, stock)` - Validate all items

**Cart Helpers:**
- `findCartItemIndex(cart, serviceId)` - Find item index
- `isServiceInCart(cart, serviceId)` - Check if in cart
- `getCartItemsCount(cart)` - Get total items count
- `getQuickAmounts(total)` - Get quick amount suggestions

### Receipt Helpers (`lib/utils/receipt-helpers.ts`)

**Receipt Generation:**
- `generateReceiptHTML(data)` - Generate HTML receipt
- `generateReceiptText(data)` - Generate text receipt

**Printing:**
- `printReceipt(data)` - Print via browser
- `printViaBluetooth(data, device)` - Print via Bluetooth

**Bluetooth:**
- `isBluetoothSupported()` - Check browser support
- `requestBluetoothDevice()` - Request device
- `connectBluetoothDevice(device)` - Connect to device
- `disconnectBluetoothDevice(device)` - Disconnect device

---

## 🪝 Custom Hook

### usePOSData (`lib/hooks/use-pos-data.ts`)

**Purpose:** Fetch dan manage POS data dengan real-time updates

**Returns:**
```typescript
{
  // Data
  services: ServiceWithCategory[]
  categories: ServiceCategory[]
  branches: Branch[]
  employees: Employee[]
  receiptTemplate: ReceiptTemplateWithBranch | null
  outletStock: OutletStock[]
  currentUser: Employee | null
  
  // Loading states
  loading: boolean
  stockLoading: boolean
  
  // Error state
  error: string | null
  
  // Actions
  refetch: () => Promise<void>
  loadOutletStock: (branchId: string) => Promise<void>
  setCurrentUser: (user: Employee | null) => void
}
```

**Features:**
- Fetch all required POS data on mount
- Real-time updates via Supabase subscriptions
- Auto-refresh every 30 seconds
- Stock management per branch
- Error handling

**Usage:**
```tsx
import { usePOSData } from '@/lib/hooks/use-pos-data'

function MyComponent() {
  const {
    services,
    categories,
    branches,
    employees,
    loading,
    error,
    refetch
  } = usePOSData()
  
  // Use the data...
}
```

---

## 🎨 Styling

### Responsive Design
Semua komponen responsive dengan breakpoints:
- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md)
- **Desktop:** > 1024px (lg)

### Color Scheme
- **Primary:** Blue (actions, totals)
- **Success:** Green (completed, discount)
- **Warning:** Yellow (low stock)
- **Danger:** Red (out of stock, delete)
- **Neutral:** Gray (default)

---

## 🔄 Data Flow

### 1. Data Fetching
```
usePOSData Hook
  ↓
Fetch from Supabase
  ↓
Real-time subscriptions
  ↓
Auto-refresh every 30s
  ↓
Pass to components
```

### 2. Cart Management
```
User clicks service
  ↓
Check stock (if product)
  ↓
Add to cart
  ↓
Update cart state
  ↓
Show toast notification
```

### 3. Checkout Flow
```
User clicks checkout
  ↓
Open checkout modal
  ↓
Fill customer info
  ↓
Select payment method
  ↓
Apply discount (optional)
  ↓
Confirm payment
  ↓
Create transaction
  ↓
Reduce stock (products)
  ↓
Broadcast event
  ↓
Show receipt
  ↓
Clear cart
```

### 4. Real-time Updates
```
Database change (any client)
  ↓
Supabase Realtime
  ↓
usePOSData hook
  ↓
Update state
  ↓
UI updates automatically
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] View services/products grid
- [ ] Filter by category
- [ ] Filter by type (service/product)
- [ ] Add item to cart
- [ ] Update item quantity
- [ ] Remove item from cart
- [ ] Clear cart
- [ ] Check stock indicator (products)
- [ ] Open checkout modal
- [ ] Fill customer information
- [ ] Select barber
- [ ] Apply discount (percentage)
- [ ] Apply discount (fixed)
- [ ] Select payment method (cash)
- [ ] Enter cash amount
- [ ] Check change calculation
- [ ] Select payment method (non-cash)
- [ ] Confirm checkout
- [ ] View receipt
- [ ] Print receipt (browser)
- [ ] Connect Bluetooth printer
- [ ] Print via Bluetooth
- [ ] Real-time updates work
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty states display correctly

### Test Scenarios
1. **Add to Cart** → Check if item appears in cart
2. **Stock Check** → Try adding product beyond stock
3. **Discount** → Apply discount and verify calculation
4. **Payment** → Complete transaction with different methods
5. **Receipt** → Verify receipt shows correct information
6. **Real-time** → Open 2 tabs, create transaction in one, check other
7. **Bluetooth** → Connect printer and print receipt

---

## 🐛 Troubleshooting

### Issue: Services not loading
**Solution:**
1. Check Supabase connection
2. Check RLS policies
3. Check browser console for errors
4. Verify `usePOSData` hook is working

### Issue: Stock not updating
**Solution:**
1. Check `loadOutletStock` is called when branch changes
2. Verify outlet_stock table has data
3. Check RLS policies allow read
4. Verify branch_id is correct

### Issue: Checkout fails
**Solution:**
1. Check all required fields are filled
2. Verify payment validation passes
3. Check browser console for errors
4. Verify Supabase functions work

### Issue: Bluetooth not working
**Solution:**
1. Check browser supports Bluetooth (Chrome/Edge)
2. Verify Bluetooth is enabled on device
3. Check printer is in pairing mode
4. Try disconnecting and reconnecting

### Issue: Receipt not printing
**Solution:**
1. Check browser allows pop-ups
2. Verify printer is connected (for Bluetooth)
3. Check receipt data is complete
4. Try browser print first before Bluetooth

---

## 📚 Related Documentation

- [Main Component](../pos-system-refactored.tsx)
- [POS Helpers](../../lib/utils/pos-helpers.ts)
- [Receipt Helpers](../../lib/utils/receipt-helpers.ts)
- [Custom Hook](../../lib/hooks/use-pos-data.ts)
- [Types Definition](./types.ts)
- [FASE 3 Progress](../../FASE_3_PROGRESS.md)
- [Clean Architecture Guide](../../CLEAN_ARCHITECTURE.md)

---

## 🎯 Future Improvements

### Short Term
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add keyboard shortcuts
- [ ] Add barcode scanner support
- [ ] Improve mobile UX

### Medium Term
- [ ] Add transaction history in POS
- [ ] Add customer search/autocomplete
- [ ] Add product quick search
- [ ] Add sales analytics
- [ ] Add shift management

### Long Term
- [ ] Add offline mode
- [ ] Add multi-currency support
- [ ] Add loyalty program integration
- [ ] Add inventory alerts
- [ ] Add AI-powered recommendations

---

**Created:** May 26, 2026  
**Last Updated:** May 26, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
