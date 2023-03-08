import { User } from 'typegram'
import { FmtString, _fmt, linkOrMention, join } from './core/helpers/formatting'

export { FmtString }

const fmt = _fmt()
const bold = _fmt('bold')
const italic = _fmt('italic')
const spoiler = _fmt('spoiler')
const strikethrough = _fmt('strikethrough')
const underline = _fmt('underline')
const code = _fmt('code')
const pre = (language: string) => _fmt('pre', { language })

const link = (content: string | FmtString, url: string) =>
  linkOrMention(content, { type: 'text_link', url })

const mention = (name: string | FmtString, user: number | User) =>
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
  pre,
  link,
  mention,
  join,
}
