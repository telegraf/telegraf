import { User } from 'typegram'
import { type Fmts, FmtString, fmtText, fmt } from './core/helpers/formatting'

export { fmt, FmtString, Fmts }

export const bold = fmtText('bold')
export const italic = fmtText('italic')
export const spoiler = fmtText('spoiler')
export const strikethrough = fmtText('strikethrough')
export const underline = fmtText('underline')
export const code = fmtText('code')
export const pre = fmtText('pre')
export const link = (content: string | FmtString | Fmts, url: string) =>
  fmtText('text_link')(content, { url })
export const mention = (name: string | FmtString | Fmts, user: number | User) =>
  typeof user === 'number'
    ? link(name, 'tg://user?id=' + user)
    : fmtText('text_mention')(name, { user })
