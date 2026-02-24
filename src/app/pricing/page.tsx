'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, X, ArrowRight } from 'lucide-react';
import { FooterContent } from '@/components/footer/footer-content';

export default function PricingPage() {
  const { TrendingUp } = require('lucide-react');
  const pricingModel = [
    {
      title: 'Assignment Submission',
      description: 'Students pay per submission',
      fee: '₦200',
      unit: 'per 1-1000 words',
      details: [
        'Deducted from student wallet',
        'Full plagiarism scanning included',
        'AI or lecturer grading',
        'Instant feedback provided'
      ]
    },
    {
      title: 'Test Attempt',
      description: 'Fixed platform rate per attempt',
      fee: '₦200',
      unit: 'per attempt',
      details: [
        'Platform-set pricing',
        'All question types supported',
        'Auto-grading enabled',
        'Instant results to students'
      ]
    },
    {
      title: 'AI Assignment Writer',
      description: 'Draft assistance premium feature',
      fee: '₦100',
      unit: 'per 1-1000 words',
      details: [
        'AI-powered draft generation',
        'Plagiarism verification included',
        'Promotes academic integrity',
        'Optional learning tool'
      ]
    }
  ];

  const faqs = [
    {
      question: 'How do students pay for submissions?',
      answer: 'Students top up their wallet via Paystack using debit cards or bank transfers. When they submit an assignment or take a test, the fee is automatically deducted from their wallet balance.'
    },
    {
      question: 'What is included with assignment submission?',
      answer: 'Assignment submission includes plagiarism scanning, AI or lecturer grading, and detailed feedback. All features are included in the ₦200 fee per submission.'
    },
    {
      question: 'What is the AI Assignment Writer?',
      answer: 'The AI Assignment Writer is an optional premium feature (₦100 per 1-1000 words) that helps students brainstorm and draft assignments. It promotes ethical academic practices with originality verification.'
    },
    {
      question: 'Are test attempt costs set by lecturers?',
      answer: 'No, test attempt costs are fixed by the platform at ₦200 per attempt. This ensures consistent pricing across all institutions.'
    },
    {
      question: 'Can I get a refund?',
      answer: 'Refunds are available for failed transactions or technical issues. Contact our support team within 48 hours of the transaction for assistance.'
    },
    {
      question: 'What payment methods do you support?',
      answer: 'We support Paystack for wallet top-ups (debit cards, bank transfers) and direct bank transfers for bulk institutional accounts.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB] z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/images/logo/assessify-logo-icon.png"
                alt="Assessify Logo"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="text-lg sm:text-xl font-bold text-[#1F2A5A]">ASSESSIFY</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/login">
                <button className="text-[#1F2A5A] hover:text-[#2563EB] font-medium transition-colors">
                  Login
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
            <div className="flex md:hidden items-center gap-2">
              <Link href="/auth/login">
                <button className="text-[#1F2A5A] hover:text-[#2563EB] font-medium transition-colors text-sm px-3 py-1.5">
                  Login
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-sm whitespace-nowrap">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#1F2A5A] via-[#2563EB] to-[#38D4E5]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-lg md:text-xl opacity-90">
            Only pay for what you use. No subscriptions, no hidden fees.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-16">
        {/* Pricing Model */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-[#1F2A5A] text-center mb-12">Our Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pricingModel.map((plan, index) => (
              <div key={index} className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold text-[#1F2A5A] mb-2">{plan.title}</h3>
                <p className="text-sm text-[#6B7280] mb-3">{plan.description}</p>
                <div className="bg-gradient-to-br from-[#2563EB]/10 to-[#38D4E5]/10 rounded-lg p-4 mb-4">
                  <p className="text-3xl font-bold text-[#2563EB]">{plan.fee}</p>
                  <p className="text-xs text-[#6B7280] mt-1">{plan.unit}</p>
                </div>
                <ul className="space-y-2">
                  {plan.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#6B7280]">
                      <CheckCircle className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-[#1F2A5A] text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="bg-white border border-[#E5E7EB] rounded-lg p-6 hover:shadow-md transition-shadow">
                <summary className="font-semibold text-[#1F2A5A] cursor-pointer flex items-center justify-between">
                  {faq.question}
                  <ArrowRight className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                </summary>
                <p className="text-[#6B7280] mt-4 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-[#1F2A5A] mb-6">Ready to Transform Your Assessment Process?</h2>
          <p className="text-[#6B7280] text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of educators and institutions using Assessify. Only pay for what you use—no hidden fees, no subscriptions.
          </p>
          <Link href="/auth/signup">
            <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Get Started Now
            </button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <FooterContent />
    </div>
  );
}
