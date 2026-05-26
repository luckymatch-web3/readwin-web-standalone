<script setup lang="ts">
const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using ReadWin's website, mobile applications, and services (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.

We reserve the right to modify these terms at any time. Your continued use of the Services after changes are posted constitutes acceptance of the modified terms.`
  },
  {
    title: '2. User Accounts',
    content: `To access certain features, you must create an account. You agree to:

• Provide accurate and complete registration information
• Maintain the security of your account credentials
• Promptly update your information if it changes
• Accept responsibility for all activities under your account
• Notify us immediately of any unauthorized access

We reserve the right to suspend or terminate accounts that violate these terms or remain inactive for extended periods.`
  },
  {
    title: '3. Content Policy',
    content: `**User-Generated Content:** You may submit reviews, comments, and ratings. You retain ownership of your content but grant ReadWin a worldwide, non-exclusive, royalty-free license to use, display, and distribute such content on our platform.

**Prohibited Content:** You agree not to post content that is:
• Illegal, harmful, threatening, or harassing
• Defamatory, obscene, or invasive of privacy
• Infringing on intellectual property rights
• Spam, advertising, or promotional material
• Malicious code or harmful software

We reserve the right to remove any content that violates these guidelines without notice.`
  },
  {
    title: '4. Intellectual Property',
    content: `All content on ReadWin, including novels, artwork, logos, and design elements, is protected by copyright and intellectual property laws.

**Platform Content:** The ReadWin platform, including its design, features, and functionality, is owned by ReadWin and protected by international copyright, trademark, and other intellectual property laws.

**Novel Content:** Novels available on ReadWin are the intellectual property of their respective authors or publishers. Unauthorized reproduction, distribution, or modification of any content is strictly prohibited.

**Your License:** We grant you a limited, non-exclusive, non-transferable license to access and read content on ReadWin for personal, non-commercial use only.`
  },
  {
    title: '5. Coins and Virtual Currency',
    content: `ReadWin offers a virtual currency system ("Coins") connected to reading and reward activity. Novel chapters are free to read.

• **Earning Coins:** Coins can be earned through reading activities, daily check-ins, completing tasks, and referral programs.
• **Using Coins:** Coins may be used for eligible reward features, account activity records, and official redemption flows where available.
• **Cashout:** Eligible reward balances may be exchanged through the official withdrawal program when account, threshold, fraud-prevention, and regional requirements are met.
• **Expiration:** Earned (non-purchased) coins may expire after 12 months of account inactivity.
• **No Direct Cash Value:** Coins are not legal tender and have no standalone cash value outside the official withdrawal program where applicable.
• **Modification:** We reserve the right to modify the coin system, including earning rates and redemption values, at any time with reasonable notice.`
  },
  {
    title: '6. Prohibited Activities',
    content: `You agree not to:

• Use automated systems (bots, scrapers) to access the Services
• Circumvent any access restrictions or security measures
• Reproduce, distribute, or create derivative works from our content
• Interfere with or disrupt the Services or servers
• Impersonate any person or entity
• Use the Services for any illegal purpose
• Attempt to gain unauthorized access to other users' accounts
• Manipulate the coin or reward systems through fraudulent means`
  },
  {
    title: '7. Disclaimers',
    content: `THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

We do not guarantee that:
• The Services will be uninterrupted or error-free
• Defects will be corrected in a timely manner
• The Services are free of viruses or harmful components
• The results of using the Services will meet your requirements`
  },
  {
    title: '8. Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, READWIN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.

Our total liability for any claims arising out of or relating to these Terms or the Services shall not exceed the eligible reward amount recorded in your account for the twelve (12) months preceding the claim, to the extent permitted by applicable law.`
  },
  {
    title: '9. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of Singapore, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of Singapore.`
  },
  {
    title: '10. Contact',
    content: `For questions about these Terms of Service, please contact us at:

**Email:** legal@readwin.me
**Address:** 1 Raffles Place, #20-61, Tower 2, Singapore 048616`
  },
]
</script>

<template>
  <main class="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">Terms of Service</h1>
      <p class="text-sm mb-8" style="color: var(--text-tertiary)">Last Updated: February 2026</p>

      <p class="text-sm leading-relaxed mb-8" style="color: var(--text-secondary)">
        Welcome to ReadWin. These Terms of Service ("Terms") govern your use of our platform and services. Please read them carefully before using ReadWin.
      </p>

      <div v-for="section in sections" :key="section.title" class="mb-8">
        <h2 class="text-lg font-semibold mb-3" style="color: var(--text-primary)">{{ section.title }}</h2>
        <div class="text-sm leading-relaxed whitespace-pre-line" style="color: var(--text-secondary)" v-html="section.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')"></div>
      </div>
    </div>
  </main>
</template>
