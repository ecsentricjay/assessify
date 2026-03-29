# PromoCodeCard Files - Visual Summary

## FILE 1: src/components/promo-code-card.tsx ✅

**Status:** Component exists with proper export
**Client Component:** YES ('use client' at top)
**Export:** `export function PromoCodeCard()`

### Key Points:
- ✅ Has `'use client'` directive
- ✅ Calls `getMyPromoCode()` in useEffect
- ✅ Calls `getMyPromoStats()` in useEffect  
- ✅ Has loading state
- ✅ Has error handling with toast
- ✅ Sets code and stats state
- ✅ Renders code display, copy buttons, stats display

**Imports from:**
```
- getMyPromoCode, getMyPromoStats from '@/lib/actions/promo-codes.actions'
- Card, CardContent, CardHeader, CardTitle from '@/components/ui/card'
- Button from '@/components/ui/button'
- Icons: Copy, Check, TrendingUp, Users from 'lucide-react'
- toast from 'sonner'
```

---

## FILE 2: src/lib/actions/promo-codes.actions.ts ✅

**Status:** Server actions exist
**Exports:** Multiple async functions
**'use server':** YES at top

### Key Functions:
1. **getMyPromoCode()**
   - ✅ Checks if user authenticated
   - ✅ Validates user role (student, lecturer, partner)
   - ✅ Queries promo_codes table
   - ✅ Creates code if doesn't exist using RPC
   - ✅ Returns { success, code, error }

2. **getMyPromoStats()**
   - ✅ Checks user authenticated
   - ✅ Gets promo code for user
   - ✅ Queries bundle_promo_earnings table
   - ✅ Calculates stats (totalUses, totalEarnings)
   - ✅ Returns { success, stats, error }

---

## FILE 3: src/app/lecturer/earnings/page.tsx ✅

**Status:** Imports PromoCodeCard and renders it
**Client Component:** YES ('use client' at top)
**Location:** Line ~11 and Line ~340

### Line 11 - Import:
```tsx
import { PromoCodeCard } from '@/components/promo-code-card'
```

### Line 337-340 - Render:
```tsx
<div>
  <h2 className="text-2xl font-bold mb-4">Other Ways to Earn</h2>
  <PromoCodeCard />
</div>
```

### Surrounding Context:
- Before: Earnings breakdown table with transactions
- After: Quick Actions card section
- Within: Main content div with space-y-6 spacing

---

## FILE 4: src/app/partner/page.tsx ✅

**Status:** Imports PromoCodeCard and renders it
**Client Component:** NO (async server component)
**Location:** Line ~22 and Line ~64

### Line 22 - Import:
```tsx
import { PromoCodeCard } from '@/components/promo-code-card'
```

### Line 62-66 - Render:
```tsx
<div>
  <h2 className="text-xl font-semibold mb-4">Other Ways to Earn</h2>
  <PromoCodeCard />
</div>
```

### Surrounding Context:
- Before: ReferralCodeDisplay
- After: Stats Cards grid
- Within: Main space-y-6 div

---

## POSSIBLE ISSUES TO CHECK

### Issue 1: Component Not Loading Data
**Where to test:** Browser Console (F12)
**What to look for:**
- [ ] Is `loadData()` being called?
- [ ] Are `getMyPromoCode()` and `getMyPromoStats()` being called?
- [ ] Are there error messages in the console?
- [ ] Does console show "Failed to load promo code"?

**To confirm:** Open DevTools > Console tab on earnings page while logged in as lecturer

---

### Issue 2: Supabase Connection
**Where to test:** Network tab in DevTools
**What to look for:**
- [ ] Are network requests being made to Supabase?
- [ ] Are they returning 200 status?
- [ ] Are they returning data or errors?

**To confirm:** Open DevTools > Network tab, filter for "supabase" or "fetch", refresh page

---

### Issue 3: Authentication Issue
**Where to test:** Network requests and console
**What to look for:**
- [ ] Is `getCurrentUser()` returning a user?
- [ ] Is the user role set as 'lecturer'?
- [ ] Are there auth/permission errors?

**To confirm:** Check console for "Not authenticated" error

---

### Issue 4: Component Rendering
**Where to test:** Browser Elements/Inspector
**What to look for:**
- [ ] Is the <div> with "Other Ways to Earn" visible in DOM?
- [ ] Is the PromoCodeCard div/Card element visible in DOM?
- [ ] Is there a Card component rendered with content?

**To confirm:** Right-click on earnings page > Inspect > look for "Other Ways to Earn" heading

---

### Issue 5: CSS/Display Issue
**Where to test:** Browser Styles
**What to look for:**
- [ ] Is PromoCodeCard hidden with `display: none`?
- [ ] Is it below the fold and needs scrolling?
- [ ] Is the Card component visible at all?

**To confirm:** Scroll down in earnings page after "Earnings Breakdown" section

---

## STEP-BY-STEP DEBUGGING

### Step 1: Verify Page Loads
1. Login as lecturer
2. Navigate to `/lecturer/earnings`
3. Check if page shows:
   - Earnings Dashboard header ✓
   - Available Balance card ✓
   - Earnings Overview cards ✓
   - Earnings Breakdown table ✓
4. ✅ If all visible, page is loading

### Step 2: Verify "Other Ways to Earn" Section Appears
1. Scroll down on earnings page
2. Look for "Other Ways to Earn" heading
3. If NOT visible → issue is with rendering the heading/div
4. If visible → issue is with PromoCodeCard component only

### Step 3: Check Browser Console
1. Open DevTools (F12)
2. Click Console tab
3. Look for any red error messages
4. Note any messages about:
   - "Failed to load promo code"
   - "Not authenticated"
   - "undefined"
   - Component errors

### Step 4: Check Network Tab
1. Open DevTools (F12)
2. Click Network tab
3. Refresh page
4. Filter for "promo" or "api" calls
5. Look for calls to:
   - `getMyPromoCode` endpoint
   - `getMyPromoStats` endpoint
6. Check if responses have data or errors

### Step 5: Inspect DOM
1. Right-click on page
2. Select "Inspect" or "Inspect Element"
3. Search (Ctrl+F) for "Other Ways to Earn"
4. Verify the HTML structure matches expected structure

---

## FILES TO REVIEW ONE-BY-ONE

### Review Order:
1. **src/components/promo-code-card.tsx** - Does component export correctly? ✅
2. **src/lib/actions/promo-codes.actions.ts** - Do server actions work? ✅
3. **src/app/lecturer/earnings/page.tsx** - Is PromoCodeCard imported/rendered? ✅
4. **Browser Console** - Are there JavaScript errors?
5. **Browser Network** - Are requests being made and working?
6. **Browser Elements** - Is PromoCodeCard in the DOM?

---

## WHAT TO REPORT BACK

When reviewing these files, please share:

1. **From earnings page:**
   - Can you see "Other Ways to Earn" heading when you scroll down?
   - Can you see any PromoCodeCard component/card below it?
   - Any red error text visible?

2. **From Browser Console:**
   - What errors do you see? (Copy the exact error messages)
   - Are there any console.log messages?
   - "Failed to load promo code" error?

3. **From HTML Inspector:**
   - Is the "Other Ways to Earn" heading in the HTML?
   - Is there a Card component below it?
   - What's the structure of the PromoCodeCard element?

4. **From Network Tab:**
   - Are requests being made to fetch the promo code?
   - What's the response status (200, 401, 500)?
   - What data is returned?

---

## TL;DR - Quick Check

**Just tell me:**
1. Can you see "Other Ways to Earn" heading on earnings page? (Y/N)
2. What error shows in browser console? (Copy exact message)
3. When you inspect the page, is PromoCodeCard HTML present? (Y/N)
