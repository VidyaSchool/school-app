import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './schema'
import { Resend } from 'resend'
import { eq } from 'drizzle-orm'

const resend = new Resend(process.env.RESEND_API_KEY)

const usernameLoginPlugin = {
  id: 'username-login-resolver',
  hooks: {
    before: [
      {
        matcher(context: any) {
          return context.path === '/sign-in/email'
        },
        handler: createAuthMiddleware(async (ctx: any) => {
          if (ctx.body && typeof ctx.body.email === 'string') {
            const rawIdentifier = ctx.body.email.trim()
            // If the identifier does not contain '@', resolve username -> email securely on the server
            if (!rawIdentifier.includes('@')) {
              const cleanUsername = rawIdentifier.toLowerCase()
              try {
                const profile = await db
                  .select({ userId: schema.userProfile.userId })
                  .from(schema.userProfile)
                  .where(eq(schema.userProfile.username, cleanUsername))
                  .limit(1)

                if (profile.length > 0 && profile[0].userId) {
                  const foundUser = await db
                    .select({ email: schema.user.email })
                    .from(schema.user)
                    .where(eq(schema.user.id, profile[0].userId))
                    .limit(1)

                  if (foundUser.length > 0 && foundUser[0].email) {
                    ctx.body.email = foundUser[0].email
                    return
                  }
                }
              } catch (err) {
                console.error('[auth] Error resolving username to email:', err)
              }

              // If username is not found, set a synthetic invalid email address.
              // Better Auth will validate format, execute constant-time dummy password hashing
              // (preventing timing attacks & user enumeration), and return INVALID_EMAIL_OR_PASSWORD.
              const safePrefix = cleanUsername.replace(/[^a-z0-9_-]/g, '') || 'dummy'
              ctx.body.email = `notfound_${safePrefix}@invalid.vidyaschool.internal`
            } else {
              ctx.body.email = rawIdentifier
            }
          }
        }),
      },
    ],
  },
}

export const auth = betterAuth({
  plugins: [usernameLoginPlugin],
  trustedOrigins: [
    'https://vidyaschool.vercel.app',
    'https://*.vercel.app',
    'https://dashboard.vidyaschool.com',
    'https://vidyaschool.com',
    'https://*.vidyaschool.com',
    'https://*.blazeneuro.com',
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ...(process.env.NEXT_PUBLIC_ADMIN_URL ? [process.env.NEXT_PUBLIC_ADMIN_URL] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github'],
      allowDifferentEmails: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 300,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: 'VidyaSchool <noreply@blazeneuro.com>',
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 5 minutes.</p>`,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: 'VidyaSchool <noreply@blazeneuro.com>',
        to: user.email,
        subject: 'Verify your email',
        html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
      })
    },
    sendOnSignUp: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'student',
        input: false,
      },
      preferredRole: {
        type: 'string',
        required: false,
        input: true,
      },
      teacherApprovalStatus: {
        type: 'string',
        required: false,
        defaultValue: 'pending',
        input: false,
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
