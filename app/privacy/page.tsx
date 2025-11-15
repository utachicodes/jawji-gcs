import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy • JAWJI",
  description: "How JAWJI collects, uses, and protects your information.",
}

type Section = {
  title: string
  items: ReactNode[]
}

const LAST_UPDATED = "November 15, 2025"

const SECTIONS: Section[] = [
  {
    title: "1. Data We Collect",
    items: [
      "Account information such as name, email, organization, and role.",
      "Operational data including telemetry, mission plans, media attachments, and device metadata that you upload to the Platform.",
      "Usage metrics (e.g., feature interactions, session duration, error reports) captured via analytics to improve reliability.",
    ],
  },
  {
    title: "2. How We Use Data",
    items: [
      "Provide, maintain, and improve the Ground Control Station features.",
      "Notify you about platform updates, security alerts, and operational advisories.",
      "Analyze anonymized usage trends to harden safety systems and performance.",
    ],
  },
  {
    title: "3. Legal Bases",
    items: [
      "Performance of a contract: we process telemetry to deliver mission visualization, health monitoring, and streaming.",
      "Legitimate interests: secure the Platform, prevent abuse, and enhance user experience.",
      "Consent: we rely on your consent for optional communications (marketing, beta programs).",
    ],
  },
  {
    title: "4. Sharing & Transfers",
    items: [
      "We do not sell personal data. We may share limited information with trusted processors (cloud hosting, analytics, authentication providers) under data-processing agreements.",
      "Cross-border transfers are protected with industry-standard safeguards such as SCCs where required.",
    ],
  },
  {
    title: "5. Security",
    items: [
      "Encryption in transit (TLS) and at rest for telemetry, mission data, and credentials.",
      "Role-based access controls, audit logging, and redundant infrastructure for high availability.",
      "Despite best efforts, no system is immune from risk; notify us immediately at security@jawji.com if you suspect an issue.",
    ],
  },
  {
    title: "6. Data Retention",
    items: [
      "Account and mission data are stored for the duration of your subscription plus any legally required retention period.",
      "You may request deletion of telemetry or user profiles; we will fulfill requests unless retention is required by law or safety investigations.",
    ],
  },
  {
    title: "7. Your Rights",
    items: [
      "Depending on your jurisdiction, you may have rights to access, correct, delete, or port your data, and to object to certain processing.",
      <>
        Submit requests via{" "}
        <Link href="mailto:privacy@jawji.com" className="text-primary underline">
          privacy@jawji.com
        </Link>
        .
      </>,
    ],
  },
  {
    title: "8. Cookies & Tracking",
    items: [
      "We use essential cookies for authentication and session continuity.",
      "Analytics cookies are limited to aggregate performance insights. You may disable non-essential cookies through your browser settings.",
    ],
  },
  {
    title: "9. Children",
    items: ["The Platform is not directed to children under 16, and we do not knowingly collect their personal information."],
  },
  {
    title: "10. Updates",
    items: [
      "We may update this Privacy Policy to reflect product, legal, or regulatory changes. Material updates will be communicated via email or in-app notice.",
      "The “Last updated” date below indicates the current version.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-primary/80">JAWJI GCS</p>
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated {LAST_UPDATED}</p>
        </div>
        <div className="mt-12 space-y-10 text-sm leading-relaxed text-muted-foreground">
          {SECTIONS.map((section) => (
            <section key={section.title} className="space-y-4 rounded-lg border border-border/60 bg-card/40 p-6 shadow-sm backdrop-blur">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <ul className="list-disc space-y-2 pl-6 text-base text-muted-foreground">
                {section.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

