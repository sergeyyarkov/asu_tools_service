/**
 * @param {unknown} date
 * @returns {boolean is Date}
 */
export function isDateValid(date) {
  return date instanceof Date && !Number.isNaN(date.valueOf());
}
