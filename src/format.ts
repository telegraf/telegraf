import { User } from 'typegram'
import { FmtString, _fmt, linkOrMention } from './core/helpers/formatting'

export { FmtString }

export const fmt = _fmt('very-plain')
export const bold = _fmt('bold')
export const italic = _fmt('italic')
export const spoiler = _fmt('spoiler')
export const strikethrough = _fmt('strikethrough')
export const underline = _fmt('underline')
export const code = _fmt('code')
export const pre = (language: string) => _fmt('pre', { language })

export const link = (content: string | FmtString, url: string) =>
  linkOrMention(content, { type: 'text_link', url })

export const mention = (name: string | FmtString, user: number | User) =>
  typeof user === 'number'
    ? link(name, 'tg://user?id=' + user)
    : linkOrMention(name, { type: 'text_mention', user })
