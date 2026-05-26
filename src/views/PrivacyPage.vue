<script setup lang="ts">
const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, such as when you create an account, update your profile, use interactive features, request a withdrawal, or contact us for support.

**Personal Information:** Email address, username, display name, and profile picture.

**Usage Data:** Pages visited, novels read, reading duration, chapter progress, and interaction patterns.

**Device Information:** Device type, operating system, browser type, IP address, and unique device identifiers.

**Withdrawal Information:** When you request a PayPal cashout or other supported redemption, payout details are processed by the relevant third-party provider. We do not store full payment card details.`
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process reward, wallet, withdrawal, and account-related information
• Personalize your reading experience and content recommendations
• Send technical notices, updates, security alerts, and support messages
• Respond to your comments, questions, and customer service requests
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions and abuse
• Comply with legal obligations`
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:

• **Service Providers:** We share data with third-party vendors who assist us in operating our platform, conducting business, or servicing you.
• **Legal Requirements:** We may disclose information when required by law or in response to valid legal processes.
• **Business Transfers:** In connection with a merger, acquisition, or sale of assets.
• **With Your Consent:** We may share information with your explicit consent.`
  },
  {
    title: '4. Data Storage and Security',
    content: `Your data is stored on secure servers located in Singapore and other regions as necessary to provide our services. We implement industry-standard security measures including encryption in transit (TLS/SSL), encryption at rest, regular security audits, and access controls.

While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.`
  },
  {
    title: '5. Cookies and Tracking Technologies',
    content: `We use cookies and similar tracking technologies to:

• Remember your preferences and settings
• Authenticate users and prevent fraud
• Analyze site traffic and usage patterns
• Deliver targeted advertisements

**Essential Cookies:** Required for the platform to function properly.
**Analytics Cookies:** Help us understand how visitors interact with our platform.
**Advertising Cookies:** Used to deliver relevant advertisements.

You can control cookies through your browser settings. Disabling certain cookies may affect your experience on our platform.`
  },
  {
    title: '6. Third-Party Services',
    content: `Our platform may integrate with or contain links to third-party services, including:

• **Google AdSense:** For displaying advertisements
• **Google Analytics:** For usage analytics
• **Social Media Platforms:** For sharing and authentication
• **Payout and Payment Processors:** For handling eligible withdrawals and related account checks

Each third-party service has its own privacy policy. We encourage you to review their policies before providing any personal information.`
  },
  {
    title: '7. Your Rights',
    content: `Depending on your location, you may have the following rights regarding your personal data:

• **Access:** Request a copy of the personal data we hold about you.
• **Correction:** Request correction of inaccurate or incomplete data.
• **Deletion:** Request deletion of your personal data.
• **Portability:** Request a copy of your data in a structured, machine-readable format.
• **Objection:** Object to the processing of your data for certain purposes.
• **Withdrawal of Consent:** Withdraw previously given consent at any time.

To exercise any of these rights, please contact us at privacy@readwin.me or visit https://readwin.me/account-deletion. We will respond to your request within 30 days.`
  },
  {
    title: '8. Children\'s Privacy',
    content: `Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete such information promptly.`
  },
  {
    title: '9. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Effective Date" above. Your continued use of our services after such changes constitutes acceptance of the updated policy.`
  },
  {
    title: '10. Contact Us',
    content: `If you have any questions about this Privacy Policy, please contact us at:

**Email:** privacy@readwin.me
**Address:** 1 Raffles Place, #20-61, Tower 2, Singapore 048616`
  },
]
</script>

<template>
  <main class="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">Privacy Policy</h1>
      <p class="text-sm mb-8" style="color: var(--text-tertiary)">Effective Date: February 2026</p>

      <p class="text-sm leading-relaxed mb-8" style="color: var(--text-secondary)">
        At ReadWin ("we," "us," or "our"), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
      </p>

      <div v-for="section in sections" :key="section.title" class="mb-8">
        <h2 class="text-lg font-semibold mb-3" style="color: var(--text-primary)">{{ section.title }}</h2>
        <div class="text-sm leading-relaxed whitespace-pre-line" style="color: var(--text-secondary)" v-html="section.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')"></div>
      </div>
    </div>
  </main>
</template>
