# PromoCodeCard Quick File Reference

## All Files Related to PromoCodeCard Issue

---

### 🔴 CRITICAL FILES (Check These First)

#### 1. **Component File**
```
File: src/components/promo-code-card.tsx
Line 17: export function PromoCodeCard()
Line 1: 'use client'
Lines 1-200: Full component code
```
**What to verify:**
- Does line 17 show `export function PromoCodeCard()`?
- Does line 1 have `'use client'`?
- Are imports from promo-codes.actions present?

---

#### 2. **Server Actions File**
```
File: src/lib/actions/promo-codes.actions.ts
Line 1: 'use server'
Line 42: export async function getMyPromoCode()
Line 151: export async function getMyPromoStats()
```
**What to verify:**
- Does line 42 show `export async function getMyPromoCode()`?
- Does line 151 show `export async function getMyPromoStats()`?
- Are they querying the right tables?

---

#### 3. **Lecturer Earnings Page** 🎯 WHERE IT SHOULD SHOW
```
File: src/app/lecturer/earnings/page.tsx
Line 11: import { PromoCodeCard } from '@/components/promo-code-card'
Line 1: 'use client'
Lines 337-340:
  <div>
    <h2 className="text-2xl font-bold mb-4">Other Ways to Earn</h2>
    <PromoCodeCard />
  </div>
```
**What to verify:**
- Does line 11 have the import?
- Does line 1 have `'use client'`?
- Are lines 337-340 rendering PromoCodeCard?

---

#### 4. **Partner Dashboard Page** (Also should show)
```
File: src/app/partner/page.tsx
Line 22: import { PromoCodeCard } from '@/components/promo-code-card'
Lines 62-66:
  <div>
    <h2 className="text-xl font-semibold mb-4">Other Ways to Earn</h2>
    <PromoCodeCard />
  </div>
```
**What to verify:**
- Does line 22 have the import?
- Are lines 62-66 rendering PromoCodeCard?

---

### 🟡 SECONDARY FILES (Reference/Alternative)

#### 5. **Alternative Client Component**
```
File: src/components/promo-code-card-client.tsx
Type: Client component with props
Status: Created as alternative, NOT currently used
```

#### 6. **Server Wrapper Component**
```
File: src/components/promo-code-card-wrapper.tsx
Type: Async server component wrapper
Status: Created as alternative, NOT currently used
```

---

## LINE-BY-LINE BREAKDOWN

### earnings/page.tsx Structure:
```
Line 1: 'use client'
Line 2-11: Imports (including PromoCodeCard)
Line 12-25: Types/Interfaces
Line 26+: Component function and logic
Line 100+: useEffect and data loading
Line 150+: Conditional returns (loading, error, success)
Line 160+: Main return JSX starting
Line 180+: Header section
Line 185+: Balance card
Line 195+: Earnings overview cards
Line 250+: Earnings breakdown table
Line 335+: Promo Code Card section ⭐
Line 350+: Quick Actions section
Line 380+: Info box section
```

**Key Line:** Line 337-340 is where PromoCodeCard renders

---

### promo-codes.actions.ts Structure:
```
Line 1: 'use server'
Line 2-8: Imports
Line 9-32: Type definitions
Line 42-100: getMyPromoCode() function
Line 151-210: getMyPromoStats() function
Line 220+: Other functions (validatePromoCode, etc.)
```

**Key Lines:** 
- Line 42: `getMyPromoCode()` definition
- Line 151: `getMyPromoStats()` definition

---

### promo-code-card.tsx Structure:
```
Line 1: 'use client'
Line 2-8: Imports
Line 9-15: formatCurrency function
Line 17: export function PromoCodeCard()
Line 18-23: State declarations
Line 25-27: useEffect
Line 29-48: loadData() function
Line 50-56: copyCode() function
Line 58-64: copyLink() function
Line 66+: return JSX (loading state, error state, render)
```

**Key Lines:**
- Line 1: `'use client'`
- Line 17: `export function PromoCodeCard()`
- Line 29-48: loadData() calls getMyPromoCode and getMyPromoStats

---

## File Location Map

```
src/
├── components/
│   ├── promo-code-card.tsx ⭐ MAIN COMPONENT
│   ├── promo-code-card-client.tsx (alternative)
│   └── promo-code-card-wrapper.tsx (alternative)
├── lib/
│   └── actions/
│       └── promo-codes.actions.ts ⭐ SERVER ACTIONS
└── app/
    ├── lecturer/
    │   ├── dashboard/
    │   │   └── page.tsx (removed PromoCodeCard)
    │   └── earnings/
    │       └── page.tsx ⭐ WHERE IT SHOULD SHOW
    ├── partner/
    │   └── page.tsx ⭐ WHERE IT SHOULD ALSO SHOW
    └── student/
        ├── dashboard/
        │   └── page.tsx (placeholder)
        └── profile/
            └── promo/
                └── page.tsx (standalone promo page)
```

---

## Simple Checklist

### Can you find these in the files?

- [ ] `src/components/promo-code-card.tsx` - Line 17 has `export function PromoCodeCard()`
- [ ] `src/components/promo-code-card.tsx` - Line 1 has `'use client'`
- [ ] `src/lib/actions/promo-codes.actions.ts` - Line 1 has `'use server'`
- [ ] `src/lib/actions/promo-codes.actions.ts` - Line 42 has `export async function getMyPromoCode()`
- [ ] `src/lib/actions/promo-codes.actions.ts` - Line 151 has `export async function getMyPromoStats()`
- [ ] `src/app/lecturer/earnings/page.tsx` - Line 1 has `'use client'`
- [ ] `src/app/lecturer/earnings/page.tsx` - Line 11 has import PromoCodeCard
- [ ] `src/app/lecturer/earnings/page.tsx` - Lines 337-340 have <PromoCodeCard />
- [ ] `src/app/partner/page.tsx` - Line 22 has import PromoCodeCard
- [ ] `src/app/partner/page.tsx` - Lines 62-66 have <PromoCodeCard />

if ALL are checked ✅ then the code is correct and the issue is:
- Browser not rendering
- JavaScript runtime error
- Network/API error
- Authentication/Database issue

---

## How to Use This Guide

1. Open each file mentioned
2. Go to the line specified
3. Verify the code is exactly as shown
4. If anything is different, let me know
5. If everything matches, check browser console for errors

---

## Next Action

Please open these 4 files and tell me:

1. **src/components/promo-code-card.tsx** - Line 1 and Line 17 - What do you see?
2. **src/lib/actions/promo-codes.actions.ts** - Line 1, 42, and 151 - What do you see?
3. **src/app/lecturer/earnings/page.tsx** - Line 1 and Line 11 - What do you see?
4. **When you visit earnings page** - Do you see "Other Ways to Earn" heading? (scroll down)

Then we can identify the exact problem!
