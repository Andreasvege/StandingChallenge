import { loadEnvConfig } from '@next/env'
import { defineConfig } from 'drizzle-kit'

// Local commands use .env.development.local (the Neon "dev" branch). DB_TARGET=prod uses .env.local.
const isProd = process.env.DB_TARGET === 'prod'
loadEnvConfig(process.cwd(), !isProd)

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL mangler')
console.log(`drizzle-kit → ${isProd ? 'PRODUKSJON' : 'dev'}: ${new URL(url).host}`)

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
})
