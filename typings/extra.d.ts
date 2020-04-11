/** @format */

import * as tt from './telegram-types.d'

export declare class Extra {
  constructor(opts: object)

  load(opts: object): Extra

  inReplyTo(messageId: string | number): Extra

  notifications(value?: boolean): Extra

  webPreview(value?: boolean): Extra

  markup(markup: any): tt.ExtraEditMessage

  HTML(value?: boolean): Extra

  markdown(value?: boolean): Extra

  static load(opts: object): Extra

  static inReplyTo(messageId: string | number): Extra

  static notifications(value?: boolean): Extra

  static webPreview(value?: boolean): Extra

  static markup(markup: any): tt.ExtraEditMessage

  static HTML(value?: boolean): Extra

  static markdown(value?: boolean): Extra
}
