// Shows names the same way no matter how they were typed: "LYKA ENTERA" and "lyka entera" -> "Lyka Entera".
// Only changes how the name looks on screen; the saved name stays as the user typed it.
export function formatName(...parts) {
  return parts
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, (_, before, letter) => before + letter.toUpperCase())
}
