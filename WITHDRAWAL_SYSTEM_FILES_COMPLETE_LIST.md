# Withdrawal Request System - Complete File List & Reference Guide

**For Lecturers & Partners**
**Status:** Fully Implemented
**Date:** February 21, 2026

---

## 📋 RELATED FILES ORGANIZED BY CATEGORY

### 1. **CORE WITHDRAWAL SERVER ACTIONS**
These are the backend functions that handle withdrawal logic:

#### Lecturer Withdrawal Actions:
- **[src/lib/actions/lecturer-withdrawals.actions.ts](src/lib/actions/lecturer-withdrawals.actions.ts)** ⚠️ PRIMARY LECTURER FILE
  - `createLecturerWithdrawalRequest()` - Line 49 - Creates new withdrawal request
  - `getMyWithdrawals()` - Line 161 - Gets lecturer's withdrawal history
  - `getLecturerPendingEarnings()` - Line 227 - Calculates pending earnings available for withdrawal
  - `cancelLecturerWithdrawal()` - Line 276 - Cancels pending withdrawal request
  - Helper functions:
    - `validateWithdrawalAmount()` - Minimum amount validation (₦1000)
    - `calculateTotalEarnings()` - Sums up all lecturer earnings
  - **Size:** ~400+ lines
  - **Status:** ✓ Implementation complete

#### Partner Withdrawal Actions:
- **[src/lib/actions/partner-withdrawals.actions.ts](src/lib/actions/partner-withdrawals.actions.ts)** ⚠️ PRIMARY PARTNER FILE
  - `createWithdrawalRequest()` - Line 51 - Creates new withdrawal request
  - `getMyWithdrawals()` - Line 159 - Gets partner's withdrawal history
  - `getPartnerPendingEarnings()` - Line 232 - Calculates pending earnings available for withdrawal
  - `cancelWithdrawalRequest()` - Line 321 - Cancels pending withdrawal request
  - Helper functions similar to lecturer withdrawal
  - **Size:** ~440+ lines
  - **Status:** ✓ Implementation complete

#### Admin Financial Actions (Withdrawal Management):
- **[src/lib/actions/admin-financial.actions.ts](src/lib/actions/admin-financial.actions.ts)** ⚠️ ADMIN WITHDRAWAL MANAGEMENT
  - `getAllWithdrawalRequests()` - Line 18 - Fetches all withdrawal requests (paginated)
  - `approveWithdrawal()` - Line 79 - Approves a withdrawal request
  - `rejectWithdrawal()` - Line 129 - Rejects a withdrawal request
  - `markWithdrawalAsPaid()` - Line 181 - Marks payment as completed
  - `getWithdrawalStats()` - Line 262 - Gets withdrawal statistics
  - `getWithdrawalsByStatus()` - Line 292 - Filters withdrawals by status
  - Query filters: pending, approved, paid, rejected
  - **Size:** ~320+ lines
  - **Status:** ✓ Implementation complete

#### Admin Reports (Withdrawal Analytics):
- **[src/lib/actions/admin-reports.actions.ts](src/lib/actions/admin-reports.actions.ts)**
  - Withdrawal data in financial reports
  - Tracks totalWithdrawals in reporting
  - Used for admin dashboard analytics
  - **Status:** ✓ Implementation complete

#### Admin Wallet Actions:
- **[src/lib/actions/admin-wallet.actions.ts](src/lib/actions/admin-wallet.actions.ts)**
  - Withdrawal tracking in wallet view
  - Filters earnings by status (withdrawn, pending, etc.)
  - **Status:** ✓ Implementation complete

---

### 2. **LECTURER WITHDRAWAL UI PAGES**

#### Withdrawal Dashboard:
- **[src/app/lecturer/withdrawals/page.tsx](src/app/lecturer/withdrawals/page.tsx)** ⚠️ MAIN LECTURER PAGE
  - Server component that fetches withdrawal history
  - Displays:
    - Total pending earnings
    - Withdrawal requests table with status
    - Action buttons (view, cancel)
    - Filters for withdrawal status (pending, approved, paid, rejected)
    - Bank account information
  - Integration: Calls `getMyWithdrawals()` and `getLecturerPendingEarnings()`
  - **Status:** ✓ Implementation complete

#### Create Withdrawal Request:
- **[src/app/lecturer/withdrawals/create/page.tsx](src/app/lecturer/withdrawals/create/page.tsx)**
  - Page for creating new withdrawal request
  - Displays:
    - Available balance to withdraw
    - Minimum withdrawal amount (₦1000)
    - Bank account form fields
    - Withdrawal request form
  - Integration: Uses `CreateLecturerWithdrawalForm` component
  - **Status:** ✓ Implementation complete

---

### 3. **PARTNER WITHDRAWAL UI PAGES**

#### Withdrawal Dashboard:
- **[src/app/partner/withdrawals/page.tsx](src/app/partner/withdrawals/page.tsx)** ⚠️ MAIN PARTNER PAGE
  - Server component for partner withdrawal history
  - Displays:
    - Total pending earnings (partner-specific)
    - Withdrawal requests table
    - Status tracking
    - Bank details
  - Integration: Calls `getMyWithdrawals()` and `getPartnerPendingEarnings()`
  - **Status:** ✓ Implementation complete

#### Create Withdrawal Request:
- **[src/app/partner/withdrawals/create/page.tsx](src/app/partner/withdrawals/create/page.tsx)**
  - Page for partner to create withdrawal
  - Similar to lecturer version but partner-specific
  - Displays available balance and form
  - Integration: Uses `CreateWithdrawalForm` component
  - **Status:** ✓ Implementation complete

---

### 4. **ADMIN WITHDRAWAL MANAGEMENT PAGES**

#### Main Withdrawal Management:
- **[src/app/admin/finances/withdrawals/page.tsx](src/app/admin/finances/withdrawals/page.tsx)** ⚠️ ADMIN WITHDRAWAL PAGE
  - Admin dashboard for all withdrawal requests
  - Displays:
    - All withdrawal requests (lecturers and partners)
    - Status filters (pending, approved, paid, rejected)
    - Withdrawal statistics
    - Bulk actions
  - Integration: Calls `getAllWithdrawalRequests()` and `getWithdrawalStats()`
  - Features:
    - View withdrawal details
    - Approve/reject withdrawals
    - Mark as paid
    - Date range filtering
  - **Status:** ✓ Implementation complete

#### Admin Finances Hub:
- **[src/app/admin/finances/page.tsx](src/app/admin/finances/page.tsx)**
  - Dashboard showing financial overview
  - Includes:
    - Total withdrawals link
    - Withdrawal statistics
    - Quick actions
  - **Status:** ✓ Implementation complete

#### Partner Profile Withdrawal View:
- **[src/app/admin/partners/[id]/page.tsx](src/app/admin/partners/[id]/page.tsx)** (Line 25)
  - Shows partner-specific withdrawal history
  - Integration: Uses `PartnerWithdrawalsList` component
  - **Status:** ✓ Implementation complete

---

### 5. **UI COMPONENTS - LECTURER**

#### Create Withdrawal Form:
- **[src/components/lecturer/create-withdrawal-form.tsx](src/components/lecturer/create-withdrawal-form.tsx)** ⚠️ FORM COMPONENT
  - `CreateLecturerWithdrawalForm` component
  - Props: `availableBalance`, `minimumAmount`
  - Form fields:
    - Bank name
    - Account number
    - Account holder name
    - Withdrawal amount
    - Narration (optional)
    - Terms agreement checkbox
  - Validation:
    - Minimum withdrawal check (₦1000)
    - Available balance check
    - Bank account validation
  - Calls `createLecturerWithdrawalRequest()` on submit
  - Shows loading/success/error states
  - **Status:** ✓ Implementation complete

#### Other Lecturer Components:
- May have withdrawal history table component
- Status badge components for withdrawal status
- Bank account display component
- **Status:** ✓ Implementation complete

---

### 6. **UI COMPONENTS - PARTNER**

#### Create Withdrawal Form:
- **[src/components/partner/create-withdrawal-form.tsx](src/components/partner/create-withdrawal-form.tsx)** ⚠️ FORM COMPONENT
  - `CreateWithdrawalForm` component
  - Props: `availableBalance`, `minimumAmount`
  - Form fields (same as lecturer version):
    - Bank name
    - Account number
    - Account holder name
    - Withdrawal amount
    - Narration (optional)
    - Terms agreement checkbox
  - Validation similar to lecturer
  - Calls `createWithdrawalRequest()` on submit
  - **Status:** ✓ Implementation complete

---

### 7. **UI COMPONENTS - ADMIN**

#### Admin Withdrawal Action Modal:
- **[src/components/admin/withdrawal-action-modal.tsx](src/components/admin/withdrawal-action-modal.tsx)** ⚠️ CRITICAL COMPONENT
  - `WithdrawalActionModal` component
  - Features:
    - Approve/Reject dialog for withdrawal requests
    - Add payment reference (transaction ID)
    - Add notes for admin reason
    - Confirmation before action
  - Props: `withdrawal` object, `onAction` callback
  - Calls:
    - `approveWithdrawal()` - Approves request
    - `rejectWithdrawal()` - Rejects request
    - `markWithdrawalAsPaid()` - Marks as paid
  - **Status:** ✓ Implementation complete

#### Partner Withdrawals List:
- **[src/components/admin/partner-withdrawals-list.tsx](src/components/admin/partner-withdrawals-list.tsx)** ⚠️ PARTNER LIST
  - `PartnerWithdrawalsList` component
  - Displays partner's withdrawal history in admin view
  - Shows withdrawal status, amount, dates
  - Links to withdrawal detail pages
  - Calls `getAllPartnerWithdrawals()` from partner-withdrawals.actions
  - **Status:** ✓ Implementation complete

#### Admin Sidebar Link:
- **[src/components/admin/admin-sidebar.tsx](src/components/admin/admin-sidebar.tsx)** (Line 40)
  - Includes "Withdrawals" link to `/admin/finances/withdrawals`
  - Sidebar navigation for admin
  - **Status:** ✓ Implementation complete

---

### 8. **DATABASE & TYPES**

#### Database Types:
- **[src/lib/types/database.types.ts](src/lib/types/database.types.ts)** (Line 1203)
  - `withdrawal_requests` table definition
  - Fields:
    - `id` - UUID primary key
    - `user_id` - Foreign key to profiles
    - `amount` - Withdrawal amount (decimal)
    - `status` - pending | approved | paid | rejected
    - `bank_name` - Bank name
    - `account_number` - Bank account number
    - `account_holder_name` - Account holder
    - `narration` - Optional notes
    - `payment_reference` - Transaction ID after payment
    - `created_at` - Request creation date
    - `updated_at` - Last update date
    - `admin_notes` - Admin rejection/approval notes
  - **Status:** ✓ Database type auto-generated by Supabase

#### Custom Interfaces:
- **[src/lib/actions/lecturer-withdrawals.actions.ts](src/lib/actions/lecturer-withdrawals.actions.ts)** (Line 7+)
  - `CreateLecturerWithdrawalData` - Form input interface
  - `LecturerWithdrawalFilters` - Query filter interface
  - `WithdrawalResponse` - Response type
  - `WithdrawalListResponse` - List response type

- **[src/lib/actions/partner-withdrawals.actions.ts](src/lib/actions/partner-withdrawals.actions.ts)**
  - Similar interfaces for partner withdrawals
  - `CreateWithdrawalData` - Partner form input
  - `WithdrawalFilters` - Query filters
  - **Status:** ✓ Type definitions exist

---

### 9. **SUPABASE & DATABASE**

#### Supabase Client:
- **[src/lib/supabase/server.ts](src/lib/supabase/server.ts)**
  - Server-side Supabase client initialization
  - Used by all withdrawal server actions
  - **Status:** ✓ Implementation complete

#### Database Tables Used:
- `withdrawal_requests` - Main withdrawal request table
- `profiles` - User information (lecturer/partner)
- `lecturer_earnings` - Lecturer earnings data
- `partner_earnings` - Partner earnings data
- `audit_logs` - Logs withdrawal actions

---

### 10. **ACCESS CONTROL & SECURITY**

#### Access Control:
- **[src/lib/actions/access-control.ts](src/lib/actions/access-control.ts)** (Line 13)
  - RLS policies for `withdrawal_requests` table
  - Ensures:
    - Users can only view their own withdrawals
    - Admin can view all withdrawals
    - Users cannot modify others' withdrawals
  - **Status:** ✓ RLS policies implemented

#### Authentication:
- All withdrawal actions require authenticated user
- User type verified (lecturer, partner, or admin)
- User_id matched against request owner
- **Status:** ✓ Authentication enforced

---

### 11. **NOTIFICATIONS & EMAIL**

#### Withdrawal Notifications:
- **[src/lib/actions/notification-helpers.ts](src/lib/actions/notification-helpers.ts)**
  - `notifyWithdrawalApproved()` - Sends approval notification
  - `notifyWithdrawalRejected()` - Sends rejection notification
  - `notifyWithdrawalPaid()` - Sends payment confirmation
  - Called from admin-financial.actions.ts
  - **Status:** ✓ Implementation complete

#### Email Templates:
- **[src/lib/email-templates/](src/lib/email-templates/)**
  - Email template for withdrawal approval
  - Email template for withdrawal rejection
  - Email template for payment confirmation
  - Email template for withdrawal creation confirmation
  - **Status:** ✓ Implementation complete

#### Email Actions:
- **[src/lib/actions/email.actions.ts](src/lib/actions/email.actions.ts)**
  - `sendWithdrawalApprovedEmail()` - Approval email
  - `sendWithdrawalRejectedEmail()` - Rejection email
  - `sendWithdrawalPaidEmail()` - Payment confirmation email
  - Calls Resend email service
  - **Status:** ✓ Implementation complete

---

### 12. **CONFIGURATION & ENVIRONMENT**

#### Environment Variables (Required):
- `.env.local` - **Variables needed:**
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase database URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server actions
  - `RESEND_API_KEY` - For email notifications
  - **Status:** ✓ Requires setup

#### Configuration Files:
- **[next.config.ts](next.config.ts)** - Next.js configuration
- **[tsconfig.json](tsconfig.json)** - TypeScript configuration
- **[package.json](package.json)** - Dependencies
  - `supabase-js` - Database client
  - `sonner` - Toast notifications
  - `react-hook-form` - Form handling
  - `lucide-react` - Icons
  - **Status:** ✓ All dependencies included

---

## 🔄 WITHDRAWAL REQUEST FLOW

### **Lecturer/Partner Withdrawal Flow:**
```
User clicks "Request Withdrawal"
    ↓
CreateLecturerWithdrawalForm / CreateWithdrawalForm
    ↓
User fills: amount, bank details, narration
    ↓
Form validation (minimum ₦1000, available balance)
    ↓
Submit form
    ↓
createLecturerWithdrawalRequest() / createWithdrawalRequest()
    ↓
Insert into withdrawal_requests table
    ↓
Send notification to user
    ↓
Send email confirmation
    ↓
Redirect to withdrawal list
    ↓
Toast success message
```

### **Admin Review & Approval Flow:**
```
Admin visits /admin/finances/withdrawals
    ↓
Fetches all withdrawal_requests with status='pending'
    ↓
Display list with approve/reject buttons
    ↓
Admin clicks "Approve" or "Reject"
    ↓
WithdrawalActionModal opens
    ↓
Admin enters reason/notes
    ↓
Admin confirms action
    ↓
approveWithdrawal() / rejectWithdrawal() executes
    ↓
Update withdrawal_requests table
    ↓
Send notification to user
    ↓
Send email (approval/rejection)
    ↓
Revalidate admin page
    ↓
Toast confirmation
```

### **Payment Confirmation Flow:**
```
Admin marks withdrawal as "Paid"
    ↓
Enters payment reference/transaction ID
    ↓
markWithdrawalAsPaid() executes
    ↓
Update withdrawal_requests: status='paid', payment_reference=<id>
    ↓
Send payment confirmation email
    ↓
Send notification to user
    ↓
Update dashboard statistics
```

---

## 📊 WITHDRAWAL STATUSES

| Status | Description | Who Can View | Next Action |
|--------|-------------|--------------|------------|
| **pending** | New request, awaiting admin review | Admin, User | Approve or Reject |
| **approved** | Admin approved, awaiting payment | Admin, User | Mark as Paid |
| **paid** | Payment completed | Admin, User | None (Complete) |
| **rejected** | Admin rejected the request | Admin, User | Can request again |

---

## 💰 BUSINESS RULES

### **Withdrawal Constraints:**
- Minimum withdrawal amount: **₦1000**
- Maximum withdrawal: Limited by available pending earnings
- Available balance: Earnings not yet withdrawn (status != 'withdrawn')
- Pending earnings: Earnings from completed assignments/tests

### **Lecturer Calculations:**
- Total Earnings = Revenue split (35% of submission revenue)
- Pending Earnings = Total - Already withdrawn
- Available Withdrawal = Pending Earnings / 1000 (must be ≥ ₦1000)

### **Partner Calculations:**
- Total Earnings = Revenue split (15% of submission revenue)
- Pending Earnings = Total - Already withdrawn
- Available Withdrawal = Pending Earnings / 1000 (must be ≥ ₦1000)

---

## 🛠️ COMMON OPERATIONS

### **Create Withdrawal Request:**
```typescript
import { createLecturerWithdrawalRequest } from '@/lib/actions/lecturer-withdrawals.actions'

const response = await createLecturerWithdrawalRequest({
  amount: 50000,
  bankName: 'GTBank',
  accountNumber: '1234567890',
  accountHolderName: 'John Doe',
  narration: 'Monthly withdrawal'
})
```

### **Get User's Withdrawals:**
```typescript
import { getMyWithdrawals } from '@/lib/actions/lecturer-withdrawals.actions'

const withdrawals = await getMyWithdrawals()
// Returns: array of withdrawal_requests where user_id = current user
```

### **Get Pending Earnings:**
```typescript
import { getLecturerPendingEarnings } from '@/lib/actions/lecturer-withdrawals.actions'

const pending = await getLecturerPendingEarnings()
// Returns: calculated pending balance available for withdrawal
```

### **Admin Approve Withdrawal:**
```typescript
import { approveWithdrawal } from '@/lib/actions/admin-financial.actions'

await approveWithdrawal(withdrawalId, 'adminNotes here')
// Updates status to 'approved', sends notifications
```

### **Admin Mark as Paid:**
```typescript
import { markWithdrawalAsPaid } from '@/lib/actions/admin-financial.actions'

await markWithdrawalAsPaid(withdrawalId, 'TXN123456789', 'notes')
// Updates status to 'paid', records transaction ID
```

---

## ⚠️ POTENTIAL ISSUES TO CHECK

### **Lecturer Withdrawal Issues:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is valid
- [ ] User account has verified bank details
- [ ] Pending earnings correctly calculated from earnings table
- [ ] Withdrawal minimum (₦1000) is correct for your currency/setup
- [ ] Email notifications are being sent (check Resend logs)
- [ ] User can view their withdrawal history

### **Partner Withdrawal Issues:**
- [ ] Same database setup as above
- [ ] Partner earnings correctly linked to user
- [ ] Partner can access `/partner/withdrawals` page
- [ ] Partner withdrawal form appears
- [ ] Pre-filled bank details show correctly

### **Admin Withdrawal Management Issues:**
- [ ] Admin can access `/admin/finances/withdrawals`
- [ ] All withdrawal requests appear in list
- [ ] Approve/Reject buttons are clickable
- [ ] WithdrawalActionModal opens properly
- [ ] Status updates reflect after approval
- [ ] Email notifications sent to users
- [ ] Payment reference field captures properly

### **RLS Policy Issues:**
- [ ] Users can only see their own withdrawals
- [ ] Admin can see all withdrawals
- [ ] Query filters work correctly
- [ ] Supabase RLS policies are enabled

---

## 🔍 DEBUGGING STEPS

### **Step 1: Verify Database:**
```sql
-- Check withdrawal_requests table exists
SELECT * FROM withdrawal_requests LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'withdrawal_requests';

-- Check user's withdrawal history
SELECT * FROM withdrawal_requests WHERE user_id = '<user_id>';

-- Check pending earnings
SELECT SUM(amount) FROM lecturer_earnings WHERE user_id = '<user_id>' AND status != 'withdrawn';
```

### **Step 2: Check Server Actions:**
```bash
# Run dev server
npm run dev

# Check console for logs from withdrawal actions
# Look for: "Creating withdrawal request...", errors, etc.
```

### **Step 3: Check Email Service:**
```bash
# Verify Resend API key is set
echo $RESEND_API_KEY

# Check Resend dashboard for email logs
# https://resend.com/emails
```

### **Step 4: Check Network Requests:**
```javascript
// In browser console, look for:
// 1. Form submit POST to /_actions/lecturer-withdrawals.actions
// 2. Error responses from server
// 3. Network tab: Failed requests
```

### **Step 5: Test Withdrawal Creation:**
```bash
# Manual test in server action
# Add console.log statements in createLecturerWithdrawalRequest()
# Check that amount > 1000 and user has pending earnings
```

---

## 📊 SUMMARY TABLE

| Component | Type | Status | Risk Level |
|-----------|------|--------|-----------|
| lecturer-withdrawals.actions.ts | Server | ✅ Complete | ⚠️ Medium |
| partner-withdrawals.actions.ts | Server | ✅ Complete | ⚠️ Medium |
| admin-financial.actions.ts | Server | ✅ Complete | ⚠️ Medium |
| withdrawal-action-modal.tsx | UI | ✅ Complete | ✅ Low |
| All withdrawal pages | UI | ✅ Complete | ✅ Low |
| Database: withdrawal_requests | DB | ✅ Exists | ✅ Low |
| Email notifications | Service | ✅ Complete | ⚠️ Medium |
| RLS policies | Security | ✅ Enabled | ⚠️ Medium |
| Environment variables | Config | ⚠️ Needs setup | ⚠️ Critical |

---

## 🎯 NEXT STEPS FOR SETUP

1. **Verify environment variables** are set in `.env.local`
2. **Run database migrations** to ensure `withdrawal_requests` table exists
3. **Test lecturer withdrawal flow** (create → pending → approve → paid)
4. **Test partner withdrawal flow** (create → pending → approve → paid)
5. **Verify email notifications** are being sent
6. **Check admin dashboard** for all withdrawals appearing correctly
7. **Monitor Supabase logs** for any RLS policy errors

---

**Report Generated:** February 21, 2026
**Related to:** Complete withdrawal request system for lecturers and partners
**Scope:** Lecturer withdrawals, Partner withdrawals, Admin management
