/**
 * Lao -> English machine translation for the dashboard's "translate" button.
 *
 * Provider order:
 *  1. Google Cloud Translation API (official, reliable) when GOOGLE_TRANSLATE_API_KEY is set
 *     (free up to 500,000 characters a month, see https://cloud.google.com/translate/pricing)
 *  2. Google's keyless endpoints (dictionary extension endpoint, then the web endpoint), best effort
 *
 * Results are machine drafts: the dashboard shows them in editable fields for a person to check.
 */
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const decodeEntities = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

async function viaCloudApi(texts, from, to) {
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(env.googleTranslateKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, source: from, target: to, format: 'text' }),
  })
  if (!res.ok) throw new Error(`Google Translation API ${res.status}`)
  const data = await res.json()
  return data.data.translations.map((t) => decodeEntities(t.translatedText))
}

/** Google's dictionary-extension endpoint: several texts per request, returns an array of strings. */
async function viaDictEndpoint(texts, from, to) {
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${from}&tl=${to}&${texts.map((t) => `q=${encodeURIComponent(t)}`).join('&')}`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json, text/plain, */*', 'Accept-Language': 'en-US,en;q=0.9' } })
  if (!res.ok) throw new Error(`dict endpoint ${res.status}`)
  const data = await res.json()
  const list = Array.isArray(data) ? data : [data]
  // each entry is either a string or [translation, detectedLanguage]
  const out = list.map((entry) => (Array.isArray(entry) ? entry[0] : entry)).map((t) => String(t ?? ''))
  if (out.length !== texts.length) throw new Error('dict endpoint returned an unexpected shape')
  return out
}

/** Google's web endpoint: one text per request. */
async function viaWebEndpoint(text, from, to) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json, text/plain, */*' } })
  if (!res.ok) throw new Error(`web endpoint ${res.status}`)
  const data = await res.json()
  return (data[0] ?? []).map((seg) => seg[0] ?? '').join('')
}

async function viaKeyless(texts, from, to) {
  try {
    return await viaDictEndpoint(texts, from, to)
  } catch (first) {
    try {
      const out = []
      for (const t of texts) out.push(await viaWebEndpoint(t, from, to))
      return out
    } catch (second) {
      throw new Error(`${first.message}; ${second.message}`)
    }
  }
}

/** Translates every string in `texts` (empty strings stay empty). */
export async function translateTexts(texts, { from = 'lo', to = 'en' } = {}) {
  const todo = texts.map((t, i) => ({ i, t: String(t ?? '').trim() })).filter((x) => x.t)
  const out = texts.map(() => '')
  if (todo.length === 0) return out
  try {
    const sources = todo.map((x) => x.t)
    const translated = env.googleTranslateKey ? await viaCloudApi(sources, from, to) : await viaKeyless(sources, from, to)
    todo.forEach((x, k) => (out[x.i] = translated[k]))
  } catch (err) {
    throw new ApiError(502, `ແປບໍ່ສຳເລັດ (${err.message}) ກະລຸນາລອງໃໝ່ ຫຼື ພິມພາສາອັງກິດເອງ`)
  }
  return out
}
