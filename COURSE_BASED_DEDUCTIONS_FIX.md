# Course-Based Assignment & Test Cost Deductions Fix

## Summary
Fixed cost deduction issues for course-based assignments and tests to match the working standalone implementation. The issue was that course-based items weren't properly loading and applying the default submission/access costs from admin settings.

## Problem Statement
- **Standalone Assignments**: Cost deductions were working correctly ✅
- **Standalone Tests**: Cost deductions were working correctly ✅  
- **Course-Based Assignments**: Costs were NOT being deducted during submission ❌
- **Course-Based Tests**: Costs were NOT being deducted during attempt ❌

**Root Causes:**
1. **Course-Based Tests**: The `access_cost` was hardcoded to `0` instead of using the default cost from admin settings
2. **Course-Based Assignments**: The creation function wasn't properly distinguishing between standalone and course-based assignments

## Changes Made

### 1. Fixed Course-Based Test Creation
**File:** `src/app/lecturer/courses/[id]/tests/create/page.tsx`

**Changes:**
- Added import for `getDefaultTestCost` from settings actions
- Added state variable `defaultTestCost` to track the admin-set cost
- Updated `loadCourse()` function to fetch default test cost from admin settings
- Changed `access_cost: 0` → `access_cost: defaultTestCost` in test creation payload
- Added info card displaying the test access cost to students (for transparency)

**Before:**
```typescript
// access_cost was hardcoded to 0
access_cost: 0,
```

**After:**
```typescript
// Loads from admin settings and uses actual default cost
const [defaultTestCost, setDefaultTestCost] = useState(50)

// In loadCourse():
const cost = await getDefaultTestCost()
setDefaultTestCost(cost)

// In test creation:
access_cost: defaultTestCost,
```

### 2. Fixed Course-Based Assignment Creation Logic
**File:** `src/lib/actions/assignment.actions.ts`

**Changes:**
- Completely rewrote the `createAssignment()` function
- Now properly creates course-based assignments (not disguised as standalone)
- Sets `is_standalone: false` for course assignments
- Properly sets `course_id` field for database linking
- Verifies lecturer has access to the course before creation
- Uses service client for database operations
- Includes proper error handling and path revalidation

**Before:**
```typescript
export async function createAssignment(formData: {
  courseId: string
  // ... other fields
}) {
  // Just passed everything to createStandaloneAssignment
  // which set is_standalone: true ❌
  return await createStandaloneAssignment({
    displayCourseCode: '',
    displayCourseTitle: '',
    ...formData,
    submissionCost: formData.submissionCost || 0
  })
}
```

**After:**
```typescript
export async function createAssignment(formData: {
  courseId: string
  title: string
  // ... other fields
  submissionCost?: number
}) {
  const user = await getCurrentUser()
  const supabase = await createClient()
  const adminClient = createServiceClient()

  // Verify lecturer access to course
  const { data: courseAccess } = await supabase
    .from('course_lecturers')
    .select('id')
    .eq('course_id', formData.courseId)
    .eq('lecturer_id', user.id)
    .single()

  if (!courseAccess) {
    return { error: 'You do not have access to this course', success: false }
  }

  // Create course-based assignment (NOT standalone)
  const { data: assignment, error } = await adminClient
    .from('assignments')
    .insert({
      created_by: user.id,
      is_standalone: false,  // ✅ Correctly set to false
      course_id: formData.courseId,  // ✅ Properly linked to course
      title: formData.title,
      // ... other fields
      submission_cost: formData.submissionCost || 0,  // ✅ Uses provided cost
      is_published: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Course assignment creation error:', error)
    return { error: error.message, success: false }
  }

  revalidatePath(`/lecturer/courses/${formData.courseId}`)
  return { success: true, assignment }
}
```

### 3. Course-Based Assignment Creation Page
**File:** `src/app/lecturer/courses/[id]/assignments/create/page.tsx`

**Status:** ✅ Already correctly implemented
- Already loads `defaultSubmissionCost` from admin settings
- Already passes `submissionCost: defaultSubmissionCost` to `createAssignment()`
- Already displays submission cost to lecturer in info box

## How Cost Deductions Now Work

### For Course-Based Tests:
1. Lecturer creates test in course → loads default `access_cost` from admin settings ✅
2. Student attempts test → `access_cost` is checked and deducted ✅
3. Transaction created with `purpose: 'test_payment'` ✅
4. Lecturer receives earnings split ✅

### For Course-Based Assignments:
1. Lecturer creates assignment in course → loads default `submission_cost` ✅
2. Student submits assignment → `submission_cost` is deducted ✅
3. Transaction created with `purpose: 'assignment_payment'` ✅
4. Lecturer receives earnings split ✅

## Database Changes
No database schema changes required. The existing `assignments` and `tests` tables already support:
- `is_standalone` boolean field (now properly used)
- `course_id` foreign key (now properly set)
- `submission_cost` and `access_cost` fields (now properly populated)

## Payment Processing Flow
Both standalone and course-based items use the same `processSubmissionPayment()` function which:
1. ✅ Deducts cost from student wallet
2. ✅ Credits lecturer wallet with revenue share
3. ✅ Creates transaction records
4. ✅ Records lecturer earnings
5. ✅ Handles partner revenue splits
6. ✅ Sends notifications

## Testing Checklist

- [ ] Create course-based test → verify `access_cost` shows correct admin default
- [ ] Student attempts course test → verify cost deducted from wallet
- [ ] Check transaction history (student side) → verify course test payment shows
- [ ] Check transaction history (lecturer side) → verify course test earnings shows
- [ ] Create course-based assignment → verify `submission_cost` shows correct admin default
- [ ] Student submits course assignment → verify cost deducted from wallet
- [ ] Check transaction history (student side) → verify course assignment payment shows
- [ ] Check transaction history (lecturer side) → verify course assignment earnings shows
- [ ] Check admin analytics → verify both standalone and course-based items are tracked correctly

## Files Modified
1. `src/app/lecturer/courses/[id]/tests/create/page.tsx`
2. `src/app/lecturer/courses/[id]/assignments/create/page.tsx` (already correct, no changes)
3. `src/lib/actions/assignment.actions.ts`

## Backward Compatibility
✅ All changes are backward compatible:
- Standalone assignments still work as before (use `createStandaloneAssignment()`)
- Standalone tests still work as before (use `createStandaloneTest()`)
- Student submission flows unchanged
- Payment processing unchanged
- Only difference: course-based items now properly track costs
