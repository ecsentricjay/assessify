'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FooterLink {
  label: string
  href: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

interface FooterContentProps {
  userType?: 'student' | 'lecturer' | 'admin' | 'partner' | null
  className?: string
}

const COMPANY_INFO = {
  name: 'ASSESSIFY',
  tagline: 'Smart Continuous Assessment Management Platform',
  email: 'contact@assessify.ng',
  phone: '+234 912 956 2739',
  address: 'Old Shopping Complex, IAUE, Rumuolumeni, Obio/Akpor, Rivers State',
  year: new Date().getFullYear(),
}

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    icon: Facebook,
    href: 'https://facebook.com/assessify',
    color: 'hover:text-[#1877F2]',
  },
  {
    name: 'Instagram',
    icon: Instagram,
    href: 'https://instagram.com/assessify',
    color: 'hover:text-[#E4405F]',
  },
  {
    name: 'X (Twitter)',
    icon: () => (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    href: 'https://x.com/assessify',
    color: 'hover:text-white',
  },
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    href: 'https://wa.me/2349129562739',
    color: 'hover:text-[#25D366]',
  },
]

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Privacy Policy', href: '/legal/privacy' },
  { label: 'Terms of Service', href: '/legal/terms' },
  { label: 'Cookie Policy', href: '/legal/cookies' },
]

// Student Footer Links
const STUDENT_FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'My Academics',
    links: [
      { label: 'Dashboard', href: '/student/dashboard' },
      { label: 'Assignments', href: '/student/assignments' },
      { label: 'Tests', href: '/student/tests' },
      { label: 'Scores', href: '/student/scores' },
      { label: 'Courses', href: '/student/courses' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Help Center', href: '/help' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
]

// Lecturer Footer Links
const LECTURER_FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Teaching Tools',
    links: [
      { label: 'Dashboard', href: '/lecturer/dashboard' },
      { label: 'Courses', href: '/lecturer/courses' },
      { label: 'Assignments', href: '/lecturer/assignments' },
      { label: 'Tests', href: '/lecturer/tests' },
      { label: 'Grading', href: '/lecturer/grading' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Help Center', href: '/help' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
]

// Admin Footer Links
const ADMIN_FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Management',
    links: [
      { label: 'Dashboard', href: '/admin' },
      { label: 'Users', href: '/admin/users' },
      { label: 'Content', href: '/admin/content' },
      { label: 'Finances', href: '/admin/finances' },
      { label: 'Partners', href: '/admin/partners' },
    ],
  },
  {
    title: 'Reports',
    links: [
      { label: 'Analytics', href: '/admin/reports' },
      { label: 'System Settings', href: '/admin/settings' },
    ],
  },
]

// Partner Footer Links
const PARTNER_FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Partner Hub',
    links: [
      { label: 'Dashboard', href: '/partner' },
      { label: 'Referrals', href: '/partner/referrals' },
      { label: 'Earnings', href: '/partner/earnings' },
      { label: 'Withdrawals', href: '/partner/withdrawals' },
      { label: 'Profile', href: '/partner/profile' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Help Center', href: '/help' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
]

function getFooterSections(userType?: string | null): FooterSection[] {
  switch (userType) {
    case 'student':
      return STUDENT_FOOTER_SECTIONS
    case 'lecturer':
      return LECTURER_FOOTER_SECTIONS
    case 'admin':
      return ADMIN_FOOTER_SECTIONS
    case 'partner':
      return PARTNER_FOOTER_SECTIONS
    default:
      // Default footer for logged out users
      return [
        {
          title: 'Platform',
          links: [
            { label: 'About', href: '/about' },
            { label: 'Features', href: '/features' },
            { label: 'Pricing', href: '/pricing' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'Blog', href: '/blog' },
            { label: 'Guides', href: '/guides' },
            { label: 'Contact', href: '/contact' },
          ],
        },
      ]
  }
}

export function FooterContent({ userType, className }: FooterContentProps) {
  const footerSections = getFooterSections(userType)

  return (
    <footer className={cn('bg-white border-t border-[#E5E7EB]', className)}>
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-12">
          {/* Brand Section - Larger on desktop */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <Image
                src="/images/logo/assessify-logo-icon.png"
                alt="ASSESSIFY Logo"
                width={48}
                height={48}
                className="rounded-lg group-hover:scale-105 transition-transform"
              />
              <div>
                <h3 className="text-2xl font-bold text-[#1F2A5A]">{COMPANY_INFO.name}</h3>
                <p className="text-sm text-[#2563EB]">{COMPANY_INFO.tagline}</p>
              </div>
            </Link>
            
            <p className="text-[#6B7280] mb-8 leading-relaxed max-w-sm">
              Transforming education through intelligent continuous assessment management. 
              Built for Nigerian institutions, powered by cutting-edge AI.
            </p>
            
            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[#1F2A5A] uppercase tracking-wider">Connect With Us</h4>
              <div className="flex gap-4">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'w-10 h-10 rounded-lg bg-[#F5F7FA] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] transition-all hover:bg-white hover:border-[#2563EB] hover:scale-110',
                        social.color
                      )}
                      aria-label={social.name}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer Sections */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {footerSections.map((section, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-[#1F2A5A] mb-4 text-sm uppercase tracking-wider">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[#6B7280] hover:text-[#2563EB] transition-colors text-sm flex items-center gap-2 group"
                      >
                        <span className="w-0 group-hover:w-2 h-0.5 bg-[#2563EB] transition-all duration-200"></span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="lg:col-span-3">
            <h4 className="font-semibold text-[#1F2A5A] mb-4 text-sm uppercase tracking-wider">
              Get In Touch
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0 group-hover:bg-[#DBEAFE] transition-colors">
                  <Mail className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Email</p>
                  <a
                    href={`mailto:${COMPANY_INFO.email}`}
                    className="text-sm text-[#1F2A5A] hover:text-[#2563EB] transition-colors break-all"
                  >
                    {COMPANY_INFO.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0 group-hover:bg-[#DBEAFE] transition-colors">
                  <Phone className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Phone</p>
                  <a
                    href={`tel:${COMPANY_INFO.phone.replace(/\s/g, '')}`}
                    className="text-sm text-[#1F2A5A] hover:text-[#2563EB] transition-colors"
                  >
                    {COMPANY_INFO.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0 group-hover:bg-[#DBEAFE] transition-colors">
                  <MapPin className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Address</p>
                  <span className="text-sm text-[#1F2A5A] leading-relaxed block">
                    {COMPANY_INFO.address}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E7EB]" />

        {/* Bottom Section */}
        <div className="mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-sm text-[#6B7280] text-center md:text-left">
              <p>
                © {COMPANY_INFO.year} <span className="font-semibold text-[#1F2A5A]">{COMPANY_INFO.name}</span>. All rights reserved.
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap gap-6 justify-center md:justify-end">
              {LEGAL_LINKS.map((link, idx) => (
                <span key={link.href} className="flex items-center gap-6">
                  <Link
                    href={link.href}
                    className="text-sm text-[#6B7280] hover:text-[#2563EB] transition-colors"
                  >
                    {link.label}
                  </Link>
                  {idx < LEGAL_LINKS.length - 1 && (
                    <span className="text-[#E5E7EB]">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#6B7280] text-center mt-6">
            Designed and developed by JUGO TECH SOLUTIONS for educators and learners worldwide.
          </p>
        </div>
      </div>
    </footer>
  )
}