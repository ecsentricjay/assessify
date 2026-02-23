'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Zap, Brain, BarChart3, Lock, Users, TrendingUp, Workflow, 
  AlertCircle, CheckCircle, Clock, BookOpen, Award, ArrowRight 
} from 'lucide-react';
import { FooterContent } from '@/components/footer/footer-content';

export default function FeaturesPage() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Grading',
      description: 'Leverage advanced machine learning algorithms to grade assignments with consistency and precision. Reduce grading time by up to 70% while improving accuracy.',
      benefits: ['Consistent evaluation', 'Reduced bias', 'Instant feedback']
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive dashboards and reports show detailed performance metrics, learning trends, and actionable insights for every student and class.',
      benefits: ['Real-time insights', 'Performance tracking', 'Learning trends']
    },
    {
      icon: Users,
      title: 'Collaborative Tools',
      description: 'Enable seamless collaboration between educators, students, and administrators with built-in communication and feedback systems.',
      benefits: ['Instant feedback', 'Two-way communication', 'Team management']
    },
    {
      icon: Lock,
      title: 'Enterprise Security',
      description: 'Bank-level security with end-to-end encryption, role-based access control, and regular security audits to protect sensitive educational data.',
      benefits: ['Data encryption', 'Access control', 'Compliance ready']
    },
    {
      icon: Workflow,
      title: 'Automated Workflows',
      description: 'Streamline assessment processes with customizable workflows, automated grading, and intelligent question banking.',
      benefits: ['Save time', 'Reduce manual work', 'Increase efficiency']
    },
    {
      icon: TrendingUp,
      title: 'Performance Insights',
      description: 'Deep-dive analytics that help identify struggling students, track progress over time, and predict future performance.',
      benefits: ['Early intervention', 'Progress tracking', 'Predictive analytics']
    }
  ];

  const detailedFeatures = [
    {
      title: 'Smart Question Bank',
      description: 'Build and manage a comprehensive question repository with intelligent categorization, difficulty levels, and auto-suggested learning materials.',
      icon: BookOpen
    },
    {
      title: 'Multi-Format Support',
      description: 'Support for multiple question types including MCQ, essays, coding challenges, and multimedia assessments.',
      icon: Workflow
    },
    {
      title: 'Real-Time Notifications',
      description: 'Instant alerts and notifications keep all stakeholders informed about submissions, grades, and important milestones.',
      icon: AlertCircle
    },
    {
      title: 'Customizable Reports',
      description: 'Generate detailed reports tailored to your needs - from individual student progress to institution-wide analytics.',
      icon: BarChart3
    },
    {
      title: 'Mobile Access',
      description: 'Access Assessify anywhere with our fully responsive mobile app. Manage assessments on the go.',
      icon: Zap
    },
    {
      title: 'API Integration',
      description: 'Integrate Assessify with your existing systems through our robust REST API and webhook support.',
      icon: Users
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
                    {feature.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-sm text-[#6B7280]">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed Features */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A5A] mb-12">Additional Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {detailedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-6 bg-[#F0F4FF] rounded-lg border border-[#E5E7EB] hover:bg-[#E0F2FE] transition-colors">
                  <Icon className="w-8 h-8 text-[#2563EB] mb-3" />
                  <h3 className="font-bold text-[#1F2A5A] mb-2">{feature.title}</h3>
                  <p className="text-[#6B7280] text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Benefits Overview */}
        <section className="mb-20 bg-gradient-to-r from-[#1F2A5A] to-[#2563EB] rounded-lg p-12 text-white">
          <h2 className="text-3xl font-bold mb-8">Why Choose Assessify?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ArrowRight className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Up to 70% Time Savings</h3>
                  <p className="text-gray-200 text-sm">Automate grading and reduce manual workload significantly</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Unbiased Grading</h3>
                  <p className="text-gray-200 text-sm">AI ensures consistent and fair evaluation for all students</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Better Insights</h3>
                  <p className="text-gray-200 text-sm">Data-driven analytics help identify learning gaps early</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ArrowRight className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Enhanced Security</h3>
                  <p className="text-gray-200 text-sm">Enterprise-grade security protects all educational data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Scalable Solution</h3>
                  <p className="text-gray-200 text-sm">Grows with your institution from classrooms to campuses</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">24/7 Support</h3>
                  <p className="text-gray-200 text-sm">Dedicated team ready to help whenever you need it</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-[#1F2A5A] mb-4">Ready to Experience These Features?</h2>
          <p className="text-[#6B7280] text-lg mb-8 max-w-2xl mx-auto">
            Start with a free account and discover how Assessify can transform your assessment process.
          </p>
          <Link href="/auth/signup">
            <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </section>
      </main>

      <FooterContent />
    </div>
  );
}
