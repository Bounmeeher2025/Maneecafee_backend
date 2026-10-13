import crypto from 'node:crypto'
import mongoose from 'mongoose'

/**
 * Uploaded photos live in MongoDB (GridFS bucket "uploads"), not on the server's disk.
 * Railway's filesystem is wiped on every deploy and is not shared with a developer's
 * laptop, so disk storage made photos disappear; the database is shared and persistent.
 *
 * A file is stored under the name "<kind>/<filename>" (e.g. "news/1791…-ab12.jpg") and is
 * served at "/uploads/<kind>/<filename>", the same URL shape the records already use.
 */
export const UPLOAD_KINDS = ['news', 'farms']

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

export const extensionFor = (mimeType) => EXTENSIONS[mimeType]
export const isSupportedImage = (mimeType) => Boolean(EXTENSIONS[mimeType])

/** Random, collision-free file name: <timestamp>-<12 hex>.<ext> */
export const makeFilename = (mimeType) => `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extensionFor(mimeType)}`

export const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' })

const storedName = (kind, filename) => `${kind}/${filename}`

/** GridFS file document for "<kind>/<filename>", or null. */
export async function findFile(kind, filename) {
  const [file] = await bucket().find({ filename: storedName(kind, filename) }).limit(1).toArray()
  return file ?? null
}

/** Writes a buffer into GridFS and returns its public url. Existing names are replaced. */
export async function saveFile({ kind, filename, contentType, buffer }) {
  if (!UPLOAD_KINDS.includes(kind)) throw new Error(`Unknown upload kind "${kind}"`)
  const existing = await findFile(kind, filename)
  if (existing) await bucket().delete(existing._id)
  await new Promise((resolve, reject) => {
    const stream = bucket().openUploadStream(storedName(kind, filename), { contentType, metadata: { kind, contentType } })
    stream.on('error', reject)
    stream.on('finish', resolve)
    stream.end(buffer)
  })
  return { url: `/uploads/${kind}/${filename}`, size: buffer.length, mimeType: contentType }
}

export async function deleteFile(kind, filename) {
  const file = await findFile(kind, filename)
  if (file) await bucket().delete(file._id)
  return Boolean(file)
}

const SAFE_NAME = /^[A-Za-z0-9][\w.-]*$/

/**
 * Express handler for GET /uploads/:kind/:name — streams the photo from the database.
 * Falls through (next()) when the file is not in the database so the disk fallback can try.
 */
export async function serveUpload(req, res, next) {
  const { kind, name } = req.params
  if (!UPLOAD_KINDS.includes(kind) || !SAFE_NAME.test(name)) return next()
  try {
    const file = await findFile(kind, name)
    if (!file) return next()
    res.set({
      'Content-Type': file.metadata?.contentType || file.contentType || 'application/octet-stream',
      'Content-Length': file.length,
      'Cache-Control': 'public, max-age=604800, immutable', // names are unique, so the content never changes
      'X-Served-From': 'database',
    })
    bucket()
      .openDownloadStream(file._id)
      .on('error', next)
      .pipe(res)
  } catch (err) {
    next(err)
  }
}
