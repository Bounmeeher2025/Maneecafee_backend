import mongoose from 'mongoose'

/** Filter pills on the news page. A story's `category` must be one of these. */
export const NEWS_CATEGORIES = ['ຊ່ວຍເຫຼືອຊຸມຊົນ', 'ບໍລິຈາກໂຮງຮຽນ', 'ຂ່າວສວນ ແລະ ຮ້ານ']

// `position` is the CSS object-position used when the photo is cropped (e.g. "center 30%" keeps faces)
const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: 'center' },
  },
  { _id: false },
)

const newsSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true, enum: NEWS_CATEGORIES },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' }, // where the activity took place
    body: { type: [String], default: [] }, // one entry per paragraph
    // optional English version (the website shows it when the visitor chooses English)
    titleEn: { type: String, trim: true, default: '' },
    summaryEn: { type: String, trim: true, default: '' },
    bodyEn: { type: [String], default: [] },
    locationEn: { type: String, trim: true, default: '' },
    images: { type: [photoSchema], default: [] }, // first one shows on the card, all of them on the story page
    imageLabel: { type: String, trim: true, default: 'ຮູບພາບຂ່າວ' }, // placeholder text while there is no photo
    featured: { type: Boolean, default: false }, // the big card at the top of the news page (only one at a time)
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

newsSchema.index({ published: 1, featured: -1, publishedAt: -1 })
newsSchema.index({ category: 1, publishedAt: -1 })

const laoDate = new Intl.DateTimeFormat('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' })

/** Display date in Lao, e.g. "12 ຕຸລາ 2026". */
newsSchema.virtual('date').get(function date() {
  return this.publishedAt ? laoDate.format(this.publishedAt) : ''
})

newsSchema.set('toJSON', { virtuals: true, versionKey: false })
newsSchema.set('toObject', { virtuals: true, versionKey: false })

export const News = mongoose.model('News', newsSchema)
