const { loadEnv, defineConfig, Modules } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const isBuildTime = process.env.CI === "true"
const isProduction = process.env.NODE_ENV === "production"
const brandModulePath = "./src/modules/brand"
const productModulePath = "./src/modules/products"

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

  const dbUrl = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_SERVER}:${DB_PORT}/${DB_NAME}`;
  console.log(`Using database AWS URL:`);
  return dbUrl;
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: getDatabaseUrl(),
    databaseDriverOptions: isProduction ? {
      connection: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    } : {},
    http: {
      storeCors: process.env.STORE_CORS || "*",
      adminCors: process.env.ADMIN_CORS || "*",
      authCors: process.env.AUTH_CORS || "*",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    cookieOptions: isProduction ? {
      secure: true,
      sameSite: "lax",
      httpOnly: true,
    } : undefined,
  },
  modules: [
    {
      resolve: brandModulePath,
    },
    {
      resolve: productModulePath,
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/payment-finance",
            id: "payment-finance",
            options: {
              clientName: "Digital Canteen Medusa",
            },
          },
          {
            resolve: "./src/modules/bt-payment",
            id: "bt-payment",
            options: {
              clientName: "Digital Canteen Medusa",
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/prisoner",
      definition: {
        isQueryable: true,
      },
    },
  ],
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL !== undefined ? process.env.MEDUSA_BACKEND_URL : "http://localhost:9000",
  }
})