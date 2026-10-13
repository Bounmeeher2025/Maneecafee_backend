/**
 * Prepares the database.
 *
 *   npm run seed               # creates the owner account (safe to run anywhere, changes nothing else)
 *   npm run seed -- --samples  # also adds the sample news + farms, only when those collections are empty
 *   npm run seed -- --force    # deletes all news + farms and inserts the sample content again
 *
 * Sample content is never added without --samples or --force, so running the plain seed
 * against the live database can never put placeholder stories on the website.
 * Sample photos in src/seed/images are stored in the database so their URLs work right away.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectDB, disconnectDB } from '../config/db.js'
import { findFile, saveFile } from '../config/storage.js'
import { User, News, Farm } from '../models/index.js'

const force = process.argv.includes('--force')
const samples = force || process.argv.includes('--samples')
const here = path.dirname(fileURLToPath(import.meta.url))

const SEED_USER = { username: 'owner', password: 'maneecaffee123' }

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

/** Stores the seed photos of one kind in the database (skipping ones already there) and returns a url builder. */
async function copyImages(kind) {
  const sourceDir = path.join(here, 'images', kind)
  for (const file of fs.readdirSync(sourceDir)) {
    const contentType = MIME[path.extname(file).toLowerCase()]
    if (!contentType || (await findFile(kind, file))) continue
    await saveFile({ kind, filename: file, contentType, buffer: fs.readFileSync(path.join(sourceDir, file)) })
  }
  return (file) => `/uploads/${kind}/${file}`
}

async function seedUsers() {
  const owner = await User.findOneAndUpdate(
    { username: SEED_USER.username },
    {
      $setOnInsert: {
        name: 'ຜູ້ດູແລລະບົບ',
        role: 'owner',
        roleLabel: 'ຜູ້ດູແລລະບົບ',
        passwordHash: await User.hashPassword(SEED_USER.password),
        active: true,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )
  return owner
}

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

function newsItems(url) {
  return [
    {
      slug: 'homthat-donation',
      featured: true,
      category: 'ບໍລິຈາກໂຮງຮຽນ',
      publishedAt: daysAgo(0),
      title: 'Manee Coffee Roasters ມອບເຄື່ອງສຽງໂທລະໂຄ່ງ ແລະ ອຸປະກອນການຮຽນ-ການຂຽນ ໃຫ້ບ້ານຮົ່ມທາດ',
      summary:
        'Manee Coffee Roasters ໄດ້ຮ່ວມມອບອຸປະກອນເຄື່ອງສຽງໂທລະໂຄ່ງ ໃຫ້ແກ່ບ້ານຮົ່ມທາດ, ເມືອງຮົ່ມ, ແຂວງໄຊສົມບູນ ແລະ ມອບອຸປະກອນການຮຽນ-ການຂຽນ ໃຫ້ແກ່ໂຮງຮຽນປະຖົມສົມບູນຮົ່ມທາດ ແລະ ໂຮງຮຽນມໍຕົ້ນຮົ່ມທາດ ເພື່ອສະໜັບສະໜູນການກະຈາຍຂ່າວສານຂອງບ້ານ ແລະ ການສຶກສາຂອງນ້ອງໆນັກຮຽນ.',
      location: 'ບ້ານຮົ່ມທາດ, ເມືອງຮົ່ມ, ແຂວງໄຊສົມບູນ',
      imageLabel: 'ຮູບພາບຂ່າວເດັ່ນ: ກິດຈະກຳລົງຊຸມຊົນ',
      images: [
        { url: url('news-1-1.jpg'), alt: 'ພິທີມອບເຄື່ອງສຽງໂທລະໂຄ່ງ ໃຫ້ບ້ານຮົ່ມທາດ', position: 'center 40%' },
        { url: url('news-1-2.jpg'), alt: 'ມອບອຸປະກອນການຮຽນ-ການຂຽນ ໃຫ້ໂຮງຮຽນໃນບ້ານຮົ່ມທາດ', position: 'center 30%' },
        { url: url('news-1-3.jpg'), alt: 'ມອບອຸປະກອນການຮຽນ-ການຂຽນ ໃຫ້ໂຮງຮຽນໃນບ້ານຮົ່ມທາດ', position: 'center 30%' },
      ],
      body: [
        '[ຫຍໍ້ໜ້າ 1: ເກີດຫຍັງຂຶ້ນ, ຢູ່ໃສ, ເມື່ອໃດ ແລະ ໃຜມີສ່ວນຮ່ວມ]',
        '[ຫຍໍ້ໜ້າ 2: ລາຍລະອຽດຂອງກິດຈະກຳ ຫຼື ສິ່ງທີ່ມອບໃຫ້]',
        '[ຫຍໍ້ໜ້າ 3: ຜົນທີ່ໄດ້ຮັບ ແລະ ແຜນໃນຕໍ່ໜ້າ]',
      ],
    },
    {
      slug: 'primary-school-donation',
      category: 'ບໍລິຈາກໂຮງຮຽນ',
      publishedAt: daysAgo(1),
      title: '[ຫົວຂໍ້ຂ່າວ: ມອບອຸປະກອນການຮຽນໃຫ້ໂຮງຮຽນປະຖົມບ້ານ...]',
      summary: '[ສະຫຼຸບສັ້ນ: ສິ່ງທີ່ມອບ, ຈຳນວນນັກຮຽນທີ່ໄດ້ຮັບ]',
      imageLabel: 'ຮູບ: ພິທີມອບອຸປະກອນການຮຽນ',
    },
    {
      slug: 'village-support',
      category: 'ຊ່ວຍເຫຼືອຊຸມຊົນ',
      publishedAt: daysAgo(2),
      title: '[ຫົວຂໍ້ຂ່າວ: ລົງຊ່ວຍເຫຼືອຊາວບ້ານ...]',
      summary: '[ສະຫຼຸບສັ້ນ: ບ້ານໃດ, ຊ່ວຍເຫຼືອຫຍັງ]',
      imageLabel: 'ຮູບ: ລົງຢ້ຽມຢາມຊາວບ້ານ',
    },
    {
      slug: 'phuthat-harvest',
      category: 'ຂ່າວສວນ ແລະ ຮ້ານ',
      publishedAt: daysAgo(3),
      title: '[ຫົວຂໍ້ຂ່າວ: ລະດູເກັບກ່ຽວໃໝ່ທີ່ສວນພູທາດ]',
      summary: '[ສະຫຼຸບສັ້ນ: ຜົນຜະລິດ ແລະ ເລື່ອງລາວຈາກສວນ]',
      imageLabel: 'ຮູບ: ການເກັບກ່ຽວທີ່ສວນພູທາດ',
    },
    {
      slug: 'school-repair',
      category: 'ບໍລິຈາກໂຮງຮຽນ',
      publishedAt: daysAgo(4),
      title: '[ຫົວຂໍ້ຂ່າວ: ສະໜັບສະໜູນການສ້ອມແປງໂຮງຮຽນ...]',
      summary: '[ສະຫຼຸບສັ້ນ: ລາຍລະອຽດການບໍລິຈາກ]',
      imageLabel: 'ຮູບ: ນັກຮຽນ ແລະ ຄູອາຈານ',
    },
    {
      slug: 'farmer-training',
      category: 'ຊ່ວຍເຫຼືອຊຸມຊົນ',
      publishedAt: daysAgo(5),
      title: '[ຫົວຂໍ້ຂ່າວ: ຝຶກອົບຮົມການເບິ່ງແຍງສວນກາເຟໃຫ້ຊາວບ້ານ]',
      summary: '[ສະຫຼຸບສັ້ນ: ຫົວຂໍ້ການຝຶກ, ຈຳນວນຜູ້ເຂົ້າຮ່ວມ]',
      imageLabel: 'ຮູບ: ກິດຈະກຳຮ່ວມກັບຊາວສວນ',
    },
    {
      slug: 'new-branch',
      category: 'ຂ່າວສວນ ແລະ ຮ້ານ',
      publishedAt: daysAgo(6),
      title: '[ຫົວຂໍ້ຂ່າວ: ເປີດສາຂາໃໝ່ ຫຼື ເມນູໃໝ່]',
      summary: '[ສະຫຼຸບສັ້ນ: ທີ່ຕັ້ງ, ວັນເປີດ]',
      imageLabel: 'ຮູບ: ສາຂາ ຫຼື ເມນູໃໝ່',
    },
  ]
}

/** Same placeholder shape the website uses for a farm that has no real details yet. */
const placeholderFarm = (n) => ({
  slug: `farm-${n}`,
  sortOrder: n,
  name: `[ຊື່ສວນທີ ${n}]`,
  location: '[ບ້ານ], [ເມືອງ], [ແຂວງ]',
  tagline: 'ບໍ່ມີຝຸ່ນ, ບໍ່ມີສານເຄມີ — ມີພຽງດິນພູທາດ, ສາຍຝົນ, ແສງແດດ ແລະ ຄວາມອົດທົນ ທີ່ລ້ຽງກາເຟທຸກຕົ້ນໃຫ້ເຕີບໃຫຍ່.',
  description: '[ປະຫວັດຫຍໍ້ຂອງສວນ 2–3 ແຖວ: ເລີ່ມປູກຕັ້ງແຕ່ເມື່ອໃດ, ໃຜເປັນຜູ້ດູແລ, ຈຸດເດັ່ນຂອງສວນ]',
  facts: {
    altitude: '[ຄວາມສູງ] ແມັດ',
    variety: '[ສາຍພັນ]',
    process: '[ວິທີປຸງແຕ່ງ]',
    harvest: '[ເດືອນ – ເດືອນ]',
    area: '[...] ເຮັກຕາ',
    caretaker: '[ຊື່ຊາວສວນ]',
  },
  story: {
    title: '[ຫົວຂໍ້ເລື່ອງ ເຊັ່ນ: ສາມລຸ້ນຄົນ ເທິງພູດຽວກັນ]',
    paragraphs: [
      '[ຈຸດເລີ່ມຕົ້ນ: ໃຜເປັນຄົນເລີ່ມປູກ, ປີໃດ, ເປັນຫຍັງຈຶ່ງເລືອກປູກກາເຟທີ່ນີ້]',
      '[ການເຕີບໂຕ: ການປ່ຽນແປງຂອງສວນ, ສິ່ງທ້າທາຍທີ່ຜ່ານມາ]',
      '[ປັດຈຸບັນ: ວິທີດູແລສວນ, ດິນ, ຄວາມສູງ, ອາກາດ ຫຼື ບົດບາດຂອງຄອບຄົວ]',
    ],
  },
  timeline: [
    { year: '[ປີ]', title: 'ເລີ່ມປູກຕົ້ນທຳອິດ', text: '[ລາຍລະອຽດສັ້ນ]' },
    { year: '[ປີ]', title: 'ຂະຫຍາຍພື້ນທີ່ປູກ', text: '[ລາຍລະອຽດສັ້ນ]' },
    { year: '[ປີ]', title: '[ເຫດການສຳຄັນ]', text: '[ລາຍລະອຽດສັ້ນ]' },
    { year: '[ປີ]', title: 'ເລີ່ມຮ່ວມມືກັບ Manee', text: '[ລາຍລະອຽດສັ້ນ]' },
  ],
  quote: {
    image: null,
    text: '[ຄຳເວົ້າຂອງຊາວສວນ ກ່ຽວກັບສວນ ຫຼື ກາເຟຂອງເຂົາເຈົ້າ]',
    author: '[ຊື່ຊາວສວນ]',
    role: '[ບົດບາດ ເຊັ່ນ: ເຈົ້າຂອງສວນລຸ້ນທີ 2]',
  },
  product: {
    roast: '[ລະດັບການຄົ່ວ]',
    notes: ['[ກິ່ນລົດຊາດ 1]', '[ກິ່ນລົດຊາດ 2]', '[ກິ່ນລົດຊາດ 3]'],
    brewing: '[ຄຳແນະນຳວິທີຊົງ: ເອສເປຣສໂຊ, ດຣິບ ຫຼື ກາເຟລາວ]',
    price: '[ລາຄາ] ກີບ / [ນ້ຳໜັກ] ກຣາມ',
    images: [
      { url: '', label: 'ຮູບ: ໝາກກາເຟສຸກ' },
      { url: '', label: 'ຮູບ: ການປຸງແຕ່ງ' },
      { url: '', label: 'ຮູບ: ການຄົ່ວ' },
      { url: '', label: 'ຮູບ: ຖົງກາເຟ' },
    ],
  },
})

function farmItems(url) {
  const base = placeholderFarm(1)
  const phuthat = {
    ...base,
    slug: 'farm-1',
    name: 'ສວນກາເຟພູທາດ',
    location: 'ບ້ານຮົ່ມທາດ, ເມືອງຮົ່ມ, ແຂວງໄຊສົມບູນ',
    description:
      'ເລີ່ມປູກໃນປີ 1995 ຈາກການທົດລອງຂອງໂຄງການ 89554 ແລ້ວຊາວບ້ານຮົ່ມທາດບົວລະບັດຮັກສາສືບຕໍ່ມາ ປັດຈຸບັນມີ ທ່ານ ບູນມີເຮີ່ ເບຼ່ຍຊ້ອງ ເປັນຜູ້ດູແລ. ກາເຟອາຣາບິກາປູກເທິງພູສູງ 1,140 ແມັດ ບໍ່ໃຊ້ຝຸ່ນ ແລະ ສານເຄມີ ແລະ ເລີ່ມຮ່ວມມືກັບ Manee ຕັ້ງແຕ່ປີ 2022.',
    image: { url: url('farm-1-photo-3.jpg'), alt: 'ສວນກາເຟພູທາດ', position: 'center 60%' },
    heroImages: [
      { url: url('farm-1-cherries.jpg'), alt: 'ໝາກກາເຟສຸກສີເຫຼືອງ ທີ່ສວນກາເຟພູທາດ', position: 'center 30%' },
      { url: url('farm-1-photo-2.jpg'), alt: 'ຊາວສວນທ່າມກາງຕົ້ນກາເຟ ທີ່ບ້ານຮົ່ມທາດ', position: 'center 30%' },
    ],
    facts: {
      altitude: '1140 ແມັດ',
      variety: 'Arabica',
      process: 'ປູກແບບທຳມະຊາດ ບໍ່ໃຊ້ຝຸ່ນ ແລະ ສານເຄມີ',
      harvest: 'ພະຈິກ – ກຸມພາ',
      area: '150 ເຮັກຕາ',
      caretaker: 'ທ່ານ ບູນມີເຮີ່ ເບຼ່ຍຊ້ອງ',
    },
    story: {
      title: 'ກາເຟທີ່ປ່ອຍໃຫ້ທຳມະຊາດ ເປັນຜູ້ລ້ຽງ',
      paragraphs: [
        'ເລື່ອງລາວຂອງສວນພູທາດ ເລີ່ມຕົ້ນໃນປີ 1995, ເມື່ອໂຄງການ 89554 ໄດ້ບຸກເບີກເສັ້ນທາງ ຈາກເມືອງຮົ່ມ ໄປຫາເຂດພິເສດໄຊສົມບູນ (ປັດຈຸບັນແມ່ນເມືອງອະນຸວົງ). ລະຫວ່າງທາງ, ໂຄງການໄດ້ເຫັນວ່າເຂດພູທາດເໝາະສົມກັບການປູກກາເຟ ຈຶ່ງໄດ້ທົດລອງປູກກາເຟຂຶ້ນເປັນຄັ້ງທຳອິດ — ເມັດພັນນ້ອຍໆທີ່ຕໍ່ມາກາຍເປັນສວນກາເຟທັງຜືນ.',
        'ຕໍ່ມາ, ຊາວບ້ານໄດ້ນຳເອົາກາເຟໄປປູກຕໍ່ ແລະ ບົວລະບັດຮັກສາດ້ວຍຄວາມເອົາໃຈໃສ່ ຈົນກາຍເປັນສວນກາເຟທີ່ອອກໝາກງາມ. ແຕ່ສິ່ງທ້າທາຍທີ່ສຸດຍັງຄົງຢູ່: ເສັ້ນທາງເຂົ້າເຖິງບໍ່ສະດວກ, ພໍ່ຄ້າບໍ່ສາມາດເຂົ້າມາຮັບຊື້ໄດ້ ແລະ ກາເຟທີ່ດີປານໃດ ກໍຍັງບໍ່ມີຕະຫຼາດ. ຄຸນຄ່າຂອງສວນພູທາດຈຶ່ງຍັງເຊື່ອງຢູ່ເທິງພູ ລໍຖ້າວັນທີ່ຈະມີຄົນໄດ້ຮູ້ຈັກ.',
        'ຢູ່ສວນພູທາດ ບໍ່ມີການໃຊ້ຝຸ່ນ ແລະ ບໍ່ມີສານເຄມີໃດໆເລີຍ. ຕົ້ນກາເຟແຕ່ລະຕົ້ນຕ້ອງຫາອາຫານເອງຈາກດິນພູ, ຢັ່ງຮາກລົງເລິກ ແລະ ຄ່ອຍໆເຕີບໃຫຍ່ຕາມຈັງຫວະຂອງມັນ. ມັນອາດໃຫ້ໝາກໜ້ອຍກວ່າສວນທີ່ເລັ່ງດ້ວຍຝຸ່ນ, ແຕ່ທຸກເມັດທີ່ໄດ້ມາ ຄືລົດຊາດທີ່ແທ້ຈິງຂອງດິນແດນແຫ່ງນີ້ — ບໍລິສຸດ, ຊື່ສັດ ແລະ ບໍ່ມີຫຍັງປິດບັງ.',
        'ສຳລັບສວນພູທາດ, ນີ້ບໍ່ແມ່ນພຽງວິທີປູກກາເຟ ແຕ່ແມ່ນຄຳສັນຍາ: ດິນຜືນນີ້ຕ້ອງຍັງສະອາດ ແລະ ອຸດົມສົມບູນ ເມື່ອເຖິງມືລູກຫຼານ. ແລະ ທຸກຄັ້ງທີ່ທ່ານຈິບກາເຟຈາກສວນພູທາດ, ທ່ານກໍໄດ້ກາຍເປັນສ່ວນໜຶ່ງຂອງຄຳສັນຍານັ້ນ.',
      ],
    },
    timeline: [
      {
        year: '1995',
        title: 'ເລີ່ມປູກຕົ້ນທຳອິດ',
        text: 'ໂຄງການ 89554 ທົດລອງປູກກາເຟເປັນຄັ້ງທຳອິດ ໃນລະຫວ່າງການບຸກເບີກເສັ້ນທາງຈາກເມືອງຮົ່ມ ໄປຫາເຂດພິເສດໄຊສົມບູນ.',
      },
      {
        year: '2000',
        title: 'ຂະຫຍາຍພື້ນທີ່ປູກ',
        text: 'ຊາວບ້ານນຳເອົາກາເຟໄປປູກຕໍ່ ແລະ ບົວລະບັດຮັກສາດ້ວຍຄວາມເອົາໃຈໃສ່ ຈົນກາຍເປັນສວນກາເຟທີ່ອອກໝາກງາມ.',
      },
      {
        year: '2008 – 2021',
        title: 'ບໍ່ມີພໍ່ຄ້າເຂົ້າເຖິງ',
        text: 'ເສັ້ນທາງເຂົ້າເຖິງບໍ່ສະດວກ ພໍ່ຄ້າບໍ່ສາມາດເຂົ້າມາຮັບຊື້ໄດ້ ກາເຟທີ່ດີປານໃດກໍຍັງບໍ່ມີຕະຫຼາດ.',
      },
      {
        year: '2022',
        title: 'ເລີ່ມຮ່ວມມືກັບ Manee',
        text: 'ເລີ່ມຮ່ວມມືກັບບໍລິສັດ Manee Coffee Roasters ນຳກາເຟຈາກສວນພູທາດ ອອກສູ່ຕະຫຼາດເປັນຄັ້ງທຳອິດ.',
      },
    ],
    quote: {
      image: { url: url('farm-1-photo-2.jpg'), alt: 'ທ່ານ ບູນມີເຮີ່ ເບຼ່ຍຊ້ອງ', position: 'center' },
      text: 'ແຕ່ກ່ອນ ພວກເຮົາປູກກາເຟດ້ວຍຄວາມຫວັງ ແຕ່ບໍ່ຮູ້ວ່າຈະຂາຍໃຫ້ໃຜ. ມື້ນີ້ ກາເຟຈາກພູທາດໄດ້ໄປເຖິງຈອກຂອງຄົນໃນເມືອງ — ຄວາມອົດທົນທີ່ພວກເຮົາຮັກສາມາຫຼາຍປີ ບໍ່ໄດ້ສູນເປົ່າ.',
      author: 'ທ່ານ ບູນມີເຮີ່ ເບຼ່ຍຊ້ອງ',
      role: 'ເຈົ້າຂອງສວນ ແລະ ຜູ້ນຳພາຕະຫຼາດເຂົ້າເຖິງສວນກາເຟພູທາດ',
    },
  }
  // ---- farm-2: ຕົວຢ່າງຈາກເມືອງປາກຊ່ອງ (ພູພຽງບໍລະເວນ) ----
  // Example content only: general facts about Paksong coffee. Replace the [placeholders]
  // (area, caretaker, quote author, Manee milestone) and the photos with the real farm's details.
  // Photos: Wikimedia Commons, CC BY-SA — "Coffee Harvest Laos" by Thomas Schoch (CC BY-SA 3.0),
  // "Coffee plantations Bolaven Plateau 03/04" by Christophe95 (CC BY-SA 4.0).
  const paksong = { ...placeholderFarm(2), 
    name: 'ສວນກາເຟປາກຊ່ອງ',
    location: 'ພູພຽງບໍລະເວນ, ເມືອງປາກຊ່ອງ, ແຂວງຈຳປາສັກ',
    tagline: 'ດິນພູໄຟສີແດງ, ອາກາດເຢັນຕະຫຼອດປີ ແລະ ສາຍຝົນຂອງພູພຽງບໍລະເວນ ລ້ຽງກາເຟປາກຊ່ອງໃຫ້ມີລົດຊາດທີ່ເປັນເອກະລັກ.',
    description: 'ປາກຊ່ອງ ແມ່ນເມືອງຫຼວງຂອງກາເຟລາວ ເທິງພູພຽງບໍລະເວນ ສູງປະມານ 1,300 ແມັດ. ກາເຟຖືກປູກທີ່ນີ້ຕັ້ງແຕ່ສະໄໝຝຣັ່ງ ປະມານປີ 1920 ແລະ ມື້ນີ້ຍັງເປັນແຫຼ່ງກາເຟອາຣາບິກາທີ່ມີຊື່ສຽງທີ່ສຸດຂອງລາວ.',
    facts: {
      altitude: '1,300 ແມັດ',
      variety: 'Arabica (Typica, Catimor)',
      process: 'ປູກໃຕ້ຮົ່ມໄມ້ ເທິງດິນພູໄຟ',
      harvest: 'ພະຈິກ – ມັງກອນ',
      area: '[...] ເຮັກຕາ',
      caretaker: '[ຊື່ຊາວສວນ]',
    },
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Coffee_Harvest_Laos.jpg/1920px-Coffee_Harvest_Laos.jpg',
      alt: 'ຊາວສວນເກັບໝາກກາເຟ ເທິງພູພຽງບໍລະເວນ',
      position: 'center 30%',
    },
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Coffee_plantations_Bolaven_Plateau_03.jpg/1920px-Coffee_plantations_Bolaven_Plateau_03.jpg',
        alt: 'ສວນກາເຟໃຕ້ຮົ່ມໄມ້ ເທິງພູພຽງບໍລະເວນ',
        position: 'center',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Coffee_plantations_Bolaven_Plateau_04.jpg/1920px-Coffee_plantations_Bolaven_Plateau_04.jpg',
        alt: 'ໝາກກາເຟອາຣາບິກາ ທີ່ປາກຊ່ອງ',
        position: 'center',
      },
    ],
    story: {
      title: 'ກາເຟຈາກດິນພູໄຟ ຂອງພູພຽງບໍລະເວນ',
      paragraphs: [
        'ພູພຽງບໍລະເວນ ເກີດຈາກລາວາພູໄຟເມື່ອຫຼາຍລ້ານປີກ່ອນ ຈຶ່ງມີດິນສີແດງທີ່ອຸດົມດ້ວຍແຮ່ທາດ. ປະກອບກັບຄວາມສູງປະມານ 1,300 ແມັດ, ອາກາດເຢັນ ແລະ ຝົນຕົກຫຼາຍກວ່າ 3,000 ມິນລີແມັດຕໍ່ປີ ເຮັດໃຫ້ປາກຊ່ອງກາຍເປັນພື້ນທີ່ປູກກາເຟທີ່ດີທີ່ສຸດແຫ່ງໜຶ່ງຂອງລາວ.',
        'ຊາວຝຣັ່ງໄດ້ນຳກາເຟມາປູກທີ່ນີ້ເປັນຄັ້ງທຳອິດ ປະມານປີ 1920 ໂດຍສະເພາະສາຍພັນ Typica ແລະ Bourbon ຕາມເສັ້ນທາງຈາກປາກເຊ ຂຶ້ນສູ່ປາກຊ່ອງ. ຕໍ່ມາໃນຊ່ວງສົງຄາມ ແລະ ການລະບາດຂອງພະຍາດໃບຂີ້ໝ້ຽງ ສວນສ່ວນຫຼາຍໄດ້ຫັນໄປປູກໂຣບັສຕ້າ ແຕ່ຕັ້ງແຕ່ຊຸມປີ 1990 ອາຣາບິກາກໍໄດ້ກັບຄືນມາເປັນຄວາມພູມໃຈຂອງປາກຊ່ອງອີກຄັ້ງ.',
        'ມື້ນີ້ ສວນນ້ອຍຂອງຄອບຄົວຊາວສວນ ຍັງປູກກາເຟໃຕ້ຮົ່ມໄມ້ໃຫຍ່ ເກັບກ່ຽວດ້ວຍມືສະເພາະໝາກທີ່ສຸກແດງ ແລະ ລວມກຸ່ມກັນເປັນສະຫະກອນ ເພື່ອນຳກາເຟປາກຊ່ອງສູ່ຕະຫຼາດທັງໃນ ແລະ ຕ່າງປະເທດ.',
      ],
    },
    timeline: [
      {
        year: '1920',
        title: 'ຝຣັ່ງເລີ່ມປູກກາເຟ',
        text: 'ສວນກາເຟທຳອິດເທິງພູພຽງບໍລະເວນ ຖືກສ້າງຂຶ້ນຕາມເສັ້ນທາງທີ່ຝຣັ່ງສ້າງ ໃກ້ກັບຫຼັກ 42 ເມືອງປາກຊ່ອງ.',
      },
      {
        year: '1950 – 1990',
        title: 'ຫັນໄປປູກໂຣບັສຕ້າ',
        text: 'ສົງຄາມ ແລະ ພະຍາດໃບຂີ້ໝ້ຽງ ເຮັດໃຫ້ອາຣາບິກາຫຼຸດລົງ ຊາວສວນສ່ວນຫຼາຍຫັນໄປປູກໂຣບັສຕ້າທີ່ທົນທານກວ່າ.',
      },
      {
        year: 'ຊຸມປີ 1990',
        title: 'ອາຣາບິກາກັບຄືນມາ',
        text: 'ການສົ່ງເສີມປູກອາຣາບິກາຄືນໃໝ່ ແລະ ການລວມກຸ່ມສະຫະກອນ ເຮັດໃຫ້ກາເຟປາກຊ່ອງກັບມາມີຊື່ສຽງອີກຄັ້ງ.',
      },
      {
        year: '[ປີ]',
        title: 'ເລີ່ມຮ່ວມມືກັບ Manee',
        text: '[ລາຍລະອຽດສັ້ນ]',
      },
    ],
    quote: {
      image: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Coffee_Harvest_Laos.jpg/1920px-Coffee_Harvest_Laos.jpg',
        alt: 'ຊາວສວນເກັບໝາກກາເຟ ເທິງພູພຽງບໍລະເວນ',
        position: 'center 30%',
      },
      text: 'ດິນແດງຂອງບໍລະເວນ ແລະ ອາກາດເຢັນຂອງປາກຊ່ອງ ເຮັດໃຫ້ກາເຟຂອງພວກເຮົາມີລົດຊາດທີ່ບ່ອນອື່ນເຮັດຕາມບໍ່ໄດ້.',
      author: '[ຊື່ຊາວສວນ]',
      role: 'ຊາວສວນກາເຟ ເມືອງປາກຊ່ອງ',
    },
    product: {
      roast: 'ຄົ່ວກາງ',
      notes: ['ຊັອກໂກແລັດ', 'ໝາກໄມ້ສຸກ', 'ກິ່ນດອກໄມ້'],
      brewing: 'ເໝາະກັບດຣິບ ແລະ ເອສເປຣສໂຊ',
      price: '[ລາຄາ] ກີບ / [ນ້ຳໜັກ] ກຣາມ',
      images: [
        {
          url: '',
          label: 'ຮູບ: ໝາກກາເຟສຸກ',
        },
        {
          url: '',
          label: 'ຮູບ: ການປຸງແຕ່ງ',
        },
        {
          url: '',
          label: 'ຮູບ: ການຄົ່ວ',
        },
        {
          url: '',
          label: 'ຮູບ: ຖົງກາເຟ',
        },
      ],
    },
  }
  // ---- farm-3: ຕົວຢ່າງຈາກແຂວງຫຼວງພະບາງ ----
  // Example content only: general facts about coffee in the hills around Luang Prabang. Replace the
  // [placeholders] (area, caretaker, quote author, Manee milestone), confirm the village name and the
  // harvest months, and swap the photos for the real farm's. Photos: Wikimedia Commons —
  // "Nam Ou near Nong Khiaw" by Ekrem Canli (CC BY-SA 4.0), "WalkToBanNa" by Mattun0211 (CC0),
  // "Laos Plateau des Bolovens Plantations (3)" by Pierre André (CC BY-SA 4.0, ripe cherries, Bolaven).
  const luangPrabang = { ...placeholderFarm(3), 
    name: 'ສວນກາເຟຫຼວງພະບາງ',
    location: 'ຜັງສະນີນ, ແຂວງຫຼວງພະບາງ',
    tagline: 'ກາເຟອາຣາບິກາໃຕ້ຮົ່ມປ່າ ເທິງພູສູງຂອງຫຼວງພະບາງ — ລົດຊາດນຸ້ມນວນ, ກົມກ່ອມ ແລະ ມີກິ່ນດອກໄມ້.',
    description: 'ສວນກາເຟຂອງຊາວເຂົາ ເທິງພູສູງປະມານ 1,000 ແມັດ ຮອບເມືອງຫຼວງພະບາງ. ກາເຟອາຣາບິກາຖືກນຳກັບມາປູກຄືນໃໝ່ໃນທ້າຍຊຸມປີ 1990 ເປັນພືດສ້າງລາຍໄດ້ໃຫ້ຊຸມຊົນ ແລະ ປູກໃຕ້ຮົ່ມປ່າທຳມະຊາດ ຈຶ່ງໃຫ້ລົດຊາດນຸ້ມນວນ ມີກິ່ນດອກໄມ້ ແລະ ໝາກໄມ້.',
    facts: {
      altitude: '1,000 ແມັດ',
      variety: 'Arabica (Typica, Catimor)',
      process: 'ປູກໃຕ້ຮົ່ມປ່າ ແບບທຳມະຊາດ',
      harvest: 'ພະຈິກ – ກຸມພາ',
      area: '[...] ເຮັກຕາ',
      caretaker: '[ຊື່ຊາວສວນ]',
    },
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Nam_Ou_near_Nong_Khiaw.jpg/1920px-Nam_Ou_near_Nong_Khiaw.jpg',
      alt: 'ພູເຂົາ ແລະ ແມ່ນ້ຳອູ ແຂວງຫຼວງພະບາງ',
      position: 'center 45%',
    },
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Nam_Ou_near_Nong_Khiaw.jpg/1920px-Nam_Ou_near_Nong_Khiaw.jpg',
        alt: 'ພູເຂົາ ແລະ ແມ່ນ້ຳອູ ແຂວງຫຼວງພະບາງ',
        position: 'center',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Laos_Plateau_des_Bolovens_Plantations_%283%29.jpg/1920px-Laos_Plateau_des_Bolovens_Plantations_%283%29.jpg',
        alt: 'ໝາກກາເຟສຸກແດງ ພ້ອມເກັບກ່ຽວ',
        position: 'center',
      },
    ],
    story: {
      title: 'ກາເຟໃຕ້ຮົ່ມປ່າ ເທິງພູສູງຫຼວງພະບາງ',
      paragraphs: [
        'ກາເຟຖືກນຳມາປູກທີ່ຫຼວງພະບາງເປັນຄັ້ງທຳອິດໃນສະໄໝຝຣັ່ງ ແຕ່ສາຍພັນທີ່ເລືອກໃນຕອນນັ້ນບໍ່ເໝາະກັບພື້ນທີ່ ຈຶ່ງບໍ່ໄດ້ຂະຫຍາຍຕໍ່. ຈົນຮອດທ້າຍຊຸມປີ 1990 ໂຄງການສົ່ງເສີມກະສິກຳຈຶ່ງນຳກາເຟອາຣາບິກາມາແນະນຳໃຫ້ຊາວເຂົາປູກ ເປັນພືດສ້າງລາຍໄດ້ທີ່ຢູ່ຮ່ວມກັບປ່າໄດ້.',
        'ພູສູງ 800–1,200 ແມັດ ຮອບຫຼວງພະບາງ ມີດິນດີ ແລະ ຮົ່ມໄມ້ຕາມທຳມະຊາດ ເໝາະກັບອາຣາບິກາເປັນພິເສດ. ໝາກກາເຟສຸກຊ້າໆໃຕ້ຮົ່ມປ່າ ຈຶ່ງໃຫ້ກາເຟທີ່ມີຄວາມສົ້ມນ້ອຍ ນຸ້ມນວນ ແລະ ມີກິ່ນດອກໄມ້ ແລະ ໝາກໄມ້ອ່ອນໆ.',
        'ມື້ນີ້ ຄອບຄົວຊາວມົ້ງ ແລະ ຊາວກຶມມຸ ຫຼາຍຮ້ອຍຄອບຄົວທົ່ວແຂວງ ປູກກາເຟເປັນລາຍໄດ້ຫຼັກ ໂດຍຮັກສາປ່າໄວ້ເປັນຮົ່ມ ເກັບກ່ຽວດ້ວຍມື ແລະ ສົ່ງໝາກກາເຟສຸກໃຫ້ໂຮງຄົ່ວໃນເມືອງຫຼວງພະບາງ.',
      ],
    },
    timeline: [
      {
        year: 'ສະໄໝຝຣັ່ງ',
        title: 'ທົດລອງປູກຄັ້ງທຳອິດ',
        text: 'ຝຣັ່ງນຳກາເຟມາປູກທີ່ຫຼວງພະບາງ ແຕ່ສາຍພັນບໍ່ເໝາະກັບພື້ນທີ່ ຈຶ່ງບໍ່ໄດ້ຂະຫຍາຍຕໍ່.',
      },
      {
        year: 'ທ້າຍຊຸມປີ 1990',
        title: 'ກາເຟກັບຄືນມາ',
        text: 'ໂຄງການສົ່ງເສີມກະສິກຳ ແນະນຳໃຫ້ຊາວເຂົາປູກອາຣາບິກາໃຕ້ຮົ່ມປ່າ ເປັນພືດສ້າງລາຍໄດ້ແທນໄຮ່ເລື່ອນລອຍ.',
      },
      {
        year: 'ຊຸມປີ 2000',
        title: 'ໂຮງຄົ່ວໃນເມືອງຮັບຊື້',
        text: 'ໂຮງຄົ່ວກາເຟໃນຫຼວງພະບາງ ເລີ່ມຮັບຊື້ໝາກກາເຟສຸກຈາກຊາວເຂົາຫຼາຍຮ້ອຍຄອບຄົວ ແລະ ສົ່ງເສີມການປູກແບບຮັກສາປ່າ.',
      },
      {
        year: '[ປີ]',
        title: 'ເລີ່ມຮ່ວມມືກັບ Manee',
        text: '[ລາຍລະອຽດສັ້ນ]',
      },
    ],
    quote: {
      image: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/WalkToBanNa.JPG/1920px-WalkToBanNa.JPG',
        alt: 'ທົ່ງນາ ແລະ ພູຫີນປູນ ແຂວງຫຼວງພະບາງ',
        position: 'center',
      },
      text: 'ກາເຟເຮັດໃຫ້ພວກເຮົາຮັກສາປ່າໄວ້ໄດ້ ເພາະກາເຟຕ້ອງການຮົ່ມໄມ້ ແລະ ຍັງໃຫ້ລາຍໄດ້ດີກວ່າການຖາງປ່າເຮັດໄຮ່.',
      author: '[ຊື່ຊາວສວນ]',
      role: 'ຊາວສວນກາເຟ ແຂວງຫຼວງພະບາງ',
    },
    product: {
      roast: 'ຄົ່ວອ່ອນ–ກາງ',
      notes: ['ກິ່ນດອກໄມ້', 'ໝາກໄມ້ອ່ອນໆ', 'ຄາຣາເມວ'],
      brewing: 'ເໝາະກັບດຣິບ ແລະ ກາເຟດຳ',
      price: '[ລາຄາ] ກີບ / [ນ້ຳໜັກ] ກຣາມ',
      images: [
        {
          url: '',
          label: 'ຮູບ: ໝາກກາເຟສຸກ',
        },
        {
          url: '',
          label: 'ຮູບ: ການປຸງແຕ່ງ',
        },
        {
          url: '',
          label: 'ຮູບ: ການຄົ່ວ',
        },
        {
          url: '',
          label: 'ຮູບ: ຖົງກາເຟ',
        },
      ],
    },
  }
  return [phuthat, paksong, luangPrabang]
}

async function seedCollection(Model, label, items) {
  if (force) await Model.deleteMany({})
  const existing = await Model.countDocuments()
  if (existing > 0) {
    console.log(`[seed] ${label}: ${existing} already in the database, left untouched (use --force to replace)`)
    return 0
  }
  const docs = await Model.insertMany(items)
  console.log(`[seed] ${label}: inserted ${docs.length}`)
  return docs.length
}

try {
  await connectDB()
  const owner = await seedUsers()
  console.log(`[seed] owner account ready: ${owner.username} (password "${SEED_USER.password}" on first creation)`)

  if (samples) {
    const newsUrl = await copyImages('news')
    const farmUrl = await copyImages('farms')
    await seedCollection(News, 'news', newsItems(newsUrl))
    await seedCollection(Farm, 'farms', farmItems(farmUrl))
  } else {
    console.log('[seed] sample news + farms skipped (add --samples to load them into an empty database)')
  }

  console.log('[seed] done')
} catch (err) {
  console.error('[seed] failed:', err)
  process.exitCode = 1
} finally {
  await disconnectDB()
}
