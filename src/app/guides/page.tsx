'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ArrowRight, ChevronDown, CheckCircle, AlertCircle, Brain, Zap, Users } from 'lucide-react';
import { FooterContent } from '@/components/footer/footer-content';

export default function GuidesPage() {
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);

  const guides = [
    {
      id: 1,
      title: 'Getting Started with Assessify',
      description: 'Learn the basics of setting up your first assessment and creating assignments.',
      duration: '5 min',
      category: 'Beginner',
      steps: [
        'Sign up for your Assessify account',
        'Complete your profile setup',
        'Navigate to the dashboard',
        'Create your first class or course',
        'Invite students and educators'
      ]
    },
    {
      id: 2,
      title: 'Creating and Managing Assignments',
      description: 'Step-by-step guide to creating assignments, setting up questions, and managing submissions.',
      duration: '8 min',
      category: 'Beginner',
      steps: [
        'Click "Create Assignment" button',
        'Set assignment title and description',
        'Choose assessment type (MCQ, essay, etc.)',
        'Add questions from question bank or create new',
        'Set deadline and point allocations',
        'Preview and publish assignment'
      ]
    },
    {
      id: 3,
      title: 'Using AI-Powered Grading',
      description: 'Harness the power of artificial intelligence to grade assignments automatically and consistently.',
      duration: '10 min',
      category: 'Intermediate',
      steps: [
        'Navigate to submitted assignments',
        'Select AI Grading mode',
        'Review calibration settings',
        'Configure grading rubric',
        'Monitor AI feedback accuracy',
        'Fine-tune grading parameters as needed'
      ]
    },
    {
      id: 4,
      title: 'Understanding Analytics & Reports',
      description: 'Master the analytics dashboard to gain deep insights into student performance and learning trends.',
      duration: '7 min',
      category: 'Intermediate',
      steps: [
        'Access the Analytics dashboard',
        'Explore performance metrics',
        'View class-wide statistics',
        'Generate custom reports',
        'Export data for further analysis',
        'Set up performance alerts'
      ]
    },
    {
      id: 5,
      title: 'Advanced Grading Configurations',
      description: 'Learn advanced features like weighted scoring, rubric-based grading, and custom scoring rules.',
      duration: '12 min',
      category: 'Advanced',
      steps: [
        'Create custom grading rubrics',
        'Set up weighted scoring schemes',
        'Configure partial credit rules',
        'Implement conditional grading logic',
        'Set up grade curves and scaling',
        'Create grade boundary configurations'
      ]
    },
    {
      id: 6,
      title: 'Managing Classes and Students',
      description: 'Efficiently manage your classes, students, and collaborative learning groups.',
      duration: '6 min',
      category: 'Beginner',
      steps: [
        'Create new class or course',
        'Invite students via email or code',
        'Organize students into groups',
        'Set class-specific permissions',
        'Monitor student engagement',
        'Generate class rosters'
      ]
    },
    {
      id: 7,
      title: 'Collaborating with Co-Educators',
      description: 'Work effectively with other educators on grading, assessment design, and student feedback.',
      duration: '8 min',
      category: 'Intermediate',
      steps: [
        'Add co-educators to your class',
        'Set role-based permissions',
        'Share assessment drafts',
        'Collaborate on grading',
        'Leave detailed feedback notes',
        'Track collaboration history'
      ]
    },
    {
      id: 8,
      title: 'Security and Data Protection',
      description: 'Understand how Assessify protects your data and best practices for managing sensitive information.',
      duration: '9 min',
      category: 'Advanced',
      steps: [
        'Review security features overview',
        'Understand access control levels',
        'Set up two-factor authentication',
        'Manage API keys securely',
        'Review audit logs',
        'Implement your institution\'s security policies'
      ]
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
      <section className="pt-32 pb-12 bg-gradient-to-br from-[#1F2A5A] via-[#2563EB] to-[#38D4E5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8" />
            <span className="text-lg font-semibold">Learning Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Guides & Tutorials</h1>
          <p className="text-lg md:text-xl text-gray-100 max-w-2xl">
            Everything you need to master Assessify - from beginner basics to advanced techniques.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20">
        {/* Quick Filter */}
        <div className="flex flex-wrap gap-3 mb-12">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((filter) => (
            <button
              key={filter}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                filter === 'All'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#F0F4FF] text-[#1F2A5A] hover:bg-[#E0F2FE]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Step-by-Step Guides */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-[#1F2A5A] mb-8">Comprehensive Guides</h2>
          <div className="space-y-4">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className="border border-[#E5E7EB] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <button
                  onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                  className="w-full p-6 bg-white hover:bg-[#F9FAFB] flex items-start justify-between text-left transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#1F2A5A]">{guide.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        guide.category === 'Beginner' ? 'bg-green-100 text-green-700' :
                        guide.category === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {guide.category}
                      </span>
                    </div>
                    <p className="text-[#6B7280] mb-2">{guide.description}</p>
                    <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        📖 {guide.duration}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-6 h-6 text-[#2563EB] flex-shrink-0 transition-transform ml-4 ${
                    expandedGuide === guide.id ? 'rotate-180' : ''
                  }`} />
                </button>

                {expandedGuide === guide.id && (
                  <div className="border-t border-[#E5E7EB] p-6 bg-gradient-to-r from-[#F0F4FF] to-[#F9FAFB]">
                    <h4 className="font-bold text-[#1F2A5A] mb-4">Steps:</h4>
                    <ol className="space-y-3">
                      {guide.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-[#2563EB] text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-[#6B7280] mt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-[#1F2A5A] mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page and follow the email instructions.' },
              { q: 'Can I use Assessify offline?', a: 'No, Assessify is a cloud-based application and cannot be accessed offline. You need an active internet connection to use the platform.' },
              { q: 'Is there a mobile app?', a: 'We currently offer a mobile-friendly web app optimized for tablets and smartphones. You can access Assessify on any device with a web browser.' },
              { q: 'How is my data backed up?', a: 'All data is automatically backed up daily with multiple redundancies.' },
              { q: 'Can I import questions from my system?', a: 'Yes, we support imports from common formats like Excel, CSV, and QTI.' },
              { q: 'What support is available?', a: '24/7 email, chat, and phone support for all Assessify users.' }
            ].map((faq, index) => (
              <div key={index} className="p-6 bg-[#F0F4FF] rounded-lg border border-[#E5E7EB]">
                <h4 className="font-bold text-[#1F2A5A] mb-3 flex items-start gap-2">
                  <span className="text-[#2563EB] mt-1">Q:</span>
                  {faq.q}
                </h4>
                <p className="text-[#6B7280] flex items-start gap-2">
                  <span className="text-[#2563EB] flex-shrink-0">A:</span>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#1F2A5A] to-[#2563EB] rounded-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-lg text-gray-100 mb-8">
            Contact our support team or explore our comprehensive knowledge base.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <button className="bg-white text-[#2563EB] hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors">
                Contact Support
              </button>
            </Link>
            <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-bold transition-colors">
              View Knowledge Base
            </button>
          </div>
        </section>
      </main>

      <FooterContent />
    </div>
  );
}
