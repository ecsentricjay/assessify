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

type TabKey = 'lecturers' | 'students' | 'institutions';

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'lecturers', label: 'For Lecturers', emoji: '👨‍🏫' },
  { key: 'students', label: 'For Students', emoji: '🎓' },
  { key: 'institutions', label: 'For Institutions', emoji: '🏛️' },
];

const ROLE_FEATURES: Record<TabKey, { icon: string; title: string; desc: string }[]> = {
  lecturers: [
    { icon: '🤖', title: 'AI-Assisted Essay Grading', desc: 'Submit a rubric and let the AI read, evaluate, and score each essay submission. Review the suggestion and override any score in one click.' },
    { icon: '⚡', title: 'Batch Grading', desc: 'Grade an entire class in one operation. AI processes every submission in parallel — results typically arrive within minutes, not days.' },
    { icon: '🔍', title: 'Plagiarism Detection', desc: 'Every submission is automatically cross-checked against all others in the assignment. Suspicious pairs are flagged with a similarity score for your review.' },
    { icon: '📋', title: 'Custom Rubrics', desc: 'Define exactly what earns marks and how. The grading engine follows your rubric precisely, ensuring consistency across every submission.' },
    { icon: '🔗', title: 'Standalone Assignments', desc: 'Create a shareable assignment link with a unique access code. Students can submit without being enrolled in a course — perfect for external assessments.' },
    { icon: '💰', title: 'Earn from Submissions', desc: 'A share of every submission fee is credited to your wallet automatically. Withdraw to any Nigerian bank account at any time.' },
    { icon: '📊', title: 'Class Analytics', desc: 'View grade distributions, performance trends, and per-student progress. Export data as CSV for further reporting.' },
    { icon: '📧', title: 'Automated Notifications', desc: 'Students receive email confirmations on submission and email notifications when grading is complete — no manual follow-up needed.' },
  ],
  students: [
    { icon: '📝', title: 'Multi-Format Submission', desc: 'Submit work in DOCX, PDF, plain text, or images. Multiple files can be combined into a single submission — no format restrictions.' },
    { icon: '⚡', title: 'Fast Feedback', desc: 'AI-assisted grading means detailed feedback arrives quickly. No more waiting weeks to find out how you did.' },
    { icon: '📊', title: 'CA Score Dashboard', desc: 'See all your continuous assessment scores across every course in one clear dashboard. Track your progress in real time.' },
    { icon: '🧠', title: 'CBT Practice — WAEC & JAMB', desc: 'Access thousands of past questions organised by subject and difficulty. Practice under real exam conditions with a live timer and instant marking.' },
    { icon: '🏫', title: 'GST University Courses', desc: 'Practice for Use of English, Philosophy, Government, and other GST courses with questions tailored to Nigerian university syllabuses.' },
    { icon: '🥇', title: 'National Leaderboard', desc: 'See how your CBT scores compare with students across Nigeria. Competitive rankings make study sessions more engaging.' },
    { icon: '💸', title: 'Learn & Earn', desc: 'Share your unique referral code. Every time someone uses it to buy a CBT bundle, you earn a commission — credited automatically to your wallet.' },
    { icon: '💳', title: 'Built-in Wallet', desc: 'Fund your wallet via Paystack (card, bank transfer, USSD). Your balance covers submission fees and CBT bundle purchases.' },
  ],
  institutions: [
    { icon: '🏫', title: 'Centralised Assessment Hub', desc: 'All departments, all courses, all assignments, all grades — managed from one platform. No more fragmented spreadsheets or email chains.' },
    { icon: '📋', title: 'Automated CA Computation', desc: 'CA scores are calculated from assignment and test performance automatically. Weighted scoring, late penalties, and grade adjustments all handled by the system.' },
    { icon: '🛡️', title: 'Academic Integrity at Scale', desc: 'Every submission across every course is plagiarism-checked automatically. Flagged cases are queued for lecturer review with full similarity reports.' },
    { icon: '📤', title: 'Exportable Reports', desc: 'Generate CSV and PDF reports at the course, semester, or department level. Data is always available and exportable for accreditation purposes.' },
    { icon: '👥', title: 'Multi-Role Access Control', desc: 'Students, lecturers, admins, and partners each get role-appropriate dashboards with permission-based access. No user sees what they should not see.' },
    { icon: '⚙️', title: 'Full Admin Console', desc: 'Manage all users, view financial summaries, process withdrawal requests, and adjust wallet balances from a dedicated admin panel.' },
    { icon: '🤝', title: 'Partner Revenue Program', desc: 'Institutional partners earn a commission from every assignment submission made by lecturers they referred. Passive income tracked in real time.' },
    { icon: '📊', title: 'Platform Analytics', desc: 'Track submission volumes, revenue, active users, CBT usage, and performance trends across the platform from the admin dashboard.' },
  ],
};

const CORE_FEATURES = [
  {
    icon: '🤖', color: '#7C3AED', bg: '#F5F3FF',
    title: 'AI-Assisted Grading',
    desc: 'Essays are read, understood, and scored against your rubric in seconds. A fallback AI ensures zero downtime. Lecturers always have the final say.',
    tags: ['Essay grading', 'Custom rubrics', 'Batch processing', 'Fallback AI'],
  },
  {
    icon: '🔍', color: '#DC2626', bg: '#FEF2F2',
    title: 'Plagiarism Detection',
    desc: 'Cosine similarity analysis compares every submission against every other submission in the assignment. Flagged pairs are presented to lecturers for review and decision.',
    tags: ['Auto-scan', 'Similarity score', 'Matching snippets', 'Lecturer review'],
  },
  {
    icon: '🧠', color: '#D97706', bg: '#FFFBEB',
    title: 'CBT Practice Hub',
    desc: 'Thousands of past questions for WAEC, JAMB, and GST university courses. Timed sessions, shuffled questions, instant marking, and detailed solutions.',
    tags: ['WAEC & JAMB', 'GST courses', 'Timed sessions', 'Leaderboard'],
  },
  {
    icon: '📊', color: '#2563EB', bg: '#EFF6FF',
    title: 'Tests & Quizzes',
    desc: 'Create MCQ, true/false, and essay tests. Shuffle questions, set time limits, configure pass marks, and allow multiple attempts. Students get instant results.',
    tags: ['MCQ & essays', 'Auto-grading', 'Randomisation', 'Instant results'],
  },
  {
    icon: '💳', color: '#059669', bg: '#ECFDF5',
    title: 'Wallet & Payments',
    desc: 'Integrated wallet funded via Paystack. Students pay per submission, lecturers earn per submission, partners earn per referral. All withdrawable to Nigerian banks.',
    tags: ['Paystack', 'Instant credit', 'Bank withdrawal', 'Full history'],
  },
  {
    icon: '📈', color: '#0891B2', bg: '#ECFEFF',
    title: 'Analytics & Reporting',
    desc: 'Grade distributions, performance trends, earnings breakdowns, and CBT analytics — all available in real time. Export to CSV for institutional reporting.',
    tags: ['Grade trends', 'Earnings data', 'CBT analytics', 'CSV export'],
  },
];

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('lecturers');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        .features-page * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .feat-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 28px; transition: transform 0.2s, box-shadow 0.2s; }
        .feat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(21,101,245,0.1); }
        .role-feat { display: flex; gap: 14px; align-items: flex-start; padding: 18px; background: #fff; border: 1px solid #E5E7EB; border-radius: 14px; margin-bottom: 14px; transition: box-shadow 0.2s; }
        .role-feat:hover { box-shadow: 0 4px 20px rgba(21,101,245,0.08); }
        .tab-btn { padding: 10px 20px; border-radius: 100px; font-size: 14px; font-weight: 600; border: 1.5px solid #E5E7EB; cursor: pointer; transition: all 0.2s; background: #fff; color: #6B7280; white-space: nowrap; }
        .tag-pill { display: inline-block; background: #F3F4F6; color: #374151; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 100px; margin: 3px 3px 3px 0; }
        @media (max-width: 768px) { .hero-h1 { font-size: 34px !important; } }
      `}</style>

      <div className="features-page" style={{ background: '#FAFAFA', minHeight: '100vh' }}>
        <PublicNav />

        {/* ── Hero ── */}
        <section style={{ paddingTop: 64, background: 'linear-gradient(160deg, #030D2A 0%, #071650 45%, #0A1E6E 60%, #030D2A 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '20%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 72px', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(21,101,245,0.2)', border: '1px solid rgba(21,101,245,0.4)', borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00CFFF', display: 'inline-block' }} />
              <span style={{ color: '#7EC8FF', fontSize: 13, fontWeight: 600 }}>Platform Features</span>
            </div>
            <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
              Everything built for{' '}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>Nigerian education.</span>
            </h1>
            <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.7, maxWidth: 580 }}>
              From AI grading and plagiarism detection to CBT exam practice and a fully integrated wallet — Assessify brings every assessment need under one roof.
            </p>
          </div>
        </section>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>

          {/* ── Core Features ── */}
          <section style={{ marginBottom: 96 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1565F5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Core platform</p>
              <h2 style={{ fontSize: 40, fontWeight: 800, color: '#111827', letterSpacing: -1, marginBottom: 16 }}>
                Six pillars of{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#1565F5' }}>intelligent assessment</span>
              </h2>
              <p style={{ fontSize: 17, color: '#6B7280', maxWidth: 540, margin: '0 auto' }}>
                Each module works independently and together — giving you a complete, connected assessment workflow.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {CORE_FEATURES.map((f, i) => (
                <div key={i} className="feat-card">
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: 17, marginBottom: 10 }}>{f.title}</div>
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 16 }}>{f.desc}</p>
                  <div>{f.tags.map((t) => <span key={t} className="tag-pill">{t}</span>)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── By Role ── */}
          <section style={{ marginBottom: 96 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1565F5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Role-specific</p>
              <h2 style={{ fontSize: 40, fontWeight: 800, color: '#111827', letterSpacing: -1, marginBottom: 0 }}>
                Features for{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#1565F5' }}>every user</span>
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 48, flexWrap: 'wrap' }}>
              {TABS.map((t) => (
                <button key={t.key} className="tab-btn" onClick={() => setActiveTab(t.key)}
                  style={{ background: activeTab === t.key ? '#1565F5' : '#fff', color: activeTab === t.key ? '#fff' : '#6B7280', borderColor: activeTab === t.key ? '#1565F5' : '#E5E7EB' }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {ROLE_FEATURES[activeTab].map((f, i) => (
                <div key={i} className="role-feat">
                  <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: 15, marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── How submission flow works ── */}
          <section style={{ marginBottom: 96, background: 'linear-gradient(135deg, #030D2A 0%, #071650 100%)', borderRadius: 24, padding: '56px 48px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#7EC8FF', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>End-to-end workflow</p>
                <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 0 }}>
                  From submission to grade in{' '}
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>minutes</span>
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
                {[
                  { n: '01', title: 'Student submits', desc: 'Uploads file (DOCX, PDF, image). Fee deducted from wallet.' },
                  { n: '02', title: 'Plagiarism scan', desc: 'Automatically compared against all other submissions.' },
                  { n: '03', title: 'AI reads & scores', desc: 'Essay extracted, rubric applied, score and feedback generated.' },
                  { n: '04', title: 'Lecturer reviews', desc: 'Adjusts score or feedback if needed, then publishes.' },
                  { n: '05', title: 'Student notified', desc: 'Email sent with score, feedback, and dashboard link.' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '24px 20px' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: '#1565F5', opacity: 0.4, lineHeight: 1, marginBottom: 6 }}>{s.n}</div>
                    <div style={{ width: 28, height: 3, background: '#1565F5', borderRadius: 2, marginBottom: 12 }} />
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 8 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: -1, marginBottom: 16 }}>
              Ready to see it in action?
            </h2>
            <p style={{ fontSize: 17, color: '#6B7280', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
              Create a free account and explore every feature — no credit card, no commitment.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1565F5', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                Create free account →
              </Link>
              <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1565F5', padding: '14px 28px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1.5px solid #1565F5' }}>
                View pricing
              </Link>
            </div>
          </section>

        </main>
        <FooterContent />
      </div>
    </>
  );
}