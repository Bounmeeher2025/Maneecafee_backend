import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { UPLOADS_DIR } from './config/uploads.js'
import { serveUpload } from './config/storage.js'
import { notFound, errorHandler } from './middleware/error.js'

const app = express()

app.disable('x-powered-by')
// CORS: the origins from .env, plus any local address while developing
// (localhost, 127.0.0.1 or a LAN IP on any port), so the site works however it is opened.
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || env.corsOrigin.includes(origin)) return cb(null, true)
      if (env.nodeEnv !== 'production' && LOCAL_ORIGIN.test(origin)) return cb(null, true)
      return cb(null, false)
    },
  }),
)
app.use(express.json({ limit: '1mb' }))
if (env.nodeEnv !== 'test') app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

// Uploaded photos are public. They live in the database (see config/storage.js); the local
// uploads/ folder is only a fallback for files from before that change.
app.get('/uploads/:kind/:name', serveUpload)
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d', index: false, setHeaders: (res) => res.set('X-Served-From', 'disk') }))

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app
