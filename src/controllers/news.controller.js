import mongoose from 'mongoose'
import { News, NEWS_CATEGORIES } from '../models/index.js'
import { ApiError } from '../utils/ApiError.js'
import { paging } from '../utils/pagination.js'
import { slugify, uniqueSlug } from '../utils/slug.js'

/** Visitors only see published stories; a logged-in user may ask for drafts too. */
const visibleFilter = (req) => (req.user && req.query.includeUnpublished ? {} : { published: true })

async function findBySlugOrId(value, filter) {
  const bySlug = await News.findOne({ slug: value, ...filter })
  if (bySlug) return bySlug
  if (!mongoose.isValidObjectId(value)) return null
  return News.findOne({ _id: value, ...filter })
}

/** Clears the flag on every other story so only one is featured at a time. */
const unfeatureOthers = (keepId) => News.updateMany({ _id: { $ne: keepId }, featured: true }, { featured: false })

export async function list(req, res) {
  const { category, featured } = req.query
  const { page, limit, skip } = paging(req.query)
  const filter = visibleFilter(req)
  if (category) filter.category = category
  if (featured === 'true') filter.featured = true

  const [items, total] = await Promise.all([
    News.find(filter).sort({ featured: -1, publishedAt: -1 }).skip(skip).limit(limit),
    News.countDocuments(filter),
  ])
  res.json({ items, total, page, limit, categories: NEWS_CATEGORIES })
}

/** The story shown in the big card at the top of the news page (image, title, summary, date). */
export async function featured(req, res) {
  const filter = visibleFilter(req)
  const item =
    (await News.findOne({ ...filter, featured: true }).sort({ publishedAt: -1 })) ??
    (await News.findOne(filter).sort({ publishedAt: -1 })) // nothing flagged: the newest story stands in
  if (!item) throw ApiError.notFound('ຍັງບໍ່ມີຂ່າວເດັ່ນ')
  res.json(item)
}

export async function categories(req, res) {
  res.json({ items: NEWS_CATEGORIES })
}

export async function get(req, res) {
  const item = await findBySlugOrId(req.params.slug, visibleFilter(req))
  if (!item) throw ApiError.notFound('ບໍ່ພົບຂ່າວນີ້')
  res.json(item)
}

export async function create(req, res) {
  const body = req.valid.body
  const slug = await uniqueSlug(News, body.slug || slugify(body.title, 'news'))
  const item = await News.create({ ...body, slug })
  if (item.featured) await unfeatureOthers(item._id)
  res.status(201).json(item)
}

export async function update(req, res) {
  const item = await News.findById(req.params.id)
  if (!item) throw ApiError.notFound('ບໍ່ພົບຂ່າວນີ້')
  const body = req.valid.body
  if (body.slug && body.slug !== item.slug) body.slug = await uniqueSlug(News, body.slug, item._id)
  Object.assign(item, body)
  await item.save()
  if (item.featured) await unfeatureOthers(item._id)
  res.json(item)
}

/** Makes this story the featured one (and un-features the previous one). */
export async function feature(req, res) {
  const item = await News.findById(req.params.id)
  if (!item) throw ApiError.notFound('ບໍ່ພົບຂ່າວນີ້')
  item.featured = true
  await item.save()
  await unfeatureOthers(item._id)
  res.json(item)
}

export async function remove(req, res) {
  const item = await News.findByIdAndDelete(req.params.id)
  if (!item) throw ApiError.notFound('ບໍ່ພົບຂ່າວນີ້')
  res.json({ ok: true })
}
