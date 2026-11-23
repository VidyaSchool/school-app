import { DocsPage, DocsBody } from "fumadocs-ui/page"

export default function DMCAPolicyPage() {
  const toc = [
    { title: "1. DMCA Safe Harbor Notice", url: "#safe-harbor", depth: 2 },
    { title: "2. Filing a Copyright Infringement Notice", url: "#filing-notice", depth: 2 },
    { title: "3. Takedown Procedure & Timeline", url: "#takedown-procedure", depth: 2 },
    { title: "4. Filing a DMCA Counter-Notification", url: "#counter-notification", depth: 2 },
    { title: "5. Repeat Infringer Policy", url: "#repeat-infringers", depth: 2 },
    { title: "6. Designated Copyright Agent", url: "#copyright-agent", depth: 2 },
  ]

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3 pb-4 border-b border-border/40">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            DMCA & Copyright Infringement Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong>Effective Date:</strong> August 18, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> August 18, 2026
          </p>
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-xs sm:text-sm text-sky-900 dark:text-sky-200 leading-relaxed">
            <strong>COPYRIGHT PROTECTION COMMITMENT:</strong> VidyaSchool respects the intellectual property rights of publishers, authors, educators, and institutions. In accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512) and the Indian Copyright Act, 1957, we expeditiously respond to valid takedown notices.
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="safe-harbor">
            1. DMCA Safe Harbor Notice & Intermediary Role
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            VidyaSchool operates as a digital service provider and hosting platform. We provide tools for educators and students to publish class lecture notes, study diagrams, and course documents. We do not preview, verify, or pre-screen user-uploaded materials and are protected under the statutory safe harbor provisions of applicable copyright legislation.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="filing-notice">
            2. Filing a Copyright Infringement Notice (Takedown Request)
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>If you believe that your copyrighted work has been copied, uploaded, or distributed on the Platform without authorization, your written notice must contain:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-2">
              <li>A physical or electronic signature of the copyright owner or authorized representative.</li>
              <li>Identification of the copyrighted work claimed to have been infringed (e.g., book title, ISBN, or copyright registration number).</li>
              <li>Identification of the allegedly infringing material on VidyaSchool, including the exact URL or note ID.</li>
              <li>Your contact information (legal name, physical address, telephone number, and email).</li>
              <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement, made under penalty of perjury, that the information in your notice is accurate and that you are authorized to act on behalf of the owner.</li>
            </ol>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="takedown-procedure">
            3. Takedown Procedure & Expedited Removal
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Upon receipt of a valid, legally sufficient notice, our Copyright Enforcement Team will expeditiously remove or disable access to the infringing material (typically within <strong>24 to 48 hours</strong>) and promptly notify the uploading user of the removal.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="counter-notification">
            4. Filing a DMCA Counter-Notification
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>If you believe that your uploaded note or document was removed in error or as a result of misidentification (e.g., fair use, public domain, or valid educational license), you may submit a Counter-Notification containing:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Your physical or electronic signature.</li>
              <li>Identification of the material that was removed and its previous URL/ID.</li>
              <li>A statement under penalty of perjury that you have a good-faith belief the material was removed by mistake or misidentification.</li>
              <li>Your consent to the jurisdiction of the federal or territorial courts in your district.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="repeat-infringers">
            5. Repeat Infringer Policy
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In accordance with the DMCA, VidyaSchool maintains a strict policy of terminating portal access and account privileges for users determined to be repeat copyright infringers.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="copyright-agent">
            6. Designated Copyright Agent & Legal Contact
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>All copyright infringement claims and formal takedown notices must be served to our Designated Copyright Agent:</p>
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 space-y-1.5 font-mono text-xs sm:text-sm text-foreground">
              <div><strong>VidyaSchool Copyright & Legal Affairs (BlazeNeuro)</strong></div>
              <div>Attention: Designated DMCA Agent</div>
              <div>Email: <a href="mailto:dmca@blazeneuro.com" className="text-primary underline">dmca@blazeneuro.com</a></div>
              <div>Secondary Copy: <a href="mailto:legal@vidyaschool.com" className="text-primary underline">legal@vidyaschool.com</a></div>
              <div>Address: BlazeNeuro Legal Cell, Bengaluru, Karnataka, India</div>
            </div>
          </div>
        </section>
      </DocsBody>
    </DocsPage>
  )
}
