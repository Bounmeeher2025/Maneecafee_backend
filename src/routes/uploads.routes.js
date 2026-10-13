import { Router } from 'express'
import { imageUpload } from '../middleware/imageUpload.js'
import { makeFilename, saveFile } from '../config/storage.js'
import { ApiError } from '../utils/ApiError.js'

const upload = imageUpload()

/** multipart/form-data with field "image" -> { url, size, mimeType }; the photo is stored in the database */
const store = (kind) => async (req, res) => {
  if (!req.file) throw ApiError.badRequest('ກະລຸນາເລືອກຮູບ')
  const result = await saveFile({
    kind,
    filename: makeFilename(req.file.mimetype),
    contentType: req.file.mimetype,
    buffer: req.file.buffer,
  })
  res.status(201).json(result)
}

const router = Router()
router.post('/news', upload.single('image'), store('news')) // photos for a news story
router.post('/farms', upload.single('image'), store('farms')) // photos for a farm

export default router
