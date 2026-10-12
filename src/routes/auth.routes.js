import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import * as ctrl from '../controllers/auth.controller.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { validate } from '../utils/validate.js'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'ພະຍາຍາມຫຼາຍເກີນໄປ ກະລຸນາລອງໃໝ່ໃນອີກ 15 ນາທີ' } },
})

const loginSchema = z.object({
  username: z.string().trim().min(1, 'ກະລຸນາໃສ່ຊື່ຜູ້ໃຊ້'),
  password: z.string().min(1, 'ກະລຸນາໃສ່ລະຫັດຜ່ານ'),
})

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'ກະລຸນາໃສ່ຊື່ຢ່າງໜ້ອຍ 2 ຕົວອັກສອນ').max(80),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, 'ຊື່ຜູ້ໃຊ້ຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ')
      .max(30, 'ຊື່ຜູ້ໃຊ້ຕ້ອງບໍ່ເກີນ 30 ຕົວອັກສອນ')
      .regex(/^[a-z0-9._-]+$/, 'ຊື່ຜູ້ໃຊ້ໃຊ້ໄດ້ສະເພາະ a-z, 0-9, ຈຸດ, ຂີດກ້ອງ ແລະ ຂີດກາງ'),
    password: z.string().min(6, 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ').max(72),
    confirmPassword: z.string().optional(),
    role: z.enum(['owner', 'staff']).optional(),
  })
  .refine((d) => d.confirmPassword === undefined || d.confirmPassword === d.password, {
    message: 'ລະຫັດຜ່ານບໍ່ຕົງກັນ',
    path: ['confirmPassword'],
  })

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ'),
})

const router = Router()
router.post('/login', authLimiter, validate(loginSchema), ctrl.login)
router.get('/register/status', ctrl.registerStatus)
router.post('/register', authLimiter, optionalAuth, validate(registerSchema), ctrl.register)
router.get('/me', requireAuth, ctrl.me)
router.post('/change-password', requireAuth, validate(changePasswordSchema), ctrl.changePassword)

export default router
