import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const getDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const {
    DB_USER,
    DB_PASSWORD,
    DB_SERVER,
    DB_NAME,
    DB_PORT = '5432'
  } = process.env

  if (process.env.NODE_ENV === "test" || process.env.CI) {
    return "postgres://postgres:postgres@localhost:5432/postgres"
  }

  if (!DB_USER || !DB_PASSWORD || !DB_SERVER || !DB_NAME) {
    throw new Error('Database configuration missing. Required: DB_USER, DB_PASSWORD, DB_SERVER, DB_NAME')
  }

  return `postgres://${DB_USER}:${DB_PASSWORD}@${DB_SERVER}:${DB_PORT}/${DB_NAME}`
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: getDatabaseUrl(),
    http: {
      storeCors: process.env.STORE_CORS || "*",
      adminCors: process.env.ADMIN_CORS || "*",
      authCors: process.env.AUTH_CORS || "*",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  admin: {
    disable: true,
  }
})