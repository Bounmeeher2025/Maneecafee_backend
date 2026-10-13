import multer from 'multer'
import { MAX_IMAGE_BYTES } from '../config/uploads.js'
import { isSupportedImage } from '../config/storage.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Single-image multer parser (JPG/PNG/WEBP/GIF, 5MB). The file is kept in memory
 * (req.file.buffer) so the route can write it to the database — see config/storage.js.
 */
export function imageUpload() {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    fileFilter: (req, file, cb) => {
      if (isSupportedImage(file.mimetype)) cb(null, true)
      else cb(ApiError.badRequest('ຮອງຮັບສະເພາະຮູບ JPG, PNG, WEBP ຫຼື GIF'))
    },
  })
}
