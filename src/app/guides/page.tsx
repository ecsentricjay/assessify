'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FooterContent } from '@/components/footer/footer-content';

function PublicNav() {
  return (
    <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E5E7EB' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="/images/logo/assessify-logo-icon.png" alt="Assessify" width={34} height={34} style={{ borderRadius: 8 }} />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5, color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ASSESSIFY</span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/auth/login" style={{ color: '#6B7280', textDecoration: 'none', fontWeight: 600, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Log in</Link>
          <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1565F5', color: '#fff', padding: '9px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Get started free →</Link>
        </div>
      </div>
    </nav>
  );
}

type FilterKey = 'All' | 'Students' | 'Lecturers' | 'CBT' | 'Wallet';

interface Guide {
  id: number;
  title: string;
  description: string;
  duration: string;
  category: FilterKey;
  audience: string;
  icon: string;
  steps: string[];
}

const GUIDES: Guide[] = [
  {
    id: 1,
    title: 'Creating your account and setting up your profile',
    description: 'Get up and running on Assessify in under 5 minutes. Covers signup, role selection, and profile completion.',
    duration: '5 min', category: 'All', audience: 'All users', icon: '🚀',
    steps: [
      'Go to assessify.ng and click "Get Started Free"',
      'Enter your name, email address, and choose a password',
      'Select your role: Student, Lecturer, or Partner',
      'Students: enter your matric number and department. Lecturers: enter your staff ID and department',
      'Verify your email address via the confirmation link sent to your inbox',
      'Log in and complete your profile — add your faculty, phone number, and institution',
      'Fund your wallet if you are a student (needed before submitting assignments)',
    ],
  },
  {
    id: 2,
    title: 'How to submit an assignment as a student',
    description: 'Step-by-step guide for finding, preparing, and submitting assignment work through your student dashboard.',
    duration: '6 min', category: 'Students', audience: 'Students', icon: '📝',
    steps: [
      'Log in and go to your Student Dashboard',
      'Click "Assignments" in the left sidebar',
      'Find the assignment from your enrolled course list, or paste a standalone access code from your lecturer',
      'Read the assignment instructions carefully and download any attached documents',
      'Prepare your submission — you can type directly, or upload a DOCX, PDF, TXT, or image file',
      'Ensure your wallet has at least ₦200 balance before submitting (fund via Wallet → Add Funds)',
      'Click Submit — the ₦200 fee is deducted and a confirmation email is sent to you',
      'Track your submission status under Assignments → My Submissions',
    ],
  },
  {
    id: 3,
    title: 'How to create and publish an assignment (lecturers)',
    description: 'Create assignments with deadlines, file support, AI grading, and plagiarism detection — for enrolled courses or as standalone shareable links.',
    duration: '8 min', category: 'Lecturers', audience: 'Lecturers', icon: '📋',
    steps: [
      'Log in and go to your Lecturer Dashboard',
      'Click "Assignments" → "Create Assignment"',
      'Choose: Course Assignment (tied to an enrolled course) or Standalone Assignment (shareable link)',
      'Fill in the title, description, and full assignment instructions',
      'Set a submission deadline and configure late submission settings if needed',
      'Optionally attach a reference document for students to download',
      'Enable "AI Grading" if you want AI to evaluate essays, and optionally write a custom grading rubric',
      'Enable "Plagiarism Detection" to automatically scan all submissions',
      'Click Publish — students can now submit. For standalone assignments, copy the access code/link to share',
    ],
  },
  {
    id: 4,
    title: 'Grading submissions with AI assistance',
    description: 'Use AI to grade essays instantly. Review suggestions, adjust scores, add your own feedback, and publish grades in bulk.',
    duration: '10 min', category: 'Lecturers', audience: 'Lecturers', icon: '🤖',
    steps: [
      'Navigate to the assignment and click "View Submissions"',
      'To grade one submission: open it, click "AI Grade This", wait ~15 seconds for the result',
      'To grade all at once: click "Batch AI Grade" — the system processes every ungraded submission in parallel',
      'Review the AI-suggested score and feedback for each submission',
      'Adjust the score or rewrite the feedback if needed — you always have final control',
      'Click "Save Grade" to confirm. The student is notified by email immediately',
      'For plagiarism-flagged submissions: review the similarity report and decide to Accept or Reject',
      'View grading progress from the assignment dashboard — graded vs. ungraded counts update in real time',
    ],
  },
  {
    id: 5,
    title: 'Running CBT practice sessions (students)',
    description: 'How to purchase a CBT bundle, start a practice session, and make the most of WAEC, JAMB, and GST practice questions.',
    duration: '7 min', category: 'CBT', audience: 'Students', icon: '🧠',
    steps: [
      'Go to Student Dashboard → "CBT Practice"',
      'Browse available bundles — each bundle covers one or more subjects/courses for a set validity period',
      'Apply a promo code if you have one (discounts apply automatically at checkout)',
      'Pay with your wallet balance or via Paystack (card, bank transfer, USSD)',
      'Once purchased, click the bundle to start a practice session',
      'Choose the number of questions and click Start — questions are randomly selected and shuffled each session',
      'Answer questions within the time limit. A live countdown timer is always visible',
      'After submitting, view your score, see which questions you got wrong, and read the solution for each',
      'Track your performance history and check the national leaderboard from the CBT section',
    ],
  },
  {
    id: 6,
    title: 'Creating and managing CBT tests (lecturers)',
    description: 'Build timed tests with MCQ and essay questions, set pass marks, and publish to enrolled students with optional access codes.',
    duration: '9 min', category: 'Lecturers', audience: 'Lecturers', icon: '📊',
    steps: [
      'Go to Lecturer Dashboard → "Tests" → "Create Test"',
      'Enter the test title, description, and instructions for students',
      'Set the duration (in minutes), start time, and end time window',
      'Configure the pass mark, maximum attempts, and whether to show results immediately',
      'Enable question shuffling and option shuffling to prevent cheating',
      'Add questions one by one (MCQ, True/False) or import from a CSV file using the provided template',
      'For each MCQ: write the question, add 4 options, mark the correct answer',
      'Preview the test as a student before publishing',
      'Click Publish — students in the linked course can now access the test within the time window',
    ],
  },
  {
    id: 7,
    title: 'Funding your wallet and withdrawing earnings',
    description: 'How to top up your wallet via Paystack, check your balance, and request withdrawals to your Nigerian bank account.',
    duration: '6 min', category: 'Wallet', audience: 'All users', icon: '💳',
    steps: [
      'Go to your dashboard and click "Wallet" in the sidebar',
      'To add funds: click "Add Funds", enter the amount, and click "Pay with Paystack"',
      'Complete payment via Paystack using your debit card, bank transfer, or USSD code',
      'Your wallet is credited instantly. A receipt email is sent to you automatically',
      'To withdraw: click "Withdrawals" → "Request Withdrawal"',
      'Enter the amount, your bank name, account number, and account name',
      'Submit the request — it is reviewed by admin and processed within 1–3 business days',
      'You receive a notification when your withdrawal is approved and when the transfer is sent',
      'View your full transaction history (earnings, submissions, referrals, withdrawals) from the Wallet page',
    ],
  },
  {
    id: 8,
    title: 'Using your referral code to earn commissions',
    description: 'Find your unique referral code, share it, and earn commissions automatically when others purchase CBT bundles or use your code.',
    duration: '5 min', category: 'Wallet', audience: 'All users', icon: '💸',
    steps: [
      'Log in and go to your Dashboard — your unique referral code is displayed on the main dashboard',
      'Your code format depends on your role: STUD-XXXXXXXX (students), LECT-XXXXXXXX (lecturers), PART-XXXXXXXX (partners)',
      'Share your code via WhatsApp, social media, or directly with classmates and colleagues',
      'When someone uses your code to purchase a CBT bundle, your commission is credited to your wallet instantly',
      'There is no limit to how many people you can refer — commissions stack',
      'Track your referral earnings from Dashboard → Earnings (or Partner Earnings for partners)',
      'Withdraw your referral earnings at any time using the standard withdrawal process',
    ],
  },
  {
    id: 9,
    title: 'Understanding your analytics and performance data',
    description: 'Navigate your dashboard analytics to track grades, submission history, CBT scores, and earnings over time.',
    duration: '7 min', category: 'All', audience: 'All users', icon: '📈',
    steps: [
      'Students: go to Dashboard → Scores to see all graded assignments and test results by course',
      'Students: go to CBT Practice → History to view all past sessions with scores and accuracy rates',
      'Lecturers: go to Dashboard → Analytics for grade distributions and class performance per assignment',
      'Lecturers: go to Earnings to see a breakdown of income by assignment and over time',
      'Partners: go to Partner Dashboard → Referrals to see all referred lecturers, their submission counts, and your commissions',
      'Admin: the Admin Dashboard shows platform-wide revenue, submission volumes, active users, and CBT analytics',
      'Any user can export transaction and earnings data from the Wallet page',
    ],
  },
];

const FILTERS: FilterKey[] = ['All', 'Students', 'Lecturers', 'CBT', 'Wallet'];

const FILTER_COLORS: Record<FilterKey, { active: string; badge: string; text: string }> = {
  All: { active: '#1565F5', badge: '#EFF6FF', text: '#1565F5' },
  Students: { active: '#059669', badge: '#ECFDF5', text: '#059669' },
  Lecturers: { active: '#7C3AED', badge: '#F5F3FF', text: '#7C3AED' },
  CBT: { active: '#D97706', badge: '#FFFBEB', text: '#D97706' },
  Wallet: { active: '#0891B2', badge: '#ECFEFF', text: '#0891B2' },
};

export default function GuidesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = activeFilter === 'All'
    ? GUIDES
    : GUIDES.filter(g => g.category === activeFilter || g.category === 'All');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        .guides-page * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .filter-btn { padding: 9px 20px; border-radius: 100px; font-size: 14px; font-weight: 600; border: 1.5px solid #E5E7EB; cursor: pointer; transition: all 0.2s; background: #fff; color: #6B7280; white-space: nowrap; }
        .guide-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden; transition: box-shadow 0.2s; }
        .guide-card:hover { box-shadow: 0 6px 24px rgba(21,101,245,0.08); }
        .guide-header { width: 100%; display: flex; align-items: flex-start; gap: 16px; padding: 24px; background: #fff; border: none; cursor: pointer; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; transition: background 0.15s; }
        .guide-header:hover { background: #F8FAFF; }
        .step-number { width: 28px; height: 28px; border-radius: 50%; background: #1565F5; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        @media (max-width: 768px) {
          .hero-h1 { font-size: 34px !important; }
          .guides-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="guides-page" style={{ background: '#FAFAFA', minHeight: '100vh' }}>
        <PublicNav />

        {/* ── Hero ── */}
        <section style={{ paddingTop: 64, background: 'linear-gradient(160deg, #030D2A 0%, #071650 45%, #0A1E6E 60%, #030D2A 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '15%', right: '8%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 72px', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(21,101,245,0.2)', border: '1px solid rgba(21,101,245,0.4)', borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ fontSize: 14 }}>📖</span>
              <span style={{ color: '#7EC8FF', fontSize: 13, fontWeight: 600 }}>Learning Centre</span>
            </div>
            <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
              Guides &{' '}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>tutorials</span>
            </h1>
            <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.7, maxWidth: 560, marginBottom: 32 }}>
              Step-by-step walkthroughs for every part of Assessify — from submitting your first assignment to managing a full class of CBT students.
            </p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { n: GUIDES.filter(g => g.category === 'Students' || g.category === 'All').length, label: 'Student guides' },
                { n: GUIDES.filter(g => g.category === 'Lecturers' || g.category === 'All').length, label: 'Lecturer guides' },
                { n: GUIDES.length, label: 'Total guides' },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '6px 16px' }}>
                  <span style={{ fontWeight: 800, color: '#00CFFF', fontSize: 16 }}>{s.n}</span>
                  <span style={{ color: '#94A3B8', fontSize: 13 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <main style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 24px 80px' }}>

          {/* ── Filters ── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 48, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', marginRight: 4 }}>Filter by:</span>
            {FILTERS.map((f) => (
              <button key={f} className="filter-btn" onClick={() => { setActiveFilter(f); setExpandedId(null); }}
                style={{
                  background: activeFilter === f ? FILTER_COLORS[f].active : '#fff',
                  color: activeFilter === f ? '#fff' : '#6B7280',
                  borderColor: activeFilter === f ? FILTER_COLORS[f].active : '#E5E7EB',
                }}>
                {f}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF' }}>{filtered.length} guide{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* ── Guide list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((guide) => {
              const colors = FILTER_COLORS[guide.category];
              const isOpen = expandedId === guide.id;
              return (
                <div key={guide.id} className="guide-card">
                  <button className="guide-header" onClick={() => setExpandedId(isOpen ? null : guide.id)}>
                    {/* Icon */}
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.badge, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                      {guide.icon}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>{guide.title}</span>
                        <span style={{ background: colors.badge, color: colors.text, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 100, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                          {guide.audience}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, margin: 0 }}>{guide.description}</p>
                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>📖 {guide.duration} read</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>✓ {guide.steps.length} steps</span>
                      </div>
                    </div>
                    {/* Chevron */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: isOpen ? '#1565F5' : '#EFF6FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isOpen ? '#fff' : '#1565F5', fontSize: 18, lineHeight: 1,
                      transition: 'all 0.2s',
                    }}>
                      {isOpen ? '−' : '+'}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid #E8EEFF', padding: '28px 24px', background: '#F8FAFF' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
                        Step-by-step guide
                      </div>
                      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {guide.steps.map((step, i) => (
                          <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div className="step-number" style={{ background: colors.active }}>{i + 1}</div>
                            <span style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, paddingTop: 3 }}>{step}</span>
                          </li>
                        ))}
                      </ol>
                      <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: '#9CA3AF' }}>Was this guide helpful?</span>
                        <Link href="/contact" style={{ fontSize: 13, color: '#1565F5', textDecoration: 'none', fontWeight: 600 }}>
                          Contact support if you need more help →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Quick tips ── */}
          <section style={{ marginTop: 80, marginBottom: 80 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1565F5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Quick reference</p>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: '#111827', letterSpacing: -1, marginBottom: 0 }}>
                Tips to get the{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#1565F5' }}>most out of Assessify</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }} className="guides-grid">
              {[
                { icon: '💡', color: '#D97706', bg: '#FFFBEB', title: 'Fund your wallet first', desc: 'Students: add funds before your assignment deadline. Wallet top-up via Paystack is instant.' },
                { icon: '📋', color: '#7C3AED', bg: '#F5F3FF', title: 'Write your rubric clearly', desc: 'Lecturers: the more specific your rubric, the more accurate the AI grading will be.' },
                { icon: '🔗', color: '#1565F5', bg: '#EFF6FF', title: 'Use standalone assignments', desc: 'For external students or quick assessments, create a standalone assignment and share the link directly.' },
                { icon: '🧠', color: '#059669', bg: '#ECFDF5', title: 'Practice CBT daily', desc: 'Even 20 questions a day adds up. Short, consistent sessions beat marathon cramming for WAEC and JAMB.' },
                { icon: '💸', color: '#0891B2', bg: '#ECFEFF', title: 'Share your referral code', desc: 'Your promo code earns you money on every CBT bundle purchase. Share it on WhatsApp and class groups.' },
                { icon: '📊', color: '#DC2626', bg: '#FEF2F2', title: 'Check the leaderboard', desc: 'CBT leaderboard rankings reset regularly. Consistent sessions keep your rank high and visible to peers.' },
              ].map((tip, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: 22, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: tip.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{tip.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: 14, marginBottom: 5 }}>{tip.title}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{tip.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{ background: 'linear-gradient(135deg, #030D2A 0%, #071650 100%)', borderRadius: 24, padding: '56px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, left: '20%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, right: '15%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 16 }}>
                Still have questions?
              </h2>
              <p style={{ fontSize: 17, color: '#94A3B8', marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
                Our Nigeria-based support team is ready to help. Reach out anytime.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1565F5', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                  Contact support →
                </Link>
                <Link href="/faq" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)' }}>
                  Browse the FAQ
                </Link>
              </div>
            </div>
          </section>

        </main>
        <FooterContent />
      </div>
    </>
  );
}