import { DocsPage, DocsBody } from "fumadocs-ui/page"

export default function AIDisclaimerPage() {
  const toc = [
    { title: "1. Scope of AI Tools", url: "#scope", depth: 2 },
    { title: "2. Supplemental Nature & Factual Disclaimer", url: "#supplemental-nature", depth: 2 },
    { title: "3. No Warranty for Official Assessments", url: "#no-warranty", depth: 2 },
    { title: "4. Student Responsibility & Academic Verification", url: "#student-responsibility", depth: 2 },
    { title: "5. AI Intellectual Property & Output Licensing", url: "#ip-licensing", depth: 2 },
    { title: "6. Privacy & Safety in AI Workflows", url: "#ai-privacy", depth: 2 },
    { title: "7. Contact AI Governance Team", url: "#contact", depth: 2 },
  ]

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3 pb-4 border-b border-border/40">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            AI Transparency & Academic Disclaimer
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong>Effective Date:</strong> August 18, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> August 18, 2026
          </p>
          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs sm:text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
            <strong>AI TRANSPARENCY NOTICE:</strong> VidyaSchool integrates artificial intelligence (including AI Page Builder, automated study note summaries, LaTeX formula solvers, and smart quiz generators) strictly as supplemental learning aids. AI outputs may occasionally produce inaccuracies or curriculum misalignments.
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="scope">
            1. Scope of AI-Powered Features
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            VidyaSchool deploys state-of-the-art machine learning models across several portal features:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2 leading-relaxed">
            <li><strong>AI Page Builder:</strong> Generating dynamic educational page templates, responsive layout schemas, and component widgets.</li>
            <li><strong>AI Lecture Summarizer:</strong> Synthesizing lengthy teacher lecture notes into concise study bullet points.</li>
            <li><strong>Smart Formula Assistant:</strong> Formatting KaTeX/LaTeX mathematical and scientific notations.</li>
            <li><strong>Practice Quiz Generator:</strong> Creating formative practice questions from class syllabus material.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="supplemental-nature">
            2. Supplemental Nature & Factual Inaccuracy Disclaimer
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Generative artificial intelligence operates probabilistically and is inherently subject to &quot;hallucinations&quot;, outdated knowledge cutoffs, or contextual errors.
            </p>
            <p className="font-semibold text-foreground uppercase text-xs">
              VIDYASCHOOL MAKES NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING THE FACTUAL COMPLETENESS, ACCURACY, SCIENTIFIC RIGOR, OR CURRICULAR FIDELITY OF ANY AI-GENERATED CONTENT.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="no-warranty">
            3. No Warranty for Official Assessments & Board Exams
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI-generated questions and practice summaries do not constitute official examination papers, national board syllabus standards, or certified grading criteria. Relying solely on AI outputs without consulting verified textbooks and certified teacher instructions is strictly at the student&apos;s own risk. VidyaSchool is not liable for academic penalties, incorrect exam answers, or lowered GPA scores resulting from unverified AI reliance.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="student-responsibility">
            4. Student Responsibility & Academic Verification
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Students and educators utilizing AI assistance agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Cross-reference mathematical derivations and historical facts with authoritative textbooks.</li>
              <li>Refrain from submitting verbatim AI outputs as original homework or thesis work where prohibited by institutional academic honor codes.</li>
              <li>Review all generated page layouts and question banks before publishing to classroom feeds.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="ip-licensing">
            5. Intellectual Property & AI Output Licensing
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Outputs generated through our AI tools are provided to users under a non-exclusive license for personal educational and school-internal use. VidyaSchool does not claim proprietary copyright over student-customized AI study outputs, provided such outputs do not infringe upon third-party copyrights or school materials.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="ai-privacy">
            6. Privacy, Student Safety & AI Data Isolation
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Student personal identifiers (such as student full names, contact numbers, residential coordinates, or report card marks) are <strong>never used to train public foundation models</strong>. AI prompts are processed through enterprise cloud APIs with zero-data-retention guarantees.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="contact">
            7. Contact AI Ethics & Governance Desk
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>For feedback regarding AI accuracy, bias mitigation, or algorithm inquiries:</p>
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 space-y-1.5 font-mono text-xs sm:text-sm text-foreground">
              <div><strong>VidyaSchool AI Ethics & Educational Technology Cell</strong></div>
              <div>Email: <a href="mailto:ai-governance@blazeneuro.com" className="text-primary underline">ai-governance@blazeneuro.com</a></div>
              <div>Platform Inquiries: <a href="mailto:support@vidyaschool.com" className="text-primary underline">support@vidyaschool.com</a></div>
            </div>
          </div>
        </section>
      </DocsBody>
    </DocsPage>
  )
}
