import { FooterContent } from '@/components/footer/footer-content'
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Assessify',
  description: 'Assessify Terms of Service',
}

export default function TermsPage() {
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
            <h1 className="text-4xl font-bold text-primary-dark mb-4">Terms of Service</h1>
            <p className="text-text-gray mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">1. Agreement to Terms</h2>
            <p className="text-text-gray">
              By accessing and using the Assessify platform, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">2. Use License</h2>
            <p className="text-text-gray">
              Permission is granted to temporarily download one copy of the materials (information or software) on Assessify for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-text-gray space-y-2">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software</li>
              <li>Removing any copyright or other proprietary notations</li>
              <li>Transferring the materials to another person or &quot;mirroring&quot; the materials on any other server</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">3. Disclaimer</h2>
            <p className="text-text-gray">
              The materials on Assessify are provided &quot;as is&quot;. Assessify makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">4. Limitations</h2>
            <p className="text-text-gray">
              In no event shall Assessify or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Assessify.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">5. Accuracy of Materials</h2>
            <p className="text-text-gray">
              The materials appearing on Assessify could include technical, typographical, or photographic errors. Assessify does not warrant that any of the materials on the platform are accurate, complete, or current.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-dark">6. Contact Information</h2>
            <p className="text-text-gray">
              If you have any questions about these Terms of Service, please contact us at{' '}
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
