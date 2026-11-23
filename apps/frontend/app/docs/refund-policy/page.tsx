import { DocsPage, DocsBody } from "fumadocs-ui/page"

export default function RefundPolicyPage() {
  const toc = [
    { title: "1. Scope & Payment Overview", url: "#scope", depth: 2 },
    { title: "2. Technology Intermediary Status", url: "#intermediary-status", depth: 2 },
    { title: "3. Institutional Tuition & Fee Policy", url: "#tuition-policy", depth: 2 },
    { title: "4. Duplicate & Failed Transactions", url: "#duplicate-transactions", depth: 2 },
    { title: "5. Transport & Optional Facility Fees", url: "#transport-fees", depth: 2 },
    { title: "6. Admission Cancellation & Security Deposits", url: "#admission-cancellation", depth: 2 },
    { title: "7. Chargebacks & Payment Disputes", url: "#chargebacks-disputes", depth: 2 },
    { title: "8. Refund Processing Timelines & Modes", url: "#refund-processing", depth: 2 },
    { title: "9. Billing Grievances & Contact", url: "#contact", depth: 2 },
  ]

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3 pb-4 border-b border-border/40">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            Fee Refund & Cancellation Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong>Effective Date:</strong> August 18, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> August 18, 2026
          </p>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong>FINANCIAL COMPLIANCE DISCLOSURE:</strong> This policy governs all online tuition fee payments, transport dues, exam charges, library fines, and ancillary transactions executed through the VidyaSchool digital portal and payment gateway integrations (including Razorpay, UPI, Net Banking, and Debit/Credit Cards).
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="scope">
            1. Scope & Payment Overview
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            VidyaSchool provides an integrated digital fee collection platform enabling parents, legal guardians, and students to review verified fee structures, invoice breakdowns, and settle academic dues online. All transactions are securely routed through certified, PCI-DSS compliant payment aggregators (including Razorpay Software Private Limited).
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="intermediary-status">
            2. Technology Intermediary Status
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong>VidyaSchool and BlazeNeuro operate strictly as a technological intermediary and Software-as-a-Service (SaaS) provider.</strong>
            </p>
            <p>
              All fee structures, concessions, scholarship waivers, due dates, late payment penalties, and institutional refund criteria are established, governed, and authorized exclusively by the student&apos;s respective educational institution (&quot;<strong>School</strong>&quot;). VidyaSchool does not possess unilateral authority to disburse, alter, or cancel tuition fee refunds without written instruction from authorized school bursars.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="tuition-policy">
            3. Institutional Tuition & Academic Fee Policy
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Unless explicitly specified under the respective school&apos;s published admission guidelines:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Term & Tuition Fees:</strong> Tuition fees paid for an active or commenced academic quarter/semester are non-refundable once classroom instruction or academic portal access has been provisioned.</li>
              <li><strong>Examination & Lab Fees:</strong> Registration fees paid for board examinations, laboratory consumables, and external certification tests are strictly non-refundable once submitted to educational boards.</li>
              <li><strong>Late Payment Surcharges:</strong> Any late fees or administrative penalty charges assessed due to delayed settlements are non-refundable.</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="duplicate-transactions">
            4. Duplicate, Excess & Failed Transactions
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              In situations where technical anomalies or intermittent banking network dropouts occur:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Duplicate Debits:</strong> If a payer&apos;s bank account or card is debited multiple times for a single fee order, the excess debited amount will be automatically identified during nightly banking reconciliation. The redundant transaction will be refunded back to the originating bank account within <strong>5 to 7 business days</strong>.</li>
              <li><strong>Debited but Order Failed:</strong> If funds are deducted from the user&apos;s account but the portal displays a &quot;Payment Pending&quot; or &quot;Failed&quot; status due to gateway communication timeouts, the gateway provider will auto-reverse the uncaptured funds back to the user&apos;s source account within <strong>3 to 5 banking days</strong>.</li>
              <li><strong>Overpayment:</strong> If an excess amount is settled against an invoice, the surplus credit will be adjusted against subsequent academic terms or refunded upon parent request submitted to the school accountant.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="transport-fees">
            5. Transport, Meal & Optional Facility Fees
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Refunds for optional school facilities (such as bus transportation routes, cafeteria meals, hostel accommodations, or after-school robotics clubs) are subject to prorated institutional adjustments:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2 leading-relaxed">
            <li>Cancellation requests must be filed at least <strong>15 days prior</strong> to the commencement of the subsequent billing cycle.</li>
            <li>No mid-month prorated refunds are issued for unutilized bus seats or partial absenteeism.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="admission-cancellation">
            6. Admission Cancellation & Security Deposits
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              In the event of student withdrawal or admission cancellation:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Admission Registration Fees:</strong> One-time admission processing and prospectus charges are non-refundable.</li>
              <li><strong>Refundable Caution / Security Deposits:</strong> Refundable institutional deposits will be reimbursed via bank transfer (NEFT/RTGS/UPI) only after the student obtains complete clearance certificates from all departments (Library, Science Labs, Sports, Accounts, and Class Teacher) and surrenders all institutional assets.</li>
            </ul>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="chargebacks-disputes">
            7. Chargebacks & Payment Disputes
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Parents and guardians agree to first contact the school accounts office or portal support team to resolve billing queries before initiating formal chargeback requests with card issuers or banks. In the event of an unjustified chargeback initiated without prior notice, the student&apos;s portal access and report card issuance may be temporarily frozen pending dispute resolution.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="refund-processing">
            8. Refund Processing Timelines & Modes
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              All approved refunds are credited exclusively to the <strong>original source of payment</strong> (the original UPI ID, credit card, or bank account utilized during checkout). No cash refunds are disbursed under any circumstances.
            </p>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="font-semibold text-foreground text-xs uppercase tracking-wider mb-2">Standard Refund Processing Schedule:</div>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li><strong>UPI & Net Banking:</strong> 2 to 4 business days</li>
                <li><strong>Debit & Credit Cards:</strong> 5 to 7 business days (subject to card issuing bank cycles)</li>
                <li><strong>Institutional Clearance NEFT:</strong> 7 to 14 business days following bursar clearance</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 9 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight" id="contact">
            9. Billing Grievances & Fee Support Desk
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              For payment transaction receipts, duplicate debit verification, or fee statement inquiries, contact our dedicated billing desk:
            </p>
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 space-y-2 font-mono text-xs sm:text-sm text-foreground">
              <div><strong>VidyaSchool Billing & Accounts Helpdesk</strong></div>
              <div>Email: <a href="mailto:billing@vidyaschool.com" className="text-primary underline">billing@vidyaschool.com</a></div>
              <div>Institutional Inquiries: <a href="mailto:accounts@blazeneuro.com" className="text-primary underline">accounts@blazeneuro.com</a></div>
              <div>Support Desk: <a href="/docs/student/fees" className="text-primary underline">Student Fee Help Guide</a></div>
            </div>
          </div>
        </section>
      </DocsBody>
    </DocsPage>
  )
}
