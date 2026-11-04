import SwiftUI

// ---------------------------------------------------------------------------
// Splash / Loading View
// ---------------------------------------------------------------------------

struct SplashView: View {
    @State private var scale: CGFloat = 0.8
    @State private var opacity: Double = 0

    var body: some View {
        ZStack {
            GlassBackground()

            VStack(spacing: AppTheme.Spacing.md) {
                // Logo mark with Glass highlight
                ZStack {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 90, height: 90)
                        .overlay(Circle().stroke(AppTheme.Gradient.glassBorder, lineWidth: 1.5))
                        .shadow(color: AppTheme.Color.accent.opacity(0.35), radius: 16, x: 0, y: 6)

                    Text("VS")
                        .font(.system(size: 34, weight: .bold))
                        .foregroundColor(.white)
                }

                Text("VIDYA School")
                    .font(AppTheme.Font.title1)
                    .foregroundColor(.white)

                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: AppTheme.Color.darkSecondary))
                    .padding(.top, AppTheme.Spacing.md)
            }
            .scaleEffect(scale)
            .opacity(opacity)
            .onAppear {
                withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                    scale = 1.0
                    opacity = 1.0
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Welcome Screen — Matches Android WelcomeScreen.kt with Glass UI
// ---------------------------------------------------------------------------

struct WelcomeView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showLoginSheet = false
    @State private var showSignupSheet = false
    @State private var rotationCw: Double = 0
    @State private var rotationCcw: Double = 360

    var body: some View {
        ZStack {
            // Glass ambient background
            GlassBackground()

            // Revolving backdrop grid orbs (mirrors Android rotating globe backdrop)
            GeometryReader { geo in
                ZStack {
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [Color.white.opacity(0.18), Color.clear, Color.white.opacity(0.08)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1.5
                        )
                        .frame(width: 320, height: 320)
                        .offset(x: -60, y: -60)
                        .rotationEffect(.degrees(rotationCw))

                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [AppTheme.Color.accent.opacity(0.2), Color.clear, AppTheme.Color.accentPurple.opacity(0.15)],
                                startPoint: .top,
                                endPoint: .bottom
                            ),
                            lineWidth: 1.5
                        )
                        .frame(width: 220, height: 220)
                        .position(x: geo.size.width - 20, y: geo.size.height * 0.45)
                        .rotationEffect(.degrees(rotationCcw))
                }
            }
            .ignoresSafeArea()
            .onAppear {
                withAnimation(.linear(duration: 40).repeatForever(autoreverses: false)) {
                    rotationCw = 360
                    rotationCcw = 0
                }
            }

            VStack(spacing: 0) {
                // Centered Hero Branding
                Spacer()

                VStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(.ultraThinMaterial)
                            .frame(width: 96, height: 96)
                            .overlay(Circle().stroke(AppTheme.Gradient.glassBorder, lineWidth: 1.5))
                            .shadow(color: AppTheme.Color.accent.opacity(0.3), radius: 20, x: 0, y: 8)

                        Text("VS")
                            .font(.system(size: 38, weight: .bold))
                            .foregroundColor(.white)
                    }

                    Text("VIDYA School")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)
                        .shadow(color: Color.black.opacity(0.4), radius: 8, x: 0, y: 4)

                    Text("Your complete school management platform")
                        .font(AppTheme.Font.subheadline)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                        .multilineTextAlignment(.center)
                }

                Spacer()

                // Bottom Glass Drawer matching Android BottomDrawer
                VStack(spacing: AppTheme.Spacing.md) {
                    // Feature Pills with Glass styling
                    HStack(spacing: 8) {
                        GlassPill(text: "Library", icon: "books.vertical", color: AppTheme.Color.accent)
                        GlassPill(text: "Fees", icon: "indianrupeesign.circle", color: AppTheme.Color.warning)
                        GlassPill(text: "Notices", icon: "bell", color: AppTheme.Color.success)
                    }
                    .padding(.bottom, 6)

                    VSButton(title: "Login") {
                        showLoginSheet = true
                    }

                    VSButton(title: "Create Account", style: .secondary) {
                        showSignupSheet = true
                    }

                    // Terms text matching Android annotated string
                    HStack(spacing: 4) {
                        Text("By continuing, you agree to our")
                            .font(.system(size: 11))
                            .foregroundColor(Color(hex: "#71717A"))

                        Link("Terms & Conditions", destination: URL(string: "https://vidyaschool.vercel.app/docs/terms-of-service")!)
                            .font(.system(size: 11, weight: .medium))
                            .underline()
                            .foregroundColor(.white)
                    }
                    .multilineTextAlignment(.center)
                    .padding(.top, 4)
                }
                .padding(.horizontal, AppTheme.Spacing.lg)
                .padding(.top, 24)
                .padding(.bottom, 36)
                .background(
                    ZStack {
                        UnevenRoundedRectangle(
                            topLeadingRadius: 24,
                            topTrailingRadius: 24
                        )
                        .fill(.ultraThinMaterial)
                        .opacity(0.95)

                        UnevenRoundedRectangle(
                            topLeadingRadius: 24,
                            topTrailingRadius: 24
                        )
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(hex: "#18181B").opacity(0.92),
                                    Color(hex: "#09090B").opacity(0.98)
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                    }
                )
                .overlay(
                    UnevenRoundedRectangle(
                        topLeadingRadius: 24,
                        topTrailingRadius: 24
                    )
                    .stroke(
                        LinearGradient(
                            colors: [Color.white.opacity(0.25), Color.white.opacity(0.05)],
                            startPoint: .top,
                            endPoint: .bottom
                        ),
                        lineWidth: 1
                    )
                )
            }
        }
        .sheet(isPresented: $showLoginSheet) {
            LoginView()
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
                .sheetBackground(AppTheme.Color.darkBackground)
        }
        .sheet(isPresented: $showSignupSheet) {
            SignupView()
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
                .sheetBackground(AppTheme.Color.darkBackground)
        }
    }
}

