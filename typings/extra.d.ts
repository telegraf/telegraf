/** @format */

import * as tt from './telegram-types.d'

export declare class Extra {
  constructor(opts: object)

  load(opts: object): this

  inReplyTo(messageId: string | number): this

  notifications(value?: boolean): this

  webPreview(value?: boolean): this

  markup(markup: any): tt.ExtraEditMessage & this

  HTML(value?: boolean): this

  markdown(value?: boolean): this

  caption(caption: string): this

  static load(opts: object): Extra

  static inReplyTo(messageId: string | number): Extra

  static notifications(value?: boolean): Extra

  static webPreview(value?: boolean): Extra

  static markup(markup: any): tt.ExtraEditMessage

  static HTML(value?: boolean): Extra

  static markdown(value?: boolean): Extra

  static caption(caption: string): Extra
}
