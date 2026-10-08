import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { hashPassword } from 'better-auth/crypto'
import { db } from '../lib/db'
import { user as userTable, userProfile as userProfileTable, account as accountTable } from '../lib/schema'
import { eq } from 'drizzle-orm'

function parseClass(raw: string) {
  const trimmed = raw.trim().toUpperCase()
  if (trimmed === 'PRE NURSERY') return { class: 'Pre Nursery', section: 'A' }
  if (trimmed === 'NURSERY') return { class: 'Nursery', section: 'A' }
  if (trimmed === 'KG') return { class: 'KG', section: 'A' }

  const romanMap: Record<string, string> = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
    'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
    'XI': '11', 'XII': '12'
  }

  const parts = trimmed.split('-')
  if (parts.length === 2) {
    const roman = parts[0]
    const sec = parts[1]
    const num = romanMap[roman] || roman
    return { class: num, section: sec }
  }

  return { class: trimmed, section: 'A' }
}

function formatName(raw: string) {
  return raw
    .trim()
    .split(/([/ ])/)
    .map(part => {
      if (part === '/' || part === ' ') return part
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })
    .join('')
}

async function main() {
  const csvPath = path.resolve(process.cwd(), '../teachers_credentials.csv')
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at: ${csvPath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(csvPath, 'utf8')
  const lines = content.trim().split('\n').filter(line => line.trim().length > 0)
  const header = lines[0]
  const rows = lines.slice(1)

  console.log(`\n============================================================`)
  console.log(`Starting bulk teacher registration from: ${csvPath}`)
  console.log(`Found ${rows.length} teacher records in CSV`)
  console.log(`============================================================\n`)

  let createdCount = 0
  let updatedCount = 0
  let failedCount = 0

  const results: any[] = []

  for (const row of rows) {
    const [snoStr, rawClass, rawName, rawUsername, rawPassword] = row.split(',')
    const sno = snoStr.trim()
    const name = formatName(rawName)
    const username = rawUsername.trim().toLowerCase()
    const password = rawPassword.trim()
    const email = `${username}@vidyaschool.com`
    const { class: className, section } = parseClass(rawClass)

    try {
      const hashedPassword = await hashPassword(password)

      // 1. Check if user already exists by email or profile by username
      const existingProfile = await db
        .select()
        .from(userProfileTable)
        .where(eq(userProfileTable.username, username))
        .limit(1)

      let userId = existingProfile[0]?.userId

      if (!userId) {
        const existingUser = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, email))
          .limit(1)
        userId = existingUser[0]?.id
      }

      if (userId) {
        // User exists -> Update existing records
        await db
          .update(userTable)
          .set({
            name,
            role: 'teacher',
            preferredRole: 'teacher',
            teacherApprovalStatus: 'approved',
            emailVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(userTable.id, userId))

        // Check if account exists
        const existingAccount = await db
          .select()
          .from(accountTable)
          .where(eq(accountTable.userId, userId))
          .limit(1)

        if (existingAccount.length > 0) {
          await db
            .update(accountTable)
            .set({
              password: hashedPassword,
              updatedAt: new Date(),
            })
            .where(eq(accountTable.id, existingAccount[0].id))
        } else {
          await db.insert(accountTable).values({
            id: `acc_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
            userId,
            accountId: userId,
            providerId: 'credential',
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }

        // Upsert user profile
        if (existingProfile.length > 0) {
          await db
            .update(userProfileTable)
            .set({
              username,
              class: className,
              section,
              designation: 'Class Teacher',
              secondaryRole: 'teacher',
              onboardingCompleted: true,
              isMailEnabled: true,
              updatedAt: new Date(),
            })
            .where(eq(userProfileTable.id, existingProfile[0].id))
        } else {
          await db.insert(userProfileTable).values({
            id: `prof_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
            userId,
            username,
            class: className,
            section,
            designation: 'Class Teacher',
            secondaryRole: 'teacher',
            onboardingCompleted: true,
            isMailEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }

        updatedCount++
        results.push({ sno, name, username, email, class: className, section, status: 'UPDATED' })
        console.log(`[${sno}/33] Updated: ${name} (${username}) -> Class ${className}-${section}`)
      } else {
        // New user -> Insert user, account, and userProfile
        userId = `tea_${randomUUID().replace(/-/g, '').slice(0, 16)}`

        await db.insert(userTable).values({
          id: userId,
          name,
          email,
          emailVerified: true,
          role: 'teacher',
          preferredRole: 'teacher',
          teacherApprovalStatus: 'approved',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        await db.insert(accountTable).values({
          id: `acc_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
          userId,
          accountId: userId,
          providerId: 'credential',
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        await db.insert(userProfileTable).values({
          id: `prof_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
          userId,
          username,
          class: className,
          section,
          designation: 'Class Teacher',
          secondaryRole: 'teacher',
          onboardingCompleted: true,
          isMailEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        createdCount++
        results.push({ sno, name, username, email, class: className, section, status: 'CREATED' })
        console.log(`[${sno}/33] Created: ${name} (${username}) -> Class ${className}-${section}`)
      }
    } catch (err: any) {
      failedCount++
      console.error(`[${sno}/33] Error registering ${rawName} (${rawUsername}):`, err.message)
      results.push({ sno, name: rawName, username: rawUsername, status: 'FAILED', error: err.message })
    }
  }

  console.log(`\n============================================================`)
  console.log(`Registration Summary:`)
  console.log(`  Total Processed: ${rows.length}`)
  console.log(`  Successfully Created: ${createdCount}`)
  console.log(`  Updated: ${updatedCount}`)
  console.log(`  Failed: ${failedCount}`)
  console.log(`============================================================\n`)

  process.exit(failedCount > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error during registration:', err)
  process.exit(1)
})
