import { getDBConnectionString } from '@zodiac/env'
import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env' })

export default defineConfig({
  schema: './db/schema',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDBConnectionString(),
  },
})
