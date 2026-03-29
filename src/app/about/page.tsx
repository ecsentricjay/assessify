'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FooterContent } from '@/components/footer/footer-content';

// ── Shared nav (same pattern as landing page) ─────────────────────────────────
function PublicNav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, width: '100%', zIndex: 100,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #E5E7EB',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="/images/logo/assessify-logo-icon.png" alt="Assessify" width={34} height={34} style={{ borderRadius: 8 }} />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5, color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ASSESSIFY</span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/auth/login" style={{ color: '#6B7280', textDecoration: 'none', fontWeight: 600, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Log in</Link>
          <Link href="/auth/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#1565F5', color: '#fff', padding: '9px 20px',
            borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>Get started free →</Link>
        </div>
      </div>
    </nav>
  );
}

export default function AboutPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        .about-page * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .value-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 28px; transition: transform 0.2s, box-shadow 0.2s; }
        .value-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(21,101,245,0.1); }
        .why-item { display: flex; gap: 14px; align-items: flex-start; padding: 18px 20px; background: #F8FAFF; border: 1px solid #E8EEFF; border-radius: 12px; margin-bottom: 12px; }
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; }
          .hero-h1 { font-size: 36px !important; }
        }
      `}</style>

      <div className="about-page" style={{ background: '#FAFAFA', minHeight: '100vh' }}>
        <PublicNav />

        {/* ── Hero ── */}
        <section style={{
          paddingTop: 64, background: 'linear-gradient(160deg, #030D2A 0%, #071650 45%, #0A1E6E 60%, #030D2A 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '20%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, right: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 72px', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(21,101,245,0.2)', border: '1px solid rgba(21,101,245,0.4)', borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00CFFF', display: 'inline-block' }} />
              <span style={{ color: '#7EC8FF', fontSize: 13, fontWeight: 600 }}>Our Story</span>
            </div>
            <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
              About{' '}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>Assessify</span>
            </h1>
            <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.7, maxWidth: 600, marginBottom: 0 }}>
              We are transforming how Nigerian institutions assess, grade, and understand student learning — with intelligence, fairness, and speed at the core of everything we do.
            </p>
          </div>
        </section>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>

          {/* ── Our Story ── */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', marginBottom: 96 }} className="about-grid">
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1565F5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>How we started</p>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: -1, lineHeight: 1.2, marginBottom: 20 }}>
                Built from a real problem in Nigerian education
              </h2>
              <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.8, marginBottom: 16 }}>
                Assessify was founded by <strong style={{ color: '#111827' }}>Mr. Justice Ugochukwu Nwaogu</strong> under <strong style={{ color: '#111827' }}>Jugo Tech Solutions</strong>, after observing firsthand how manual grading, paper-based submissions, and fragmented CA systems were holding back both lecturers and students across Nigerian polytechnics and universities.
              </p>
              <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.8, marginBottom: 16 }}>
                What started as a grading tool has grown into a full-stack assessment ecosystem — handling assignments, CBT tests, AI grading, plagiarism detection, and an integrated wallet system — all designed specifically for the Nigerian educational context.
              </p>
              <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.8 }}>
                Today, Assessify serves students, lecturers, and institutional partners, combining cutting-edge AI with a deep understanding of how Nigerian education actually works.
              </p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #030D2A 0%, #071650 100%)', borderRadius: 24, padding: 40, color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.15) 0%, transparent 70%)' }} />
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 13, color: '#7EC8FF', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Founded by</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Mr. Justice Ugochukwu Nwaogu</div>
                <div style={{ fontSize: 14, color: '#00CFFF', marginTop: 4 }}>Founder & CEO, Jugo Tech Solutions</div>
              </div>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7, marginBottom: 28 }}>
                An education and technology professional with a vision to bridge the gap between traditional assessment methods and the demands of modern Nigerian education.
              </p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>Company</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Jugo Tech Solutions</div>
              </div>
            </div>
          </section>

          {/* ── Mission, Vision, Values ── */}
          <section style={{ marginBottom: 96 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1565F5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>What drives us</p>
              <h2 style={{ fontSize: 40, fontWeight: 800, color: '#111827', letterSpacing: -1, marginBottom: 0 }}>
                Mission, Vision &{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#1565F5' }}>Values</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                {
                  icon: '🎯', label: 'Our Mission', color: '#1565F5', bg: '#EFF6FF',
                  text: 'To revolutionize educational assessment in Africa by providing intelligent, fair, and transparent tools that empower educators, reduce grading burden, and inspire students to reach their full potential.',
                },
                {
                  icon: '🔭', label: 'Our Vision', color: '#7C3AED', bg: '#F5F3FF',
                  text: 'To become the most trusted assessment platform across African educational institutions — driving meaningful improvements in learning outcomes for every student, in every department, at every level.',
                },
                {
                  icon: '⚖️', label: 'Our Values', color: '#059669', bg: '#ECFDF5',
                  values: ['Fairness & Academic Integrity', 'Transparency in Grading', 'Innovation without Complexity', 'Support for Nigerian Education', 'Reliability & Trust'],
                },
              ].map((item, i) => (
                <div key={i} className="value-card">
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, color: item.color, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{item.label}</div>
                  {item.text && <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7 }}>{item.text}</p>}
                  {item.values && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {item.values.map((v, vi) => (
                        <li key={vi} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 15, color: '#6B7280' }}>{v}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Why Assessify ── */}
          <section style={{ marginBottom: 96 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }} className="about-grid">
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1565F5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>The difference</p>
                <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: -1, lineHeight: 1.2, marginBottom: 20 }}>
                  Why lecturers and students choose Assessify
                </h2>
                <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.8 }}>
                  Other platforms are built for Western curricula and large enterprise budgets. Assessify is built specifically for the realities of Nigerian higher education — unstable internet, Naira-denominated payments, WAEC and JAMB exam preparation, and the CA-heavy grading systems used across Nigerian institutions.
                </p>
              </div>
              <div>
                {[
                  { icon: '🇳🇬', text: 'Designed for Nigerian grading standards, CA systems, and institutional structures' },
                  { icon: '💳', text: 'Naira-denominated with Paystack — cards, bank transfers, USSD all supported' },
                  { icon: '🤖', text: 'AI-assisted grading that reads rubrics and gives detailed essay feedback' },
                  { icon: '🔍', text: 'Plagiarism detection built-in on every single submission, automatically' },
                  { icon: '📱', text: 'Mobile-first design for students who primarily use smartphones' },
                  { icon: '💰', text: 'Lecturers earn from every submission — real income from teaching' },
                  { icon: '📚', text: 'CBT practice for WAEC, JAMB, and GST courses built right in' },
                  { icon: '🤝', text: 'Partner program lets institutions and individuals earn from referrals' },
                ].map((item, i) => (
                  <div key={i} className="why-item">
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 15, color: '#374151', lineHeight: 1.6 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{
            background: 'linear-gradient(135deg, #030D2A 0%, #071650 100%)',
            borderRadius: 24, padding: '60px 48px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 16 }}>
                Ready to experience{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>Assessify</span>?
              </h2>
              <p style={{ fontSize: 17, color: '#94A3B8', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
                Join students, lecturers, and institutions already transforming their assessment experience.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1565F5', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                  Create free account →
                </Link>
                <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)' }}>
                  Contact us
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