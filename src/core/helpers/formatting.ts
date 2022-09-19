import { MessageEntity, User } from 'typegram'

export class FmtString {
  // to force parse_mode to become undefined when using FmtString
  public parse_mode: undefined
  constructor(public text: string, public entities?: MessageEntity[]) {}
  static normalise(content: string | FmtString) {
    if (typeof content === 'string') return new FmtString(content, [])
    return content
  }
  toString() {
    return this.text
  }
}

export namespace Types {
  // prettier-ignore
  export type Containers = 'bold' | 'italic' | 'spoiler' | 'strikethrough' | 'underline'
  export type NonContainers = 'code' | 'pre'
  export type Text = Containers | NonContainers
}

type TemplateParts = string | TemplateStringsArray | string[]

export function _fmt(
  kind: Types.Containers | 'very-plain'
): (parts: TemplateParts, ...items: (string | FmtString)[]) => FmtString
export function _fmt(
  kind: Types.NonContainers
): (parts: TemplateParts, ...items: string[]) => FmtString
export function _fmt(kind: Types.Text | 'very-plain') {
  return function fmt(parts: TemplateParts, ...items: (string | FmtString)[]) {
    let text = ''
    const entities: MessageEntity[] = []
    parts = typeof parts === 'string' ? [parts] : parts
    for (let i = 0; i < parts.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      text += parts[i]!
      const item = items[i]
      if (!item) continue
      if (typeof item === 'string') {
        text += item
        continue
      }
      for (const child of item.entities || [])
        entities.push({ ...child, offset: text.length + child.offset })
      text += item.text
    }
    if (kind !== 'very-plain')
      entities.unshift({ type: kind, offset: 0, length: text.length })
    return new FmtString(text, entities.length ? entities : undefined)
  }
}

const entityOffset =
  (length: number) =>
  (entity: MessageEntity): MessageEntity =>
    Object.assign(entity, { offset: length + entity.offset })

export const linkOrMention = (
  content: string | FmtString,
  data:
    | { type: 'text_link'; url: string }
    | { type: 'text_mention'; user: User }
) => {
  const text = content.toString()
  const length = text.length
  const elems = FmtString.normalise(content).entities || []
  const entities = elems.map(entityOffset(length))
  // insert to start of array
  entities.unshift(Object.assign(data, { offset: 0, length }))
  return new FmtString(text, entities)
}
