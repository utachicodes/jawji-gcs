import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service • JAWJI",
  description: "Terms that govern the use of the JAWJI Ground Control Station platform.",
}

type Section = {
  title: string
  body: ReactNode[]
}

const LAST_UPDATED = "November 15, 2025"

const SECTIONS: Section[] = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using the JAWJI Ground Control Station (“Platform”), you agree to be bound by these Terms of Service. If you are using the Platform on behalf of an organization, you represent that you have authority to bind that entity to these terms.",
    ],
  },
  {
    title: "2. Eligibility & Accounts",
    body: [
      "You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account.",
      "You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account.",
    ],
  },
  {
    title: "3. Authorized Use",
    body: [
      "You agree to operate all connected hardware (drones, sensors, and related ground equipment) in compliance with applicable aviation, privacy, and export regulations.",
      "You may not attempt to reverse engineer, disrupt, or gain unauthorized access to the Platform or associated infrastructure.",
    ],
  },
  {
    title: "4. Telemetry & Data",
    body: [
      "You retain ownership of your telemetry, mission, and media data. By sending data to the Platform you grant JAWJI a non-exclusive license to process, store, and transmit that data solely to provide the service.",
      "You are responsible for ensuring that you have the right to process and transmit any third-party data you upload.",
    ],
  },
  {
    title: "5. Service Availability",
    body: [
      "We aim for high availability but do not guarantee uninterrupted access. Planned maintenance or unforeseen outages may occur.",
      "Mission-critical operations should include redundant communication channels and fail-safes outside of the Platform.",
    ],
  },
  {
    title: "6. Payment & Trials",
    body: [
      "Unless otherwise agreed in writing, subscription fees are non-refundable.",
      "We may offer beta features or trials. Beta access is provided “as-is” without warranties and may be discontinued at any time.",
    ],
  },
  {
    title: "7. Warranties & Disclaimers",
    body: [
      "The Platform is provided on an “as-is” and “as-available” basis without warranties of any kind, express or implied.",
      "JAWJI disclaims liability for damages arising from drone operations, mission outcomes, or integration with third-party services.",
    ],
  },
  {
    title: "8. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, JAWJI’s total liability for any claim related to the Platform is limited to the amount you paid for the service in the 12 months preceding the incident.",
      "JAWJI is not liable for indirect, incidental, consequential, or punitive damages.",
    ],
  },
  {
    title: "9. Suspension & Termination",
    body: [
      "We may suspend or terminate accounts that violate these Terms, compromise system security, or endanger flight safety.",
      "You may terminate your account at any time. Sections intended to survive (e.g., data rights, limitation of liability) remain in effect.",
    ],
  },
  {
    title: "10. Updates",
    body: [
      "We may update these Terms to reflect product, legal, or regulatory changes. The “Last updated” date will be revised accordingly.",
      "Continued use of the Platform after updates constitutes acceptance of the revised Terms.",
    ],
  },
  {
    title: "Contact",
    body: [
      <>
        Questions? Reach us at{" "}
        <Link href="mailto:legal@jawji.com" className="text-primary underline">
          legal@jawji.com
        </Link>
        .
      </>,
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-primary/80">JAWJI GCS</p>
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated {LAST_UPDATED}</p>
        </div>
        <div className="mt-12 space-y-10 text-sm leading-relaxed text-muted-foreground">
          {SECTIONS.map((section) => (
            <section key={section.title} className="space-y-3 rounded-lg border border-border/60 bg-card/40 p-6 shadow-sm backdrop-blur">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <div className="space-y-2">
                {section.body.map((paragraph, idx) => (
                  <p key={idx} className="text-base leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

