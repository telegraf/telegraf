/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { MessageEntity, User } from '@telegraf/types'
import { Any, zip } from './util'

export type Nestable<Kind extends string> =
  | string
  | number
  | boolean
  | FmtString<Kind>
export type MaybeNestableList<Kind extends string> =
  | Nestable<Kind>
  | readonly Nestable<Kind>[]

export interface FmtString<Brand extends string> {
  text: string
  entities?: MessageEntity[]
  parse_mode?: undefined
  __to_nest: Brand
}

export class FmtString<Brand extends string = string>
  implements FmtString<Brand>
{
  constructor(
    public text: string,
    entities?: MessageEntity[]
  ) {
    if (entities) {
      this.entities = entities
      // force parse_mode to undefined if entities are present
      this.parse_mode = undefined
    }
  }
  static normalise(content: Nestable<string>) {
    if (content instanceof FmtString) return content
    return new FmtString(String(content))
  }
}

const isArray: <T>(xs: T | readonly T[]) => xs is readonly T[] = Array.isArray

/** Given a base FmtString and something to append to it, mutates the base */
const _add = (base: FmtString, next: FmtString | Any) => {
  const len = base.text.length
  if (next instanceof FmtString) {
    base.text = `${base.text}${next.text}`
    // next.entities could be undefined and condition will fail
    for (let i = 0; i < (next.entities?.length || 0); i++) {
      // because of the above condition, next.entities[i] cannot be undefined
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entity = next.entities![i]!
      // base.entities is ensured by caller
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      base.entities!.push({ ...entity, offset: entity.offset + len })
    }
  } else base.text = `${base.text}${next}`
}

/**
 * Given an `Iterable<FmtString | string | Any>` and a separator, flattens the list into a single FmtString.
 * Analogous to Array#join -> string, but for FmtString
 */
export const join = (
  fragments: Iterable<FmtString | string | Any>,
  separator?: string | FmtString
) => {
  const result = new FmtString('')
  // ensure entities array so loop doesn't need to check
  result.entities = []

  const iter = fragments[Symbol.iterator]()

  let curr = iter.next()
  while (!curr.done) {
    _add(result, curr.value)
    curr = iter.next()
    if (separator && !curr.done) _add(result, separator)
  }

  // set parse_mode: undefined if entities are present
  if (result.entities.length) result.parse_mode = undefined
  // remove entities array if not relevant
  else delete result.entities

  return result
}

/** Internal constructor for all fmt helpers */
export function createFmt(kind?: MessageEntity['type'], opts?: object) {
  return function fmt(
    parts: MaybeNestableList<string>,
    ...items: Nestable<string>[]
  ) {
    parts = isArray(parts) ? parts : [parts]
    const result = join(zip(parts, items))
    if (kind) {
      result.entities ??= []
      result.entities.unshift({
        type: kind,
        offset: 0,
        length: result.text.length,
        ...opts,
      } as MessageEntity)
      result.parse_mode = undefined
    }
    return result
  }
}

export const linkOrMention = (
  content: Nestable<string>,
  data:
    | { type: 'text_link'; url: string }
    | { type: 'text_mention'; user: User }
) => {
  const { text, entities = [] } = FmtString.normalise(content)
  entities.unshift(Object.assign(data, { offset: 0, length: text.length }))
  return new FmtString(text, entities)
}
