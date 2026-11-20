'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FooterContent } from '@/components/footer/footer-content';
import { getCbtAccessMode } from '@/lib/actions/cbt-settings.actions';

// ─── Types ────────────────────────────────────────────────────────────────────
type RoleKey = 'students' | 'lecturers' | 'institutions';

interface CounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
}

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

interface Benefit {
  icon: string;
  title: string;
  desc: string;
}

interface Role {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  benefits: Benefit[];
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ end, suffix = '', prefix = '' }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = end / (1800 / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── Section fade-in ──────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssessifyLanding() {
  const [activeRole, setActiveRole] = useState<RoleKey>('students');
  // JAMB campaign copy says "Free" only while the admin switch keeps CBT practice free
  const [cbtFree, setCbtFree] = useState(true);
  // Hero carousel: 0 = main platform pitch, 1 = JAMB campaign
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setSlide((n) => (n + 1) % 2), 6500);
    return () => clearInterval(id);
  }, [paused, slide]);
  useEffect(() => {
    getCbtAccessMode().then((r) => setCbtFree(!r.subscriptionRequired)).catch(() => {});
  }, []);

  const roles: Record<RoleKey, Role> = {
    students: {
      label: 'Students',
      emoji: '🎓',
      color: '#2563EB',
      bg: '#EFF6FF',
      benefits: [
        { icon: '📝', title: 'Submit assignments anytime', desc: 'Upload your work in any format — DOCX, PDF, images — from any device, any time.' },
        { icon: '⚡', title: 'Get graded fast', desc: 'AI-assisted grading means detailed feedback arrives quickly, not weeks later.' },
        { icon: '📊', title: 'Track your CA scores', desc: 'See all your continuous assessment scores in one clear, organised dashboard.' },
        { icon: '🤖', title: 'AI Study Aid – 3 free questions', desc: 'Generate unlimited study questions from any course material using AI. 3 free attempts included.' },
        { icon: '💡', title: 'Learn smarter with AI', desc: 'AI generates personalized study questions to help you practice key concepts and prepare better.' },
        { icon: '📚', title: 'Build your study bank', desc: 'Use your AI credits to create a library of study questions across all your courses.' },
      ],
    },
    lecturers: {
      label: 'Lecturers',
      emoji: '👨‍🏫',
      color: '#7C3AED',
      bg: '#F5F3FF',
      benefits: [
        { icon: '🤖', title: 'AI-assisted grading', desc: 'Submissions are evaluated and scored intelligently with detailed, rubric-based feedback.' },
        { icon: '⏱️', title: 'Save hours every week', desc: 'Batch-grade an entire class in minutes. More time for teaching, less for paperwork.' },
        { icon: '💰', title: 'Earn from your assessments', desc: 'Get a share of every submission fee, credited directly to your wallet. Withdraw anytime.' },
        { icon: '🔍', title: 'Auto plagiarism detection', desc: 'Every submission is automatically scanned and flagged if similarity is detected.' },
        { icon: '📈', title: 'Deep class analytics', desc: 'Grade distributions, performance trends, and student progress at a glance.' },
        { icon: '🔗', title: 'Standalone assignments', desc: 'Share assignments via a unique link — no course enrollment required.' },
      ],
    },
    institutions: {
      label: 'Institutions',
      emoji: '🏛️',
      color: '#059669',
      bg: '#ECFDF5',
      benefits: [
        { icon: '🏫', title: 'Centralised assessment hub', desc: 'All departments, all courses, all grades — one unified platform.' },
        { icon: '📋', title: 'Automated CA computation', desc: 'CA scores are calculated, tracked, and reported automatically.' },
        { icon: '🛡️', title: 'Academic integrity built-in', desc: 'Plagiarism detection on every submission protects institutional standards.' },
        { icon: '📤', title: 'Exportable reports', desc: 'Generate CSV and PDF reports for any course, semester, or department.' },
        { icon: '👥', title: 'Partner revenue program', desc: 'Join as a partner institution and earn commissions from lecturer activity.' },
        { icon: '⚙️', title: 'Full admin control', desc: 'Manage users, wallets, withdrawals, and system settings from one admin panel.' },
      ],
    },
  };

  const active = roles[activeRole];

  return (
    <div style={{ overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        /* ── Scoped reset: landing sections only, never bleeds into footer ── */
        .lp-content *, .lp-content *::before, .lp-content *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif;
        }

        .nav-link { color: #6B7280; text-decoration: none; font-size: 15px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #111827; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #1565F5; color: #fff;
          padding: 14px 28px; border-radius: 12px;
          font-size: 15px; font-weight: 600;
          border: none; cursor: pointer; text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(21,101,245,0.4); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #fff;
          padding: 14px 28px; border-radius: 12px;
          font-size: 15px; font-weight: 600;
          border: 2px solid rgba(255,255,255,0.35); cursor: pointer; text-decoration: none;
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.65); }
        .role-tab {
          padding: 10px 20px; border-radius: 100px;
          font-size: 14px; font-weight: 600; border: 1.5px solid #E5E7EB;
          cursor: pointer; transition: all 0.2s; white-space: nowrap; background: #fff; color: #6B7280;
        }
        .benefit-card {
          background: #fff; border: 1px solid #E5E7EB;
          border-radius: 16px; padding: 24px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .benefit-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        .step-card {
          background: #fff; border: 1px solid #E5E7EB;
          border-radius: 20px; padding: 32px;
          position: relative; overflow: hidden;
        }
        .earn-card {
          background: linear-gradient(135deg, #030D2A 0%, #071650 50%, #0A2070 100%);
          border-radius: 24px; padding: 48px;
          color: #fff; position: relative; overflow: hidden;
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 38px !important; line-height: 1.1 !important; }
          .section-title { font-size: 30px !important; }
          .earn-card { padding: 32px 24px !important; }
          .hide-mobile { display: none !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .navbar-container { padding: 0 12px !important; height: 56px !important; }
          .navbar-logo { gap: 8px !important; }
          .navbar-logo span { font-size: 15px !important; }
          .navbar-logo img { width: 32px !important; height: 32px !important; }
          .navbar-actions { gap: 8px !important; }
          .navbar-login { font-size: 13px !important; }
          .navbar-btn { padding: 8px 14px !important; font-size: 12px !important; }
        }
        @media (max-width: 480px) {
          .navbar-container { padding: 0 8px !important; height: 52px !important; }
          .navbar-logo { gap: 6px !important; }
          .navbar-logo span { font-size: 13px !important; }
          .navbar-logo img { width: 28px !important; height: 28px !important; }
          .navbar-actions { gap: 6px !important; }
          .navbar-login { display: none !important; }
          .navbar-btn { padding: 7px 12px !important; font-size: 11px !important; }
        }
      `}</style>

      {/* All landing content lives inside .lp-content so the CSS reset is scoped here.
          FooterContent is rendered OUTSIDE this div so Tailwind classes work normally. */}
      <div className="lp-content" style={{ background: '#FAFAFA', color: '#111827' }}>

      {/* ─── NAVBAR ────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        background: 'rgba(250,250,250,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E7EB',
      }}>
        <div className="navbar-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <Image
              src="/images/logo/assessify-logo-icon.png"
              alt="Assessify Logo"
              width={36}
              height={36}
              style={{ borderRadius: 8 }}
            />
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5, color: '#111827' }}>ASSESSIFY</span>
          </Link>
          <div className="hide-mobile" style={{ display: 'flex', gap: 36 }}>
            <a href="#jamb" className="nav-link">JAMB Practice</a>
            <a href="#benefits" className="nav-link">Benefits</a>
            <a href="#how" className="nav-link">How It Works</a>
          </div>
          <div className="navbar-actions" style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
            <Link className="navbar-login" href="/auth/login" style={{ color: '#6B7280', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Log in</Link>
            <Link href="/auth/signup" className="btn-primary navbar-btn" style={{ padding: '10px 20px', fontSize: 14 }}>
              Get started free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', paddingTop: 64,
        background: 'linear-gradient(160deg, #030D2A 0%, #071650 40%, #0A1E6E 60%, #030D2A 100%)',
        display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Orbs reflecting logo blue → cyan */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '3%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '45%', right: '18%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', width: '100%' }}>
          <div
            style={{ maxWidth: 820, margin: '0 auto' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            {/* Both slides share one grid cell so the hero never changes height */}
            <div style={{ display: 'grid' }}>

              {/* Slide 1 — main platform pitch */}
              <div
                aria-hidden={slide !== 0}
                style={{ gridArea: '1 / 1', textAlign: 'center', opacity: slide === 0 ? 1 : 0, visibility: slide === 0 ? 'visible' : 'hidden', transform: slide === 0 ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity .7s ease, transform .7s ease, visibility .7s' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(21,101,245,0.2)', border: '1px solid rgba(21,101,245,0.5)', borderRadius: 100, padding: '6px 16px', marginBottom: 32 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00CFFF', display: 'inline-block' }} />
                  <span style={{ color: '#7EC8FF', fontSize: 13, fontWeight: 600 }}>Nigeria&apos;s #1 Assessment Platform</span>
                </div>

                <h1 className="hero-title" style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1.05, letterSpacing: -2, marginBottom: 24 }}>
                  Smarter assessments.{' '}
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>Better results.</span>
                  <br />Happier lecturers.
                </h1>

                <p style={{ fontSize: 20, color: '#94A3B8', lineHeight: 1.7, marginBottom: 40, fontWeight: 400 }}>
                  AI-assisted grading, plagiarism detection, AI Study Aid for smart learning,
                  and a built-in wallet system — all designed for Nigerian universities, polytechnics, and students.
                </p>

                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
                  <Link href="/auth/signup" className="btn-primary" style={{ fontSize: 16, padding: '16px 32px' }} tabIndex={slide === 0 ? 0 : -1}>
                    Start for free — no card needed →
                  </Link>
                  <Link href="/student" className="btn-outline" style={{ fontSize: 16, padding: '16px 32px' }} tabIndex={slide === 0 ? 0 : -1}>
                    Try AI Study Aid →
                  </Link>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    '✓ AI-assisted grading',
                    '✓ Instant plagiarism detection',
                    '✓ AI Study Aid with 3 free questions',
                    '✓ Withdraw earnings anytime',
                  ].map((t) => (
                    <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,207,255,0.08)', border: '1px solid rgba(0,207,255,0.2)', borderRadius: 100, padding: '7px 16px', color: '#94B8D0', fontSize: 13, fontWeight: 500 }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide 2 — JAMB campaign */}
              <div
                aria-hidden={slide !== 1}
                style={{ gridArea: '1 / 1', textAlign: 'center', opacity: slide === 1 ? 1 : 0, visibility: slide === 1 ? 'visible' : 'hidden', transform: slide === 1 ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity .7s ease, transform .7s ease, visibility .7s' }}
              >
                <Link href="/auth/signup" tabIndex={slide === 1 ? 0 : -1} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(250,204,21,0.14)', border: '1px solid rgba(250,204,21,0.55)', borderRadius: 100, padding: '7px 18px', marginBottom: 32, textDecoration: 'none' }}>
                  <span style={{ background: '#FACC15', color: '#111827', fontSize: 11, fontWeight: 800, borderRadius: 100, padding: '2px 8px', letterSpacing: 0.5 }}>{cbtFree ? 'FREE' : 'NEW'}</span>
                  <span style={{ color: '#FDE68A', fontSize: 13, fontWeight: 700 }}>JAMB CBT practice for every Nigerian student →</span>
                </Link>

                <h1 className="hero-title" style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1.05, letterSpacing: -2, marginBottom: 24 }}>
                  Improve your{' '}
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>JAMB score.</span>
                  <br />Practise like it&apos;s the real exam.
                </h1>

                <p style={{ fontSize: 20, color: '#94A3B8', lineHeight: 1.7, marginBottom: 40, fontWeight: 400 }}>
                  {cbtFree ? 'Free' : 'Timed'} JAMB CBT practice with thousands of past-style questions, worked solutions and instant scoring —
                  for English, Maths, Physics, Chemistry, Biology and more.
                </p>

                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
                  <Link href="/auth/signup" className="btn-primary" style={{ fontSize: 16, padding: '16px 32px' }} tabIndex={slide === 1 ? 0 : -1}>
                    {cbtFree ? 'Start free JAMB practice →' : 'Start JAMB practice →'}
                  </Link>
                  <Link href="#jamb" className="btn-outline" style={{ fontSize: 16, padding: '16px 32px' }} tabIndex={slide === 1 ? 0 : -1}>
                    See how it works
                  </Link>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    cbtFree ? '✓ 100% free JAMB practice' : '✓ Full JAMB practice mode',
                    '✓ Real JAMB-style timer',
                    '✓ Worked solutions & diagrams',
                    '✓ Works on any phone',
                  ].map((t) => (
                    <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,207,255,0.08)', border: '1px solid rgba(0,207,255,0.2)', borderRadius: 100, padding: '7px 16px', color: '#94B8D0', fontSize: 13, fontWeight: 500 }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Carousel dots */}
            <div role="tablist" aria-label="Hero slides" style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 40 }}>
              {['Platform overview', 'Free JAMB practice'].map((label, i) => (
                <button
                  key={label}
                  role="tab"
                  aria-selected={slide === i}
                  aria-label={label}
                  onClick={() => setSlide(i)}
                  style={{ width: slide === i ? 32 : 10, height: 10, borderRadius: 100, border: 'none', cursor: 'pointer', padding: 0, background: slide === i ? (i === 1 ? '#FACC15' : '#00CFFF') : 'rgba(255,255,255,0.3)', transition: 'all .3s ease' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF BAR ────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64, flexWrap: 'wrap' }}>
          {[
            { n: 70, suffix: '%', label: 'grading time saved' },
            { n: 30, suffix: ' sec', label: 'avg AI grading time' },
            { n: 5, suffix: ' formats', label: 'document types supported' },
            { n: 100, suffix: '%', label: 'submissions plagiarism-checked' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                <Counter end={s.n} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── JAMB CBT CAMPAIGN ───────────────────────────────────────────────── */}
      <section id="jamb" style={{ padding: '90px 24px', background: 'linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-block', background: '#FEF3C7', color: '#B45309', fontSize: 13, fontWeight: 800, padding: '4px 14px', borderRadius: 100, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
                {cbtFree ? 'Free JAMB CBT Practice' : 'JAMB CBT Practice'}
              </div>
              <h2 className="section-title" style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1.5, color: '#111827', lineHeight: 1.1, marginBottom: 16 }}>
                Score higher in JAMB —{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#2563EB' }}>one practice test at a time.</span>
              </h2>
              <p style={{ fontSize: 18, color: '#6B7280', maxWidth: 620, margin: '0 auto' }}>
                Sit the same kind of timed computer-based test you&apos;ll face on exam day, see exactly where you&apos;re losing marks, and fix it before it counts.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20, marginBottom: 40 }}>
            {[
              { icon: '⏱️', title: 'Real exam feel', desc: 'Countdown timer, question palette and auto-submit, just like JAMB CBT.' },
              { icon: '📚', title: 'Every subject', desc: 'English, Maths, Physics, Chemistry, Biology and more, by topic or full mock.' },
              { icon: '💡', title: 'Worked solutions', desc: 'Study mode shows the answer and explanation straight away, with diagrams.' },
              { icon: '📈', title: 'Track your progress', desc: 'Scores, weak topics and past attempts so you know what to revise next.' },
            ].map((f, i) => (
              <FadeIn key={f.title} delay={i * 60}>
                <div className="benefit-card">
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/auth/signup" className="btn-primary" style={{ fontSize: 17, padding: '16px 36px' }}>
              {cbtFree ? 'Create free account & start practising →' : 'Create account & start practising →'}
            </Link>
            <p style={{ marginTop: 14, fontSize: 14, color: '#6B7280' }}>
              Already registered? <Link href="/student/cbt/courses" style={{ color: '#2563EB', fontWeight: 600 }}>Go to practice tests</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ─── WHO BENEFITS ────────────────────────────────────────────────────── */}
      <section id="benefits" style={{ padding: '100px 24px', background: '#FAFAFA' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Built for everyone</p>
              <h2 className="section-title" style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1.5, color: '#111827', marginBottom: 16 }}>
                Real benefits for every stakeholder
              </h2>
              <p style={{ fontSize: 18, color: '#6B7280', maxWidth: 560, margin: '0 auto' }}>
                Whether you&apos;re submitting your first assignment or running a university department — Assessify works for you.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 48, flexWrap: 'wrap' }}>
              {(Object.entries(roles) as [RoleKey, Role][]).map(([key, r]) => (
                <button
                  key={key}
                  className="role-tab"
                  onClick={() => setActiveRole(key)}
                  style={{
                    background: activeRole === key ? active.color : '#fff',
                    color: activeRole === key ? '#fff' : '#6B7280',
                    borderColor: activeRole === key ? active.color : '#E5E7EB',
                  }}
                >
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {active.benefits.map((b, i) => (
                <div key={i} className="benefit-card">
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{b.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 6 }}>{b.title}</div>
                  <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── GRADING & INTEGRITY ─────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Grading &amp; Integrity</p>
              <h2 className="section-title" style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1.5, color: '#111827', marginBottom: 16 }}>
                Grade an entire class in{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#7C3AED' }}>minutes, not days.</span>
              </h2>
              <p style={{ fontSize: 18, color: '#6B7280', maxWidth: 580, margin: '0 auto' }}>
                Intelligent grading and plagiarism detection work together to save lecturers time
                and keep academic standards high.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: '🤖', color: '#7C3AED', bg: '#F5F3FF', title: 'AI-assisted grading', desc: 'Submissions are read, understood, and scored with detailed feedback — in seconds, not hours.' },
              { icon: '📋', color: '#2563EB', bg: '#EFF6FF', title: 'Custom rubrics', desc: 'Define exactly what gets marked and how. The grading system follows your criteria precisely.' },
              { icon: '📄', color: '#059669', bg: '#ECFDF5', title: 'Any document type', desc: 'DOCX, PDF, plain text, or images — all extracted and graded without manual conversion.' },
              { icon: '✏️', color: '#D97706', bg: '#FFFBEB', title: 'Lecturer override', desc: 'Review every suggested grade. Adjust the score or rewrite feedback at any point.' },
              { icon: '🔍', color: '#DC2626', bg: '#FEF2F2', title: 'Plagiarism detection', desc: 'Every submission is cross-checked against all others. Suspicious pairs are flagged instantly.' },
              { icon: '⚖️', color: '#0891B2', bg: '#ECFEFF', title: 'Review & decide', desc: 'Lecturers review flagged submissions and make the final call — accept or reject, with notes.' },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div className="benefit-card">
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, color: '#111827', marginBottom: 8, fontSize: 15 }}>{f.title}</div>
                  <div style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how" style={{ padding: '100px 24px', background: '#FAFAFA' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Simple process</p>
              <h2 className="section-title" style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1.5, color: '#111827' }}>
                Up and running in 4 steps
              </h2>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { n: '01', color: '#2563EB', title: 'Create your account', desc: 'Sign up in 60 seconds. Choose your role — student, lecturer, or partner. No credit card.' },
              { n: '02', color: '#7C3AED', title: 'Set up courses & assignments', desc: 'Lecturers create courses, add students, and build assignments with deadlines and rubrics.' },
              { n: '03', color: '#D97706', title: 'Students submit their work', desc: 'Students fund their wallet and submit work through a clean, simple interface.' },
              { n: '04', color: '#059669', title: 'Grades delivered fast', desc: 'AI-assisted grading returns results quickly. Lecturers review, adjust, and publish.' },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="step-card">
                  <div style={{ fontSize: 48, fontWeight: 800, color: s.color, opacity: 0.15, lineHeight: 1, marginBottom: 8 }}>{s.n}</div>
                  <div style={{ width: 36, height: 4, background: s.color, borderRadius: 2, marginBottom: 16 }} />
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: 17, marginBottom: 10 }}>{s.title}</div>
                  <div style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WALLET ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="grid-2">

            <FadeIn>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32 }}>
                <div style={{ background: 'linear-gradient(135deg, #1E293B, #334155)', borderRadius: 16, padding: 24, marginBottom: 24, color: '#fff' }}>
                  <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Wallet Balance</div>
                  <div style={{ fontSize: 40, fontWeight: 800 }}>₦14,850.00</div>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>Available to withdraw</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Total Earned', val: '₦21,000', color: '#059669' },
                    { label: 'Total Withdrawn', val: '₦6,150', color: '#2563EB' },
                  ].map((s) => (
                    <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 }}>
                      <div style={{ color: s.color, fontWeight: 800, fontSize: 18 }}>{s.val}</div>
                      <div style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 12 }}>Recent Activity</div>
                {[
                  { desc: 'Assignment submission earnings', amt: '+₦140', time: 'Today', color: '#059669' },
                  { desc: 'AI Study Aid credits purchased', amt: '+₦500', time: 'Yesterday', color: '#7C3AED' },
                  { desc: 'Wallet funded via Paystack', amt: '+₦3,000', time: 'Mar 22', color: '#2563EB' },
                  { desc: 'Withdrawal to Zenith Bank', amt: '-₦2,000', time: 'Mar 20', color: '#DC2626' },
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{t.desc}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{t.time}</div>
                    </div>
                    <div style={{ color: t.color, fontWeight: 700, fontSize: 14 }}>{t.amt}</div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={150}>
              <div>
                <div style={{ display: 'inline-block', background: '#DCFCE7', color: '#15803D', fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 100, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>
                  Built-in Wallet
                </div>
                <h2 className="section-title" style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1.5, color: '#111827', lineHeight: 1.1, marginBottom: 20 }}>
                  Your earnings, in your wallet —{' '}
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#059669' }}>always accessible.</span>
                </h2>
                <p style={{ fontSize: 17, color: '#6B7280', lineHeight: 1.7, marginBottom: 32 }}>
                  Fund your wallet via Paystack. Earnings are credited after every
                  submission and referral. Withdraw to any Nigerian bank account — simple, fast, no hoops.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    'Fund with Paystack — cards, bank transfers, USSD',
                    'Earnings credited after every submission',
                    'Withdraw to any Nigerian bank account',
                    'Full transaction history, always transparent',
                    'Admin support for any wallet disputes',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#DCFCE7', border: '2px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                      </div>
                      <span style={{ color: '#374151', fontSize: 15 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', background: 'linear-gradient(160deg, #030D2A 0%, #071650 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <FadeIn>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <h2 style={{ fontSize: 56, fontWeight: 800, color: '#fff', letterSpacing: -2, lineHeight: 1.1, marginBottom: 20 }}>
              Ready to{' '}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>transform</span>
              {' '}how assessments work?
            </h2>
            <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.7, marginBottom: 48 }}>
              Join students, lecturers, and institutions already using Assessify.
              Start free — no credit card, no commitment.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
              <Link href="/auth/signup" className="btn-primary" style={{ background: '#2563EB', fontSize: 17, padding: '18px 36px' }}>
                {cbtFree ? 'Start free JAMB practice →' : 'Create account →'}
              </Link>
              <Link href="/auth/login" className="btn-outline" style={{ fontSize: 17, padding: '18px 36px' }}>
                Log in
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['No credit card required', 'Free to get started', '24/7 Nigerian support'].map((t) => (
                <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#64748B', fontSize: 14 }}>
                  <span style={{ color: '#10B981' }}>✓</span> {t}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      </div>{/* end .lp-content */}

      {/* Footer lives outside .lp-content so the CSS reset never touches it */}
      <FooterContent />

    </div>
  );
}