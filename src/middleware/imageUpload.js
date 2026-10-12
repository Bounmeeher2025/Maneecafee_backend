import crypto from 'node:crypto'
import multer from 'multer'
import { MAX_IMAGE_BYTES } from '../config/uploads.js'
import { ApiError } from '../utils/ApiError.js'

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

/** Single-image multer uploader (JPG/PNG/WEBP/GIF, 5MB) that stores files in `dir` with random names. */
export function imageUpload(dir) {
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${EXTENSIONS[file.mimetype]}`),
    }),
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    fileFilter: (req, file, cb) => {
      if (EXTENSIONS[file.mimetype]) cb(null, true)
      else cb(ApiError.badRequest('ຮອງຮັບສະເພາະຮູບ JPG, PNG, WEBP ຫຼື GIF'))
    },
  })
}

export const uploadedFileJson = (file, baseUrl) => ({ url: `${baseUrl}/${file.filename}`, size: file.size, mimeType: file.mimetype })
