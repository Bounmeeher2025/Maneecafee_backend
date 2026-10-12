/**
 * URL slug from free text. Lao titles have no Latin letters, so the result
 * falls back to "<prefix>-<base36 timestamp>" when nothing usable is left.
 */
export function slugify(text = '', fallbackPrefix = 'item') {
  const base = String(text)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return base || `${fallbackPrefix}-${Date.now().toString(36)}`
}

/** Appends -2, -3, ... until no other document of `Model` uses the slug. */
export async function uniqueSlug(Model, base, excludeId) {
  const others = excludeId ? { _id: { $ne: excludeId } } : {}
  let slug = base
  for (let n = 2; await Model.exists({ slug, ...others }); n++) {
    slug = `${base}-${n}`
  }
  return slug
}
