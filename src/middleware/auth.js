import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  })
}

function extractToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null
}

async function resolveUser(token) {
  const payload = jwt.verify(token, env.jwtSecret)
  const user = await User.findById(payload.sub)
  return user && user.active ? user : null
}

/** Rejects the request unless a valid token for an active user is present. */
export async function requireAuth(req, res, next) {
  const token = extractToken(req)
  if (!token) throw ApiError.unauthorized('Missing access token')

  let user
  try {
    user = await resolveUser(token)
  } catch {
    throw ApiError.unauthorized('Invalid or expired token')
  }
  if (!user) throw ApiError.unauthorized('User not found or disabled')

  req.user = user
  next()
}

/** Attaches req.user when a valid token is present, otherwise continues anonymously. */
export async function optionalAuth(req, res, next) {
  const token = extractToken(req)
  if (token) {
    try {
      req.user = (await resolveUser(token)) ?? undefined
    } catch {
      req.user = undefined
    }
  }
  next()
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw ApiError.forbidden('Insufficient permissions')
  }
  next()
}
