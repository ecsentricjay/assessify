'use client';

import React from 'react';
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

const HELP_CATEGORIES = [
  {
    icon: '🚀', color: '#1565F5', bg: '#EFF6FF',
    title: 'Getting Started',
    desc: 'New to Assessify? Start here. Create your account, set up your profile, and understand how the platform works in under 10 minutes.',
    links: [
      { label: 'How to create an account', href: '/guides#1' },
      { label: 'Choosing the right role (student vs lecturer)', href: '/guides' },
      { label: 'Navigating your dashboard', href: '/guides' },
      { label: 'Setting up your profile', href: '/guides#1' },
    ],
  },
  {
    icon: '📝', color: '#059669', bg: '#ECFDF5',
    title: 'Student Help',
    desc: 'Everything students need — from submitting assignments and taking tests to funding wallets and practising for exams.',
    links: [
      { label: 'How to submit an assignment', href: '/guides#2' },
      { label: 'How to fund your wallet', href: '/guides#7' },
      { label: 'Accessing CBT practice sessions', href: '/guides#5' },
      { label: 'Using your referral code to earn', href: '/guides#8' },
    ],
  },
  {
    icon: '👨‍🏫', color: '#7C3AED', bg: '#F5F3FF',
    title: 'Lecturer Help',
    desc: 'Create assignments, grade with AI, detect plagiarism, run tests, track student performance, and manage your earnings.',
    links: [
      { label: 'Creating and publishing an assignment', href: '/guides#3' },
      { label: 'Grading with AI assistance', href: '/guides#4' },
      { label: 'Creating CBT tests for students', href: '/guides#6' },
      { label: 'Withdrawing your earnings', href: '/guides#7' },
    ],
  },
  {
    icon: '🧠', color: '#D97706', bg: '#FFFBEB',
    title: 'CBT Practice',
    desc: 'WAEC, JAMB, and GST past questions in a real exam environment. Tips on buying bundles, starting sessions, and tracking progress.',
    links: [
      { label: 'How CBT practice works', href: '/guides#5' },
      { label: 'Buying a bundle with a promo code', href: '/guides#5' },
      { label: 'Understanding your CBT scores', href: '/guides#9' },
      { label: 'CBT leaderboard explained', href: '/faq#cbt' },
    ],
  },
  {
    icon: '💳', color: '#0891B2', bg: '#ECFEFF',
    title: 'Wallet & Payments',
    desc: 'Funding via Paystack, earning from submissions and referrals, withdrawing to your Nigerian bank account, and understanding transactions.',
    links: [
      { label: 'How to add funds via Paystack', href: '/guides#7' },
      { label: 'How earnings are credited', href: '/pricing' },
      { label: 'Requesting a withdrawal', href: '/guides#7' },
      { label: 'Wallet & payment FAQs', href: '/faq' },
    ],
  },
  {
    icon: '🤝', color: '#DC2626', bg: '#FEF2F2',
    title: 'Partners',
    desc: 'Partner account setup, referral tracking, commission calculations, and how to make the most of the partner programme.',
    links: [
      { label: 'How the partner programme works', href: '/faq' },
      { label: 'Tracking referred lecturers', href: '/faq' },
      { label: 'Understanding partner commissions', href: '/pricing' },
      { label: 'Becoming a partner', href: '/contact' },
    ],
  },
];

const CONTACT_CHANNELS = [
  {
    icon: '✉️', label: 'Email Support',
    value: 'contact@assessify.ng',
    desc: 'Best for detailed questions. We aim to reply within 24 hours.',
    href: 'mailto:contact@assessify.ng',
    cta: 'Send an email',
  },
  {
    icon: '📞', label: 'Phone Support',
    value: '+234 912 956 2739',
    desc: 'For urgent issues. Available during Nigerian business hours.',
    href: 'tel:+2349129562739',
    cta: 'Call us',
  },
  {
    icon: '💬', label: 'WhatsApp',
    value: '+234 912 956 2739',
    desc: 'Quick questions and follow-ups. Usually fastest response.',
    href: 'https://wa.me/2349129562739',
    cta: 'Message on WhatsApp',
  },
];

const COMMON_ISSUES = [
  { q: 'I submitted an assignment but my wallet was not deducted — is it saved?', href: '/faq' },
  { q: 'My Paystack payment went through but my wallet balance did not update', href: '/faq' },
  { q: 'I cannot find my assignment on the student dashboard', href: '/guides' },
  { q: 'The AI grade seems wrong — how do I ask the lecturer to review it?', href: '/faq' },
  { q: 'My CBT bundle expired before I finished using it', href: '/contact' },
  { q: 'I referred someone but did not receive my commission', href: '/faq' },
  { q: 'My withdrawal was approved but the money has not arrived', href: '/contact' },
  { q: 'I forgot my password and cannot log in', href: '/auth/reset-password' },
];

export default function HelpPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        .help-page * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .help-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 18px; padding: 28px; transition: transform 0.2s, box-shadow 0.2s; }
        .help-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(21,101,245,0.08); }
        .help-link { display: flex; align-items: center; gap: 8px; color: #374151; text-decoration: none; font-size: 14px; font-weight: 500; padding: 7px 0; border-bottom: 1px solid #F1F5F9; transition: color 0.15s; }
        .help-link:hover { color: #1565F5; }
        .help-link:last-child { border-bottom: none; }
        .contact-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 28px; display: flex; flex-direction: column; gap: 12px; transition: box-shadow 0.2s; }
        .contact-card:hover { box-shadow: 0 6px 20px rgba(21,101,245,0.08); }
        .issue-link { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; text-decoration: none; color: #374151; font-size: 14px; font-weight: 500; line-height: 1.5; transition: all 0.15s; }
        .issue-link:hover { background: #F0F6FF; border-color: #1565F5; color: #1565F5; }
        @media (max-width: 768px) {
          .hero-h1 { font-size: 34px !important; }
          .help-grid { grid-template-columns: 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="help-page" style={{ background: '#FAFAFA', minHeight: '100vh' }}>
        <PublicNav />

        {/* ── Hero ── */}
        <section style={{ paddingTop: 64, background: 'linear-gradient(160deg, #030D2A 0%, #071650 45%, #0A1E6E 60%, #030D2A 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10%', right: '6%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '8%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 72px', position: 'relative', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(21,101,245,0.2)', border: '1px solid rgba(21,101,245,0.4)', borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ fontSize: 14 }}>🛟</span>
              <span style={{ color: '#7EC8FF', fontSize: 13, fontWeight: 600 }}>Help Centre</span>
            </div>
            <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
              How can we{' '}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>help you?</span>
            </h1>
            <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 40px' }}>
              Find guides, troubleshooting tips, and direct contact options — all organised by what you are trying to do.
            </p>
            {/* Quick nav */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Student guides', href: '#students' },
                { label: 'Lecturer guides', href: '#lecturers' },
                { label: 'Wallet help', href: '#wallet' },
                { label: 'Contact us', href: '#contact' },
              ].map((l) => (
                <a key={l.label} href={l.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '7px 16px', color: '#CBD5E1', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s' }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 80px' }}>

          {/* ── Help categories ── */}
          <section style={{ marginBottom: 96 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1565F5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Browse by topic</p>
              <h2 style={{ fontSize: 38, fontWeight: 800, color: '#111827', letterSpacing: -1, marginBottom: 0 }}>
                What do you need{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#1565F5' }}>help with?</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }} className="help-grid">
              {HELP_CATEGORIES.map((cat, i) => (
                <div key={i} className="help-card">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{cat.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827', fontSize: 16, marginBottom: 4 }}>{cat.title}</div>
                      <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{cat.desc}</div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                    {cat.links.map((l, li) => (
                      <Link key={li} href={l.href} className="help-link">
                        <span style={{ color: cat.color, fontSize: 14, lineHeight: 1 }}>→</span>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Common issues ── */}
          <section style={{ marginBottom: 96 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Troubleshooting</p>
              <h2 style={{ fontSize: 38, fontWeight: 800, color: '#111827', letterSpacing: -1, marginBottom: 16 }}>
                Common{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#DC2626' }}>issues</span>
              </h2>
              <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 480, margin: '0 auto' }}>
                Click any issue below to find the answer or get in touch with support.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {COMMON_ISSUES.map((issue, i) => (
                <Link key={i} href={issue.href} className="issue-link">
                  <span style={{ color: '#DC2626', fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚡</span>
                  {issue.q}
                </Link>
              ))}
            </div>
          </section>

          {/* ── Contact channels ── */}
          <section id="contact" style={{ marginBottom: 80 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Get in touch</p>
              <h2 style={{ fontSize: 38, fontWeight: 800, color: '#111827', letterSpacing: -1, marginBottom: 16 }}>
                Talk to our{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#059669' }}>Nigeria-based team</span>
              </h2>
              <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 480, margin: '0 auto' }}>
                Our support team understands Nigerian education. We speak your language — literally and figuratively.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }} className="contact-grid">
              {CONTACT_CHANNELS.map((ch, i) => (
                <div key={i} className="contact-card">
                  <div style={{ fontSize: 28 }}>{ch.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: 15, marginBottom: 2 }}>{ch.label}</div>
                    <div style={{ fontWeight: 600, color: '#1565F5', fontSize: 14, marginBottom: 6 }}>{ch.value}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{ch.desc}</div>
                  </div>
                  <a href={ch.href} target={ch.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#1565F5', padding: '10px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none', marginTop: 4, transition: 'background 0.2s' }}>
                    {ch.cta} →
                  </a>
                </div>
              ))}
            </div>

            {/* Address */}
            <div style={{ marginTop: 24, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>📍</div>
              <div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: 15, marginBottom: 4 }}>Physical Address</div>
                <div style={{ fontSize: 14, color: '#6B7280' }}>Old Shopping Complex, IAUE, Rumuolumeni, Obio/Akpor, Rivers State, Nigeria</div>
              </div>
            </div>
          </section>

          {/* ── Resource links ── */}
          <section style={{ background: 'linear-gradient(135deg, #030D2A 0%, #071650 100%)', borderRadius: 24, padding: '56px 48px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', position: 'relative' }} className="help-grid">
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, lineHeight: 1.2, marginBottom: 16 }}>
                  More resources to{' '}
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>explore</span>
                </h2>
                <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.7 }}>
                  Detailed step-by-step guides, a comprehensive FAQ, pricing breakdown, and the full platform feature list — all designed to help you get the most out of Assessify.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Step-by-step guides', desc: 'Detailed walkthroughs for every task', href: '/guides', icon: '📖' },
                  { label: 'FAQ', desc: '36 questions across 6 categories', href: '/faq', icon: '💡' },
                  { label: 'Platform features', desc: 'Everything Assessify can do', href: '/features', icon: '⚡' },
                  { label: 'Pricing breakdown', desc: 'What you pay and what you earn', href: '/pricing', icon: '💳' },
                ].map((r, i) => (
                  <Link key={i} href={r.href} style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 18px', textDecoration: 'none', transition: 'background 0.2s' }}>
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{r.label}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{r.desc}</div>
                    </div>
                    <span style={{ color: '#1565F5', fontSize: 16 }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

        </main>
        <FooterContent />
      </div>
    </>
  );
}