import { createHash } from 'https://deno.land/std@0.165.0/node/internal/crypto/hash.ts'
import { process } from './process.ts'

export function hash(message: string) {
  return createHash('SHA3-256')
    .update(message)
    .update(process.version) // salt
    .digest('hex')
}
