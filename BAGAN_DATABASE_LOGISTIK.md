# BAGAN DATABASE LOGISTIK SISTEM PIGTOWNBARBERHOP (PlantUML)

## Diagram Alur Data & Logistik Database

```plantuml
@startuml Database_Logistics_Flow
!theme cerulean-outline

' ===== SWIMLANES =====
|#LightBlue|POS System|
|#LightGreen|Attendance System|
|#LightYellow|Kasbon System|
|#LightPink|Expense System|
|#LightCyan|Reporting System|

' ===== POS FLOW =====
|POS System|
start
:Kasir Login;
:Select Branch;
:Create Transaction;
note right
  **Table:** transactions
  - Generate transaction_number
  - Store cashier_id, branch_id
  - Snapshot: cashier_name, branch_name
end note

:Add Items/Services;
repeat
  :Select Service/Product;
  :Select Barber;
  note right
    **Table:** transaction_items
    - Store service_id, barber_id
    - Snapshot: service_name, type, category
    - Calculate commission_amount
  end note
repeat while (More items?) is (Yes)
-> No;

:Calculate Total;
:Apply Discount;
:Process Payment;
note right
  **Payment Methods:**
  - Cash
  - Debit
  - QRIS
end note

:Save Transaction;
fork
  :Update Stock;
  note right
    **Table:** services
    - Reduce stock (if product)
    - Update status
  end note
fork again
  :Calculate Commission;
  note right
    **Table:** transaction_items
    - Set commission_amount
    - Set commission_status: "credited"
  end note
fork again
  :Generate Receipt;
  note right
    **Table:** receipt_templates
    - Get active template
    - Generate struk
  end note
end fork

:Print Receipt;
stop

' ===== ATTENDANCE FLOW =====
|Attendance System|
start
:Karyawan Login;
:Select Branch;
:Check-In;
note right
  **Table:** attendance
  - Store user_id, branch_id
  - Store shift_type
  - Upload check_in_photo
  - Set status: "checked_in"
end note

:Take Selfie Photo;
note right
  **Storage:** Supabase Storage
  - Bucket: attendance-photos
  - Path: /user_id/date/check_in.jpg
end note

repeat
  if (Break?) then (Yes)
    :Start Break;
    note right
      **Update:** attendance
      - Set break_start_time
      - Set status: "on_break"
    end note
    :End Break;
    note right
      **Update:** attendance
      - Set break_end_time
      - Calculate break_duration
      - Set status: "checked_in"
    end note
  endif
repeat while (Continue Working?) is (Yes)
-> No;

:Check-Out;
note right
  **Update:** attendance
  - Upload check_out_photo
  - Set check_out_time
  - Calculate total_hours
  - Set status: "checked_out"
end note

fork
  :Calculate Work Hours;
  note right
    **Logic:**
    - Total hours = check_out - check_in - break
    - Update total_hours field
  end note
fork again
  :Update Salary Data;
  note right
    **Used for:** Salary calculation
    - Count work days
    - Detect late/absent
    - Calculate overtime
  end note
end fork

stop

' ===== KASBON FLOW =====
|Kasbon System|
start
:Karyawan Login;
:Create Kasbon Request;
note right
  **Table:** kasbon
  - Store user_id
  - Store amount, reason
  - Set status: "pending"
  - Set request_date
end note

:Submit Request;

|#Orange|Admin/Owner|
:Receive Notification;
:Review Request;
note right
  **Query:** kasbon
  - Filter by status: "pending"
  - Join with users table
  - Show employee history
end note

if (Decision?) then (Approve)
  :Approve Kasbon;
  note right
    **Update:** kasbon
    - Set status: "approved"
    - Set approved_by (user_id)
    - Set approved_at (timestamp)
  end note
  
  |Kasbon System|
  :Create Debt Record;
  note right
    **Used for:** Salary deduction
    - Track outstanding kasbon
    - Calculate monthly payment
  end note
  
else (Reject)
  :Reject Kasbon;
  note right
    **Update:** kasbon
    - Set status: "rejected"
    - Set rejection reason
  end note
endif

|Kasbon System|
:Notify Karyawan;

if (Status?) then (Approved)
  repeat
    :Pay Installment;
    note right
      **Update:** kasbon
      - Reduce remaining amount
      - Track payment history
    end note
  repeat while (Paid Off?) is (No)
  -> Yes;
  
  :Mark as Paid;
  note right
    **Update:** kasbon
    - Set status: "paid"
    - Clear from active kasbon
  end note
endif

stop

' ===== EXPENSE FLOW =====
|Expense System|
start
:Admin Login;
:Select Branch;
:Create Expense;
note right
  **Table:** expenses
  - Store branch_id
  - Store requested_by (user_id)
  - Select category:
    * Operasional
    * Gaji
    * Bonus
    * Kasbon
    * Lainnya
end note

:Upload Receipt;
note right
  **Storage:** Supabase Storage
  - Bucket: expense-receipts
  - Path: /branch_id/date/receipt.jpg
  - Store URL in receipt_url
end note

:Submit Expense;

|#Orange|Owner|
:Review Expense;
note right
  **Query:** expenses
  - Filter by branch_id
  - Filter by status: "pending"
  - Join with users, branches
end note

if (Approve?) then (Yes)
  :Approve Expense;
  note right
    **Update:** expenses
    - Set status: "approved"
    - Set approved_by
    - Set approved_at
  end note
  
  fork
    :Update Branch Balance;
    note right
      **Logic:**
      - Deduct from branch budget
      - Update financial records
    end note
  fork again
    :Generate Report Entry;
    note right
      **Used for:**
      - Financial reports
      - Profit/loss calculation
      - Monthly/yearly summary
    end note
  end fork
  
else (No)
  :Reject Expense;
  note right
    **Update:** expenses
    - Set status: "rejected"
    - Add rejection notes
  end note
endif

:Notify Requester;
stop

' ===== REPORTING FLOW =====
|Reporting System|
start
:Owner Login;
:Select Report Type;
note right
  **Report Types:**
  1. Transaction Report
  2. Financial Report
  3. Employee Performance
  4. Attendance Report
end note

switch (Report Type?)
case (Transaction)
  :Query Transactions;
  note right
    **Tables:**
    - transactions
    - transaction_items
    - users (server, cashier)
    - branches
    - services
  end note
  
  :Aggregate Data;
  note right
    **Metrics:**
    - Total revenue
    - Transaction count
    - Average transaction
    - Payment method breakdown
    - Top services
  end note

case (Financial)
  :Query Financial Data;
  note right
    **Tables:**
    - transactions (income)
    - expenses (outgoing)
    - kasbon (liabilities)
  end note
  
  :Calculate P&L;
  note right
    **Formula:**
    Revenue - Expenses = Profit
    
    **Breakdown:**
    - Income by category
    - Expense by category
    - Net profit per branch
  end note

case (Employee)
  :Query Employee Data;
  note right
    **Tables:**
    - users
    - transaction_items (commission)
    - attendance (work hours)
    - points (bonus/penalty)
  end note
  
  :Calculate Performance;
  note right
    **Metrics:**
    - Total customers served
    - Total commission earned
    - Attendance rate
    - Customer rating
    - Points balance
  end note

case (Attendance)
  :Query Attendance Data;
  note right
    **Tables:**
    - attendance
    - users
    - branches
  end note
  
  :Calculate Statistics;
  note right
    **Metrics:**
    - Attendance rate
    - Late count
    - Absent count
    - Overtime hours
    - Work days vs expected
  end note
endswitch

:Generate Report;
fork
  :Display Dashboard;
  note right
    **Real-time Charts:**
    - Revenue trend
    - Employee ranking
    - Branch performance
  end note
fork again
  :Export Report;
  note right
    **Export Formats:**
    - PDF (print)
    - Excel (analysis)
    - CSV (raw data)
  end note
end fork

stop

@enduml
```

---

## 2. Diagram Arsitektur Data Flow

```plantuml
@startuml Data_Architecture
!theme vibrant

' ===== LAYERS =====
package "Presentation Layer" {
  [Next.js Frontend] as frontend
  [React Components] as components
  [Tailwind CSS] as styling
}

package "Business Logic Layer" {
  [POS Module] as pos
  [Attendance Module] as attendance
  [Kasbon Module] as kasbon
  [Expense Module] as expense
  [Reporting Module] as reporting
  [Employee Management] as employee
}

package "Data Access Layer" {
  [Supabase Client] as client
  [Real-time Subscriptions] as realtime
  [Storage API] as storage
}

package "Database Layer" {
  database "PostgreSQL" {
    [users] as db_users
    [branches] as db_branches
    [transactions] as db_transactions
    [transaction_items] as db_items
    [attendance] as db_attendance
    [kasbon] as db_kasbon
    [expenses] as db_expenses
    [services] as db_services
    [points] as db_points
  }
  
  storage "Supabase Storage" {
    folder "attendance-photos" as photos
    folder "expense-receipts" as receipts
    folder "receipt-templates" as templates
  }
}

package "External Services" {
  [QRIS Payment Gateway] as qris
  [Print Service] as printer
  [Email Notification] as email
}

' ===== CONNECTIONS =====

frontend --> components
components --> styling

components --> pos
components --> attendance
components --> kasbon
components --> expense
components --> reporting
components --> employee

pos --> client
attendance --> client
kasbon --> client
expense --> client
reporting --> client
employee --> client

client --> db_users
client --> db_branches
client --> db_transactions
client --> db_items
client --> db_attendance
client --> db_kasbon
client --> db_expenses
client --> db_services
client --> db_points

attendance --> storage
expense --> storage
storage --> photos
storage --> receipts
storage --> templates

realtime --> db_transactions
realtime --> db_attendance
realtime --> components

pos --> qris
pos --> printer
kasbon --> email
expense --> email

note right of db_transactions
  **High Traffic Table**
  - 1000+ records/day
  - Indexed by date, branch
  - Snapshot pattern used
end note

note right of db_attendance
  **Real-time Updates**
  - Check-in/out tracking
  - Photo upload to Storage
  - Live status monitoring
end note

note right of storage
  **File Storage**
  - Photos: attendance selfies
  - Receipts: expense proofs
  - Templates: receipt designs
end note

@enduml
```

---

## 3. Diagram Data Sync & Real-time Flow

```plantuml
@startuml Realtime_Data_Sync
!theme blueprint

actor "Kasir A" as kasir1
actor "Kasir B" as kasir2
actor "Karyawan" as employee
actor "Owner" as owner

participant "Next.js App" as app
participant "Supabase Client" as client
participant "Supabase Realtime" as realtime
database "PostgreSQL" as db

== Transaction Real-time Sync ==

kasir1 -> app: Create Transaction
app -> client: Insert transaction
client -> db: INSERT INTO transactions
db --> client: Success + Data
client -> realtime: Broadcast event
realtime -> kasir2: New transaction event
realtime -> owner: Dashboard update
client --> app: Return data
app --> kasir1: Show success

note over realtime
  **Real-time Channel:**
  - table: "transactions"
  - event: "INSERT"
  - filter: branch_id
end note

== Attendance Real-time Sync ==

employee -> app: Check-in
app -> client: Insert attendance
client -> db: INSERT INTO attendance
db --> client: Success
client -> realtime: Broadcast event
realtime -> owner: Dashboard update
realtime -> kasir1: Employee status update
client --> app: Return data
app --> employee: Check-in success

note over realtime
  **Real-time Channel:**
  - table: "attendance"
  - event: "INSERT/UPDATE"
  - filter: branch_id, date
end note

== Kasbon Real-time Notification ==

employee -> app: Submit kasbon
app -> client: Insert kasbon
client -> db: INSERT INTO kasbon
db --> client: Success
client -> realtime: Broadcast event
realtime -> owner: New kasbon alert
client --> app: Return data
app --> employee: Request submitted

owner -> app: Approve kasbon
app -> client: Update kasbon
client -> db: UPDATE kasbon
db --> client: Success
client -> realtime: Broadcast event
realtime -> employee: Kasbon approved!
client --> app: Return data
app --> owner: Approval success

note over realtime
  **Real-time Channel:**
  - table: "kasbon"
  - event: "INSERT/UPDATE"
  - filter: user_id, status
end note

== Dashboard Metrics Real-time ==

owner -> app: Open dashboard
app -> client: Subscribe to changes
client -> realtime: Subscribe multiple tables

loop Every transaction/attendance/expense
  db -> realtime: Table change event
  realtime -> client: Push update
  client -> app: Update state
  app -> owner: Live dashboard update
end

note over realtime
  **Subscribed Tables:**
  - transactions (revenue)
  - attendance (employees working)
  - kasbon (pending requests)
  - expenses (pending approvals)
end note

@enduml
```

---

## Penjelasan Bagan Database Logistik:

### **1. Alur Data POS System:**
1. **Input:** Kasir → Transaction → Items → Payment
2. **Process:** 
   - Generate transaction_number
   - Save transaction + items
   - Snapshot data (names, prices)
   - Calculate commission
3. **Output:**
   - Update stock
   - Credit commission
   - Print receipt
   - Update dashboard

### **2. Alur Data Attendance System:**
1. **Input:** Check-in → Photo → Shift selection
2. **Process:**
   - Upload photo to Storage
   - Save attendance record
   - Track break times
   - Calculate work hours
3. **Output:**
   - Real-time status update
   - Work hours calculation
   - Salary data preparation

### **3. Alur Data Kasbon System:**
1. **Input:** Karyawan request → Amount + reason
2. **Process:**
   - Save kasbon (status: pending)
   - Notify admin/owner
   - Admin review + approve/reject
   - Update status
3. **Output:**
   - Debt tracking
   - Salary deduction data
   - Payment installments

### **4. Alur Data Expense System:**
1. **Input:** Admin request → Category + amount + receipt
2. **Process:**
   - Upload receipt to Storage
   - Save expense (status: pending)
   - Owner review + approve/reject
   - Update branch balance
3. **Output:**
   - Financial records
   - Budget tracking
   - Report data

### **5. Alur Data Reporting System:**
1. **Input:** Owner select report type + filters
2. **Process:**
   - Query multiple tables
   - Join related data
   - Aggregate metrics
   - Calculate statistics
3. **Output:**
   - Dashboard visualization
   - Export PDF/Excel/CSV
   - Real-time charts

---

## Keunggulan Arsitektur Database:

### **✅ Real-time Capabilities:**
- Supabase Realtime untuk live updates
- Dashboard metrics update otomatis
- Attendance status real-time
- Transaction notifications instant

### **✅ Scalability:**
- PostgreSQL handle high traffic
- Indexed queries untuk performance
- Supabase auto-scaling
- Connection pooling

### **✅ Data Integrity:**
- Foreign key constraints
- Transaction ACID compliance
- Snapshot pattern untuk historical accuracy
- Soft delete untuk data preservation

### **✅ Security:**
- Row Level Security (RLS) policies
- Branch-based data isolation
- Role-based access control
- Encrypted storage

### **✅ Backup & Recovery:**
- Automated daily backups
- Point-in-time recovery
- Supabase managed backups
- Manual export capabilities

---

## Storage Buckets Structure:

```
supabase-storage/
├── attendance-photos/
│   ├── {user_id}/
│   │   ├── {date}/
│   │   │   ├── check_in.jpg
│   │   │   └── check_out.jpg
│   │   └── ...
│   └── ...
│
├── expense-receipts/
│   ├── {branch_id}/
│   │   ├── {date}/
│   │   │   ├── receipt_001.jpg
│   │   │   ├── receipt_002.pdf
│   │   │   └── ...
│   │   └── ...
│   └── ...
│
└── receipt-templates/
    ├── template_default.json
    ├── template_branch1.json
    └── ...
```

---

## Performance Optimization:

### **Database Indexes:**
```sql
-- High Priority Indexes
CREATE INDEX idx_trans_created ON transactions(created_at DESC);
CREATE INDEX idx_trans_branch ON transactions(branch_id, created_at);
CREATE INDEX idx_items_barber ON transaction_items(barber_id, created_at);
CREATE INDEX idx_attend_date ON attendance(user_id, date DESC);
CREATE INDEX idx_kasbon_status ON kasbon(status, user_id);
```

### **Query Optimization:**
- Use `select()` dengan specific columns
- Avoid `select('*')` untuk large tables
- Use pagination untuk list views
- Cache frequently accessed data
- Use RPC functions untuk complex queries

### **Real-time Optimization:**
- Subscribe only to needed channels
- Use filters to reduce payload
- Unsubscribe when component unmounts
- Batch updates where possible

---

## Cara Import ke Draw.io:

### **Metode 1: PlantUML Plugin**
1. Buka Draw.io: https://app.diagrams.net/
2. **Arrange** → **Insert** → **Advanced** → **PlantUML...**
3. Copy-paste code diagram di atas
4. Klik **Insert PlantUML**

### **Metode 2: PlantUML Server**
1. Buka: https://www.plantuml.com/plantuml/uml/
2. Paste code
3. Generate & download
4. Import ke Draw.io

---

## Monitoring & Analytics:

**Key Metrics to Track:**
- Transaction throughput (per second)
- Database query performance
- Storage usage growth
- Real-time connection count
- API response times
- Error rates
- User session duration

**Tools:**
- Supabase Dashboard (built-in analytics)
- PostgreSQL EXPLAIN for query analysis
- Browser DevTools for client performance
- Custom logging untuk business metrics

---

## Kontak Tim Pengembang:
- Ari Setia Hinanda
- Bayu Nurcahyo
- M. Ari Affandi
- M. Risky Ardiansyah

**Sistem:** PIGTOWNBARBERHOP Management System  
**Database:** PostgreSQL 15 + Supabase  
**Real-time:** Supabase Realtime (WebSocket)  
**Storage:** Supabase Storage (S3-compatible)
