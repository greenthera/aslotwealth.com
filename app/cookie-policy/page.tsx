import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CookieSettings } from '@/components/CookieConsent';
import { EMAIL } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata('/cookie-policy'),
  title: 'Cookie Policy – Aslot Wealth Advisor',
  description:
    'How the Aslot Wealth Advisor website uses cookies, optional analytics and the embedded map, and how to manage your choices.',
};

const h2 = 'text-2xl font-semibold mb-4 text-primary';
const p = 'text-muted-foreground leading-relaxed';
const settingsBtn =
  'mt-4 inline-flex min-h-11 items-center border border-primary px-5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground';

const COOKIES = [
  { name: 'cc_cookie', provider: 'This website', purpose: 'Remembers your cookie choices', duration: '182 days', category: 'Strictly necessary' },
  { name: '_ga, _ga_*', provider: 'Google Analytics', purpose: 'Distinguishes visitors and sessions to measure website usage', duration: 'Up to 2 years', category: 'Analytics' },
  { name: '_clck, _clsk', provider: 'Microsoft Clarity', purpose: 'Understands how pages are used (clicks, scrolling) to improve the website', duration: 'Up to 1 year', category: 'Analytics' },
];

const CookiePolicyPage = () => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <main className="container mx-auto px-4 py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: November 2026</p>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className={h2}>1. What Cookies Are</h2>
            <p className={p}>
              Cookies are small text files stored in your browser when you visit a website. This policy explains which
              cookies the Aslot Wealth Advisor website uses and how you can control them.
            </p>
          </section>

          <section>
            <h2 className={h2}>2. Strictly Necessary</h2>
            <p className={p}>
              A preference cookie remembers your cookie choices for 182 days. The map in our contact section is also an
              always-enabled service. The embedded map connects to Google Maps, which may use its own cookies.
            </p>
          </section>

          <section>
            <h2 className={h2}>3. Analytics</h2>
            <p className={p}>
              With your permission, we use Google Analytics and Microsoft Clarity (through Google Tag Manager) to
              understand how visitors use the website so we can improve it. These tools stay off until you click
              Accept or allow Analytics in Cookie settings. Advertising cookies are not used. You can browse the
              website and contact us without accepting analytics.
            </p>
          </section>

          <section>
            <h2 className={h2}>4. Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm text-muted-foreground">
                <thead>
                  <tr className="border-b border-border text-foreground">
                    <th scope="col" className="py-2 pr-4 font-semibold">Cookie</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Provider</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Purpose</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Duration</th>
                    <th scope="col" className="py-2 font-semibold">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES.map((c) => (
                    <tr key={c.name} className="border-b border-border align-top">
                      <td className="py-2 pr-4 font-mono text-foreground">{c.name}</td>
                      <td className="py-2 pr-4">{c.provider}</td>
                      <td className="py-2 pr-4">{c.purpose}</td>
                      <td className="py-2 pr-4">{c.duration}</td>
                      <td className="py-2">{c.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className={h2}>5. Manage Your Choices</h2>
            <p className={p}>
              You can accept or decline analytics in the cookie dialog and change your choice at any time using Cookie
              settings in the footer. Turning analytics off clears matching cookies the website can access and reloads
              the page if needed to stop tracking that has already loaded. This does not remove cookies stored on an
              external provider&apos;s domain; you can delete those in your browser settings.
            </p>
            <CookieSettings className={settingsBtn} />
          </section>

          <section>
            <h2 className={h2}>6. Enquiry Information</h2>
            <p className={p}>
              Cookie choices are separate from the details you send through our contact form. Read our{' '}
              <Link href="/privacy-policy" className="text-primary underline underline-offset-4">
                Privacy Policy
              </Link>{' '}
              to learn how we use those details.
            </p>
          </section>

          <section>
            <h2 className={h2}>7. Contact Us</h2>
            <p className={p}>
              Questions about this Cookie Policy? Email us at{' '}
              <a href={`mailto:${EMAIL}`} className="text-primary underline underline-offset-4">
                {EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default CookiePolicyPage;
