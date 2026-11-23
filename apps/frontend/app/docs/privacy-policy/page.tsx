import { DocsPage, DocsBody } from "fumadocs-ui/page"

export default function PrivacyPolicyPage() {
  const toc = [
    { title: "1. Scope & Data Fiduciary Details", url: "#scope", depth: 2 },
    { title: "2. Information We Collect", url: "#data-collection", depth: 2 },
    { title: "3. Purposes & Legal Bases for Processing", url: "#purposes-legal-bases", depth: 2 },
    { title: "4. Children's Privacy, FERPA & Parental Consent", url: "#children-privacy", depth: 2 },
    { title: "5. Data Sharing, Subprocessors & Third Parties", url: "#data-sharing", depth: 2 },
    { title: "6. Cookies, Session Tokens & Device Tracking", url: "#cookies-sessions", depth: 2 },
    { title: "7. Data Retention, Archiving & Deletion", url: "#data-retention", depth: 2 },
    { title: "8. Data Security & Cryptographic Safeguards", url: "#data-security", depth: 2 },
    { title: "9. Your Rights & Data Subject Access", url: "#data-rights", depth: 2 },
    { title: "10. International Data Transfers", url: "#cross-border-transfers", depth: 2 },
    { title: "11. Policy Modifications & Grievance Officer", url: "#grievance-contact", depth: 2 },
  ]

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3 pb-4 border-b border-border/40">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong>Effective Date:</strong> August 18, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> August 18, 2026
          </p>
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
            <strong>PRIVACY & COMPLIANCE SUMMARY:</strong> VidyaSchool and BlazeNeuro are committed to the highest standards of student data privacy, security, and institutional confidentiality. We process personal and academic records strictly to deliver educational management services in full compliance with applicable student privacy regulations (including FERPA, COPPA, and the Digital Personal Data Protection Act). We do not sell student data, nor do we monetize personal information through behavioral advertising.
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="scope">
            1. Scope & Data Fiduciary Details
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This Privacy Policy (&quot;<strong>Policy</strong>&quot;) delineates how <strong>VidyaSchool</strong> and its operating entity <strong>BlazeNeuro</strong> (&quot;<strong>Company</strong>&quot;, &quot;<strong>We</strong>&quot;, &quot;<strong>Us</strong>&quot;, or &quot;<strong>Our</strong>&quot;) collect, store, process, safeguard, disclose, and govern the personal information of students, parents, legal guardians, educators, librarians, accountants, and school administrators (collectively &quot;<strong>Users</strong>&quot;, &quot;<strong>You</strong>&quot;, or &quot;<strong>Data Principals</strong>&quot;) across our web platform (<a href="https://vidyaschool.vercel.app" target="_blank" rel="noreferrer" className="text-primary underline">vidyaschool.vercel.app</a>), native mobile applications (Android/Kotlin, iOS, PWA), backend APIs, student information systems, fee gateways, and related digital services (the &quot;<strong>Platform</strong>&quot;).
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="data-collection">
            2. Information We Collect
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To provide authenticated school operations and academic portals, we collect data across several distinct categories:
          </p>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1.5">
              <strong className="text-foreground font-semibold">A. Identity & Profile Information:</strong>
              <p>Full legal names, institutional email addresses, hashed authentication credentials, profile avatars, student admission numbers, roll numbers, assigned class grades and section divisions, gender, and date of birth.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1.5">
              <strong className="text-foreground font-semibold">B. Guardian & Emergency Contact Coordinates:</strong>
              <p>Parent/guardian names, verified telephone/mobile contact numbers, residential physical addresses, emergency contact designations, and commuter transit preferences (e.g., school bus route zone, transit stop, walking permissions).</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1.5">
              <strong className="text-foreground font-semibold">C. Academic & Institutional Records:</strong>
              <p>Classroom attendance registers, quarterly/term exam marks, grading schemas, cumulative GPAs, class ranks, teacher remarks, report card digital signatures, library book checkouts/fines, and academic certificates.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1.5">
              <strong className="text-foreground font-semibold">D. Financial & Transaction Logs:</strong>
              <p>Tuition fee ledgers, fee structures, concession/scholarship waivers, order IDs, payment status flags, and gateway transaction references. (Note: We do not store raw credit card numbers or UPI PINs; all sensitive payment credentials are tokenized directly by licensed payment aggregators like Razorpay).</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1.5">
              <strong className="text-foreground font-semibold">E. User-Generated Study Content:</strong>
              <p>Teacher lecture notes, drawing canvas vector strokes, uploaded PDF syllabus materials, community discussion messages, and administrative complaint tickets.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1.5">
              <strong className="text-foreground font-semibold">F. Technical, Session & Telemetry Data:</strong>
              <p>IP addresses, device user-agents, browser fingerprints, operating system specifications, session cookies (<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">better-auth.session_token</code>), Firebase Cloud Messaging (FCM) push tokens, and error telemetry via Sentry.</p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="purposes-legal-bases">
            3. Purposes & Legal Bases for Processing
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We process personal data strictly under valid legal bases including institutional educational necessity, contractual fulfillment of student portal services, legal compliance, and explicit consent:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground pl-2 leading-relaxed">
            <li><strong>Core Educational Delivery:</strong> Administering student onboarding, maintaining daily attendance registers, recording grades, publishing report cards, and delivering lecture notes.</li>
            <li><strong>Guardian Communications & Safety:</strong> Dispatching real-time attendance alerts, emergency school closure broadcasts, and fee due reminders via WebPush, SMS, and email.</li>
            <li><strong>Financial Administration:</strong> Facilitating tuition collections, reconciling school accounts, and generating official digital tax receipts.</li>
            <li><strong>Identity & Account Security:</strong> Enforcing Role-Based Access Controls (RBAC), blocking unauthorized intrusions, preventing rate limit abuse, and securing multi-device sessions.</li>
            <li><strong>Regulatory Auditing:</strong> Complying with statutory educational records retention mandates and institutional accounting audits.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="children-privacy">
            4. Children&apos;s Privacy, FERPA & Parental Consent
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Given that VidyaSchool is utilized by minors in elementary, secondary, and senior secondary schools:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Institutional Authority / In Loco Parentis:</strong> When schools register student accounts, the educational institution acts as the intermediary authority and warrants that it has secured valid parental/guardian consent under applicable child data privacy statutes (including the Children&apos;s Online Privacy Protection Act - COPPA, Family Educational Rights and Privacy Act - FERPA, and equivalent international frameworks).</li>
              <li><strong>No Commercial Exploitation:</strong> Student records and user profiles are never subjected to behavioral profiling, commercial data mining, or targeted advertising.</li>
              <li><strong>Parental Inspection:</strong> Parents and verified legal guardians possess the statutory right to inspect their child&apos;s academic records, request corrections to incorrect marks or contact details, or request account suspension through their school registrar.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="data-sharing">
            5. Data Sharing, Subprocessors & Third Parties
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong>WE DO NOT SELL, RENT, OR MONETIZE PERSONAL DATA.</strong> We share data strictly with vetted sub-processors and institutional stakeholders to operate the Platform:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="font-semibold text-foreground text-xs">Hosting & Database Infrastructure</div>
                <div className="text-xs text-muted-foreground mt-1">Neon Serverless PostgreSQL & Vercel Edge Cloud. Data encrypted in transit (TLS 1.3) and at rest (AES-256).</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="font-semibold text-foreground text-xs">Payment Processing Gateway</div>
                <div className="text-xs text-muted-foreground mt-1">Razorpay Software Private Limited. PCI-DSS certified tokenized payment execution.</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="font-semibold text-foreground text-xs">Push & Email Dispatch Networks</div>
                <div className="text-xs text-muted-foreground mt-1">Google Firebase Cloud Messaging (FCM) & Resend SMTP Infrastructure for transactional alerts.</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="font-semibold text-foreground text-xs">Cloud Document Storage</div>
                <div className="text-xs text-muted-foreground mt-1">AWS S3 / Cloudinary for secure storage of uploaded student syllabus PDFs and avatars.</div>
              </div>
            </div>
            <p className="text-xs">
              We may also disclose information where required by law, subpoena, court order, or to prevent imminent physical harm, fraud, or cybersecurity attacks against the institution.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="cookies-sessions">
            6. Cookies, Session Tokens & Device Tracking
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              The Platform uses strictly necessary first-party cookies and session tokens to preserve authentication integrity and provide multi-device security:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">better-auth.session_token</code>: Encrypted session identifier used to maintain active logins and protect role boundaries.</li>
              <li><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">theme</code>: Stores user preference for Dark, Light, or Sepia mode.</li>
              <li><strong>Session Management:</strong> Users can inspect all active logged-in devices, IP locations, and user-agents via the <a href="/login-accounts" className="text-primary underline">Login Accounts & Sessions Portal</a> and remotely revoke individual or all other devices with one click.</li>
            </ul>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="data-retention">
            7. Data Retention, Archiving & Deletion
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We retain personal data for the duration of the student&apos;s active enrollment at the affiliated institution. Upon student graduation, transfer, or formal withdrawal:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2 leading-relaxed">
            <li>Active portal access tokens are invalidated.</li>
            <li>Academic grade ledgers, report cards, and financial payment receipts are retained in encrypted institutional archives for the duration mandated by applicable statutory educational and tax auditing laws (typically 5 to 7 years).</li>
            <li>Non-essential transient telemetry and expired session logs are purged automatically on rolling 30-day to 90-day cycles.</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="data-security">
            8. Data Security & Cryptographic Safeguards
          </h2>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground">Our Multi-Layered Security Architecture Includes:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>End-to-End Transport Encryption:</strong> All data transmissions are enforced over HTTPS / TLS 1.3.</li>
              <li><strong>Storage Encryption:</strong> Database fields, passwords (salted bcrypt/Argon2), and document buckets utilize AES-256 encryption at rest.</li>
              <li><strong>Role-Based Access Control (RBAC):</strong> Strict middleware firewalls ensure students cannot view gradebooks of peers or access administrative/fee management consoles.</li>
              <li><strong>Automated Rate Limiting:</strong> Intelligent edge firewalls mitigate brute-force attempts and denial-of-service floods.</li>
            </ul>
          </div>
        </section>

        {/* Section 9 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="data-rights">
            9. Your Rights & Data Subject Access
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Depending on Your jurisdiction and applicable data protection laws, You and Your legal guardians possess the following enforceable rights:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Right of Access & Audit:</strong> The right to review all profile information, academic records, and fee receipts associated with Your account.</li>
              <li><strong>Right to Rectification:</strong> The right to request correction of inaccurate contact numbers, addresses, or misrecorded marks through institutional ticketing channels.</li>
              <li><strong>Right to Data Portability:</strong> The right to request an export of academic transcripts and note summaries in standardized formats (PDF/JSON).</li>
              <li><strong>Right to Revoke Session Access:</strong> The right to instantly revoke any connected device session via the security dashboard.</li>
            </ul>
          </div>
        </section>

        {/* Section 10 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="cross-border-transfers">
            10. International Data Transfers
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            VidyaSchool cloud infrastructure is hosted in premier data centers located in India, the European Union, and the United States. Where cross-border data routing occurs to deliver cloud compute and database scaling, such transfers are governed under Standard Contractual Clauses (SCCs) and robust data processing agreements ensuring equivalent levels of privacy protection.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="grievance-contact">
            11. Policy Modifications & Grievance Officer
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              We may periodically update this Privacy Policy to reflect regulatory amendments or new platform capabilities. When changes occur, the &quot;Last Updated&quot; date will be refreshed, and institutional administrators will receive electronic notices.
            </p>
            <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-6 space-y-2">
              <h3 className="text-base font-bold text-foreground">Data Protection & Grievance Redressal Officer</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                For privacy audit requests, data removal inquiries, parental consent questions, or grievance escalations, contact our designated Data Protection Officer:
              </p>
              <div className="text-xs sm:text-sm text-foreground font-mono space-y-1 pt-1">
                <div><strong>VidyaSchool Data Protection & Privacy Cell (BlazeNeuro)</strong></div>
                <div>Attention: Grievance & Compliance Officer</div>
                <div>Email: <a href="mailto:privacy@vidyaschool.com" className="text-primary underline">privacy@vidyaschool.com</a></div>
                <div>Legal Escalations: <a href="mailto:legal@blazeneuro.com" className="text-primary underline">legal@blazeneuro.com</a></div>
                <div>Corporate Portal: <a href="https://blazeneuro.com" target="_blank" rel="noreferrer" className="text-primary underline">https://blazeneuro.com</a></div>
              </div>
            </div>
          </div>
        </section>
      </DocsBody>
    </DocsPage>
  )
}
