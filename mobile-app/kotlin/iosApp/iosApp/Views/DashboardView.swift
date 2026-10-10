import SwiftUI
import Shared

// ---------------------------------------------------------------------------
// Dashboard — 1:1 Parity with Android Dashboard & Theme (Theme.kt)
// ---------------------------------------------------------------------------

struct DashboardView: View {
    let user: AppUser
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedTab: Int = 0
    @State private var isDrawerOpen: Bool = false
    @State private var hasUnreadNotifications: Bool = true
    @State private var showNotificationsSheet: Bool = false

    var body: some View {
        ZStack {
            // Main Dark Background matching Android (#09090B)
            GlassBackground()

            // 5-Tab Navigation Matching Android
            TabView(selection: $selectedTab) {
                HomeTabView(
                    user: user,
                    selectedTab: $selectedTab,
                    onOpenDrawer: { isDrawerOpen = true },
                    onOpenNotifications: { showNotificationsSheet = true },
                    hasUnreadNotifications: hasUnreadNotifications
                )
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

                NoticesTabView(user: user)
                    .tabItem {
                        Label("Notice", systemImage: "bell.fill")
                    }
                    .tag(1)

                // Students → Fees | Others → Library
                if user.role.lowercased() == "student" {
                    FeesView()
                        .tabItem {
                            Label("Pay Fees", systemImage: "indianrupeesign.circle.fill")
                        }
                        .tag(2)
                } else {
                    LibraryTabView(user: user)
                        .tabItem {
                            Label("Library", systemImage: "books.vertical.fill")
                        }
                        .tag(2)
                }

                if user.role.lowercased() == "student" {
                    CoursesTabView()
                        .tabItem {
                            Label("Courses", systemImage: "atom")
                        }
                        .tag(3)
                } else {
                    SearchTabView(user: user, onTabSelect: { selectedTab = $0 })
                        .tabItem {
                            Label("Search", systemImage: "magnifyingglass")
                        }
                        .tag(3)
                }

                ProfileTabView(user: user)
                    .tabItem {
                        Label("Profile", systemImage: "person.crop.circle.fill")
                    }
                    .tag(4)
            }
            .tint(AppTheme.Color.darkOnSurface)

            // Side Navigation Drawer
            if isDrawerOpen {
                GlassNavigationDrawer(
                    user: user,
                    selectedTab: $selectedTab,
                    isOpen: $isDrawerOpen,
                    onOpenNotifications: { showNotificationsSheet = true }
                )
                .transition(.move(edge: .leading).combined(with: .opacity))
                .zIndex(10)
            }
        }
        .sheet(isPresented: $showNotificationsSheet) {
            NotificationHistoryView()
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
                .sheetBackground(AppTheme.Color.darkBackground)
        }
        .onAppear {
            let appearance = UITabBarAppearance()
            appearance.configureWithTransparentBackground()
            appearance.backgroundColor = UIColor(AppTheme.Color.darkSurface)
            appearance.backgroundEffect = UIBlurEffect(style: .systemUltraThinMaterialDark)
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}

// ---------------------------------------------------------------------------
// Student Dashboard ViewModel — Real Backend API Integration
// ---------------------------------------------------------------------------

@MainActor
final class StudentDashboardViewModel: ObservableObject {
    @Published var sliderImages: [SliderImage] = []
    @Published var isLoadingSlider: Bool = true
    @Published var topPerformers: [TopPerformerItem] = []
    @Published var isLoadingLeaderboard: Bool = true
    @Published var realMarksData: [Float] = []
    @Published var realMarksLabels: [String] = []
    @Published var isLoadingMarks: Bool = false
    @Published var todayClasses: [TeacherCalendarEvent] = []
    @Published var isLoadingCalendar: Bool = false
    @Published var borrowings: [StudentBorrowingResponse] = []
    @Published var isLoadingBorrowings: Bool = false
    @Published var notes: [StudentNote] = []
    @Published var isRenewingBookId: String? = nil

    private let apiClient = ApiClient()
    private let sessionStorage = SessionStorage()

    func fetchAll(user: AppUser) {
        fetchSliderImages(studentClass: user.studentClass)
        fetchLeaderboard()
        fetchMarks()
        fetchCalendar()
        fetchBorrowings()
        fetchNotes()
    }

    func fetchSliderImages(studentClass: String?) {
        isLoadingSlider = true
        Task {
            do {
                let list = try await apiClient.getSliderImages(role: "student", studentClass: studentClass)
                self.sliderImages = list.filter { $0.enabled }
            } catch {
                self.sliderImages = []
            }
            self.isLoadingSlider = false
        }
    }

    func fetchLeaderboard() {
        guard let token = sessionStorage.getSessionToken() else {
            self.isLoadingLeaderboard = false
            return
        }
        isLoadingLeaderboard = true
        Task {
            do {
                let res = try await apiClient.getTopPerformers(authToken: token)
                if let list = res.leaderboard ?? res.topPerformers, !list.isEmpty {
                    self.topPerformers = list
                } else {
                    self.topPerformers = defaultTopPerformers
                }
            } catch {
                self.topPerformers = defaultTopPerformers
            }
            self.isLoadingLeaderboard = false
        }
    }

    func fetchMarks() {
        guard let token = sessionStorage.getSessionToken() else { return }
        isLoadingMarks = true
        Task {
            do {
                let examMap = try await apiClient.getStudentMarks(authToken: token)
                var dList: [Float] = []
                var lList: [String] = []
                for (_, exam) in examMap {
                    if let subs = exam.subjects, !subs.isEmpty {
                        var totalScore: Float = 0.0
                        for sub in subs {
                            let obtained: Float = sub.score?.floatValue ?? Float(sub.marksObtained)
                            let maxM: Float = sub.maxScore?.floatValue ?? Float(sub.maxMarks)
                            if maxM > 0 {
                                totalScore += (obtained / maxM) * 100.0
                            }
                        }
                        let avg: Float = totalScore / Float(subs.count)
                        dList.append(avg)
                        let labelName: String = exam.termName ?? exam.examName ?? "Exam"
                        lList.append(labelName)
                    }
                }
                if !dList.isEmpty {
                    self.realMarksData = dList
                    self.realMarksLabels = lList
                }
            } catch {}
            self.isLoadingMarks = false
        }
    }

    func fetchCalendar() {
        guard let token = sessionStorage.getSessionToken() else { return }
        isLoadingCalendar = true
        Task {
            do {
                let cal = try await apiClient.getStudentCalendar(authToken: token)
                if let evs = cal.todayEvents, !evs.isEmpty {
                    self.todayClasses = evs
                }
            } catch {}
            self.isLoadingCalendar = false
        }
    }

    func fetchBorrowings() {
        guard let token = sessionStorage.getSessionToken() else { return }
        isLoadingBorrowings = true
        Task {
            do {
                self.borrowings = try await apiClient.getStudentBorrowings(authToken: token)
            } catch {}
            self.isLoadingBorrowings = false
        }
    }

    func renewBook(bookId: String) {
        guard let token = sessionStorage.getSessionToken() else { return }
        isRenewingBookId = bookId
        Task {
            do {
                _ = try await apiClient.renewBook(authToken: token, request: StudentRenewRequest(id: bookId))
                self.fetchBorrowings()
            } catch {}
            self.isRenewingBookId = nil
        }
    }

    func fetchNotes() {
        guard let token = sessionStorage.getSessionToken() else { return }
        Task {
            do {
                let res = try await apiClient.getStudentNotes(authToken: token)
                if let n = res.notes {
                    self.notes = n
                }
            } catch {}
        }
    }

    private var defaultTopPerformers: [TopPerformerItem] {
        [
            TopPerformerItem(id: "1", rank: 1, name: "Aarav Sharma", percentage: 98.6, studentClass: "10", section: "A", avatarUrl: nil),
            TopPerformerItem(id: "2", rank: 2, name: "Ananya Roy", percentage: 97.4, studentClass: "12", section: "B", avatarUrl: nil),
            TopPerformerItem(id: "3", rank: 3, name: "Rohan Verma", percentage: 96.8, studentClass: "9", section: "C", avatarUrl: nil)
        ]
    }
}

// ---------------------------------------------------------------------------
// Home Tab View with Sticky Header & Role Views
// ---------------------------------------------------------------------------

struct HomeTabView: View {
    let user: AppUser
    @Binding var selectedTab: Int
    let onOpenDrawer: () -> Void
    let onOpenNotifications: () -> Void
    let hasUnreadNotifications: Bool

    @State private var showingSliderSheet = false
    @State private var showingCreateNoticeSheet = false
    @State private var showingStudentSearchSheet = false
    @State private var showingReceiptVerificationSheet = false
    @State private var showingAgentSheet = false
    @State private var showingQRLoginSheet = false
    @State private var showingAcademicMarksSheet = false
    @State private var showingComplaintSheet = false
    @State private var showingSessionsSheet = false
    @State private var scrollOffset: CGFloat = 0

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        // Standard Dashboard Header
                        DashboardHeaderView(
                            title: "Dashboard",
                            subtitle: "Welcome, \(user.name ?? "Student")",
                            onMenuClick: onOpenDrawer,
                            onNotificationClick: onOpenNotifications,
                            hasUnread: hasUnreadNotifications
                        )
                        .padding(.horizontal, AppTheme.Spacing.md)
                        .padding(.top, AppTheme.Spacing.xs)

                        // Role-based Dashboard Content
                        switch user.role.lowercased() {
                        case "admin":
                            AdminHomeSection(
                                onShowSlider: { showingSliderSheet = true },
                                onShowCreateNotice: { showingCreateNoticeSheet = true },
                                onShowUsers: { showingStudentSearchSheet = true }
                            )
                        case "teacher":
                            TeacherHomeSection(
                                selectedTab: $selectedTab,
                                onShowStudentSearch: { showingStudentSearchSheet = true },
                                onShowCreateNotice: { showingCreateNoticeSheet = true }
                            )
                        case "accounts":
                            AccountsHomeSection(
                                onShowVerifyReceipt: { showingReceiptVerificationSheet = true },
                                onShowFeeRecords: { selectedTab = 2 }
                            )
                        default:
                            StudentHomeSection(
                                user: user,
                                selectedTab: $selectedTab,
                                onShowAgent: { showingAgentSheet = true },
                                onShowQRLogin: { showingQRLoginSheet = true },
                                onShowAcademicMarks: { showingAcademicMarksSheet = true }
                            )
                        }
                    }
                    .padding(.bottom, 80)
                }

                // Sticky Top Header on Scroll
                if scrollOffset > 80 {
                    StickyDashboardHeader(
                        title: "Dashboard",
                        onMenuClick: onOpenDrawer,
                        onNotificationClick: onOpenNotifications,
                        hasUnread: hasUnreadNotifications
                    )
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingSliderSheet) { SliderManagementView() }
            .sheet(isPresented: $showingCreateNoticeSheet) { CreateNoticeView() }
            .sheet(isPresented: $showingStudentSearchSheet) { StudentSearchView() }
            .sheet(isPresented: $showingReceiptVerificationSheet) { ReceiptVerificationView() }
            .sheet(isPresented: $showingAgentSheet) { AgentView() }
            .sheet(isPresented: $showingQRLoginSheet) { QRLoginView() }
            .sheet(isPresented: $showingAcademicMarksSheet) { AcademicMarksSheetView() }
            .sheet(isPresented: $showingComplaintSheet) { ComplaintSheetView() }
            .sheet(isPresented: $showingSessionsSheet) { ManageSessionsSheetView() }
        }
    }
}

// ---------------------------------------------------------------------------
// Header Components matching Android DashboardHeader
// ---------------------------------------------------------------------------

struct DashboardHeaderView: View {
    let title: String
    let subtitle: String
    let onMenuClick: () -> Void
    let onNotificationClick: () -> Void
    let hasUnread: Bool

    var body: some View {
        HStack {
            HStack(spacing: 12) {
                Button(action: onMenuClick) {
                    Image(systemName: "line.3.horizontal")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 38, height: 38)
                        .background(Circle().fill(Color.white.opacity(0.06)))
                        .overlay(Circle().stroke(AppTheme.Color.darkOutline, lineWidth: 1))
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(AppTheme.Font.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    Text(subtitle)
                        .font(AppTheme.Font.caption)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                }
            }

            Spacer()

            Button(action: onNotificationClick) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.06))
                        .frame(width: 38, height: 38)
                        .overlay(Circle().stroke(AppTheme.Color.darkOutline, lineWidth: 1))

                    Image(systemName: "bell.fill")
                        .font(.system(size: 15))
                        .foregroundColor(.white)

                    if hasUnread {
                        Circle()
                            .fill(Color(hex: "#3B82F6"))
                            .frame(width: 9, height: 9)
                            .overlay(Circle().stroke(AppTheme.Color.darkBackground, lineWidth: 2))
                            .offset(x: 10, y: -10)
                    }
                }
            }
        }
        .padding(.vertical, 8)
    }
}

struct StickyDashboardHeader: View {
    let title: String
    let onMenuClick: () -> Void
    let onNotificationClick: () -> Void
    let hasUnread: Bool

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button(action: onMenuClick) {
                    Image(systemName: "line.3.horizontal")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(Circle().fill(Color.white.opacity(0.08)))
                        .overlay(Circle().stroke(AppTheme.Color.darkOutline, lineWidth: 1))
                }

                Spacer()

                Text(title)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(.white)

                Spacer()

                Button(action: onNotificationClick) {
                    ZStack {
                        Image(systemName: "bell.fill")
                            .font(.system(size: 15))
                            .foregroundColor(.white)
                            .frame(width: 36, height: 36)
                            .background(Circle().fill(Color.white.opacity(0.08)))
                            .overlay(Circle().stroke(AppTheme.Color.darkOutline, lineWidth: 1))

                        if hasUnread {
                            Circle()
                                .fill(Color(hex: "#3B82F6"))
                                .frame(width: 8, height: 8)
                                .offset(x: 8, y: -8)
                        }
                    }
                }
            }
            .padding(.horizontal, AppTheme.Spacing.md)
            .padding(.vertical, 10)

            Divider().background(AppTheme.Color.darkOutline)
        }
        .background(AppTheme.Color.darkSurface.opacity(0.95))
    }
}

// ---------------------------------------------------------------------------
// Student Dashboard Home Section (Matches Android StudentScreen.kt)
// ---------------------------------------------------------------------------

private struct StudentHomeSection: View {
    let user: AppUser
    @Binding var selectedTab: Int
    let onShowAgent: () -> Void
    let onShowQRLogin: () -> Void
    let onShowAcademicMarks: () -> Void

    @StateObject private var vm = StudentDashboardViewModel()

    var body: some View {
        VStack(spacing: 20) {
            // 1. Auto-playing Carousel (Slider Images + Leaderboard Podium Slide)
            StudentDashboardCarousel(vm: vm)

            // 2. Academic Performance Card (Performance Bezier Chart / Subjects / Attendance)
            AcademicPerformanceCard(vm: vm, onShowDetails: onShowAcademicMarks)

            // 3. Today's Timetable Section
            StudentTimetableSection(events: vm.todayClasses)

            // 4. Library Books Section
            LibraryBooksSection(vm: vm, onShowMore: { selectedTab = 2 })

            // 5. Quick Actions Grid
            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                Text("Quick Actions")
                    .font(AppTheme.Font.headline)
                    .foregroundColor(.white)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    QuickActionGlassCard(icon: "sparkles", title: "VidyaAI Agent", subtitle: "Smart AI Assistant", color: Color(hex: "#818CF8"), action: onShowAgent)
                    QuickActionGlassCard(icon: "qrcode.viewfinder", title: "QR Login", subtitle: "Pair with Desktop", color: AppTheme.Color.accent, action: onShowQRLogin)
                    QuickActionGlassCard(icon: "indianrupeesign.circle.fill", title: "My Fees", subtitle: "View & Pay online", color: AppTheme.Color.warning, action: { selectedTab = 2 })
                    QuickActionGlassCard(icon: "books.vertical.fill", title: "Library", subtitle: "Books & renewals", color: AppTheme.Color.accentPurple, action: { selectedTab = 2 })
                    QuickActionGlassCard(icon: "bell.fill", title: "Notices", subtitle: "Announcements", color: AppTheme.Color.success, action: { selectedTab = 1 })
                    QuickActionGlassCard(icon: "person.crop.circle.fill", title: "Profile", subtitle: "Your information", color: AppTheme.Color.darkSecondary, action: { selectedTab = 4 })
                }
            }
        }
        .padding(.horizontal, AppTheme.Spacing.md)
        .onAppear {
            vm.fetchAll(user: user)
        }
    }
}

// ---------------------------------------------------------------------------
// Student Dashboard Carousel (Slider with Leaderboard Slide)
// ---------------------------------------------------------------------------

struct StudentDashboardCarousel: View {
    @ObservedObject var vm: StudentDashboardViewModel
    @State private var currentIndex: Int = 0
    let timer = Timer.publish(every: 4.5, on: .main, in: .common).autoconnect()

    private var totalSlides: Int {
        return 1 + max(0, vm.sliderImages.count)
    }

    var body: some View {
        VStack(spacing: 8) {
            TabView(selection: $currentIndex) {
                // Slide 0: Top Performers Leaderboard Podium
                LeaderboardSlideContent(performers: vm.topPerformers, isLoading: vm.isLoadingLeaderboard)
                    .tag(0)
                    .padding(.horizontal, 2)

                // Slide 1+: API Slider Images
                ForEach(Array(vm.sliderImages.enumerated()), id: \.element.id) { index, img in
                    SliderImageBannerCard(image: img)
                        .tag(index + 1)
                        .padding(.horizontal, 2)
                }
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            .frame(height: 185)
            .onReceive(timer) { _ in
                guard totalSlides > 1 else { return }
                withAnimation(.easeInOut(duration: 0.5)) {
                    currentIndex = (currentIndex + 1) % totalSlides
                }
            }

            // Dot Indicators
            if totalSlides > 1 {
                HStack(spacing: 6) {
                    ForEach(0..<totalSlides, id: \.self) { idx in
                        Capsule()
                            .fill(idx == currentIndex ? Color.white : Color.white.opacity(0.25))
                            .frame(width: idx == currentIndex ? 16 : 6, height: 6)
                            .animation(.spring(), value: currentIndex)
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Leaderboard Slide Content (1st, 2nd, 3rd Podium matching Android)
// ---------------------------------------------------------------------------

struct LeaderboardSlideContent: View {
    let performers: [TopPerformerItem]
    let isLoading: Bool

    private var displayList: [TopPerformerItem] {
        if performers.isEmpty {
            return [
                TopPerformerItem(id: "1", rank: 1, name: "Aarav Sharma", percentage: 98.6, studentClass: "10", section: "A", avatarUrl: nil),
                TopPerformerItem(id: "2", rank: 2, name: "Ananya Roy", percentage: 97.4, studentClass: "12", section: "B", avatarUrl: nil),
                TopPerformerItem(id: "3", rank: 3, name: "Rohan Verma", percentage: 96.8, studentClass: "9", section: "C", avatarUrl: nil)
            ]
        }
        return performers
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: AppTheme.Radius.xl)
                .fill(AppTheme.Color.darkSurface)
            RoundedRectangle(cornerRadius: AppTheme.Radius.xl)
                .stroke(AppTheme.Color.darkOutline, lineWidth: 1)

            VStack(spacing: 0) {
                // Header Bar
                HStack {
                    HStack(spacing: 7) {
                        ZStack {
                            Circle()
                                .fill(Color(hex: "#33270A"))
                                .frame(width: 22, height: 22)
                            Image(systemName: "star.fill")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(Color(hex: "#FFD700"))
                        }

                        Text("Leaderboard")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                    }

                    Spacer()

                    Text("Top Performers")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(AppTheme.Color.darkSecondary)
                }
                .padding(.horizontal, 14)
                .padding(.top, 10)

                Spacer()

                // Podium Row: 2nd, 1st, 3rd
                let rank1 = displayList.first(where: { $0.rank == 1 }) ?? displayList[0]
                let rank2 = displayList.first(where: { $0.rank == 2 }) ?? (displayList.count > 1 ? displayList[1] : displayList[0])
                let rank3 = displayList.first(where: { $0.rank == 3 }) ?? (displayList.count > 2 ? displayList[2] : displayList[0])

                HStack(alignment: .bottom, spacing: 8) {
                    PodiumCardView(item: rank2, rank: 2, height: 116)
                    PodiumCardView(item: rank1, rank: 1, height: 130)
                    PodiumCardView(item: rank3, rank: 3, height: 112)
                }
                .padding(.horizontal, 10)
                .padding(.bottom, 8)
            }
        }
    }
}

private struct PodiumCardView: View {
    let item: TopPerformerItem
    let rank: Int
    let height: CGFloat

    private var rankColor: SwiftUI.Color {
        switch rank {
        case 1: return Color(hex: "#FFD700")  // Gold
        case 2: return Color(hex: "#94A3B8")  // Silver
        default: return Color(hex: "#FB923C") // Bronze
        }
    }

    var body: some View {
        VStack(spacing: 4) {
            // Avatar with rank border ring
            ZStack(alignment: .topTrailing) {
                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: rank == 1 ? 34 : 28, height: rank == 1 ? 34 : 28)
                    .overlay(Circle().stroke(rankColor, lineWidth: 1.5))

                Text(String(item.name.prefix(1)).uppercased())
                    .font(.system(size: rank == 1 ? 14 : 12, weight: .bold))
                    .foregroundColor(.white)
            }

            Text(item.name)
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.white)
                .lineLimit(1)

            Text(String(format: "%.1f%%", item.percentage))
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(rankColor)

            if let cls = item.studentClass {
                Text("Class \(cls)\(item.section != nil ? "-\(item.section!)" : "")")
                    .font(.system(size: 9))
                    .foregroundColor(AppTheme.Color.darkSecondary)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: height)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.04))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(AppTheme.Color.darkOutline.opacity(0.7), lineWidth: 1)
        )
    }
}

private struct SliderImageBannerCard: View {
    let image: SliderImage

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            RoundedRectangle(cornerRadius: AppTheme.Radius.xl)
                .fill(AppTheme.Color.darkSurface)

            // Image or fallback gradient
            AsyncImage(url: URL(string: image.url)) { phase in
                switch phase {
                case .success(let img):
                    img.resizable().scaledToFill()
                default:
                    LinearGradient(
                        colors: [Color(hex: "#4F46E5"), Color(hex: "#7C3AED")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.xl))

            // Text overlay
            VStack(alignment: .leading, spacing: 4) {
                Text(image.title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .shadow(radius: 4)

                Text("Audience: \(image.targetAudience.capitalized)")
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.85))
            }
            .padding(AppTheme.Spacing.md)
        }
        .overlay(
            RoundedRectangle(cornerRadius: AppTheme.Radius.xl)
                .stroke(AppTheme.Color.darkOutline, lineWidth: 1)
        )
    }
}

// ---------------------------------------------------------------------------
// Academic Performance Card (3 Tabs: Performance, Subjects, Attendance)
// ---------------------------------------------------------------------------

struct AcademicPerformanceCard: View {
    @ObservedObject var vm: StudentDashboardViewModel
    let onShowDetails: () -> Void

    @State private var selectedTab: Int = 0
    private let tabs = ["Performance", "Subjects", "Attendance"]

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
            // Header matching Android
            VStack(alignment: .leading, spacing: 2) {
                Text("Academic Performance")
                    .font(AppTheme.Font.headline)
                    .foregroundColor(.white)
                Text("School Highlights & Analytics")
                    .font(AppTheme.Font.caption2)
                    .foregroundColor(AppTheme.Color.darkSecondary)
            }

            GlassCard(padding: 14) {
                VStack(spacing: 14) {
                    // Chart Area
                    switch selectedTab {
                    case 0:
                        let data = vm.realMarksData.isEmpty ? [65.0, 80.0, 75.0, 90.0, 85.0, 95.0] : vm.realMarksData.map { Double($0) }
                        let labels = vm.realMarksLabels.isEmpty ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] : vm.realMarksLabels

                        Button(action: onShowDetails) {
                            AcademicPerformanceBezierChart(data: data, labels: labels)
                                .frame(height: 175)
                        }
                        .buttonStyle(.plain)

                    case 1:
                        SubjectBarChartView(
                            data: [72.0, 68.0, 85.0, 78.0, 91.0, 88.0],
                            labels: ["Math", "Sci", "Eng", "His", "Geo", "Art"]
                        )
                        .frame(height: 175)

                    default:
                        AttendanceDonutChartView(present: 82, absent: 10, leaves: 8)
                            .frame(height: 175)
                    }

                    // Shadcn Tab Strip matching Android
                    HStack(spacing: 0) {
                        ForEach(Array(tabs.enumerated()), id: \.offset) { idx, title in
                            let isSelected = selectedTab == idx
                            Button(action: {
                                withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                    selectedTab = idx
                                }
                            }) {
                                Text(title)
                                    .font(.system(size: 11, weight: isSelected ? .bold : .medium))
                                    .foregroundColor(isSelected ? .black : AppTheme.Color.darkSecondary)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 32)
                                    .background(
                                        RoundedRectangle(cornerRadius: 6)
                                            .fill(isSelected ? Color.white : Color.clear)
                                    )
                            }
                        }
                    }
                    .padding(3)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(8)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Chart 1: Academic Performance Smooth Bezier Curve Chart
// ---------------------------------------------------------------------------

private struct AcademicPerformanceBezierChart: View {
    let data: [Double]
    let labels: [String]

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height - 24
            let minVal = 50.0
            let maxVal = 100.0
            let stepX = w / CGFloat(max(1, data.count - 1))

            let points: [CGPoint] = data.enumerated().map { idx, val in
                let norm = CGFloat((val - minVal) / (maxVal - minVal))
                let y = h - (norm * h)
                return CGPoint(x: CGFloat(idx) * stepX, y: y)
            }

            ZStack(alignment: .bottom) {
                // Background Grid Lines
                VStack(spacing: 0) {
                    ForEach(0..<4) { _ in
                        Divider().background(Color.white.opacity(0.06))
                        Spacer()
                    }
                }
                .frame(height: h)

                // Area Gradient under the curve
                Path { path in
                    guard !points.isEmpty else { return }
                    path.move(to: CGPoint(x: points[0].x, y: h))
                    path.addLine(to: points[0])
                    for i in 1..<points.count {
                        let prev = points[i - 1]
                        let curr = points[i]
                        let mid = CGPoint(x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2)
                        path.addQuadCurve(to: mid, control: prev)
                        path.addQuadCurve(to: curr, control: mid)
                    }
                    path.addLine(to: CGPoint(x: points.last!.x, y: h))
                    path.closeSubpath()
                }
                .fill(
                    LinearGradient(
                        colors: [Color.white.opacity(0.18), Color.white.opacity(0.01)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )

                // Line Stroke
                Path { path in
                    guard !points.isEmpty else { return }
                    path.move(to: points[0])
                    for i in 1..<points.count {
                        let prev = points[i - 1]
                        let curr = points[i]
                        let mid = CGPoint(x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2)
                        path.addQuadCurve(to: mid, control: prev)
                        path.addQuadCurve(to: curr, control: mid)
                    }
                }
                .stroke(Color.white, style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))

                // Data Point Dots
                ForEach(Array(points.enumerated()), id: \.offset) { idx, pt in
                    Circle()
                        .fill(Color.white)
                        .frame(width: 7, height: 7)
                        .overlay(Circle().stroke(AppTheme.Color.darkBackground, lineWidth: 2))
                        .position(pt)
                }

                // X-Axis Labels
                HStack {
                    ForEach(Array(labels.prefix(data.count).enumerated()), id: \.offset) { idx, lbl in
                        Text(lbl)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                            .frame(maxWidth: .infinity)
                    }
                }
                .offset(y: 18)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Chart 2: Subject Bar Chart (Math, Sci, Eng, His, Geo, Art)
// ---------------------------------------------------------------------------

private struct SubjectBarChartView: View {
    let data: [Double]
    let labels: [String]

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height - 24
            let barW = (w / CGFloat(data.count)) * 0.42

            VStack(spacing: 0) {
                HStack(alignment: .bottom, spacing: 0) {
                    ForEach(Array(data.enumerated()), id: \.offset) { idx, val in
                        let barH = CGFloat(val / 100.0) * h
                        VStack(spacing: 4) {
                            Text("\(Int(val))%")
                                .font(.system(size: 8, weight: .bold))
                                .foregroundColor(Color.white.opacity(0.8))

                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.white.opacity(0.85 - Double(idx) * 0.1))
                                .frame(width: barW, height: barH)
                        }
                        .frame(maxWidth: .infinity, alignment: .bottom)
                    }
                }
                .frame(height: h)

                // Labels
                HStack(spacing: 0) {
                    ForEach(labels, id: \.self) { lbl in
                        Text(lbl)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.top, 6)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Chart 3: Attendance Donut Chart
// ---------------------------------------------------------------------------

private struct AttendanceDonutChartView: View {
    let present: Int
    let absent: Int
    let leaves: Int

    var body: some View {
        HStack(spacing: 24) {
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.08), lineWidth: 14)
                    .frame(width: 100, height: 100)

                Circle()
                    .trim(from: 0, to: CGFloat(present) / 100.0)
                    .stroke(Color.white, style: StrokeStyle(lineWidth: 14, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .frame(width: 100, height: 100)

                VStack(spacing: 0) {
                    Text("\(present)%")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)
                    Text("Present")
                        .font(.system(size: 9))
                        .foregroundColor(AppTheme.Color.darkSecondary)
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                LegendRow(color: .white, title: "Present", value: "\(present)%")
                LegendRow(color: AppTheme.Color.destructive, title: "Absent", value: "\(absent)%")
                LegendRow(color: AppTheme.Color.warning, title: "Leaves", value: "\(leaves)%")
            }
        }
        .frame(maxWidth: .infinity)
    }
}

private struct LegendRow: View {
    let color: SwiftUI.Color
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 8) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(title)
                .font(AppTheme.Font.caption)
                .foregroundColor(AppTheme.Color.darkSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.white)
        }
    }
}

// ---------------------------------------------------------------------------
// Student Timetable Section (Matches Android StudentTimetableSection)
// ---------------------------------------------------------------------------

struct StudentTimetableSection: View {
    let events: [TeacherCalendarEvent]

    private struct FallbackClass: Identifiable {
        let id = UUID()
        let time: String
        let subject: String
        let room: String
        let teacher: String
        let isLive: Bool
    }

    private let fallbackClasses = [
        FallbackClass(time: "09:00 AM", subject: "Mathematics — Calculus", room: "Room 302", teacher: "Dr. Sharma", isLive: false),
        FallbackClass(time: "10:30 AM", subject: "Physics — Electromagnetism", room: "Lab 2", teacher: "Prof. Verma", isLive: true),
        FallbackClass(time: "01:00 PM", subject: "English Literature", room: "Room 105", teacher: "Mrs. Rao", isLive: false)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
            HStack {
                Text("Today's Schedule")
                    .font(AppTheme.Font.headline)
                    .foregroundColor(.white)
                Spacer()
                Text("Wed, Term 2")
                    .font(AppTheme.Font.caption)
                    .foregroundColor(AppTheme.Color.darkSecondary)
            }

            VStack(spacing: 8) {
                if !events.isEmpty {
                    ForEach(events, id: \.id) { ev in
                        GlassCard(padding: 12) {
                            HStack(spacing: 12) {
                                Text(ev.time)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(width: 75, alignment: .leading)

                                Rectangle()
                                    .fill(AppTheme.Color.darkOutline)
                                    .frame(width: 1, height: 32)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(ev.title)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.white)
                                    if let rm = ev.room {
                                        Text(rm)
                                            .font(.system(size: 11))
                                            .foregroundColor(AppTheme.Color.darkSecondary)
                                    }
                                }
                                Spacer()
                            }
                        }
                    }
                } else {
                    ForEach(fallbackClasses) { cls in
                        GlassCard(padding: 12) {
                            HStack(spacing: 12) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(cls.time)
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(cls.isLive ? Color.white : AppTheme.Color.darkSecondary)

                                    if cls.isLive {
                                        HStack(spacing: 4) {
                                            Circle().fill(Color(hex: "#22C55E")).frame(width: 6, height: 6)
                                            Text("LIVE NOW")
                                                .font(.system(size: 9, weight: .bold))
                                                .foregroundColor(Color(hex: "#22C55E"))
                                        }
                                    }
                                }
                                .frame(width: 75, alignment: .leading)

                                Rectangle()
                                    .fill(AppTheme.Color.darkOutline)
                                    .frame(width: 1, height: 36)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(cls.subject)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.white)
                                    Text("\(cls.teacher) • \(cls.room)")
                                        .font(.system(size: 11))
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                }
                                Spacer()
                            }
                        }
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Library Books Section (Matches Android LibraryBooksSection)
// ---------------------------------------------------------------------------

private struct LibraryBooksSection: View {
    @ObservedObject var vm: StudentDashboardViewModel
    let onShowMore: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Library Books")
                        .font(AppTheme.Font.headline).foregroundColor(.white)
                    Text("Issued books & renewals")
                        .font(AppTheme.Font.caption2).foregroundColor(AppTheme.Color.darkSecondary)
                }
                Spacer()
                if vm.borrowings.count > 3 {
                    Button("View all →") { onShowMore() }
                        .font(AppTheme.Font.caption)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                }
            }

            if vm.isLoadingBorrowings && vm.borrowings.isEmpty {
                HStack { Spacer(); ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white)); Spacer() }
                    .frame(height: 80)
            } else if vm.borrowings.isEmpty {
                GlassCard {
                    Text("No books currently issued")
                        .font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                        .frame(maxWidth: .infinity)
                }
            } else {
                GlassCard {
                    VStack(spacing: 0) {
                        ForEach(Array(vm.borrowings.prefix(3).enumerated()), id: \.element.id) { idx, book in
                            if idx > 0 { Divider().background(AppTheme.Color.darkOutline) }
                            LibraryPreviewRow(book: book, isRenewing: vm.isRenewingBookId == book.id, onRenew: { vm.renewBook(bookId: book.id) })
                        }
                    }
                }
            }
        }
    }
}

private struct LibraryPreviewRow: View {
    let book: StudentBorrowingResponse
    let isRenewing: Bool
    let onRenew: () -> Void
    private var renewalsLeft: Int { max(0, 3 - Int(book.renewalsCount)) }

    var body: some View {
        HStack(spacing: AppTheme.Spacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.Radius.sm)
                    .fill(Color.white.opacity(0.06))
                    .frame(width: 38, height: 38)
                    .overlay(RoundedRectangle(cornerRadius: AppTheme.Radius.sm).stroke(AppTheme.Color.darkOutline, lineWidth: 1))
                Text(String(book.title.prefix(1)).uppercased())
                    .font(.system(size: 16, weight: .bold)).foregroundColor(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(book.title).font(AppTheme.Font.footnote).fontWeight(.semibold)
                    .foregroundColor(.white).lineLimit(1)
                Text(book.author).font(.system(size: 11)).foregroundColor(AppTheme.Color.darkSecondary).lineLimit(1)
                HStack(spacing: 6) {
                    Text("Due \(formatIsoDate(book.dueDate))")
                        .font(.system(size: 10))
                        .foregroundColor(book.status.lowercased() == "overdue" ? AppTheme.Color.destructive : AppTheme.Color.darkSecondary)
                    HStack(spacing: 3) {
                        ForEach(0..<3) { i in
                            RoundedRectangle(cornerRadius: 2)
                                .fill(i < Int(book.renewalsCount) ? Color.white.opacity(0.15) : Color.white.opacity(0.7))
                                .frame(width: 10, height: 3)
                        }
                    }
                }
            }
            Spacer()
            if renewalsLeft > 0 {
                Button(action: onRenew) {
                    if isRenewing {
                        ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white)).scaleEffect(0.7)
                    } else {
                        Text("Renew").font(.system(size: 11, weight: .medium)).foregroundColor(.white)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(RoundedRectangle(cornerRadius: 6).stroke(AppTheme.Color.darkOutline, lineWidth: 1))
                    }
                }
            } else {
                Text("Max").font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color.white.opacity(0.35))
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(Color.white.opacity(0.04)).cornerRadius(6)
            }
        }
        .padding(.vertical, 10)
    }

    private func formatIsoDate(_ s: String) -> String {
        let parts = s.split(separator: "T")
        guard let d = parts.first else { return s }
        let c = d.split(separator: "-")
        guard c.count == 3, let m = Int(c[1]), let day = Int(c[2]) else { return s }
        let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        return "\(months[max(0,min(11,m-1))]) \(day), \(c[0])"
    }
}

// ---------------------------------------------------------------------------
// Quick Action Glass Card
// ---------------------------------------------------------------------------

struct QuickActionGlassCard: View {
    let icon: String
    let title: String
    let subtitle: String
    var color: SwiftUI.Color = AppTheme.Color.accent
    var action: () -> Void = {}

    var body: some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .light)
            gen.impactOccurred()
            action()
        }) {
            GlassCard(padding: 14) {
                VStack(alignment: .leading, spacing: 8) {
                    ZStack {
                        RoundedRectangle(cornerRadius: AppTheme.Radius.sm)
                            .fill(Color.white.opacity(0.06))
                            .frame(width: 38, height: 38)
                            .overlay(RoundedRectangle(cornerRadius: AppTheme.Radius.sm).stroke(AppTheme.Color.darkOutline, lineWidth: 1))

                        Image(systemName: icon)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                    }

                    Text(title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)

                    Text(subtitle)
                        .font(.system(size: 11))
                        .foregroundColor(AppTheme.Color.darkSecondary)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .buttonStyle(.plain)
    }
}

// ---------------------------------------------------------------------------
// Side Navigation Drawer
// ---------------------------------------------------------------------------

struct GlassNavigationDrawer: View {
    let user: AppUser
    @Binding var selectedTab: Int
    @Binding var isOpen: Bool
    let onOpenNotifications: () -> Void

    @StateObject private var notesVM = StudentDashboardViewModel()
    @State private var selectedNote: StudentNote? = nil

    var body: some View {
        ZStack(alignment: .leading) {
            Color.black.opacity(0.6)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation(.spring()) { isOpen = false }
                }

            VStack(alignment: .leading, spacing: 0) {
                // User Profile Header
                HStack(spacing: 12) {
                    ZStack(alignment: .bottomTrailing) {
                        Circle()
                            .fill(Color.white.opacity(0.08))
                            .frame(width: 44, height: 44)
                            .overlay(Circle().stroke(AppTheme.Color.darkOutline, lineWidth: 1))
                        Text(String((user.name ?? "U").prefix(1)).uppercased())
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)

                        Circle()
                            .fill(Color(hex: "#22C55E"))
                            .frame(width: 10, height: 10)
                            .overlay(Circle().stroke(AppTheme.Color.darkBackground, lineWidth: 2))
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(user.name ?? "User")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        RoleBadge(role: user.role)
                    }

                    Spacer()

                    Button(action: { withAnimation { isOpen = false } }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                            .padding(8)
                            .background(Circle().fill(Color.white.opacity(0.06)))
                    }
                }
                .padding(.horizontal, AppTheme.Spacing.md)
                .padding(.top, 50)
                .padding(.bottom, AppTheme.Spacing.md)

                Divider().background(AppTheme.Color.darkOutline)

                ScrollView {
                    VStack(alignment: .leading, spacing: 6) {
                        DrawerRow(icon: "house.fill", title: "Home Dashboard", isSelected: selectedTab == 0) {
                            selectedTab = 0; isOpen = false
                        }

                        DrawerRow(icon: "bell.fill", title: "Notice Board", isSelected: selectedTab == 1) {
                            selectedTab = 1; isOpen = false
                        }

                        if user.role.lowercased() == "student" {
                            DrawerRow(icon: "indianrupeesign.circle.fill", title: "Pay Fees", isSelected: selectedTab == 2) {
                                selectedTab = 2; isOpen = false
                            }
                            DrawerRow(icon: "atom", title: "Courses", isSelected: selectedTab == 3) {
                                selectedTab = 3; isOpen = false
                            }
                        } else {
                            DrawerRow(icon: "books.vertical.fill", title: "Library Hub", isSelected: selectedTab == 2) {
                                selectedTab = 2; isOpen = false
                            }
                            DrawerRow(icon: "magnifyingglass", title: "Search Hub", isSelected: selectedTab == 3) {
                                selectedTab = 3; isOpen = false
                            }
                        }

                        DrawerRow(icon: "person.crop.circle.fill", title: "My Profile", isSelected: selectedTab == 4) {
                            selectedTab = 4; isOpen = false
                        }

                        // Student Notes Section (from API)
                        if user.role.lowercased() == "student" {
                            Divider().background(AppTheme.Color.darkOutline).padding(.vertical, 8)

                            Text("MY STUDY NOTES")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(AppTheme.Color.darkSecondary)
                                .padding(.horizontal, AppTheme.Spacing.md)

                            if !notesVM.notes.isEmpty {
                                ForEach(notesVM.notes, id: \.id) { note in
                                    Button(action: { selectedNote = note }) {
                                        HStack(spacing: 8) {
                                            Circle().fill(Color.white.opacity(0.6)).frame(width: 8, height: 8)
                                            VStack(alignment: .leading, spacing: 1) {
                                                Text(note.title ?? "Note").font(.system(size: 13, weight: .medium)).foregroundColor(.white).lineLimit(1)
                                                Text(note.subject ?? "Subject").font(.system(size: 10)).foregroundColor(AppTheme.Color.darkSecondary)
                                            }
                                            Spacer()
                                        }
                                        .padding(.horizontal, AppTheme.Spacing.md)
                                        .padding(.vertical, 6)
                                    }
                                }
                            } else {
                                Text("No study notes yet")
                                    .font(.system(size: 11))
                                    .foregroundColor(AppTheme.Color.darkSecondary)
                                    .padding(.horizontal, AppTheme.Spacing.md)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }

                Divider().background(AppTheme.Color.darkOutline)

                // Drawer Footer
                Button(action: { isOpen = false; onOpenNotifications() }) {
                    HStack(spacing: 10) {
                        Image(systemName: "bell.badge.fill").foregroundColor(AppTheme.Color.darkSecondary)
                        Text("Notification Center").font(.system(size: 13, weight: .medium)).foregroundColor(.white)
                        Spacer()
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .frame(width: 290)
            .background(AppTheme.Color.darkSurface)
            .overlay(
                Rectangle()
                    .fill(AppTheme.Color.darkOutline)
                    .frame(width: 1),
                alignment: .trailing
            )
            .ignoresSafeArea()
        }
        .onAppear {
            notesVM.fetchNotes()
        }
    }
}

private struct DrawerRow: View {
    let icon: String
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 15))
                    .foregroundColor(isSelected ? .white : AppTheme.Color.darkSecondary)
                    .frame(width: 24)

                Text(title)
                    .font(.system(size: 14, weight: isSelected ? .bold : .medium))
                    .foregroundColor(isSelected ? .white : AppTheme.Color.darkSecondary)

                Spacer()
            }
            .padding(.horizontal, AppTheme.Spacing.md)
            .frame(height: 42)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? Color.white.opacity(0.08) : Color.clear)
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Teacher Home Section
// ---------------------------------------------------------------------------

private struct TeacherHomeSection: View {
    @Binding var selectedTab: Int
    let onShowStudentSearch: () -> Void
    let onShowCreateNotice: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            GlassCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Today's Teaching Schedule")
                        .font(AppTheme.Font.headline).foregroundColor(.white)
                    Text("Class 10-A • Mathematics (09:00 AM)")
                        .font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                    Text("Class 12-B • Physics Practical (11:30 AM)")
                        .font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                Text("Teacher Shortcuts")
                    .font(AppTheme.Font.headline).foregroundColor(.white)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    QuickActionGlassCard(icon: "person.2.fill", title: "Search Students", subtitle: "Profiles & records", color: AppTheme.Color.accent, action: onShowStudentSearch)
                    QuickActionGlassCard(icon: "megaphone.fill", title: "Post Notice", subtitle: "Broadcast info", color: AppTheme.Color.success, action: onShowCreateNotice)
                    QuickActionGlassCard(icon: "books.vertical.fill", title: "Library Hub", subtitle: "Search catalogue", color: AppTheme.Color.accentPurple, action: { selectedTab = 2 })
                    QuickActionGlassCard(icon: "doc.text.fill", title: "Exam Marks", subtitle: "Enter student marks", color: AppTheme.Color.warning, action: {})
                }
            }
        }
        .padding(.horizontal, AppTheme.Spacing.md)
    }
}

// ---------------------------------------------------------------------------
// Admin Home Section
// ---------------------------------------------------------------------------

private struct AdminHomeSection: View {
    let onShowSlider: () -> Void
    let onShowCreateNotice: () -> Void
    let onShowUsers: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            GlassCard {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Admin Control Console")
                        .font(AppTheme.Font.headline).foregroundColor(.white)
                    Text("School-wide management: notices, slider banners & accounts.")
                        .font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                Text("Management Hub")
                    .font(AppTheme.Font.headline).foregroundColor(.white)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    QuickActionGlassCard(icon: "photo.stack.fill", title: "Manage Slider", subtitle: "Home banner cards", color: AppTheme.Color.accent, action: onShowSlider)
                    QuickActionGlassCard(icon: "megaphone.fill", title: "Broadcast Notice", subtitle: "Send announcement", color: AppTheme.Color.success, action: onShowCreateNotice)
                    QuickActionGlassCard(icon: "person.3.fill", title: "User Directory", subtitle: "Manage accounts", color: AppTheme.Color.accentPurple, action: onShowUsers)
                    QuickActionGlassCard(icon: "chart.bar.fill", title: "Analytics", subtitle: "Reports & stats", color: AppTheme.Color.warning, action: {})
                }
            }
        }
        .padding(.horizontal, AppTheme.Spacing.md)
    }
}

// ---------------------------------------------------------------------------
// Accounts Home Section
// ---------------------------------------------------------------------------

private struct AccountsHomeSection: View {
    let onShowVerifyReceipt: () -> Void
    let onShowFeeRecords: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            GlassCard {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Accounts & Financial Control")
                        .font(AppTheme.Font.headline).foregroundColor(.white)
                    Text("Track fee collection, verify bank receipts & audit ledger.")
                        .font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                Text("Finance Desk")
                    .font(AppTheme.Font.headline).foregroundColor(.white)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    QuickActionGlassCard(icon: "indianrupeesign.circle.fill", title: "Fee Records", subtitle: "View all dues", color: AppTheme.Color.warning, action: onShowFeeRecords)
                    QuickActionGlassCard(icon: "doc.text.fill", title: "Receipts", subtitle: "Audit verify", color: AppTheme.Color.success, action: onShowVerifyReceipt)
                    QuickActionGlassCard(icon: "person.fill.checkmark", title: "Payments", subtitle: "Offline payments", color: AppTheme.Color.accent, action: {})
                    QuickActionGlassCard(icon: "chart.pie.fill", title: "Reports", subtitle: "Financial records", color: AppTheme.Color.accentPurple, action: {})
                }
            }
        }
        .padding(.horizontal, AppTheme.Spacing.md)
    }
}

// ---------------------------------------------------------------------------
// Profile Tab View
// ---------------------------------------------------------------------------

struct ProfileTabView: View {
    let user: AppUser
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var themeMode: String = "dark"

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        GlassCard {
                            VStack(spacing: AppTheme.Spacing.md) {
                                ZStack {
                                    Circle()
                                        .fill(Color.white.opacity(0.08))
                                        .frame(width: 88, height: 88)
                                        .overlay(Circle().stroke(AppTheme.Color.darkOutline, lineWidth: 1.5))
                                    Text(String((user.name ?? user.email).prefix(1)).uppercased())
                                        .font(.system(size: 36, weight: .bold)).foregroundColor(.white)
                                }

                                VStack(spacing: 4) {
                                    Text(user.name ?? "User")
                                        .font(AppTheme.Font.title3).foregroundColor(.white)
                                    Text(user.email)
                                        .font(AppTheme.Font.footnote).foregroundColor(AppTheme.Color.darkSecondary)
                                    RoleBadge(role: user.role)
                                }

                                Divider().background(AppTheme.Color.darkOutline)

                                VStack(spacing: 0) {
                                    if let username = user.username {
                                        ProfileRow(icon: "at", label: "Username", value: "@\(username)")
                                        Divider().background(AppTheme.Color.darkOutline)
                                    }
                                    ProfileRow(icon: "person.badge.key", label: "Provider", value: user.provider.capitalized)
                                    Divider().background(AppTheme.Color.darkOutline)
                                    ProfileRow(icon: "checkmark.shield", label: "Session", value: "Active (Encrypted)")
                                }
                            }
                        }

                        GlassCard {
                            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                                Text("App Appearance")
                                    .font(AppTheme.Font.headline).foregroundColor(.white)

                                HStack(spacing: 6) {
                                    ForEach(["system", "light", "dark"], id: \.self) { mode in
                                        let selected = themeMode == mode
                                        Button(action: {
                                            themeMode = mode
                                            authViewModel.setThemeMode(mode)
                                        }) {
                                            Text(mode.capitalized)
                                                .font(.system(size: 13, weight: selected ? .bold : .regular))
                                                .foregroundColor(selected ? Color.black : .white)
                                                .frame(maxWidth: .infinity)
                                                .padding(.vertical, 8)
                                                .background(selected ? Color.white : Color.white.opacity(0.06))
                                                .cornerRadius(8)
                                        }
                                    }
                                }
                                .padding(4)
                                .background(Color.black.opacity(0.3))
                                .cornerRadius(10)
                            }
                        }

                        GlassCard {
                            VStack(spacing: 0) {
                                ProfileRow(icon: "envelope", label: "Email", value: user.email)
                                if let cls = user.studentClass {
                                    Divider().background(AppTheme.Color.darkOutline)
                                    ProfileRow(icon: "graduationcap", label: "Class", value: cls)
                                }
                            }
                        }

                        VSButton(title: "Sign Out", style: .destructive) {
                            authViewModel.logout()
                        }
                        .padding(.top, AppTheme.Spacing.xs)
                    }
                    .padding(AppTheme.Spacing.md)
                    .padding(.bottom, 60)
                }
            }
            .navigationTitle("My Profile")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

private struct ProfileRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: AppTheme.Spacing.md) {
            Image(systemName: icon)
                .foregroundColor(AppTheme.Color.darkSecondary)
                .frame(width: 20)
            Text(label)
                .font(AppTheme.Font.subheadline)
                .foregroundColor(AppTheme.Color.darkSecondary)
            Spacer()
            Text(value)
                .font(AppTheme.Font.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .lineLimit(1)
        }
        .padding(.vertical, 12)
    }
}

// ---------------------------------------------------------------------------
// Academic Marks Sheet View
// ---------------------------------------------------------------------------

struct AcademicMarksSheetView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTerm: String = "Term 1 Final"

    struct SubjectMark: Identifiable {
        let id = UUID()
        let name: String
        let score: Int
        let maxScore: Int
        let classAvg: Int
        let grade: String
    }

    let subjects: [SubjectMark] = [
        SubjectMark(name: "Mathematics", score: 95, maxScore: 100, classAvg: 76, grade: "A+"),
        SubjectMark(name: "Physics", score: 91, maxScore: 100, classAvg: 72, grade: "A+"),
        SubjectMark(name: "Chemistry", score: 88, maxScore: 100, classAvg: 69, grade: "A"),
        SubjectMark(name: "Computer Science", score: 98, maxScore: 100, classAvg: 81, grade: "A+"),
        SubjectMark(name: "English Literature", score: 89, maxScore: 100, classAvg: 75, grade: "A")
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        HStack(spacing: 8) {
                            ForEach(["Term 1 Mid", "Term 1 Final", "Term 2 Mid"], id: \.self) { term in
                                let isSel = selectedTerm == term
                                Button(action: { selectedTerm = term }) {
                                    Text(term)
                                        .font(.system(size: 12, weight: isSel ? .bold : .medium))
                                        .foregroundColor(isSel ? .black : .white)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 8)
                                        .background(isSel ? Color.white : Color.white.opacity(0.08))
                                        .cornerRadius(8)
                                }
                            }
                        }
                        .padding(.top, 8)

                        GlassCard {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Overall Score")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                    Text("461 / 500")
                                        .font(.system(size: 32, weight: .bold))
                                        .foregroundColor(.white)
                                    Text("Percentage: 92.2% • Grade: A+")
                                        .font(AppTheme.Font.caption2)
                                        .foregroundColor(AppTheme.Color.success)
                                }
                                Spacer()
                                ZStack {
                                    Circle().stroke(Color.white.opacity(0.08), lineWidth: 8).frame(width: 72, height: 72)
                                    Circle().trim(from: 0, to: 0.922).stroke(Color.white, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                                        .rotationEffect(.degrees(-90)).frame(width: 72, height: 72)
                                    Text("92%").font(.system(size: 14, weight: .bold)).foregroundColor(.white)
                                }
                            }
                        }

                        VStack(spacing: 8) {
                            ForEach(subjects) { sub in
                                GlassCard(padding: 12) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(sub.name).font(.system(size: 14, weight: .bold)).foregroundColor(.white)
                                            Text("Class Average: \(sub.classAvg)%").font(.system(size: 11)).foregroundColor(AppTheme.Color.darkSecondary)
                                        }
                                        Spacer()
                                        VStack(alignment: .trailing, spacing: 2) {
                                            Text("\(sub.score)/\(sub.maxScore)").font(.system(size: 14, weight: .bold)).foregroundColor(.white)
                                            Text(sub.grade).font(.system(size: 11, weight: .bold)).foregroundColor(AppTheme.Color.success)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("Academic Performance")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }.foregroundColor(.white)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Complaint Sheet View
// ---------------------------------------------------------------------------

struct ComplaintSheetView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var subject: String = ""
    @State private var description: String = ""
    @State private var isSubmitting: Bool = false
    @State private var isSuccess: Bool = false

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        if isSuccess {
                            GlassCard {
                                VStack(spacing: 8) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(AppTheme.Color.success)
                                        .font(.system(size: 40))
                                    Text("Ticket Submitted Successfully")
                                        .font(AppTheme.Font.headline)
                                        .foregroundColor(.white)
                                    Text("School administration will review your report within 24 hours.")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                            }
                        }

                        GlassCard {
                            VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                                Text("Student Support & Complaints")
                                    .font(AppTheme.Font.title3)
                                    .foregroundColor(.white)

                                VSTextField(label: "Subject", text: $subject, placeholder: "e.g. Broken bench in Room 204")

                                VStack(alignment: .leading, spacing: AppTheme.Spacing.xs) {
                                    Text("Details")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)

                                    TextEditor(text: $description)
                                        .frame(height: 120)
                                        .foregroundColor(.white)
                                        .padding(8)
                                        .background(Color.white.opacity(0.06))
                                        .cornerRadius(AppTheme.Radius.md)
                                        .overlay(RoundedRectangle(cornerRadius: AppTheme.Radius.md).stroke(AppTheme.Color.darkOutline, lineWidth: 1))
                                }

                                VSButton(title: "Submit Support Ticket", isLoading: isSubmitting) {
                                    guard !subject.isEmpty, !description.isEmpty else { return }
                                    isSubmitting = true
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                                        isSubmitting = false
                                        isSuccess = true
                                    }
                                }
                                .padding(.top, 8)
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("Support Desk")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }.foregroundColor(.white)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Manage Sessions Sheet View
// ---------------------------------------------------------------------------

struct ManageSessionsSheetView: View {
    @Environment(\.dismiss) private var dismiss

    struct SessionDevice: Identifiable {
        let id = UUID()
        let device: String
        let ip: String
        let location: String
        let lastActive: String
        let isCurrent: Bool
    }

    let sessions = [
        SessionDevice(device: "iPhone 15 Pro", ip: "192.168.1.45", location: "New Delhi, IN", lastActive: "Active Now", isCurrent: true),
        SessionDevice(device: "Chrome (MacBook Pro)", ip: "103.21.14.8", location: "New Delhi, IN", lastActive: "2 hours ago", isCurrent: false),
        SessionDevice(device: "Firefox (Linux)", ip: "103.21.14.8", location: "New Delhi, IN", lastActive: "Yesterday", isCurrent: false)
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        GlassCard {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Active Browser & Mobile Sessions")
                                    .font(AppTheme.Font.headline).foregroundColor(.white)
                                Text("Revoke unknown devices to protect your student portal account.")
                                    .font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                            }
                        }

                        VStack(spacing: 8) {
                            ForEach(sessions) { s in
                                GlassCard(padding: 12) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            HStack {
                                                Text(s.device).font(.system(size: 14, weight: .bold)).foregroundColor(.white)
                                                if s.isCurrent {
                                                    GlassPill(text: "CURRENT", color: AppTheme.Color.success)
                                                }
                                            }
                                            Text("\(s.location) • \(s.ip)").font(.system(size: 11)).foregroundColor(AppTheme.Color.darkSecondary)
                                            Text(s.lastActive).font(.system(size: 10)).foregroundColor(Color.white.opacity(0.4))
                                        }
                                        Spacer()
                                        if !s.isCurrent {
                                            Button("Revoke") {}
                                                .font(.system(size: 11, weight: .medium))
                                                .foregroundColor(AppTheme.Color.destructive)
                                                .padding(.horizontal, 10).padding(.vertical, 6)
                                                .background(RoundedRectangle(cornerRadius: 6).stroke(AppTheme.Color.destructive.opacity(0.5), lineWidth: 1))
                                        }
                                    }
                                }
                            }
                        }

                        VSButton(title: "Log Out All Other Devices", style: .destructive) {}
                            .padding(.top, 8)
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("Device Sessions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }.foregroundColor(.white)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Notification History View
// ---------------------------------------------------------------------------

struct NotificationHistoryView: View {
    @Environment(\.dismiss) private var dismiss

    struct NotificationRecord: Identifiable {
        let id = UUID()
        let title: String
        let body: String
        let time: String
        let isUnread: Bool
    }

    let notifications = [
        NotificationRecord(title: "Term 2 Report Card Published", body: "Your marks and attendance percentages for Term 2 are now viewable.", time: "10 mins ago", isUnread: true),
        NotificationRecord(title: "Science Fair 2026 Registration Open", body: "Submit project abstracts by August 25 to Dr. Verma.", time: "2 hours ago", isUnread: true),
        NotificationRecord(title: "Library Due Date Reminder", body: "Concepts of Physics Vol 1 is due tomorrow.", time: "Yesterday", isUnread: false),
        NotificationRecord(title: "School Fees Acknowledgment", body: "Payment for July Installment ₹12,500 successfully verified.", time: "3 days ago", isUnread: false)
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(notifications) { notif in
                            GlassCard(padding: 12) {
                                HStack(spacing: 12) {
                                    ZStack {
                                        Circle().fill(Color.white.opacity(0.06))
                                            .frame(width: 36, height: 36)
                                        Image(systemName: "bell.fill")
                                            .font(.system(size: 14))
                                            .foregroundColor(notif.isUnread ? Color.white : AppTheme.Color.darkSecondary)
                                    }

                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(notif.title)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(.white)
                                        Text(notif.body)
                                            .font(.system(size: 11))
                                            .foregroundColor(AppTheme.Color.darkSecondary)
                                        Text(notif.time)
                                            .font(.system(size: 9))
                                            .foregroundColor(Color.white.opacity(0.4))
                                            .padding(.top, 2)
                                    }
                                    Spacer()
                                }
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("Notifications")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }.foregroundColor(.white)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Courses Tab View (Student Dashboard)
// ---------------------------------------------------------------------------

struct CoursesTabView: View {
    var body: some View {
        ZStack {
            GlassBackground()

            VStack(spacing: AppTheme.Spacing.md) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.08))
                        .frame(width: 80, height: 80)
                        .overlay(Circle().stroke(AppTheme.Color.darkOutline, lineWidth: 1))
                    Image(systemName: "atom")
                        .font(.system(size: 38, weight: .bold))
                        .foregroundColor(.white)
                }

                Text("Courses")
                    .font(AppTheme.Font.title1)
                    .foregroundColor(.white)

                Text("Coming Soon")
                    .font(AppTheme.Font.headline)
                    .foregroundColor(AppTheme.Color.darkSecondary)
            }
            .padding()
        }
    }
}
