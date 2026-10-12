import { ApiError } from './ApiError.js'

/**
 * Validates req[source] against a zod schema.
 * Parsed data is stored on req.valid[source] (req.query is read-only in Express 5).
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {})
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    return next(ApiError.badRequest('Validation failed', details))
  }
  req.valid = { ...(req.valid || {}), [source]: result.data }
  next()
}
