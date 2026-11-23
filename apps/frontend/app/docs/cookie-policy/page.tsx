import { DocsPage, DocsBody } from "fumadocs-ui/page"

export default function CookiePolicyPage() {
  const toc = [
    { title: "1. What Are Cookies & Tokens", url: "#what-are-cookies", depth: 2 },
    { title: "2. Categories of Cookies We Use", url: "#categories", depth: 2 },
    { title: "3. Detailed Cookie Ledger", url: "#cookie-ledger", depth: 2 },
    { title: "4. Multi-Device Session Security", url: "#session-security", depth: 2 },
    { title: "5. Third-Party Subprocessor Storage", url: "#third-party-storage", depth: 2 },
    { title: "6. Managing & Revoking Cookies", url: "#cookie-management", depth: 2 },
    { title: "7. Contact Privacy Team", url: "#contact", depth: 2 },
  ]

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3 pb-4 border-b border-border/40">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            Cookie Policy & Tracking Technologies
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong>Effective Date:</strong> August 18, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> August 18, 2026
          </p>
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
            <strong>NO THIRD-PARTY ADVERTISING TRACKERS:</strong> VidyaSchool does not deploy third-party advertising cookies, cross-site trackers, or behavioral profiling pixels. We utilize strictly necessary session tokens, cryptographic security cookies, and local client preferences essential for educational portal functionality.
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="what-are-cookies">
            1. What Are Cookies & Local Storage Tokens
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cookies, session storage, and local storage tokens are small cryptographic text files placed on your browser or device when accessing the VidyaSchool portal. These technologies allow our servers to identify authenticated sessions, enforce Role-Based Access Control (RBAC), preserve user theme settings, and protect against Cross-Site Request Forgery (CSRF).
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="categories">
            2. Categories of Cookies We Use
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1">
              <strong className="text-foreground font-semibold">A. Strictly Necessary & Authentication Cookies:</strong>
              <p>Essential for logging into the portal, preserving cryptographic sessions, verifying multi-device logins, and preventing unauthorized elevation of student/teacher privileges.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1">
              <strong className="text-foreground font-semibold">B. Security & Firewall Cookies:</strong>
              <p>Used to enforce edge rate limiting, thwart brute-force password guessing, and block malicious automated bots.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1">
              <strong className="text-foreground font-semibold">C. Functional & User Preference Storage:</strong>
              <p>Stores theme preference (Light, Dark, Sepia Mode), sidebar collapse state, and note reader text size.</p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="cookie-ledger">
            3. Detailed Cookie Ledger
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full text-left text-xs sm:text-sm text-muted-foreground">
              <thead className="bg-muted/40 text-foreground font-semibold border-b border-border/60">
                <tr>
                  <th className="p-3">Cookie / Key Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-xs">
                <tr>
                  <td className="p-3 text-foreground font-bold">better-auth.session_token</td>
                  <td className="p-3">First-Party HTTPOnly</td>
                  <td className="p-3">7 Days</td>
                  <td className="p-3 font-sans">Primary cryptographic user authentication token.</td>
                </tr>
                <tr>
                  <td className="p-3 text-foreground font-bold">__Secure-better-auth.session_token</td>
                  <td className="p-3">Secure HTTPOnly</td>
                  <td className="p-3">7 Days</td>
                  <td className="p-3 font-sans">Enforces SSL/TLS transport security in production.</td>
                </tr>
                <tr>
                  <td className="p-3 text-foreground font-bold">theme</td>
                  <td className="p-3">Client Cookie</td>
                  <td className="p-3">1 Year</td>
                  <td className="p-3 font-sans">Stores user UI theme selection (Dark, Light, System).</td>
                </tr>
                <tr>
                  <td className="p-3 text-foreground font-bold">sidebar:state</td>
                  <td className="p-3">Local Storage</td>
                  <td className="p-3">Persistent</td>
                  <td className="p-3 font-sans">Maintains navigation sidebar expanded/collapsed state.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="session-security">
            4. Multi-Device Session Tracking & QR Tokens
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When you sign into VidyaSchool across multiple devices (mobile phones, tablets, classroom PCs), our system assigns an encrypted session identifier paired with your client IP and browser user-agent. You can inspect all active sessions and remotely disconnect unrecognized devices anytime via the <a href="/login-accounts" className="text-primary underline">Active Sessions Portal</a>.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="third-party-storage">
            5. Third-Party Subprocessor Storage
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            During checkout or error telemetry, third-party subprocessors may store necessary cryptographic tokens:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2 leading-relaxed">
            <li><strong>Razorpay:</strong> Utilizes temporary local tokens strictly to execute two-factor authentication and tokenized card verification for fee payments.</li>
            <li><strong>Sentry:</strong> Utilizes anonymous session identifiers strictly for crash diagnostics and performance debugging.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="cookie-management">
            6. Managing, Disabling & Revoking Cookies
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Most web browsers permit you to block or delete cookies through browser security settings. However, because our cookies are strictly necessary for authenticated identity verification:
            </p>
            <p className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
              Disabling or clearing essential session cookies will immediately terminate your active portal login and require re-authentication.
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="contact">
            7. Contact Privacy & Security Cell
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              For questions regarding our cookie implementation or session encryption standards:
            </p>
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 space-y-1.5 font-mono text-xs sm:text-sm text-foreground">
              <div><strong>VidyaSchool Privacy Architecture Team</strong></div>
              <div>Email: <a href="mailto:privacy@vidyaschool.com" className="text-primary underline">privacy@vidyaschool.com</a></div>
              <div>Security Center: <a href="/login-accounts" className="text-primary underline">Manage Active Sessions</a></div>
            </div>
          </div>
        </section>
      </DocsBody>
    </DocsPage>
  )
}
