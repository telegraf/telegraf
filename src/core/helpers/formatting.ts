/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { MessageEntity, User } from '@telegraf/types'
import { zip } from './util'

export interface FmtString {
  text: string
  entities?: MessageEntity[]
  parse_mode?: undefined
}

export class FmtString implements FmtString {
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
  static normalise(content: string | FmtString) {
    if (typeof content === 'string') return new FmtString(content)
    return content
  }
}

export namespace Types {
  // prettier-ignore
  export type Containers = 'bold' | 'italic' | 'spoiler' | 'strikethrough' | 'underline'
  export type NonContainers = 'code' | 'pre'
  export type Text = Containers | NonContainers
}

type TemplateParts = string | FmtString | readonly (FmtString | string)[]

// eslint-disable-next-line @typescript-eslint/ban-types
type Any = {} | undefined | null

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
export function _fmt(
  kind?: Types.Containers
): (parts: TemplateParts, ...items: (Any | FmtString)[]) => FmtString
export function _fmt(
  kind: Types.NonContainers
): (parts: TemplateParts, ...items: Any[]) => FmtString
export function _fmt(
  kind: 'pre',
  opts: { language: string }
): (parts: TemplateParts, ...items: Any[]) => FmtString
export function _fmt(kind: Types.Text | undefined, opts?: object) {
  return function fmt(parts: TemplateParts, ...items: (Any | FmtString)[]) {
    parts = isArray(parts) ? parts : [parts]
    const result = join(zip(parts, items))
    if (kind) {
      result.entities ??= []
      result.entities.unshift({
        type: kind,
        offset: 0,
        length: result.text.length,
        ...opts,
      })
      result.parse_mode = undefined
    }
    return result
  }
}

export const linkOrMention = (
  content: string | FmtString,
  data:
    | { type: 'text_link'; url: string }
    | { type: 'text_mention'; user: User }
) => {
  const { text, entities = [] } = FmtString.normalise(content)
  entities.unshift(Object.assign(data, { offset: 0, length: text.length }))
  return new FmtString(text, entities)
}
