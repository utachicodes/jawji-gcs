import type { Metadata } from "next"
import Link from "next/link"

const LAST_UPDATED = "November 15, 2025"

export const metadata: Metadata = {
  title: "Terms of Service | JAWJI Ground Control",
  description: "Legal terms governing access to the JAWJI autonomous drone platform.",
}

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By creating an account or accessing the JAWJI Ground Control Station (the “Platform”), you agree to be bound by these Terms of Service. If you are using the Platform on behalf of an organization, you represent that you have authority to bind that organization.",
    ],
  },
  {
    title: "2. Platform Access & Eligibility",
    body: [
      "You must be at least 18 years old (or the age of majority in your jurisdiction) and comply with all applicable aviation and export control laws.",
      "You are responsible for maintaining the confidentiality of your credentials and for all activity performed under your account.",
    ],
  },
  {
    title: "3. Acceptable Use",
    body: [
      "Operate drones and ingest telemetry only from authorized airframes and airspaces.",
      "Do not attempt to probe, scan, or compromise the Platform or any connected systems.",
      "You may not use the Platform to create or distribute malicious code, spam, or content that violates any law or third‑party rights.",
    ],
  },
  {
    title: "4. Data & Telemetry",
    body: [
      "You retain ownership of telemetry, video feeds, and configuration files that you send to the Platform.",
      "You grant JAWJI a worldwide, royalty‑free license to host, process, and transmit that data solely to provide the services you request, including bridging MQTT streams, mission planning, and analytics.",
    ],
  },
  {
    title: "5. Service Availability",
    body: [
      "We aim for high uptime, but the Platform may be unavailable during maintenance windows or due to network outages.",
      "Critical flight operations should include redundant control links and fail‑safe procedures independent of the Platform.",
    ],
  },
  {
    title: "6. Warranties & Liability",
    body: [
      "The Platform is provided “as is” without warranties of any kind, including merchantability, fitness for a particular purpose, or non‑infringement.",
      "JAWJI is not liable for indirect, incidental, consequential, or punitive damages, nor for loss of data, flight logs, or payloads.",
    ],
  },
  {
    title: "7. Suspension & Termination",
    body: [
      "We may suspend or terminate access if we believe you have violated these Terms, compromised safety, or attempted unauthorized access.",
      "You may close your account at any time by contacting support; data retention obligations may apply to comply with legal requirements.",
    ],
  },
  {
    title: "8. Updates to Terms",
    body: [
      "We may update these Terms to reflect new features, regulatory changes, or best practices. Material changes will be announced via in‑product notices or email.",
      "Continued use of the Platform after updates become effective constitutes acceptance of the revised Terms.",
    ],
  },
  {
    title: "9. Contact",
    body: [
      "For questions about these Terms or to report a violation, email legal@jawji.io.",
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Terms of Service</h1>
          <p className="text-base text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            These terms describe how you may access and use the JAWJI Ground Control Station, including telemetry ingest, fleet control,
            and mission management features.
          </p>
        </header>

        <div className="space-y-10 rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur supports-[backdrop-filter]:bg-card/40">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                {section.body.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="text-center text-sm text-muted-foreground">
          Need help? <Link href="mailto:legal@jawji.io" className="text-primary hover:underline">legal@jawji.io</Link>
        </footer>
      </div>
    </div>
  )
}

