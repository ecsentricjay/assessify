import { FooterContent } from '@/components/footer/footer-content'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Assessify',
  description: 'Assessify Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-primary-blue hover:text-primary-dark">
            ← Back to Home
          </Link>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-primary-dark mb-4">Privacy Policy</h1>
            <p className="text-text-gray mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">Introduction</h2>
            <p className="text-text-gray">
              At Assessify, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">Information We Collect</h2>
            <p className="text-text-gray">
              We collect information you provide directly, such as when you create an account, including:
            </p>
            <ul className="list-disc list-inside text-text-gray space-y-2">
              <li>Name and email address</li>
              <li>Academic information (course, institution, etc.)</li>
              <li>Profile information and preferences</li>
              <li>Payment information for services</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">How We Use Your Information</h2>
            <p className="text-text-gray">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-text-gray space-y-2">
              <li>Provide and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Personalize your experience</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">Security</h2>
            <p className="text-text-gray">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">Contact Us</h2>
            <p className="text-text-gray">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:contact@assessify.ng" className="text-primary-blue hover:text-primary-dark">
                contact@assessify.ng
              </a>
            </p>
          </section>
        </div>
      </main>

      <FooterContent />
    </div>
  )
}
