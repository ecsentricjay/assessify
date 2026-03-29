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

type CategoryKey = 'general' | 'students' | 'lecturers' | 'cbt' | 'wallet' | 'partners';

interface FAQ { q: string; a: string; }

const FAQ_DATA: Record<CategoryKey, FAQ[]> = {
  general: [
    { q: 'What is Assessify?', a: 'Assessify is a Smart Continuous Assessment Management Platform built specifically for Nigerian universities, polytechnics, and teaching centres. It combines AI-assisted essay grading, plagiarism detection, CBT exam practice, a built-in wallet system, and a partner referral program — all in one platform.' },
    { q: 'Who is Assessify built for?', a: 'Assessify serves four main user types: students (who submit work and practice CBT), lecturers (who create assignments, grade, and earn), institutional partners (who earn referral commissions), and admins (who manage the platform). Each role gets a tailored dashboard.' },
    { q: 'Is Assessify free to use?', a: 'Registering is free for all users. Lecturers and partners pay nothing — they earn from the platform. Students pay a small fee per assignment submission and per CBT bundle. There are no subscriptions or hidden charges.' },
    { q: 'Can I use Assessify on my phone?', a: 'Yes. Assessify is mobile-first and fully optimised for smartphones and tablets. You can submit assignments, take tests, practice CBT, and manage your wallet entirely from a mobile browser — no app download needed.' },
    { q: 'Is my data secure?', a: 'Yes. Assessify uses bank-level TLS/SSL encryption for all data in transit, Supabase PostgreSQL with Row-Level Security policies that enforce database-level access control, and Bcrypt password hashing via Supabase Auth. No user can access another user\'s data.' },
    { q: 'How do I contact support?', a: 'You can reach the support team at contact@assessify.ng or call +234 912 956 2739. The support team is based in Nigeria and understands the Nigerian educational context.' },
  ],
  students: [
    { q: 'How do I submit an assignment?', a: 'Navigate to the Assignments section of your dashboard, open the relevant assignment, upload your file (DOCX, PDF, TXT, or image), and click Submit. The fee is deducted from your wallet automatically. You\'ll receive an email confirmation.' },
    { q: 'What file formats can I submit?', a: 'Assessify accepts Word documents (.docx), PDFs, plain text files (.txt), and images (JPG, PNG). You can also type directly into the submission text box. Multiple files can be combined in a single submission.' },
    { q: 'What happens after I submit?', a: 'Your submission is immediately plagiarism-checked against all other submissions for that assignment. The AI then reads your work and produces a suggested grade and detailed feedback. Your lecturer reviews this and publishes the final grade. You receive an email notification when grading is complete.' },
    { q: 'Why was my submission rejected?', a: 'Submissions can be rejected if plagiarism is detected above the threshold set by your lecturer, or if there is a technical issue with the file. Your lecturer will notify you with an explanation and you may be given the opportunity to resubmit.' },
    { q: 'How do I fund my wallet?', a: 'Go to your Wallet section and click "Add Funds". Enter the amount and you will be redirected to Paystack where you can pay using a debit card, bank transfer, or USSD. Your wallet is credited instantly on successful payment.' },
    { q: 'What is CBT practice and how do I access it?', a: 'CBT (Computer-Based Test) practice lets you answer WAEC, JAMB, and GST university past questions under timed exam conditions. Purchase a bundle from the CBT section using your wallet or Paystack. Access is valid for the bundle\'s duration (typically 90 days).' },
  ],
  lecturers: [
    { q: 'How do I create an assignment?', a: 'From your Lecturer Dashboard, click "Create Assignment". Fill in the title, description, deadline, and any attached documents. Enable AI grading and/or plagiarism detection as needed. For standalone assignments (no course), a unique access code and shareable link will be generated automatically.' },
    { q: 'How does AI grading work?', a: 'When you trigger AI grading for a submission or batch, the system extracts the full text from the submitted files, applies your rubric (if provided), and sends it to an AI model which returns a score and detailed feedback. You review the suggestion and can adjust before publishing.' },
    { q: 'Can I grade manually instead of using AI?', a: 'Yes. You can ignore AI suggestions entirely and enter your own score and feedback. You can also use AI as a starting point and edit the score or feedback before saving. The final decision is always yours.' },
    { q: 'How and when do I get paid?', a: 'A share of every ₦200 submission fee is credited to your Assessify wallet automatically when a student submits. The credit appears instantly. You can request a withdrawal to your Nigerian bank account from the Withdrawals section at any time.' },
    { q: 'What is a standalone assignment?', a: 'A standalone assignment is not tied to any specific course. It has a unique access code and a shareable link. Anyone with the link or code can submit — useful for external assessments, workshops, or students not enrolled in your course.' },
    { q: 'How does plagiarism detection work?', a: 'When plagiarism detection is enabled for an assignment, every submission is automatically compared against all other submissions using cosine similarity analysis. Pairs with similarity above the threshold are flagged for your review. You can then approve or reject the flagged submission with notes.' },
  ],
  cbt: [
    { q: 'What subjects are available for CBT practice?', a: 'Assessify offers past questions for WAEC and JAMB subjects including Mathematics, English Language, Biology, Chemistry, Physics, Economics, Government, Literature, and more. GST university courses such as Use of English, Philosophy, and Government are also included.' },
    { q: 'How long does a CBT bundle last?', a: 'Bundle validity periods are set by the platform admin. Most bundles are valid for 90 days from the date of purchase. Subscriptions can be extended if needed.' },
    { q: 'How many questions are in a practice session?', a: 'You can configure the number of questions per session before starting. Questions are randomly selected from the course bank and shuffled each session so you always get a fresh set.' },
    { q: 'Can I review my answers after a session?', a: 'Yes. After completing a session, you can review every question you answered, see the correct answer, and read the solution explanation. Your session history is also saved so you can track improvement over time.' },
    { q: 'How does the leaderboard work?', a: 'The CBT leaderboard ranks students by their performance score, which is calculated from session accuracy, speed, and consistency. Rankings are visible to all users and updated after each completed session.' },
    { q: 'Can I earn by sharing CBT bundle referrals?', a: 'Yes. Every user gets a unique referral code. When someone uses your code to purchase a CBT bundle, you earn a commission automatically credited to your wallet. There is no limit to how many people you can refer.' },
  ],
  wallet: [
    { q: 'How do I add money to my wallet?', a: 'Go to Wallet → Add Funds, enter an amount, and complete payment via Paystack. Supported payment methods include debit cards (Visa, Mastercard, Verve), bank transfers, and USSD codes. Your wallet is credited immediately on successful payment.' },
    { q: 'How do I withdraw my earnings?', a: 'Go to Wallet → Withdrawals → Request Withdrawal. Enter the amount and your bank account details (bank name, account number, account name). Your request is reviewed by admin and the transfer is processed to your account.' },
    { q: 'Is there a minimum withdrawal amount?', a: 'Yes, minimum withdrawal amounts apply. Check the Withdrawals page in your dashboard for the current minimum for your user type. The amounts differ slightly between students, lecturers, and partners.' },
    { q: 'How long does a withdrawal take?', a: 'Withdrawal requests are reviewed by admin and processed typically within 1–3 business days. You receive a notification when your withdrawal is approved and when the payment is sent.' },
    { q: 'What if a payment fails but I was charged?', a: 'If you were charged but your wallet was not credited, contact support immediately at contact@assessify.ng with your transaction reference. Admin can verify with Paystack and manually credit your wallet if the charge was successful on their end.' },
    { q: 'Can I use promo codes?', a: 'Yes. Promo codes can be applied to CBT bundle purchases. Enter the code at checkout to receive the discount. Each code is unique to the user who generated it, and codes can be deactivated by their owner or by admin.' },
  ],
  partners: [
    { q: 'What is the Partner Program?', a: 'The Assessify Partner Program allows institutions, freelancers, and individuals to earn commissions by referring lecturers to the platform. Once a referred lecturer\'s students start submitting assignments, the partner earns a commission on every submission — automatically and indefinitely.' },
    { q: 'How do I become a partner?', a: 'Partner accounts are created by Assessify admin. Contact the team at contact@assessify.ng or via the contact page to express interest. You will receive login credentials and your unique partner referral code once your account is set up.' },
    { q: 'How much do I earn as a partner?', a: 'Partners earn a commission (a percentage of the submission fee) on every assignment submission made by lecturers they referred. The commission is calculated automatically and credited to your wallet instantly on each submission.' },
    { q: 'How do I refer a lecturer?', a: 'Share your unique partner referral code or link with lecturers. When a lecturer signs up using your code and their students start making submissions, you begin earning. Your dashboard shows all referred lecturers, their submission counts, and your earnings from each.' },
    { q: 'Does my commission stop if a lecturer becomes inactive?', a: 'Commissions are only paid on active submissions. If a referred lecturer stops creating assignments or their students stop submitting, no commission is earned during that period. If they become active again, commissions resume automatically.' },
    { q: 'Can I see which lecturers I have referred?', a: 'Yes. Your Partner Dashboard shows a full list of referred lecturers with their department, join date, total submissions, revenue generated, and your commission from each. You can track performance in real time.' },
  ],
};

const CATEGORIES: { key: CategoryKey; label: string; emoji: string; count: number }[] = [
  { key: 'general', label: 'General', emoji: '💡', count: FAQ_DATA.general.length },
  { key: 'students', label: 'Students', emoji: '🎓', count: FAQ_DATA.students.length },
  { key: 'lecturers', label: 'Lecturers', emoji: '👨‍🏫', count: FAQ_DATA.lecturers.length },
  { key: 'cbt', label: 'CBT Practice', emoji: '🧠', count: FAQ_DATA.cbt.length },
  { key: 'wallet', label: 'Wallet & Payments', emoji: '💳', count: FAQ_DATA.wallet.length },
  { key: 'partners', label: 'Partners', emoji: '🤝', count: FAQ_DATA.partners.length },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('general');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = FAQ_DATA[activeCategory];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        .faq-page * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .cat-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #E5E7EB; background: #fff; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 600; color: #6B7280; transition: all 0.2s; text-align: left; }
        .cat-btn:hover { border-color: #1565F5; color: #1565F5; background: #F0F6FF; }
        .cat-btn.active { background: #1565F5; color: #fff; border-color: #1565F5; }
        .faq-item { border: 1px solid #E5E7EB; border-radius: 14px; overflow: hidden; margin-bottom: 12px; background: #fff; }
        .faq-btn { width: 100%; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 20px 24px; background: #fff; border: none; cursor: pointer; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; transition: background 0.15s; }
        .faq-btn:hover { background: #F8FAFF; }
        @media (max-width: 768px) {
          .hero-h1 { font-size: 34px !important; }
          .faq-layout { grid-template-columns: 1fr !important; }
          .cat-sidebar { display: flex; flex-wrap: wrap; gap: 8px; }
          .cat-btn { width: auto !important; padding: 8px 14px !important; font-size: 13px !important; }
        }
      `}</style>

      <div className="faq-page" style={{ background: '#FAFAFA', minHeight: '100vh' }}>
        <PublicNav />

        {/* ── Hero ── */}
        <section style={{ paddingTop: 64, background: 'linear-gradient(160deg, #030D2A 0%, #071650 45%, #0A1E6E 60%, #030D2A 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10%', right: '8%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 72px', position: 'relative', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(21,101,245,0.2)', border: '1px solid rgba(21,101,245,0.4)', borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00CFFF', display: 'inline-block' }} />
              <span style={{ color: '#7EC8FF', fontSize: 13, fontWeight: 600 }}>Help Centre</span>
            </div>
            <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
              Frequently asked{' '}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#00CFFF' }}>questions</span>
            </h1>
            <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
              Find clear answers to common questions about Assessify. Browse by category or search for what you need.
            </p>
          </div>
        </section>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48 }} className="faq-layout">

            {/* ── Category sidebar ── */}
            <div className="cat-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, padding: '0 4px' }}>Browse by topic</div>
              {CATEGORIES.map((cat) => (
                <button key={cat.key} className={`cat-btn ${activeCategory === cat.key ? 'active' : ''}`} onClick={() => { setActiveCategory(cat.key); setOpenIndex(null); }}>
                  <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                  <span style={{ flex: 1 }}>{cat.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, background: activeCategory === cat.key ? 'rgba(255,255,255,0.2)' : '#F3F4F6', padding: '2px 8px', borderRadius: 100 }}>{cat.count}</span>
                </button>
              ))}

              {/* Contact card */}
              <div style={{ background: 'linear-gradient(135deg, #030D2A, #071650)', borderRadius: 16, padding: 20, marginTop: 16, color: '#fff' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Still need help?</div>
                <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, marginBottom: 16 }}>Our support team is based in Nigeria and ready to help.</p>
                <a href="mailto:contact@assessify.ng" style={{ display: 'block', background: '#1565F5', color: '#fff', padding: '10px 16px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>
                  Email support →
                </a>
                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#475569' }}>+234 912 956 2739</div>
              </div>
            </div>

            {/* ── FAQ list ── */}
            <div>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1565F5', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                  {CATEGORIES.find(c => c.key === activeCategory)?.emoji} {CATEGORIES.find(c => c.key === activeCategory)?.label}
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: -0.5, marginBottom: 0 }}>
                  {faqs.length} questions answered
                </h2>
              </div>

              {faqs.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button className="faq-btn" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: 15, lineHeight: 1.5 }}>{faq.q}</span>
                    <span style={{
                      color: openIndex === i ? '#fff' : '#1565F5',
                      background: openIndex === i ? '#1565F5' : '#EFF6FF',
                      width: 28, height: 28, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0, lineHeight: 1,
                      transition: 'all 0.2s',
                    }}>
                      {openIndex === i ? '−' : '+'}
                    </span>
                  </button>
                  {openIndex === i && (
                    <div style={{ padding: '4px 24px 20px', background: '#F8FAFF', borderTop: '1px solid #E8EEFF' }}>
                      <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom CTA ── */}
          <section style={{ marginTop: 96, background: 'linear-gradient(135deg, #030D2A 0%, #071650 100%)', borderRadius: 24, padding: '56px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, left: '20%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,245,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, right: '15%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 16 }}>
                Didn&apos;t find what you were looking for?
              </h2>
              <p style={{ fontSize: 17, color: '#94A3B8', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
                Reach out to our Nigeria-based support team and we will get back to you promptly.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1565F5', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                  Contact support →
                </Link>
                <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)' }}>
                  Create free account
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