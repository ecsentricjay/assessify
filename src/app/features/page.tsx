'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Brain, FileText, Lock, Users, Zap, BarChart3, 
  AlertCircle, CheckCircle, Workflow, TrendingUp
} from 'lucide-react';
import { FooterContent } from '@/components/footer/footer-content';

export default function FeaturesPage() {
  const features = [
    {
      icon: FileText,
      title: 'Assignment Submission System',
      description: 'Students submit assignments with customizable rubrics, multiple file format support, and instant feedback from AI or lecturers.',
      highlights: ['Multiple file formats', 'Custom rubrics', 'Instant feedback', 'Resubmission tracking']
    },
    {
      icon: Brain,
      title: 'AI-Powered Grading',
      description: 'Automatic grading using Claude AI and Gemini with detailed feedback, confidence scoring, and option for manual override.',
      highlights: ['Auto-essay grading', 'Confidence scoring', 'Detailed feedback', 'Manual review option']
    },
    {
      icon: AlertCircle,
      title: 'Plagiarism Detection',
      description: 'Real-time plagiarism scanning against web sources, institutional database, and student\'s own past work.',
      highlights: ['Real-time scanning', 'Source identification', 'Similarity reports', 'Highlighted matches']
    },
    {
      icon: Zap,
      title: 'Test & Quiz System',
      description: 'Support for 9+ question types including MCQ, essays, true/false, matching, fill-in-the-blank, short answer, ordering, and more.',
      highlights: ['9+ question types', 'Auto-grading', 'Randomized questions', 'Question banking']
    },
    {
      icon: Lock,
      title: 'Wallet & Payment System',
      description: 'Integrated wallet for students to fund submissions, lecturers to earn commissions, and partners to track earnings. Paystack integration included.',
      highlights: ['Student top-ups', 'Lecturer earnings', 'Partner commissions (15%)', 'Paystack integration']
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Comprehensive dashboards for students, lecturers, and admins showing performance trends, engagement, earnings, and institutional metrics.',
      highlights: ['Performance trends', 'Earnings tracking', 'Student insights', 'Institutional reports']
    },
    {
      icon: Users,
      title: 'Multi-User Roles',
      description: 'Support for students, lecturers, admins, and partner institutions with role-based access control and customized dashboards.',
      highlights: ['Role-based access', 'Custom dashboards', 'Permission control', 'Audit logs']
    },
    {
      icon: Workflow,
      title: 'AI Assignment Writer',
      description: 'Students can use AI to help draft assignments. Lecturers can monitor AI-assisted work and verify authenticity.',
      highlights: ['Draft assistance', 'AI transparency', 'Originality checking', 'Learning enhancement']
    }
  ];

  const detailedFeatures = [
    {
      title: 'What You Can Do',
      description: '',
      icon: null
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
                  Get Started Free
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-[#1F2A5A] via-[#2563EB] to-[#38D4E5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Powerful Features Built for You</h1>
          <p className="text-lg md:text-xl text-gray-100 max-w-2xl">
            Everything you need to revolutionize your assessment process with cutting-edge technology and intuitive design.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20">
        {/* Core Features Grid */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A5A] mb-12">Core Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group p-8 bg-gradient-to-br from-white to-[#F9FAFB] border border-[#E5E7EB] rounded-lg hover:shadow-lg hover:border-[#2563EB] transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2563EB] to-[#38D4E5] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1F2A5A] mb-3">{feature.title}</h3>
                  <p className="text-[#6B7280] mb-4 leading-relaxed">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.highlights.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-sm text-[#6B7280]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed Features */}
        <section className="mb-20 bg-gradient-to-r from-[#1F2A5A] to-[#2563EB] rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-8">What You Can Do</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Automated Grading</h3>
                  <p className="text-gray-200 text-sm">AI grades essays against your rubric in seconds with detailed feedback</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Plagiarism Checking</h3>
                  <p className="text-gray-200 text-sm">Automatic plagiarism detection on every submission with detailed reports</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Multiple Question Types</h3>
                  <p className="text-gray-200 text-sm">Support for 9+ question types from essays to MCQ to matching questions</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Payment Processing</h3>
                  <p className="text-gray-200 text-sm">Integrated wallets and Paystack for handling submission fees</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Performance Analytics</h3>
                  <p className="text-gray-200 text-sm">Real-time dashboards for students, lecturers, and administrators</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Partner Commissions</h3>
                  <p className="text-gray-200 text-sm">Earn 15% commission on every submission from lecturers you refer</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-[#1F2A5A] mb-4">Ready to Get Started?</h2>
          <p className="text-[#6B7280] text-lg mb-8 max-w-2xl mx-auto">
            Create an account and start using Assessify\'s powerful features today.
          </p>
          <Link href="/auth/signup">
            <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3 rounded-lg font-bold transition-colors">
              Get Started Now
            </button>
          </Link>
        </section>
      </main>

      <FooterContent />
    </div>
  );
}
