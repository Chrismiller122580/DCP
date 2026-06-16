import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy — Direct Connect Pay',
  description: 'How Direct Connect Pay collects, uses, and protects personal and merchant data.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="June 16, 2026">
      <p>
        Direct Connect Pay (&ldquo;DCP,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects
        your privacy. This Privacy Policy describes how we collect, use, disclose, and safeguard information when
        you use our website, merchant dashboard, mobile applications, and APIs (collectively, the
        &ldquo;Services&rdquo;).
      </p>

      <h2>1. Information we collect</h2>
      <h3>Merchant account information</h3>
      <p>When you register or onboard as a merchant, we may collect:</p>
      <ul>
        <li>Business name and contact email</li>
        <li>Webhook endpoint URLs and integration configuration</li>
        <li>API usage metadata (request timestamps, IP addresses, error logs)</li>
        <li>KYC verification status when enabled by an administrator</li>
      </ul>

      <h3>Payment and transaction data</h3>
      <p>
        DCP operates a non-custodial payment flow. We process invoice metadata such as amounts, currencies,
        blockchain addresses, destination tags, transaction hashes, and payment status. We do not collect or
        store private keys, seed phrases, or wallet credentials.
      </p>

      <h3>Technical data</h3>
      <ul>
        <li>Browser type, device information, and pages visited</li>
        <li>Session and authentication tokens stored locally in your browser (API key session for dashboard access)</li>
        <li>Server logs for security, rate limiting, and reliability</li>
      </ul>

      <h2>2. How we use information</h2>
      <p>We use collected information to:</p>
      <ul>
        <li>Provide, operate, and maintain the Services</li>
        <li>Authenticate merchants and deliver API responses</li>
        <li>Send webhook notifications for payment events</li>
        <li>Detect fraud, abuse, and security incidents</li>
        <li>Comply with legal obligations and enforce our Terms</li>
        <li>Improve reliability, performance, and product features</li>
      </ul>

      <h2>3. Legal bases (where applicable)</h2>
      <p>
        Depending on your jurisdiction, we process personal data based on contract performance (providing the
        Services), legitimate interests (security and analytics), and legal compliance. Where consent is required,
        we will obtain it before processing.
      </p>

      <h2>4. Sharing and disclosure</h2>
      <p>We do not sell personal information. We may share data with:</p>
      <ul>
        <li>
          <strong>Infrastructure providers</strong> — hosting (e.g. Vercel, Railway), databases, and caching
          services under data processing agreements
        </li>
        <li>
          <strong>Blockchain networks</strong> — transaction data is recorded on public ledgers when payments are
          made; this data is inherently public
        </li>
        <li>
          <strong>Legal authorities</strong> — when required by law, subpoena, or to protect rights and safety
        </li>
      </ul>

      <h2>5. Data retention</h2>
      <p>
        Merchant records and invoice data are retained for as long as your account is active and as needed for
        legal, accounting, and dispute resolution purposes. Logs may be retained for a limited period for security
        and operations.
      </p>

      <h2>6. Security</h2>
      <p>
        We implement administrative, technical, and organizational measures including API key authentication,
        HMAC-signed webhooks, rate limiting, and encrypted connections (HTTPS/TLS). No method of transmission
        over the Internet is 100% secure; we cannot guarantee absolute security.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on your location (including certain US state privacy laws and, where applicable, GDPR), you may
        have rights to access, correct, delete, or port your personal data, and to opt out of certain processing.
        To exercise these rights, contact us through{' '}
        <a href="https://www.directconnectpay.com" target="_blank" rel="noopener noreferrer">
          directconnectpay.com
        </a>
        .
      </p>

      <h2>8. Cookies and local storage</h2>
      <p>
        The merchant dashboard may store your API key in browser local storage to maintain your session. We do not
        use third-party advertising cookies. Essential cookies or storage may be used for security and
        functionality.
      </p>

      <h2>9. Children</h2>
      <p>
        The Services are not directed to individuals under 18. We do not knowingly collect personal information
        from children.
      </p>

      <h2>10. International transfers</h2>
      <p>
        Data may be processed in the United States and other countries where our service providers operate.
        Appropriate safeguards are applied where required by law.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at the top
        reflects the current version. Material changes will be posted on this page.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about this Privacy Policy:{' '}
        <a href="https://www.directconnectpay.com" target="_blank" rel="noopener noreferrer">
          www.directconnectpay.com
        </a>
      </p>
    </LegalPage>
  );
}