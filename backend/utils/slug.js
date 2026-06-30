// Shared slugify for category names. Used by admin and public routes so the
// accent/punctuation behavior stays in one place (no public->admin coupling).

/**
 * Derive a URL-safe slug from a category name.
 * Lowercases, replaces spaces with hyphens, strips accents and punctuation,
 * collapses repeated hyphens. Returns '' for non-string input.
 */
function slugify(name) {
  if (typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // drop punctuation except hyphen/space
    .replace(/[\s-]+/g, '-') // spaces and repeated hyphens -> single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

module.exports = { slugify };