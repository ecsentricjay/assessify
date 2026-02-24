'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Users, Target, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { FooterContent } from '@/components/footer/footer-content';

export default function AboutPage() {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Assessify</h1>
          <p className="text-lg md:text-xl text-gray-100">
            Transforming education through intelligent, equitable assessment technology
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Company Overview */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1F2A5A] mb-6">Our Story</h2>
              <p className="text-[#6B7280] text-lg leading-relaxed mb-4">
                Assessify was founded on a simple belief: education assessment should be fair, transparent, and empowering. In a world where traditional assessment methods often fail to capture true student potential, we saw an opportunity to revolutionize how institutions evaluate learning outcomes.
              </p>
              <p className="text-[#6B7280] text-lg leading-relaxed">
                Built by professionals passionate about education and technology, Assessify combines cutting-edge AI capabilities with educational best practices to create a platform that truly serves both educators and students.
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#2563EB] to-[#38D4E5] rounded-lg p-8 text-white flex flex-col items-center justify-center min-h-[300px]">
              <Heart className="w-16 h-16 mb-4" />
              <p className="text-center text-lg font-semibold">
                Dedicated to transforming education
              </p>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="mb-20 bg-gradient-to-r from-[#F0F4FF] to-[#E0F2FE] rounded-lg p-12">
          <h2 className="text-3xl font-bold text-[#1F2A5A] mb-8">Our Leadership</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="w-32 h-32 bg-gradient-to-br from-[#2563EB] to-[#38D4E5] rounded-lg flex items-center justify-center text-white">
                <Award className="w-16 h-16" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#1F2A5A] mb-2">Mr. Justice Ugochukwu Nwaogu</h3>
              <p className="text-[#2563EB] font-semibold mb-4">Founder & CEO</p>
              <p className="text-[#6B7280] text-lg leading-relaxed mb-4">
                An education and technology enthusiast with a vision to bridge the gap between traditional assessment methods and modern educational needs. With deep expertise in both sectors, Mr. Nwaogu leads Assessify with a commitment to democratizing fair and intelligent assessment.
              </p>
              <p className="text-[#6B7280] text-lg leading-relaxed">
                His mission is to empower educators with tools that reduce bias, increase transparency, and ultimately create better learning outcomes for every student.
              </p>
            </div>
          </div>
        </section>

        {/* Company Info */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#F9FAFB] p-8 rounded-lg border border-[#E5E7EB]">
              <h3 className="text-xl font-bold text-[#1F2A5A] mb-4 flex items-center gap-2">
                <span className="text-[#2563EB]">●</span> Company Name
              </h3>
              <p className="text-[#6B7280] text-lg">Jugo Tech Solutions</p>
            </div>
            <div className="bg-[#F9FAFB] p-8 rounded-lg border border-[#E5E7EB]">
              <h3 className="text-xl font-bold text-[#1F2A5A] mb-4 flex items-center gap-2">
                <span className="text-[#2563EB]">●</span> Founder
              </h3>
              <p className="text-[#6B7280] text-lg">Mr. Justice Ugochukwu Nwaogu</p>
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-[#1F2A5A] mb-12">Our Mission & Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-b from-[#EFF6FF] to-white rounded-lg border border-[#E5E7EB]">
              <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1F2A5A] mb-3">Our Mission</h3>
              <p className="text-[#6B7280] leading-relaxed">
                To revolutionize educational assessment by providing intelligent, fair, and transparent tools that empower educators and inspire students to reach their full potential.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-b from-[#EFF6FF] to-white rounded-lg border border-[#E5E7EB]">
              <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1F2A5A] mb-3">Our Values</h3>
              <ul className="text-[#6B7280] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  <span>Fairness & Equity</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  <span>Transparency</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  <span>Innovation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  <span>Excellence</span>
                </li>
              </ul>
            </div>

            <div className="p-8 bg-gradient-to-b from-[#EFF6FF] to-white rounded-lg border border-[#E5E7EB]">
              <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1F2A5A] mb-3">Our Vision</h3>
              <p className="text-[#6B7280] leading-relaxed">
                To become the leading assessment platform trusted by educational institutions across Africa and beyond, driving meaningful improvements in learning outcomes.
              </p>
            </div>
          </div>
        </section>

        {/* Why Assessify */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-[#1F2A5A] mb-8">Why Assessify?</h2>
          <div className="space-y-4">
            {[
              'Built by education experts and tech innovators',
              'Powered by cutting-edge AI and machine learning',
              'Designed with transparency and fairness at its core',
              'Trusted by educators to improve learning outcomes',
              'Committed to supporting educational excellence in Africa'
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#F0F4FF] to-white rounded-lg">
                <CheckCircle className="w-6 h-6 text-[#2563EB] flex-shrink-0 mt-0.5" />
                <p className="text-[#6B7280] text-lg">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#1F2A5A] to-[#2563EB] rounded-lg p-12 text-white mb-20">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Assessment?</h2>
          <p className="text-lg text-gray-100 mb-8">
            Join educators and institutions already using Assessify to revolutionize their assessment practices.
          </p>
          <Link href="/auth/signup">
            <button className="bg-white text-[#2563EB] hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors">
              Get Started Free
            </button>
          </Link>
        </section>
      </main>

      <FooterContent />
    </div>
  );
}
