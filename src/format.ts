import { User } from '@telegraf/types'
import {
  FmtString,
  createFmt,
  linkOrMention,
  join,
} from './core/helpers/formatting'

export { FmtString }

type Nestable<Kind extends string> = string | number | boolean | FmtString<Kind>
type Nesting<Kind extends string> = [
  parts: Nestable<Kind> | readonly Nestable<Kind>[],
  ...items: Nestable<Kind>[],
]
type Nests<Is extends string, Kind extends string> = (
  ...args: Nesting<Kind>
) => FmtString<Is>

const fmt = createFmt()

const bold = createFmt('bold') as Nests<
  'bold',
  'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler'
>

const italic = createFmt('italic') as Nests<
  'italic',
  'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler'
>

const spoiler = createFmt('spoiler') as Nests<
  'spoiler',
  'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler'
>

const strikethrough = createFmt('strikethrough') as Nests<
  'strikethrough',
  'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler'
>

const underline = createFmt('underline') as Nests<
  'underline',
  'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler'
>

const code = createFmt('code') as Nests<'code', never>

const quote = createFmt('blockquote') as Nests<
  'blockquote',
  'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler' | 'code'
>

const pre = (language: string) =>
  createFmt('pre', { language }) as Nests<'pre', never>

const link = (
  content: Nestable<
    'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler' | 'code'
  >,
  url: string
) => linkOrMention(content, { type: 'text_link', url })

const mention = (
  name: Nestable<
    'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler' | 'code'
  >,
  user: number | User
) =>
  typeof user === 'number'
    ? link(name, 'tg://user?id=' + user)
    : linkOrMention(name, { type: 'text_mention', user })

export {
  fmt,
  bold,
  italic,
  spoiler,
  strikethrough,
  underline,
  code,
  quote,
  pre,
  link,
  mention,
  join,
}
