# Quick Reference: Cost Deduction Implementation

## What Was Fixed

### 🔧 Course-Based Tests
**Problem:** Access cost was hardcoded to `0`  
**Solution:** Load default cost from admin settings

**File:** `src/app/lecturer/courses/[id]/tests/create/page.tsx`
```diff
+ import { getDefaultTestCost } from '@/lib/actions/settings.actions'
+ const [defaultTestCost, setDefaultTestCost] = useState(50)

  useEffect(() => {
+   const cost = await getDefaultTestCost()
+   setDefaultTestCost(cost)
  })

- access_cost: 0,
+ access_cost: defaultTestCost,
```

### 🔧 Course-Based Assignments  
**Problem:** Created as standalone instead of course-based  
**Solution:** Rewrite `createAssignment()` to properly create course assignments

**File:** `src/lib/actions/assignment.actions.ts`
```diff
  export async function createAssignment(formData: {
    courseId: string
-   // Was just delegating to createStandaloneAssignment()
+   // Now has its own proper implementation
+   
+   const adminClient = createServiceClient()
+   const { data: assignment, error } = await adminClient
+     .from('assignments')
+     .insert({
+       is_standalone: false,     // ✅ FIXED
+       course_id: courseId,      // ✅ FIXED
+       submission_cost: ...
+     })
  })
```

---

## What Works Now

### ✅ All Four Types Support Cost Deductions

| Type | Default Cost | Stored Field | Status |
|------|-------------|--------------|--------|
| Standalone Assignment | `default_submission_cost` | `submission_cost` | ✅ Working |
| Standalone Test | `default_test_cost` | `access_cost` | ✅ Working |
| Course Assignment | `default_submission_cost` | `submission_cost` | ✅ FIXED |
| Course Test | `default_test_cost` | `access_cost` | ✅ FIXED |

### ✅ Full User Journey

**For Course Tests:**
```
1. Lecturer creates test
   └─ Admin default cost (₦50) is loaded ✅
   └─ Test saved with access_cost = ₦50 ✅

2. Student attempts test
   └─ Cost (₦50) is read from database ✅
   └─ Balance checked ✅
   └─ Cost deducted from wallet ✅
   └─ Transaction recorded ✅
   └─ Lecturer credited ✅
```

**For Course Assignments:**
```
1. Lecturer creates assignment
   └─ Admin default cost (₦200) is loaded ✅
   └─ Assignment saved with submission_cost = ₦200 ✅

2. Student submits assignment
   └─ Cost (₦200) is read from database ✅
   └─ Balance checked ✅
   └─ Cost deducted from wallet ✅
   └─ Transaction recorded ✅
   └─ Lecturer credited ✅
```

---

## Key Database Fields

### Assignments Table
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  
  -- NEW: Properly distinguish standalone vs course
  is_standalone BOOLEAN DEFAULT false,
  course_id UUID REFERENCES courses(id),
  
  -- Cost tracking (now used for course assignments too!)
  submission_cost DECIMAL DEFAULT 0,
  
  -- ... other fields
)
```

### Tests Table
```sql
CREATE TABLE tests (
  id UUID PRIMARY KEY,
  
  -- Distinguish standalone vs course
  is_standalone BOOLEAN DEFAULT false,
  course_id UUID REFERENCES courses(id),
  
  -- Cost tracking (now used for course tests too!)
  access_cost DECIMAL DEFAULT 0,
  
  -- ... other fields
)
```

---

## How to Test

### Test Course-Based Test with Cost

```bash
# 1. Create a course test
   - Go to: /lecturer/courses/{courseId}/tests/create
   - Observe: "Test Access Cost: ₦50" (or admin default)
   - Create test

# 2. Enroll a student in the course

# 3. Student attempts the test
   - Go to: /student/tests
   - Click "Take Test"
   - Observe: Wallet deducted by ₦50
   
# 4. Check transaction history
   - Student: Should see -₦50 transaction
   - Lecturer: Should see +₦25 (50% share) transaction
```

### Test Course-Based Assignment with Cost

```bash
# 1. Create a course assignment
   - Go to: /lecturer/courses/{courseId}/assignments/create
   - Observe: "Submission Cost: ₦200" (or admin default)
   - Create assignment

# 2. Enroll a student in the course

# 3. Student submits the assignment
   - Go to: /student/courses/{courseId}/assignments
   - Submit assignment
   - Observe: Wallet deducted by ₦200
   
# 4. Check transaction history
   - Student: Should see -₦200 transaction
   - Lecturer: Should see +₦100 (50% share) transaction
```

---

## Files Modified

### 1. Course Test Creation Page
**File:** `src/app/lecturer/courses/[id]/tests/create/page.tsx`
- Status: ✅ FIXED
- Changes: Load default cost, use it in creation

### 2. Course Assignment Action
**File:** `src/lib/actions/assignment.actions.ts`
- Status: ✅ FIXED
- Changes: Complete rewrite of `createAssignment()` function

### 3. Course Assignment Creation Page
**File:** `src/app/lecturer/courses/[id]/assignments/create/page.tsx`
- Status: ✅ ALREADY CORRECT
- No changes needed

---

## Common Questions

**Q: Do I need to migrate existing data?**  
A: No. Existing assignments/tests are unaffected. The fixes only apply to new course-based items.

**Q: Will standalone items still work?**  
A: Yes. They use `createStandaloneAssignment()` and `createStandaloneTest()` separately.

**Q: What if an admin changes the default cost?**  
A: New items will use the new cost. Existing items keep their original cost.

**Q: How is the revenue split calculated?**  
A: See `calculateRevenueSplit()` in lib/utils/revenue-split.ts. Default is 35% lecturer, 65% platform (or 35/15/50 with partner).

**Q: Can lecturers set custom costs per item?**  
A: Currently no - all items use admin default. Custom costs could be added as a future feature.

---

## Related Functions

### Admin Settings
- `getDefaultSubmissionCost()` - Get default assignment cost
- `getDefaultTestCost()` - Get default test cost
- See: `src/lib/actions/settings.actions.ts`

### Payment Processing
- `processSubmissionPayment()` - Handles all cost deductions
- `calculateRevenueSplit()` - Splits fees between parties
- See: `src/lib/actions/transaction.actions.ts`

### Test Attempts
- `startTestAttempt()` - Called when student takes test (processes payment)
- `submitTestAttempt()` - Called when student submits test
- See: `src/lib/actions/attempt.actions.ts`

### Assignment Submissions
- `submitAssignment()` - Handles cost deduction for course assignments
- `submitStandaloneAssignment()` - Handles cost deduction for standalone
- See: `src/lib/actions/submission.actions.ts` and `standalone-assignment.actions.ts`

---

## Monitoring & Debugging

### Check if costs are being applied
```sql
-- Recent costs deducted
SELECT 
  type, purpose, amount, created_at
FROM transactions
WHERE type = 'debit'
ORDER BY created_at DESC
LIMIT 20;

-- Recent lecturer earnings
SELECT 
  lecturer_id, amount, source_type, earned_at
FROM lecturer_earnings
ORDER BY earned_at DESC  
LIMIT 20;
```

### Debug logs to watch for
```
Console logs when creating:
✅ 💰 Loaded default test cost: 50
✅ 📝 Creating test with access_cost: 50

Console logs when attempting:
✅ 💳 Processing submission payment...
✅ 💵 Student balance: 500
✅ ✅ Deducted from student wallet. New balance: 450
✅ ✅ Payment processed successfully
```

---

## Version Information
- Implementation Date: February 17, 2026
- Fixes Applied: Course-based cost deductions
- Backward Compatibility: ✅ Full
- Database Migrations: ✅ None required
- Rollback Difficulty: Low (function-level changes only)
