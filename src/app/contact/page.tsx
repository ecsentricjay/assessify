import { FooterContent } from '@/components/footer/footer-content'
import Link from 'next/link'

export const metadata = {
  title: 'Contact Us | Assessify',
  description: 'Get in touch with the Assessify team',
}

export default function ContactPage() {
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
            <h1 className="text-4xl font-bold text-primary-dark mb-4">Contact Us</h1>
            <p className="text-text-gray text-lg">
              Have questions? We&apos;d love to hear from you. Get in touch with our team using the information below.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-bg-light p-6 rounded-lg">
                <h3 className="font-semibold text-primary-dark mb-2">Email</h3>
                <a 
                  href="mailto:contact@assessify.ng" 
                  className="text-primary-blue hover:text-primary-dark"
                >
                  contact@assessify.ng
                </a>
              </div>

              <div className="bg-bg-light p-6 rounded-lg">
                <h3 className="font-semibold text-primary-dark mb-2">Phone</h3>
                <a 
                  href="tel:+234912956739" 
                  className="text-primary-blue hover:text-primary-dark"
                >
                  +234 912 956 2739
                </a>
              </div>

              <div className="bg-bg-light p-6 rounded-lg">
                <h3 className="font-semibold text-primary-dark mb-2">Address</h3>
                <p className="text-text-gray">
                  Old Shopping Complex, IAUE<br />
                  Rumuolumeni, Obio/Akpor<br />
                  Rivers State, Nigeria
                </p>
              </div>
            </div>

            <div className="bg-primary-blue/5 p-6 rounded-lg">
              <h3 className="font-semibold text-primary-dark mb-4">Get in Touch</h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-border-gray rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-border-gray rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    placeholder="Your message..."
                    rows={4}
                    className="w-full px-3 py-2 border border-border-gray rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-blue text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <FooterContent />
    </div>
  )
}
