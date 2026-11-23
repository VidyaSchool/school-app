import { DocsPage, DocsBody } from "fumadocs-ui/page"

export default function TermsOfServicePage() {
  const toc = [
    { title: "1. Binding Agreement & Acceptance", url: "#acceptance", depth: 2 },
    { title: "2. Eligibility & Minor Consent", url: "#eligibility", depth: 2 },
    { title: "3. Accounts, Authentication & Security", url: "#accounts-security", depth: 2 },
    { title: "4. Role-Specific Obligations & Academic Integrity", url: "#role-obligations", depth: 2 },
    { title: "5. Fees, Gateway Transactions & Refunds", url: "#payments-refunds", depth: 2 },
    { title: "6. Acceptable Use & Prohibited Conduct", url: "#acceptable-use", depth: 2 },
    { title: "7. Intellectual Property & User Content", url: "#intellectual-property", depth: 2 },
    { title: "8. AI Tools & Supplemental Content Disclaimer", url: "#ai-tools-disclaimer", depth: 2 },
    { title: "9. Electronic Communications & Push Alerts", url: "#electronic-communications", depth: 2 },
    { title: "10. Third-Party Integrations & Infrastructure", url: "#third-party-services", depth: 2 },
    { title: "11. Suspension & Account Termination", url: "#termination", depth: 2 },
    { title: "12. Disclaimer of Warranties", url: "#disclaimer-warranties", depth: 2 },
    { title: "13. Limitation of Liability", url: "#limitation-liability", depth: 2 },
    { title: "14. Indemnification", url: "#indemnification", depth: 2 },
    { title: "15. Governing Law & Dispute Resolution", url: "#governing-law", depth: 2 },
    { title: "16. General Provisions & Legal Contact", url: "#general-provisions", depth: 2 },
  ]

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3 pb-4 border-b border-border/40">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong>Effective Date:</strong> August 18, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> August 18, 2026
          </p>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>IMPORTANT LEGAL NOTICE:</strong> PLEASE CAREFULLY READ THESE TERMS OF SERVICE BEFORE REGISTERING, ACCESSING, OR USING THE VIDYASCHOOL PLATFORM, SOFTWARE, MOBILE APPLICATIONS, OR ASSOCIATED SERVICES. BY ACCESSING OR USING ANY PORTION OF VIDYASCHOOL, YOU EXPRESSLY AGREE TO BE BOUND BY ALL TERMS AND CONDITIONS CONTAINED HEREIN. IF YOU DO NOT AGREE TO ALL CLAUSES OF THIS AGREEMENT, DO NOT ACCESS OR USE THE APPLICATION.
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="acceptance">
            1. Binding Agreement & Acceptance of Terms
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These Terms of Service (&quot;<strong>Terms</strong>&quot;, &quot;<strong>Agreement</strong>&quot;) constitute a legally binding contract between you (whether individually as a student, parent, guardian, educator, staff member, administrator, or entity representative; collectively &quot;<strong>User</strong>&quot;, &quot;<strong>You</strong>&quot;, or &quot;<strong>Your</strong>&quot;) and <strong>VidyaSchool</strong> (&quot;<strong>Company</strong>&quot;, &quot;<strong>We</strong>&quot;, &quot;<strong>Us</strong>&quot;, or &quot;<strong>Our</strong>&quot;), governing Your access to and utilization of the VidyaSchool web application (<a href="https://vidyaschool.vercel.app" target="_blank" rel="noreferrer" className="text-primary underline">vidyaschool.vercel.app</a>), native mobile applications (Android/iOS), backend APIs, developer SDKs, student information systems, fee collection interfaces, and any associated digital services (collectively, the &quot;<strong>Platform</strong>&quot; or &quot;<strong>Services</strong>&quot;).
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By registering an account, verifying onboarding forms, authenticating via session tokens, making tuition payments, uploading materials, or simply browsing the Services, You explicitly represent that You have read, understood, and consented to these Terms as well as our <a href="/docs/privacy-policy" className="text-primary underline">Privacy Policy</a>.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="eligibility">
            2. Eligibility & Minor Consent
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Platform is designed for educational institutions, enrolled students, guardians, educators, and school administrators. If You are under the legal age of majority in Your jurisdiction (typically under 18 years of age):
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2 leading-relaxed">
            <li>You may only use the Platform with the express permission, supervision, and consent of Your parent, legal guardian, or authorized educational institution.</li>
            <li>Your parent or legal guardian represents and warrants that they have reviewed and agreed to these Terms on Your behalf and assume full legal and financial responsibility for Your actions, fee obligations, and compliance on the Platform.</li>
            <li>Institutions registering student accounts warrant that they have obtained all requisite parental/guardian consents under applicable education and data protection laws (including FERPA, COPPA, and DPDP equivalents).</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="accounts-security">
            3. User Accounts, Authentication & Device Security
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong>3.1 Profile Truthfulness:</strong> You agree to provide true, accurate, current, and complete information during signup, identity onboarding, and admission verification (including official admission numbers, class-section allocations, contact phone numbers, and emergency contacts). Falsifying school affiliation or impersonating other students/staff is strictly grounds for immediate permanent termination and referral to institutional authorities.
            </p>
            <p>
              <strong>3.2 Multi-Device Sessions & QR Access:</strong> The Platform supports encrypted multi-session tracking and QR device synchronization. You are solely responsible for maintaining the confidentiality of your credentials, password, and active authentication tokens. You agree to immediately revoke compromised sessions via the <a href="/login-accounts" className="text-primary underline">Active Sessions Dashboard</a> or notify system administrators upon discovering unauthorized access.
            </p>
            <p>
              <strong>3.3 Account Non-Transferability:</strong> Accounts, login credentials, teacher licenses, and administrative badges are strictly personal and non-transferable. You may not sell, lease, share, or syndicate account access to any third party.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="role-obligations">
            4. Role-Specific Obligations & Academic Integrity
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong>4.1 Students:</strong> Students must abide by institutional codes of conduct and academic honesty. Plagiarism, unauthorized tampering with gradebooks, exploiting client-side data, attempting to alter exam results, distributing unauthorized examination papers, or harassing peers in classroom forums is strictly prohibited and subject to severe disciplinary sanction.
            </p>
            <p>
              <strong>4.2 Teachers & Educators:</strong> Teachers represent and warrant that attendance entries, exam marks, report cards, class notes, and syllabus updates entered onto the Platform are accurate, authentic, and free of bias or falsification. All teacher registrations undergo mandatory administrative vetting; unapproved accounts remain restricted in the Waiting Room until certified by a school administrator.
            </p>
            <p>
              <strong>4.3 Librarians:</strong> Librarians are responsible for maintaining accurate digital inventories, check-out timestamps, book return fines, and digital catalog archives. Librarians shall not manipulate asset logs or misrepresent damaged property.
            </p>
            <p>
              <strong>4.4 Accountants & Administrators:</strong> Authorized school accountants and administrators possess elevated privileges to define fee schedules, disburse discount waivers, review student payment histories, and publish notices. Administrators agree to exercise due diligence and comply with statutory financial auditing regulations.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="payments-refunds">
            5. Fees, Gateway Transactions & Refund Policy
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong>5.1 Payment Processing Intermediary:</strong> Tuition fees, transport dues, exam fees, and library fines processed through the Platform are facilitated by licensed third-party payment gateways (including Razorpay, UPI protocols, and banking network partners). VidyaSchool operates solely as a technological intermediary and does not directly retain custody of banking funds.
            </p>
            <p>
              <strong>5.2 Settlement Proof & Digital Receipts:</strong> Official digital payment receipts and transaction reference IDs generated by the accountant portal serve as legal proof of transaction completion. You are required to retain copies of all receipts for institutional verification.
            </p>
            <p>
              <strong>5.3 Gateway Failures & Network Outages:</strong> VidyaSchool is not liable for delayed credits, double-debits, or transactional aborts caused by upstream banking outages, card issuer declines, or payment gateway maintenance. In case of duplicate debits, refund timelines are subject to standard banking reconciliation cycles (typically 5 to 7 business days).
            </p>
            <p>
              <strong>5.4 Institutional Refund & Cancellation Policy:</strong> ALL TUITION FEE DISPUTES, FEE WAIVERS, ADMISSION WITHDRAWAL REFUNDS, AND PRORATED CHARGES ARE GOVERNED STRICTLY BY THE ADMISSION AND REFUND BYLAWS OF THE RESPECTIVE EDUCATIONAL INSTITUTION. VidyaSchool possesses no unilateral authority to disburse, override, or refund school tuition fees without express written authorization and processing from the school bursar or administration.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="acceptable-use">
            6. Acceptable Use & Prohibited Conduct
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You agree not to engage in any of the following prohibited activities on the Platform:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground pl-2 leading-relaxed">
            <li><strong>Security Violations:</strong> Probing, scanning, or testing vulnerabilities of our infrastructure; bypassing authentication firewalls, rate limits, or role-based access restrictions; deploying SQL injection, cross-site scripting, denial-of-service (DoS) attacks, or reverse engineering client bundles.</li>
            <li><strong>Automated Scraping:</strong> Using automated bots, crawlers, spiders, or scrapers to extract student profiles, marks registers, fee structures, or teacher study notes without express written authorization.</li>
            <li><strong>Harmful & Obscene Content:</strong> Uploading, posting, messaging, or transmitting content that is defamatory, obscene, pornographic, racially or ethnically offensive, bullying, harassing, threatening, or inciting violence or self-harm.</li>
            <li><strong>Academic Fraud:</strong> Distributing answer keys, hacking live test instances, impersonating examiner credentials, or submitting AI-generated assignments where explicitly prohibited by course policy.</li>
            <li><strong>Malicious File Uploads:</strong> Uploading files, images, PDFs, or software containing trojans, worms, spyware, ransomware, or corrupted binaries.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="intellectual-property">
            7. Intellectual Property & User Content
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong>7.1 Platform IP:</strong> The VidyaSchool name, logos, visual designs, UI components, liquid metal shaders, icons, proprietary codebases, documentation, algorithms, and databases are the exclusive intellectual property of VidyaSchool and BlazeNeuro. No rights, titles, or interests are transferred to You except the limited, revocable, non-exclusive license to use the Services in accordance with these Terms.
            </p>
            <p>
              <strong>7.2 User-Generated Content License:</strong> By uploading study notes, lecture drawings, documents, announcements, profile pictures, or comments, You grant VidyaSchool a worldwide, royalty-free, non-exclusive license to host, store, cache, format, display, and transmit such content solely for the purpose of operating, delivering, and improving the Platform for Your school community.
            </p>
            <p>
              <strong>7.3 DMCA & Copyright Infringement:</strong> We respect intellectual property rights and will terminate the accounts of repeat infringers in accordance with applicable copyright laws upon receiving verified takedown notices.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="ai-tools-disclaimer">
            8. AI-Assisted Educational Tools & Supplemental Content Disclaimer
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              The Platform provides AI-assisted features including the AI Page Builder, automated study note summarizers, latex formula assistants, quiz generators, and smart search integrations.
            </p>
            <p>
              <strong>NO ACADEMIC OR FACTUAL WARRANTY:</strong> AI-GENERATED SUGGESTIONS, SUMMARIES, AND QUIZZES ARE PROVIDED STRICTLY AS SUPPLEMENTAL STUDY AIDS ON AN &quot;AS-IS&quot; BASIS. VIDYASCHOOL MAKES NO WARRANTIES REGARDING THE ACCURACY, CURRICULUM ALIGNMENT, FACTUAL CORRECTNESS, OR PEDAGOGICAL SUITABILITY OF AI OUTPUTS. STUDENTS AND INSTRUCTORS ARE SOLELY RESPONSIBLE FOR INDEPENDENTLY VERIFYING FORMULAS, STUDY NOTES, AND ACADEMIC DATA BEFORE RELYING UPON THEM FOR ASSESSMENTS OR OFFICIAL SUBMISSIONS.
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="electronic-communications">
            9. Electronic Communications & Push Alerts
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By creating an account, You explicitly consent to receive transactional and operational communications via WebPush, Firebase Cloud Messaging (FCM), SMS notifications, and emails (via Resend/SMTP). These include fee payment due notices, attendance absentees, teacher request approvals, emergency school circulars, and security alerts. You acknowledge that carrier delivery delays, device sleep modes, or network dropouts may occasionally affect instant message delivery, and VidyaSchool is not liable for missed deadlines resulting from device notification failures.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="third-party-services">
            10. Third-Party Integrations & Infrastructure
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Platform interacts with third-party vendors and cloud infrastructure (including Razorpay, Neon Database, Cloudinary / AWS S3, Firebase, Vercel, MathJax CDN, and Sentry Telemetry). VidyaSchool does not control third-party infrastructure and is not responsible for damages, data corruption, or service unavailability resulting directly from third-party vendor downtime, security incidents, or policy changes.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="termination">
            11. Suspension, Account Termination & Enforcement
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong>11.1 Discretionary Termination:</strong> VidyaSchool and authorized institutional administrators reserve the right, at their sole discretion, to suspend, disable, or terminate Your account or revoke Platform access at any time, with or without prior notice, upon: (a) breach of these Terms; (b) institutional disciplinary orders; (c) fraudulent or unlawful activity; (d) extended account dormancy; or (e) technical or security necessity.
            </p>
            <p>
              <strong>11.2 Effect of Termination:</strong> Upon termination, Your right to access the Platform terminates immediately. Historical academic records, exam logs, and payment receipts may be retained in archival storage to comply with statutory educational auditing regulations.
            </p>
          </div>
        </section>

        {/* Section 12 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="disclaimer-warranties">
            12. Disclaimer of Warranties
          </h2>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
            <p className="font-semibold uppercase text-foreground">
              &quot;AS-IS&quot; AND &quot;AS-AVAILABLE&quot; WARRANTY DISCLAIMER:
            </p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, THE VIDYASCHOOL PLATFORM, MOBILE APPS, BACKEND APIS, AND SERVICES ARE PROVIDED ON AN <strong>&quot;AS-IS&quot;</strong> AND <strong>&quot;AS-AVAILABLE&quot;</strong> BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
            </p>
            <p>
              VIDYASCHOOL AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, AND LICENSORS EXPRESSLY DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO: (A) MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT; (B) UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE PORTAL OPERATION; (C) ABSOLUTE ACCURACY, RELIABILITY, OR COMPLETENESS OF EXAM MARKS, ATTENDANCE LOGS, NOTES, OR FINANCIAL RECORDS; AND (D) FREEDOM FROM VIRUSES, EXPLOITS, OR OTHER HARMFUL CODE.
            </p>
          </div>
        </section>

        {/* Section 13 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="limitation-liability">
            13. Limitation of Liability
          </h2>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
            <p className="font-semibold uppercase text-foreground">
              COMPREHENSIVE LIMITATION OF LIABILITY:
            </p>
            <p>
              IN NO EVENT SHALL VIDYASCHOOL, BLAZENEURO, OR THEIR DIRECTORS, OFFICERS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, LOSS OF DATA, LOSS OF PROFITS, GOODWILL, INTERRUPTION OF SERVICE, ACADEMIC ADMISSION DELAYS, EXAM SUBMISSION FAILURES, COMPUTER BREAKDOWN, BANKING RECONCILIATION DELAYS, OR PROCUREMENT OF SUBSTITUTE SERVICES) ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO, USE OF, OR INABILITY TO USE THE PLATFORM.
            </p>
            <p>
              TO THE FULLEST EXTENT PERMISSIBLE BY APPLICABLE LAW, IN NO EVENT SHALL THE TOTAL AGGREGATE LIABILITY OF VIDYASCHOOL ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY YOU DIRECTLY TO VIDYASCHOOL FOR PLATFORM SOFTWARE LICENSING IN THE THREE (3) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED UNITED STATES DOLLARS ($100.00 USD), WHICHEVER IS LESS.
            </p>
          </div>
        </section>

        {/* Section 14 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="indemnification">
            14. Indemnification & Legal Defense
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You agree to defend, indemnify, and hold harmless VidyaSchool, BlazeNeuro, and their respective officers, directors, employees, contractors, agents, and licensors from and against any and all legal claims, liabilities, damages, judgments, awards, losses, costs, expenses, or legal fees (including reasonable attorneys&apos; fees) arising out of or relating to: (a) Your violation of these Terms; (b) Your misuse of the Platform; (c) Your User-Generated Content or study notes; (d) Your infringement of any third-party intellectual property or privacy rights; (e) intentional misconduct, academic fraud, or unlawful acts; or (f) any unauthorized access under Your login credentials.
          </p>
        </section>

        {/* Section 15 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="governing-law">
            15. Governing Law & Dispute Resolution
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong>15.1 Governing Law:</strong> These Terms and any dispute or claim arising out of them shall be governed by and construed in accordance with the substantive laws of India, without giving effect to any conflict of law principles.
            </p>
            <p>
              <strong>15.2 Mandatory Informal Negotiation:</strong> Prior to initiating formal arbitration or litigation, You and VidyaSchool agree to engage in good-faith informal negotiations for a minimum of thirty (30) days by submitting written notice of dispute to <a href="mailto:legal@blazeneuro.com" className="text-primary underline">legal@blazeneuro.com</a>.
            </p>
            <p>
              <strong>15.3 Binding Arbitration & Jurisdiction:</strong> Any unresolved dispute shall be resolved through binding individual arbitration under the Arbitration and Conciliation Act, 1996, conducted in English. The courts located in Bengaluru, Karnataka, India shall possess exclusive territorial jurisdiction for any permitted injunctive relief or enforcement of arbitral awards.
            </p>
            <p>
              <strong>15.4 Class Action Waiver:</strong> YOU AND VIDYASCHOOL AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
            </p>
          </div>
        </section>

        {/* Section 16 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="general-provisions">
            16. General Provisions, Amendments & Legal Contact
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong>16.1 Modifications to Terms:</strong> We reserve the right to modify, amend, or replace these Terms at any time. When material revisions occur, we will update the &quot;Last Updated&quot; date and issue a prominent notice via the Platform or email. Continued use of the Services following notification constitutes acceptance of the amended Terms.
            </p>
            <p>
              <strong>16.2 Severability & Non-Waiver:</strong> If any provision of these Terms is deemed unlawful, void, or unenforceable by a court of competent jurisdiction, that specific provision shall be severed without affecting the validity and enforceability of the remaining provisions. Our failure to enforce any right or provision shall not constitute a waiver of such right.
            </p>
            <p>
              <strong>16.3 Entire Agreement:</strong> These Terms, together with our <a href="/docs/privacy-policy" className="text-primary underline">Privacy Policy</a> and institutional service level agreements, constitute the sole and entire agreement between You and VidyaSchool regarding the Platform.
            </p>
            <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-6 space-y-2">
              <h3 className="text-base font-bold text-foreground">Official Legal & Grievance Contact</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                For legal inquiries, formal notices, compliance queries, or fee arbitration requests, contact our legal counsel at:
              </p>
              <div className="text-xs sm:text-sm text-foreground font-mono space-y-1 pt-1">
                <div><strong>VidyaSchool Legal & Compliance Cell (BlazeNeuro)</strong></div>
                <div>Email: <a href="mailto:legal@blazeneuro.com" className="text-primary underline">legal@blazeneuro.com</a></div>
                <div>Support: <a href="mailto:support@vidyaschool.com" className="text-primary underline">support@vidyaschool.com</a></div>
                <div>Website: <a href="https://blazeneuro.com" target="_blank" rel="noreferrer" className="text-primary underline">https://blazeneuro.com</a></div>
              </div>
            </div>
          </div>
        </section>
      </DocsBody>
    </DocsPage>
  )
}
