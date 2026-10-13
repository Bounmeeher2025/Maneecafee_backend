import { Router } from 'express'
import { z } from 'zod'
import * as ctrl from '../controllers/news.controller.js'
import { NEWS_CATEGORIES } from '../models/index.js'
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../utils/validate.js'

const photoSchema = z.object({
  url: z.string().trim().min(1, 'ກະລຸນາໃສ່ລິ້ງຮູບ').max(500),
  alt: z.string().trim().max(200).optional(),
  position: z.string().trim().max(40).optional(),
})

const newsFields = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'slug ໃຊ້ໄດ້ສະເພາະ a-z, 0-9 ແລະ ຂີດກາງ').max(80),
  category: z.enum(NEWS_CATEGORIES, { message: 'ໝວດຂ່າວບໍ່ຖືກຕ້ອງ' }),
  title: z.string().trim().min(1, 'ກະລຸນາໃສ່ຫົວຂໍ້ຂ່າວ').max(300),
  summary: z.string().trim().max(2000),
  location: z.string().trim().max(300),
  body: z.array(z.string().trim().max(5000)).max(50),
  titleEn: z.string().trim().max(300),
  summaryEn: z.string().trim().max(2000),
  bodyEn: z.array(z.string().trim().max(5000)).max(50),
  locationEn: z.string().trim().max(300),
  images: z.array(photoSchema).max(12),
  imageLabel: z.string().trim().max(200),
  featured: z.boolean(),
  published: z.boolean(),
  publishedAt: z.coerce.date(),
})

const createSchema = newsFields.partial().required({ category: true, title: true })
const updateSchema = newsFields.partial()

const router = Router()

// Public
router.get('/', optionalAuth, ctrl.list)
router.get('/categories', ctrl.categories)
router.get('/featured', optionalAuth, ctrl.featured)
router.get('/:slug', optionalAuth, ctrl.get)

// Admin
router.post('/', requireAuth, validate(createSchema), ctrl.create)
router.put('/:id', requireAuth, validate(updateSchema), ctrl.update)
router.patch('/:id/feature', requireAuth, ctrl.feature)
router.delete('/:id', requireAuth, requireRole('owner'), ctrl.remove)

export default router
