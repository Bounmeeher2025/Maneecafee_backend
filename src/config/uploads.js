import fs from 'node:fs'
import path from 'node:path'

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')
export const NEWS_IMAGES_DIR = path.join(UPLOADS_DIR, 'news')
export const NEWS_IMAGES_URL = '/uploads/news'
export const FARM_IMAGES_DIR = path.join(UPLOADS_DIR, 'farms')
export const FARM_IMAGES_URL = '/uploads/farms'
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

fs.mkdirSync(NEWS_IMAGES_DIR, { recursive: true })
fs.mkdirSync(FARM_IMAGES_DIR, { recursive: true })
