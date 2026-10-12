import http from 'node:http'
import app from './app.js'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'

try {
  await connectDB()
  const server = http.createServer(app)
  server.listen(env.port, () => {
    console.log(`[server] Manee Coffee API listening on http://localhost:${env.port} (${env.nodeEnv})`)
  })
} catch (err) {
  console.error('[server] failed to start:', err.message)
  process.exit(1)
}
