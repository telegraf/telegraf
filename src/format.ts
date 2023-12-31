import { User } from '@telegraf/types'
import {
  FmtString,
  createFmt,
  linkOrMention,
  join as _join,
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

// Nests<A, B> means the function will return A, and it can nest B
// Nests<'fmt', string> means it will nest anything
// Nests<'code', never> means it will not nest anything

// Allowing everything to nest 'fmt' is a necessary evil; it allows to indirectly nest illegal entities
// Except for 'code' and 'pre', which don't nest anything anyway, so they only deal with strings

export const join = _join as Nests<'fmt', string>

export const fmt = createFmt() as Nests<'fmt', string>

export const bold = createFmt('bold') as Nests<
  'bold',
  'fmt' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler'
>

export const italic = createFmt('italic') as Nests<
  'italic',
  'fmt' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler'
>

export const spoiler = createFmt('spoiler') as Nests<
  'spoiler',
  'fmt' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler'
>

export const strikethrough =
  //
  createFmt('strikethrough') as Nests<
    'strikethrough',
    'fmt' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler'
  >

export const underline =
  //
  createFmt('underline') as Nests<
    'underline',
    'fmt' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler'
  >

export const quote =
  //
  createFmt('blockquote') as Nests<
    'blockquote',
    | 'fmt'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'spoiler'
    | 'code'
  >

export const code = createFmt('code') as Nests<'code', never>

export const pre = (language: string) =>
  createFmt('pre', { language }) as Nests<'pre', never>

export const link = (
  content: Nestable<
    | 'fmt'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'spoiler'
    | 'code'
  >,
  url: string
) =>
  //
  linkOrMention(content, { type: 'text_link', url }) as FmtString<'text_link'>

export const mention = (
  name: Nestable<
    | 'fmt'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'spoiler'
    | 'code'
  >,
  user: number | User
) =>
  typeof user === 'number'
    ? link(name, 'tg://user?id=' + user)
    : (linkOrMention(name, {
        type: 'text_mention',
        user,
      }) as FmtString<'text_mention'>)
