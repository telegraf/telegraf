import { MessageEntity, User } from 'typegram'

export class FmtString {
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

export namespace Fmts {
  export interface Base {
    type: string
    content: string
    children?: MessageEntity[]
  }

  export interface Text extends Base {
    type: Types.Text
  }

  export interface Url extends Base {
    type: 'text_link'
    url: string
  }

  export interface Mention extends Base {
    type: 'text_mention'
    user: User
  }
}

export type Fmts = Fmts.Text | Fmts.Url | Fmts.Mention

export function fmt(parts: TemplateStringsArray, ...items: Fmts[]) {
  let text = ''
  const entities: MessageEntity[] = []
  for (let i = 0; i < parts.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    text += parts[i]!
    const item = items[i]
    if (!item) continue
    const { type, content } = item
    const offset = text.length
    const length = content.length
    if (type === 'text_link')
      entities.push({ type, offset, length, url: item.url })
    else if (type === 'text_mention')
      entities.push({ type, offset, length, user: item.user })
    else entities.push({ type, offset, length })
    if (item.children)
      for (const child of item.children)
        entities.push({ ...child, offset: child.offset + offset })
    text += item.content
  }
  return new FmtString(text, entities.length ? entities : undefined)
}

interface fmtText {
  (type: Types.NonContainers): (content: string) => Fmts
  (type: Types.Containers): (content: string | FmtString | Fmts) => Fmts
  (type: 'text_link'): (
    content: string | FmtString | Fmts,
    opts: { url: string }
  ) => Fmts
  (type: 'text_mention'): (
    content: string | FmtString | Fmts,
    opts: { user: User }
  ) => Fmts
}

export const fmtText = ((type: Types.Text | 'text_link' | 'text_mention') =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (content: string | FmtString | Fmts, opts: any) => {
    if (typeof content === 'string') return { type, content, ...opts }
    else if (content instanceof FmtString) {
      const { text, entities } = content
      return { type, content: text, children: entities, ...opts }
    } else {
      const fmted = fmt`${content}`
      return { type, content: fmted.text, children: fmted.entities, ...opts }
    }
  }) as fmtText
