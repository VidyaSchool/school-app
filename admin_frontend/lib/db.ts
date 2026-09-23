import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || ''

// Global cache to prevent connection exhaustion in serverless / development hot-reload
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const client =
  globalForDb.conn ??
  postgres(connectionString, {
    ssl: 'require',
    max: process.env.NODE_ENV === 'production' ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = client
}

export const db = drizzle(client, { schema })
