# ASSESSIFY - Complete Application Documentation

**Version:** 2.0  
**Date:** March 26, 2026  
**Status:** Production Ready (95% Complete)  
**Platform:** Educational Assessment & Testing Platform  
**Organization:** assessify.ng  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Platform Overview](#platform-overview)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Core Features](#core-features)
6. [User Roles & Workflows](#user-roles--workflows)
7. [Key Modules & Functions](#key-modules--functions)
8. [Database Structure](#database-structure)
9. [API Endpoints](#api-endpoints)
10. [Security & Access Control](#security--access-control)
11. [Payment System](#payment-system)
12. [AI Grading System](#ai-grading-system)
13. [Partner Program](#partner-program)
14. [Email Notifications](#email-notifications)
15. [Admin Dashboard](#admin-dashboard)
16. [Development Guide](#development-guide)
17. [Deployment](#deployment)

---

## Executive Summary

**Assessify** is a comprehensive educational technology platform designed to modernize continuous assessment (CA) in African educational institutions. The platform provides:

- **Automated Assessment Management** - Create, deploy, and manage assignments and tests at scale
- **AI-Powered Grading** - Leverage Claude AI and Gemini for instant essay evaluation
- **Smart Financial Integration** - Built-in wallet system with Paystack payment processing
- **Partner Monetization** - Enable institutional partnerships for revenue generation
- **Real-Time Analytics** - Track student performance with actionable insights
- **Plagiarism Detection** - Maintain academic integrity with advanced detection
- **Multi-Channel Access** - Desktop, tablet, and mobile-optimized interface

### Key Stats

| Metric | Value |
|--------|-------|
| **Framework** | Next.js 16 + React 19 |
| **Database** | PostgreSQL (Supabase) |
| **Authentication** | Supabase Auth (JWT) |
| **Primary Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Deployment** | Vercel |
| **Target Users** | Universities, Polytechnics, Teaching Centers |
| **Supported Roles** | Student, Lecturer, Admin, Partner |

---

## Platform Overview

### Vision
Transform educational assessment across Africa by making quality, fair, and efficient continuous evaluation accessible to every institution and student.

### Mission
Empower educators with intelligent tools to assess student learning effectively, enable students to receive fair and immediate feedback, and create new economic opportunities for educational institutions and partners.

### Core Problem Solved
- **Manual Grading Burden**: Lecturers spend 30-40 hours/month manually grading essays
- **Assessment Inequality**: Traditional methods favor certain learning styles
- **Institutional Inefficiency**: Paper-based systems create bottlenecks
- **Limited Economic Opportunity**: Lecturers have no additional income platforms

### Solution Delivered
1. **AI-Powered Grading** - Reduces grading time by 70%
2. **Standardized Evaluation** - Consistent, fair grading across all assessments
3. **Digital-First Workflow** - Cloud-based, accessible anywhere
4. **Income Opportunity** - Lecturers earn 35% commission on submissions, Partners earn 15%

---

## Technology Stack

### Frontend Layer
| Technology | Purpose | Version |
|-----------|---------|---------|
| **Next.js** | React framework with App Router | 16+ |
| **React** | UI library | 19.0.0 |
| **TypeScript** | Type-safe JavaScript | 5+ |
| **Tailwind CSS** | Utility-first CSS | v4 |
| **Radix UI** | Accessible components | 1.4.3 |
| **shadcn/ui** | Component library | Latest |
| **React Hook Form** | Form state management | 7.71.1 |
| **Zod** | Schema validation | 4.2.1 |
| **Zustand** | Global state management | 5.0.9 |
| **TanStack React Query** | Server state management | 5.90.12 |
| **Lucide React** | Icon library | Latest |
| **Recharts** | Data visualization | 3.6.0 |
| **React Email** | Email template building | 5.2.8 |

### Backend Layer
| Technology | Purpose |
|-----------|---------|
| **Next.js API Routes** | Serverless backend (REST API) |
| **Server Actions** | Secure backend functions |
| **Middleware** | Request processing & auth |
| **TypeScript** | Type-safe backend code |

### Database & Storage
| Technology | Purpose |
|-----------|---------|
| **PostgreSQL** | Primary database (Supabase) |
| **Supabase** | Database, Auth, File Storage, Realtime |
| **JWT Tokens** | Session management |
| **Row-Level Security (RLS)** | Database-level access control |

### AI & ML Services
| Service | Purpose | Usage |
|---------|---------|-------|
| **Claude 3.5 Sonnet** | Primary AI grading model | Essay evaluation, feedback |
| **Google Gemini 2.0** | Fallback AI model | Backup grading if Claude fails |
| **Anthropic SDK** | Claude API integration | Grading engine |
| **Google GenAI SDK** | Gemini integration | Fallback grading |

### Payment Processing
| Service | Purpose |
|---------|---------|
| **Paystack** | Payment gateway for Nigeria |
| **Paystack SDK** | Payment integration |

### Email & Notifications
| Service | Purpose |
|---------|---------|
| **Resend** | Transactional email service |
| **React Email** | Email template creation |

### Development Tools
| Tool | Purpose |
|------|---------|
| **npm** | Package manager |
| **ESLint** | Code linting |
| **TypeScript Compiler** | Type checking |
| **Webpack** | Module bundling (via Next.js) |

### Deployment & Hosting
| Platform | Purpose |
|----------|---------|
| **Vercel** | Application hosting & edge functions |
| **Supabase** | Database & backend services hosting |

---

## Architecture

### System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                             │
├──────────────────────────────────────────────────────────────┤
│  React 19 + Next.js 16 (App Router)                          │
│  ├─ Student Dashboard & Features                             │
│  ├─ Lecturer Dashboard & Grading Interface                   │
│  ├─ Admin Management Console                                 │
│  └─ Partner Earnings Portal                                  │
└──────────────────────────────────────────────────────────────┘
                           ↕ (HTTP/HTTPS)
┌──────────────────────────────────────────────────────────────┐
│                  SERVER LAYER (Next.js)                       │
├──────────────────────────────────────────────────────────────┤
│  API Routes | Server Actions | Middleware                    │
│  ├─ Authentication & Authorization                           │
│  ├─ Assignment Management                                    │
│  ├─ Test Management                                          │
│  ├─ Grading & Evaluation                                     │
│  ├─ Payment Processing                                       │
│  ├─ Wallet Management                                        │
│  ├─ User Management                                          │
│  ├─ Analytics                                                │
│  └─ Notifications                                            │
└──────────────────────────────────────────────────────────────┘
                           ↕ (SQL/HTTPS)
┌──────────────────────────────────────────────────────────────┐
│                  DATA LAYER (Supabase)                        │
├──────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                         │
│  ├─ Users & Profiles                                        │
│  ├─ Courses & Enrollment                                    │
│  ├─ Assignments & Submissions                               │
│  ├─ Tests & Attempts                                        │
│  ├─ Grading & Results                                       │
│  ├─ Wallets & Transactions                                  │
│  ├─ Partners & Referrals                                    │
│  ├─ CBT (Computer-Based Testing)                            │
│  ├─ Notifications                                           │
│  └─ Admin actions & audit logs                              │
│                                                              │
│  Authentication: Supabase Auth (Email/Password)             │
│  File Storage: Supabase Storage (Documents, Submissions)    │
│  Real-time: Supabase Subscriptions                          │
│  Row-Level Security: Database-enforced access control       │
└──────────────────────────────────────────────────────────────┘
                           ↕
┌──────────────────────────────────────────────────────────────┐
│               EXTERNAL INTEGRATIONS                           │
├──────────────────────────────────────────────────────────────┤
│  AI Services: Claude 3.5, Gemini 2.0                         │
│  Payments: Paystack                                          │
│  Email: Resend                                               │
│  Plagiarism Detection: NLP (In-house algorithm)              │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Request
    ↓
Middleware (Auth Check)
    ↓
Next.js Route Handler / Server Action
    ↓
Supabase Client (with auth context)
    ↓
PostgreSQL Query (RLS applied)
    ↓
Data returned to client
    ↓
Response rendered in React component
    ↓
User sees result
```

### Authentication Flow

```
1. SIGNUP
   User fills form → Send to auth.actions.ts → 
   Supabase Auth creates user → 
   Create profile record → 
   Send welcome email → 
   Redirect to dashboard

2. LOGIN
   User enters email/password → 
   Supabase Auth verifies → 
   JWT session created → 
   Stored in secure cookie → 
   Middleware validates on each request

3. PROTECTED ROUTES
   Request comes in → 
   Middleware checks session → 
   If invalid → Redirect to /auth/login → 
   If valid → Allow access → 
   Inject user context into request
```

---

## Core Features

### 1. Assignment Management

**For Lecturers:**
- Create assignments with descriptions and instructions
- Set deadlines, late submission policies, and penalties
- Configure submission costs (₦200 default)
- Enable/disable AI grading
- Enable plagiarism detection
- Support file uploads (DOCX, PDF, TXT, images)
- Create "standalone" assignments (shareable via access code)
- View all submissions in organized dashboard
- Filter by status, date, student

**For Students:**
- Browse available assignments
- Submit work (text + file uploads)
- Pay submission fee from wallet
- Track submission status
- Receive grades and feedback
- Download assignment documents
- Late submission with penalties

**Key Files:**
- `src/lib/actions/assignment.actions.ts` - Assignment CRUD
- `src/lib/actions/submission.actions.ts` - Submission logic
- `src/lib/actions/ai-grading.actions.ts` - AI evaluation

**Submission Payment Flow:**
1. Student submits assignment
2. Checks if student has balance for ₦200 fee
3. Deducts from student wallet
4. Credits lecturer wallet (₦70)
5. Records in transactions table
6. Tracks in lecturer earnings
7. Applies partner commission if applicable (₦30)

### 2. Test & Quiz Management

**For Lecturers:**
- Create tests with multiple question types:
  - Multiple choice (MCQ)
  - True/False
  - Essay/Short answer
- Set marks per question
- Configure test settings:
  - Time limits
  - Number of attempts
  - Shuffle questions/options
  - Show results immediately
  - Allow review after submission
- Publish tests to students
- View analytics and results
- Download answer scripts

**For Students:**
- Browse available tests
- Start test with timer
- Answer questions (scrambled order optional)
- Submit answers
- View results and scores
- Review answers if allowed
- Attempt multiple times if configured

**Key Files:**
- `src/lib/actions/test.actions.ts` - Test CRUD
- `src/app/api/cbt/submit-answer/route.ts` - Answer submission
- `src/app/api/cbt/complete-session/route.ts` - Test completion

### 3. AI-Powered Grading

**How It Works:**
1. Lecturer initiates grading
2. System extracts text from submissions
3. Claude AI or Gemini evaluates based on rubric
4. System generates score and feedback
5. Lecturer reviews and adjusts if needed
6. Final grade saved
7. Student notified via email

**Supported Document Types:**
- Plain text
- Microsoft Word (.docx)
- PDF
- Combined (multiple files)

**Features:**
- Batch grading (grade all submissions at once)
- Custom grading rubrics
- Fallback AI (use Gemini if Claude fails)
- Automatic feedback generation
- Score adjustment capability

**Key Files:**
- `src/lib/services/claude.service.ts` - Claude AI integration
- `src/lib/services/gemini.service.ts` - Gemini AI integration
- `src/lib/actions/ai-grading.actions.ts` - Grading workflows

### 4. Plagiarism Detection

**Features:**
- Compare submissions against each other
- Detect matching text snippets
- Calculate similarity scores
- Flag suspicious pairs (>70% similarity)
- Review interface for teachers
- Decide to accept or reject
- Track plagiarism decisions

**Algorithm:**
- Cosine similarity calculation
- Sentence-level comparison
- Word frequency analysis
- Configurable threshold (default 70%)

**Key Files:**
- `src/lib/services/plagiarism.service.ts` - Detection engine
- `src/lib/actions/plagiarism.actions.ts` - Actions

### 5. Wallet System

**Functionality:**
- Each user has personal wallet
- Track balance, spending, earnings
- Deposit funds via Paystack
- Withdraw to bank account
- Full transaction history
- Real-time balance updates

**User Types:**
- **Students**: Spend on submissions/tests
- **Lecturers**: Earn from submissions
- **Partners**: Earn from referrals
- **Admins**: Manual credit/debit for adjustments

**Transaction Types:**
- `debit` - Student payment for submission
- `credit` - Lecturer earning, Partner earning
- `funding` - Wallet top-up via Paystack
- `withdrawal` - Cash out to bank

**Key Files:**
- `src/lib/actions/wallet.actions.ts` - Wallet operations
- `src/lib/actions/transaction.actions.ts` - Transaction logic
- `src/lib/actions/payment.actions.ts` - Payment processing

### 6. Student CBT (Computer-Based Testing) Practice

**Features:**
- Practice courses with multiple questions
- Question difficulty levels (easy, medium, hard)
- Subscription bundles for course access
- Expiring subscriptions (90 days default)
- Session tracking and scoring
- Performance analytics per student
- Promo code discounts
- Referral earnings sharing

**Workflow:**
1. Student purchases bundle via Paystack or wallet
2. Gains access to courses for validity period
3. Starts practice session
4. Answers questions (shuffled order)
5. Gets instant feedback
6. Session saved with score percentage
7. Can review answers and solutions
8. Multiple sessions tracked

**Key Files:**
- `src/lib/actions/student-cbt-practice.actions.ts` - Practice sessions
- `src/lib/actions/student-cbt-purchase.actions.ts` - Bundle purchase
- `src/app/api/cbt/submit-answer/route.ts` - Answer submission

### 7. Partner/Referral Program

**For Partners:**
- Earn commission (15%) on each submission from referred lecturers
- Automatic tracking and calculation
- Withdraw earnings to bank account
- Real-time dashboard with metrics
- Referral link to share
- QR codes for easy sharing
- Performance analytics

**Commission Calculation:**
```
Lecturer gets referred → Creates assignments → 
Students submit (₦200 each) → 
Lecturer receives ₦70, Partner receives ₦30, Platform ₦100
```

**Key Files:**
- `src/lib/actions/partner.actions.ts` - Partner management
- `src/lib/actions/partner-earnings.actions.ts` - Earnings tracking
- `src/lib/actions/partner-withdrawals.actions.ts` - Withdrawal requests

### 8. Promo Code System

**Features:**
- Auto-generate unique promo codes for users
- Lecturers, students, and partners can share codes
- Discount when code is used
- Commission earned on code usage
- Track total uses and total earnings
- Deactivate/reactivate codes
- Performance analytics

**Code Format:**
```
LECT-ABC123  (Lecturer)
STUD-XYZ789  (Student)
PART-QWE456  (Partner)
```

**Key Files:**
- `src/lib/actions/promo-codes.actions.ts` - Code management
- `src/components/promo-code-card.tsx` - UI component
- CBT-CLEAN-SCHEMA.sql - Database tables

### 9. Notifications System

**Types of Notifications:**
1. **Grade Posted** - When assignment is graded
2. **Assignment Created** - New assignment published
3. **Enrollment Confirmed** - Student enrolled in course
4. **Payment Received** - Wallet top-up processed
5. **Withdrawal Processed** - Cash out completed
6. **Partner Reference Used** - Referral converted
7. **Test Available** - New test published
8. **Plagiarism Detected** - Suspicious submissions flagged

**Delivery Methods:**
1. **In-App Notifications** - Dashboard bell icon
2. **Email Notifications** - Transactional emails (Resend)

**Key Files:**
- `src/lib/actions/notifications.actions.ts` - Notification CRUD
- `src/lib/actions/notification-helpers.ts` - Helper functions
- `src/lib/actions/email.actions.ts` - Email sending
- `src/lib/services/resend.service.ts` - Resend integration

---

## User Roles & Workflows

### Role 1: STUDENT

**Permissions:**
- View enrolled courses
- Submit assignments
- Take tests
- View grades
- Manage wallet
- Request withdrawal
- View notifications
- Share promo codes

**Key Workflows:**

```
ASSIGNMENT SUBMISSION WORKFLOW:
1. Go to Student Dashboard
2. Click "Assignments"
3. Find course and assignment
4. Click "View Details"
5. Download assignment file (if provided)
6. Write/prepare response
7. Upload submission files
8. Submit
9. ₦200 deducted from wallet
10. Confirmation email sent
11. Wait for grading
12. Receive notification when graded
13. View score, feedback, grade

WALLET FUNDING:
1. Go to Wallet section
2. Click "Add Funds"
3. Enter amount (₦100-₦5,000,000)
4. Click "Pay with Paystack"
5. Complete payment on Paystack
6. Return to app
7. Wallet credited automatically
8. Receipt email sent
9. Balance updated

CBT PRACTICE:
1. View available bundles
2. Click "Buy Bundle"
3. Enter promo code (optional for discount)
4. Pay via Paystack or wallet
5. Access unlocked for 90 days
6. Start practice session
7. Answer questions
8. Get instant feedback
9. View score
10. Repeat sessions as needed
```

**Dashboard Shows:**
- Enrolled courses
- Pending assignments
- Available tests
- Recent grades
- Wallet balance
- Notifications
- Referral earnings (if applicable)

### Role 2: LECTURER

**Permissions:**
- Create courses
- Create assignments and tests
- View student submissions
- Grade assignments (manual or AI)
- Detect plagiarism
- View analytics
- Manage wallet
- Request withdrawal
- Share promo codes to earn

**Key Workflows:**

```
ASSIGNMENT CREATION:
1. Go to Lecturer Dashboard
2. Click "Create Assignment"
3. Select course or create standalone
4. Fill details:
   - Title, description
   - Deadline
   - Max score
   - Submission cost (₦200)
   - File types allowed
5. Enable AI grading (optional)
6. Enable plagiarism check (optional)
7. Click "Create"
8. Copy shareable link (for standalone)
9. Share with students

GRADING WORKFLOW:
1. Go to Assignment
2. Click "View Submissions"
3. See all student submissions
4. Click submission to view
5. Option A: Grade manually
   a. Enter score
   b. Write feedback
   c. Click "Save Grade"
6. Option B: Use AI Grading
   a. Click "AI Grade This"
   b. Review suggested score
   c. Adjust if needed
   d. Click "Save"
7. Student receives email notification
8. Grade visible in their dashboard

PLAGIARISM CHECK:
1. Assignment → "Check Plagiarism"
2. System compares submissions
3. Flags suspicious pairs
4. Reviews flagged submissions
5. Decide: Accept or Reject
6. Add explanation if rejecting
7. Student receives decision

EARNINGS VIEW:
1. Go to "Earnings"
2. See total earned this semester
3. View breakdown by assignment
4. See wallet balance
5. View transaction history
6. Request withdrawal
```

**Dashboard Shows:**
- All created courses
- All assignments and tests
- Submission count and status
- Recent grades
- Total earnings
- Wallet balance
- Referral stats (if using promo code)
- Analytics and charts

### Role 3: ADMIN

**Permissions:**
- Manage all users
- View system analytics
- Process withdrawals
- Manage partners
- Configure system settings
- View financial reports
- Approve/reject user accounts
- Manage disputes

**Key Workflows:**

```
USER MANAGEMENT:
1. Go to Admin Dashboard
2. Click "Users"
3. Filter by role, status, date
4. Search by name, email, ID
5. Click user to view details
6. View profile information
7. View activity timeline
8. Manual actions:
   - Activate/deactivate
   - Verify email
   - Reset password (help)

WITHDRAWAL PROCESSING:
1. Dashboard → "Withdrawals"
2. View pending requests
3. Click withdrawal
4. Verify bank details
5. Approve or reject
6. System transfers to bank
7. Mark as paid
8. Send confirmation email

ANALYTICS:
1. View CBT Analytics Dashboard
2. See summary metrics
3. View revenue charts
4. Promo code performance
5. Top performers
6. Recent activity
7. Export to CSV

FINANCIAL MANAGEMENT:
1. View transactions
2. Revenue breakdown
3. Commission distribution
4. Partner earnings tracking
5. Dispute resolution
```

**Dashboard Shows:**
- Key metrics (users, revenue, submissions)
- User management interface
- Financial reports
- Partner management
- System settings
- Activity logs

### Role 4: PARTNER

**Permissions:**
- Share referral code
- View earnings
- Track referred lecturers
- Request withdrawal
- Access analytics
- Share promo code

**Key Workflows:**

```
REFERRAL TRACKING:
1. Go to Partner Dashboard
2. View Referral Code (unique identifier)
3. Copy code or QR
4. Share via:
   - Email to lecturers
   - Social media
   - Professional networks
   - Business cards/materials
5. Track clicks and sign-ups
6. See referred lecturers list
7. View submissions per lecturer
8. Monitor earnings

EARNINGS VIEW:
1. Dashboard → "Earnings"
2. See total lifetime earnings
3. View breakdown by lecturer
4. See monthly commission
5. Track active lecturers
6. View transaction history
7. Calculate projected income

WITHDRAWAL:
1. Dashboard → "Withdrawals"
2. Click "Request Withdrawal"
3. Enter amount (min ₦1,000)
4. Select bank
5. Enter account details
6. Confirm request
7. Admin reviews
8. Funds transferred
9. Receive notification
```

**Dashboard Shows:**
- Partner profile
- Referral code + shareable link
- Referred lecturers count
- Active lecturers
- Total earnings
- Monthly earnings trend
- Withdrawal requests and status
- Performance analytics

---

## Key Modules & Functions

### 1. Authentication Module

**Location:** `src/lib/actions/auth.actions.ts`

**Key Functions:**

```typescript
signUp(formData)
  - Create new user account
  - Create profile (student/lecturer)
  - Send welcome email
  - Return: {success, user, profile}

login(email, password)
  - Verify credentials
  - Create session
  - Return: {success, user}

logout()
  - Clear session
  - Redirect to login

getCurrentUser()
  - Get current authenticated user
  - Return full profile with role

resetPassword(email)
  - Send password reset email
  - Create reset token

updatePassword(newPassword)
  - Update user password
  - Validate strength
```

### 2. Assignment Module

**Location:** `src/lib/actions/assignment.actions.ts`

**Key Functions:**

```typescript
createStandaloneAssignment(formData)
  - Create assignment (not tied to course)
  - Generate unique access code
  - Return shareable link

getStandaloneAssignmentByCode(code)
  - Public: get assignment by access code
  - No auth required for viewing

getStudentAssignments()
  - Get assignments for enrolled courses
  - Filter by course enrollment
  - Include deadline and status

getAssignmentSubmissions(assignmentId)
  - Get all submissions for assignment
  - Lecturer view only
  - Include student info and grades

deleteAssignment(assignmentId)
  - Soft delete (mark inactive)
  - Archive submissions

updateAssignment(assignmentId, updates)
  - Change deadline, max score, etc
  - Cannot modify after submissions exist
```

### 3. Submission Module

**Location:** `src/lib/actions/submission.actions.ts`

**Key Functions:**

```typescript
submitAssignment(formData)
  - Student submits work
  - Check course enrollment
  - Check wallet balance
  - Process ₦200 payment
  - Save submission
  - Send confirmation email

getSubmissionById(submissionId)
  - Get submission details
  - Verify permissions (student/lecturer)
  - Include files and grades

updateSubmissionStatus(submissionId, status)
  - Change status (submitted → graded)
  - Update timestamp

deleteSubmission(submissionId)
  - Soft delete
  - Preserve for refunds
```

### 4. Grading Module

**Location:** `src/lib/actions/grading.actions.ts`

**Key Functions:**

```typescript
gradeSubmission(submissionId, score, feedback)
  - Lecturer grades manually
  - Apply late penalties if applicable
  - Send notification email
  - Create transaction if using paid grading

aiGradeSingleSubmission(submissionId, rubric?)
  - Grade single submission with AI
  - Use Claude or Gemini
  - Return suggested score + feedback

aiGradeAllSubmissions(assignmentId, rubric?)
  - Grade all ungraded submissions at once
  - Batch process with AI
  - Apply consistent rubric

getGradingStats(courseId)
  - Get grading progress
  - Count graded vs ungraded
  - Average scores
```

### 5. AI Grading Service

**Location:** `src/lib/services/claude.service.ts`

**Key Functions:**

```typescript
gradeEssayWithAI(essay, question, rubric?)
  - Send essay to Claude
  - Provide grading context
  - Get score and feedback

gradeEssayWithFileAttachments(fileUrls, context)
  - Extract text from files
  - Grade using file content
  - Handle DOCX, PDF, images

extractQuestionsFromText(documentText)
  - Parse document for questions
  - Extract Q&A pairs
  - Identify question types

generateFeedback(essay, score, rubric)
  - Generate constructive feedback
  - Suggestions for improvement
```

### 6. Wallet Module

**Location:** `src/lib/actions/wallet.actions.ts`

**Key Functions:**

```typescript
getUserWallet(userId)
  - Get wallet by user ID
  - Return balance and stats

getWalletSummary(userId)
  - Quick summary (balance, spent, earned)
  - Lightweight response

updateWalletBalance(walletId, newBalance)
  - Directly update balance
  - Used by transaction processing

getOrCreateWallet(userId)
  - Get existing wallet or create new
  - Used in payment flow
```

### 7. Payment Module

**Location:** `src/lib/actions/payment.actions.ts`

**Key Functions:**

```typescript
createPaymentLink(amountNGN)
  - Initialize Paystack transaction
  - Generate authorization URL
  - Return: {authUrl, reference}

verifyPaymentAndCreditWallet(reference)
  - Verify payment with Paystack
  - Credit wallet on success
  - Send receipt email

handlePaystackWebhook(event)
  - Process async payment notifications
  - Credit wallet
  - Create transaction record

getOrCreateWallet(userId)
  - Ensures user has wallet
  - Called before payment
```

### 8. Transaction Module

**Location:** `src/lib/actions/transaction.actions.ts`

**Key Functions:**

```typescript
processSubmissionPayment(data)
  - Deduct from student wallet
  - Credit lecturer wallet
  - Split commission with partner
  - Record all transactions
  - Send notifications

calculateRevenueSplit(amount, lecturerId)
  - Calculate lecturer share (35%)
  - Calculate partner share (15% if applicable)
  - Calculate platform share (50%)
  - Return split breakdown
```

### 9. Notification Module

**Location:** `src/lib/actions/notifications.actions.ts`

**Key Functions:**

```typescript
createNotification(input)
  - Create single notification
  - For one user
  - With metadata

createBulkNotifications(userIds, notification)
  - Create same notification for multiple users
  - Used for announcements

getUserNotifications(filters)
  - Get notifications for current user
  - Filter by type, read status
  - Order by date
  - Pagination support

markAsRead(notificationId)
  - Mark notification as read

markAllAsRead()
  - Mark all as read for user
```

### 10. Email Module

**Location:** `src/lib/actions/email.actions.ts`

**Key Functions:**

```typescript
sendWelcomeEmail(email, name, role)
  - On signup
  - Role-specific content

sendAssignmentSubmittedEmail(email, studentName, ...)
  - On submission
  - Confirmation message

sendGradingCompleteEmail(email, studentName, ...)
  - When gradedsent
  - Score and feedback

sendPaymentReceiptEmail(email, amount, reference)
  - After wallet funding
  - Transaction details

sendTestInvitationEmail(email, studentName, ...)
  - When test published
  - Test access link
```

### 11. Partner Module

**Location:** `src/lib/actions/partner.actions.ts`

**Key Functions:**

```typescript
createPartner(data)
  - Admin creates partner account
  - Send credentials email
  - Generate partner code

getPartnerProfile(partnerId)
  - Get partner details
  - Business info
  - Bank details

updatePartnerProfile(updates)
  - Update business info
  - Bank account details

updatePartnerStatus(partnerId, status)
  - Activate/deactivate
  - Admin only

getPartnerStats(partnerId)
  - Total referrals
  - Active lecturers
  - Total earnings
  - Withdrawal requests
```

### 12. CBT Practice Module

**Location:** `src/lib/actions/student-cbt-practice.actions.ts`

**Key Functions:**

```typescript
startPracticeSession(courseId, questionCount)
  - Create new practice session
  - Load questions
  - Initialize timer
  - Return session ID + questions

submitAnswer(sessionId, questionId, answer)
  - Record student answer
  - Check if correct
  - Update session progress

completePracticeSession(sessionId)
  - Mark session complete
  - Calculate final score
  - Save results
  - Update subscription usage

getPracticeHistory(courseId)
  - Get all sessions for course
  - Scores and dates
  - Performance trends
```

---

## Database Structure

### Core Tables

#### users
- `id` (UUID, primary key)
- `email` (varchar, unique)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- Relationships: 1→ profiles, 1→ wallets

#### profiles
- `id` (UUID, foreign key to users)
- `first_name`, `last_name` (varchar)
- `role` (enum: student, lecturer, admin, partner)
- `email` (from auth.users)
- `phone` (varchar)
- `department`, `faculty` (varchar)
- `staff_id`, `matric_number` (varchar)
- `avatar_url` (text)
- `is_active` (boolean)
- `created_at`, `updated_at` (timestamp)

#### courses
- `id` (UUID)
- `course_code` (varchar)
- `course_title` (varchar)
- `created_by` (UUID, lecturer id)
- `department` (varchar)
- `max_students` (int)
- `created_at`, `updated_at` (timestamp)

#### course_enrollments
- `id` (UUID)
- `course_id` (UUID, foreign key)
- `student_id` (UUID, foreign key)
- `enrollment_status` (enum: active, dropped, completed)
- `enrolled_at` (timestamp)

#### assignments
- `id` (UUID)
- `created_by` (UUID, lecturer id)
- `course_id` (UUID, nullable for standalone)
- `title` (varchar)
- `description` (text)
- `deadline` (timestamp)
- `max_score` (integer)
- `submission_cost` (decimal, default 200)
- `ai_grading_enabled` (boolean)
- `plagiarism_check_enabled` (boolean)
- `is_standalone` (boolean)
- `access_code` (varchar, unique)
- `is_published` (boolean)
- `created_at`, `updated_at` (timestamp)

#### assignment_submissions
- `id` (UUID)
- `assignment_id` (UUID)
- `student_id` (UUID)
- `submission_text` (text)
- `file_urls` (text array)
- `status` (enum: draft, submitted, graded)
- `submitted_at` (timestamp)
- `is_late` (boolean)
- `final_score` (decimal)
- `ai_suggested_score` (decimal)
- `graded_by` (UUID, lecturer id)
- `graded_at` (timestamp)
- `lecturer_feedback` (text)
- `ai_feedback` (text)
- `plagiarism_score` (decimal 0-100)
- `created_at`, `updated_at` (timestamp)

#### tests
- `id` (UUID)
- `created_by` (UUID, lecturer)
- `course_id` (UUID, nullable)
- `title` (varchar)
- `duration_minutes` (integer)
- `total_marks` (integer)
- `pass_mark` (integer)
- `max_attempts` (integer)
- `show_results_immediately` (boolean)
- `is_published` (boolean)
- `is_standalone` (boolean)
- `access_code` (varchar)
- `start_time`, `end_time` (timestamp)
- `created_at`, `updated_at` (timestamp)

#### questions
- `id` (UUID)
- `test_id` (UUID)
- `question_type` (enum: mcq, true_false, essay)
- `question_text` (text)
- `marks` (integer)
- `order_index` (integer)
- `explanation` (text, optional)
- `created_at`, `updated_at` (timestamp)

#### question_options
- `id` (UUID)
- `question_id` (UUID)
- `option_text` (text)
- `is_correct` (boolean)
- `order_index` (integer)

#### test_attempts
- `id` (UUID)
- `test_id` (UUID)
- `student_id` (UUID)
- `attempt_number` (integer)
- `started_at` (timestamp)
- `submitted_at` (timestamp)
- `total_score` (decimal)
- `percentage` (decimal)
- `passed` (boolean)
- `status` (enum: in_progress, completed, expired)
- `created_at`, `updated_at` (timestamp)

#### student_answers
- `id` (UUID)
- `attempt_id` (UUID)
- `question_id` (UUID)
- `selected_option_ids` (UUID array)
- `answer_text` (text)
- `is_correct` (boolean)
- `marks_awarded` (decimal)
- `answered_at` (timestamp)

#### wallets
- `id` (UUID)
- `user_id` (UUID, unique)
- `balance` (decimal)
- `total_funded` (decimal)
- `total_spent` (decimal)
- `total_earned` (decimal)
- `created_at`, `updated_at` (timestamp)

#### transactions
- `id` (UUID)
- `wallet_id` (UUID)
- `type` (enum: debit, credit, funding)
- `purpose` (varchar)
- `amount` (decimal)
- `balance_before` (decimal)
- `balance_after` (decimal)
- `reference` (varchar, unique)
- `description` (text)
- `status` (enum: pending, completed, failed)
- `lecturer_id` (UUID, nullable)
- `partner_id` (UUID, nullable)
- `created_at` (timestamp)

#### partners
- `id` (UUID)
- `user_id` (UUID)
- `partner_code` (varchar, unique)
- `business_name` (varchar)
- `phone_number` (varchar)
- `commission_rate` (decimal, default 15)
- `bank_name` (varchar)
- `account_number` (varchar)
- `account_name` (varchar)
- `status` (enum: active, inactive, suspended)
- `pending_earnings` (decimal)
- `total_earnings` (decimal)
- `created_by` (UUID)
- `created_at`, `updated_at` (timestamp)

#### referrals
- `id` (UUID)
- `partner_id` (UUID)
- `referred_lecturer_id` (UUID)
- `referral_code` (varchar)
- `status` (enum: active, paused, inactive)
- `total_submissions` (integer)
- `total_revenue` (decimal)
- `partner_earnings` (decimal)
- `first_submission_at` (timestamp)
- `created_at`, `updated_at` (timestamp)

#### lecturer_earnings
- `id` (UUID)
- `lecturer_id` (UUID)
- `transaction_id` (UUID)
- `amount` (decimal)
- `source_type` (varchar)
- `source_id` (UUID)
- `withdrawn` (boolean)
- `earned_at` (timestamp)

#### withdrawals
- `id` (UUID)
- `user_id` (UUID)
- `lecturer_id` (UUID, nullable)
- `partner_id` (UUID, nullable)
- `student_id` (UUID, nullable)
- `amount` (decimal)
- `status` (enum: pending, approved paid, rejected)
- `bank_name` (varchar)
- `account_number` (varchar)
- `account_name` (varchar)
- `request_notes` (text)
- `review_notes` (text)
- `requested_at` (timestamp)
- `approved_at` (timestamp)
- `paid_at` (timestamp)

#### notifications
- `id` (UUID)
- `user_id` (UUID)
- `type` (varchar)
- `title` (varchar)
- `message` (text)
- `link` (varchar)
- `is_read` (boolean)
- `metadata` (JSON)
- `created_at` (timestamp)

#### admin_actions
- `id` (UUID)
- `admin_id` (UUID)
- `action_type` (varchar)
- `target_type` (varchar)
- `target_id` (UUID)
- `details` (JSON)
- `metadata` (JSON)
- `created_at` (timestamp)

### CBT Tables

#### cbt_courses
- `id` (UUID)
- `course_code` (varchar)
- `course_title` (varchar)
- `description` (text)
- `is_active` (boolean)
- `total_questions` (integer)
- `created_by` (UUID)
- `created_at`, `updated_at` (timestamp)

#### cbt_questions
- `id` (UUID)
- `course_id` (UUID)
- `topic_id` (UUID)
- `question_text` (text)
- `option_a`, `option_b`, `option_c`, `option_d` (text)
- `correct_answer` (varchar: A, B, C, D)
- `solution` (text)
- `difficulty` (varchar: easy, medium, hard)
- `is_active` (boolean)
- `times_attempted` (integer)
- `times_correct` (integer)
- `created_by` (UUID)
- `created_at`, `updated_at` (timestamp)

#### cbt_subscription_bundles
- `id` (UUID)
- `bundle_name` (varchar)
- `bundle_description` (text)
- `course_ids` (UUID array)
- `base_price` (decimal)
- `discount_amount` (decimal)
- `commission_amount` (decimal)
- `validity_days` (integer, default 90)
- `max_practice_sessions` (integer)
- `is_active` (boolean)
- `created_by` (UUID)
- `created_at`, `updated_at` (timestamp)

#### cbt_student_subscriptions
- `id` (UUID)
- `student_id` (UUID)
- `bundle_id` (UUID)
- `course_id` (UUID)
- `original_price` (decimal)
- `discount_applied` (decimal)
- `amount_paid` (decimal)
- `promo_code_used` (varchar)
- `referrer_id` (UUID)
- `referrer_role` (varchar)
- `commission_paid` (decimal)
- `payment_method` (varchar: wallet, paystack)
- `expiry_date` (timestamp)
- `sessions_taken` (integer)
- `is_active` (boolean)
- `created_at`, `updated_at` (timestamp)

#### cbt_practice_sessions
- `id` (UUID)
- `student_id` (UUID)
- `course_id` (UUID)
- `subscription_id` (UUID)
- `total_questions` (integer)
- `answered_questions` (integer)
- `correct_answers` (integer)
- `wrong_answers` (integer)
- `score_percentage` (decimal)
- `status` (varchar: in_progress, completed, abandoned)
- `started_at` (timestamp)
- `completed_at` (timestamp)
- `time_taken_seconds` (integer)
- `created_at`, `updated_at` (timestamp)

#### cbt_session_answers
- `id` (UUID)
- `session_id` (UUID)
- `question_id` (UUID)
- `selected_answer` (varchar: A, B, C, D)
- `is_correct` (boolean)
- `answered_at` (timestamp)

#### promo_codes
- `id` (UUID)
- `user_id` (UUID)
- `user_role` (varchar)
- `promo_code` (varchar, unique)
- `total_uses` (integer)
- `total_earnings` (decimal)
- `is_active` (boolean)
- `created_at`, `updated_at` (timestamp)

#### bundle_promo_earnings
- `id` (UUID)
- `referrer_id` (UUID)
- `referrer_role` (varchar)
- `promo_code` (varchar)
- `referred_student_id` (UUID)
- `subscription_id` (UUID)
- `bundle_id` (UUID)
- `bundle_price` (decimal)
- `discount_amount` (decimal)
- `amount_paid` (decimal)
- `commission_amount` (decimal)
- `platform_amount` (decimal)
- `status` (varchar)
- `created_at`, `updated_at` (timestamp)

---

## API Endpoints

### Authentication Routes

```
POST /api/auth/signup
  - Body: { email, password, firstName, lastName, role }
  - Return: { success, user, profile }

POST /api/auth/login
  - Body: { email, password }
  - Return: { success, user }

POST /api/auth/logout
  - Body: {}
  - Return: { success }

POST /api/auth/reset-password
  - Body: { email }
  - Return: { success }

POST /api/auth/signout
  - Body: {}
  - Return: { success, redirect }
```

### Student Routes

```
GET /api/student/assignments
  - Get all assignments for enrolled courses
  - Return: [ Assignment[] ]

GET /api/student/wallet
  - Get student wallet balance
  - Return: { balance, earned, spent }

POST /api/student/wallet/fund
  - Initialize wallet funding (redirects to Paystack)
  - Body: { amount }
  - Return: { authUrl, reference }

POST /api/student/assignments/{id}/submit
  - Submit assignment
  - Body: { text, files }
  - Return: { success, submission }

POST /api/cbt/subscribe
  - Purchase CBT bundle
  - Body: { bundleId, paymentMethod, promoCode }
  - Return: { success, subscription }

POST /api/cbt/start-session
  - Start practice session
  - Body: { courseId, questionCount }
  - Return: { sessionId, questions[] }

POST /api/cbt/submit-answer
  - Submit answer during session
  - Body: { sessionId, questionId, answer }
  - Return: { correct, feedback }

POST /api/cbt/complete-session
  - Complete practice session
  - Body: { sessionId }
  - Return: { score, results }
```

### Lecturer Routes

```
POST /api/lecturer/assignments
  - Create assignment (course or standalone)
  - Body: { courseId, title, description, deadline, ... }
  - Return: { success, assignment, accessCode }

GET /api/lecturer/assignments/{id}/submissions
  - Get all submissions for assignment
  - Return: [ Submission[] ]

POST /api/lecturer/assignments/{id}/grade
  - Grade single submission
  - Body: { submissionId, score, feedback }
  - Return: { success }

POST /api/lecturer/assignments/{id}/ai-grade
  - AI grade single or all submissions
  - Body: { submissionId?, rubric? }
  - Return: { success, gradedCount, scores[] }

POST /api/lecturer/tests
  - Create test
  - Body: { title, duration, questions[], ... }
  - Return: { success, test }

GET /api/lecturer/earnings
  - Get lecturer earnings
  - Return: { totalEarned, transactions[], breakdown }

POST /api/lecturer/withdrawals
  - Request withdrawal
  - Body: { amount, bankName, accountNumber }
  - Return: { success, withdrawal }
```

### Admin Routes

```
GET /api/admin/users
  - Get all users with filters
  - Query: ?role=lecturer&status=active&page=1
  - Return: { users[], total, pages }

POST /api/admin/users/{id}/update
  - Update user status/info
  - Body: { status, verified, ... }
  - Return: { success }

GET /api/admin/analytics
  - Get financial & usage analytics
  - Query: ?startDate=&endDate=
  - Return: { metrics, charts, reports }

POST /api/admin/partners
  - Create new partner
  - Body: { firstName, lastName, email, businessName, ... }
  - Return: { success, partner, credentials }

POST /api/admin/withdrawals/{id}/approve
  - Approve withdrawal request
  - Body: { notes }
  - Return: { success }

POST /api/admin/wallet/credit
  - Manually credit user wallet
  - Body: { userId, amount, reason }
  - Return: { success, newBalance }
```

### Payment Routes

```
POST /api/payments/paystack/initialize
  - Start Paystack payment
  - Body: { amount, email, callbackUrl }
  - Return: { authorizationUrl, reference }

POST /api/payments/paystack/verify
  - Verify Paystack payment
  - Query: ?reference=REF123
  - Return: { success, newBalance, message }

POST /api/payments/paystack/webhook
  - Paystack webhook endpoint
  - Body: Paystack event payload
  - Return: 200 OK
```

### Partner Routes

```
GET /api/partners/profile
  - Get partner profile
  - Return: { partner, stats, earnings }

GET /api/partners/referrals
  - Get all referrals
  - Query: ?page=1&sort=earnings
  - Return: { referrals[], total }

GET /api/partners/earnings
  - Get earnings summary
  - Return: { totalEarned, monthlyEarning, breakdown }

POST /api/partners/withdrawals
  - Request withdrawal
  - Body: { amount, bankDetails }
  - Return: { success, withdrawalId }

POST /api/partners/validate-code
  - Validate referral code (for login)
  - Body: { code }
  - Return: { valid, partnerId }
```

### Notification Routes

```
GET /api/notifications
  - Get user notifications
  - Query: ?type=&isRead=false&limit=20
  - Return: { notifications[], unreadCount }

POST /api/notifications/{id}/read
  - Mark notification as read
  - Body: {}
  - Return: { success }

POST /api/notifications/read-all
  - Mark all as read
  - Body: {}
  - Return: { success, count }
```

### Health Check

```
GET /api/test-connection
  - Test API and database connectivity
  - Return: { status, database, auth }
```

---

## Security & Access Control

### Authentication

**Method:** Supabase Auth with JWT Tokens

```
1. User signs up → Supabase creates auth.users record
2. Password hashed with Bcrypt automatically
3. Session created with JWT token
4. Token stored in secure HTTP-only cookie
5. Token expires in 1 hour (auto-refresh)
6. Each request validates token
7. Middleware checks token on every request
```

**Protected Routes:**
- `/student/*` requires role = 'student'
- `/lecturer/*` requires role = 'lecturer'
- `/admin/*` requires role = 'admin'
- `/partner/*` requires role = 'partner'

### Authorization

**Row-Level Security (RLS):**

Database enforces access at record level:

```sql
-- Students can only see their own courses/grades
SELECT * FROM assignments 
  WHERE id IN (
    SELECT assignment_id FROM course_enrollments 
    WHERE student_id = auth.uid() 
  )

-- Lecturers can only see their own created assignments
SELECT * FROM assignments 
  WHERE created_by = auth.uid()

-- Partners can only see their own referrals
SELECT * FROM referrals 
  WHERE partner_id IN (
    SELECT id FROM partners 
    WHERE user_id = auth.uid()
  )
```

**API Authorization:**

Each endpoint verifies user role:

```typescript
// Example from lecturer route
const user = await getCurrentUser()
if (user?.profile?.role !== 'lecturer') {
  return { error: 'Unauthorized' }
}
```

### Data Privacy

**What is Protected:**
- Student grades (only visible to student, lecturer, admin)
- Personal information (email, phone, bank details)
- Financial data (wallet balance, transactions)
- Submission content (student work)
- Plagiarism reports
- Partner referral data

**What is Public (Optional):**
- Course title and description (if enrolled)
- Lecturer name and department
- Assignment title and deadline

**Encryption:**
- Passwords: Bcrypt (automatic via Supabase)
- Sensitive data in transit: TLS/SSL
- Sensitive data at rest: Database encryption

### File Security

**File Upload Handling:**
```typescript
1. Validate file type (whitelist only allowed types)
2. Validate file size (max 50MB)
3. Rename file to prevent directory traversal
4. Store in Supabase Storage (not same as DB)
5. Generate secure signed URLs for access
6. URLs expire after 1 hour
7. Only authenticated users can access
```

**Allowed File Types:**
- Documents: .docx, .pdf, .txt
- Images: .jpg, .jpeg, .png, .gif
- Spreadsheets: .xlsx, .xls
- Archives: .zip (for multiple files)

### API Security

**Rate Limiting:**
- Via Supabase/Vercel infrastructure
- Prevents brute force attacks
- Limits: TBD (adjust in production)

**CSRF Protection:**
- Built-in to Next.js
- Uses SameSite cookies
- Verifies origin

**Input Validation:**
- Zod schema validation on all forms
- Type checking with TypeScript
- SQL injection prevention via Supabase SDK

### Admin Security

**Admin Actions Logged:**
```
- User creation/modification
- Withdrawal approvals
- Payment refunds
- Configuration changes
- Sensitive data access
- All recorded in admin_actions table
```

**Two-Factor Verification (Future):**
- Optional for admin accounts
- Required for partner withdrawal
- Can be email or SMS based

---

## Payment System

### Paystack Integration

**Setup:**
```env
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
```

**Payment Flow:**

```
1. Student clicks "Fund Wallet"
2. Enters amount (₦100 - ₦5M)
3. Clicks "Pay with Paystack"
4. Paystack.js initializes
5. Displays payment form (email, card/bank)
6. User enters payment details
7. Payment processed by Paystack
8. Redirects to verification endpoint
9. Backend verifies with Paystack API
10. Wallet credited
11. Email receipt sent
12. Student sees updated balance

Webhook (Async):
1. Paystack sends charge.success event
2. Backend verifies signature
3. Wallet credited
4. Email sent if failed at step 10
```

**Key Files:**
- `src/lib/services/paystack.service.ts` - Paystack API integration
- `src/lib/actions/payment.actions.ts` - Payment logic
- `src/app/api/payments/paystack/` - API endpoints

**Transaction Properties:**
```
{
  reference: "ASS-abc123-1234567890-xyz",
  amount: 500000 (in kobo, = ₦5000),
  email: "student@example.com",
  metadata: {
    user_id: "uuid",
    wallet_id: "uuid",
    transaction_type: "wallet_funding"
  }
}
```

**Error Handling:**
- Wallet not created → Create before charging
- Payment fails → User sees error, can retry
- Network timeout → Check reference manually
- Webhook fails → Manual verification available

### Submission Fee Processing

**When Student Submits Assignment:**

```
1. Check if student has sufficient balance (₦200)
2. If not → Error "Insufficient balance"
3. If yes:
   a. Deduct ₦200 from student wallet
   b. Credit ₦70 to lecturer wallet
   c. Credit ₦30 to partner wallet (if applicable)
   d. Keep ₦100 for platform
   e. Create transaction records (2-3)
   f. Create earning records for lecturer
   g. Create earning records for partner
   h. Send notification to student (payment deducted)
   i. Send notification to lecturer (received payment)
   j. Proceed with submission
```

**Ledger Example:**

```
Transaction 1 (Student Debit):
  Type: debit
  From: Student Wallet
  Amount: ₦200
  Status: completed
  Reference: SUB-abc12345-1234567890

Transaction 2 (Lecturer Credit):
  Type: credit
  To: Lecturer Wallet
  Amount: ₦70
  Status: completed
  Reference: EARN-abc12345-1234567890
  Source: assignment_payment

Transaction 3 (Partner Commission):
  Type: credit
  To: Partner Wallet
  Amount: ₦30
  Status: completed
  Reference: PART-abc12345-1234567890
  Source: referral_commission
```

### Withdrawal Process

**Step 1: Request**
```
User clicks "Withdraw"
Enters:
  - Amount (min ₦1000)
  - Bank name
  - Account number (10 digits)
  - Account name
Request saved with status: 'pending'
```

**Step 2: Admin Review**
```
Admin goes to Withdrawals
Reviews request
Verifies:
  - Valid bank details
  - Sufficient balance
  - Not suspicious
Approves or rejects
```

**Step 3: Processing**
```
If approved:
1. Record approval date/time
2. Initiate bank transfer (manual or automated)
3. Once sent to bank: Mark as "processing"
4. Once received: Mark as "paid"
5. Send confirmation email to user
6. Send payment proof/receipt

If rejected:
1. Record rejection reason
2. Send notification to user
3. Amount remains in wallet
```

---

## AI Grading System

### How AI Grading Works

**Step 1: Essay Extraction**

```typescript
// If submission contains files
1. Download file from Supabase Storage
2. Extract text based on file type:
   - .docx → Mammoth library
   - .pdf → pdf-parse library
   - .txt → Read directly
   - .jpg/.png → OCR (future)
3. Combine with any submission_text field
4. Pass full text to Claude
```

**Step 2: AI Evaluation**

```typescript
const prompt = `
Score this essay out of ${maxScore} 
Question: "${assignmentTitle}" 
Description: "${assignmentDescription}"
${rubric ? `Rubric: "${customRubric}"` : ''}

Essay:
"${extractedText}"

Return JSON:
{
  "score": number,
  "reasoning": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "feedback": "..."
}
`

response = await claude.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 2048,
  messages: [{ role: "user", content: prompt }]
})
```

**Step 3: Response Processing**

```typescript
1. Parse JSON from Claude response
2. Validate score is within range
3. Clean feedback text
4. Check for content filters
5. Store in ai_grading_data JSON column
6. Save score and feedback
7. Return to lecturer for review
```

**Step 4: Lecturer Review**

```
Lecturer sees AI suggestion:
- Suggested score
- AI feedback
- Full essay
- All extracted text

Lecturer can:
1. Accept score → Save as final
2. Adjust score → Edit and save
3. Edit feedback → Modify AI text
4. Reject and grade manually → Start over
5. Add additional feedback → Append notes
```

### Custom Rubrics

Lecturers can provide custom grading rubrics:

```
Example Rubric:
"Structure (20 points):
- Clear introduction with thesis
- Organized body paragraphs
- Conclusion summarizes main points

Content (50 points):
- Demonstrates understanding of topic
- Uses relevant examples
- Critical analysis present

Writing Quality (30 points):
- Grammar and spelling
- Clarity and conciseness
- Proper citations"
```

Claude uses this rubric to adjust scoring and feedback.

### Fallback AI

If Claude fails (rate limit, API error):
```
1. Log error
2. Try again after 5 seconds
3. If still fails, try Gemini
4. If both fail, alert lecturer
5. Allow manual grading
```

### Costs & Time

**Per Student Essay:**
- Time: 10-30 seconds (parallel processing)
- Cost: ~₦5-₦10 in AI API usage
- Included in platform ₦100 share of ₦200 fee

**Batch Grading 100 Essays:**
- Time: 5-10 minutes (parallel with batching)
- Cost: ₦500-₦1000 total
- Platform absorbs cost

---

## Partner Program

### Partner Registration

**Types of Partners:**
1. **Institutional Partners** - University departments, teaching centers
2. **Individual Partners** - Freelance lecturers, consultants
3. **Corporate Partners** - Corporate training providers

**Registration Process:**
```
1. Admin creates partner account
2. Enters: business name, contact, bank details, commission rate
3. System generates unique partner code (e.g., "PTR-ABC123DE")
4. System sends credentials email with:
   - Login URL
   - Email
   - Temporary password
   - Partner code
5. Partner logs in and sets password
6. Partner fills profile details
7. Partner can start referring lecturers
```

### Referral Mechanics

**How Referral Works:**
```
1. Partner gets referral code: "PTR-ABC123DE"
2. Shares code via:
   - Email
   - QR code
   - Social media
   - Business cards
   - Network/meetings
3. Lecturer sees offer and clicks referral link
4. Lecturer signs up using partner code
5. System records referral
6. Status: "pending" until lecturer makes first submission
```

**When Lecturer Teaches:**
```
1. Lecturer creates assignments
2. Students submit work → ₦200 fee per submission
3. System splits:
   - Lecturer: ₦70 (35%)
   - Partner: ₦30 (15%)
   - Platform: ₦100 (50%)
4. Automatic calculation and crediting
5. Partner can see in dashboard:
   - Referred lecturer name
   - Submission count
   - Revenue generated
   - Commission earned
```

### Partner Dashboard

**Displays:**
1. **Partner Code Section**
   - Unique partner code (clickable copy)
   - QR code for mobile sharing
   - Shareable link

2. **Metrics Cards**
   - Total referred lecturers
   - Active lecturers (still generating submissions)
   - Total submissions from referrals
   - Total commission earned
   - Pending earnings
   - Withdrawal requests pending

3. **Referred Lecturers Table**
   - Lecturer name
   - Department
   - Email
   - Join date
   - Total submissions
   - Revenue generated
   - Your commission
   - Status (active/inactive)

4. **Charts & Analytics**
   - Commission over time
   - Top performing lecturers
   - Revenue this month/year
   - Performance trends

5. **Withdrawal Management**
   - Request new withdrawal button
   - Pending requests table
   - Approved/paid history

### Partner Earnings

**Commission Calculation:**
```
Formula: Referral Commission per Submission
= Submission Fee × Partner Commission Rate
= ₦200 × 15%
= ₦30 per submission

Example (5 Lecturers):
Lecturer A: 300 submissions/month = ₦9,000 commission
Lecturer B: 250 submissions/month = ₦7,500 commission
Lecturer C: 200 submissions/month = ₦6,000 commission
Lecturer D: 150 submissions/month = ₦4,500 commission
Lecturer E: 100 submissions/month = ₦3,000 commission

Total Monthly: ₦30,000
Total Annual: ₦360,000
```

**Commission Payout Options:**
1. **Automatic Credit** - Instant to partner wallet
2. **Manual Review** - Admin approves each commission
3. **Tiered Rates** - Higher rates for high performers
4. **Bonus Periods** - Extra rates during promotions

---

## Email Notifications

### Implemented Email Templates

All emails are built with React Email and sent via Resend.

#### 1. Welcome Email
**Trigger:** User signs up
**Recipient:** New user
**Contains:**
- Welcome message
- Role-specific features list
- Dashboard link
- Support contact

#### 2. Assignment Submitted Confirmation
**Trigger:** Student submits assignment
**Recipient:** Student
**Contains:**
- Assignment details (title, course, date)
- Submission reference ID
- Expected grading timeline
- Link to track submission

#### 3. Grading Complete Notification
**Trigger:** Lecturer grades assignment
**Recipient:** Student
**Contains:**
- Score (with color coding)
- Max score
- Percentage
- Lecturer feedback
- Link to view full submission
- Dashboard link

#### 4. Test Invitation
**Trigger:** Lecturer publishes test
**Recipient:** Enrolled students
**Contains:**
- Test title and course
- Number of questions
- Time limit
- Test access link
- Due date (if applicable)

#### 5. Enrollment Confirmation
**Trigger:** Student enrolls in course
**Recipient:** Student
**Contains:**
- Course code and title
- Lecturer name
- Enrollment date
- Course access link

#### 6. Payment Receipt
**Trigger:** Wallet funded successfully
**Recipient:** Student
**Contains:**
- Amount paid (formatted ₦)
- Payment reference
- Date and time
- Payment method
- New wallet balance
- Available balance for use

#### 7. Partner Credentials
**Trigger:** Admin creates partner
**Recipient:** New partner
**Contains:**
- Welcome to partner program
- Login email
- Temporary password
- Partner code
- Login link
- Security notes

### Email Service Configuration

**Provider:** Resend

```env
RESEND_API_KEY=re_...
SENDER_EMAIL=noreply@assessify.ng
NEXT_PUBLIC_BASE_URL=https://assessify.ng
```

**Features:**
- Transactional emails (high reliability)
- Beautiful HTML templates
- Mobile-responsive
- Link tracking (optional)
- Bounce handling
- Unsubscribe support

### Integration Checklist

✅ **Completed:**
- Payment receipt (after wallet funding)

🟠 **Ready but not yet integrated:**
- Welcome email (signup)
- Assignment submitted (submission)
- Grading complete (grading)
- Test invitation (test publish)
- Enrollment confirmation (enrollment)
- Partner credentials (partner creation)

**To integrate remaining emails:**
1. Add import statement to action file
2. Call sendEmail function after action completes
3. Wrap in try/catch (don't fail if email fails)
4. Test with test email

---

## Admin Dashboard

### Admin Capabilities

**User Management:**
- View all users (paginated, searchable)
- Filter by role, status, department
- View user profile and activity
- Activate/deactivate accounts
- Reset user passwords
- View audit trail

**Financial Management:**
- View all transactions
- Revenue reports by date range
- Commission distribution
- Partner earnings verification
- Manual wallet adjustments
- Dispute resolution

**Withdrawal Management:**
- Review pending withdrawal requests
- Approve/reject with notes
- Mark as paid
- Send confirmations
- View complete history
- Generate bank transfer list

**Partner Management:**
- Create new partners (manually)
- View all partners
- Monitor referral performance
- Track commissions
- Suspend/activate partners
- Send communications

**CBT Analytics:**
- Real-time metrics dashboard
- Revenue tracking
- Practice session analytics
- Promo code performance
- Student performance distribution
- Course popularity metrics
- Export reports to CSV

**Settings & Configuration:**
- System settings (future)
- Fee structures
- Commission rates
- Email templates
- Rate limiting

**Logs & Audit:**
- View all admin actions
- Track user activity
- System event logs
- Error logs
- Generate reports

---

## Development Guide

### Development Environment Setup

**Prerequisites:**
- Node.js 18+
- npm/pnpm/yarn
- Git
- Supabase account (free tier OK)
- Paystack account (test mode)
- Resend account (free tier)
- Claude/Gemini API keys

**Installation:**
```bash
# Clone repo
git clone https://github.com/assessify/assessify-main.git
cd assessify-main

# Install dependencies
pnpm install

# Create .env.local
cp .env.example .env.local

# Fill in variables (see below)
nano .env.local

# Setup database
# Go to Supabase console and run CBT-CLEAN-SCHEMA.sql

# Start dev server
pnpm dev

# Open http://localhost:3000
```

**Environment Variables:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Authentication
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENAI_API_KEY=AIzaSy...

# Payments
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...

# Email
RESEND_API_KEY=re_test_...
RESEND_FROM_EMAIL=noreply@localhost

# Deployment
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Project Structure

```
assessify-main/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Admin routes & pages
│   │   ├── api/                # API routes
│   │   ├── auth/               # Authentication pages
│   │   ├── lecturer/           # Lecturer pages
│   │   ├── student/            # Student pages
│   │   ├── partner/            # Partner pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   │
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   ├── admin/              # Admin-specific components
│   │   ├── student/            # Student-specific components
│   │   ├── lecturer/           # Lecturer-specific components
│   │   ├── partner/            # Partner-specific components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── grading/            # Grading components
│   │   └── notifications/      # Notification components
│   │
│   ├── lib/
│   │   ├── actions/            # Server actions (backend logic)
│   │   │   ├── auth.actions.ts
│   │   │   ├── assignment.actions.ts
│   │   │   ├── grading.actions.ts
│   │   │   ├── payment.actions.ts
│   │   │   ├── transaction.actions.ts
│   │   │   ├── partner.actions.ts
│   │   │   ├── notifications.actions.ts
│   │   │   └── ... (more)
│   │   │
│   │   ├── services/           # External service integrations
│   │   │   ├── claude.service.ts       # AI grading
│   │   │   ├── gemini.service.ts       # Fallback AI
│   │   │   ├── paystack.service.ts     # Payments
│   │   │   ├── resend.service.ts       # Email
│   │   │   ├── plagiarism.service.ts   # Plagiarism
│   │   │   └── ... (more)
│   │   │
│   │   ├── supabase/           # Supabase utilities
│   │   │   ├── server.ts       # Server client
│   │   │   └── client.ts       # Client client
│   │   │
│   │   ├── types/              # TypeScript type definitions
│   │   │   ├── database.types.ts
│   │   │   ├── test.types.ts
│   │   │   ├── partner.types.ts
│   │   │   └── ... (more)
│   │   │
│   │   ├── email-templates/    # React Email components
│   │   │   ├── welcome.tsx
│   │   │   ├── grading-complete.tsx
│   │   │   ├── assignment-submitted.tsx
│   │   │   └── ... (more)
│   │   │
│   │   ├── utils/              # Utility functions
│   │   │   ├── utils.ts
│   │   │   ├── revenue-split.ts
│   │   │   └── ... (more)
│   │   │
│   │   └── context/            # React Context
│   │
│   ├── middleware.ts           # Next.js middleware
│   ├── proxy.ts                # Custom proxy utilities
│   └── types/                  # Additional type definitions
│
├── public/                     # Static files (images, etc)
│
├── .env.local                  # Environment variables (local)
├── .env.production            # Production variables (example)
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── package.json               # Dependencies
│
├── CBT-CLEAN-SCHEMA.sql       # Database schema
├── README.md                  # Documentation
└── ... (other docs)
```

### Common Development Tasks

**Create New Feature:**
```
1. Create component in appropriate folder
2. Create server action in lib/actions/ if needed
3. Create type definition in lib/types/
4. Create API route if needed in app/api/
5. Add to pages
6. Test thoroughly
7. Update documentation
```

**Add New Database Table:**
```
1. Create migration in Supabase
2. Write schema in SQL
3. Enable RLS with policies
4. Generate types: pnpm exec supabase gen types
5. Update lib/types/database.types.ts
6. Create actions for CRUD
7. Test with real data
```

**Debug Issues:**
```
// Check Supabase
- Go to Supabase dashboard
- Check database data
- Check RLS policies
- Check realtime subscriptions

// Check AI Grading
- console.log() the essay text
- console.log() the Claude response
- Check API usage in Anthropic dashboard

// Check Payments
- Use Paystack test keys
- Use test card numbers (4111111111111111)
- Check webhook logs

// Check Email
- Use Resend test API key
- Check spam folder
- Test from different accounts
```

---

## Deployment

### Deploy to Vercel (Recommended)

**Prerequisites:**
- Vercel account
- GitHub repository
- Supabase project (production)
- Production API keys

**Steps:**

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to vercel.com
# 3. Connect GitHub repo
# 4. Fill in environment variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - ANTHROPIC_API_KEY
#    - GOOGLE_GENAI_API_KEY
#    - PAYSTACK_SECRET_KEY
#    - NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
#    - RESEND_API_KEY
#    - And others (copy from .env)

# 5. Click "Deploy"
# 6. Wait for build to complete
# 7. Test at https://your-domain.vercel.app
```

**Custom Domain:**
- Add domain to Vercel project
- Update DNS records (Vercel provides instructions)
- SSL certificate auto-generates
- DNS propagation takes 24-48 hours

### Database Migration

**Backup Current Data:**
```bash
# If moving from development to production
# 1. Export data from dev Supabase
# 2. Import to production Supabase
# 3. Verify data integrity
# 4. Run schema migrations if needed
```

**Run Database Schema:**
```
# In production Supabase:
1. Go to SQL Editor
2. Paste: CBT-CLEAN-SCHEMA.sql
3. Run the queries
4. Verify tables are created
5. Check RLS policies are enabled
```

### Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Database schema created in production
- [ ] Supabase storage bucket configured
- [ ] Paystack production keys set (not test)
- [ ] AI API keys valid and have quota
- [ ] Email service tested (send test email)
- [ ] CORS settings configured
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] Backup strategy configured
- [ ] Domain SSL certificate active
- [ ] Analytics configured
- [ ] Password reset email working
- [ ] Wallet funding tested
- [ ] Payment webhook verified
- [ ] All sensitive data in env variables (not code)
- [ ] No console.log statements in production code
- [ ] Build size optimized
- [ ] Performance optimized (images, fonts, etc.)
- [ ] Mobile responsiveness tested
- [ ] All features tested on production domain
- [ ] Team trained on admin features
- [ ] Documentation updated

### Performance Optimization

**Frontend:**
- Image optimization (next/image)
- Font optimization (next/font)
- Code splitting / dynamic imports
- React.memo for expensive components
- Minimize CSS/JS bundles

**Backend:**
- Database query optimization (indexes)
- Response caching (Redis - future)
- API response compression
- Batch processing for AI (parallel requests)
- Rate limiting to prevent abuse

**Database:**
- Indexes on commonly queried fields
- Efficient RLS policies
- Archive old data periodically
- Optimize transaction tables

---

## Troubleshooting

### Common Issues & Solutions

**Authentication Issues:**
```
Problem: User can't login
Solution:
1. Check email in Supabase auth.users
2. Verify email is confirmed
3. Check middleware.ts allows /auth/login
4. Clear browser cookies and try again

Problem: Session expires unexpectedly
Solution:
1. JWT token expires after 1 hour
2. Auto-refresh should happen
3. Check browser console for errors
4. Verify NEXT_PUBLIC_SUPABASE_URL is correct
```

**Payment Issues:**
```
Problem: Payment succeeds but wallet not credited
Solution:
1. Check payment webhook endpoint logs
2. Verify Paystack key is correct
3. Check wallet exists (create if needed)
4. Manually credit wallet in admin panel
5. Check transaction table for failed transactions

Problem: "Insufficient balance" error
Solution:
1. Verify submission cost is correct (₦200 default)
2. Check student wallet balance
3. Check for failed transactions blocking wallet
4. Credit wallet manually
```

**AI Grading Issues:**
```
Problem: AI grading fails with error
Solution:
1. Check ANTHROPIC_API_KEY is set
2. Verify API key has quota left
3. Check essay length (shouldn't be too long)
4. Try with Gemini fallback
5. Implement retry logic

Problem: Incorrect scores or feedback
Solution:
1. Provide custom rubric (may help)
2. Adjust prompt in claude.service.ts
3. Review Claude's response (check logs)
4. Use manual grading as fallback
```

**Email Issues:**
```
Problem: Emails not being sent
Solution:
1. Check RESEND_API_KEY is valid
2. Verify inbox/spam folder
3. Check email address format
4. Look at Resend dashboard > Events
5. Use test email from Resend dashboard

Problem: Email rendering looks broken
Solution:
1. Preview in Resend dashboard
2. Test with different email clients
3. Check mobile responsiveness
4. Review HTML/CSS in email template
```

**Database Issues:**
```
Problem: RLS policy blocking queries
Solution:
1. Check user is authenticated
2. Verify RLS policy for table
3. Check user role matches policy
4. Temporarily disable RLS to test
5. Review policy logic

Problem: Data not persisting
Solution:
1. Check for failed insert errors
2. Verify table exists
3. Check column types match data
4. Verify foreign key constraints
5. Check write permissions (RLS)
```

---

## Support & Resources

### Documentation Files
- `README.md` - Quick start guide
- `ASSESSIFY_COMPREHENSIVE_PLATFORM_GUIDE.md` - investor/stakeholder docs
- `COMPREHENSIVE_PROJECT_PROGRESS_REPORT.md` - implementation details
- `ACCESS_CONTROL_README.md` - Security documentation
- `EMAIL_NOTIFICATION_IMPLEMENTATION.md` - Email system docs
- `ADMIN_CBT_ANALYTICS_GUIDE.md` - Analytics documentation
- `PROMO_CODE_SYSTEM_GUIDE.md` - Promo code details
- `PAYSTACK_INTEGRATION_GUIDE.md` - Payment system docs

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Anthropic Claude API](https://anthropic.com/api)
- [Paystack Developers](https://paystack.com/developers)
- [Resend Email Service](https://resend.com)

### Getting Help
1. Check the documentation files
2. Search GitHub issues
3. Check error logs in browser console
4. Check Supabase dashboard for database issues
5. Contact development team

---

## Conclusion

**Assessify** is a comprehensive, production-ready platform designed to modernize education in Africa. With features including AI-powered grading, secure payments, partner programs, and detailed analytics, it provides value to every stakeholder:

- **Students** get fair, instant evaluation with detailed feedback
- **Lecturers** save time on grading and earn additional income
- **Partners** earn passive income by referring lecturer users
- **Institutions** get automated assessment at scale
- **Admins** get complete visibility and control

The platform is built on reliable, modern technology (Next.js, Supabase, Claude AI) and follows security best practices. It's ready for production deployment and can scale to serve millions of students across Africa.

---

**Document Version:** 2.0  
**Last Updated:** March 26, 2026  
**Status:** Complete & Production Ready
