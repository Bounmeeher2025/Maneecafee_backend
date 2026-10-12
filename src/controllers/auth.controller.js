import { User } from '../models/index.js'
import { env } from '../config/env.js'
import { signToken } from '../middleware/auth.js'
import { ApiError } from '../utils/ApiError.js'

const ROLE_LABELS = { owner: 'ຜູ້ດູແລລະບົບ', staff: 'ພະນັກງານ' }

export async function login(req, res) {
  const { username, password } = req.valid.body
  const user = await User.findOne({ username: username.toLowerCase() })
  if (!user || !user.active || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ')
  }
  res.json({ token: signToken(user), user })
}

/** Tells the client whether the register form should be offered. */
export async function registerStatus(req, res) {
  const userCount = await User.countDocuments()
  const needsSetup = userCount === 0
  res.json({ needsSetup, open: needsSetup || env.allowPublicRegistration })
}

/**
 * Register an account.
 *  - No users yet            -> anyone may create the first owner (initial setup).
 *  - Public registration on  -> anyone may create an owner (admin) account.
 *  - Logged-in owner         -> may create owner or staff accounts (default staff).
 */
export async function register(req, res) {
  const { name, username, password, role } = req.valid.body
  const actorIsOwner = req.user?.role === 'owner'
  const isFirstUser = (await User.countDocuments()) === 0

  if (!isFirstUser && !actorIsOwner && !env.allowPublicRegistration) {
    throw ApiError.forbidden('ການລົງທະບຽນຖືກປິດຢູ່ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບເພື່ອສ້າງບັນຊີ')
  }

  if (await User.exists({ username })) {
    throw ApiError.conflict('ຊື່ຜູ້ໃຊ້ນີ້ຖືກໃຊ້ແລ້ວ ກະລຸນາເລືອກຊື່ອື່ນ')
  }

  const finalRole = actorIsOwner ? role ?? 'staff' : 'owner'
  const user = await User.create({
    name,
    username,
    passwordHash: await User.hashPassword(password),
    role: finalRole,
    roleLabel: ROLE_LABELS[finalRole],
  })

  // An owner creating someone else's account should not receive that person's token.
  if (actorIsOwner) return res.status(201).json({ user })
  res.status(201).json({ token: signToken(user), user })
}

export async function me(req, res) {
  res.json({ user: req.user })
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.valid.body
  if (!(await req.user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('ລະຫັດຜ່ານປັດຈຸບັນບໍ່ຖືກຕ້ອງ')
  }
  req.user.passwordHash = await User.hashPassword(newPassword)
  await req.user.save()
  res.json({ ok: true })
}
