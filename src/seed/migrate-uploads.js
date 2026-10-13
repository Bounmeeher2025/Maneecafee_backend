/**
 * One-off: copies every photo still sitting in the local uploads/ folder into the database
 * (GridFS), so photos uploaded while the API ran on a laptop also show on the hosted API.
 *
 *   npm run migrate-uploads
 *
 * Safe to run again: files already in the database are skipped.
 */
import fs from 'node:fs'
import path from 'node:path'
import { connectDB, disconnectDB } from '../config/db.js'
import { UPLOADS_DIR } from '../config/uploads.js'
import { UPLOAD_KINDS, findFile, saveFile } from '../config/storage.js'

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' }

try {
  await connectDB()
  let copied = 0
  let skipped = 0
  for (const kind of UPLOAD_KINDS) {
    const dir = path.join(UPLOADS_DIR, kind)
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      const contentType = MIME[path.extname(name).toLowerCase()]
      if (!contentType) continue
      if (await findFile(kind, name)) {
        skipped += 1
        continue
      }
      await saveFile({ kind, filename: name, contentType, buffer: fs.readFileSync(path.join(dir, name)) })
      console.log(`[migrate] ${kind}/${name} -> database`)
      copied += 1
    }
  }
  console.log(`[migrate] done: ${copied} copied, ${skipped} already in the database`)
} catch (err) {
  console.error('[migrate] failed:', err)
  process.exitCode = 1
} finally {
  await disconnectDB()
}
