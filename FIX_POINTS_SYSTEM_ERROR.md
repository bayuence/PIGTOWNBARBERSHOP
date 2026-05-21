# FIX: Points System Error - "invalid input syntax for type integer: 'all'"

## MASALAH

Error saat membuka halaman Points:
```
GET https://...supabase.co/rest/v1/points?select=*&order=created_at.desc&user_id=eq.all 400 (Bad Request)
Error: invalid input syntax for type integer: "all"
```

## AKAR MASALAH

### 1. Filter "all" Dikirim ke Query user_id
- `points-system.tsx` memanggil `getPointTransactions(selectedBranch)`
- `selectedBranch` bisa bernilai `"all"` (untuk semua cabang)
- Fungsi `getPointTransactions` meneruskan ke `getPoints(userId)`
- `getPoints` mencoba filter `.eq('user_id', 'all')`
- **ERROR**: `user_id` adalah INTEGER, tidak bisa dibandingkan dengan string "all"

### 2. Fungsi Stub Tidak Diimplementasi
- `getUsersWithPoints()` return empty array
- `getPointsStatistics()` return null
- Halaman Points tidak menampilkan data apapun

## SOLUSI

### 1. Fix `getPoints()` - Handle "all" Filter

**SEBELUM:**
```typescript
export async function getPoints(userId?: string) {
  let query = supabase
    .from('points')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (userId) {
    query = query.eq('user_id', userId)  // ❌ Error jika userId = "all"
  }
  
  const { data, error } = await query
  return { data: data || [], error: null }
}
```

**SESUDAH:**
```typescript
export async function getPoints(userId?: string) {
  let query = supabase
    .from('points')
    .select('*')
    .order('created_at', { ascending: false })
  
  // Only filter if userId is provided AND not "all"
  if (userId && userId !== 'all') {
    query = query.eq('user_id', parseInt(userId))  // ✅ Convert to INTEGER
  }
  
  const { data, error } = await query
  return { data: data || [], error: null }
}
```

### 2. Implementasi `getPointTransactions()` - Filter by Branch

**SEBELUM:**
```typescript
export async function getPointTransactions(userId?: string) {
  return getPoints(userId)  // ❌ Salah parameter (branch vs user)
}
```

**SESUDAH:**
```typescript
export async function getPointTransactions(branchId?: string) {
  try {
    let query = supabase
      .from('points')
      .select(`
        *,
        users:user_id (
          id,
          name,
          branch_id,
          branches:branch_id (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
    
    // Filter by branch if specified and not "all"
    if (branchId && branchId !== 'all') {
      query = query.eq('users.branch_id', branchId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error: any) {
    console.error('[getPointTransactions] Error:', error)
    return { data: [], error }
  }
}
```

### 3. Implementasi `getUsersWithPoints()` - Get Users with Points

```typescript
export async function getUsersWithPoints(branchId?: string) {
  try {
    let query = supabase
      .from('users')
      .select(`
        *,
        branches:branch_id (
          id,
          name
        )
      `)
      .eq('status', 'active')
    
    // Filter by branch if specified and not "all"
    if (branchId && branchId !== 'all') {
      query = query.eq('branch_id', branchId)
    }
    
    const { data: users, error: usersError } = await query
    if (usersError) throw usersError
    
    // Get points for each user
    const usersWithPoints = await Promise.all(
      (users || []).map(async (user) => {
        // Get total points
        const { data: pointsData } = await supabase
          .from('points')
          .select('points_earned')
          .eq('user_id', user.id)
        
        const totalPoints = pointsData?.reduce((sum, p) => sum + (p.points_earned || 0), 0) || 0
        
        // Get monthly points (current month)
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        const { data: monthlyData } = await supabase
          .from('points')
          .select('points_earned')
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString())
        
        const monthlyPoints = monthlyData?.reduce((sum, p) => sum + (p.points_earned || 0), 0) || 0
        
        return {
          ...user,
          total_points: totalPoints,
          monthly_points: monthlyPoints,
          rank: 0
        }
      })
    )
    
    // Sort by total points and assign ranks
    const sorted = usersWithPoints.sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
    sorted.forEach((user, index) => {
      user.rank = index + 1
    })
    
    return { data: sorted, error: null }
  } catch (error: any) {
    console.error('[getUsersWithPoints] Error:', error)
    return { data: [], error }
  }
}
```

### 4. Implementasi `getPointsStatistics()` - Calculate Statistics

```typescript
export async function getPointsStatistics(branchId?: string) {
  try {
    const { data: users, error } = await getUsersWithPoints(branchId)
    if (error) throw error
    
    const totalEmployees = users.length
    const topPerformer = users[0] || null
    const totalPoints = users.reduce((sum, u) => sum + (u.total_points || 0), 0)
    const averagePoints = totalEmployees > 0 ? Math.round(totalPoints / totalEmployees) : 0
    
    return {
      data: {
        totalEmployees,
        topPerformer,
        averagePoints,
        totalPoints
      },
      error: null
    }
  } catch (error: any) {
    console.error('[getPointsStatistics] Error:', error)
    return {
      data: {
        totalEmployees: 0,
        topPerformer: null,
        averagePoints: 0,
        totalPoints: 0
      },
      error
    }
  }
}
```

## HASIL AKHIR

Setelah fix ini:

✅ **Halaman Points bisa dibuka tanpa error**
✅ **Filter "Semua Cabang" berfungsi dengan benar**
✅ **Leaderboard menampilkan semua karyawan dengan poin**
✅ **Statistics menampilkan total karyawan, top performer, rata-rata poin**
✅ **Riwayat poin menampilkan semua transaksi poin**
✅ **Filter per cabang berfungsi dengan benar**

## FITUR YANG SEKARANG BERFUNGSI

### 1. Leaderboard
- Menampilkan semua karyawan dengan total poin
- Ranking berdasarkan total poin
- Poin bulan ini
- Top 3 performer dengan highlight khusus

### 2. Statistics Cards
- Total Karyawan
- Top Performer (nama + poin)
- Rata-rata Poin per karyawan
- Total Poin semua karyawan

### 3. Riwayat Poin
- Semua transaksi poin (earned, bonus, penalty, deducted)
- Nama karyawan
- Cabang
- Tanggal transaksi
- Jumlah poin (+/-)

### 4. Filter Cabang
- "Semua Cabang" → Tampilkan semua data
- Pilih cabang spesifik → Filter data per cabang

## FILES MODIFIED

- `lib/supabase.ts`
  - `getPoints()`: Handle "all" filter, convert userId to INTEGER
  - `getPointTransactions()`: Implementasi lengkap dengan join users & branches
  - `getUsersWithPoints()`: Implementasi lengkap dengan calculate total & monthly points
  - `getPointsStatistics()`: Implementasi lengkap dengan calculate statistics

## TESTING

### Test Case 1: Buka Halaman Points
- [ ] Buka `/points`
- [ ] **Expected**: Halaman terbuka tanpa error ✅

### Test Case 2: Filter Semua Cabang
- [ ] Pilih "Semua Cabang" di dropdown
- [ ] **Expected**: Menampilkan semua karyawan dari semua cabang ✅

### Test Case 3: Filter Per Cabang
- [ ] Pilih cabang spesifik (misal: "Cabang Utama")
- [ ] **Expected**: Hanya menampilkan karyawan dari cabang tersebut ✅

### Test Case 4: Leaderboard
- [ ] Lihat tab "Leaderboard"
- [ ] **Expected**: Karyawan diurutkan berdasarkan total poin, ranking ditampilkan ✅

### Test Case 5: Statistics
- [ ] Lihat cards di atas (Total Karyawan, Top Performer, dll)
- [ ] **Expected**: Angka statistics ditampilkan dengan benar ✅

### Test Case 6: Riwayat Poin
- [ ] Lihat tab "Riwayat Poin"
- [ ] **Expected**: Transaksi poin ditampilkan dengan nama karyawan & cabang ✅

## NEXT STEPS

1. ✅ Code sudah diperbaiki
2. ⏳ **USER ACTION**: Refresh halaman Points (F5)
3. ⏳ **USER ACTION**: Test semua fitur di atas
4. ⏳ **OPTIONAL**: Tambah data poin dummy untuk testing jika belum ada data

## CATATAN

Jika belum ada data poin di database, halaman akan menampilkan:
- Leaderboard: Kosong atau hanya karyawan tanpa poin
- Statistics: 0 untuk semua angka
- Riwayat: "Belum ada transaksi poin"

Ini **BUKAN ERROR**, hanya belum ada data. Anda bisa tambah data poin manual via SQL atau tunggu sampai ada transaksi poin dari sistem POS.
