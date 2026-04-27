const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const isBuildTime = process.env.CI === "true"

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  if (isBuildTime) {
    console.log("Using default database URL for build time")
    return "postgres://postgres:postgres@localhost:5432/postgres"
  }

  const {
    DB_USER,
    DB_PASSWORD,
    DB_SERVER,
    DB_NAME,
    DB_PORT = "5432",
  } = process.env

  if (!DB_USER || !DB_PASSWORD || !DB_SERVER || !DB_NAME) {
    console.log("Database configuration missing. Required: DB_USER, DB_PASSWORD, DB_SERVER, DB_NAME")
    throw new Error('Database configuration missing. Required: DB_USER, DB_PASSWORD, DB_SERVER, DB_NAME')
  }

  const dbUrl = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_SERVER}:${DB_PORT}/${DB_NAME}?sslmode=require`;
  console.log(`Using database AWS URL:`);
  return dbUrl;
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: getDatabaseUrl(),
    databaseDriverOptions: {
      connection: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    },
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
  },
})