/**
 * Groups an array of items by a key extracted from each item
 * @param array - The array to group
 * @param keySelector - Function that extracts the key from each item
 * @returns An object where keys are the extracted values and values are arrays of items
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keySelector: (item: T) => K,
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keySelector(item)
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)

      return groups
    },
    {} as Record<K, T[]>,
  )
}
