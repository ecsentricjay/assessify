# Promo Code System - Complete Overview & Access Guide

## 📊 Current Implementation Status

### ✅ What EXISTS (Fully Implemented)

#### 1. **Server-Side Promo Code System**
**File:** `src/lib/actions/promo-codes.actions.ts`

Functions available for ALL three roles (lecturers, students, partners):
- `getMyPromoCode()` - Auto-generates or retrieves user's promo code
- `getMyPromoStats()` - Gets usage stats and earnings
- `getPromoCodeEarningsHistory()` - Track earnings from promo code usage
- `validatePromoCode()` - Validates promo codes when students use them
- `deactivateMyPromoCode()` - Deactivate your code
- `reactivateMyPromoCode()` - Reactivate your code

**Features:**
- Supports: `student`, `lecturer`, `partner` roles
- Auto-generates unique codes
- Tracks total uses and total earnings
- Prevents users from using their own code

#### 2. **Database Support**
**File:** `CBT-CLEAN-SCHEMA.sql`

Tables created:
- `promo_codes` - Stores all promo codes
  - `user_id` (owner)
  - `user_role` (student/lecturer/partner)
  - `promo_code` (unique code)
  - `is_active` (can deactivate)
  - `total_uses`, `total_earnings`, `pending_earnings`

Database functions:
- `generate_promo_code()` - Generates unique codes per role
- `get_or_create_promo_code()` - Auto-creates if doesn't exist

#### 3. **UI Component**
**File:** `src/components/promo-code-card.tsx`

Component displays:
- User's promo code (large, copyable)
- Copy to clipboard button
- Copy referral link button
- Total uses count
- Total earnings (in ₦ Naira)
- Earnings history breakdown

---

### ⚠️ What's MISSING (Partially Implemented)

#### 1. **Lecturer Dashboard** ✅ HAS IT
**File:** `src/app/lecturer/dashboard/page.tsx`

Status: **FULLY VISIBLE**
- PromoCodeCard is imported
- PromoCodeCard is displayed
- Lecturers can see and copy their code

**How to access:**
1. Login as lecturer
2. Go to `/lecturer/dashboard`
3. Scroll down to find **"My Promo Code"** section
4. Copy code and share with students
5. Track earnings and usage stats

---

#### 2. **Student Dashboard** ❌ MISSING
**File:** `src/app/student/dashboard/page.tsx`

Status: **NOT DISPLAYED**
- No PromoCodeCard imported
- No promo code section visible
- Students cannot see their promo code currently

**What's needed:**
```typescript
// Add to imports
import { PromoCodeCard } from '@/components/promo-code-card'

// Add to dashboard layout
<PromoCodeCard />
```

---

#### 3. **Partner Dashboard** ❌ MISSING
**File:** `src/app/partner/page.tsx`

Status: **PARTIALLY IMPLEMENTED**
- Shows `ReferralCodeDisplay` (partners' own referral code for lecturers)
- Does NOT show `PromoCodeCard` (for CBT bundle discounts)

Components used:
- ✅ `ReferralCodeDisplay` - Referral code for lecturers (15% commission)
- ❌ `PromoCodeCard` - Promo code missing (for CBT purchases)

---

### 📊 System Architecture

#### Two Different Systems Running Parallel:

**SYSTEM 1: Partner Referral Code**
```
Partner (referral_code) 
  → Shared with Lecturers
  → Lecturers register using code
  → Partner gets 15% commission when lecturer teaches
```

**SYSTEM 2: Promo Code (CBT Bundles)**
```
User (promo_code)
  → Lecturer shares with Students
  → Student uses code when buying CBT bundles
  → Lecturer/User gets fixed ₦ commission per purchase
  
  → Student shares with Other Students
  → Other student uses code when buying bundles
  → Original student gets commission
  
  → Partner shares with Students/Others
  → Gets commission from CBT bundle purchases
```

---

## 🎯 How to Access Promo Codes by Role

### For LECTURERS ✅
**Current Status: FULLY WORKING**

```
1. Login as lecturer
2. Navigate to: https://your-site.com/lecturer/dashboard
3. Scroll to "My Promo Code" card
4. Actions available:
   - Copy code to clipboard
   - Copy referral link
   - View total uses
   - View total earnings in ₦
   - View earnings breakdown by date
```

**Example Promo Code Display:**
```
┌─────────────────────────────────┐
│    Your Referral Code           │
├─────────────────────────────────┤
│                                 │
│    LECTURER-ABC123DE      │
│                                 │
│  [Copy Code] [Copy Link]        │
│                                 │
│  Total Uses: 24                 │
│  Total Earnings: ₦12,000        │
│                                 │
│  Earnings Breakdown:            │
│  - Student A: ₦1,000            │
│  - Student B: ₦500              │
│  - Student C: ₦250              │
│                                 │
└─────────────────────────────────┘
```

---

### For STUDENTS ❌
**Current Status: NOT VISIBLE**

Promo code generation is implemented in the database, but there's no UI to display it.

**What exists:**
- Code is auto-generated in database
- Code is functionally working
- Students can share codes with other students

**What's missing:**
- No dashboard section to view the code
- No UI to copy and share the code
- Users don't know their code exists

**To make it visible, add PromoCodeCard to student dashboard:**

```typescript
// src/app/student/dashboard/page.tsx
import { PromoCodeCard } from '@/components/promo-code-card'

// Then in the JSX (around line 250):
<PromoCodeCard />
```

---

### For PARTNERS ❌
**Current Status: PARTIAL**

**What shows:**
- ✅ Referral code (for lecturers) - `ReferralCodeDisplay` component
- ❌ Promo code (for CBT bundles) - PromoCodeCard is missing

**To see both codes, update partner dashboard:**

```typescript
// src/app/partner/page.tsx
import { PromoCodeCard } from '@/components/promo-code-card'

// Then add after ReferralCodeDisplay:
<section>
  <h2 className="text-xl font-bold mb-4">Additional Ways to Earn</h2>
  <PromoCodeCard />
</section>
```

---

## 🔧 Technical Details

### How Promo Code Generation Works

1. **User logs in → Dashboard loads**
2. **PromoCodeCard component renders**
3. **`getMyPromoCode()` server action called**
4. **Action checks if user has code:**
   - If YES: Return existing code
   - If NO: Call `get_or_create_promo_code()` RPC function
5. **Database generates unique code:**
   ```
   LECTURER codes:  LECT-{random}
   STUDENT codes:   STUD-{random}
   PARTNER codes:   PART-{random}
   ```
6. **Code stored and returned to component**
7. **Component displays with stats**

### Promo Code Format
```
Format: {ROLE}-{6 RANDOM CHARS}
Examples:
- LECT-ABC123  (Lecturer)
- STUD-XYZ789  (Student)
- PART-QWE456  (Partner)
```

### Commission from Promo Codes
When a promo code is used during CBT bundle purchase:
1. Student enters code at checkout
2. System validates code ownership
3. Discount applied (if configured)
4. ₦ amount added to code owner's wallet
5. Stats updated (total_uses, total_earnings)

---

## 📋 ACTION ITEMS

### If you want full visibility across all roles:

**Option 1: Add to Student Dashboard (2 lines)**
```
Location: src/app/student/dashboard/page.tsx
Add import: import { PromoCodeCard } from '@/components/promo-code-card'
Add component: <PromoCodeCard />
```

**Option 2: Add to Partner Dashboard (2-3 lines)**
```
Location: src/app/partner/page.tsx
Add import: import { PromoCodeCard } from '@/components/promo-code-card'
Add component: <PromoCodeCard />
```

**Option 3: Create dedicated Promo Code pages**
```
/student/promo-code - Full page for code management
/partner/promo-codes - Full page showing both referral + promo codes
/lecturer/promo-code - Full page for code analytics
```

---

## ✨ Current Flow Summary

```
LECTURERS:
  ✅ Can see their promo code
  ✅ Can copy code to share with students
  ✅ Can see who used their code and earnings
  
STUDENTS:
  ❌ Can't see their promo code (hidden)
  ✅ Code exists and works in database
  ✅ Earnings tracked automatically
  
PARTNERS:
  ✅ Can see referral code (for lecturers)
  ❌ Can't see promo code (for students/bundles)
  ✅ Promo code exists but not displayed
```

---

## 🚀 Next Steps

1. **Enable Student Promo Codes** - Add PromoCodeCard to student dashboard
2. **Enable Partner Promo Codes** - Add PromoCodeCard to partner dashboard
3. **Create Dedicated Pages** - Build full promo code management pages
4. **Add Analytics** - Show more detailed earnings analytics
5. **Promo Code Settings** - Allow users to customize commission rates

Would you like me to implement any of these enhancements?
