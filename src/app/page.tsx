import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, BarChart3, Users, Zap, ArrowRight, Star, Shield, Clock, BookOpen, GraduationCap, TrendingUp, Award } from 'lucide-react';
import { FooterContent } from '@/components/footer/footer-content';

export default function AssessifyLanding() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB] z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo/assessify-logo-icon.png"
                alt="Assessify Logo"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="text-xl font-bold text-[#1F2A5A]">ASSESSIFY</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#6B7280] hover:text-[#1F2A5A] transition-colors">Features</a>
              <a href="#how-it-works" className="text-[#6B7280] hover:text-[#1F2A5A] transition-colors">How It Works</a>
              <a href="#contact" className="text-[#6B7280] hover:text-[#1F2A5A] transition-colors">Contact</a>
            </div>
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
      <section className="relative min-h-screen pt-16 flex items-center overflow-hidden bg-gradient-to-br from-[#1F2A5A] via-[#2563EB] to-[#38D4E5]">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Star className="w-4 h-4 text-[#38D4E5]" />
                <span className="text-sm font-medium">🇳🇬 Built for Nigerian Universities</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Revolutionize Academic Assessment in Nigeria
              </h1>

              <p className="text-xl text-gray-100 leading-relaxed max-w-xl">
                The first AI-powered continuous assessment platform built specifically for Nigerian universities and polytechnics. Automate grading, track performance, and elevate educational outcomes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup">
                  <button className="group bg-white text-[#1F2A5A] hover:bg-gray-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-xl">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all backdrop-blur-sm">
                  Watch Demo Video
                </button>
              </div>

              {/* Key Benefits */}
              <div className="flex flex-wrap gap-4 pt-8 border-t border-white/20">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <Shield className="w-5 h-5 text-[#38D4E5]" />
                  <span className="text-sm">Bank-Level Security</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <Zap className="w-5 h-5 text-[#38D4E5]" />
                  <span className="text-sm">Lightning Fast</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <Clock className="w-5 h-5 text-[#38D4E5]" />
                  <span className="text-sm">Save 80% Grading Time</span>
                </div>
              </div>
            </div>

            {/* Right Image - Hero Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#38D4E5]/30 to-[#2563EB]/30 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 space-y-6">
                {/* Mock Dashboard */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2563EB] to-[#38D4E5]"></div>
                    <div>
                      <div className="font-semibold text-[#1F2A5A]">Dr. Adeyemi Okoye</div>
                      <div className="text-sm text-[#6B7280]">Computer Science Dept.</div>
                    </div>
                  </div>
                  <div className="bg-[#16A34A] text-white text-xs px-3 py-1 rounded-full">Active</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F5F7FA] p-4 rounded-xl">
                    <div className="text-2xl font-bold text-[#1F2A5A] mb-1">247</div>
                    <div className="text-sm text-[#6B7280]">Assignments Graded</div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-[#16A34A]">
                      <TrendingUp className="w-3 h-3" />
                      <span>+23% this week</span>
                    </div>
                  </div>
                  <div className="bg-[#F5F7FA] p-4 rounded-xl">
                    <div className="text-2xl font-bold text-[#1F2A5A] mb-1">8.5h</div>
                    <div className="text-sm text-[#6B7280]">Time Saved</div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-[#16A34A]">
                      <Clock className="w-3 h-3" />
                      <span>Per week</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#EFF6FF] rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-[#2563EB]" />
                      <div>
                        <div className="text-sm font-medium text-[#1F2A5A]">CSC 302 Assignment</div>
                        <div className="text-xs text-[#6B7280]">45 submissions pending</div>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-[#16A34A]" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-5 h-5 text-[#6B7280]" />
                      <div>
                        <div className="text-sm font-medium text-[#1F2A5A]">Data Structures Test</div>
                        <div className="text-xs text-[#6B7280]">120 students enrolled</div>
                      </div>
                    </div>
                    <Award className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1F2A5A] mb-4">
              Why Nigerian Educators Choose Assessify
            </h2>
            <p className="text-xl text-[#6B7280] max-w-3xl mx-auto">
              We understand the unique challenges facing Nigerian tertiary institutions
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Problems */}
            <div className="space-y-6">
              <div className="inline-block bg-[#FEE2E2] text-[#DC2626] px-4 py-2 rounded-lg font-semibold mb-4">
                Traditional Challenges
              </div>
              <div className="space-y-4">
                {[
                  { icon: "⏰", text: "Hours spent manually grading hundreds of scripts" },
                  { icon: "📄", text: "Plagiarism goes undetected without proper tools" },
                  { icon: "📊", text: "Complex CA calculations prone to human error" },
                  { icon: "🔍", text: "Limited visibility into student performance trends" },
                  { icon: "💸", text: "Expensive commercial solutions not built for Nigeria" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-[#FEE2E2]/30 rounded-lg">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-[#1F2A5A] text-lg pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div className="space-y-6">
              <div className="inline-block bg-[#DCFCE7] text-[#16A34A] px-4 py-2 rounded-lg font-semibold mb-4">
                The Assessify Solution
              </div>
              <div className="space-y-4">
                {[
                  { icon: "🤖", text: "AI-powered grading cuts workload by 80%" },
                  { icon: "🛡️", text: "Advanced plagiarism detection with detailed reports" },
                  { icon: "⚡", text: "Automated CA computation with zero errors" },
                  { icon: "📈", text: "Real-time analytics and performance dashboards" },
                  { icon: "🇳🇬", text: "Affordable pricing designed for Nigerian institutions" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-[#DCFCE7]/50 rounded-lg border-l-4 border-[#16A34A]">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-[#1F2A5A] text-lg font-medium pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1F2A5A] mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-[#6B7280] max-w-3xl mx-auto">
              Comprehensive tools designed for the Nigerian educational ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "AI-Powered Grading",
                description: "Intelligent grading engine that understands context and provides detailed feedback in seconds",
                benefits: ["Natural language processing", "Customizable rubrics", "Bulk grading support"]
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Plagiarism Detection",
                description: "Industry-leading technology that scans millions of sources to ensure academic integrity",
                benefits: ["Deep web scanning", "Similarity reports", "Citation analysis"]
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "CA Management",
                description: "Automated continuous assessment tracking with real-time updates and historical data",
                benefits: ["Automatic computation", "Weighted scoring", "Performance tracking"]
              },
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "Assignment Builder",
                description: "Create and distribute assignments with file uploads, deadlines, and auto-notifications",
                benefits: ["Multiple file formats", "Deadline management", "Auto-reminders"]
              },
              {
                icon: <GraduationCap className="w-8 h-8" />,
                title: "Online Testing",
                description: "Secure online test platform with multiple question types and anti-cheating measures",
                benefits: ["MCQ, Essay, Short answer", "Timed assessments", "Randomization"]
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Analytics Dashboard",
                description: "Comprehensive insights into class performance, trends, and learning outcomes",
                benefits: ["Real-time metrics", "Export reports", "Predictive analytics"]
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#38D4E5] rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#1F2A5A] mb-3">{feature.title}</h3>
                <p className="text-[#6B7280] mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, bidx) => (
                    <li key={bidx} className="flex items-center gap-2 text-sm text-[#6B7280]">
                      <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1F2A5A] mb-4">
              Simple. Intuitive. Powerful.
            </h2>
            <p className="text-xl text-[#6B7280] max-w-3xl mx-auto">
              Get started in minutes, not weeks
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2563EB] via-[#38D4E5] to-[#2563EB] opacity-20"></div>

            {[
              { step: "01", title: "Create Account", desc: "Sign up in 60 seconds. No credit card required for trial." },
              { step: "02", title: "Build Assessments", desc: "Use our intuitive builder to create assignments and tests" },
              { step: "03", title: "Students Submit", desc: "Students access and submit work through their dashboard" },
              { step: "04", title: "Auto-Grade & Analyze", desc: "AI grades submissions and generates insights instantly" }
            ].map((item, idx) => (
              <div key={idx} className="text-center relative">
                <div className="w-24 h-24 bg-gradient-to-br from-[#2563EB] to-[#38D4E5] text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg relative z-10">
                  {item.step}
                </div>
                <h3 className="font-bold text-[#1F2A5A] text-lg mb-2">{item.title}</h3>
                <p className="text-[#6B7280] text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/auth/signup">
              <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all inline-flex items-center gap-2">
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#2563EB] to-[#38D4E5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Assessment Process?
          </h2>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
            Experience the future of academic assessment. Start using Assessify today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <button className="bg-white text-[#2563EB] hover:bg-gray-50 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-xl inline-flex items-center justify-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-bold text-lg transition-all backdrop-blur-sm">
              Schedule a Demo
            </button>
          </div>
          <p className="text-gray-100 mt-6">✓ No credit card required  ✓ Quick setup  ✓ 24/7 support</p>
        </div>
      </section>

      {/* Footer */}
      <FooterContent />
    </div>
  );
}