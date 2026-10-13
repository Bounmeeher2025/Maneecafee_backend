import 'dotenv/config'

const required = ['MONGODB_URI', 'JWT_SECRET']
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

export const env = {
  port: Number(process.env.PORT) || 4002,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  // Secure default: self-registration is closed unless explicitly enabled.
  // The very first user can always register (initial setup), and owners can always create accounts.
  allowPublicRegistration: process.env.ALLOW_PUBLIC_REGISTRATION === 'true',
  // Optional: Google Cloud Translation API key for the dashboard's translate button
  // (without it a keyless public endpoint is used, best effort).
  googleTranslateKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
}
