import { DocsPage, DocsBody } from "fumadocs-ui/page"

export default function SecurityPolicyPage() {
  const toc = [
    { title: "1. Security Architecture & Commitments", url: "#architecture", depth: 2 },
    { title: "2. Cryptography & Data Protection", url: "#cryptography", depth: 2 },
    { title: "3. Identity, Sessions & Rate Limiting", url: "#identity-sessions", depth: 2 },
    { title: "4. Vulnerability Disclosure & Safe Harbor", url: "#vulnerability-disclosure", depth: 2 },
    { title: "5. Scope of Testing & Ground Rules", url: "#testing-rules", depth: 2 },
    { title: "6. Reporting Security Bugs & Escalation", url: "#reporting-bugs", depth: 2 },
  ]

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3 pb-4 border-b border-border/40">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            Security & Vulnerability Disclosure Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong>Effective Date:</strong> August 18, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> August 18, 2026
          </p>
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 text-xs sm:text-sm text-teal-900 dark:text-teal-200 leading-relaxed">
            <strong>SECURITY FIRST PHILOSOPHY:</strong> VidyaSchool and BlazeNeuro implement enterprise defense-in-depth security standards to protect student records, teacher registers, and payment transactions. We actively welcome responsible vulnerability reports from ethical cybersecurity researchers.
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="architecture">
            1. Security Architecture & Commitments
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our infrastructure is engineered using hardened serverless cloud runtimes, containerized microservices, encrypted database clusters (PostgreSQL on Neon Serverless), edge web application firewalls (WAF), and automated continuous integration vulnerability scans.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="cryptography">
            2. Cryptography & Data Protection
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Transport Layer Security:</strong> All web and mobile API communications are enforced strictly over HTTPS using modern TLS 1.3 with Perfect Forward Secrecy (PFS).</li>
              <li><strong>Storage Encryption:</strong> All persistent database tables, document blobs, and backup snapshots are encrypted at rest using AES-256 keys.</li>
              <li><strong>Credential Hashing:</strong> User passwords are encrypted using adaptive salt rounds with industry-standard bcrypt/Argon2 algorithms.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="identity-sessions">
            3. Identity, Sessions & Edge Rate Limiting
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Authentication is secured via signed HTTPOnly session cookies and multi-device session identifiers. Real-time rate limiters deployed on edge proxies defend against brute-force credential stuffing and distributed denial-of-service (DDoS) attempts.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="vulnerability-disclosure">
            4. Vulnerability Disclosure & Researcher Safe Harbor
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              We believe in coordinated, responsible vulnerability disclosure. If you discover a potential security flaw in our platform:
            </p>
            <p className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs">
              <strong>Safe Harbor Guarantee:</strong> VidyaSchool will not initiate legal action against ethical security researchers who discover and report vulnerabilities in good faith in strict compliance with this policy.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="testing-rules">
            5. Scope of Testing & Responsible Ground Rules
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>When conducting security assessments, you must strictly avoid:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Accessing, modifying, exfiltrating, or destroying student or educator personal data.</li>
              <li>Executing Denial of Service (DoS/DDoS) attacks that degrade portal performance for active students.</li>
              <li>Conducting social engineering, spear-phishing, or physical attacks against school staff or facilities.</li>
              <li>Publicly disclosing vulnerabilities before giving our security team a minimum of <strong>30 days</strong> to remediate the issue.</li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="reporting-bugs">
            6. Reporting Security Bugs & PGP Contact
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Please submit detailed vulnerability reports (including proof-of-concept steps, affected endpoints, and severity ratings) to our Security Response Team:</p>
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 space-y-1.5 font-mono text-xs sm:text-sm text-foreground">
              <div><strong>VidyaSchool Security Incident Response Team (SIRT)</strong></div>
              <div>Direct Security Email: <a href="mailto:security@vidyaschool.com" className="text-primary underline">security@vidyaschool.com</a></div>
              <div>Corporate Security: <a href="mailto:security@blazeneuro.com" className="text-primary underline">security@blazeneuro.com</a></div>
              <div>Response SLA: Initial acknowledgement within 24 hours</div>
            </div>
          </div>
        </section>
      </DocsBody>
    </DocsPage>
  )
}
