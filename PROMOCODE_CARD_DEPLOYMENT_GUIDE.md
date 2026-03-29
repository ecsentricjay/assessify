# PromoCodeCard - Complete Implementation Guide

## ✅ STATUS: FULLY DEPLOYED

The PromoCodeCard component is now visible on **ALL THREE USER DASHBOARDS**:

### 1. **STUDENT Dashboard**
📍 **Location:** `/student/dashboard`
- **Section:** Between "Quick Actions" and "Recent Activity"
- **What shows:**
  - Your auto-generated promo code
  - Copy code to clipboard button
  - Copy referral link button
  - Total uses of your code
  - Total earnings from your code (in ₦ Naira)

### 2. **LECTURER Dashboard**
📍 **Location:** `/lecturer/dashboard`
- **Section:** After "Quick Actions" grid
- **What shows:**
  - Your auto-generated promo code
  - Copy code to clipboard button
  - Copy referral link button
  - Total uses of your code
  - Total earnings from your code (in ₦ Naira)

### 3. **PARTNER Dashboard**
📍 **Location:** `/partner`
- **Section:** "Other Ways to Earn" (below your Partner/Referral Code)
- **What shows:**
  - Your auto-generated promo code
  - Copy code to clipboard button
  - Copy referral link button
  - Total uses of your code
  - Total earnings from your code (in ₦ Naira)

---

## 🚀 How to Access Your Promo Code

### For Students:
```
1. Login to Assessify
2. Click on "Dashboard" in the sidebar
3. Scroll to "My Promo Code" section
4. Copy your code and share with other students
5. Earn commission when they use your code on CBT bundles
```

### For Lecturers:
```
1. Login to Assessify
2. Click on "Dashboard" in the sidebar
3. Scroll to "My Promo Code" section
4. Copy your code and share with students
5. Earn commission when they use your code on CBT bundles
```

### For Partners:
```
1. Login to Assessify
2. Go to Partner Dashboard
3. See "Referral Code" (for lecturers) at the top
4. Scroll to "Other Ways to Earn" for Promo Code
5. Share promo code with students
6. Earn commission on CBT bundle purchases
```

---

## 🔄 How Promo Codes Work

### Auto-Generation
- **When:** First time you visit the dashboard after login
- **What happens:** System automatically generates unique code
- **Format:** `ROLE-XXXXXX` (e.g., `STUD-ABC123`, `LECT-XYZ789`)

### Code Display
```
┌─────────────────────────────────┐
│    Your Referral Code           │
├─────────────────────────────────┤
│                                 │
│      LECT-ABC123123     │
│                                 │
│  [Copy Code]  [Copy Link]       │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Total Uses: 24        │    │
│  │  Total Earned: ₦12,000 │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

### How Students Use It
1. Student receives promo code from lecturer/student/partner
2. Student goes to `/student/cbt/bundles`
3. Applies code at checkout
4. Gets discount on CBT bundle
5. Code owner gets commission

---

## 💰 Commission Structure

### Lecturer/Student Promo Code
- **Earned:** When someone uses your code to buy CBT bundle
- **Amount:** Fixed ₦ amount (configured per bundle)
- **Tracked:** In PromoCodeCard stats

### Partner Referral Code
- **Earned:** When lecturer registers using your code
- **Amount:** 15% of lecturer's revenue
- **Tracked:** In ReferralCodeDisplay + Partner Dashboard stats

---

## 📊 Statistics Displayed

### PromoCodeCard Shows:
```
Total Uses: X
  - Number of times your code was used

Total Earnings: ₦X,XXX.00
  - Total commission earned from code usage
```

### What Happens Behind Scenes:
- Each code use is logged in `bundle_promo_earnings` table
- Commission calculated based on bundle price
- Status tracked: pending → approved → paid
- You can view detailed history via `getMyPromoEarnings()`

---

## 🔧 Technical Implementation

### Files Involved:
1. **Component:** `src/components/promo-code-card.tsx`
2. **Server Actions:** `src/lib/actions/promo-codes.actions.ts`
3. **Dashboards:**
   - `src/app/student/dashboard/page.tsx`
   - `src/app/lecturer/dashboard/page.tsx`
   - `src/app/partner/page.tsx`

### Key Functions:
- `getMyPromoCode()` - Generate or retrieve your code
- `getMyPromoStats()` - Get usage and earnings stats
- `getMyPromoEarnings()` - Get detailed earnings history
- `validatePromoCode()` - Verify code during purchase

---

## ✨ Features

✅ Auto-generates unique code per user/role
✅ Copy to clipboard with one click
✅ Share referral link directly
✅ Real-time stats update
✅ Currency formatting (₦ Naira)
✅ Loading states while fetching data
✅ Error handling with user-friendly messages
✅ Mobile responsive design
✅ Dark/light theme support

---

## 🐛 Troubleshooting

### If you don't see the PromoCodeCard:

**Problem 1: Component not showing at all**
- Solution: Clear browser cache and refresh page
- Check: Browser console for errors (F12 → Console)

**Problem 2: Shows "No promo code available"**
- Solution: Contact support (code generation issue)
- Normal state: Very rare, system auto-generates on first load

**Problem 3: Stats show zero**
- Solution: Normal if code hasn't been used yet
- Check back later when students use your code

**Problem 4: Copy button not working**
- Solution: Check browser permissions for clipboard access
- Try using "Copy Link" button instead

---

## 📱 Mobile Experience

The PromoCodeCard is fully responsive:
```
Desktop: Code display + Stats side by side
Tablet: Stacked layout with good spacing
Mobile: Vertical stack, code centered
```

---

## 🎯 Next Steps

1. **Share Your Code:** Copy code and send to students/others
2. **Track Earnings:** Watch stats update as code is used
3. **Withdraw Earnings:** Go to wallet to withdraw approved earnings
4. **Manage Code:** Can deactivate/reactivate if needed

---

## 📞 Support

For issues with:
- **Code not generating:** Check if logged in correctly
- **Stats not updating:** Reload page or wait 5-10 seconds
- **Commission not credited:** Check `bundle_promo_earnings` status
- **Other issues:** Contact admin support

---

## 📝 Files Modified

| File | Change | Status |
|------|--------|--------|
| `src/app/student/dashboard/page.tsx` | Added PromoCodeCard import & component | ✅ |
| `src/app/lecturer/dashboard/page.tsx` | Already had PromoCodeCard | ✅ |
| `src/app/partner/page.tsx` | Already had PromoCodeCard | ✅ |
| `src/components/promo-code-card.tsx` | No changes needed | ✅ |

---

## 🚀 Deployment Status

**Component Status:** LIVE on all three dashboards
**Function Status:** All server actions working
**Database Status:** Auto-generation enabled
**UI Status:** Fully styled and responsive

**Ready for:** Production use ✅

---

**Last Updated:** March 18, 2026
**Version:** 1.0
**Status:** Active & Functional
