import { Router } from 'express'
import { NEWS_IMAGES_DIR, NEWS_IMAGES_URL, FARM_IMAGES_DIR, FARM_IMAGES_URL } from '../config/uploads.js'
import { imageUpload, uploadedFileJson } from '../middleware/imageUpload.js'
import { ApiError } from '../utils/ApiError.js'

const newsUpload = imageUpload(NEWS_IMAGES_DIR)
const farmUpload = imageUpload(FARM_IMAGES_DIR)

const router = Router()

/** multipart/form-data with field "image" -> { url } to store on a news story */
router.post('/news', newsUpload.single('image'), (req, res) => {
  if (!req.file) throw ApiError.badRequest('ກະລຸນາເລືອກຮູບ')
  res.status(201).json(uploadedFileJson(req.file, NEWS_IMAGES_URL))
})

/** multipart/form-data with field "image" -> { url } to store on a farm */
router.post('/farms', farmUpload.single('image'), (req, res) => {
  if (!req.file) throw ApiError.badRequest('ກະລຸນາເລືອກຮູບ')
  res.status(201).json(uploadedFileJson(req.file, FARM_IMAGES_URL))
})

export default router
