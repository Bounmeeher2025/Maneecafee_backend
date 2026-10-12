import { Router } from 'express'
import { z } from 'zod'
import * as ctrl from '../controllers/farms.controller.js'
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../utils/validate.js'

const text = (max) => z.string().trim().max(max)

const photoSchema = z.object({
  url: z.string().trim().min(1, 'ກະລຸນາໃສ່ລິ້ງຮູບ').max(500),
  alt: text(200).optional(),
  position: text(40).optional(),
})

const farmFields = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'slug ໃຊ້ໄດ້ສະເພາະ a-z, 0-9 ແລະ ຂີດກາງ').max(80),
  name: z.string().trim().min(1, 'ກະລຸນາໃສ່ຊື່ສວນ').max(200),
  location: text(300),
  tagline: text(500),
  image: photoSchema.nullable(),
  heroImages: z.array(photoSchema).max(4),
  description: text(3000),
  facts: z
    .object({
      altitude: text(100),
      variety: text(100),
      process: text(200),
      harvest: text(100),
      area: text(100),
      caretaker: text(200),
    })
    .partial(),
  story: z.object({ title: text(300), paragraphs: z.array(text(5000)).max(20) }).partial(),
  timeline: z.array(z.object({ year: text(40), title: text(200), text: text(1000) }).partial()).max(12),
  quote: z.object({ image: photoSchema.nullable(), text: text(1000), author: text(200), role: text(200) }).partial(),
  product: z
    .object({
      roast: text(100),
      notes: z.array(text(100)).max(8),
      brewing: text(1000),
      price: text(100),
      images: z.array(z.object({ url: text(500), label: text(200) }).partial()).max(8),
    })
    .partial(),
  sortOrder: z.coerce.number().int().min(0),
  published: z.boolean(),
})

const createSchema = farmFields.partial().required({ name: true })
const updateSchema = farmFields.partial()

const router = Router()

// Public
router.get('/', optionalAuth, ctrl.list)
router.get('/:slug', optionalAuth, ctrl.get)

// Admin
router.post('/', requireAuth, validate(createSchema), ctrl.create)
router.put('/:id', requireAuth, validate(updateSchema), ctrl.update)
router.delete('/:id', requireAuth, requireRole('owner'), ctrl.remove)

export default router
