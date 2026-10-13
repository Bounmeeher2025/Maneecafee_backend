import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { translateTexts } from '../services/translate.js'
import { validate } from '../utils/validate.js'

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'ແປຖີ່ເກີນໄປ ກະລຸນາລໍຖ້າ 1 ນາທີ' } },
})

const schema = z.object({
  texts: z.array(z.string().max(5000)).min(1).max(60),
  from: z.enum(['lo', 'en']).default('lo'),
  to: z.enum(['lo', 'en']).default('en'),
})

const router = Router()

/** POST /translate { texts: string[], from?: 'lo', to?: 'en' } -> { texts: string[] } (same order) */
router.post('/', limiter, validate(schema), async (req, res) => {
  const { texts, from, to } = req.valid.body
  res.json({ texts: await translateTexts(texts, { from, to }) })
})

export default router
