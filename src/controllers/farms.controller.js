import mongoose from 'mongoose'
import { Farm } from '../models/index.js'
import { ApiError } from '../utils/ApiError.js'
import { slugify, uniqueSlug } from '../utils/slug.js'

const visibleFilter = (req) => (req.user && req.query.includeUnpublished ? {} : { published: true })

// Nested groups are merged field by field on update, so a client can send just { facts: { area: '150 ເຮັກຕາ' } }
const NESTED = ['facts', 'story', 'quote', 'product']

async function findBySlugOrId(value, filter) {
  const bySlug = await Farm.findOne({ slug: value, ...filter })
  if (bySlug) return bySlug
  if (!mongoose.isValidObjectId(value)) return null
  return Farm.findOne({ _id: value, ...filter })
}

export async function list(req, res) {
  const items = await Farm.find(visibleFilter(req)).sort({ sortOrder: 1, createdAt: 1 })
  res.json({ items, total: items.length })
}

export async function get(req, res) {
  const farm = await findBySlugOrId(req.params.slug, visibleFilter(req))
  if (!farm) throw ApiError.notFound('ບໍ່ພົບຂໍ້ມູນສວນນີ້')
  res.json(farm)
}

export async function create(req, res) {
  const body = req.valid.body
  const slug = await uniqueSlug(Farm, body.slug || slugify(body.name, 'farm'))
  let sortOrder = body.sortOrder
  if (sortOrder === undefined) {
    const last = await Farm.findOne().sort({ sortOrder: -1 }).select('sortOrder')
    sortOrder = (last?.sortOrder ?? 0) + 1 // new farms go to the end of the list
  }
  const farm = await Farm.create({ ...body, slug, sortOrder })
  res.status(201).json(farm)
}

export async function update(req, res) {
  const farm = await Farm.findById(req.params.id)
  if (!farm) throw ApiError.notFound('ບໍ່ພົບຂໍ້ມູນສວນນີ້')
  const body = req.valid.body
  if (body.slug && body.slug !== farm.slug) body.slug = await uniqueSlug(Farm, body.slug, farm._id)
  for (const [key, value] of Object.entries(body)) {
    if (NESTED.includes(key) && value && typeof value === 'object') {
      farm[key] = { ...farm[key]?.toObject?.(), ...value }
    } else {
      farm[key] = value
    }
  }
  await farm.save()
  res.json(farm)
}

export async function remove(req, res) {
  const farm = await Farm.findByIdAndDelete(req.params.id)
  if (!farm) throw ApiError.notFound('ບໍ່ພົບຂໍ້ມູນສວນນີ້')
  res.json({ ok: true })
}
