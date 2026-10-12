import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import authRoutes from './auth.routes.js'
import newsRoutes from './news.routes.js'
import farmsRoutes from './farms.routes.js'
import uploadsRoutes from './uploads.routes.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'maneecaffee-api', time: new Date().toISOString() })
})

router.use('/auth', authRoutes)

// Reading news and farms is public (the website calls these); writing needs a JWT (checked per route).
router.use('/news', newsRoutes)
router.use('/farms', farmsRoutes)

// Image uploads always need a logged-in user.
router.use('/uploads', requireAuth, uploadsRoutes)

export default router
