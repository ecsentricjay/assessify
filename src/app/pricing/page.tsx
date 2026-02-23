'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, X, ArrowRight } from 'lucide-react';
import { FooterContent } from '@/components/footer/footer-content';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for individual educators',
      price: 'Free',
      priceSubtitle: 'Basic features',
      features: [
        { name: 'Up to 5 assessments', included: true },
        { name: 'Up to 50 students', included: true },
        { name: 'Basic grading', included: true },
        { name: 'Limited analytics', included: true },
        { name: 'Email support', included: true },
        { name: 'AI-powered grading', included: false },
        { name: 'Advanced analytics', included: false },
        { name: 'Priority support', included: false },
        { name: 'Custom workflows', included: false },
      ],
      cta: 'Get Started',
      highlight: false
    },
    {
      name: 'Professional',
      description: 'For active educators and small institutions',
      price: '$29',
      priceSubtitle: '/month',
      features: [
        { name: 'Unlimited assessments', included: true },
        { name: 'Up to 500 students', included: true },
        { name: 'AI-powered grading', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Custom grading rubrics', included: true },
        { name: 'Assessment templates', included: true },
        { name: 'Data export', included: true },
        { name: 'Custom workflows', included: false },
      ],
      cta: 'Start Free Trial',
      highlight: true
    },
    {
      name: 'Enterprise',
      description: 'For large institutions and organizations',
      price: 'Custom',
      priceSubtitle: 'Contact for pricing',
      features: [
        { name: 'Unlimited everything', included: true },
        { name: 'Unlimited students', included: true },
        { name: 'AI-powered grading', included: true },
        { name: 'Advanced analytics', included: true },
        { name: '24/7 phone & chat support', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom workflows', included: true },
        { name: 'SLA guarantee', included: true },
      ],
      cta: 'Contact Sales',
      highlight: false
    }
  ];

  const faqs = [
    {
      question: 'Can I try Assessify before purchasing?',
      answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required. You\'ll have full access to all features during the trial period.'
    },
    {
      question: 'Is there a discount for annual billing?',
      answer: 'Yes! We offer a 20% discount when you pay annually instead of monthly. Contact our sales team for more details.'
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'Your data remains yours. You can export all your assessments, grades, and analytics at any time before or after cancellation.'
    },
    {
      question: 'Do you offer discounts for educational institutions?',
      answer: 'Absolutely! We provide special pricing for schools and universities. Contact our education team to discuss volume discounts and institutional pricing.'
    },
    {
      question: 'Can I change my plan anytime?',
      answer: 'Yes, you can upgrade, downgrade, or cancel your plan anytime. Changes take effect immediately, and we\'ll prorate your billing accordingly.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept credit cards (Visa, Mastercard, American Express), bank transfers, and purchase orders for enterprise customers.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB] z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo/assessify-logo-icon.png"
                alt="Assessify Logo"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="text-lg sm:text-xl font-bold text-[#1F2A5A]">ASSESSIFY</span>
            </Link>
            <div className="flex items-center gap-4">
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#1F2A5A] via-[#2563EB] to-[#38D4E5]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-lg md:text-xl opacity-90">
            Choose the plan that fits your needs. Start free, upgrade when you\'re ready.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-16">
        {/* Pricing Tiers */}
        <section className="mb-20">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl overflow-hidden transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-[#2563EB] to-[#38D4E5] text-white shadow-2xl md:scale-105'
                    : 'bg-white border border-[#E5E7EB] hover:shadow-lg'
                }`}
              >
                <div className={`p-8 ${plan.highlight ? 'bg-black/10' : ''}`}>
                  {plan.highlight && (
                    <div className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-[#1F2A5A]'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-6 ${plan.highlight ? 'text-white/80' : 'text-[#6B7280]'}`}>
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <div className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-[#1F2A5A]'}`}>
                      {plan.price}
                    </div>
                    <p className={`text-sm ${plan.highlight ? 'text-white/80' : 'text-[#6B7280]'}`}>
                      {plan.priceSubtitle}
                    </p>
                  </div>
                  <Link href="/auth/signup">
                    <button
                      className={`w-full py-3 rounded-lg font-semibold transition-colors mb-8 ${
                        plan.highlight
                          ? 'bg-white text-[#2563EB] hover:bg-gray-100'
                          : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                </div>

                <div className={`px-8 pb-8 ${plan.highlight ? 'bg-white/5' : ''}`}>
                  <div className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-white' : 'text-[#2563EB]'}`} />
                        ) : (
                          <X className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-white/40' : 'text-[#D1D5DB]'}`} />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included
                              ? plan.highlight
                                ? 'text-white'
                                : 'text-[#1F2A5A]'
                              : plan.highlight
                                ? 'text-white/60'
                                : 'text-[#9CA3AF]'
                          }`}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What\'s Included */}
        <section className="mb-20 bg-[#F9FAFB] rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-[#1F2A5A] text-center mb-12">What\'s Included in All Plans</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Secure Cloud Storage', description: 'Enterprise-grade security for all your data' },
              { title: 'Mobile Access', description: 'Full functionality on any device' },
              { title: 'Regular Updates', description: 'Continuous improvements and new features' },
              { title: 'Data Export', description: 'Download your data anytime in standard formats' }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-[#E5E7EB]">
                <CheckCircle className="w-6 h-6 text-[#2563EB] mb-3" />
                <h3 className="font-semibold text-[#1F2A5A] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6B7280]">{item.description}</p>
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

        {/* Enterprise CTA */}
        <section className="mb-12 bg-gradient-to-r from-[#1F2A5A] to-[#2563EB] rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Need Custom Solutions?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Our Enterprise plan offers unlimited everything plus dedicated support, custom integrations, and SLA guarantees. Perfect for large institutions.
          </p>
          <Link href="/contact">
            <button className="bg-white text-[#2563EB] hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors">
              Contact Our Sales Team
            </button>
          </Link>
        </section>

        {/* CTA */}
        <section className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1F2A5A] mb-6">Ready to Get Started?</h2>
          <p className="text-[#6B7280] text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of educators using Assessify to transform their assessment process. No credit card required for the free plan.
          </p>
          <Link href="/auth/signup">
            <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Start Your Free Trial
            </button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <FooterContent />
    </div>
  );
}
