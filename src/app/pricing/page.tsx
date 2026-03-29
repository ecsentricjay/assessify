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

const FAQS = [
  { q: 'How do students pay for submissions?', a: 'Students fund their wallet via Paystack — debit cards, bank transfers, and USSD are all supported. When they submit an assignment or take a test, the fee is automatically deducted from their wallet balance.' },
  { q: 'What does the submission fee include?', a: 'Each ₦200 assignment submission includes automatic plagiarism scanning against all other submissions, AI-assisted grading with detailed feedback, and a permanent grade record in the student\'s dashboard.' },
  { q: 'Do lecturers pay to use Assessify?', a: 'No. Lecturers use Assessify for free. They earn a share of every submission fee made by their students, paid directly into their wallet.' },
  { q: 'How does the CBT bundle pricing work?', a: 'CBT practice bundles are priced by the admin and cover access to one or more courses for a fixed period (typically 90 days). Students can purchase bundles with their wallet balance or via Paystack. Promo codes can apply discounts.' },
  { q: 'Who sets the submission cost for assignments?', a: 'The default submission cost is ₦200, which is set and controlled by the platform. Lecturers do not set their own submission prices.' },
  { q: 'Can students get a refund?', a: 'Refunds are available for failed transactions or verified technical errors. Students should contact support within 48 hours with their transaction reference. Admin can manually credit wallets for approved cases.' },
  { q: 'What payment methods are supported?', a: 'Paystack processes all payments — debit cards (Visa, Mastercard, Verve), bank transfers, and USSD codes are all supported. No international cards are required.' },
  { q: 'How does the Learn & Earn referral system work?', a: 'Every user (student, lecturer, or partner) receives a unique referral code. When someone uses your code to purchase a CBT bundle, you earn a commission automatically credited to your wallet.' },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        .pricing-page * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .price-card { background: #fff; border: 1.5px solid #E5E7EB; border-radius: 20px; padding: 36px; transition: transform 0.2s, box-shadow 0.2s; }
        .price-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(21,101,245,0.1); }
        .price-card.featured { border-color: #1565F5; box-shadow: 0 0 0 4px rgba(21,101,245,0.08); }
        .faq-item { border: 1px solid #E5E7EB; border-radius: 14px; overflow: hidden; margin-bottom: 12px; }
        .faq-btn { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: #fff; border: none; cursor: pointer; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; transition: background 0.15s; }
        .faq-btn:hover { background: #F8FAFF; }
        .split-row { display: flex; justify-content: space-between; align-items: center; padding: '8px 0'; border-bottom: '1px solid #F1F5F9'; }
        @media (max-width: 768px) {
          .hero-h1 { font-size: 34px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .split-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="pricing-page" style={{ background: '#FAFAFA', minHeight: '100vh' }}>
        <PublicNav />

        {/* ── Hero ── */}
        <section style={{ paddingTop: 64, background: 'linear-gradient(160deg, #030D2A 0%, #071650 45%, #0A1E6E 60%, #030D2A 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 72px', position: 'relative', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(21,101,245,0.2)', border: '1px solid rgba(21,101,245,0.4)', borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00CFFF', display: 'inline-block' }} />
              <span style={{ color: '#7EC8FF', fontSize: 13, fontWeight: 600 }}>Transparent pricing</span>
            </div>
            <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
              Pay for what you use.{' '}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>Nothing more.</span>
            </h1>
            <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
              No subscriptions. No hidden fees. Students pay per submission, lecturers earn per submission. Everyone wins.
            </p>
          </div>
        </section>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>

          {/* ── Pricing cards ── */}
          <section style={{ marginBottom: 96 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1565F5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Pricing breakdown</p>
              <h2 style={{ fontSize: 40, fontWeight: 800, color: '#111827', letterSpacing: -1, marginBottom: 0 }}>
                Simple, usage-based{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#1565F5' }}>pricing</span>
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }} className="pricing-grid">
              {[
                {
                  icon: '📝', label: 'Assignment Submission', featured: true,
                  price: '₦200', unit: 'per submission',
                  color: '#1565F5', bg: '#EFF6FF',
                  desc: 'Paid by the student from their wallet. Covers the complete submission, grading, and feedback workflow.',
                  includes: [
                    'Full plagiarism scan against all submissions',
                    'AI-assisted grading with rubric',
                    'Detailed written feedback',
                    'Grade stored permanently on dashboard',
                    'Email notification to student when graded',
                  ],
                },
                {
                  icon: '📋', label: 'Test / Quiz Attempt', featured: false,
                  price: '₦200', unit: 'per attempt',
                  color: '#7C3AED', bg: '#F5F3FF',
                  desc: 'Fixed platform rate per test attempt. Paid by the student from their wallet.',
                  includes: [
                    'All question types supported (MCQ, T/F, essay)',
                    'Auto-grading for objective questions',
                    'Configurable time limits and attempts',
                    'Instant results and score dashboard',
                    'Full answer review if lecturer enables it',
                  ],
                },
                {
                  icon: '🧠', label: 'CBT Practice Bundle', featured: false,
                  price: 'Set by admin', unit: 'per bundle',
                  color: '#D97706', bg: '#FFFBEB',
                  desc: 'Practice bundles covering WAEC, JAMB, and GST courses. Priced and configured by the platform admin.',
                  includes: [
                    'WAEC, JAMB, and GST past questions',
                    'Unlimited practice sessions in validity period',
                    'Timed exam simulation mode',
                    'Instant marking and solutions',
                    'National leaderboard ranking',
                  ],
                },
              ].map((p, i) => (
                <div key={i} className={`price-card ${p.featured ? 'featured' : ''}`} style={{ position: 'relative' }}>
                  {p.featured && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#1565F5', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                      Most common
                    </div>
                  )}
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{p.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: p.color, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{p.label}</div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: '#111827', lineHeight: 1, marginBottom: 4 }}>{p.price}</div>
                  <div style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>{p.unit}</div>
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #F1F5F9' }}>{p.desc}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {p.includes.map((item, ii) => (
                      <li key={ii} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: p.bg, border: `2px solid ${p.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
                        </div>
                        <span style={{ fontSize: 14, color: '#374151' }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── Revenue split visual ── */}
          <section style={{ marginBottom: 96 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="split-grid">
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>How earnings work</p>
                <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: -1, lineHeight: 1.2, marginBottom: 20 }}>
                  Every submission creates{' '}
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#059669' }}>real earnings</span>
                </h2>
                <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.8, marginBottom: 24 }}>
                  Assessify operates on a shared revenue model. When a student pays the ₦200 submission fee, it is automatically split between the people who make the platform work — lecturers who create the assignments, partners who grow the network, and the platform that powers it all.
                </p>
                <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.8 }}>
                  All earnings land instantly in your wallet and can be withdrawn to any Nigerian bank account at any time, with no minimum wait period.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 20, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>₦200 submission — how it splits</div>
                {[
                  { who: 'Student pays', amount: '₦200', dir: 'debit', color: '#DC2626', bg: '#FEF2F2', icon: '👤' },
                  { who: 'Lecturer receives', amount: '+₦70', dir: 'credit', color: '#059669', bg: '#ECFDF5', icon: '👨‍🏫' },
                  { who: 'Partner receives', amount: '+₦30', dir: 'credit', color: '#7C3AED', bg: '#F5F3FF', icon: '🤝', note: 'if lecturer was referred' },
                  { who: 'Platform retains', amount: '₦100', dir: 'platform', color: '#1565F5', bg: '#EFF6FF', icon: '⚙️', note: 'operations & AI costs' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: row.bg, borderRadius: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 18 }}>{row.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{row.who}</div>
                        {row.note && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{row.note}</div>}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: row.color, fontSize: 18 }}>{row.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Wallet section ── */}
          <section style={{ background: 'linear-gradient(135deg, #030D2A 0%, #071650 100%)', borderRadius: 24, padding: '56px 48px', marginBottom: 96, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: '5%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', position: 'relative' }} className="split-grid">
              <div>
                <div style={{ display: 'inline-block', background: 'rgba(0,207,255,0.15)', border: '1px solid rgba(0,207,255,0.3)', color: '#00CFFF', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 100, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>Built-in Wallet</div>
                <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -1, lineHeight: 1.2, marginBottom: 20 }}>
                  Your money moves instantly
                </h2>
                <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.8, marginBottom: 32 }}>
                  Every user has a personal wallet. Students fund it via Paystack. Lecturers and partners earn into it automatically. Withdraw to any Nigerian bank account — no minimum hold, no waiting period.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Fund via Paystack — card, bank transfer, USSD',
                    'Earnings credited instantly after every submission',
                    'Withdraw to any Nigerian bank account',
                    'Full transaction history, always visible',
                    'Promo code discounts applied at checkout',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,207,255,0.15)', border: '1.5px solid #00CFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00CFFF' }} />
                      </div>
                      <span style={{ color: '#CBD5E1', fontSize: 14 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28 }}>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Wallet Balance</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>₦14,850.00</div>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Available to withdraw</div>
                {[
                  { desc: 'Submission earnings', time: 'Today', amt: '+₦140', color: '#10B981' },
                  { desc: 'CBT referral commission', time: 'Yesterday', amt: '+₦500', color: '#A78BFA' },
                  { desc: 'Funded via Paystack', time: 'Mar 22', amt: '+₦3,000', color: '#60A5FA' },
                  { desc: 'Withdrawal to GTBank', time: 'Mar 20', amt: '-₦2,000', color: '#F87171' },
                ].map((t, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500 }}>{t.desc}</div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{t.time}</div>
                    </div>
                    <div style={{ color: t.color, fontWeight: 700, fontSize: 14 }}>{t.amt}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section style={{ marginBottom: 96 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1565F5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Got questions?</p>
              <h2 style={{ fontSize: 40, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>
                Frequently asked{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#1565F5' }}>questions</span>
              </h2>
            </div>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {FAQS.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: 15, paddingRight: 16 }}>{faq.q}</span>
                    <span style={{ color: '#1565F5', fontSize: 20, flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s', lineHeight: 1 }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 24px 20px', background: '#F8FAFF' }}>
                      <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: -1, marginBottom: 16 }}>
              Start free, pay as you go
            </h2>
            <p style={{ fontSize: 17, color: '#6B7280', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
              No upfront cost, no subscription. Create your account today.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1565F5', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                Create free account →
              </Link>
              <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#374151', padding: '14px 28px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1.5px solid #E5E7EB' }}>
                Talk to us
              </Link>
            </div>
          </section>

        </main>
        <FooterContent />
      </div>
    </>
  );
}