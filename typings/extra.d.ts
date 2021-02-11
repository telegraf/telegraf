/** @format */

import { Markup } from './markup';
import * as tt from './telegram-types.d'

export declare class Extra {
  constructor(opts: tt.Extra)

  load<T extends tt.Extra>(opts: T): Extra & T | this

  inReplyTo(messageId: string | number): Extra & tt.ExtraReplyMessage | this

  notifications(value?: boolean): Extra & tt.ExtraDisableNotifications | this

  webPreview(value?: boolean): Extra & tt.ExtraDisableWebPagePreview | this

  markup<T extends tt.KeyboardMarkupBundle>(markup: ((m: Markup<tt.KeyboardMarkupBundle>) => T) | T): Extra & tt.ExtraReply<T> | this

  HTML(value?: boolean): Extra & tt.ExtraFormatting | this

  markdown(value?: boolean): Extra & tt.ExtraFormatting | this

  markdownV2(value?: boolean): Extra & tt.ExtraFormatting | this

  caption(caption: string): Extra & tt.ExtraCaption | this

  static load<T extends tt.Extra>(opts: T): Extra & T

  static inReplyTo(messageId: string | number): Extra & tt.ExtraReplyMessage

  static notifications(value?: boolean): Extra & tt.ExtraDisableNotifications

  static webPreview(value?: boolean): Extra & tt.ExtraDisableWebPagePreview

  static markup<T extends tt.KeyboardMarkupBundle>(markup: ((m: Markup<tt.KeyboardMarkupBundle>) => T) | T): Extra & tt.ExtraReply<T>

  static HTML(value?: boolean): Extra & tt.ExtraFormatting

  static markdown(value?: boolean): Extra & tt.ExtraFormatting

  static caption(caption: string): Extra & tt.ExtraCaption
}
