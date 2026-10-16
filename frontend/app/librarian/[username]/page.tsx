import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { libraryBook, libraryBookIssue, user as userTable } from "@/lib/schema"
import { count, sum, eq, desc } from "drizzle-orm"
import { 
  BookOpen, 
  GitPullRequest, 
  Users, 
  AlertTriangle, 
  BookMarked,
  Clock,
  TrendingUp,
  Inbox
} from "lucide-react"

export default async function LibrarianDashboardPage() {
  const user = await requireRole(['librarian', 'admin'])

  // Fetch real statistics from database
  const [totalBooksRes, activeIssuesRes, overdueIssuesRes, totalMembersRes] = await Promise.all([
    db.select({ value: sum(libraryBook.quantity) }).from(libraryBook),
    db.select({ value: count() }).from(libraryBookIssue).where(eq(libraryBookIssue.status, "active")),
    db.select({ value: count() }).from(libraryBookIssue).where(eq(libraryBookIssue.status, "overdue")),
    db.select({ value: count() }).from(userTable)
  ])

  const totalCatalog = parseInt(totalBooksRes[0]?.value || "0")
  const activeIssues = activeIssuesRes[0]?.value || 0
  const overdueIssues = overdueIssuesRes[0]?.value || 0
  const totalMembers = totalMembersRes[0]?.value || 0

  const stats = [
    { title: "Total Catalog", value: totalCatalog.toLocaleString(), description: "Total book copies in catalog", icon: <BookOpen className="h-5 w-5 text-blue-500" />, trend: "Real-time sync" },
    { title: "Active Issues", value: activeIssues.toString(), description: "Books currently borrowed", icon: <GitPullRequest className="h-5 w-5 text-indigo-500" />, trend: "98% on time" },
    { title: "Overdue Books", value: overdueIssues.toString(), description: "Pending returns past due date", icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, trend: "Immediate attention" },
    { title: "Library Members", value: totalMembers.toLocaleString(), description: "Registered students & staff", icon: <Users className="h-5 w-5 text-emerald-500" />, trend: "System profiles" }
  ]

  // Fetch recent checkouts
  const recentTransactions = await db.select({
    id: libraryBookIssue.id,
    student: userTable.name,
    book: libraryBook.title,
    date: libraryBookIssue.issueDate,
    status: libraryBookIssue.status,
    dueDate: libraryBookIssue.dueDate,
  })
  .from(libraryBookIssue)
  .innerJoin(libraryBook, eq(libraryBookIssue.bookId, libraryBook.id))
  .innerJoin(userTable, eq(libraryBookIssue.userId, userTable.id))
  .orderBy(desc(libraryBookIssue.createdAt))
  .limit(4)


  return (
    <div className="page-container py-6 min-h-screen bg-background font-sans">
      <div className="page-content">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Librarian Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user.name}! Here is a summary of your library operations.
          </p>
        </div>

        {/* Metrics Row */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-xl border border-border bg-card/45 p-6 flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
              </div>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{stat.description}</span>
              <span className="font-semibold text-emerald-500 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Transactions Card */}
        <div className="rounded-xl border border-border bg-card/25 p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Recent Borrowing Activity</h3>
            <p className="text-xs text-muted-foreground">Monitor recently issued and returned books</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                  <th className="py-2.5">Student</th>
                  <th className="py-2.5">Book Title</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/10">
                    <td className="py-3 font-semibold text-foreground">{tx.student}</td>
                    <td className="py-3 text-muted-foreground truncate max-w-[150px]">{tx.book}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                        tx.status === "returned" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                        tx.status === "overdue" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                        "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Tools & Notices Card */}
        <div className="rounded-xl border border-border bg-card/25 p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Library Quick Guides</h3>
            <p className="text-xs text-muted-foreground">Helpful resources for managing catalog</p>
          </div>

          <div className="grid gap-3 mt-1">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/80 bg-card/60">
              <Clock className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Check Due Dates Regularly</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Keep track of overdue items and send automatic reminders via notice board.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/80 bg-card/60">
              <BookMarked className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Catalog Updates</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Update catalog records and keep the ISBN identifiers updated for seamless student lookups.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/80 bg-card/60">
              <Inbox className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Manage Issue Requests</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Coordinate student requests to issue new books directly from the book issues tab.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
