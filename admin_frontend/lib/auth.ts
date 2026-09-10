import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './schema'
import { Resend } from 'resend'
import { eq } from 'drizzle-orm'

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  trustedOrigins: [
    'https://vidyaschool.vercel.app',
    'https://*.vercel.app',
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
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
