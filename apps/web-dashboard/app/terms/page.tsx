import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service — Direct Connect Pay',
  description: 'Terms and conditions for using Direct Connect Pay merchant services and APIs.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="June 16, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Direct Connect Pay
        (&ldquo;DCP,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) websites, merchant
        dashboard, APIs, and related services (collectively, the &ldquo;Services&rdquo;). By accessing or using
        the Services, you agree to these Terms.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old and have the authority to bind your business entity. You represent that
        your use of crypto payment services complies with applicable laws in your jurisdiction, including money
        transmission, tax, and consumer protection requirements.
      </p>

      <h2>2. Merchant accounts</h2>
      <ul>
        <li>You are responsible for safeguarding your API keys and admin credentials.</li>
        <li>You must provide accurate business and contact information during onboarding.</li>
        <li>We may suspend or terminate accounts that violate these Terms or pose security or compliance risk.</li>
        <li>KYC verification may be required before processing live (mainnet) volume.</li>
      </ul>

      <h2>3. Services description</h2>
      <p>
        DCP provides tools to create payment invoices, monitor blockchain transactions, and deliver webhooks.
        Unless explicitly agreed otherwise, Services are <strong>non-custodial</strong> — we do not take
        possession of customer funds. You are responsible for fulfillment of goods and services sold to your
        customers.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Services for illegal activity, fraud, money laundering, or sanctions violations</li>
        <li>Process payments for prohibited goods or services (including as defined by card network or MSB policies)</li>
        <li>Attempt to bypass rate limits, authentication, or security controls</li>
        <li>Reverse engineer, scrape, or overload the API except as permitted by documentation</li>
        <li>Misrepresent affiliation with Direct Connect Pay or impersonate our domains (see our Domains page)</li>
      </ul>

      <h2>5. Fees</h2>
      <p>
        Platform fees, if any, will be disclosed in your merchant agreement or pricing schedule. Blockchain
        network fees are set by the relevant networks and are your or your customer&apos;s responsibility.
      </p>

      <h2>6. API and webhooks</h2>
      <ul>
        <li>API access is provided on an &ldquo;as available&rdquo; basis with documented rate limits.</li>
        <li>Webhook deliveries use HMAC signatures; you must verify signatures before trusting payloads.</li>
        <li>We may modify API versions with reasonable notice where practicable.</li>
      </ul>

      <h2>7. Intellectual property</h2>
      <p>
        DCP branding, software, documentation, and content are owned by Direct Connect Pay or its licensors. You
        receive a limited, non-exclusive license to use the Services for your internal business purposes. You may
        not use our trademarks without prior written consent.
      </p>

      <h2>8. Disclaimers</h2>
      <p className="legal-caps">
        THE SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY
        KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT. WE DO NOT GUARANTEE UNINTERRUPTED BLOCKCHAIN CONNECTIVITY, EXCHANGE RATES, OR PAYMENT
        FINALITY TIMING.
      </p>

      <h2>9. Limitation of liability</h2>
      <p className="legal-caps">
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, DCP AND ITS AFFILIATES SHALL NOT BE LIABLE FOR INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL,
        ARISING FROM YOUR USE OF THE SERVICES. OUR AGGREGATE LIABILITY SHALL NOT EXCEED THE FEES PAID BY YOU TO
        DCP IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED US DOLLARS ($100), WHICHEVER IS
        GREATER.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless DCP from claims arising out of your business, your customers,
        your violation of these Terms, or your violation of applicable law.
      </p>

      <h2>11. Compliance</h2>
      <p>
        You are solely responsible for regulatory compliance related to your merchant activities, including
        Florida and US federal requirements where applicable. We may cooperate with lawful requests from
        authorities.
      </p>

      <h2>12. Termination</h2>
      <p>
        You may stop using the Services at any time. We may suspend or terminate access for breach, risk, or
        discontinuation of the product. Provisions that by nature should survive (liability limits,
        indemnification, governing law) will survive termination.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Florida, United States, without regard to conflict of
        law principles. Disputes shall be resolved in the state or federal courts located in Florida, unless
        otherwise required by applicable law.
      </p>

      <h2>14. Changes</h2>
      <p>
        We may update these Terms. Continued use after the &ldquo;Last updated&rdquo; date constitutes acceptance
        of the revised Terms. Material changes may be communicated via the dashboard or email where appropriate.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these Terms:{' '}
        <a href="https://www.directconnectpay.com" target="_blank" rel="noopener noreferrer">
          www.directconnectpay.com
        </a>
        . See also our <a href="/privacy">Privacy Policy</a> and <a href="/domains">Official Domains</a> pages.
      </p>
    </LegalPage>
  );
}