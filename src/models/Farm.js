import mongoose from 'mongoose'

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: 'center' },
  },
  { _id: false },
)

const timelineSchema = new mongoose.Schema(
  {
    year: { type: String, trim: true, default: '' },
    title: { type: String, trim: true, default: '' },
    text: { type: String, trim: true, default: '' },
  },
  { _id: false },
)

const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '' },
    label: { type: String, trim: true, default: '' },
  },
  { _id: false },
)

// One document per coffee farm: feeds both the card on the home page and the farm's history page.
const farmSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: '' },
    tagline: { type: String, trim: true, default: '' },
    image: { type: photoSchema, default: null }, // card photo on the home page
    heroImages: { type: [photoSchema], default: [] }, // one or two large photos at the top of the history page
    description: { type: String, trim: true, default: '' },
    facts: {
      altitude: { type: String, trim: true, default: '' },
      variety: { type: String, trim: true, default: '' },
      process: { type: String, trim: true, default: '' },
      harvest: { type: String, trim: true, default: '' },
      area: { type: String, trim: true, default: '' },
      caretaker: { type: String, trim: true, default: '' },
    },
    story: {
      title: { type: String, trim: true, default: '' },
      paragraphs: { type: [String], default: [] },
    },
    timeline: { type: [timelineSchema], default: [] },
    quote: {
      image: { type: photoSchema, default: null },
      text: { type: String, trim: true, default: '' },
      author: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
    product: {
      roast: { type: String, trim: true, default: '' },
      notes: { type: [String], default: [] },
      brewing: { type: String, trim: true, default: '' },
      price: { type: String, trim: true, default: '' },
      images: { type: [productImageSchema], default: [] },
    },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
)

farmSchema.index({ published: 1, sortOrder: 1 })

/** Chips on the home-page card: altitude, variety and process. */
farmSchema.virtual('tags').get(function tags() {
  const f = this.facts ?? {}
  return [f.altitude, f.variety, f.process].filter(Boolean)
})

farmSchema.set('toJSON', { virtuals: true, versionKey: false })
farmSchema.set('toObject', { virtuals: true, versionKey: false })

export const Farm = mongoose.model('Farm', farmSchema)
