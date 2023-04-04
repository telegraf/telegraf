import { MessageEntity, User } from 'typegram'
import { zip } from '../../util'

export interface FmtString {
  text: string
  entities?: MessageEntity[]
  parse_mode?: undefined
}

export class FmtString implements FmtString {
  constructor(public text: string, entities?: MessageEntity[]) {
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

interface EntityCompare {
  offset: number
  length: number
}

/** get the starting of the entity */
const starts = (e: EntityCompare) => e.offset

/** get the ending of the entity */
const ends = (e: EntityCompare) => e.offset + e.length

const before = (A: EntityCompare, B: EntityCompare) =>
  // B ends before A starts
  ends(B) <= starts(A)

const after = (A: EntityCompare, B: EntityCompare) =>
  // B starts after A ends
  starts(B) >= ends(A)

const inside = (A: EntityCompare, B: EntityCompare) =>
  // B starts with/after A and ends before A
  (starts(B) >= starts(A) && ends(B) < ends(A)) ||
  // B starts after A and ends before/with A
  (starts(B) > starts(A) && ends(B) <= ends(A))

const contains = (A: EntityCompare, B: EntityCompare) =>
  // B starts before/with A and ends with/after A
  starts(B) <= starts(A) && ends(B) >= ends(A)

const endsInside = (A: EntityCompare, B: EntityCompare) =>
  // B starts before A starts, ends after A starts, ends before B ends
  starts(B) < starts(A) && ends(B) > starts(A) && ends(B) < ends(A)

const startsInside = (A: EntityCompare, B: EntityCompare) =>
  // B starts after A, starts before A ends, ends after A
  starts(B) > starts(A) && starts(B) < ends(A) && ends(B) > ends(A)

export const replace = (
  source: string | FmtString,
  search: string | RegExp,
  value: string | FmtString | ((match: string) => string | FmtString)
): FmtString => {
  source = FmtString.normalise(source)

  let text = source.text
  let entities: MessageEntity[] | undefined = source.entities

  function fixEntities(offset: number, length: number, correction: number) {
    const A = { offset, length }

    return (entities || [])
      .map((E) => {
        if (before(A, E)) return E
        if (inside(A, E)) return
        if (after(A, E)) return { ...E, offset: E.offset + correction }
        if (contains(A, E)) return { ...E, length: E.length + correction }
        if (endsInside(A, E))
          return { ...E, length: E.length - (ends(E) - starts(A)) }
        if (startsInside(A, E)) {
          const entityInside = ends(A) - starts(E)
          return {
            ...E,
            offset: E.offset + entityInside + correction,
            length: E.length - entityInside,
          }
        }

        throw new Error(
          'Entity found in an unexpected condition. ' +
            'This is probably a bug in telegraf. ' +
            'You should report this to https://github.com/telegraf/telegraf/issues'
        )
      })
      .filter((x): x is MessageEntity => Boolean(x))
  }

  if (typeof search === 'string') {
    const replace = FmtString.normalise(
      typeof value === 'function' ? value(search) : value
    )
    const offset = text.indexOf(search)
    const length = search.length
    text = text.slice(0, offset) + replace.text + text.slice(offset + length)
    const currentCorrection = replace.text.length - length
    entities = [
      ...fixEntities(offset, length, currentCorrection),
      ...(replace.entities || []).map((E) => ({
        ...E,
        offset: E.offset + offset,
      })),
    ]
  } else {
    let index = 0 // context position in text string
    let acc = '' // incremental return value
    let correction = 0

    let regexArray
    while ((regexArray = search.exec(text))) {
      const match = regexArray[0]
      const offset = regexArray.index
      const length = match.length
      const replace = FmtString.normalise(
        typeof value === 'function' ? value(match) : value
      )
      acc += text.slice(index, offset) + replace.text
      const currentCorrection = replace.text.length - length

      entities = [
        ...fixEntities(offset + correction, length, currentCorrection),
        ...(replace.entities || []).map((E) => ({
          ...E,
          offset: E.offset + offset + correction,
        })),
      ]

      correction += currentCorrection
      index = offset + length
    }

    text = acc + text.slice(index)
  }

  return new FmtString(text, entities)
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
