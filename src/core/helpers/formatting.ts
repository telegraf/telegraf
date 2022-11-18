import { MessageEntity, User } from 'typegram'

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

type TemplateParts = string | TemplateStringsArray | string[]

// eslint-disable-next-line @typescript-eslint/ban-types
type Any = {} | undefined | null

export function _fmt(
  kind: Types.Containers | 'very-plain'
): (parts: TemplateParts, ...items: (Any | FmtString)[]) => FmtString
export function _fmt(
  kind: Types.NonContainers
): (parts: TemplateParts, ...items: Any[]) => FmtString
export function _fmt(
  kind: 'pre',
  opts: { language: string }
): (parts: TemplateParts, ...items: Any[]) => FmtString
export function _fmt(kind: Types.Text | 'very-plain', opts?: object) {
  return function fmt(parts: TemplateParts, ...items: (Any | FmtString)[]) {
    let text = ''
    const entities: MessageEntity[] = []
    parts = typeof parts === 'string' ? [parts] : parts
    for (let i = 0; i < parts.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      text = `${text}${parts[i]!}`

      const item = items[i]
      if (item == null) continue
      if (!(item instanceof FmtString)) {
        // item is some value that's not FmtString
        text = `${text}${item}`
        continue
      }

      // item is FmtString
      for (const child of item.entities || [])
        entities.push({ ...child, offset: text.length + child.offset })
      text = `${text}${item.text}`
    }
    if (kind !== 'very-plain')
      entities.unshift({ type: kind, offset: 0, length: text.length, ...opts })
    return new FmtString(text, entities.length ? entities : undefined)
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
