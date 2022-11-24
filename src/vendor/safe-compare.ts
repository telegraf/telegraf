/*
  ===
  Adopted from https://github.com/Bruce17/safe-compare
  Copyright Michael Raith. All rights reserved. MIT License.
  ===
*/

/**
 * Do a constant time string comparison. Always compare the complete strings
 * against each other to get a constant time. This method does not short-cut
 * if the two string's length differs.
 */
export function safeCompare(a: string, b: string) {
  let lenA = a.length
  let result = 0
  if (lenA !== b.length) (b = a), (result = 1)
  for (var i = 0; i < lenA; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}
