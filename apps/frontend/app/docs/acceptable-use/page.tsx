import { DocsPage, DocsBody } from "fumadocs-ui/page"

export default function AcceptableUsePolicyPage() {
  const toc = [
    { title: "1. Purpose & Community Standards", url: "#purpose", depth: 2 },
    { title: "2. Student Conduct & Academic Honesty", url: "#student-conduct", depth: 2 },
    { title: "3. Anti-Bullying, Harassment & Safety", url: "#anti-bullying", depth: 2 },
    { title: "4. System Integrity & Security Prohibitions", url: "#system-integrity", depth: 2 },
    { title: "5. Educator & Staff Professional Standards", url: "#educator-standards", depth: 2 },
    { title: "6. Monitoring, Enforcement & Sanctions", url: "#enforcement", depth: 2 },
    { title: "7. Reporting Violations & Safety Hotlines", url: "#reporting", depth: 2 },
  ]

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3 pb-4 border-b border-border/40">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            Acceptable Use Policy (AUP)
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong>Effective Date:</strong> August 18, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> August 18, 2026
          </p>
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-900 dark:text-rose-200 leading-relaxed">
            <strong>ZERO TOLERANCE SAFE ENVIRONMENT:</strong> VidyaSchool enforces a strict zero-tolerance policy against cyberbullying, harassment, academic fraud, hate speech, and system security attacks. Violations will result in immediate suspension, institutional disciplinary action, and legal escalation.
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="purpose">
            1. Purpose & Community Standards
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This Acceptable Use Policy defines the standards of conduct expected from all students, educators, parents, and administrative staff interacting across the VidyaSchool digital ecosystem, community boards, chat modules, and virtual classrooms. Our mission is to maintain a safe, respectful, and productive academic environment.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="student-conduct">
            2. Student Conduct & Academic Honesty
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>Students must uphold institutional academic integrity standards. Prohibited academic conduct includes:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Academic Cheating:</strong> Sharing exam answers, copying peer assignments, or submitting unauthorized materials during virtual examinations.</li>
              <li><strong>Grade Tampering:</strong> Attempting to intercept API payloads, modify client cookies, or manipulate marks registers.</li>
              <li><strong>Impersonation:</strong> Using another student&apos;s admission credentials or active QR login tokens.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="anti-bullying">
            3. Anti-Bullying, Harassment & Digital Safety
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>You agree never to upload, post, or transmit content that:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Bullies, demeans, harasses, stalks, or intimidates any student, teacher, or staff member.</li>
              <li>Promotes racism, religious bigotry, sexism, or discrimination against any protected class.</li>
              <li>Contains sexually explicit, obscene, pornographic, or violent imagery or language.</li>
              <li>Incites self-harm, suicide, violence, or dangerous behavior.</li>
              <li>Doxxes, discloses private residential addresses, or publishes unauthorized personal phone numbers.</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="system-integrity">
            4. System Integrity & Security Prohibitions
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>Users must not engage in technical activities that compromise platform stability:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Launching automated scraping bots, spiders, or load stress test scripts against portal endpoints.</li>
              <li>Injecting malware, viruses, trojans, or malicious payloads into note attachments or image uploads.</li>
              <li>Bypassing middleware role barriers or escalating privileges to access unauthorized administrative tools.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="educator-standards">
            5. Educator & Staff Professional Standards
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Teachers, librarians, and administrative staff must maintain strict professional pedagogical standards. Communications with students must remain academic, respectful, and conducted exclusively through official portal channels. Educators must never solicit personal favors, distribute biased grades, or publish unvetted external media.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="enforcement">
            6. Monitoring, Enforcement & Disciplinary Sanctions
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>VidyaSchool and school administrators reserve the right to audit portal communications and enforce disciplinary measures:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Level 1 (Formal Warning):</strong> Deletion of offensive content and written warning.</li>
              <li><strong>Level 2 (Feature Restriction):</strong> Temporary suspension of community chat, forum commenting, or file upload privileges.</li>
              <li><strong>Level 3 (Account Termination & Expulsion):</strong> Permanent account revocation, formal institutional disciplinary review, and potential referral to law enforcement agencies for criminal cyber offenses.</li>
            </ul>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="reporting">
            7. Reporting Violations & Safety Hotline
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>If you experience or witness harassment, safety threats, or misconduct on the Platform, report it immediately:</p>
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 space-y-1.5 font-mono text-xs sm:text-sm text-foreground">
              <div><strong>VidyaSchool Student Safety & Integrity Cell</strong></div>
              <div>Report Abuse: <a href="mailto:safety@vidyaschool.com" className="text-primary underline">safety@vidyaschool.com</a></div>
              <div>Institutional Helpdesk: <a href="/docs/student/complaints" className="text-primary underline">File a Confidential Complaint</a></div>
            </div>
          </div>
        </section>
      </DocsBody>
    </DocsPage>
  )
}
