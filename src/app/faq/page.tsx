import { FooterContent } from '@/components/footer/footer-content'
import Link from 'next/link'

export const metadata = {
  title: 'FAQ | Assessify',
  description: 'Frequently Asked Questions about Assessify',
}

export default function FAQPage() {
  const faqs = [
    {
      question: 'What is Assessify?',
      answer: 'Assessify is a Smart Continuous Assessment Management Platform designed to help educational institutions streamline their assessment processes with AI-powered grading, plagiarism detection, and automated CA computation.'
    },
    {
      question: 'How do I create an account?',
      answer: 'Click on "Get Started" on the home page and follow the sign-up process. You can register as a student, lecturer, partner, or administrator.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we implement industry-standard security measures to protect your personal information and academic data.'
    },
    {
      question: 'How much does Assessify cost?',
      answer: 'Assessify offers various pricing plans depending on your role and usage. Contact our sales team for detailed pricing information.'
    },
    {
      question: 'Can I use Assessify on mobile devices?',
      answer: 'Yes, Assessify is optimized for both desktop and mobile devices, allowing you to access your courses and assignments from anywhere.'
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach our support team at contact@assessify.ng or call +234 912 956 2739. We\'re here to help!'
    }
  ]

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
            <h1 className="text-4xl font-bold text-primary-dark mb-4">Frequently Asked Questions</h1>
            <p className="text-text-gray">
              Find answers to common questions about Assessify and how to use our platform.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="border border-border-gray rounded-lg p-4">
                <summary className="font-semibold text-primary-dark cursor-pointer hover:text-primary-blue transition-colors">
                  {faq.question}
                </summary>
                <p className="text-text-gray mt-3">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="bg-bg-light p-6 rounded-lg text-center">
            <h2 className="text-xl font-semibold text-primary-dark mb-3">Didn&apos;t find your answer?</h2>
            <p className="text-text-gray mb-4">
              Contact our support team and we&apos;ll be happy to help.
            </p>
            <Link href="/contact" className="text-primary-blue hover:text-primary-dark font-medium">
              Get in Touch →
            </Link>
          </div>
        </div>
      </main>

      <FooterContent />
    </div>
  )
}
