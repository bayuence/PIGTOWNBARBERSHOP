# Testing Checklist - PIGTOWN BARBERSHOP

## Date: May 20, 2026
## Status: Ready for Testing

---

## ✅ Pre-Testing Verification

- [x] All column names fixed (67 occurrences across 7 files)
- [x] Database schema matches actual Supabase structure
- [x] No more `total_amount`, `discount_amount`, `final_amount` references
- [x] All `isActive` → `aktif`/`status` mappings correct
- [x] TypeScript interfaces updated
- [x] Drizzle ORM queries fixed

---

## 🧪 Critical Path Testing

### 1. POS System (HIGHEST PRIORITY)
**File:** `components/pos-system.tsx`

#### Test Case 1.1: Create Simple Transaction
- [ ] Login as cashier
- [ ] Navigate to POS
- [ ] Select a service (e.g., "Haircut")
- [ ] Select customer
- [ ] Complete payment (Cash)
- [ ] **Expected:** Transaction saved successfully
- [ ] **Verify:** Check transaction in database has `subtotal`, `discount`, `total` columns

#### Test Case 1.2: Transaction with Discount
- [ ] Add service to cart
- [ ] Apply percentage discount (e.g., 10%)
- [ ] Complete payment
- [ ] **Expected:** Discount calculated correctly
- [ ] **Verify:** `discount` column has correct value

#### Test Case 1.3: Multiple Services
- [ ] Add 3 different services
- [ ] Apply fixed discount (e.g., Rp 10,000)
- [ ] Complete payment with QRIS
- [ ] **Expected:** All items saved with correct totals
- [ ] **Verify:** `subtotal` = sum of items, `total` = subtotal - discount

---

### 2. Transaction History
**File:** `components/transaction-history.tsx`

#### Test Case 2.1: View Transactions
- [ ] Navigate to Transaction History
- [ ] **Expected:** All transactions display correctly
- [ ] **Verify:** No "column not found" errors
- [ ] **Verify:** Amounts display correctly

#### Test Case 2.2: Filter Transactions
- [ ] Filter by date (Today)
- [ ] Filter by branch
- [ ] Filter by status
- [ ] **Expected:** Filters work without errors

#### Test Case 2.3: Transaction Details
- [ ] Click on a transaction to view details
- [ ] **Expected:** All fields display correctly
- [ ] **Verify:** Subtotal, discount, total all visible

---

### 3. Dashboard & Analytics
**File:** `components/overviewdananalytic.tsx`

#### Test Case 3.1: Dashboard Overview
- [ ] Navigate to Dashboard
- [ ] **Expected:** All stats cards load
- [ ] **Verify:** Total Revenue displays correctly
- [ ] **Verify:** Total Expenses displays correctly
- [ ] **Verify:** Net Profit calculated correctly

#### Test Case 3.2: Revenue Charts
- [ ] Check 7-day revenue trend chart
- [ ] **Expected:** Chart displays without errors
- [ ] **Verify:** Data points are accurate

#### Test Case 3.3: Branch Performance
- [ ] Check branch performance section
- [ ] **Expected:** All branches show correct revenue
- [ ] **Verify:** No database query errors

---

### 4. Reports
**File:** `components/comprehensive-reports.tsx`

#### Test Case 4.1: Financial Reports
- [ ] Navigate to Reports
- [ ] Select date range (This Month)
- [ ] **Expected:** All financial data loads
- [ ] **Verify:** Revenue, expenses, profit all correct

#### Test Case 4.2: Branch Reports
- [ ] Filter by specific branch
- [ ] **Expected:** Branch-specific data displays
- [ ] **Verify:** Calculations are accurate

#### Test Case 4.3: Employee Performance
- [ ] Check employee performance section
- [ ] **Expected:** All employees listed with stats
- [ ] **Verify:** Revenue per employee correct

---

### 5. Branch Management
**File:** `components/branch-management.tsx`

#### Test Case 5.1: View Branch Stats
- [ ] Navigate to Branch Management
- [ ] **Expected:** All branches display with stats
- [ ] **Verify:** Revenue calculations correct

#### Test Case 5.2: Branch Details
- [ ] Click on a branch
- [ ] **Expected:** Branch details load
- [ ] **Verify:** Transaction count and revenue match

---

## 🔍 Database Verification

### Check Transaction Data
```sql
-- Run in Supabase SQL Editor
SELECT 
  transaction_number,
  subtotal,
  discount,
  total,
  payment_method,
  payment_status,
  created_at
FROM transactions
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** All columns exist and have data

### Check Transaction Items
```sql
SELECT 
  ti.id,
  ti.service_name,
  ti.quantity,
  ti.price,
  ti.subtotal,
  ti.commission_amount,
  t.transaction_number
FROM transaction_items ti
JOIN transactions t ON t.id = ti.transaction_id
ORDER BY ti.created_at DESC
LIMIT 10;
```

**Expected:** All items have correct prices and subtotals

---

## 🐛 Known Issues to Watch For

### Issue 1: Column Not Found Errors
**Symptom:** "Could not find the 'total_amount' column"
**Status:** ✅ FIXED
**Verification:** Search codebase for `total_amount` - should return 0 results

### Issue 2: Undefined Values
**Symptom:** Transaction amounts showing as `undefined` or `NaN`
**Status:** ✅ FIXED
**Verification:** All components now use correct column names

### Issue 3: Filter Not Working
**Symptom:** Filters don't apply or cause errors
**Status:** ✅ FIXED
**Verification:** All queries use correct column names

---

## 📊 Performance Testing

### Test 1: Large Transaction List
- [ ] Create 50+ transactions
- [ ] Navigate to Transaction History
- [ ] **Expected:** Page loads within 3 seconds
- [ ] **Verify:** No performance degradation

### Test 2: Real-time Updates
- [ ] Open POS in one tab
- [ ] Open Dashboard in another tab
- [ ] Create transaction in POS
- [ ] **Expected:** Dashboard updates automatically
- [ ] **Verify:** Real-time sync works

---

## 🔐 Security Testing

### Test 1: Authentication
- [ ] Login with owner credentials
- [ ] **Expected:** Access to all features
- [ ] Logout and login as cashier
- [ ] **Expected:** Limited access (no owner features)

### Test 2: Data Isolation
- [ ] Login as branch A cashier
- [ ] **Expected:** Only see branch A data
- [ ] **Verify:** Cannot access other branch data

---

## 📱 Responsive Testing

### Desktop (1920x1080)
- [ ] All pages display correctly
- [ ] Charts render properly
- [ ] Tables are readable

### Tablet (768x1024)
- [ ] Navigation works
- [ ] Forms are usable
- [ ] Charts adapt to screen size

### Mobile (375x667)
- [ ] Mobile menu works
- [ ] POS system usable
- [ ] Transaction list scrollable

---

## ✅ Sign-off Checklist

- [ ] All critical path tests passed
- [ ] No console errors
- [ ] No database query errors
- [ ] Real-time updates working
- [ ] All reports accurate
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Responsive design works

---

## 🚀 Deployment Checklist

- [ ] All tests passed
- [ ] Environment variables set in Vercel
- [ ] Database connection verified
- [ ] Google Search Console verified
- [ ] SSL certificate active
- [ ] Domain configured
- [ ] Backup strategy in place

---

## 📝 Notes

### Database Credentials
- **URL:** (stored in .env)
- **Password:** `@15Mei2004354` (URL-encoded: `%4015Mei2004354`)

### Login Credentials
- **Owner:** `owner@pigtownbarbershop.com` / `pemilik123`
- **Cashier:** (create via Branch Management)

### Support Contacts
- **Developer:** [Your contact]
- **Database:** Supabase Support
- **Hosting:** Vercel Support

---

## 🎯 Success Criteria

✅ **Project is ready for production when:**
1. All critical path tests pass
2. No database errors in console
3. All reports show accurate data
4. Real-time updates work consistently
5. Performance is acceptable (< 3s page load)
6. Security tests pass
7. Responsive design works on all devices

---

**Last Updated:** May 20, 2026
**Tested By:** [Pending]
**Status:** Ready for Testing
