import type { Metadata } from "next"
import Link from "next/link"

const LAST_UPDATED = "November 15, 2025"

export const metadata: Metadata = {
  title: "Privacy Policy | JAWJI Ground Control",
  description: "How the JAWJI drone platform collects, uses, and protects telemetry and personal data.",
}

const sections = [
  {
    title: "1. Data We Collect",
    items: [
      "Account data such as name, email address, organization, and authentication history.",
      "Operational data including telemetry, mission plans, MQTT topics, and camera feeds you choose to stream into the Platform.",
      "Device metadata (browser, OS, approximate region) for security auditing and performance tuning.",
    ],
  },
  {
    title: "2. How We Use Data",
    items: [
      "To authenticate users, personalize dashboards, and provide role‑based access.",
      "To relay telemetry and video feeds to authorized clients, analytics pipelines, or downstream storage you configure (e.g., Supabase, MongoDB, S3).",
      "To monitor availability, detect abuse, and improve safety features such as geofence alerts and health checks.",
    ],
  },
  {
    title: "3. Sharing & Disclosure",
    items: [
      "We do not sell personal data. We may share limited data with infrastructure providers (cloud hosting, observability, customer support) bound by confidentiality obligations.",
      "We may disclose data if required by law, subpoena, or to prevent imminent harm.",
    ],
  },
  {
    title: "4. Data Retention",
    items: [
      "Account metadata is retained while your organization maintains an active subscription and for a reasonable period afterward for audit compliance.",
      "Telemetry and video buffers ingested via `/api/ingest` are retained only as long as needed to deliver the stream or as configured by your storage adapters.",
    ],
  },
  {
    title: "5. Security",
    items: [
      "All control traffic and telemetry ingest endpoints require TLS. Service role keys and secrets should be stored in your infrastructure and never inside client bundles.",
      "Access to production systems is limited to authorized personnel and protected by MFA, audit logging, and network segmentation.",
    ],
  },
  {
    title: "6. Your Choices",
    items: [
      "You may request account deletion or export of your data by emailing privacy@jawji.io.",
      "Operators can revoke telemetry ingestion at any time by disabling their MQTT streamer configuration or revoking service keys.",
    ],
  },
  {
    title: "7. International Transfers",
    items: [
      "Data may be processed in the United States or other jurisdictions where our infrastructure providers operate. We implement safeguards to protect data in transit and at rest regardless of location.",
    ],
  },
  {
    title: "8. Updates",
    items: [
      "We will post updates to this Privacy Policy on this page and notify admins of material changes via email or in‑product notices.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
          <p className="text-base text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            This policy explains how JAWJI handles personal information, telemetry, and operational data ingested through the Ground Control Station.
          </p>
        </header>

        <div className="space-y-8 rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur supports-[backdrop-filter]:bg-card/40">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground leading-relaxed">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="text-center text-sm text-muted-foreground">
          Questions about privacy? Contact{" "}
          <Link href="mailto:privacy@jawji.io" className="text-primary hover:underline">
            privacy@jawji.io
          </Link>
          .
        </footer>
      </div>
    </div>
  )
}

