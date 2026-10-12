export function paging(query = {}) {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 50))
  return { page, limit, skip: (page - 1) * limit }
}
