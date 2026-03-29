# Verification: Cost Deduction Implementation

## Implementation Overview

### File Structure for Cost Deduction
```
User Action
    ↓
Create Page (loads default cost from admin settings)
    ↓
Action Function (stores cost in database when creating item)
    ↓
Student Uses Item (test/assignment)
    ↓
Submit/Attempt Function (reads cost from database)
    ↓
processSubmissionPayment() (deducts from wallet)
    ↓
Transaction recorded in database
```

---

## Standalone Assignments (✅ Already Working)

### Creation Flow
1. **Page:** `src/app/lecturer/assignments/create/page.tsx`
   - Loads default cost: `defaultSubmissionCost` ✅
   - Passes to action: `submissionCost: defaultSubmissionCost` ✅

2. **Action:** `src/lib/actions/standalone-assignment.actions.ts::createStandaloneAssignment()`
   - Stores: `submission_cost: formData.submissionCost` ✅
   - Sets: `is_standalone: true` ✅

3. **Submission:** `src/lib/actions/standalone-assignment.actions.ts::submitStandaloneAssignment()`
   - Reads from DB: `assignment.submission_cost` ✅
   - Deducts via: `processSubmissionPayment()` ✅
   - Transaction recorded ✅

---

## Standalone Tests (✅ Already Working)

### Creation Flow
1. **Page:** `src/app/lecturer/tests/create/page.tsx`
   - Loads default cost: `defaultCost = await getDefaultTestCost()` ✅
   - Passes to action: `access_cost: accessCost` ✅

2. **Action:** `src/lib/actions/test.actions.ts::createStandaloneTest()`
   - Stores: `access_cost: data.access_cost` ✅
   - Sets: `is_standalone: true` ✅

3. **Attempt:** `src/lib/actions/attempt.actions.ts::startTestAttempt()`
   - Reads from DB: `test.access_cost` ✅
   - Deducts via: `processSubmissionPayment()` ✅
   - Transaction recorded ✅

---

## Course-Based Assignments (🔧 NOW FIXED)

### Creation Flow
1. **Page:** `src/app/lecturer/courses/[id]/assignments/create/page.tsx`
   - Loads default cost: `defaultSubmissionCost = await getDefaultSubmissionCost()` ✅
   - Passes to action: `submissionCost: defaultSubmissionCost` ✅

2. **Action:** `src/lib/actions/assignment.actions.ts::createAssignment()`
   - **[FIXED]** Now stores: `submission_cost: formData.submissionCost` ✅
   - **[FIXED]** Sets: `is_standalone: false` ✅
   - **[FIXED]** Sets: `course_id: formData.courseId` ✅

3. **Submission:** `src/lib/actions/submission.actions.ts::submitAssignment()`
   - Reads from DB: `assignment.submission_cost` ✅
   - Deducts via: `processSubmissionPayment()` ✅
   - Transaction recorded ✅

### What Was Fixed
**Before:** 
- `createAssignment()` delegated to `createStandaloneAssignment()`
- Created with `is_standalone: true` ❌
- Never linked to `course_id` ❌

**After:**
- `createAssignment()` has independent implementation
- Creates with `is_standalone: false` ✅
- Properly sets `course_id` ✅
- Verifies lecturer access to course ✅

---

## Course-Based Tests (🔧 NOW FIXED)

### Creation Flow
1. **Page:** `src/app/lecturer/courses/[id]/tests/create/page.tsx`
   - **[FIXED]** Loads default cost: `defaultTestCost = await getDefaultTestCost()` ✅
   - **[FIXED]** Passes to action: `access_cost: defaultTestCost` ✅

2. **Action:** `src/lib/actions/test.actions.ts::createCourseTest()`
   - Stores: `access_cost: data.access_cost` ✅
   - Sets: `course_id: courseId` ✅

3. **Attempt:** `src/lib/actions/attempt.actions.ts::startTestAttempt()`
   - Reads from DB: `test.access_cost` ✅
   - Deducts via: `processSubmissionPayment()` ✅
   - Transaction recorded ✅

### What Was Fixed
**Before:**
- Page hardcoded: `access_cost: 0` ❌
- Students not charged for course tests ❌

**After:**
- Page loads default cost ✅
- Passes correct cost to creation ✅
- Students properly charged ✅

---

## Transaction Flow (Used by All)

All four types (standalone/course assignments & tests) use: `processSubmissionPayment()`

### Processing Steps
1. ✅ Calculate revenue split (lecturer/partner/platform)
2. ✅ Verify student has sufficient balance
3. ✅ Deduct from student wallet
4. ✅ Credit lecturer wallet
5. ✅ Create student transaction record (debit)
6. ✅ Create lecturer transaction record (credit)
7. ✅ Record in lecturer_earnings table
8. ✅ Record partner earnings (if applicable)
9. ✅ Send notifications

### Key Fields Tracked
- `purpose`: 'assignment_payment' or 'test_payment'
- `metadata.source_type`: 'assignment_submission' or 'test_submission'
- `metadata.source_id`: ID of assignment or test
- `metadata.submission_id`: ID of submission or attempt
- `metadata.lecturer_amount`: How much lecturer earned
- `metadata.partner_amount`: How much partner earned (if applicable)

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN SETTINGS                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Default Costs                          DB Table: settings    │  │
│  │ - default_submission_cost: ₦200       │ key: 'default_submission_cost'   │
│  │ - default_test_cost: ₦50              │ value: 200 or 50     │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ↓                               ↓
    ┌────────────────────┐        ┌────────────────────┐
    │   Lecturer         │        │   Lecturer         │
    │ Create Assignment  │        │  Create Test       │
    │                    │        │                    │
    │ Load default cost  │        │ Load default cost  │
    │ Pass to action     │        │ Pass to action     │
    └────────┬───────────┘        └────────┬───────────┘
             │                             │
             ↓                             ↓
    ┌────────────────────┐        ┌────────────────────┐
    │ DB: assignments    │        │ DB: tests          │
    │ - submission_cost  │        │ - access_cost      │
    │ - is_standalone    │        │ - course_id (new)  │
    │ - course_id (new)  │        └────────┬───────────┘
    └────────┬───────────┘                 │
             │                             │
             ↓                             ↓
    ┌────────────────────┐        ┌────────────────────┐
    │   Student          │        │   Student          │
    │ Submit Assignment  │        │  Take Test         │
    │                    │        │                    │
    │ Read cost from DB  │        │ Read cost from DB  │
    │ Check balance      │        │ Check balance      │
    └────────┬───────────┘        └────────┬───────────┘
             │                             │
             └──────────┬──────────────────┘
                        ↓
            ┌──────────────────────────────┐
            │ processSubmissionPayment()   │
            │                              │
            │ - Deduct from student wallet │
            │ - Credit lecturer wallet     │
            │ - Record transactions        │
            │ - Update earnings            │
            │ - Send notifications         │
            └──────────┬───────────────────┘
                       │
           ┌───────────┼───────────┐
           ↓           ↓           ↓
    ┌────────────┐ ┌──────────┐ ┌─────────────┐
    │ wallets    │ │transactions  │ │ notifications    │
    │ (balances) │ │ (history)    │ │ (user updates)   │
    └────────────┘ └──────────┘ └─────────────┘
```

---

## Changes Summary

### File: `src/app/lecturer/courses/[id]/tests/create/page.tsx`
- ➕ Added import: `getDefaultTestCost`
- ➕ Added state: `defaultTestCost`
- 🔧 Modified `loadCourse()`: Fetch and set default cost
- 🔧 Modified test creation: Use `access_cost: defaultTestCost` instead of `0`
- ➕ Added info box: Display cost to lecturer

### File: `src/lib/actions/assignment.actions.ts`
- ✏️ REWROTE `createAssignment()` function
- ✅ Now properly creates course-based assignments
- ✅ Sets `is_standalone: false`
- ✅ Sets `course_id` correctly
- ✅ Verifies lecturer has course access

---

## Testing Commands

```bash
# Check assignments table structure
SELECT 
  id, title, is_standalone, course_id, 
  submission_cost, created_at
FROM assignments 
WHERE is_standalone = false
LIMIT 5;

# Check tests table structure  
SELECT 
  id, title, is_standalone, course_id, 
  access_cost, created_at
FROM tests
WHERE is_standalone = false
LIMIT 5;

# Check transactions for course items
SELECT 
  id, purpose, type, amount,
  metadata
FROM transactions
WHERE purpose IN ('assignment_payment', 'test_payment')
ORDER BY created_at DESC
LIMIT 10;
```

---

## Completion Status

✅ All required fixes implemented
✅ No database migrations needed
✅ Backward compatible with existing data
✅ Ready for testing
