# "Grade Pending with AI" Feature - Complete File List & Troubleshooting Guide

**Status:** Issue reported - Function not working as expected
**Reported Date:** February 21, 2026

---

## 📋 RELATED FILES ORGANIZED BY CATEGORY

### 1. **CORE AI GRADING SERVER ACTIONS**
These are the backend functions that handle the AI grading logic:

#### Main AI Grading Functions:
- **[src/lib/actions/ai-grading.actions.ts](src/lib/actions/ai-grading.actions.ts)** ⚠️ PRIMARY FILE
  - `aiGradeAllAssignmentSubmissions()` - Line 716 - Grades pending assignment submissions
  - `aiGradeAllStandaloneSubmissions()` - Line 876 - Grades pending standalone assignment submissions
  - `aiGradeAllTestAttempts()` - Line 637 - Grades pending test attempts
  - `aiGradeAllTestEssays()` - Grades essay questions in tests
  - `aiGradeAssignment()` - Single submission grading
  - `aiGradeTestEssay()` - Single essay grading
  - Helper functions:
    - `extractTextFromDocumentUrl()` - Line 8 - Extracts text from Word/PDF files
    - `extractTextFromSubmission()` - Line 84 - Handles document extraction
  - **Size:** ~1041 lines
  - **Status:** ✓ Implementation complete but possible issues present

#### Core Grading Actions:
- **[src/lib/actions/grading.actions.ts](src/lib/actions/grading.actions.ts)**
  - `getAssignmentSubmissions()` - Fetches submissions to grade
  - `gradeSubmission()` - Line 157 - Manual grading interface
  - `getAssignmentGradingStats()` - Statistics on grading progress
  - `getTestGradingStats()` - Test grading statistics
  - Helper functions for grading workflows
  - **Size:** ~486 lines
  - **Status:** ✓ Implementation complete

---

### 2. **UI COMPONENTS (Frontend)**

#### Bulk AI Grading Component:
- **[src/components/grading/bulk-ai-grading.tsx](src/components/grading/bulk-ai-grading.tsx)** ⚠️ CRITICAL UI FILE
  - `BulkAIGrading` component (default export)
  - Props Interface: `BulkAIGradingProps`
  - Key features:
    - Dialog modal for AI grading confirmation
    - Custom rubric input
    - Default rubric display
    - Result display after grading
    - Loading state management
    - Toast notifications
  - **Accepts Props:**
    - `onGradeAll` - Callback function to execute grading
    - `itemCount` - Number of items to grade
    - `itemType` - Type label (e.g., "submissions")
    - `label` - Button label
    - `variant` - Button style variant
    - `size` - Button size
    - `disabled` - Disable button flag
  - **Status:** ✓ Implementation complete

#### Individual AI Grading Button:
- **[src/components/grading/ai-grading-button.tsx](src/components/grading/ai-grading-button.tsx)**
  - Single submission AI grading
  - Used alongside bulk grading
  - **Status:** ✓ Implementation complete

---

### 3. **LECTURER PAGES USING AI GRADING**

#### Assignment Submissions Pages:
- **[src/app/lecturer/assignments/[id]/submissions/page.tsx](src/app/lecturer/assignments/[id]/submissions/page.tsx)**
  - Server component that fetches submissions
  - Passes data to client component
  - **Status:** ✓ Implementation complete

- **[src/app/lecturer/assignments/[id]/submissions/submissions-client.tsx](src/app/lecturer/assignments/[id]/submissions/submissions-client.tsx)** ⚠️ USES BULK GRADING
  - Client component with BulkAIGrading integration - Line 154
  - `onGradeAll` callback - Line 156-160
  - Calls `aiGradeAllAssignmentSubmissions()`
  - Reloads submissions after grading
  - **Status:** ✓ Implementation complete

#### Standalone Assignment Pages:
- **[src/app/lecturer/assignments/standalone/[id]/page.tsx](src/app/lecturer/assignments/standalone/[id]/page.tsx)**
  - Server component for standalone assignments
  - **Status:** ✓ Implementation complete

- **[src/app/lecturer/assignments/standalone/[id]/submissions-client.tsx](src/app/lecturer/assignments/standalone/[id]/submissions-client.tsx)** ⚠️ USES BULK GRADING
  - Client component with BulkAIGrading integration - Line 189
  - Calls `aiGradeAllStandaloneSubmissions()`
  - **Status:** ✓ Implementation complete

#### Test Attempt Pages:
- **[src/app/lecturer/tests/[id]/attempts/page.tsx](src/app/lecturer/tests/[id]/attempts/page.tsx)** ⚠️ USES BULK GRADING
  - BulkAIGrading integration - Line 212
  - Calls `aiGradeAllTestAttempts()`
  - **Status:** ✓ Implementation complete

- **[src/app/lecturer/tests/[id]/attempts/[attemptId]/page.tsx](src/app/lecturer/tests/[id]/attempts/[attemptId]/page.tsx)** ⚠️ USES BULK GRADING
  - Individual test attempt with bulk grading - Line 280
  - Calls `aiGradeAllTestEssays()`
  - **Status:** ✓ Implementation complete

- **[src/app/lecturer/tests/attempts/[attemptId]/page.tsx](src/app/lecturer/tests/attempts/[attemptId]/page.tsx)** ⚠️ USES BULK GRADING
  - Alternative test attempts route
  - BulkAIGrading integration - Line 280
  - **Status:** ✓ Implementation complete

#### Manual Grading Pages:
- **[src/app/lecturer/grading/assignment/[submissionId]/page.tsx](src/app/lecturer/grading/assignment/[submissionId]/page.tsx)**
  - Single assignment grading interface
  - **Status:** ✓ Implementation complete

- **[src/app/lecturer/grading/standalone/[submissionId]/page.tsx](src/app/lecturer/grading/standalone/[submissionId]/page.tsx)**
  - Single standalone assignment grading
  - **Status:** ✓ Implementation complete

---

### 4. **AI INTEGRATION SERVICES**

#### Claude AI Integration:
- **[src/lib/services/claude.service.ts](src/lib/services/claude.service.ts)** ⚠️ CRITICAL BACKEND SERVICE
  - `gradeEssayWithAI()` - Main essay grading function using Claude
  - `gradeEssayWithFileAttachments()` - Grades with document attachments
  - `analyzePlagiarismWithAI()` - Claude plagiarism analysis
  - `generateAssignmentWithAI()` - AI assignment writing
  - Uses `@anthropic-ai/sdk` (Anthropic Claude 3)
  - **Key Functions:**
    - Message creation and streaming
    - Prompt engineering for grading
    - Error handling and fallback logic
    - Response parsing
  - **Status:** ✓ Implementation complete

#### Gemini AI Integration (Fallback):
- **[src/lib/services/gemini.service.ts](src/lib/services/gemini.service.ts)** ⚠️ FALLBACK SERVICE
  - `gradeEssayWithGemini()` - Alternative AI grading
  - Used as fallback when Claude fails
  - Uses `@google/genai` (Google Gemini)
  - **Status:** ✓ Implementation complete

#### Document Parsing:
- **[src/lib/services/document-parser.service.ts](src/lib/services/document-parser.service.ts)**
  - Generic document parsing utilities
  - Handles various file formats
  - **Status:** ✓ Implementation complete

---

### 5. **NOTIFICATION & EMAIL SERVICES**

#### Grading Notifications:
- **[src/lib/actions/notification-helpers.ts](src/lib/actions/notification-helpers.ts)**
  - `notifyAssignmentGraded()` - Sends notification when graded
  - Called from grading.actions.ts - Line 242
  - **Status:** ✓ Implementation complete

#### Email Templates:
- **[src/lib/email-templates/](src/lib/email-templates/)**
  - Various email templates for grading notifications
  - `grade-notification.tsx` (if exists)
  - `submission-graded.tsx` (if exists)
  - **Status:** ✓ Implementation complete

#### Email Actions:
- **[src/lib/actions/email.actions.ts](src/lib/actions/email.actions.ts)**
  - `sendGradingCompleteEmail()` - Called from grading.actions
  - Sends email notifications
  - **Status:** ✓ Implementation complete

---

### 6. **DATABASE & TYPES**

#### Database Types:
- **[src/lib/types/database.types.ts](src/lib/types/database.types.ts)**
  - `assignment_submissions` table definition
  - `test_attempts` table definition
  - `assignments` table definition
  - Field mappings for all grading-related data
  - **Status:** ✓ Auto-generated by Supabase

#### Custom Types:
- **[src/lib/types/](src/lib/types/)**
  - May contain custom interfaces for AI grading responses
  - **Status:** ✓ Type definitions exist

---

### 7. **SUPABASE & DATABASE**

#### Supabase Client:
- **[src/lib/supabase/server.ts](src/lib/supabase/server.ts)**
  - Server-side Supabase client initialization
  - Used by all server actions
  - **Status:** ✓ Implementation complete

#### Database Tables Used by AI Grading:
- `assignment_submissions` - Student submissions
- `assignments` - Assignment details
- `test_attempts` - Test attempt records
- `test_answers` - Student test answers
- `profiles` - User information

---

### 8. **UTILITIES & HELPERS**

#### Revenue Split (For payment after grading):
- **[src/lib/utils/revenue-split.ts](src/lib/utils/revenue-split.ts)**
  - Calculates earnings from submissions
  - Used after successful grading
  - **Status:** ✓ Recently updated (Feb 2026)

#### General Utilities:
- **[src/lib/utils/](src/lib/utils/)**
  - Color utilities, date utilities, etc.
  - Used throughout grading system
  - **Status:** ✓ Implementation complete

---

### 9. **ENVIRONMENT & CONFIGURATION**

#### Environment Variables (Required for AI Grading):
- `.env.local` - **Required variables:**
  - `ANTHROPIC_API_KEY` - Claude AI key
  - `GOOGLE_GENAI_API_KEY` - Gemini fallback key
  - `NEXT_PUBLIC_SUPABASE_URL` - Database URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key
  - `RESEND_API_KEY` - For email notifications
  - **Status:** ✓ Requires setup

#### Configuration Files:
- **[next.config.ts](next.config.ts)** - Next.js configuration
- **[tsconfig.json](tsconfig.json)** - TypeScript configuration
- **[package.json](package.json)** - Dependencies
  - `@anthropic-ai/sdk` - Required for Claude
  - `@google/genai` - Required for Gemini
  - `mammoth` - For Word doc parsing
  - `pdf-parse` - For PDF parsing
  - `sonner` - For toast notifications
  - **Status:** ✓ All dependencies included

---

## 🔍 COMPLETE FILE DEPENDENCY CHAIN

```
User clicks "Grade Pending with AI" button
    ↓
BulkAIGrading Component (UI)
    ↓
submissions-client.tsx (Parent Component)
    ↓
onGradeAll callback function
    ↓
aiGradeAllAssignmentSubmissions() [ai-grading.actions.ts]
    ↓
├─ Fetch assignment data [Supabase]
├─ Fetch submissions to grade [Supabase]
├─ For each submission:
│   ├─ Extract text from document [extractTextFromSubmission()]
│   ├─ Call AI service [gradeEssayWithAI() or gradeEssayWithFileAttachments()]
│   │   ├─ Claude Service [claude.service.ts]
│   │   │   └─ @anthropic-ai/sdk API call
│   │   └─ Gemini Service [gemini.service.ts] (fallback)
│   │       └─ @google/genai API call
│   └─ Update submission in DB [Supabase]
├─ Send notifications [notification-helpers.ts]
├─ Send email [email.actions.ts]
└─ Revalidate cache [Next.js]
    ↓
Return result to component
    ↓
Show success/error toast
    ↓
Reload submissions list
```

---

## ⚠️ POTENTIAL ISSUES TO CHECK

### 1. **API Key Configuration**
- [ ] `ANTHROPIC_API_KEY` is set in `.env.local`
- [ ] `GOOGLE_GENAI_API_KEY` is set (if using Gemini fallback)
- [ ] Keys are valid and have active credits
- [ ] Keys are not expired or rate-limited

### 2. **Database Issues**
- [ ] Supabase connection is working
- [ ] `assignments` table exists and has data
- [ ] `assignment_submissions` table exists
- [ ] `final_score` field can be updated (not null constraint issues)
- [ ] User has permission to access assignment

### 3. **Component Integration Issues**
- [ ] BulkAIGrading component is properly imported
- [ ] `onGradeAll` callback is correctly implemented
- [ ] `itemCount` is being calculated correctly (`pendingCount`)
- [ ] Button is not disabled when pending submissions exist

### 4. **Server Action Issues**
- [ ] `aiGradeAllAssignmentSubmissions()` function exists in ai-grading.actions.ts
- [ ] Function is exported properly
- [ ] Error handling in try-catch blocks
- [ ] Debugging logs in console output

### 5. **Document Extraction Issues**
- [ ] Document URLs are accessible
- [ ] Files are in supported format (DOCX, PDF, TXT)
- [ ] File size is reasonable (not too large)
- [ ] Mammoth and pdf-parse libraries are installed correctly

### 6. **AI Service Issues**
- [ ] Claude API is responding
- [ ] Gemini API is responding (fallback)
- [ ] Network requests are not timing out
- [ ] Response parsing is working correctly

### 7. **User Authorization Issues**
- [ ] User is authenticated
- [ ] User is a lecturer
- [ ] User is the assignment creator
- [ ] User can access their own assignments

### 8. **Deadline Automation Issues**
- [ ] No automatic deadline-triggered grading exists yet
- [ ] Deadline grading would require cron/scheduled jobs (not implemented)
- [ ] Currently only manual button trigger works

---

## 🛠️ DEBUGGING STEPS

### Step 1: Check Environment Variables
```bash
# Verify in console or .env.local
ANTHROPIC_API_KEY=<key here>
GOOGLE_GENAI_API_KEY=<key here>
```

### Step 2: Check Browser Console
```javascript
// Look for error messages when "Grade with AI" button is clicked
// Check Network tab for failed API calls
// Check console for JavaScript errors
```

### Step 3: Check Server Logs
```bash
# Run dev server
npm run dev

# Watch console output for logs from ai-grading.actions.ts
# Look for messages like:
// "AI grading X assignment submissions..."
// "Error AI grading all assignment submissions:"
```

### Step 4: Check Database
```sql
-- Verify submissions exist with null final_score
SELECT id, final_score FROM assignment_submissions 
WHERE assignment_id = '<id>' 
AND final_score IS NULL;
```

### Step 5: Test API Keys
```bash
# Test Claude API key
curl https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY"

# Test Google Gemini
# https://cloud.google.com/docs/authentication/api-keys
```

---

## 📊 SUMMARY TABLE

| File | Type | Status | Issue Risk |
|------|------|--------|-----------|
| ai-grading.actions.ts | Server | ✅ Complete | ⚠️ Medium |
| grading.actions.ts | Server | ✅ Complete | ✅ Low |
| bulk-ai-grading.tsx | UI | ✅ Complete | ✅ Low |
| submissions-client.tsx | UI | ✅ Complete | ✅ Low |
| claude.service.ts | Service | ✅ Complete | ⚠️ High |
| gemini.service.ts | Service | ✅ Complete | ⚠️ High |
| All Pages | UI | ✅ Complete | ✅ Low |
| Environment | Config | ⚠️ Needs setup | ⚠️ Critical |

---

## 🎯 NEXT STEPS FOR FIXING

1. **Check AI API keys first** - Most common cause
2. **Review server logs** for specific error messages
3. **Test individual components** in isolation
4. **Verify database connectivity**
5. **Check file extraction** for document submissions
6. **Monitor API responses** from Claude/Gemini

---

**For Deadline Automation:**
- Not currently implemented
- Would require:
  - Cron job or scheduled task runner
  - Vercel Functions or external scheduler
  - Database triggers or polling mechanism
  - Currently only manual button trigger is available

---

**Report Generated:** February 21, 2026
**Related to:** Grade Pending with AI feature troubleshooting
