import Markup from './markup'
import { Message } from 'telegram-typings'

interface CaptionedExtra extends Omit<Extra, 'caption'> {
  caption: string
}

class Extra {
  reply_to_message_id: number | undefined
  disable_notification: boolean | undefined
  disable_web_page_preview: boolean | undefined
  reply_markup: Markup | undefined
  parse_mode: string | undefined
  static Markup: typeof Markup
  constructor(opts?: { [key: string]: unknown }) {
    this.load(opts)
  }

  load(opts = {}) {
    return Object.assign(this, opts)
  }

  inReplyTo(messageId: Message['message_id']) {
    this.reply_to_message_id = messageId
    return this
  }

  notifications(value = true) {
    this.disable_notification = !value
    return this
  }

  webPreview(value = true) {
    this.disable_web_page_preview = !value
    return this
  }

  markup(markup: Markup | ((m: Markup) => Markup)) {
    if (typeof markup === 'function') {
      markup = markup(new Markup())
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    this.reply_markup = { ...markup } as Markup
    return this
  }

  HTML(value = true) {
    this.parse_mode = value ? 'HTML' : undefined
    return this
  }

  markdown(value = true) {
    this.parse_mode = value ? 'Markdown' : undefined
    return this
  }

  caption(caption: string): CaptionedExtra {
    const me = (this as unknown) as CaptionedExtra
    me.caption = caption
    return me
  }

  static inReplyTo(messageId: number) {
    return new Extra().inReplyTo(messageId)
  }

  static notifications(value: boolean | undefined) {
    return new Extra().notifications(value)
  }

  static webPreview(value: boolean | undefined) {
    return new Extra().webPreview(value)
  }

  static load(opts: { [key: string]: unknown } | undefined) {
    return new Extra(opts)
  }

  static markup(markup: Markup | ((m: Markup) => Markup)) {
    return new Extra().markup(markup)
  }

  static HTML(value: boolean | undefined) {
    return new Extra().HTML(value)
  }

  static markdown(value: boolean | undefined) {
    return new Extra().markdown(value)
  }

  static caption(caption: string) {
    return new Extra().caption(caption)
  }
}

Extra.Markup = Markup

export = Extra