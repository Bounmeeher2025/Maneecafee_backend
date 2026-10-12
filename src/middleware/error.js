import { ApiError } from '../utils/ApiError.js'

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`))
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500
  let message = err.message || 'Internal server error'
  let details = err.details

  if (err.name === 'ValidationError' && err.errors) {
    status = 400
    message = 'Validation failed'
    details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }))
  } else if (err.name === 'CastError') {
    status = 400
    message = `Invalid value for "${err.path}"`
  } else if (err.code === 11000) {
    status = 409
    message = 'Duplicate value'
    details = err.keyValue
  } else if (err.name === 'MulterError') {
    status = 400
    message = err.code === 'LIMIT_FILE_SIZE' ? 'ຮູບໃຫຍ່ເກີນ 5MB ກະລຸນາເລືອກຮູບທີ່ນ້ອຍກວ່ານີ້' : 'ອັບໂຫຼດຮູບບໍ່ສຳເລັດ'
  } else if (err.type === 'entity.parse.failed') {
    status = 400
    message = 'Invalid JSON body'
  }

  if (status >= 500) console.error('[error]', err)

  res.status(status).json({ error: { message, ...(details ? { details } : {}) } })
}
