# ASSESSIFY - Complete File Inventory

**Version:** 2.0  
**Date:** March 26, 2026  
**Purpose:** Comprehensive reference of all application files with paths, descriptions, and relationships

---

## Table of Contents

1. [Backend Services](#backend-services)
2. [Server Actions](#server-actions)
3. [UI Components](#ui-components)
4. [Pages & Routes](#pages--routes)
5. [Type Definitions](#type-definitions)
6. [Email Templates](#email-templates)
7. [Utilities & Helpers](#utilities--helpers)
8. [Supabase Integration](#supabase-integration)
9. [Hooks & Context](#hooks--context)
10. [Configuration Files](#configuration-files)
11. [Root Files](#root-files)

---

## Backend Services

External service integrations and business logic engines.

### AI Services

#### `src/lib/services/claude.service.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Claude API integration for AI-powered essay grading
- **Functions:**
  - `gradeEssayWithAI()` - Grade essay with custom rubric
  - `gradeEssayWithFileAttachments()` - Grade using file API
  - `extractQuestionsFromText()` - Parse document for questions
  - `generateFeedback()` - Generate constructive feedback
- **Key Dependencies:** `@anthropic-ai/sdk`
- **Related Files:** 
  - `src/lib/actions/ai-grading.actions.ts` (uses this service)
  - `src/lib/actions/assignment-ai.actions.ts` (AI assignment features)

#### `src/lib/services/gemini.service.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Google Gemini AI fallback integration for grading
- **Functions:**
  - `gradeEssayWithGemini()` - Grade using Gemini API
  - `extractFromDocument()` - Extract text from documents
- **Key Dependencies:** `@google/genai`
- **Related Files:**
  - `src/lib/services/claude.service.ts` (fallback chain)
  - `src/lib/actions/ai-grading.actions.ts` (calls if Claude fails)

#### `src/lib/services/assignment-ai.service.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Assignment-specific AI operations and question extraction
- **Functions:**
  - `extractAssignmentFromDocument()` - Parse assignment files
  - `generateAssignmentGuidance()` - AI-powered assignment creation help
- **Key Dependencies:** `claude.service.ts`, `document-parser.service.ts`
- **Related Files:** `src/lib/actions/assignment-ai.actions.ts`

### Document Processing

#### `src/lib/services/document-parser.service.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Parse various document formats (PDF, DOCX, TXT, images)
- **Functions:**
  - `parseDocumentUrl()` - Download and extract from Supabase URL
  - `parsePDF()` - Extract text from PDF
  - `parseDOCX()` - Extract text from Word documents
  - `parsePlainText()` - Handle text files
  - `combineExtractedText()` - Merge multiple extractions
- **Key Dependencies:** `pdf-parse`, `mammoth`
- **Related Files:**
  - `src/lib/services/claude.service.ts` (uses for essay extraction)
  - `src/lib/actions/document-import.actions.ts` (bulk imports)

### Payment Processing

#### `src/lib/services/paystack.service.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Paystack payment gateway integration
- **Functions:**
  - `initializePaystackTransaction()` - Create payment link
  - `verifyPaystackTransaction()` - Verify payment status
  - `formatAmountToKobo()` - Convert NGN to kobo
  - `formatAmountFromKobo()` - Convert kobo to NGN
  - `handlePaystackEvent()` - Process webhook events
- **Key Dependencies:** Paystack REST API
- **Related Files:**
  - `src/lib/actions/payment.actions.ts` (high-level payment logic)
  - `src/app/api/payments/paystack/` (webhook endpoints)

### Email Service

#### `src/lib/services/resend.service.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Resend transactional email service integration
- **Functions:**
  - `sendEmail()` - Send single email
  - `sendBulkEmails()` - Send to multiple recipients
  - `getEmailStatus()` - Check delivery status
- **Key Dependencies:** `resend` package
- **Related Files:**
  - `src/lib/actions/email.actions.ts` (email sending wrapper)
  - `src/lib/email-templates/` (all email templates)

### Academic Integrity

#### `src/lib/services/plagiarism.service.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Text similarity detection and plagiarism flagging
- **Functions:**
  - `calculateCosineSimilarity()` - Compare text vectors
  - `detectPlagiarism()` - Find matching submissions
  - `extractMatchingSnippets()` - Get matching text segments
  - `generatePlagiarismReport()` - Create detailed report
- **Key Dependencies:** NLP utilities (in-house implementation)
- **Related Files:**
  - `src/lib/actions/plagiarism.actions.ts` (orchestrates detection)
  - `src/components/lecturer/plagiarism-review-client.tsx` (UI for review)

---

## Server Actions

Server-side business logic executed from client components (Next.js 13+).

### Authentication & Users

#### `src/lib/actions/auth.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Authentication workflow - signup, login, password management
- **Functions:**
  - `signUp()` - Register new user
  - `login()` - User login
  - `logout()` - Clear session
  - `getCurrentUser()` - Get authenticated user
  - `resetPassword()` - Initiate password reset
  - `updatePassword()` - Change password
  - `updateProfile()` - Update user information
- **Related Files:**
  - `src/app/auth/signup/page.tsx` (signup page)
  - `src/app/auth/login/page.tsx` (login page)
  - `src/lib/actions/admin-auth.actions.ts` (admin account management)

#### `src/lib/actions/admin-auth.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Admin account creation and authentication management
- **Functions:**
  - `createAdminUser()` - Create admin account
  - `verifyAdminAccess()` - Check admin permissions
  - `resetAdminPassword()` - Admin password reset
- **Related Files:** `src/lib/actions/auth.actions.ts`

### Assignment Management

#### `src/lib/actions/assignment.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Core assignment CRUD operations and management
- **Functions:**
  - `createAssignment()` - Create course assignment
  - `getAssignmentById()` - Fetch single assignment
  - `getAssignmentsByLecturer()` - Lecturer's assignments
  - `getAssignmentsByStudent()` - Student's enrolled assignments
  - `updateAssignment()` - Modify assignment
  - `deleteAssignment()` - Soft delete
  - `getAssignmentSubmissions()` - Get all submissions
  - `publishAssignment()` - Make visible to students
  - `getStandaloneAssignmentByCode()` - Fetch by access code
- **Related Files:**
  - `src/lib/actions/standalone-assignment.actions.ts` (shareable version)
  - `src/lib/actions/submission.actions.ts` (student submissions)
  - `src/app/lecturer/assignments/` (UI pages)

#### `src/lib/actions/standalone-assignment.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Standalone assignment operations (shareable via access code)
- **Functions:**
  - `createStandaloneAssignment()` - Create shareable assignment
  - `generateAccessCode()` - Create unique 8-char code
  - `getStandaloneAssignmentByCode()` - Fetch public
  - `validateAccessCode()` - Verify code is valid
  - `getStandaloneSubmissions()` - All submissions for standalone
- **Related Files:** `src/lib/actions/assignment.actions.ts`

#### `src/lib/actions/assignment-ai.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** AI features for assignments - auto-grading, guidance
- **Functions:**
  - `generateAssignmentIdeas()` - AI-powered assignment creation
  - `suggestRubric()` - Auto-generate grading rubric
  - `improvementSuggestions()` - Enhance assignment
- **Related Files:**
  - `src/lib/actions/assignment.actions.ts`
  - `src/lib/services/assignment-ai.service.ts`

### Student Submissions

#### `src/lib/actions/submission.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Student assignment submission workflow
- **Functions:**
  - `submitAssignment()` - Submit work (main entry point)
  - `validateSubmission()` - Check deadline, enrollment, format
  - `getStudentSubmission()` - Fetch single submission
  - `getStudentSubmissions()` - All submissions for student
  - `updateSubmissionStatus()` - Change status
  - `withdrawSubmission()` - Student withdraws submission
  - `checkCanSubmit()` - Verify submission eligibility
- **Related Files:**
  - `src/lib/actions/assignment.actions.ts` (parent)
  - `src/lib/actions/transaction.actions.ts` (payment deduction)
  - `src/lib/actions/email.actions.ts` (confirmation email)

### Grading

#### `src/lib/actions/grading.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Manual grading workflow for lecturers
- **Functions:**
  - `getSubmissionsForGrading()` - Get ungraded submissions
  - `gradeSubmission()` - Save manual grade and feedback
  - `saveAiGradingSuggestion()` - Store AI recommendation
  - `updateGrade()` - Modify existing grade
  - `getGradingStats()` - Progress metrics
  - `getSubmissionById()` - Fetch for grading
  - `applyLatePenalty()` - Calculate late submission deduction
- **Related Files:**
  - `src/lib/actions/ai-grading.actions.ts` (AI grades)
  - `src/lib/actions/email.actions.ts` (grade notification)
  - `src/components/grading/` (UI components)

#### `src/lib/actions/ai-grading.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** AI-powered essay grading orchestration
- **Functions:**
  - `aiGradeSingleSubmission()` - Grade one essay
  - `aiGradeAllSubmissions()` - Batch grade entire assignment
  - `extractTextFromDocumentUrl()` - Parse submission files
  - `getGradeWithFallback()` - Try Claude → Gemini
  - `validateGradeScore()` - Ensure score in range
  - `generateEssayFeedback()` - Create feedback text
- **Dependencies:** `claude.service.ts`, `gemini.service.ts`, `document-parser.service.ts`
- **Related Files:**
  - `src/lib/actions/grading.actions.ts` (parent)
  - `src/components/grading/ai-grading-button.tsx` (UI)

### Test & CBT Management

#### `src/lib/actions/test.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Test creation and management (CBT style tests)
- **Functions:**
  - `createTest()` - Create new test
  - `getTestById()` - Fetch test details
  - `getTestsByLecturer()` - Lecturer's tests
  - `getStudentAvailableTests()` - Tests student can take
  - `updateTest()` - Modify test
  - `deleteTest()` - Soft delete
  - `publishTest()` - Make visible to students
  - `generateAccessCode()` - Create test code
- **Related Files:**
  - `src/lib/actions/question.actions.ts` (test questions)
  - `src/lib/actions/attempt.actions.ts` (test attempts)
  - `src/app/tests/` (test pages)

#### `src/lib/actions/question.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Test question CRUD operations
- **Functions:**
  - `addQuestion()` - Add question to test
  - `updateQuestion()` - Modify question
  - `deleteQuestion()` - Remove question
  - `getQuestionsByTest()` - Fetch all test questions
  - `reorderQuestions()` - Change question order
  - `getRandomQuestions()` - For shuffled tests
- **Related Files:** `src/lib/actions/test.actions.ts`

#### `src/lib/actions/attempt.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Test attempt tracking and answer submission
- **Functions:**
  - `startTestAttempt()` - Begin test
  - `submitAnswer()` - Record single answer
  - `completeAttempt()` - Finish test
  - `getAttemptResults()` - Fetch scores
  - `getStudentAttempts()` - All test history
  - `calculateTestScore()` - Grade test
- **Related Files:**
  - `src/lib/actions/test.actions.ts`
  - `src/app/tests/[code]/take/` (test-taking UI)

#### `src/lib/actions/student-cbt-practice.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** CBT practice session management for students
- **Functions:**
  - `startPracticeSession()` - Begin practice
  - `getPracticeQuestions()` - Load questions
  - `submitAnswer()` - Record answer
  - `completePracticeSession()` - End session, calculate score
  - `getPracticeHistory()` - Student's past sessions
  - `getPerformanceStats()` - Analytics data
- **Related Files:**
  - `src/lib/actions/student-cbt-purchase.actions.ts` (access check)
  - `src/app/student/cbt/practice/` (UI pages)

#### `src/lib/actions/student-cbt-purchase.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** CBT bundle purchasing and subscription management
- **Functions:**
  - `getAvailableBundles()` - Fetch purchasable bundles
  - `purchaseBundle()` - Buy bundle with wallet/Paystack
  - `applyPromoCode()` - Validate and apply discount
  - `getStudentSubscriptions()` - Purchased bundles
  - `checkBundleAccess()` - Verify subscription is active
  - `extendSubscription()` - Renew bundle
- **Related Files:**
  - `src/lib/actions/promo-codes.actions.ts` (discount validation)
  - `src/lib/actions/payment.actions.ts` (payment processing)
  - `src/app/student/cbt/` (purchase & practice pages)

#### `src/lib/actions/cbt-leaderboard.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** CBT leaderboard and ranking system
- **Functions:**
  - `getGlobalLeaderboard()` - Top performers overall
  - `getCourseLeaderboard()` - Top per course
  - `getStudentRank()` - Student's ranking
  - `getLeaderboardStats()` - Summary statistics
  - `generateLeaderboardReport()` - Export leaderboard
- **Related Files:** `src/components/cbt/LeaderboardTable.tsx`

#### `src/lib/actions/test-export.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Export test results and data
- **Functions:**
  - `exportTestResultsCSV()` - CSV format export
  - `exportAnswerShowCase()` - Student answers
  - `generateTestReport()` - PDF report
- **Related Files:** `src/lib/actions/test.actions.ts`

### Course Management

#### `src/lib/actions/course.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Course creation, enrollment, and management
- **Functions:**
  - `createCourse()` - Create new course
  - `getCoursesById()` - Fetch course details
  - `getLecturerCourses()` - Lecturer's courses
  - `getStudentCourses()` - Enrolled courses
  - `updateCourse()` - Modify course
  - `deleteCourse()` - Soft delete course
  - `enrollStudent()` - Register student in course
  - `getCourseEnrollments()` - List enrolled students
  - `unenrollStudent()` - Remove from course
- **Related Files:**
  - `src/lib/actions/assignment.actions.ts` (assignments in courses)
  - `src/app/lecturer/courses/` & `src/app/student/courses/` (UI)

### Wallet & Financial

#### `src/lib/actions/wallet.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** User wallet operations
- **Functions:**
  - `getUserWallet()` - Get wallet by user
  - `getWalletSummary()` - Quick balance summary
  - `updateWalletBalance()` - Direct balance update
  - `getOrCreateWallet()` - Ensure wallet exists
  - `getWalletTransactions()` - Transaction history
  - `getWalletStatistics()` - Spending/earning stats
- **Related Files:**
  - `src/lib/actions/transaction.actions.ts` (creates transactions)
  - `src/lib/actions/payment.actions.ts` (funding)
  - `src/app/wallet/` (UI pages)

#### `src/lib/actions/transaction.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Core financial transaction engine
- **Functions:**
  - `processSubmissionPayment()` - Deduct student, credit lecturer + partner
  - `calculateRevenueSplit()` - Split: 50% platform, 35% lecturer, 15% partner
  - `recordTransaction()` - Log single transaction
  - `recordPartnerEarning()` - Track partner commission
  - `recordLecturerEarning()` - Track lecturer income
  - `getTransactionHistory()` - Get all transactions
  - `reverseTransaction()` - Refund operation
- **Key Formula:**
  ```
  ₦200 submission fee splits as:
  - Student: -₦200 (debit)
  - Lecturer: +₦70 (35%)
  - Partner: +₦30 (15%)
  - Platform: +₦100 (50%)
  ```
- **Related Files:**
  - `src/lib/actions/submission.actions.ts` (calls on submission)
  - `src/lib/actions/partner-earnings.actions.ts` (partner tracking)
  - `src/lib/actions/earnings.actions.ts` (lecturer earnings)

#### `src/lib/actions/payment.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Wallet funding via Paystack
- **Functions:**
  - `createPaymentLink()` - Initialize Paystack transaction
  - `verifyPaymentAndCreditWallet()` - Confirm payment, credit wallet
  - `handlePaystackWebhook()` - Process async notifications
  - `getOrCreateWallet()` - Ensure user has wallet
  - `getPaymentHistory()` - User's funding transactions
- **Related Files:**
  - `src/lib/services/paystack.service.ts` (Paystack API)
  - `src/app/api/payments/paystack/` (webhook endpoint)
  - `src/app/wallet/` (UI)

#### `src/lib/actions/earnings.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Lecturer earnings tracking and analytics
- **Functions:**
  - `getLecturerEarnings()` - Total lifetime earnings
  - `getMonthlyEarnings()` - By month breakdown
  - `getEarningsByAssignment()` - Per assignment earnings
  - `getEarningTrends()` - Growth over time
  - `getEarningStats()` - Summary statistics
- **Related Files:**
  - `src/lib/actions/transaction.actions.ts` (sources earnings)
  - `src/app/lecturer/earnings/` (UI)

#### `src/lib/actions/get-recent-earnings.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Recent earnings queries for dashboards
- **Functions:**
  - `getRecentLecturerEarnings()` - Last 30 days
  - `getRecentPartnerEarnings()` - Recent referral earnings
  - `getRecentTransactions()` - Recent transactions
- **Related Files:** Dashboard components

### Withdrawals

#### `src/lib/actions/lecturer-withdrawals.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Lecturer withdrawal request management
- **Functions:**
  - `requestWithdrawal()` - Create withdrawal request
  - `getWithdrawalRequests()` - Queue of requests
  - `updateWithdrawalStatus()` - Admin updates status
  - `getWithdrawalHistory()` - Past withdrawals
- **Related Files:**
  - `src/lib/actions/admin-withdrawals.actions.ts` (admin processing)
  - `src/app/lecturer/withdrawals/` (UI)

#### `src/lib/actions/student-withdrawals.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Student withdrawal requests (future feature)
- **Functions:** Similar to lecturer withdrawals
- **Related Files:** `src/lib/actions/admin-withdrawals.actions.ts`

#### `src/lib/actions/partner-withdrawals.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Partner withdrawal request management
- **Functions:**
  - `requestWithdrawal()` - Request cash out
  - `getPartnerWithdrawals()` - All requests/history
  - `cancelPendingWithdrawal()` - Withdraw request
- **Related Files:**
  - `src/lib/actions/admin-withdrawals.actions.ts`
  - `src/app/partner/withdrawals/` (UI)

### Partner Program

#### `src/lib/actions/partner.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Partner account management (admin only)
- **Functions:**
  - `createPartner()` - Admin creates partner
  - `getPartnerById()` - Fetch partner details
  - `getPartnersList()` - List all partners
  - `updatePartner()` - Modify partner info
  - `deactivatePartner()` - Suspend partner
  - `getPartnerStats()` - Metrics and performance
- **Related Files:**
  - `src/lib/actions/partner-earnings.actions.ts`
  - `src/app/admin/partners/` (UI)

#### `src/lib/actions/partner-registration.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Partner self-registration (if enabled)
- **Functions:**
  - `registerPartner()` - Self-signup
  - `validatePartnerRegistration()` - Verify details
  - `verifyPartnerEmail()` - Email confirmation
- **Related Files:** `src/app/partner/register/` (registration page)

#### `src/lib/actions/partner-earnings.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Partner referral earnings tracking
- **Functions:**
  - `getPartnerReferrals()` - Referred lecturers
  - `getPartnerEarnings()` - Total earnings
  - `getMonthlyPartnerEarnings()` - Monthly breakdown
  - `getPartnerPerformance()` - Stats and metrics
  - `trackReferralCommission()` - Record earning
- **Related Files:**
  - `src/lib/actions/transaction.actions.ts` (calculates splits)
  - `src/app/partner/earnings/` (UI)

### Plagiarism Detection

#### `src/lib/actions/plagiarism.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Plagiarism detection orchestration
- **Functions:**
  - `checkAssignmentPlagiarism()` - Scan all submissions
  - `getFlaggedSubmissions()` - List suspicious pairs
  - `getPlagiarismDetails()` - Get report for pair
  - `decidePlagiarismCase()` - Approve/reject flagged submission
  - `getPlagiarismHistory()` - Past decisions
- **Related Files:**
  - `src/lib/services/plagiarism.service.ts` (detection engine)
  - `src/components/lecturer/plagiarism-review-client.tsx` (UI)

### Promo Codes

#### `src/lib/actions/promo-codes.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Promo code generation and management
- **Functions:**
  - `getMyPromoCode()` - Get/create user's code
  - `validatePromoCode()` - Check code validity
  - `applyPromoCodeToBundle()` - Apply to purchase
  - `getPromoCodeStats()` - Usage and earnings
  - `deactivatePromoCode()` - Disable code
  - `getPromoCodeUsageHistory()` - Track uses
- **Code Formats:**
  ```
  LECT-ABC123DE  (Lecturer)
  STUD-XYZ789QW  (Student)
  PART-DEF456GH  (Partner)
  ```
- **Related Files:**
  - `src/lib/actions/student-cbt-purchase.actions.ts` (validation)
  - `src/components/promo-code-card.tsx` (display)

### Notifications

#### `src/lib/actions/notifications.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** In-app notification system
- **Functions:**
  - `createNotification()` - Create single notification
  - `createBulkNotifications()` - Send to multiple users
  - `getUserNotifications()` - Fetch user's notifications
  - `markAsRead()` - Single notification read
  - `markAllAsRead()` - Read all for user
  - `deleteNotification()` - Remove notification
  - `getUnreadCount()` - Badge count
- **Related Files:**
  - `src/lib/actions/notification-helpers.ts` (helper functions)
  - `src/components/notifications/` (UI components)

#### `src/lib/actions/notification-helpers.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Notification creation helpers for various events
- **Functions:**
  - `notifyAssignmentCreated()` - Trigger assignment notification
  - `notifySubmissionReceived()` - Trigger submission notification
  - `notifyGradingComplete()` - Trigger grade notification
  - `notifyPaymentReceived()` - Trigger payment notification
  - `notifyWithdrawalProcessed()` - Trigger withdrawal notification
  - `notifyReferralEarning()` - Trigger commission notification
- **Related Files:** `src/lib/actions/notifications.actions.ts`

### Email

#### `src/lib/actions/email.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Email sending wrapper functions
- **Functions:**
  - `sendWelcomeEmail()` - On signup
  - `sendAssignmentSubmittedEmail()` - On submission
  - `sendGradingCompleteEmail()` - On grading
  - `sendTestInvitationEmail()` - On test publish
  - `sendEnrollmentConfirmationEmail()` - On enrollment
  - `sendPaymentReceiptEmail()` - On payment success
  - `sendPartnerCredentialsEmail()` - On partner creation
  - `sendPasswordResetEmail()` - On password reset
- **Related Files:**
  - `src/lib/services/resend.service.ts` (email service)
  - `src/lib/email-templates/` (email templates)

### Admin Operations

#### `src/lib/actions/admin-users.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Admin user management
- **Functions:**
  - `getAllUsers()` - List all users with filters
  - `getUserDetails()` - Full user profile
  - `updateUserStatus()` - Activate/deactivate
  - `verifyUserEmail()` - Mark email verified
  - `resetUserPassword()` - Admin password reset
  - `deleteUser()` - Soft delete user
  - `searchUsers()` - Search by name/email
- **Related Files:** `src/app/admin/users/` (UI)

#### `src/lib/actions/admin-withdrawals.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Admin withdrawal request processing
- **Functions:**
  - `getPendingWithdrawals()` - Queue of requests
  - `approveWithdrawal()` - Approve request
  - `rejectWithdrawal()` - Deny request
  - `markAsPaid()` - Mark withdrawal completed
  - `getWithdrawalHistory()` - All withdrawals
  - `generateBankTransferList()` - Batch export
- **Related Files:**
  - `src/lib/actions/lecturer-withdrawals.actions.ts`
  - `src/lib/actions/partner-withdrawals.actions.ts`
  - `src/app/admin/withdrawals/` (UI)

#### `src/lib/actions/admin-wallet.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Admin wallet management and adjustments
- **Functions:**
  - `creditUserWallet()` - Manual credit
  - `debitUserWallet()` - Manual debit
  - `viewWalletHistory()` - Transaction log
  - `resetWalletBalance()` - Set to specific amount (disputes)
  - `exportWalletData()` - Download wallet info
- **Related Files:** `src/app/admin/finances/` (UI)

#### `src/lib/actions/admin-financial.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Financial reporting and analysis
- **Functions:**
  - `getFinancialSummary()` - Revenue overview
  - `getRevenueBreakdown()` - By source
  - `getCommissionSummary()` - Partner/lecturer splits
  - `generateFinancialReport()` - Complete report
  - `exportFinancialData()` - CSV/PDF export
- **Related Files:** `src/app/admin/finances/` (UI)

#### `src/lib/actions/admin-transactions.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** View and manage all transactions
- **Functions:**
  - `getAllTransactions()` - List all with filters
  - `getTransactionDetails()` - Full transaction info
  - `searchTransactions()` - By reference, user, amount
  - `exportTransactionLog()` - Download data
- **Related Files:** `src/app/admin/finances/transactions/` (UI)

#### `src/lib/actions/admin-stats.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Admin dashboard statistics
- **Functions:**
  - `getDashboardStats()` - Key metrics
  - `getActiveUsers()` - Current active count
  - `getRevenueStats()` - Revenue metrics
  - `getSubmissionStats()` - Volume metrics
- **Related Files:** `src/app/admin/` (dashboard page)

#### `src/lib/actions/admin-reports.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Report generation and export
- **Functions:**
  - `generateUsageReport()` - Usage statistics
  - `generateRevenueReport()` - Financial report
  - `generateUserReport()` - User analytics
  - `exportReportPDF()` - PDF export
  - `scheduleReport()` - Email report setup
- **Related Files:** `src/app/admin/reports/` (UI)

#### `src/lib/actions/admin-cbt-analytics.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** CBT analytics and performance metrics
- **Functions:**
  - `getCBTAnalytics()` - Main analytics data
  - `getRevenueByBundle()` - Bundle sales metrics
  - `getPromoCodePerformance()` - Discount usage stats
  - `getTopPerformers()` - Leaderboard data
  - `getStudentDistribution()` - By score range
  - `getChartData()` - For dashboard charts
- **Related Files:** `src/app/admin/cbt/analytics/` (UI)

#### `src/lib/actions/admin-cbt-bundles.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Admin CBT bundle management
- **Functions:**
  - `createBundle()` - Create practice bundle
  - `updateBundle()` - Modify bundle
  - `deleteBundle()` - Remove bundle
  - `listBundles()` - All bundles
  - `getBundleStats()` - Sales and usage metrics
- **Related Files:** `src/app/admin/cbt/bundles/` (UI)

#### `src/lib/actions/admin-cbt-courses.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Admin CBT course management
- **Functions:**
  - `createCourse()` - Create CBT course
  - `updateCourse()` - Modify course
  - `deleteCourse()` - Remove course
  - `listCourses()` - All courses
  - `importQuestions()` - Bulk question import
  - `getCourseStats()` - Enrollment, usage
- **Related Files:** `src/app/admin/cbt/` (UI)

#### `src/lib/actions/admin-content.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Admin content management
- **Functions:**
  - `updateFAQ()` - Manage FAQ page
  - `updateTerms()` - Manage terms/privacy
  - `updateSettings()` - System settings
- **Related Files:** `src/app/admin/settings/` (UI)

#### `src/lib/actions/admin-refunds.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Handle refund requests
- **Functions:**
  - `getRefundRequests()` - List pending
  - `approveRefund()` - Process refund
  - `rejectRefund()` - Deny refund
  - `getRefundHistory()` - All refunds
- **Related Files:** `src/app/admin/finances/` (UI)

### Analytics & Reporting

#### `src/lib/actions/analytics.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Cross-platform analytics
- **Functions:**
  - `getStudentAnalytics()` - Student performance
  - `getLecturerAnalytics()` - Lecturer metrics
  - `getPlatformAnalytics()` - Overall platform
  - `getGrowthMetrics()` - Growth trends
- **Related Files:** Dashboard components

### Content & Document Management

#### `src/lib/actions/document-import.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Bulk document/question import
- **Functions:**
  - `importAssignmentsFromCSV()` - Bulk assignment creation
  - `importQuestionsFromCSV()` - Bulk question import
  - `importQuestionsFromPDF()` - Parse PDF questions
  - `validateImportFile()` - Verify format
  - `getImportProgress()` - Track import status
- **Related Files:**
  - `src/lib/services/document-parser.service.ts`
  - `src/components/test/csv-upload.tsx` (UI)

### Settings & Configuration

#### `src/lib/actions/settings.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** User settings and preferences
- **Functions:**
  - `getUserSettings()` - Fetch user settings
  - `updateUserSettings()` - Modify settings
  - `updateNotificationPreferences()` - Email/push settings
  - `updatePrivacySettings()` - Privacy preferences
- **Related Files:** `src/app/lecturer/profile/` & `src/app/student/profile/` (UI)

### Continuous Assessment

#### `src/lib/actions/ca.actions.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** CA (Continuous Assessment) system operations
- **Functions:**
  - `getCAMarks()` - Student CA scores
  - `updateCAMarks()` - Manual update
  - `generateCAReport()` - CA analytics
- **Related Files:** Dashboard components

### Migration & Utilities

#### `src/lib/actions/access-control.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Role-based access control utilities
- **Functions:**
  - `checkUserPermission()` - Verify user can access
  - `requireRole()` - Enforce role requirement
  - `canViewAssignment()` - Assignment access check
  - `canGradeSubmission()` - Grading permission check
  - `canWithdraw()` - Withdrawal eligibility check
- **Related Files:** Used throughout action files

#### `src/scripts/migrate-standalone-assignments.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Database migration script for standalone assignments
- **Usage:** One-time migration from old to new format

---

## UI Components

React components organized by feature area.

### Base UI Components

Located: `src/components/ui/`

#### shadcn/ui Component Library (Pre-built)
- **button.tsx** - Reusable button component
- **card.tsx** - Card container
- **dialog.tsx** - Modal dialog
- **input.tsx** - Text input field
- **textarea.tsx** - Multi-line text
- **select.tsx** - Dropdown select
- **checkbox.tsx** - Checkbox input
- **radio-group.tsx** - Radio buttons
- **label.tsx** - Form label
- **form.tsx** - Form wrapper with React Hook Form
- **table.tsx** - Data table
- **tabs.tsx** - Tabbed interface
- **dropdown-menu.tsx** - Dropdown menu
- **alert.tsx** - Alert message
- **alert-dialog.tsx** - Confirmation dialog
- **separator.tsx** - Visual divider
- **skeleton.tsx** - Loading placeholder
- **badge.tsx** - Status badge
- **avatar.tsx** - User avatar/profile pic
- **progress.tsx** - Progress bar
- **sheet.tsx** - Side sheet/drawer
- **sonner.tsx** - Toast notifications

### Dashboard Components

Located: `src/components/dashboard/`

#### `dashboard-header.tsx`
- **Purpose:** Header for all dashboards
- **Props:** title, subtitle, action buttons
- **Used In:** All dashboard pages

#### `student-wallet-card.tsx`
- **Purpose:** Display student wallet balance
- **Shows:** Current balance, total earned, total spent
- **Actions:** Link to fund wallet
- **Related Files:** `src/app/wallet/page.tsx`

#### `recent-submissions-content.tsx`
- **Purpose:** Show recent submissions list
- **Displays:** Student name, assignment, date, status
- **Related Files:** Lecturer dashboard

#### `recent-activity-content.tsx`
- **Purpose:** Show recent user activity
- **Displays:** Activity timeline
- **Related Files:** All dashboards

### Admin Components

Located: `src/components/admin/`

#### `admin-header.tsx`
- **Purpose:** Top navigation for admin panel
- **Contains:** Logo, user menu, notifications
- **Related Files:** `src/components/admin/layout.tsx`

#### `admin-sidebar.tsx`
- **Purpose:** Left navigation for admin panel
- **Contains:** Menu items for all admin sections
- **Related Files:** `src/components/admin/layout.tsx`

#### `layout.tsx`
- **Purpose:** Admin layout wrapper
- **Contains:** Header + sidebar + content area
- **Related Files:** `src/app/admin/layout.tsx`

#### `stats-card.tsx`
- **Purpose:** Display metric cards
- **Shows:** Number, label, trend indicator
- **Used In:** Dashboard summary section

#### `users-table.tsx`
- **Purpose:** List all users with filters
- **Columns:** Name, email, role, status, actions
- **Actions:** Edit, deactivate, reset password
- **Related Files:** `src/app/admin/users/page.tsx`

#### `users-filters.tsx`
- **Purpose:** Filter controls for users table
- **Filters:** Role, status, department, date range
- **Related Files:** `users-table.tsx`

#### `partner-table.tsx`
- **Purpose:** List all partners
- **Columns:** Name, code, commission rate, earnings, status
- **Actions:** Edit, deactivate, view performance
- **Related Files:** `src/app/admin/partners/page.tsx`

#### `partner-stats-cards.tsx`
- **Purpose:** Partner program overview cards
- **Shows:** Total partners, earnings, active, inactive
- **Related Files:** `src/app/admin/partners/page.tsx`

#### `partner-performance-charts.tsx`
- **Purpose:** Visualize partner performance
- **Charts:** Revenue over time, top partners, commission breakdown
- **Related Files:** Partner dashboard pages

#### `partner-referrals-list.tsx`
- **Purpose:** Show partner's referred lecturers
- **Columns:** Lecturer name, submissions, revenue, commission
- **Related Files:** Partner detail view

#### `partner-earnings-list.tsx`
- **Purpose:** List partner commissions
- **Shows:** Date, lecturer, amount, status
- **Related Files:** Partner dashboard

#### `partner-withdrawals-list.tsx`
- **Purpose:** List withdrawal requests
- **Shows:** Date, amount, status, bank details
- **Related Files:** Partner management

#### `withdrawals-table.tsx`
- **Purpose:** All withdrawal requests (admin view)
- **Columns:** User, amount, bank, status, date
- **Actions:** Approve, reject, mark paid
- **Related Files:** `src/app/admin/withdrawals/` pages

#### `withdrawal-actions-modal.tsx`
- **Purpose:** Modal for processing withdrawals
- **Actions:** Approve/reject with notes
- **Related Files:** `withdrawals-table.tsx`

#### `wallet-adjustment-modal.tsx`
- **Purpose:** Manual wallet credit/debit
- **Inputs:** Amount, reason
- **Related Files:** Wallet management pages

#### `quick-actions.tsx`
- **Purpose:** Quick action buttons
- **Actions:** Create user, create partner, view reports
- **Related Files:** Admin dashboard

#### `activity-feed.tsx`
- **Purpose:** Show admin action log
- **Shows:** Who did what, when, details
- **Related Files:** Admin dashboard

#### `edit-user-modal.tsx`
- **Purpose:** Edit user information
- **Inputs:** Name, email, status, role
- **Related Files:** Users page

#### `create-partner-button.tsx`
- **Purpose:** Trigger partner creation flow
- **Opens:** Partner creation form/modal
- **Related Files:** Partners page

#### `edit-partner-form.tsx`
- **Purpose:** Edit partner details
- **Fields:** Business name, commission rate, bank info
- **Related Files:** Partner edit page

#### `export-partners-button.tsx`
- **Purpose:** Export partners to CSV
- **Data:** All partner info and stats
- **Related Files:** Partners page

#### `advanced-partner-filters.tsx`
- **Purpose:** Complex partner filtering
- **Filters:** Commission rate range, earnings range, date, status
- **Related Files:** Partner list pages

#### `bulk-partner-actions.tsx`
- **Purpose:** Bulk operations on partners
- **Actions:** Activate/deactivate multiple, change commission rate
- **Related Files:** Partners management

#### `commission-rate-history.tsx`
- **Purpose:** Show commission rate changes over time
- **Data:** Previous rates, effective dates, changes
- **Related Files:** Partner detail page

#### `user-detail-tabs.tsx`
- **Purpose:** Tabbed interface for user details
- **Tabs:** Overview, Financial, Courses, Activity
- **Related Files:** User detail page

#### `user-overview-tab.tsx`
- **Purpose:** User overview information
- **Shows:** Profile, role, join date, status
- **Related Files:** `user-detail-tabs.tsx`

#### `user-financial-tab.tsx`
- **Purpose:** User financial information
- **Shows:** Wallet balance, transactions, earnings
- **Related Files:** `user-detail-tabs.tsx`

#### `user-courses-tab.tsx`
- **Purpose:** User's courses
- **Shows:** Course list (enrolled or created)
- **Related Files:** `user-detail-tabs.tsx`

#### `user-activity-tab.tsx`
- **Purpose:** User activity timeline
- **Shows:** Submissions, grades, logins, changes
- **Related Files:** `user-detail-tabs.tsx`

#### `pricing-settings-form.tsx`
- **Purpose:** Configure system pricing
- **Fields:** Submission fee, commission rates, bundle prices
- **Related Files:** Admin settings

#### `system-settings-form.tsx`
- **Purpose:** System configuration settings
- **Fields:** Platform settings, feature toggles, API configs
- **Related Files:** Admin settings

### Lecturer Components

Located: `src/components/lecturer/`

#### `plagiarism-review-client.tsx`
- **Purpose:** Client component for plagiarism review
- **Shows:** Paired submissions, similarity score, matching text
- **Actions:** Approve/reject with notes
- **Related Files:** Lecturer grading pages

#### `create-withdrawal-form.tsx`
- **Purpose:** Form for requesting withdrawal
- **Fields:** Amount, bank name, account details
- **Submits To:** `lecturer-withdrawals.actions`

### Student Components

Located: `src/components/student/`

#### `student-nav.tsx`
- **Purpose:** Navigation for student side
- **Menu Items:** Dashboard, assignments, tests, wallet, scores
- **Related Files:** `src/app/student/layout.tsx`

#### `assignment-writer-client.tsx`
- **Purpose:** Assignment submission interface
- **Features:** Text editor, file upload, preview
- **Related Files:** `src/app/student/assignments/` pages

#### `formatted-assignment-content.tsx`
- **Purpose:** Display assignment instructions formatted
- **Supports:** HTML, markdown, embedded media
- **Related Files:** Assignment view pages

#### `create-withdrawal-form.tsx`
- **Purpose:** Student withdrawal request form
- **Fields:** Amount, bank details
- **Submits To:** `student-withdrawals.actions`

### Partner Components

Located: `src/components/partner/`

#### `partner-header.tsx`
- **Purpose:** Header for partner dashboard
- **Shows:** Partner name, status, quick stats
- **Related Files:** `src/app/partner/layout.tsx`

#### `partner-sidebar.tsx`
- **Purpose:** Navigation for partner portal
- **Menu Items:** Dashboard, referrals, earnings, withdrawals, profile
- **Related Files:** `src/app/partner/layout.tsx`

#### `referral-code-display.tsx`
- **Purpose:** Show partner's referral code and QR
- **Features:** Copy button, QR code, share options
- **Related Files:** Partner dashboard

#### `recent-referrals-list.tsx`
- **Purpose:** List recent referrals
- **Shows:** Lecturer, join date, submissions, earnings
- **Related Files:** Partner dashboard

#### `recent-earnings-list.tsx`
- **Purpose:** Recent commission earnings
- **Shows:** Date, source, amount, status
- **Related Files:** Partner earnings page

#### `partner-profile-form.tsx`
- **Purpose:** Edit partner profile
- **Fields:** Business name, phone, bank details
- **Related Files:** Partner profile page

#### `password-change-form.tsx`
- **Purpose:** Change password
- **Fields:** Old password, new password, confirm
- **Related Files:** Partner profile page

#### `create-withdrawal-form.tsx`
- **Purpose:** Request withdrawal
- **Fields:** Amount, bank details
- **Submits To:** `partner-withdrawals.actions`

### Grading Components

Located: `src/components/grading/`

#### `ai-grading-button.tsx`
- **Purpose:** Trigger AI grading for single submission
- **States:** Loading, success, error
- **Related Files:** Grading pages

#### `bulk-ai-grading.tsx`
- **Purpose:** Grade all submissions at once with AI
- **Progress:** Shows progress bar and count
- **Options:** Custom rubric input
- **Related Files:** Assignment view page

#### `document-viewer.tsx`
- **Purpose:** Display submission document/file
- **Supports:** PDF, DOCX, images, text
- **Features:** Zoom, download, print
- **Related Files:** Grading pages

### Test Components

Located: `src/components/test/`

#### `question-builder.tsx`
- **Purpose:** Create/edit test questions
- **Types:** MCQ, True/False, Essay
- **Fields:** Question text, options, correct answer
- **Related Files:** Test creation pages

#### `question-preview.tsx`
- **Purpose:** Preview question as student will see
- **Shows:** Question, options/inputs, explanation (if shown)
- **Related Files:** Test view pages

#### `csv-upload.tsx`
- **Purpose:** Bulk upload questions from CSV
- **Format:** Specific CSV template
- **Related Files:** Test import pages

#### `document-upload.tsx`
- **Purpose:** Upload questions from document
- **Supports:** PDF, DOCX (with auto-parsing)
- **Related Files:** Test import pages

#### `question-navigation.tsx`
- **Purpose:** Navigate between questions during test
- **Shows:** Question list, current question, marks
- **Related Files:** Test taking page

#### `timer.tsx`
- **Purpose:** Test timer display
- **Shows:** Time remaining, warning at low time
- **Related Files:** Test taking page

### Assignment Components

Located: `src/components/assignment/`

#### `file-upload.tsx`
- **Purpose:** Upload submission files
- **Accepts:** DOCX, PDF, TXT, images, archives
- **Features:** Drag-drop, progress, validation
- **Related Files:** Assignment submission

#### `copy-button.tsx`
- **Purpose:** Copy assignment access code/link
- **Features:** Copy to clipboard, feedback
- **Related Files:** Standalone assignment pages

### Notification Components

Located: `src/components/notifications/`

#### `notification-bell.tsx`
- **Purpose:** Notification bell icon in header
- **Shows:** Unread count badge
- **Actions:** Opens dropdown on click
- **Related Files:** Page layouts

#### `notification-dropdown.tsx`
- **Purpose:** Dropdown menu showing notifications
- **Shows:** Recent notifications, unread count
- **Actions:** View, mark read, clear
- **Related Files:** `notification-bell.tsx`

#### `notification-item.tsx`
- **Purpose:** Single notification in list
- **Shows:** Icon, title, message, time, read status
- **Actions:** Click to view, dismiss
- **Related Files:** `notification-dropdown.tsx`

### CBT Components

Located: `src/components/cbt/`

#### `LeaderboardTable.tsx`
- **Purpose:** Display CBT ranking table
- **Columns:** Rank, student name, score, accuracy, date
- **Features:** Sort, filter, pagination
- **Related Files:** CBT practice pages

#### `LeaderboardPreview.tsx`
- **Purpose:** Mini leaderboard preview
- **Shows:** Top 5 performers
- **Related Files:** Dashboard cards

#### `LeaderboardShare.tsx`
- **Purpose:** Share leaderboard stats
- **Creates:** Shareable link or image
- **Related Files:** Leaderboard page

### Promo Code Components

#### `promo-code-card.tsx`
- **Extension:** TypeScript (.tsx)
- **Purpose:** Display user's promo code and stats
- **Shows:** Code, total uses, total earnings, QR code
- **Actions:** Copy, share, deactivate
- **Related Files:** Dashboard, partner pages

#### `promo-code-card-wrapper.tsx`
- **Extension:** TypeScript (.tsx)
- **Purpose:** Server component wrapper for promo card
- **Fetches:** User's promo code data
- **Related Files:** `promo-code-card.tsx`

#### `promo-code-card-client.tsx`
- **Extension:** TypeScript (.tsx)
- **Purpose:** Client component for interactive features
- **State:** Card visibility, copy feedback
- **Related Files:** `promo-code-card.tsx`

### Payment Components

#### `paystack-payment-button.tsx`
- **Extension:** TypeScript (.tsx)
- **Purpose:** Paystack payment button
- **Functionality:** Initialize payment, handle response
- **States:** Loading, success, error
- **Related Files:** Wallet, CBT bundle pages

### Utility Components

#### `copy-code-button.tsx`
- **Extension:** TypeScript (.tsx)
- **Purpose:** Generic copy-to-clipboard button
- **Used In:** Assignment codes, referral codes, test codes
- **Related Files:** Multiple pages

#### `delete-assignment-button.tsx`
- **Extension:** TypeScript (.tsx)
- **Purpose:** Delete assignment with confirmation
- **Related Files:** Assignment pages

#### `delete-course-button.tsx`
- **Extension:** TypeScript (.tsx)
- **Purpose:** Delete course with confirmation
- **Related Files:** Course pages

#### `earnings-breakdown.tsx`
- **Extension:** TypeScript (.tsx)
- **Purpose:** Show earnings breakdown by source
- **Shows:** Pie/bar chart, numerical breakdown
- **Related Files:** Lecturer earnings page

### Layout Components

#### `footer/footer-content.tsx`
- **Extension:** TypeScript (.tsx)
- **Purpose:** Main footer for all pages
- **Contains:** Links, copyright, social media
- **Related Files:** Root layout

---

## Pages & Routes

Next.js app router pages organized by role and feature.

### Root Pages

#### `src/app/page.tsx`
- **Route:** `/`
- **Purpose:** Home/landing page
- **Displays:** Hero, features overview, call-to-action
- **Public:** Yes

#### `src/app/layout.tsx`
- **Extension:** TypeScript (.tsx)
- **Purpose:** Root layout wrapper for all pages
- **Contains:** Providers, global styles, meta tags
- **Related Files:** All pages inherit from this

#### `src/app/globals.css`
- **Extension:** CSS  
- **Purpose:** Global styles and Tailwind setup
- **Contains:** Root styles, CSS variables, custom classes

### Authentication Pages

Located: `src/app/auth/`

#### `login/page.tsx`
- **Route:** `/auth/login`
- **Purpose:** User login page
- **Form:** Email, password
- **Actions:** Calls `auth.actions.login()`

#### `signup/page.tsx`
- **Route:** `/auth/signup`
- **Purpose:** User registration page
- **Form:** Name, email, password, role selection
- **Actions:** Calls `auth.actions.signUp()`

#### `reset-password/page.tsx`
- **Route:** `/auth/reset-password`
- **Purpose:** Request password reset
- **Form:** Email address
- **Actions:** Calls `auth.actions.resetPassword()`

#### `update-password/page.tsx`
- **Route:** `/auth/update-password`
- **Purpose:** Set new password (from email link)
- **Form:** New password, confirm
- **Actions:** Calls `auth.actions.updatePassword()`

### Student Pages

Located: `src/app/student/`

#### `layout.tsx`
- **Route:** `/student/*`
- **Purpose:** Student dashboard layout
- **Contains:** Navigation, sidebar, main content area
- **Related Files:** Student components

#### Dashboard Pages

#### `dashboard/page.tsx`
- **Route:** `/student/dashboard`
- **Shows:** Enrolled courses, pending assignments, recent grades
- **Cards:** Wallet balance, notification count, stats

#### `courses/page.tsx`
- **Route:** `/student/courses`
- **Purpose:** List enrolled courses
- **Shows:** Course name, lecturer, progress, actions

#### `courses/[id]/page.tsx`
- **Route:** `/student/courses/:courseId`
- **Purpose:** Course detail page
- **Shows:** Course info, assignments, tests, enrolled students

#### `courses/[id]/tests/page.tsx`
- **Route:** `/student/courses/:courseId/tests`
- **Purpose:** Tests for course
- **Shows:** Available tests, past attempts, results

#### `courses/search-courses-form.tsx`
- **Purpose:** Search available courses to enroll
- **Form:** Search by code, name
- **Related Files:** Course pages

#### Assignment Pages

#### `assignments/page.tsx`
- **Route:** `/student/assignments`
- **Purpose:** All assigned assignments
- **Shows:** Title, course, deadline, status, grade

#### `assignments/[id]/page.tsx`
- **Route:** `/student/assignments/:id`
- **Purpose:** Single assignment view
- **Shows:** Instructions, deadline, file downloads, submission form

#### `assignment-writer/page.tsx`
- **Route:** `/student/assignment-writer`
- **Purpose:** Standalone assignment submission
- **Shows:** Assignment details, submission interface

#### Score & Results Pages

#### `scores/page.tsx`
- **Route:** `/student/scores`
- **Purpose:** All grades and scores
- **Shows:** By assignment, by test, breakdown by course

#### `submissions/page.tsx`
- **Route:** `/student/submissions`
- **Purpose:** Your submissions history
- **Shows:** Date, assignment, grade, feedback

#### Test Pages

#### `tests/page.tsx`
- **Route:** `/student/tests`
- **Purpose:** Available and completed tests
- **Shows:** Open tests, past attempts, scores

#### CBT Practice Pages

#### `cbt/page.tsx`
- **Route:** `/student/cbt`
- **Purpose:** CBT practice hub
- **Shows:** Available bundles, purchased bundles, recommendations

#### `cbt/practice/page.tsx`
- **Route:** `/student/cbt/practice`
- **Purpose:** Start practice session
- **Shows:** Course selection, session settings

#### Wallet Pages

#### `wallet/page.tsx`
- **Route:** `/student/wallet`
- **Purpose:** Wallet management
- **Shows:** Balance, transactions, fund button

#### `wallet/withdrawals/page.tsx`
- **Route:** `/student/wallet/withdrawals`
- **Purpose:** Withdrawal requests
- **Shows:** History, status, pending requests

#### `wallet/withdrawals/create/page.tsx`
- **Route:** `/student/wallet/withdrawals/create`
- **Purpose:** Create withdrawal request
- **Form:** Amount, bank details

#### `wallet/payment-success/page.tsx`
- **Route:** `/student/wallet/payment-success`
- **Purpose:** Confirmation after Paystack payment
- **Shows:** Receipt, new balance, next steps

#### Profile & Settings Pages

#### `profile/page.tsx`
- **Route:** `/student/profile`
- **Purpose:** Student profile/settings
- **Shows:** Personal info, update form, password change

#### Debugging Pages

#### `debug/page.tsx`
- **Route:** `/student/debug`
- **Purpose:** Debug information (development only)
- **Shows:** Session info, permissions, test data

### Lecturer Pages

Located: `src/app/lecturer/`

#### `layout.tsx`
- **Route:** `/lecturer/*`
- **Purpose:** Lecturer dashboard layout
- **Contains:** Header, sidebar, content area

#### Dashboard Pages

#### `dashboard/page.tsx`
- **Route:** `/lecturer/dashboard`
- **Shows:** Recent submissions, grades to submit, earnings, stats

#### Course Management Pages

#### `courses/page.tsx`
- **Route:** `/lecturer/courses`
- **Purpose:** Lecturer's courses
- **Shows:** Courses, student counts, links to manage

#### `courses/[id]/page.tsx`
- **Route:** `/lecturer/courses/:courseId`
- **Purpose:** Course detail
- **Shows:** Enrolled students, assignments, tests

#### Assignment Pages

#### `assignments/page.tsx`
- **Route:** `/lecturer/assignments`
- **Purpose:** All created assignments
- **Shows:** Title, submissions count, graded count

#### `assignments/[id]/page.tsx`
- **Route:** `/lecturer/assignments/:id`
- **Purpose:** Single assignment management
- **Shows:** Details, submissions list, grading interface

#### Grading Pages

#### `grading/page.tsx`
- **Route:** `/lecturer/grading`
- **Purpose:** All submissions to grade
- **Shows:** Ungraded submissions with filters

#### Test Management Pages

#### `tests/page.tsx`
- **Route:** `/lecturer/tests`
- **Purpose:** Lecturer's tests
- **Shows:** Tests, attempt counts, analytics

#### `tests/create/page.tsx`
- **Route:** `/lecturer/tests/create`
- **Purpose:** Create new test
- **Form:** Test settings, question builder

#### Earnings & Analytics Pages

#### `earnings/page.tsx`
- **Route:** `/lecturer/earnings`
- **Purpose:** Earnings from submissions
- **Shows:** Total, by assignment, breakdown, trends

#### `analytics/page.tsx`
- **Route:** `/lecturer/analytics`
- **Purpose:** Student performance analytics
- **Shows:** Charts, statistics, grade distribution

#### Withdrawal Pages

#### `withdrawals/page.tsx`
- **Route:** `/lecturer/withdrawals`
- **Purpose:** Withdrawal requests
- **Shows:** History, pending status

#### Profile Pages

#### `profile/page.tsx`
- **Route:** `/lecturer/profile`
- **Purpose:** Lecturer profile settings
- **Shows:** Info form, password change

### Admin Pages

Located: `src/app/admin/`

#### `layout.tsx`
- **Route:** `/admin/*`
- **Purpose:** Admin panel layout
- **Contains:** Header, sidebar, content

#### Main Dashboard

#### `page.tsx`
- **Route:** `/admin`
- **Purpose:** Admin dashboard
- **Shows:** Key metrics, recent activity, quick stats

#### User Management

Located: `src/app/admin/users/`

#### `page.tsx`
- **Route:** `/admin/users`
- **Purpose:** All users management
- **Shows:** Users table with filters, search

#### `[userId]/page.tsx`
- **Route:** `/admin/users/:userId`
- **Purpose:** User detail and edit
- **Shows:** Profile, financial, courses, activity tabs

#### Partner Management

Located: `src/app/admin/partners/`

#### `page.tsx`
- **Route:** `/admin/partners`
- **Purpose:** All partners
- **Shows:** Partners table, stats, creation button

#### `[partnerId]/page.tsx`
- **Route:** `/admin/partners/:partnerId`
- **Purpose:** Partner detail
- **Shows:** Profile, referrals, earnings, performance

#### Withdrawal Management

Located: `src/app/admin/withdrawals/`

#### `page.tsx`
- **Route:** `/admin/withdrawals`
- **Purpose:** Withdrawal requests
- **Shows:** Pending, approved, paid withdrawals

#### Financial Dashboard

Located: `src/app/admin/finances/`

#### `page.tsx`
- **Route:** `/admin/finances`
- **Purpose:** Financial overview
- **Shows:** Revenue chart, commission breakdown

#### `transactions/page.tsx`
- **Route:** `/admin/finances/transactions`
- **Purpose:** All transactions
- **Shows:** Transaction log with search/filter

#### CBT Management

Located: `src/app/admin/cbt/`

#### `analytics/page.tsx`
- **Route:** `/admin/cbt/analytics`
- **Purpose:** CBT analytics dashboard
- **Shows:** Revenue charts, promo performance, leaderboard

#### `courses/page.tsx`
- **Route:** `/admin/cbt/courses`
- **Purpose:** Manage CBT courses
- **Shows:** Courses list, creation button

#### `bundles/page.tsx`
- **Route:** `/admin/cbt/bundles`
- **Purpose:** Manage practice bundles
- **Shows:** Bundles list, pricing, sales

#### Content Management

Located: `src/app/admin/content/`

#### `page.tsx`
- **Route:** `/admin/content`
- **Purpose:** Manage FAQ, terms, privacy
- **Shows:** Content editors

#### Settings

Located: `src/app/admin/settings/`

#### `page.tsx`
- **Route:** `/admin/settings`
- **Purpose:** System configuration
- **Shows:** Settings forms

#### Reports

Located: `src/app/admin/reports/`

#### `page.tsx`
- **Route:** `/admin/reports`
- **Purpose:** Generate reports
- **Shows:** Report types, export options

### Partner Pages

Located: `src/app/partner/`

#### `layout.tsx`
- **Route:** `/partner/*`
- **Purpose:** Partner portal layout
- **Contains:** Header, sidebar, content

#### Main Pages

#### `page.tsx`
- **Route:** `/partner`
- **Purpose:** Partner dashboard
- **Shows:** Referral code, stats, recent activity

#### `login/page.tsx`
- **Route:** `/partner/login`
- **Purpose:** Partner login
- **Form:** Email, password

#### `register/page.tsx`
- **Route:** `/partner/register`
- **Purpose:** Partner self-registration (if enabled)
- **Form:** Business info, credentials

#### Referral Pages

#### `referrals/page.tsx`
- **Route:** `/partner/referrals`
- **Purpose:** Referred lecturers
- **Shows:** Lecturer list, submission counts, revenue

#### Earnings Pages

#### `earnings/page.tsx`
- **Route:** `/partner/earnings`
- **Purpose:** Commission earnings
- **Shows:** Total, by lecturer, by month

#### Withdrawal Pages

#### `withdrawals/page.tsx`
- **Route:** `/partner/withdrawals`
- **Purpose:** Withdrawal management
- **Shows:** History, pending requests

#### `withdrawals/request/page.tsx`
- **Route:** `/partner/withdrawals/request`
- **Purpose:** Create withdrawal request
- **Form:** Amount, bank details

#### Profile Pages

#### `profile/page.tsx`
- **Route:** `/partner/profile`
- **Purpose:** Partner profile settings
- **Shows:** Business info, bank details, password change

### Public Information Pages

#### `about/page.tsx`
- **Route:** `/about`
- **Purpose:** About Assessify page
- **Public:** Yes

#### `features/page.tsx`
- **Route:** `/features`
- **Purpose:** Features overview
- **Public:** Yes

#### `pricing/page.tsx`
- **Route:** `/pricing`
- **Purpose:** Pricing page
- **Public:** Yes

#### `contact/page.tsx`
- **Route:** `/contact`
- **Purpose:** Contact form
- **Public:** Yes

#### `faq/page.tsx`
- **Route:** `/faq`
- **Purpose:** FAQ page
- **Public:** Yes

#### `guides/page.tsx`
- **Route:** `/guides`
- **Purpose:** User guides and documentation
- **Public:** Yes (with optional login)

#### `help/page.tsx`
- **Route:** `/help`
- **Purpose:** Help center
- **Public:** Yes

### Legal Pages

Located: `src/app/legal/`

#### `privacy/page.tsx`
- **Route:** `/legal/privacy`
- **Purpose:** Privacy policy
- **Public:** Yes

#### `terms/page.tsx`
- **Route:** `/legal/terms`
- **Purpose:** Terms of service
- **Public:** Yes

### Test Taking Pages

Located: `src/app/tests/`

#### `[code]/page.tsx`
- **Route:** `/tests/:code`
- **Purpose:** Test preview and start
- **Shows:** Test info, start button, instructions

#### `[code]/take/[attemptId]/page.tsx`
- **Route:** `/tests/:code/take/:attemptId`
- **Purpose:** Test-taking interface
- **Shows:** Questions, timer, submit button, navigation

### Wallet & Payment Pages

Located: `src/app/wallet/`

#### `page.tsx`
- **Route:** `/wallet`
- **Purpose:** Main wallet page
- **Shows:** Balance, transactions, fund/withdraw links

#### `payment-success/page.tsx`
- **Route:** `/wallet/payment-success`
- **Purpose:** Post-payment confirmation
- **Shows:** Receipt, new balance

### Notifications Page

#### `notifications/page.tsx`
- **Route:** `/notifications`
- **Purpose:** Full notifications page
- **Shows:** All notifications, mark read/delete, filters

---

## Type Definitions

TypeScript type files for compile-time safety.

### Core Database Types

#### `src/lib/types/database.types.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Auto-generated Supabase database types
- **Contains:** All table structures (users, assignments, transactions, etc.)
- **Generated By:** Supabase CLI (`supabase gen types`)
- **Usage:** Import for database queries with type checking

#### `src/lib/types/test.types.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Test-specific types
- **Types Defined:**
  - `Test`
  - `Question`
  - `TestAttempt`
  - `StudentAnswer`
  - `TestStats`
- **Related Files:** Test actions, test components

#### `src/lib/types/partner.types.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Partner program types
- **Types Defined:**
  - `Partner`
  - `Referral`
  - `PartnerEarning`
  - `PartnerStats`
  - `WithdrawalRequest`
- **Related Files:** Partner actions, partner components

#### `src/lib/types/notification.types.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Notification system types
- **Types Defined:**
  - `Notification`
  - `NotificationType`
  - `NotificationPayload`
  - `NotificationMetadata`
- **Related Files:** Notification actions, notification components

### Root Types Directory

#### `src/types/question.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Question extraction types
- **Types Defined:**
  - `ExtractedQuestion`
  - `QuestionOption`
  - `QuestionDifficulty`
- **Related Files:** Document parser, question import

#### `src/types/test.types.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Additional test types (duplicate/extension)
- **Related Files:** Test system files

#### `src/types/withdrawal.types.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Withdrawal request types
- **Types Defined:**
  - `WithdrawalRequest`
  - `WithdrawalStatus`
  - `BankDetails`
- **Related Files:** Withdrawal actions

#### `src/types/mammoth.d.ts`
- **Extension:** TypeScript Declaration (.d.ts)
- **Purpose:** Type declarations for Mammoth library
- **Usage:** Needed for DOCX parsing

---

## Email Templates

React Email templates for transactional emails.

Located: `src/lib/email-templates/`

All templates are React components that render to HTML and sent via Resend.

#### `index.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Export all email templates
- **Exports:** Object mapping template names to components
- **Usage:** `const template = templates[templateName]`

#### `welcome.tsx`
- **Extension:** TypeScript+JSX (.tsx)
- **Purpose:** Sent on user signup
- **Content:** Welcome message, role-specific features, dashboard link
- **Trigger:** `sendWelcomeEmail()`
- **Props:** userName, userRole, dashboardLink

#### `assignment-submitted.tsx`
- **Extension:** TypeScript+JSX (.tsx)
- **Purpose:** Confirmation when student submits
- **Content:** Assignment name, submission reference, expected timeline
- **Trigger:** `sendAssignmentSubmittedEmail()`
- **Props:** studentName, assignmentTitle, submissionRefId, courseName

#### `grading-complete.tsx`
- **Extension:** TypeScript+JSX (.tsx)
- **Purpose:** Notification when assignment graded
- **Content:** Score, feedback, color-coded result, view link
- **Trigger:** `sendGradingCompleteEmail()`
- **Props:** studentName, score, maxScore, feedback, viewLink

#### `test-invitation.tsx`
- **Extension:** TypeScript+JSX (.tsx)
- **Purpose:** Invitation to take test
- **Content:** Test name, number of questions, time limit, access link
- **Trigger:** `sendTestInvitationEmail()`
- **Props:** studentName, testName, duration, questionCount, testLink

#### `enrollment-confirmation.tsx`
- **Extension:** TypeScript+JSX (.tsx)
- **Purpose:** Confirmation of course enrollment
- **Content:** Course name, lecturer, access link
- **Trigger:** `sendEnrollmentConfirmationEmail()`
- **Props:** studentName, courseName, lecturerName, courseLink

#### `payment-receipt.tsx`
- **Extension:** TypeScript+JSX (.tsx)
- **Purpose:** Wallet funding receipt
- **Content:** Amount paid, reference, date, new balance
- **Trigger:** `sendPaymentReceiptEmail()`
- **Props:** userName, amount, reference, date, newBalance

#### `partner-credentials.tsx`
- **Extension:** TypeScript+JSX (.tsx)
- **Purpose:** Partner account credentials on creation
- **Content:** Login URL, email, temp password, partner code
- **Trigger:** `sendPartnerCredentialsEmail()` (admin sends)
- **Props:** partnerName, email, tempPassword, partnerCode, loginUrl

#### `password-reset.tsx`
- **Extension:** TypeScript+JSX (.tsx)
- **Purpose:** Password reset link
- **Content:** Reset link, validity period, instructions
- **Trigger:** `sendPasswordResetEmail()`
- **Props:** userName, resetLink, validityHours

---

## Utilities & Helpers

### Utility Functions

Located: `src/lib/utils/`

#### `utils.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** General utility functions
- **Functions:**
  - `cn()` - Merge Tailwind class names
  - `formatDate()` - Format date strings
  - `formatCurrency()` - Format money (NGN)
  - `formatTime()` - Format time/duration
  - `debounce()` - Debounce function execution
  - `asyncHandler()` - Wrap async functions with error handling

#### `revenue-split.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Revenue split calculation utilities
- **Functions:**
  - `calculateRevenueSplit()` - Split ₦200 submission fee
  - `getStudentShare()` - Student portion (₦0)
  - `getLecturerShare()` - Lecturer portion (₦70)
  - `getPartnerShare()` - Partner portion (₦30)
  - `getPlatformShare()` - Platform portion (₦100)

#### `error-handler.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Error handling utilities
- **Functions:**
  - `handleError()` - Normalize error messages
  - `logError()` - Log with context
  - `getErrorMessage()` - User-friendly messages
  - `isNetworkError()` - Check error type

#### `colors.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Theme colors and color utilities
- **Exports:** Color palette object, brand colors
- **Usage:** Theme customization

### Hooks

Located: `src/hooks/`

#### `use-debounce.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Hook for debouncing values
- **Usage:** Debounce search inputs, form changes
- **Exports:** `useDebounce` hook

### Context

Located: `src/lib/context/`

#### `sidebar-context.tsx`
- **Extension:** TypeScript+JSX (.tsx)
- **Purpose:** Sidebar state management
- **Context:** SidebarContext
- **State:** isOpen (sidebar visibility)
- **Usage:** Toggle sidebar in responsive view

### Providers

Located: `src/providers/`

#### `auth-provider.tsx`
- **Extension:** TypeScript+JSX (.tsx)
- **Purpose:** Authentication context provider
- **Context:** AuthContext
- **Provides:** currentUser, isLoading, isAuthenticated
- **Usage:** Wrap app to provide auth state

---

## Supabase Integration

Database client configuration and utilities.

Located: `src/lib/supabase/`

#### `server.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Supabase client for server-side operations (Server Actions)
- **Exports:** `createClient()` function
- **Features:** Uses service role key for admin access
- **Usage:**
  ```typescript
  const supabase = createClient()
  const data = await supabase.from('assignments').select()
  ```

#### `client.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Supabase client for browser/client-side
- **Exports:** `createClient()` function
- **Features:** Uses anon key, respects RLS policies
- **Usage:** Real-time subscriptions, client-side queries

---

## Configuration Files

### Build & Framework Config

#### `next.config.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Next.js configuration
- **Contains:**
  - Image optimization settings
  - API route handling
  - Environment variable exposure
  - Build options
- **Related:** `tsconfig.json`

#### `tsconfig.json`
- **Extension:** JSON
- **Purpose:** TypeScript compiler configuration
- **Contains:**
  - Compiler options (strict mode, etc.)
  - Path aliases (`@/` for `src/`)
  - Library targets

#### `tailwind.config.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Tailwind CSS configuration
- **Contains:**
  - Theme colors (ASSESSIFY branding)
  - Custom utilities
  - Plugin configuration
  - Dark mode settings

#### `postcss.config.mjs`
- **Extension:** JavaScript Module (.mjs)
- **Purpose:** PostCSS configuration
- **Plugins:** Tailwind, autoprefixer
- **Usage:** CSS processing pipeline

#### `eslint.config.mjs`
- **Extension:** JavaScript Module (.mjs)
- **Purpose:** ESLint configuration for code quality
- **Rules:** TypeScript rules, React rules, Next.js rules

#### `components.json`
- **Extension:** JSON
- **Purpose:** shadcn/ui CLI configuration
- **Contains:** Component paths, import aliases
- **Usage:** `npx shadcn-ui@latest add <component>`

### Package Management

#### `package.json`
- **Extension:** JSON
- **Purpose:** Project dependencies and scripts
- **Key Sections:**
  - `dependencies` - Production packages
  - `devDependencies` - Development tools
  - `scripts` - NPM commands (dev, build, test)
- **Size:** ~60 dependencies

#### `pnpm-lock.yaml`
- **Extension:** YAML
- **Purpose:** Dependency lock file (if using pnpm)
- **Usage:** Ensure consistent installs

### Middleware

#### `middleware.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Next.js request middleware
- **Functions:**
  - Check authentication on protected routes
  - Redirect unauthenticated users to login
  - Set user context in request headers
  - Enforce role-based access
- **Applies To:** `/student/*`, `/lecturer/*`, `/admin/*`, `/partner/*`

### Proxy Configuration

#### `src/proxy.ts`
- **Extension:** TypeScript (.ts)
- **Purpose:** Custom proxy utilities
- **Functions:** API proxying, request forwarding
- **Usage:** Route external API calls through Next.js

---

## Root Files

Project root configuration and documentation.

### Database

#### `CBT-CLEAN-SCHEMA.sql`
- **Extension:** SQL
- **Purpose:** Complete PostgreSQL database schema
- **Contains:**
  - All table definitions (50+ tables)
  - Foreign key constraints
  - Row-Level Security (RLS) policies
  - Indexes for performance
- **Usage:** Run in Supabase SQL editor to initialize database
- **Size:** 550+ lines

### Documentation (Generated & Maintained)

#### `README.md`
- **Extension:** Markdown
- **Purpose:** Quick start guide
- **Contains:** Setup instructions, key features, deployment

#### `DETAILED_APP_DOCUMENTATION.md`
- **Extension:** Markdown
- **Purpose:** Comprehensive app documentation (THIS FILE)
- **Contains:** Features, workflows, tech stack, guides

#### `FILE_INVENTORY.md`
- **Extension:** Markdown
- **Purpose:** Complete file reference (THIS FILE)
- **Contains:** All files, paths, descriptions, relationships

#### Project Documentation Files (Pre-existing)

- `ASSESSIFY_COMPREHENSIVE_PLATFORM_GUIDE.md` - Business/investor docs
- `COMPREHENSIVE_PROJECT_PROGRESS_REPORT.md` - Implementation status
- `ACCESS_CONTROL_README.md` - Security documentation
- `EMAIL_NOTIFICATION_IMPLEMENTATION.md` - Email system details
- `ADMIN_CBT_ANALYTICS_GUIDE.md` - Analytics documentation
- `PROMO_CODE_SYSTEM_GUIDE.md` - Promo system details
- `PAYSTACK_INTEGRATION_GUIDE.md` - Payment documentation
- And 15+ other documentation files

### Utility Scripts

#### `cleanup.bat`
- **Extension:** Batch (.bat)
- **Purpose:** Clean node_modules, build or cache (Windows)

#### `cleanup.ps1`
- **Extension:** PowerShell (.ps1)
- **Purpose:** Clean node_modules, build or cache (Windows)

#### `cleanup.py`
- **Extension:** Python (.py)
- **Purpose:** Clean node_modules, build or cache (Universal)

### Environment

#### `.env.example`
- **Extension:** Text
- **Purpose:** Example environment variables
- **Contains:** All required API keys and config (with dummy values)
- **Usage:** Copy to `.env.local` and fill in real values

---

## File Organization Summary

### By Category

**Backend Business Logic:** 50+ server action files
**Services & Integrations:** 7 service files
**UI Components:** 100+ component files
**Pages & Routes:** 40+ page files
**Type Definitions:** 8 type files
**Email Templates:** 9 email template files
**Utilities:** 5 utility files
**Configuration:** 8 config files
**Database Schema:** 1 SQL file (550+ lines)

### By Language

| Language | Count | Purpose |
|----------|-------|---------|
| TypeScript (.ts) | 80+ | Backend logic, utilities, config |
| TSX (.tsx) | 140+ | React components and pages |
| CSS | 1 | Global styles |
| JSON | 3 | Package, config, components |
| SQL | 1 | Database schema |
| YAML | 1 | Lock file |
| Markdown | 25+ | Documentation |

### By Directory Size (Files)

| Directory | Count | Purpose |
|-----------|-------|---------|
| `src/lib/actions/` | 60+ | Business logic |
| `src/components/` | 140+ | UI components |
| `src/app/` | 40+ | Pages/routes |
| `src/lib/services/` | 7 | External services |
| `src/lib/types/` | 4 | Type definitions |
| `src/lib/email-templates/` | 9 | Email templates |
| `src/lib/utils/` | 4 | Utility functions |
| Root | 25+ | Config & docs |

---

## File Dependencies Diagram

### Payment Flow Files
```
payment.actions.ts
  ├─ paystack.service.ts (Paystack API)
  ├─ wallet.actions.ts (Update balance)
  └─ email.actions.ts (Send receipt)
```

### Assignment Submission Flow
```
submission.actions.ts
  ├─ assignment.actions.ts (Get assignment)
  ├─ transaction.actions.ts (Charge student, pay lecturer)
  │   ├─ wallet.actions.ts (Update wallets)
  │   └─ partner-earnings.actions.ts (Track partner commission)
  ├─ email.actions.ts (Send confirmation)
  └─ notifications.actions.ts (Create notification)
```

### AI Grading Flow
```
ai-grading.actions.ts
  ├─ claude.service.ts (Primary AI)
  ├─ gemini.service.ts (Fallback AI)
  ├─ document-parser.service.ts (Extract text)
  ├─ grading.actions.ts (Save grade)
  ├─ email.actions.ts (Send notification)
  └─ notifications.actions.ts (Create notification)
```

---

## How to Navigate

**Want to add a new feature?**
1. Create action file in `src/lib/actions/`
2. Create component file in `src/components/`
3. Create page file in `src/app/{role}/`
4. Add types to `src/lib/types/`

**Need to understand payment flow?**
See: `transaction.actions.ts`, `payment.actions.ts`, `paystack.service.ts`, `wallet.actions.ts`

**Want to modify grading?**
See: `ai-grading.actions.ts`, `grading.actions.ts`, `claude.service.ts`, `gemini.service.ts`

**Adding new email type?**
1. Create template in `src/lib/email-templates/`
2. Create action function in `email.actions.ts`
3. Call from relevant business logic file

**Database changes?**
Edit `CBT-CLEAN-SCHEMA.sql`, regenerate types with Supabase CLI, update `database.types.ts`

---

**Document Version:** 2.0  
**Last Updated:** March 26, 2026  
**Total Files:** 300+ files  
**Total Lines:** 50,000+ lines of code  
**Status:** Production Ready
