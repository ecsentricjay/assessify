# PromoCodeCard Issue - Complete File Audit
**Generated:** March 18, 2026

---

## Core Component Files

### 1. **Main PromoCodeCard Component** (Client Component)
- **Path:** `src/components/promo-code-card.tsx`
- **Type:** Client Component (`'use client'`)
- **Purpose:** Displays promo code with copy/share buttons and stats
- **Status:** Original component - should be working
- **Key Functions:**
  - `getMyPromoCode()` - Fetches user's promo code
  - `getMyPromoStats()` - Fetches usage stats
  - Displays code, total uses, total earnings
  - Copy to clipboard functionality
  - Copy referral link functionality

### 2. **PromoCodeCardClient Component** (Extracted Client Component)
- **Path:** `src/components/promo-code-card-client.tsx`
- **Type:** Client Component (`'use client'`)
- **Purpose:** Simplified version that receives code/stats as props
- **Status:** Created during troubleshooting - alternative approach
- **Receives Props:**
  - `code?: string | null`
  - `stats?: { totalUses, totalEarnings, pendingEarnings?, paidEarnings? }`

### 3. **PromoCodeCardServer Component** (Wrapper - Server Component)
- **Path:** `src/components/promo-code-card-wrapper.tsx`
- **Type:** Server Component (async function)
- **Purpose:** Server-side data fetching wrapper
- **Status:** Created during troubleshooting - may have issues
- **What It Does:**
  - Calls `getMyPromoCode()` and `getMyPromoStats()` server-side
  - Passes data to `PromoCodeCardClient`
  - Has error fallback UI
  - **Currently NOT USED in dashboards** (simplified back to direct PromoCodeCard)

---

## Server Action Files

### 4. **Promo Code Server Actions**
- **Path:** `src/lib/actions/promo-codes.actions.ts`
- **Type:** Server Actions (async functions)
- **Key Functions:**
  - `getMyPromoCode()` - Gets or creates promo code
  - `getMyPromoStats()` - Gets usage stats and earnings
  - `validatePromoCode()` - Validates a promo code
  - `getMyPromoEarnings()` - Gets earnings history
  - `generatePromoCode()` - Manual generation
  - `trackPromoUsage()` - Tracks when code is used
- **Status:** Core system - should be working
- **Database:** Queries from `promo_codes` and `bundle_promo_earnings` tables
- **RLS:** Uses RLS policies for data access

---

## Dashboard & Page Files

### 5. **Lecturer Earnings Page** 🎯 PRIMARY LOCATION
- **Path:** `src/app/lecturer/earnings/page.tsx`
- **Type:** Client Component (`'use client'`)
- **Status:** ✅ Has PromoCodeCard imported and rendered
- **Location of PromoCodeCard:** Line ~337
- **Section:** "Other Ways to Earn" heading
- **Current Code:**
  ```tsx
  import { PromoCodeCard } from '@/components/promo-code-card'
  ...
  <div>
    <h2 className="text-2xl font-bold mb-4">Other Ways to Earn</h2>
    <PromoCodeCard />
  </div>
  ```
- **Issue:** Component not displaying to users

### 6. **Student Dashboard**
- **Path:** `src/app/student/dashboard/page.tsx`
- **Type:** Server Component
- **Status:** Has placeholder (PromoCodeCard removed)
- **Location:** Line ~285 (placeholder only)
- **Current Code:**
  ```tsx
  <div className="mb-8">
    {/* Placeholder - PromoCodeCard moved to focus on core features */}
  </div>
  ```
- **Note:** Student promo viewing moved to `/student/profile/promo`

### 7. **Lecturer Dashboard**
- **Path:** `src/app/lecturer/dashboard/page.tsx`
- **Type:** Server Component
- **Status:** PromoCodeCard removed
- **Note:** Moved to earnings page instead

### 8. **Partner Dashboard**
- **Path:** `src/app/partner/page.tsx`
- **Type:** Server Component
- **Status:** ✅ Has PromoCodeCard imported and rendered
- **Location of PromoCodeCard:** Line ~64
- **Section:** "Other Ways to Earn" heading
- **Current Code:**
  ```tsx
  import { PromoCodeCard } from '@/components/promo-code-card'
  ...
  <div>
    <h2 className="text-xl font-semibold mb-4">Other Ways to Earn</h2>
    <PromoCodeCard />
  </div>
  ```
- **Issue:** Component may not be displaying

### 9. **Student Promo Profile Page**
- **Path:** `src/app/student/profile/promo/page.tsx`
- **Type:** Client Component (`'use client'`)
- **Status:** ✅ Created - full-featured promo page
- **Purpose:** Dedicated promo code management page for students
- **Features:**
  - Display promo code
  - Copy/Share buttons
  - Earnings history
  - Statistics
- **Route:** `/student/profile/promo`

---

## Configuration Files

### 10. **Middleware**
- **Path:** `middleware.ts`
- **Status:** Updated to allow public partner routes
- **Relevant For:** Partner registration flow (not directly promo code)

### 11. **Partner Registration Actions**
- **Path:** `src/lib/actions/partner-registration.actions.ts`
- **Status:** Supports partner self-registration with auto-generated codes

---

## Documentation Files (Not Code)

### 12. **System Guide**
- **Path:** `PROMO_CODE_SYSTEM_GUIDE.md`
- **Status:** Outdated documentation

### 13. **Deployment Guide**
- **Path:** `PROMOCODE_CARD_DEPLOYMENT_GUIDE.md`
- **Status:** Outdated documentation

### 14. **Deployment Complete**
- **Path:** `PROMO_CODE_DEPLOYMENT_COMPLETE.md`
- **Status:** Outdated documentation

---

## Files to Review ONE BY ONE

### 🔴 **CRITICAL FILES** (Review First)

1. **`src/components/promo-code-card.tsx`**
   - Check if component exports correctly
   - Check if `getMyPromoCode()` call works
   - Check if `getMyPromoStats()` call works
   - Check loading/error states

2. **`src/app/lecturer/earnings/page.tsx`**
   - Verify PromoCodeCard import exists
   - Verify PromoCodeCard rendering code exists
   - Check if page is being rendered at all
   - Check browser console for JavaScript errors

3. **`src/app/partner/page.tsx`**
   - Same checks as earnings page
   - Verify PromoCodeCard is rendering

4. **`src/lib/actions/promo-codes.actions.ts`**
   - Check `getMyPromoCode()` function
   - Check `getMyPromoStats()` function
   - Verify database queries work
   - Check error handling

### 🟡 **SECONDARY FILES** (Review if Primary Files are OK)

5. **`src/components/promo-code-card-client.tsx`**
   - Alternative version (might not be used)
   - Check if exports are correct

6. **`src/components/promo-code-card-wrapper.tsx`**
   - Wrapper component (might not be used)
   - Check if exports are correct

---

## Quick Issue Checklist

### For Earnings Page (Lecturer)
- [ ] Open `src/app/lecturer/earnings/page.tsx`
- [ ] Look for: `import { PromoCodeCard } from '@/components/promo-code-card'`
- [ ] Look for: `<PromoCodeCard />` in the JSX
- [ ] Check if page loads at all
- [ ] Check browser DevTools Console for errors
- [ ] Check if other content on page shows (balance, transactions, etc.)

### For Partner Dashboard
- [ ] Open `src/app/partner/page.tsx`
- [ ] Look for: `import { PromoCodeCard } from '@/components/promo-code-card'`
- [ ] Look for: `<PromoCodeCard />` in the JSX
- [ ] Check if page loads at all
- [ ] Check browser DevTools Console for errors
- [ ] Check if other content on page shows

### For PromoCodeCard Component
- [ ] Open `src/components/promo-code-card.tsx`
- [ ] Check: Is it exported as `export function PromoCodeCard()`?
- [ ] Check: Does it have `'use client'` at top?
- [ ] Check: Does it call `getMyPromoCode()` and `getMyPromoStats()`?
- [ ] Check: Does it have try/catch error handling?

### For Server Actions
- [ ] Open `src/lib/actions/promo-codes.actions.ts`
- [ ] Check: `getMyPromoCode()` function exists?
- [ ] Check: `getMyPromoStats()` function exists?
- [ ] Check: Do they have `'use server'` at top?
- [ ] Check: Do they check `getCurrentUser()`?
- [ ] Check: Do they query the database correctly?

---

## Next Steps

**Please review these files in this order:**

1. `src/components/promo-code-card.tsx` - Does it export correctly?
2. `src/lib/actions/promo-codes.actions.ts` - Do server actions work?
3. `src/app/lecturer/earnings/page.tsx` - Is PromoCodeCard imported and used?
4. `src/app/partner/page.tsx` - Is PromoCodeCard imported and used?
5. Browser Console - Any JavaScript errors?

**Let me know what you find in each file!**
