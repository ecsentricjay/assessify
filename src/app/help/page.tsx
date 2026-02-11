import { FooterContent } from '@/components/footer/footer-content'
import Link from 'next/link'

export const metadata = {
  title: 'Help Center | Assessify',
  description: 'Assessify Help Center - Get help with using the platform',
}

export default function HelpPage() {
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
            <h1 className="text-4xl font-bold text-primary-dark mb-4">Help Center</h1>
            <p className="text-text-gray text-lg">
              Welcome to the Assessify Help Center. Here you can find guides, tutorials, and answers to help you get the most out of our platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border-gray rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-primary-dark mb-3">Getting Started</h3>
              <p className="text-text-gray mb-4">
                New to Assessify? Learn how to create an account and get started with the platform.
              </p>
              <Link href="#" className="text-primary-blue hover:text-primary-dark font-medium">
                View Guides →
              </Link>
            </div>

            <div className="border border-border-gray rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-primary-dark mb-3">Student Resources</h3>
              <p className="text-text-gray mb-4">
                Guides for students on submitting assignments, taking tests, and tracking progress.
              </p>
              <Link href="#" className="text-primary-blue hover:text-primary-dark font-medium">
                Explore →
              </Link>
            </div>

            <div className="border border-border-gray rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-primary-dark mb-3">Lecturer Tools</h3>
              <p className="text-text-gray mb-4">
                Learn how to create courses, manage assignments, and grade submissions effectively.
              </p>
              <Link href="#" className="text-primary-blue hover:text-primary-dark font-medium">
                Learn More →
              </Link>
            </div>

            <div className="border border-border-gray rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-primary-dark mb-3">Troubleshooting</h3>
              <p className="text-text-gray mb-4">
                Having issues? Find solutions to common problems and technical issues.
              </p>
              <Link href="#" className="text-primary-blue hover:text-primary-dark font-medium">
                Get Help →
              </Link>
            </div>
          </div>

          <div className="bg-primary-blue/5 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-semibold text-primary-dark mb-3">Still need help?</h2>
            <p className="text-text-gray mb-6">
              Our support team is here to assist you. Reach out to us and we&apos;ll get back to you as soon as possible.
            </p>
            <Link 
              href="/contact" 
              className="inline-block bg-primary-blue text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <FooterContent />
    </div>
  )
}
