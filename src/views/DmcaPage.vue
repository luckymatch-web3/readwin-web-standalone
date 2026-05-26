<script setup lang="ts">
const sections = [
  {
    title: '1. DMCA Policy Statement',
    content: `ReadWin ("we," "us," or "our") respects the intellectual property rights of others and expects our users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond promptly to claims of copyright infringement committed using our platform (readwin.me) that are reported to our designated copyright agent.

If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement and is accessible on our platform, please notify our copyright agent as described below.`
  },
  {
    title: '2. Filing a DMCA Takedown Notice',
    content: `To file a DMCA takedown notice, please send a written notification to our designated agent that includes the following information:

• **Identification of the copyrighted work** that you claim has been infringed, or if multiple works are covered by a single notification, a representative list of such works.

• **Identification of the material** that you claim is infringing and that you request be removed or access disabled, including sufficient information to permit us to locate the material (e.g., the URL or page where the material appears).

• **Your contact information**, including your full legal name, mailing address, telephone number, and email address.

• **A statement** that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.

• **A statement** that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of the exclusive right that is allegedly infringed.

• **Your physical or electronic signature** (typing your full legal name is acceptable as an electronic signature).

**Send your DMCA takedown notice to:**

**Email:** support@readwin.me
**Subject Line:** DMCA Takedown Notice`
  },
  {
    title: '3. Counter-Notification Process',
    content: `If you believe that your content was removed or disabled by mistake or misidentification, you may file a counter-notification with us. Your counter-notification must include the following:

• **Identification of the material** that has been removed or to which access has been disabled, and the location at which the material appeared before it was removed or disabled.

• **A statement under penalty of perjury** that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification.

• **Your full legal name, address, and telephone number.**

• **A statement** that you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located, or if your address is outside the United States, for any judicial district in which ReadWin may be found, and that you will accept service of process from the person who provided the original DMCA notification or an agent of such person.

• **Your physical or electronic signature.**

**Send your counter-notification to:**

**Email:** support@readwin.me
**Subject Line:** DMCA Counter-Notification

Upon receipt of a valid counter-notification, we will forward it to the original complainant. If the original complainant does not file a court action seeking to restrain the allegedly infringing activity within 10 business days, we may restore the removed material.`
  },
  {
    title: '4. Repeat Infringer Policy',
    content: `In accordance with the DMCA and other applicable laws, ReadWin has adopted a policy of terminating, in appropriate circumstances and at our sole discretion, accounts of users who are deemed to be repeat infringers.

We may also, at our sole discretion, limit access to our platform and/or terminate the accounts of any users who infringe the intellectual property rights of others, whether or not there is any repeat infringement.

A repeat infringer is a user who has been notified of infringing activity more than twice and/or has had content removed from the platform more than twice.`
  },
  {
    title: '5. Modifications to This Policy',
    content: `We reserve the right to modify this DMCA policy at any time. Changes will be posted on this page with an updated effective date. Your continued use of our platform after any changes constitutes acceptance of the updated policy.`
  },
  {
    title: '6. Contact Information',
    content: `For any questions regarding this DMCA policy or copyright-related matters, please contact us at:

**Email:** support@readwin.me
**Website:** https://readwin.me`
  },
]
</script>

<template>
  <main class="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">DMCA / Copyright Policy</h1>
      <p class="text-sm mb-8" style="color: var(--text-tertiary)">Effective Date: March 2026</p>

      <p class="text-sm leading-relaxed mb-8" style="color: var(--text-secondary)">
        This page outlines ReadWin's policy regarding copyright infringement claims in accordance with the Digital Millennium Copyright Act (DMCA). We take intellectual property rights seriously and are committed to responding to notices of alleged copyright infringement.
      </p>

      <div v-for="section in sections" :key="section.title" class="mb-8">
        <h2 class="text-lg font-semibold mb-3" style="color: var(--text-primary)">{{ section.title }}</h2>
        <div class="text-sm leading-relaxed whitespace-pre-line" style="color: var(--text-secondary)" v-html="section.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')"></div>
      </div>
    </div>
  </main>
</template>
