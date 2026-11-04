import SwiftUI

// ---------------------------------------------------------------------------
// Login Screen — Matches Android LoginScreen.kt with modern iOS Glass UI
// ---------------------------------------------------------------------------

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var email: String = ""
    @State private var password: String = ""
    @State private var shakeError: Bool = false
    @State private var showSignupSheet: Bool = false
    @FocusState private var focusedField: Field?

    enum Field { case email, password }

    var body: some View {
        NavigationStack {
            ZStack {
                // Glass background with dynamic ambient glowing blobs
                GlassBackground()

                VStack(spacing: 0) {
                    // Top Centered Branding (mirrors Android VIDYA School title)
                    VStack(spacing: 6) {
                        Text("VIDYA School")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                            .shadow(color: AppTheme.Color.accent.opacity(0.4), radius: 12, x: 0, y: 4)

                        Text("Empowering Education Everywhere")
                            .font(AppTheme.Font.caption)
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                    .padding(.top, 40)
                    .padding(.bottom, 24)

                    Spacer()

                    // Bottom Glass Drawer Container matching Android BottomDrawer
                    VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                        // Drag Indicator Notch
                        HStack {
                            Spacer()
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.white.opacity(0.3))
                                .frame(width: 40, height: 4)
                            Spacer()
                        }
                        .padding(.top, 8)
                        .padding(.bottom, 4)

                        Text("Welcome back")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)

                        // Error Banner with Glass Styling
                        if let error = authViewModel.errorMessage {
                            HStack(spacing: AppTheme.Spacing.sm) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundColor(AppTheme.Color.destructive)
                                Text(error)
                                    .font(AppTheme.Font.footnote)
                                    .foregroundColor(AppTheme.Color.destructive)
                                Spacer()
                            }
                            .padding(AppTheme.Spacing.md)
                            .background(AppTheme.Color.destructiveMuted.opacity(0.2))
                            .cornerRadius(AppTheme.Radius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                                    .stroke(AppTheme.Color.destructive.opacity(0.4), lineWidth: 1)
                            )
                            .shake(trigger: shakeError)
                        }

                        // Form Fields
                        VStack(spacing: 12) {
                            VSTextField(
                                label: "Email",
                                text: $email,
                                placeholder: "e.g. you@school.edu",
                                keyboardType: .emailAddress,
                                autocapitalization: .never
                            )
                            .focused($focusedField, equals: .email)
                            .submitLabel(.next)
                            .onSubmit { focusedField = .password }

                            VSTextField(
                                label: "Password",
                                text: $password,
                                placeholder: "Enter your password",
                                isSecure: true
                            )
                            .focused($focusedField, equals: .password)
                            .submitLabel(.go)
                            .onSubmit { performLogin() }
                        }

                        // Forgot Password Link
                        HStack {
                            Spacer()
                            Button(action: {
                                // Forgot password action
                            }) {
                                Text("Forgot password?")
                                    .font(AppTheme.Font.caption)
                                    .underline()
                                    .foregroundColor(AppTheme.Color.darkSecondary)
                            }
                        }

                        // Login Primary Button
                        VSButton(
                            title: "Login",
                            isLoading: authViewModel.isLoading
                        ) {
                            performLogin()
                        }
                        .padding(.top, 4)

                        // Horizontal Divider with "OR" text (exact Android parity)
                        HStack(spacing: 12) {
                            Rectangle()
                                .fill(Color.white.opacity(0.12))
                                .frame(height: 1)

                            Text("OR")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(Color(hex: "#71717A"))

                            Rectangle()
                                .fill(Color.white.opacity(0.12))
                                .frame(height: 1)
                        }
                        .padding(.vertical, 4)

                        // Social Auth Buttons Matching Android's SecondaryButton & Vector Icons
                        VStack(spacing: 10) {
                            SocialAuthButton(
                                title: "Continue with Google",
                                iconType: .google
                            ) {
                                // Google Sign-In
                                focusedField = nil
                            }

                            SocialAuthButton(
                                title: "Continue with GitHub",
                                iconType: .github
                            ) {
                                // GitHub Sign-In
                                focusedField = nil
                            }
                        }

                        // Don't have an account link (exact Android wording & style)
                        HStack(spacing: 4) {
                            Spacer()
                            Text("Don't have an account?")
                                .font(.system(size: 13))
                                .foregroundColor(Color(hex: "#71717A"))

                            Button(action: {
                                showSignupSheet = true
                            }) {
                                Text("Create Account")
                                    .font(.system(size: 13, weight: .medium))
                                    .underline()
                                    .foregroundColor(.white)
                            }
                            Spacer()
                        }
                        .padding(.top, 6)
                        .padding(.bottom, 8)
                    }
                    .padding(.horizontal, AppTheme.Spacing.lg)
                    .padding(.bottom, 28)
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
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                            .padding(8)
                            .background(Circle().fill(Color.white.opacity(0.08)))
                    }
                }
            }
            .sheet(isPresented: $showSignupSheet) {
                SignupView()
                    .presentationDetents([.large])
                    .presentationDragIndicator(.visible)
                    .sheetBackground(AppTheme.Color.darkBackground)
            }
        }
        .onChange(of: authViewModel.errorMessage) { error in
            if error != nil {
                withAnimation(.default) { shakeError = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { shakeError = false }
            }
        }
        .onChange(of: authViewModel.isLoggedIn) { loggedIn in
            if loggedIn { dismiss() }
        }
    }

    private func performLogin() {
        focusedField = nil
        authViewModel.resetError()
        Task {
            await authViewModel.login(email: email, password: password)
        }
    }
}

// ---------------------------------------------------------------------------
// Signup Screen — Matches Android SignupScreen.kt with Glass UI
// ---------------------------------------------------------------------------

struct SignupView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var confirmPassword: String = ""
    @State private var localError: String? = nil
    @State private var shakeError: Bool = false
    @FocusState private var focusedField: Field?

    enum Field { case name, email, password, confirm }

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.lg) {
                        // Header
                        VStack(spacing: AppTheme.Spacing.xs) {
                            Text("Create Account")
                                .font(AppTheme.Font.title1)
                                .foregroundColor(.white)
                            Text("Join VIDYA School to access your dashboard")
                                .font(AppTheme.Font.subheadline)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                        }
                        .padding(.top, AppTheme.Spacing.xl)

                        if let error = localError ?? authViewModel.errorMessage {
                            HStack(spacing: AppTheme.Spacing.sm) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundColor(AppTheme.Color.destructive)
                                Text(error)
                                    .font(AppTheme.Font.footnote)
                                    .foregroundColor(AppTheme.Color.destructive)
                                Spacer()
                            }
                            .padding(AppTheme.Spacing.md)
                            .background(AppTheme.Color.destructiveMuted.opacity(0.2))
                            .cornerRadius(AppTheme.Radius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                                    .stroke(AppTheme.Color.destructive.opacity(0.4), lineWidth: 1)
                            )
                            .shake(trigger: shakeError)
                        }

                        // Glass Form Card
                        GlassCard {
                            VStack(spacing: AppTheme.Spacing.md) {
                                VSTextField(label: "Full Name", text: $name, placeholder: "e.g. John Doe")
                                    .focused($focusedField, equals: .name)
                                    .submitLabel(.next)
                                    .onSubmit { focusedField = .email }

                                VSTextField(
                                    label: "Email Address",
                                    text: $email,
                                    placeholder: "you@school.edu",
                                    keyboardType: .emailAddress,
                                    autocapitalization: .never
                                )
                                .focused($focusedField, equals: .email)
                                .submitLabel(.next)
                                .onSubmit { focusedField = .password }

                                VSTextField(
                                    label: "Password",
                                    text: $password,
                                    placeholder: "Min. 8 characters",
                                    isSecure: true
                                )
                                .focused($focusedField, equals: .password)
                                .submitLabel(.next)
                                .onSubmit { focusedField = .confirm }

                                VSTextField(
                                    label: "Confirm Password",
                                    text: $confirmPassword,
                                    placeholder: "Re-enter password",
                                    isSecure: true
                                )
                                .focused($focusedField, equals: .confirm)
                                .submitLabel(.go)
                                .onSubmit { performSignup() }

                                VSButton(title: "Create Account", isLoading: authViewModel.isLoading) {
                                    performSignup()
                                }
                                .padding(.top, 4)
                            }
                        }

                        // Social Sign In Options
                        HStack(spacing: 12) {
                            Rectangle()
                                .fill(Color.white.opacity(0.12))
                                .frame(height: 1)
                            Text("OR")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(Color(hex: "#71717A"))
                            Rectangle()
                                .fill(Color.white.opacity(0.12))
                                .frame(height: 1)
                        }

                        VStack(spacing: 10) {
                            SocialAuthButton(title: "Continue with Google", iconType: .google) {
                                focusedField = nil
                            }
                            SocialAuthButton(title: "Continue with GitHub", iconType: .github) {
                                focusedField = nil
                            }
                        }

                        // Terms text matching Android
                        Text("By continuing, you agree to our Terms & Conditions and Privacy Policy.")
                            .font(.system(size: 11))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, AppTheme.Spacing.md)
                    }
                    .padding(.horizontal, AppTheme.Spacing.lg)
                    .padding(.bottom, AppTheme.Spacing.xl)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                            .padding(8)
                            .background(Circle().fill(Color.white.opacity(0.08)))
                    }
                }
            }
        }
        .onChange(of: authViewModel.isLoggedIn) { loggedIn in
            if loggedIn { dismiss() }
        }
    }

    private func performSignup() {
        focusedField = nil
        localError = nil
        authViewModel.resetError()

        guard !name.isEmpty, !email.isEmpty, !password.isEmpty else {
            localError = "Please fill in all fields."
            triggerShake()
            return
        }
        guard password == confirmPassword else {
            localError = "Passwords do not match."
            triggerShake()
            return
        }
        guard password.count >= 8 else {
            localError = "Password must be at least 8 characters."
            triggerShake()
            return
        }
        Task {
            await authViewModel.login(email: email, password: password)
        }
    }

    private func triggerShake() {
        withAnimation(.default) { shakeError = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { shakeError = false }
    }
}
